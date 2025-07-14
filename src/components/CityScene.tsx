'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { 
  Environment, 
  PerspectiveCamera, 
  OrbitControls,
  Stats,
  Sky
} from '@react-three/drei'
import OptimizedPostProcessing, { PostProcessingDebug } from './OptimizedPostProcessing'
import OptimizedAtmosphericEffects from './OptimizedAtmosphericEffects'
import CinematicLighting from './CinematicLighting'
import VancouverCity from './city/VancouverCity'
import CinematicCamera from './city/CinematicCamera'
import DynamicLighting from './city/DynamicLighting'

interface PostProcessingSettings {
  enabled: boolean
  quality: 'low' | 'medium' | 'high' | 'ultra'
  // Legacy support for existing controls
  ssao?: boolean
  depthOfField?: boolean
  bloom?: boolean
  chromaticAberration?: boolean
  vignette?: boolean
  colorGrading?: boolean
}

interface CitySceneProps {
  postProcessingSettings?: PostProcessingSettings
}

export default function CityScene({ 
  postProcessingSettings = {
    enabled: true,
    quality: 'high'
  } 
}: CitySceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isClient, setIsClient] = useState(false)
  const [performanceMode, setPerformanceMode] = useState(false)
  const [currentFPS, setCurrentFPS] = useState(60)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Enhanced performance monitoring with adaptive quality
    if (typeof window !== 'undefined') {
      let frames = 0
      let lastTime = performance.now()
      let fpsHistory: number[] = []
      
      const updateStats = () => {
        frames++
        const currentTime = performance.now()
        
        if (currentTime >= lastTime + 1000) {
          const fps = Math.round((frames * 1000) / (currentTime - lastTime))
          setCurrentFPS(fps)
          
          // Track FPS history for performance mode detection
          fpsHistory.push(fps)
          if (fpsHistory.length > 5) fpsHistory.shift() // Keep last 5 seconds
          
          // Calculate average FPS
          const avgFPS = fpsHistory.reduce((sum, f) => sum + f, 0) / fpsHistory.length
          
          // Enable performance mode if FPS consistently below 40
          const shouldEnablePerformanceMode = avgFPS < 40 && fpsHistory.length >= 3
          setPerformanceMode(shouldEnablePerformanceMode)
          
          // Update development UI
          if (process.env.NODE_ENV === 'development') {
            const fpsElement = document.getElementById('fps-counter')
            if (fpsElement) {
              fpsElement.textContent = fps.toString()
              fpsElement.style.color = fps < 30 ? 'red' : fps < 45 ? 'orange' : 'green'
            }
            
            const perfModeElement = document.getElementById('performance-mode')
            if (perfModeElement) {
              perfModeElement.textContent = shouldEnablePerformanceMode ? 'ON' : 'OFF'
              perfModeElement.style.color = shouldEnablePerformanceMode ? 'red' : 'green'
            }
          }
          
          frames = 0
          lastTime = currentTime
        }
        
        requestAnimationFrame(updateStats)
      }
      
      updateStats()
    }
  }, [])

  // Don't render on server side
  if (!isClient) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Initializing 3D Engine...</div>
      </div>
    )
  }

  return (
    <Canvas
      ref={canvasRef}
      className="three-canvas"
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        display: 'block'
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      camera={{
        fov: 60,
        near: 1,
        far: 15000,
        position: [800, 400, 800]
      }}
      onCreated={({ gl, scene, camera }) => {
        // Configure renderer for better performance and quality
        gl.setClearColor('#000011')
        gl.shadowMap.enabled = true
        gl.shadowMap.type = 2 // PCFSoftShadowMap
        gl.toneMapping = 1 // ACESFilmicToneMapping
        gl.toneMappingExposure = 1.2
        
        // Set up scene
        scene.fog = new THREE.FogExp2(0x000011, 0.0001)
      }}
    >
      {/* Cinematic Lighting System - HDR, cascaded shadows, area lights */}
      <Suspense fallback={null}>
        <CinematicLighting 
          enabled={postProcessingSettings.enabled}
          quality={postProcessingSettings.quality}
        />
      </Suspense>
      
      {/* Legacy Dynamic Lighting (fallback) */}
      <Suspense fallback={null}>
        <DynamicLighting />
      </Suspense>
      
      {/* Sky */}
      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.6}
        azimuth={0.25}
        rayleigh={0.5}
        turbidity={10}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Camera Controls */}
      <Suspense fallback={null}>
        <CinematicCamera />
      </Suspense>

      {/* Main City */}
      <Suspense fallback={null}>
        <VancouverCity />
      </Suspense>

      {/* Optimized Atmospheric Effects - Reduced particles, simplified shaders */}
      <Suspense fallback={null}>
        <OptimizedAtmosphericEffects 
          enabled={postProcessingSettings.enabled}
          intensity={postProcessingSettings.quality === 'ultra' ? 1.2 : 
                    postProcessingSettings.quality === 'high' ? 1.0 : 
                    postProcessingSettings.quality === 'medium' ? 0.7 : 0.5}
          performanceMode={performanceMode}
        />
      </Suspense>

      {/* Environment */}
      <Environment preset="city" background={false} />

      {/* Optimized Post-processing Pipeline - Adaptive quality, reduced SSAO */}
      <OptimizedPostProcessing 
        enabled={postProcessingSettings.enabled}
        quality={postProcessingSettings.quality}
        adaptiveQuality={true}
      />
      
      {/* Performance debugging */}
      {process.env.NODE_ENV === 'development' && <PostProcessingDebug />}

      {/* Development Stats */}
      {process.env.NODE_ENV === 'development' && <Stats />}
    </Canvas>
  )
}
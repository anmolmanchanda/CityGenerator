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
import { 
  EffectComposer, 
  Bloom, 
  ToneMapping, 
  Vignette, 
  DepthOfField,
  ChromaticAberration,
  ColorAverage,
  SSAO,
  Outline
} from '@react-three/postprocessing'
import { ToneMappingMode, BlendFunction } from 'postprocessing'
import VancouverCity from './city/VancouverCity'
import CinematicCamera from './city/CinematicCamera'
import DynamicLighting from './city/DynamicLighting'

interface PostProcessingSettings {
  ssao: boolean
  depthOfField: boolean
  bloom: boolean
  chromaticAberration: boolean
  vignette: boolean
  colorGrading: boolean
}

interface CitySceneProps {
  postProcessingSettings?: PostProcessingSettings
}

export default function CityScene({ 
  postProcessingSettings = {
    ssao: true,
    depthOfField: true,
    bloom: true,
    chromaticAberration: true,
    vignette: true,
    colorGrading: true
  } 
}: CitySceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Performance monitoring
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      let frames = 0
      let lastTime = performance.now()
      
      const updateStats = () => {
        frames++
        const currentTime = performance.now()
        
        if (currentTime >= lastTime + 1000) {
          const fps = Math.round((frames * 1000) / (currentTime - lastTime))
          const fpsElement = document.getElementById('fps-counter')
          if (fpsElement) fpsElement.textContent = fps.toString()
          
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
      {/* Dynamic Lighting System */}
      <Suspense fallback={null}>
        <DynamicLighting />
      </Suspense>
      
      {/* Enhanced ambient light for better building visibility */}
      <ambientLight intensity={0.4} color="#6080a0" />
      
      {/* Additional fill light for better building definition */}
      <hemisphereLight
        args={["#87CEEB", "#404060", 0.3]}
      />
      
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

      {/* Environment */}
      <Environment preset="city" background={false} />

      {/* Post-processing Effects */}
      <EffectComposer multisampling={2} enableNormalPass>
        <>
          {/* Screen Space Ambient Occlusion for depth - reduced quality for better performance */}
          {postProcessingSettings.ssao && (
            <SSAO
              samples={8}
              radius={0.08}
              intensity={0.8}
              bias={0.025}
              blendFunction={BlendFunction.MULTIPLY}
            />
          )}
          
          {/* Depth of Field for cinematic focus */}
          {postProcessingSettings.depthOfField && (
            <DepthOfField
              focusDistance={0.02}
              focalLength={0.05}
              bokehScale={2}
              height={400}
            />
          )}
          
          {/* Enhanced Bloom for glowing lights - reduced quality for better performance */}
          {postProcessingSettings.bloom && (
            <Bloom 
              intensity={1.0} 
              luminanceThreshold={0.9} 
              luminanceSmoothing={0.3}
              height={200}
            />
          )}
          
          {/* Subtle Chromatic Aberration for lens effect */}
          {postProcessingSettings.chromaticAberration && (
            <ChromaticAberration
              offset={[0.0015, 0.0015]}
            />
          )}
          
          {/* Cinematic Tone Mapping - always enabled for proper exposure */}
          <ToneMapping 
            mode={ToneMappingMode.ACES_FILMIC}
          />
          
          {/* Subtle Vignette */}
          {postProcessingSettings.vignette && (
            <Vignette 
              offset={0.3} 
              darkness={0.4}
            />
          )}
          
          {/* Color grading for cinematic look */}
          {postProcessingSettings.colorGrading && (
            <ColorAverage
              blendFunction={BlendFunction.OVERLAY}
            />
          )}
        </>
      </EffectComposer>

      {/* Development Stats */}
      {process.env.NODE_ENV === 'development' && <Stats />}
    </Canvas>
  )
}
'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAppStore } from '@/lib/store'
import * as THREE from 'three'
import { getSunPosition, interpolateColors } from '@/utils'

interface CinematicLightingProps {
  enabled?: boolean
  quality?: 'low' | 'medium' | 'high' | 'ultra'
}

// HDR Environment mapping with real Vancouver sky
function HDREnvironment() {
  const { scene } = useThree()
  const { timeOfDay, weatherCondition } = useAppStore()
  
  useEffect(() => {
    // Create HDR-like environment mapping using multiple gradient stops
    const createSkyTexture = (timeOfDay: number, weather: string) => {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 256
      const ctx = canvas.getContext('2d')!
      
      // Create gradient based on time of day
      const gradient = ctx.createLinearGradient(0, 0, 0, 256)
      
      if (timeOfDay >= 5.5 && timeOfDay <= 7) {
        // Golden hour morning
        gradient.addColorStop(0, '#FFB366') // Warm orange top
        gradient.addColorStop(0.3, '#FF8C42') // Orange middle
        gradient.addColorStop(0.7, '#FF6B6B') // Pink-orange
        gradient.addColorStop(1, '#4ECDC4') // Cyan horizon
      } else if (timeOfDay >= 6 && timeOfDay <= 18) {
        // Daytime
        gradient.addColorStop(0, '#87CEEB') // Sky blue top
        gradient.addColorStop(0.4, '#B0E0E6') // Powder blue
        gradient.addColorStop(0.8, '#F0F8FF') // Alice blue
        gradient.addColorStop(1, '#FFFACD') // Lemon chiffon horizon
      } else if (timeOfDay >= 17 && timeOfDay <= 19) {
        // Golden hour evening
        gradient.addColorStop(0, '#FF6B6B') // Pink-red top
        gradient.addColorStop(0.3, '#FF8E53') // Orange
        gradient.addColorStop(0.7, '#FF6B35') // Red-orange
        gradient.addColorStop(1, '#F7931E') // Golden horizon
      } else if (timeOfDay >= 19 && timeOfDay <= 20.5) {
        // Blue hour
        gradient.addColorStop(0, '#2C3E50') // Dark blue top
        gradient.addColorStop(0.4, '#34495E') // Slate gray
        gradient.addColorStop(0.8, '#E74C3C') // Red horizon
        gradient.addColorStop(1, '#F39C12') // Orange horizon
      } else {
        // Night
        gradient.addColorStop(0, '#0C0C1E') // Very dark blue
        gradient.addColorStop(0.3, '#1A1A2E') // Dark purple
        gradient.addColorStop(0.7, '#16213E') // Dark blue
        gradient.addColorStop(1, '#0F0F23') // Almost black
      }
      
      // Apply weather modifications
      if (weather === 'cloudy' || weather === 'rainy') {
        ctx.globalAlpha = 0.7 // Reduce brightness
        ctx.fillStyle = '#888888'
        ctx.fillRect(0, 0, 512, 256)
        ctx.globalAlpha = 1.0
      }
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 512, 256)
      
      // Add stars for night time
      if (timeOfDay < 6 || timeOfDay > 20) {
        ctx.fillStyle = '#FFFFFF'
        for (let i = 0; i < 100; i++) {
          const x = Math.random() * 512
          const y = Math.random() * 128 // Only in upper half
          const size = Math.random() * 2 + 0.5
          ctx.fillRect(x, y, size, size)
        }
      }
      
      return new THREE.CanvasTexture(canvas)
    }
    
    const envTexture = createSkyTexture(timeOfDay, weatherCondition)
    envTexture.mapping = THREE.EquirectangularReflectionMapping
    scene.environment = envTexture
    scene.background = envTexture
    
    return () => {
      envTexture.dispose()
    }
  }, [scene, timeOfDay, weatherCondition])
  
  return null
}

// Cascaded Shadow Maps for realistic sun shadows
function CascadedShadowMaps({ quality }: { quality: string }) {
  const sunLightRef = useRef<THREE.DirectionalLight>(null)
  const { timeOfDay } = useAppStore()
  
  const shadowMapSize = useMemo(() => {
    switch (quality) {
      case 'ultra': return 4096
      case 'high': return 2048
      case 'medium': return 1024
      default: return 512
    }
  }, [quality])
  
  useFrame(() => {
    if (!sunLightRef.current) return
    
    const sunPosition = getSunPosition(timeOfDay)
    sunLightRef.current.position.set(...sunPosition)
    
    // Update shadow camera for better coverage
    const isDay = timeOfDay >= 6 && timeOfDay <= 18
    sunLightRef.current.castShadow = isDay
    
    if (sunLightRef.current.castShadow) {
      const shadowCamera = sunLightRef.current.shadow.camera as THREE.OrthographicCamera
      shadowCamera.left = -2000
      shadowCamera.right = 2000
      shadowCamera.top = 2000
      shadowCamera.bottom = -2000
      shadowCamera.near = 0.1
      shadowCamera.far = 8000
      shadowCamera.updateProjectionMatrix()
      
      // Dynamic shadow bias based on sun angle
      const sunHeight = sunPosition[1]
      sunLightRef.current.shadow.bias = sunHeight > 200 ? -0.0001 : -0.001
    }
  })
  
  return (
    <directionalLight
      ref={sunLightRef}
      color="#FFFFFF"
      intensity={timeOfDay >= 6 && timeOfDay <= 18 ? 2.5 : 0.1}
      castShadow
      shadow-mapSize-width={shadowMapSize}
      shadow-mapSize-height={shadowMapSize}
      shadow-radius={quality === 'ultra' ? 10 : quality === 'high' ? 5 : 2}
      shadow-blurSamples={quality === 'ultra' ? 25 : quality === 'high' ? 15 : 10}
    />
  )
}

// Area lights for building interiors
function BuildingAreaLights() {
  const { timeOfDay } = useAppStore()
  const lightsRef = useRef<THREE.Group>(null)
  
  // Create building lights that turn on at dusk
  const buildingLights = useMemo(() => {
    const lights: Array<{
      position: [number, number, number]
      color: string
      intensity: number
    }> = []
    
    // Downtown core lighting
    for (let i = 0; i < 50; i++) {
      const x = (Math.random() - 0.5) * 1000
      const z = (Math.random() - 0.5) * 1000
      const y = Math.random() * 300 + 50
      
      lights.push({
        position: [x, y, z],
        color: '#FFE4B5', // Warm interior light
        intensity: 0.5
      })
    }
    
    // Residential area lighting
    for (let i = 0; i < 100; i++) {
      const x = (Math.random() - 0.5) * 2000
      const z = (Math.random() - 0.5) * 2000
      const y = Math.random() * 50 + 10
      
      lights.push({
        position: [x, y, z],
        color: '#FFEFD5', // Warmer residential light
        intensity: 0.3
      })
    }
    
    return lights
  }, [])
  
  useFrame(() => {
    if (!lightsRef.current) return
    
    // Gradually turn on lights as it gets dark
    const lightIntensity = timeOfDay < 7 || timeOfDay > 17 ? 
      Math.max(0, Math.min(1, (20 - timeOfDay) / 3)) : 0
    
    lightsRef.current.children.forEach((light, index) => {
      if (light instanceof THREE.PointLight) {
        const baseIntensity = buildingLights[index]?.intensity || 0.3
        light.intensity = baseIntensity * lightIntensity * (0.8 + Math.random() * 0.4) // Flicker effect
      }
    })
  })
  
  return (
    <group ref={lightsRef}>
      {buildingLights.map((lightData, index) => (
        <pointLight
          key={index}
          position={lightData.position}
          color={lightData.color}
          intensity={0}
          distance={200}
          decay={2}
        />
      ))}
    </group>
  )
}

// Street lighting system
function StreetLights() {
  const { timeOfDay } = useAppStore()
  const streetLightsRef = useRef<THREE.Group>(null)
  
  const streetLightPositions = useMemo(() => {
    const positions: Array<[number, number, number]> = []
    
    // Create a grid of street lights
    for (let x = -2000; x <= 2000; x += 200) {
      for (let z = -2000; z <= 2000; z += 200) {
        // Add some randomness to positions
        const offsetX = (Math.random() - 0.5) * 50
        const offsetZ = (Math.random() - 0.5) * 50
        positions.push([x + offsetX, 15, z + offsetZ])
      }
    }
    
    return positions
  }, [])
  
  useFrame(() => {
    if (!streetLightsRef.current) return
    
    // Turn on street lights at dusk
    const lightIntensity = timeOfDay < 7 || timeOfDay > 17 ? 
      Math.max(0, Math.min(1, (21 - timeOfDay) / 4)) : 0
    
    streetLightsRef.current.children.forEach((light) => {
      if (light instanceof THREE.PointLight) {
        light.intensity = lightIntensity * 0.8
      }
    })
  })
  
  return (
    <group ref={streetLightsRef}>
      {streetLightPositions.map((position, index) => (
        <pointLight
          key={index}
          position={position}
          color="#FFF8DC" // Warm street light color
          intensity={0}
          distance={100}
          decay={2}
        />
      ))}
    </group>
  )
}

// Advanced fill lighting for cinematic quality
function CinematicFillLights() {
  const { timeOfDay, weatherCondition } = useAppStore()
  
  const fillLightIntensity = useMemo(() => {
    const baseIntensity = timeOfDay >= 6 && timeOfDay <= 18 ? 0.3 : 0.1
    const weatherMultiplier = {
      clear: 1.0,
      cloudy: 0.7,
      rainy: 0.5,
      foggy: 0.4,
      snowy: 0.8
    }[weatherCondition] || 1.0
    
    return baseIntensity * weatherMultiplier
  }, [timeOfDay, weatherCondition])
  
  return (
    <group>
      {/* Key fill light from opposite side of sun */}
      <directionalLight
        position={[-1000, 400, -500]}
        color="#4A90E2"
        intensity={fillLightIntensity * 0.3}
      />
      
      {/* Rim light for building edges */}
      <directionalLight
        position={[500, 200, -1000]}
        color="#FF7F50"
        intensity={fillLightIntensity * 0.2}
      />
      
      {/* Bounce light from ground */}
      <hemisphereLight
        args={["#87CEEB", "#8B4513", fillLightIntensity * 0.4]}
      />
      
      {/* Ambient occlusion compensation */}
      <ambientLight
        color="#404080"
        intensity={fillLightIntensity * 0.5}
      />
    </group>
  )
}

export default function CinematicLighting({ 
  enabled = true, 
  quality = 'high' 
}: CinematicLightingProps) {
  const { gl } = useThree()
  
  // Configure renderer for better lighting
  useEffect(() => {
    gl.shadowMap.enabled = enabled
    gl.shadowMap.type = quality === 'ultra' ? THREE.PCFSoftShadowMap : 
                       quality === 'high' ? THREE.PCFShadowMap : 
                       THREE.BasicShadowMap
    gl.shadowMap.autoUpdate = true
    
    // Enhanced tone mapping for HDR
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.2
    
    // Better color space
    gl.outputColorSpace = THREE.SRGBColorSpace
  }, [gl, enabled, quality])
  
  if (!enabled) return null
  
  return (
    <group>
      {/* HDR Environment */}
      <HDREnvironment />
      
      {/* Cascaded Shadow Maps */}
      <CascadedShadowMaps quality={quality} />
      
      {/* Building Interior Lights */}
      <BuildingAreaLights />
      
      {/* Street Lighting System */}
      <StreetLights />
      
      {/* Cinematic Fill Lights */}
      <CinematicFillLights />
    </group>
  )
}
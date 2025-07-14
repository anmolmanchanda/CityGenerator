'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useThree, useLoader } from '@react-three/fiber'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { useAppStore } from '@/lib/store'
import * as THREE from 'three'

interface HDREnvironmentSystemProps {
  enabled?: boolean
  intensity?: number
  backgroundBlur?: number
}

// HDR environment maps for different times of day
const HDR_ENVIRONMENTS = {
  dawn: '/hdri/Sunset Fairway 2k.hdr',
  day: '/hdri/Dusseldorf Bridge 2k.hdr', 
  sunset: '/hdri/Sunset JHB Central 2K.hdr',
  night: '/hdri/Sunset Fairway 2k.hdr' // Will be darkened
}

// Time-based environment selection
function getEnvironmentForTime(timeOfDay: number): string {
  if (timeOfDay >= 5 && timeOfDay < 8) {
    return HDR_ENVIRONMENTS.dawn
  } else if (timeOfDay >= 8 && timeOfDay < 17) {
    return HDR_ENVIRONMENTS.day
  } else if (timeOfDay >= 17 && timeOfDay < 20) {
    return HDR_ENVIRONMENTS.sunset
  } else {
    return HDR_ENVIRONMENTS.night
  }
}

export default function HDREnvironmentSystem({ 
  enabled = true, 
  intensity = 1.0,
  backgroundBlur = 0.1
}: HDREnvironmentSystemProps) {
  const { scene, gl } = useThree()
  const { timeOfDay, weatherCondition } = useAppStore()
  const envMapRef = useRef<THREE.Texture | null>(null)
  
  // Get current environment map path
  const currentHDRPath = useMemo(() => {
    return getEnvironmentForTime(timeOfDay)
  }, [timeOfDay])
  
  // Load HDR environment map
  const hdrTexture = useLoader(RGBELoader, currentHDRPath)
  
  // Set up environment mapping
  useEffect(() => {
    if (!enabled || !hdrTexture) return
    
    // Configure HDR texture
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping
    
    // Apply environment map
    scene.environment = hdrTexture
    scene.background = hdrTexture.clone()
    
    // Store reference for cleanup
    envMapRef.current = hdrTexture
    
    // Configure renderer for HDR
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = intensity
    gl.outputColorSpace = THREE.SRGBColorSpace
    
    return () => {
      if (envMapRef.current) {
        scene.environment = null
        scene.background = null
      }
    }
  }, [scene, gl, hdrTexture, enabled, intensity])
  
  // Update environment based on time and weather
  useEffect(() => {
    if (!enabled || !scene.background) return
    
    const background = scene.background as THREE.Texture
    const environment = scene.environment as THREE.Texture
    
    if (background && environment) {
      // Adjust intensity based on time of day
      let timeIntensity = intensity
      if (timeOfDay < 6 || timeOfDay > 20) {
        timeIntensity *= 0.3 // Night time - much darker
      } else if (timeOfDay < 8 || timeOfDay > 18) {
        timeIntensity *= 0.6 // Dawn/dusk - medium intensity
      }
      
      // Adjust for weather conditions
      const weatherMultiplier = {
        clear: 1.0,
        cloudy: 0.7,
        rainy: 0.5,
        foggy: 0.4,
        snowy: 0.8
      }[weatherCondition] || 1.0
      
      timeIntensity *= weatherMultiplier
      
      // Update tone mapping exposure
      gl.toneMappingExposure = timeIntensity
      
      // Blur background for atmospheric effect
      if (background.userData) {
        background.userData.backgroundBlurriness = backgroundBlur
      }
    }
  }, [timeOfDay, weatherCondition, intensity, backgroundBlur, scene, gl, enabled])
  
  return null
}

// HDR Environment preloader component
export function HDREnvironmentPreloader() {
  const preloadedTextures = useRef<{ [key: string]: THREE.Texture }>({})
  
  // Preload all HDR environments
  useEffect(() => {
    const loader = new RGBELoader()
    
    Object.entries(HDR_ENVIRONMENTS).forEach(([key, path]) => {
      loader.load(
        path,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping
          preloadedTextures.current[key] = texture
          console.log(`Preloaded HDR environment: ${key}`)
        },
        undefined,
        (error) => {
          console.warn(`Failed to preload HDR environment ${key}:`, error)
        }
      )
    })
    
    return () => {
      // Cleanup preloaded textures
      Object.values(preloadedTextures.current).forEach(texture => {
        texture.dispose()
      })
    }
  }, [])
  
  return null
}

// Dynamic sky system as fallback
export function DynamicSkyFallback({ timeOfDay }: { timeOfDay: number }) {
  const { scene, gl } = useThree()
  
  useEffect(() => {
    // Create procedural sky texture as fallback
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    
    // Create time-based gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    
    if (timeOfDay >= 5.5 && timeOfDay <= 7) {
      // Dawn
      gradient.addColorStop(0, '#FFB366')
      gradient.addColorStop(0.3, '#FF8C42')
      gradient.addColorStop(0.7, '#FF6B6B')
      gradient.addColorStop(1, '#4ECDC4')
    } else if (timeOfDay >= 7 && timeOfDay <= 17) {
      // Day
      gradient.addColorStop(0, '#87CEEB')
      gradient.addColorStop(0.4, '#B0E0E6')
      gradient.addColorStop(0.8, '#F0F8FF')
      gradient.addColorStop(1, '#FFFACD')
    } else if (timeOfDay >= 17 && timeOfDay <= 19) {
      // Sunset
      gradient.addColorStop(0, '#FF6B6B')
      gradient.addColorStop(0.3, '#FF8E53')
      gradient.addColorStop(0.7, '#FF6B35')
      gradient.addColorStop(1, '#F7931E')
    } else {
      // Night
      gradient.addColorStop(0, '#0C0C1E')
      gradient.addColorStop(0.3, '#1A1A2E')
      gradient.addColorStop(0.7, '#16213E')
      gradient.addColorStop(1, '#0F0F23')
    }
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 256)
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas)
    texture.mapping = THREE.EquirectangularReflectionMapping
    
    // Apply to scene
    scene.background = texture
    scene.environment = texture
    
    return () => {
      texture.dispose()
      scene.background = null
      scene.environment = null
    }
  }, [scene, timeOfDay])
  
  return null
}
'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAppStore } from '@/lib/store'
import { Color, DirectionalLight, Vector3 } from 'three'
import { getSunPosition, getTimeOfDayFromHour, interpolateColors } from '@/utils'

export default function DynamicLighting() {
  const sunLightRef = useRef<DirectionalLight>(null)
  const moonLightRef = useRef<DirectionalLight>(null)
  const { timeOfDay, weatherCondition } = useAppStore()

  // Define lighting conditions for different times of day
  const lightingConfig = useMemo(() => ({
    dawn: {
      sunColor: new Color('#FFB366'),
      sunIntensity: 0.3,
      ambientColor: new Color('#404080'),
      ambientIntensity: 0.15,
      fogColor: '#001122',
      fogDensity: 0.0003,
      moonColor: new Color('#C4E4F7'),
      moonIntensity: 0.05
    },
    morning: {
      sunColor: new Color('#FFDD88'),
      sunIntensity: 1.2,
      ambientColor: new Color('#6080FF'),
      ambientIntensity: 0.25,
      fogColor: '#002244',
      fogDensity: 0.0001,
      moonColor: new Color('#C4E4F7'),
      moonIntensity: 0.0
    },
    noon: {
      sunColor: new Color('#FFFFFF'),
      sunIntensity: 1.8,
      ambientColor: new Color('#87CEEB'),
      ambientIntensity: 0.4,
      fogColor: '#004466',
      fogDensity: 0.00005,
      moonColor: new Color('#C4E4F7'),
      moonIntensity: 0.0
    },
    afternoon: {
      sunColor: new Color('#FFCC66'),
      sunIntensity: 1.4,
      ambientColor: new Color('#7090FF'),
      ambientIntensity: 0.3,
      fogColor: '#003355',
      fogDensity: 0.0001,
      moonColor: new Color('#C4E4F7'),
      moonIntensity: 0.0
    },
    evening: {
      sunColor: new Color('#FF8844'),
      sunIntensity: 0.6,
      ambientColor: new Color('#502080'),
      ambientIntensity: 0.2,
      fogColor: '#001133',
      fogDensity: 0.0002,
      moonColor: new Color('#C4E4F7'),
      moonIntensity: 0.02
    },
    dusk: {
      sunColor: new Color('#FF6622'),
      sunIntensity: 0.2,
      ambientColor: new Color('#301060'),
      ambientIntensity: 0.15,
      fogColor: '#000822',
      fogDensity: 0.0003,
      moonColor: new Color('#C4E4F7'),
      moonIntensity: 0.08
    },
    night: {
      sunColor: new Color('#001144'),
      sunIntensity: 0.05,
      ambientColor: new Color('#001122'),
      ambientIntensity: 0.08,
      fogColor: '#000011',
      fogDensity: 0.0004,
      moonColor: new Color('#C4E4F7'),
      moonIntensity: 0.15
    }
  }), [])

  // Weather modifications
  const weatherModifiers = useMemo(() => ({
    clear: { intensityMod: 1.0, fogMod: 1.0 },
    cloudy: { intensityMod: 0.7, fogMod: 1.5 },
    rainy: { intensityMod: 0.4, fogMod: 2.0 },
    foggy: { intensityMod: 0.3, fogMod: 4.0 },
    snowy: { intensityMod: 0.6, fogMod: 1.8 }
  }), [])

  // Calculate current lighting based on time of day
  const getCurrentLighting = (hour: number) => {
    let config1, config2, factor

    if (hour < 6) {
      // Night to Dawn
      config1 = lightingConfig.night
      config2 = lightingConfig.dawn
      factor = Math.max(0, (hour - 4) / 2) // Smooth transition from 4-6 AM
    } else if (hour < 8) {
      // Dawn to Morning
      config1 = lightingConfig.dawn
      config2 = lightingConfig.morning
      factor = (hour - 6) / 2
    } else if (hour < 11) {
      // Morning to Noon
      config1 = lightingConfig.morning
      config2 = lightingConfig.noon
      factor = (hour - 8) / 3
    } else if (hour < 14) {
      // Noon plateau
      return lightingConfig.noon
    } else if (hour < 17) {
      // Noon to Afternoon
      config1 = lightingConfig.noon
      config2 = lightingConfig.afternoon
      factor = (hour - 14) / 3
    } else if (hour < 19) {
      // Afternoon to Evening
      config1 = lightingConfig.afternoon
      config2 = lightingConfig.evening
      factor = (hour - 17) / 2
    } else if (hour < 21) {
      // Evening to Dusk
      config1 = lightingConfig.evening
      config2 = lightingConfig.dusk
      factor = (hour - 19) / 2
    } else {
      // Dusk to Night
      config1 = lightingConfig.dusk
      config2 = lightingConfig.night
      factor = Math.min(1, (hour - 21) / 3) // Smooth transition from 9 PM - midnight
    }

    // Interpolate between configurations
    return {
      sunColor: interpolateColors(config1.sunColor, config2.sunColor, factor),
      sunIntensity: config1.sunIntensity + (config2.sunIntensity - config1.sunIntensity) * factor,
      ambientColor: interpolateColors(config1.ambientColor, config2.ambientColor, factor),
      ambientIntensity: config1.ambientIntensity + (config2.ambientIntensity - config1.ambientIntensity) * factor,
      fogColor: config1.fogColor,
      fogDensity: config1.fogDensity + (config2.fogDensity - config1.fogDensity) * factor,
      moonColor: config1.moonColor || config2.moonColor,
      moonIntensity: (config1.moonIntensity || 0) + ((config2.moonIntensity || 0) - (config1.moonIntensity || 0)) * factor
    }
  }

  useFrame(({ scene }) => {
    const lighting = getCurrentLighting(timeOfDay)
    const weather = weatherModifiers[weatherCondition]
    
    // Update sun position and properties
    if (sunLightRef.current) {
      const sunPosition = getSunPosition(timeOfDay)
      sunLightRef.current.position.set(...sunPosition)
      sunLightRef.current.color.copy(lighting.sunColor)
      sunLightRef.current.intensity = lighting.sunIntensity * weather.intensityMod
      
      // Update shadow properties based on time of day
      const isDay = timeOfDay >= 6 && timeOfDay <= 18
      sunLightRef.current.castShadow = isDay && lighting.sunIntensity > 0.3
      
      if (sunLightRef.current.castShadow) {
        // Adjust shadow darkness based on sun intensity
        sunLightRef.current.shadow.camera.updateProjectionMatrix()
      }
    }

    // Update moon lighting for night time
    if (moonLightRef.current && lighting.moonIntensity) {
      const moonAngle = ((timeOfDay + 12) % 24 - 6) / 12 * Math.PI
      const moonX = Math.cos(moonAngle) * 1000
      const moonY = Math.sin(moonAngle) * 1000
      const moonZ = 300
      
      moonLightRef.current.position.set(moonX, Math.max(moonY, -100), moonZ)
      moonLightRef.current.color.copy(lighting.moonColor || new Color('#C4E4F7'))
      moonLightRef.current.intensity = lighting.moonIntensity * weather.intensityMod
      moonLightRef.current.visible = timeOfDay < 6 || timeOfDay > 18
    }

    // Update scene fog
    if (scene.fog) {
      const fogColorObj = new Color(lighting.fogColor)
      scene.fog.color.copy(fogColorObj)
      ;(scene.fog as any).density = lighting.fogDensity * weather.fogMod
    }
  })

  return (
    <group>
      {/* Main sun light */}
      <directionalLight
        ref={sunLightRef}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={5000}
        shadow-camera-left={-1000}
        shadow-camera-right={1000}
        shadow-camera-top={1000}
        shadow-camera-bottom={-1000}
        shadow-bias={-0.0005}
      />

      {/* Moon light for night scenes */}
      <directionalLight
        ref={moonLightRef}
        visible={false}
        castShadow={false}
      />

      {/* Fill lights for more realistic lighting */}
      <directionalLight
        position={[-50, 30, -50]}
        intensity={0.1}
        color="#4080ff"
      />
      
      <directionalLight
        position={[50, 30, 50]}
        intensity={0.1}
        color="#ff8040"
      />

      {/* City lights simulation (for evening/night) */}
      {(timeOfDay < 7 || timeOfDay > 17) && (
        <group>
          {/* Warm building glow */}
          <pointLight
            position={[0, 50, 0]}
            intensity={0.3}
            color="#FFAA44"
            distance={2000}
            decay={1}
          />
          
          {/* Street lighting simulation */}
          <pointLight
            position={[200, 20, 200]}
            intensity={0.2}
            color="#FFF8DC"
            distance={500}
            decay={2}
          />
          
          <pointLight
            position={[-200, 20, -200]}
            intensity={0.2}
            color="#FFF8DC"
            distance={500}
            decay={2}
          />
        </group>
      )}
    </group>
  )
}
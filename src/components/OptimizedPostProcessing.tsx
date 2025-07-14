'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { 
  EffectComposer, 
  Bloom, 
  ToneMapping, 
  Vignette, 
  DepthOfField,
  ChromaticAberration,
  SSAO,
  Noise,
  BrightnessContrast,
  HueSaturation,
  SMAA
} from '@react-three/postprocessing'
import { 
  ToneMappingMode, 
  BlendFunction
} from 'postprocessing'
import { useAppStore } from '@/lib/store'
import * as THREE from 'three'

interface OptimizedPostProcessingProps {
  enabled?: boolean
  quality?: 'low' | 'medium' | 'high' | 'ultra'
  adaptiveQuality?: boolean
}

// Performance monitoring for adaptive quality
function usePerformanceMonitor() {
  const [fps, setFps] = useState(60)
  const [targetQuality, setTargetQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('high')
  const frameTimesRef = useRef<number[]>([])
  
  useFrame(() => {
    const currentTime = performance.now()
    const lastTime = frameTimesRef.current[frameTimesRef.current.length - 1] || currentTime
    const deltaTime = currentTime - lastTime
    
    frameTimesRef.current.push(currentTime)
    
    // Keep only last 30 frames for averaging
    if (frameTimesRef.current.length > 30) {
      frameTimesRef.current.shift()
    }
    
    // Calculate average FPS every 30 frames
    if (frameTimesRef.current.length === 30) {
      const avgDelta = frameTimesRef.current.reduce((sum, time, index) => {
        if (index === 0) return sum
        return sum + (time - frameTimesRef.current[index - 1])
      }, 0) / 29
      
      const avgFps = 1000 / avgDelta
      setFps(Math.round(avgFps))
      
      // Adaptive quality adjustment
      if (avgFps < 30) {
        setTargetQuality('low')
      } else if (avgFps < 45) {
        setTargetQuality('medium') 
      } else if (avgFps < 55) {
        setTargetQuality('high')
      } else {
        setTargetQuality('ultra')
      }
    }
  })
  
  return { fps, targetQuality }
}

export default function OptimizedPostProcessing({ 
  enabled = true, 
  quality = 'high',
  adaptiveQuality = true
}: OptimizedPostProcessingProps) {
  const { timeOfDay, weatherCondition } = useAppStore()
  const { camera, size } = useThree()
  const composerRef = useRef<any>(null)
  const { fps, targetQuality } = usePerformanceMonitor()
  
  // Use adaptive quality if enabled
  const effectiveQuality = adaptiveQuality ? targetQuality : quality
  
  // Optimized quality settings - significantly reduced for better performance
  const qualitySettings = useMemo(() => {
    const settings = {
      low: {
        multisampling: 0,
        ssaoSamples: 4,  // Very low
        ssaoRadius: 0.1,
        bloomHeight: 64,  // Very low resolution
        bloomIntensity: 0.8,
        depthOfFieldEnabled: false,  // Disabled for performance
        vignetteEnabled: true,
        chromaticAberrationEnabled: false,  // Disabled for performance
        filmGrainIntensity: 0.01
      },
      medium: {
        multisampling: 0,  // Reduced from 2
        ssaoSamples: 6,    // Reduced from 8
        ssaoRadius: 0.15,
        bloomHeight: 96,   // Reduced from 200
        bloomIntensity: 1.0,
        depthOfFieldEnabled: false,  // Still disabled
        vignetteEnabled: true,
        chromaticAberrationEnabled: false,
        filmGrainIntensity: 0.02
      },
      high: {
        multisampling: 2,  // Reduced from 4
        ssaoSamples: 8,    // Reduced from 16
        ssaoRadius: 0.2,
        bloomHeight: 128,  // Reduced from 300
        bloomIntensity: 1.2,
        depthOfFieldEnabled: true,   // Now enabled
        vignetteEnabled: true,
        chromaticAberrationEnabled: true,
        filmGrainIntensity: 0.03
      },
      ultra: {
        multisampling: 4,  // Reduced from 8
        ssaoSamples: 12,   // Significantly reduced from 32
        ssaoRadius: 0.25,
        bloomHeight: 192,  // Reduced from 400
        bloomIntensity: 1.5,
        depthOfFieldEnabled: true,
        vignetteEnabled: true,
        chromaticAberrationEnabled: true,
        filmGrainIntensity: 0.04
      }
    }
    return settings[effectiveQuality]
  }, [effectiveQuality])
  
  // Simplified time-based settings with caching
  const timeBasedSettings = useMemo(() => {
    const isDay = timeOfDay >= 6 && timeOfDay <= 18
    const isGoldenHour = (timeOfDay >= 5.5 && timeOfDay <= 7) || (timeOfDay >= 17 && timeOfDay <= 19)
    const isNight = timeOfDay < 6 || timeOfDay > 18
    
    // Simplified calculations
    let bloomBoost = 1.0
    let contrastBoost = 0.0
    let saturationBoost = 0.0
    
    if (isNight) {
      bloomBoost = 1.5  // Boost bloom at night
      contrastBoost = 0.1
      saturationBoost = 0.05
    } else if (isGoldenHour) {
      bloomBoost = 1.3
      contrastBoost = 0.05
      saturationBoost = 0.1
    }
    
    return {
      bloomIntensity: qualitySettings.bloomIntensity * bloomBoost,
      bloomThreshold: isNight ? 0.4 : 0.7,
      contrastBoost,
      saturationBoost,
      vignetteIntensity: isNight ? 0.3 : 0.1
    }
  }, [timeOfDay, qualitySettings.bloomIntensity])
  
  // Weather-based settings (simplified)
  const weatherMultiplier = useMemo(() => {
    switch (weatherCondition) {
      case 'rainy': return 0.8
      case 'cloudy': return 0.9
      case 'foggy': return 0.7
      default: return 1.0
    }
  }, [weatherCondition])
  
  if (!enabled) {
    return null
  }
  
  // Create array of effects to avoid null children
  const effects = []
  
  // Anti-aliasing - always first
  effects.push(<SMAA key="smaa" />)
  
  // SSAO - optimized with lower sample counts
  effects.push(
    <SSAO
      key="ssao"
      samples={qualitySettings.ssaoSamples}
      radius={qualitySettings.ssaoRadius}
      intensity={0.5 * weatherMultiplier}
      bias={0.005}
      fade={0.01}
      color={new THREE.Color('black')}
      resolutionScale={effectiveQuality === 'low' ? 0.5 : 1.0}
    />
  )
  
  // Optimized Bloom
  effects.push(
    <Bloom
      key="bloom"
      intensity={timeBasedSettings.bloomIntensity * weatherMultiplier}
      threshold={timeBasedSettings.bloomThreshold}
      smoothing={0.8}
      height={qualitySettings.bloomHeight}
      opacity={0.8}
    />
  )
  
  // Conditional Depth of Field - only on higher qualities
  if (qualitySettings.depthOfFieldEnabled) {
    effects.push(
      <DepthOfField
        key="dof"
        focusDistance={0.02}
        focalLength={0.05}
        bokehScale={2}  // Fixed lower value
        height={qualitySettings.bloomHeight / 2}  // Half bloom height for performance
      />
    )
  }
  
  // Conditional Chromatic Aberration
  if (qualitySettings.chromaticAberrationEnabled) {
    effects.push(
      <ChromaticAberration
        key="chromatic"
        offset={[0.001, 0.001]}
      />
    )
  }
  
  // Tone Mapping - always enabled
  effects.push(
    <ToneMapping 
      key="tonemap"
      mode={ToneMappingMode.ACES_FILMIC}
      exposure={1.2}
      whitePoint={1.0}
      middleGrey={0.6}
    />
  )
  
  // Brightness/Contrast - simplified
  effects.push(
    <BrightnessContrast
      key="brightness"
      brightness={0.0}
      contrast={timeBasedSettings.contrastBoost}
    />
  )
  
  // Hue/Saturation - simplified
  effects.push(
    <HueSaturation
      key="hue"
      hue={0.0}
      saturation={timeBasedSettings.saturationBoost}
    />
  )
  
  // Vignette - conditional
  if (qualitySettings.vignetteEnabled) {
    effects.push(
      <Vignette
        key="vignette"
        offset={0.3}
        darkness={timeBasedSettings.vignetteIntensity}
      />
    )
  }
  
  // Film Grain - lightweight
  effects.push(
    <Noise
      key="noise"
      premultiply
      blendFunction={BlendFunction.OVERLAY}
      opacity={qualitySettings.filmGrainIntensity}
    />
  )

  return (
    <EffectComposer 
      ref={composerRef}
      multisampling={qualitySettings.multisampling}
      enableNormalPass
      stencilBuffer={true}
    >
      {effects}
    </EffectComposer>
  )
}

// Debug component for monitoring performance
export function PostProcessingDebug() {
  const { fps, targetQuality } = usePerformanceMonitor()
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const debugElement = document.getElementById('postprocessing-debug')
      if (debugElement) {
        debugElement.innerHTML = `
          <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; font-family: monospace; font-size: 12px;">
            <div>FPS: ${fps}</div>
            <div>Auto Quality: ${targetQuality}</div>
          </div>
        `
      }
    }
  }, [fps, targetQuality])
  
  return null
}
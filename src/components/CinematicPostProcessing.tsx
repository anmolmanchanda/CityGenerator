'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { 
  EffectComposer, 
  Bloom, 
  ToneMapping, 
  Vignette, 
  DepthOfField,
  ChromaticAberration,
  ColorAverage,
  SSAO,
  Noise,
  ColorDepth,
  Sepia,
  BrightnessContrast,
  HueSaturation,
  LUT,
  SMAA,
  Outline
} from '@react-three/postprocessing'
import { 
  ToneMappingMode, 
  BlendFunction, 
  DepthOfFieldEffect,
  BloomEffect,
  NoiseEffect,
  SMAAEffect
} from 'postprocessing'
import { useAppStore } from '@/lib/store'
import * as THREE from 'three'

interface CinematicPostProcessingProps {
  enabled?: boolean
  quality?: 'low' | 'medium' | 'high' | 'ultra'
}

export default function CinematicPostProcessing({ 
  enabled = true, 
  quality = 'high' 
}: CinematicPostProcessingProps) {
  const { timeOfDay, weatherCondition } = useAppStore()
  const { camera } = useThree()
  const composerRef = useRef<any>(null)

  // Quality-based settings
  const qualitySettings = useMemo(() => {
    const settings = {
      low: {
        multisampling: 0,
        ssaoSamples: 4,
        bloomHeight: 100,
        depthOfFieldBokehScale: 1,
        enableSSR: false,
        enableMotionBlur: false,
        filmGrainIntensity: 0.02
      },
      medium: {
        multisampling: 2,
        ssaoSamples: 8,
        bloomHeight: 200,
        depthOfFieldBokehScale: 2,
        enableSSR: false,
        enableMotionBlur: false,
        filmGrainIntensity: 0.035
      },
      high: {
        multisampling: 4,
        ssaoSamples: 16,
        bloomHeight: 300,
        depthOfFieldBokehScale: 3,
        enableSSR: true,
        enableMotionBlur: false,
        filmGrainIntensity: 0.05
      },
      ultra: {
        multisampling: 8,
        ssaoSamples: 32,
        bloomHeight: 400,
        depthOfFieldBokehScale: 4,
        enableSSR: true,
        enableMotionBlur: true,
        filmGrainIntensity: 0.07
      }
    }
    return settings[quality]
  }, [quality])

  // Time-based post-processing adjustments
  const timeBasedSettings = useMemo(() => {
    const isDay = timeOfDay >= 6 && timeOfDay <= 18
    const isGoldenHour = (timeOfDay >= 5.5 && timeOfDay <= 7) || (timeOfDay >= 17 && timeOfDay <= 19)
    const isBlueHour = (timeOfDay >= 19 && timeOfDay <= 20.5) || (timeOfDay >= 5 && timeOfDay <= 5.5)
    const isNight = timeOfDay < 5 || timeOfDay > 20.5

    return {
      // Bloom settings
      bloomIntensity: isNight ? 2.5 : isGoldenHour ? 1.8 : isDay ? 1.2 : 1.5,
      bloomThreshold: isNight ? 0.3 : isGoldenHour ? 0.6 : isDay ? 0.8 : 0.5,
      
      // Color grading
      colorTemperature: isGoldenHour ? 0.3 : isBlueHour ? -0.2 : isNight ? -0.1 : 0,
      saturation: isGoldenHour ? 1.3 : isBlueHour ? 0.8 : isDay ? 1.1 : 0.9,
      
      // Vignette
      vignetteIntensity: isNight ? 0.6 : isGoldenHour ? 0.4 : isDay ? 0.2 : 0.3,
      
      // Depth of Field
      dofFocalLength: isNight ? 0.08 : isGoldenHour ? 0.06 : 0.05,
      dofFocusDistance: isNight ? 0.015 : 0.02
    }
  }, [timeOfDay])

  // Weather-based adjustments
  const weatherSettings = useMemo(() => {
    const settings = {
      clear: {
        vignetteMultiplier: 1.0,
        chromaticAberrationIntensity: 0.0015,
        filmGrainMultiplier: 1.0,
        bloomMultiplier: 1.0
      },
      cloudy: {
        vignetteMultiplier: 1.2,
        chromaticAberrationIntensity: 0.001,
        filmGrainMultiplier: 1.1,
        bloomMultiplier: 0.8
      },
      rainy: {
        vignetteMultiplier: 1.4,
        chromaticAberrationIntensity: 0.002,
        filmGrainMultiplier: 1.3,
        bloomMultiplier: 0.6
      },
      foggy: {
        vignetteMultiplier: 1.6,
        chromaticAberrationIntensity: 0.0005,
        filmGrainMultiplier: 1.5,
        bloomMultiplier: 0.4
      },
      snowy: {
        vignetteMultiplier: 0.8,
        chromaticAberrationIntensity: 0.001,
        filmGrainMultiplier: 0.8,
        bloomMultiplier: 1.2
      }
    }
    return settings[weatherCondition] || settings.clear
  }, [weatherCondition])

  if (!enabled) return null

  return (
    <EffectComposer 
      ref={composerRef}
      multisampling={qualitySettings.multisampling} 
      enableNormalPass 
      stencilBuffer={true}
    >
      <>
        {/* Anti-aliasing (First in pipeline for clean edges) */}
        <SMAA />

        {/* Screen Space Ambient Occlusion - Critical for depth and realism */}
        <SSAO
          samples={qualitySettings.ssaoSamples}
          radius={0.12}
          bias={0.025}
          intensity={1.2}
          blendFunction={BlendFunction.MULTIPLY}
        />

        {/* Depth of Field with Hexagonal Bokeh - Cinematic focus */}
        <DepthOfField
          focusDistance={timeBasedSettings.dofFocusDistance}
          focalLength={timeBasedSettings.dofFocalLength}
          bokehScale={qualitySettings.depthOfFieldBokehScale}
          height={qualitySettings.bloomHeight}
        />

        {/* Enhanced Bloom - Multiple passes for realism */}
        <Bloom 
          intensity={timeBasedSettings.bloomIntensity * weatherSettings.bloomMultiplier} 
          luminanceThreshold={timeBasedSettings.bloomThreshold} 
          luminanceSmoothing={0.4}
          height={qualitySettings.bloomHeight}
        />

        {/* Film Grain - Cinematic texture */}
        <Noise
          opacity={qualitySettings.filmGrainIntensity * weatherSettings.filmGrainMultiplier}
          blendFunction={BlendFunction.OVERLAY}
        />

        {/* Chromatic Aberration - Subtle lens distortion */}
        <ChromaticAberration
          offset={[
            weatherSettings.chromaticAberrationIntensity, 
            weatherSettings.chromaticAberrationIntensity
          ]}
        />

        {/* Color Grading - Hollywood teal/orange look */}
        <BrightnessContrast
          brightness={timeOfDay < 6 || timeOfDay > 18 ? -0.05 : 0.02}
          contrast={0.15}
        />

        <HueSaturation
          saturation={timeBasedSettings.saturation - 1.0}
          hue={timeBasedSettings.colorTemperature}
        />

        {/* ACES Filmic Tone Mapping - Industry standard */}
        <ToneMapping 
          mode={ToneMappingMode.ACES_FILMIC}
        />

        {/* Cinematic Vignette */}
        <Vignette 
          offset={0.2} 
          darkness={timeBasedSettings.vignetteIntensity * weatherSettings.vignetteMultiplier}
        />
      </>
    </EffectComposer>
  )
}

// Export quality presets for easy switching
export const POST_PROCESSING_PRESETS = {
  PERFORMANCE: 'low' as const,
  BALANCED: 'medium' as const,
  QUALITY: 'high' as const,
  CINEMATIC: 'ultra' as const
}
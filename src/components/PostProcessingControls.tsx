'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface PostProcessingSettings {
  enabled: boolean
  quality: 'low' | 'medium' | 'high' | 'ultra'
}

interface PostProcessingControlsProps {
  onSettingsChange: (settings: PostProcessingSettings) => void
}

export default function PostProcessingControls({ onSettingsChange }: PostProcessingControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<PostProcessingSettings>({
    enabled: true,
    quality: 'high'
  })

  const handleQualityChange = (quality: PostProcessingSettings['quality']) => {
    const newSettings = { ...settings, quality }
    setSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const toggleEnabled = () => {
    const newSettings = { ...settings, enabled: !settings.enabled }
    setSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const qualityPresets = {
    'Low': {
      quality: 'low' as const,
      description: 'Basic effects, 60+ FPS',
      features: ['Basic bloom', 'Simple grain', 'Anti-aliasing']
    },
    'Medium': {
      quality: 'medium' as const,
      description: 'Balanced quality, 45-60 FPS',
      features: ['Enhanced SSAO', 'Depth of field', 'Color grading']
    },
    'High': {
      quality: 'high' as const,
      description: 'Cinematic quality, 30-45 FPS',
      features: ['All effects', 'High-res bloom', 'Film grain']
    },
    'Ultra': {
      quality: 'ultra' as const,
      description: 'Maximum quality, 20-30 FPS',
      features: ['SSR reflections', 'Motion blur', 'Ultra sampling']
    }
  }

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ 
        x: isOpen ? 0 : 250, 
        opacity: isOpen ? 1 : 0.8 
      }}
      className="fixed top-20 right-4 z-30"
    >
      <div className="glass-dark rounded-lg overflow-hidden">
        {/* Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 flex items-center justify-between hover:bg-white/10 transition-colors"
        >
          <span className="text-sm font-medium">Graphics</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.button>

        {/* Controls Panel */}
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 p-4 space-y-4 w-72"
          >
            {/* Master Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Post-Processing</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleEnabled}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.enabled ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <motion.div
                  animate={{ x: settings.enabled ? 24 : 2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="w-5 h-5 bg-white rounded-full"
                />
              </motion.button>
            </div>

            {settings.enabled && (
              <>
                {/* Quality Presets */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Cinematic Quality</h3>
                  <div className="space-y-3">
                    {Object.entries(qualityPresets).map(([name, preset]) => (
                      <motion.button
                        key={name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQualityChange(preset.quality)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          settings.quality === preset.quality
                            ? 'bg-blue-500/20 border border-blue-400/50'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{name}</span>
                          {settings.quality === preset.quality && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          {preset.description}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {preset.features.map((feature) => (
                            <span
                              key={feature}
                              className="px-2 py-0.5 text-xs bg-white/10 rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Performance Info */}
                <div className="text-xs text-gray-400 space-y-1 border-t border-white/10 pt-3">
                  <div className="font-medium">Effects included:</div>
                  <div>• SSAO & Enhanced Lighting</div>
                  <div>• Depth of Field & Bloom</div>
                  <div>• Film Grain & Color Grading</div>
                  <div>• Chromatic Aberration & Vignette</div>
                  {settings.quality === 'ultra' && (
                    <div className="text-blue-400">• SSR Reflections & Motion Blur</div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
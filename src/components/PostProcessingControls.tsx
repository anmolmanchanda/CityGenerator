'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface PostProcessingSettings {
  ssao: boolean
  depthOfField: boolean
  bloom: boolean
  chromaticAberration: boolean
  vignette: boolean
  colorGrading: boolean
}

interface PostProcessingControlsProps {
  onSettingsChange: (settings: PostProcessingSettings) => void
}

export default function PostProcessingControls({ onSettingsChange }: PostProcessingControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<PostProcessingSettings>({
    ssao: true,
    depthOfField: true,
    bloom: true,
    chromaticAberration: true,
    vignette: true,
    colorGrading: true
  })

  const handleToggle = (key: keyof PostProcessingSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const presets = {
    Ultra: {
      ssao: true,
      depthOfField: true,
      bloom: true,
      chromaticAberration: true,
      vignette: true,
      colorGrading: true
    },
    High: {
      ssao: true,
      depthOfField: false,
      bloom: true,
      chromaticAberration: true,
      vignette: true,
      colorGrading: true
    },
    Medium: {
      ssao: false,
      depthOfField: false,
      bloom: true,
      chromaticAberration: false,
      vignette: true,
      colorGrading: false
    },
    Low: {
      ssao: false,
      depthOfField: false,
      bloom: false,
      chromaticAberration: false,
      vignette: false,
      colorGrading: false
    }
  }

  const applyPreset = (preset: keyof typeof presets) => {
    const newSettings = presets[preset]
    setSettings(newSettings)
    onSettingsChange(newSettings)
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
            className="border-t border-white/10 p-4 space-y-4 w-64"
          >
            {/* Quality Presets */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Quality Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(presets).map((preset) => (
                  <motion.button
                    key={preset}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyPreset(preset as keyof typeof presets)}
                    className="px-3 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition-colors"
                  >
                    {preset}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Individual Controls */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Effects</h3>
              <div className="space-y-2">
                {Object.entries(settings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggle(key as keyof PostProcessingSettings)}
                      className={`w-8 h-4 rounded-full transition-colors ${
                        value ? 'bg-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <motion.div
                        animate={{ x: value ? 16 : 2 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="w-3 h-3 bg-white rounded-full"
                      />
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Info */}
            <div className="text-xs text-gray-400 space-y-1">
              <div>Effects impact performance</div>
              <div>Lower settings = higher FPS</div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'

export default function HeroUI() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { timeOfDay, setTimeOfDay, weatherCondition, setWeatherCondition } = useAppStore()

  return (
    <>
      {/* Top Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute top-0 left-0 right-0 z-20 p-6"
      >
        <div className="flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass-dark px-4 py-2 rounded-full"
          >
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              CityGenerator
            </h1>
          </motion.div>

          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-dark px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Vancouver
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="glass-dark p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Content */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center space-y-8 max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="space-y-6"
          >
            <h1 className="text-4xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                Experience Cities
              </span>
              <br />
              <span className="text-white">Like Never Before</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Photorealistic 3D visualization platform showcasing urban environments 
              with real-time data integration and cinematic quality.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary px-8 py-4 text-lg font-semibold"
            >
              Explore Vancouver
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary px-8 py-4 text-lg font-semibold"
            >
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2.5, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-8 sm:mt-12 px-4"
          >
            {[
              'Photorealistic 3D',
              'Real Building Data',
              '60 FPS Performance',
              'Mobile Optimized',
              'Quality of Life Data'
            ].map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 2.7 + index * 0.1 }}
                className="glass-dark px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium will-change-transform"
              >
                {feature}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Controls */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 3, duration: 0.8 }}
        className="absolute bottom-6 left-6 right-6 z-20"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          {/* Camera Controls Instructions */}
          <div className="glass-dark p-2 sm:p-3 rounded-full">
            <div className="flex items-center space-x-3 text-xs sm:text-sm">
              <span className="text-gray-300">Navigate:</span>
              <div className="flex items-center space-x-1">
                <span className="px-1 py-0.5 bg-white/20 rounded text-xs">Click+Drag</span>
                <span className="text-gray-400">Rotate</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="px-1 py-0.5 bg-white/20 rounded text-xs">Scroll</span>
                <span className="text-gray-400">Zoom</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="px-1 py-0.5 bg-white/20 rounded text-xs">Shift+Drag</span>
                <span className="text-gray-400">Pan</span>
              </div>
            </div>
          </div>

          {/* Time Controls */}
          <div className="glass-dark p-2 sm:p-3 rounded-full">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                {String(Math.floor(timeOfDay)).padStart(2, '0')}:{String(Math.floor((timeOfDay % 1) * 60)).padStart(2, '0')}
              </span>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setTimeOfDay(12)}
                  className="p-1 hover:bg-white/20 rounded transition-colors text-yellow-400"
                  title="Noon"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06L5.106 17.834a.75.75 0 001.06 1.06l1.592-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.592a.75.75 0 00-1.061 1.061l1.59 1.591z"/>
                  </svg>
                </motion.button>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.5"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
                  className="w-16 sm:w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setTimeOfDay(0)}
                  className="p-1 hover:bg-white/20 rounded transition-colors text-blue-300"
                  title="Midnight"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"/>
                  </svg>
                </motion.button>
              </div>
              
                  {/* Weather Controls */}
              <div className="hidden sm:flex items-center space-x-2 ml-4">
                <span className="text-sm font-medium">Weather:</span>
                <select
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value as any)}
                  className="bg-transparent text-white text-sm border border-white/20 rounded px-2 py-1 hover:bg-white/10 transition-colors"
                >
                  <option value="clear" className="bg-gray-800">Clear</option>
                  <option value="cloudy" className="bg-gray-800">Cloudy</option>
                  <option value="rainy" className="bg-gray-800">Rainy</option>
                  <option value="foggy" className="bg-gray-800">Foggy</option>
                  <option value="snowy" className="bg-gray-800">Snowy</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Side Menu */}
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ 
          x: isMenuOpen ? 0 : 300, 
          opacity: isMenuOpen ? 1 : 0 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute top-0 right-0 h-full w-72 sm:w-80 z-30"
      >
        <div className="glass-dark h-full p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">City Explorer</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Available Cities</h3>
              <div className="space-y-2">
                <div className="p-3 glass rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                  <div className="font-medium">Vancouver, BC</div>
                  <div className="text-sm text-gray-400">Population: 675,218</div>
                </div>
                <div className="p-3 glass rounded-lg opacity-50 cursor-not-allowed">
                  <div className="font-medium">Coming Soon...</div>
                  <div className="text-sm text-gray-400">59 more cities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMenuOpen(false)}
          className="absolute inset-0 bg-black/50 z-25"
        />
      )}
    </>
  )
}
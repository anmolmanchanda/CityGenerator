'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  fps: number
  drawCalls: number
  triangles: number
  memory: number
  performanceMode: boolean
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    memory: 0,
    performanceMode: false
  })
  
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const updateMetrics = () => {
      // Get metrics from DOM elements updated by Three.js components
      const fpsElement = document.getElementById('fps-counter')
      const drawCallElement = document.getElementById('drawcall-counter')
      const triangleElement = document.getElementById('triangle-counter')
      const memoryElement = document.getElementById('memory-counter')
      const perfModeElement = document.getElementById('performance-mode')
      
      setMetrics({
        fps: fpsElement ? parseInt(fpsElement.textContent || '0') : 0,
        drawCalls: drawCallElement ? parseInt(drawCallElement.textContent || '0') : 0,
        triangles: triangleElement ? parseInt(triangleElement.textContent?.replace('k', '') || '0') : 0,
        memory: memoryElement ? parseInt(memoryElement.textContent?.replace('MB', '') || '0') : 0,
        performanceMode: perfModeElement ? perfModeElement.textContent === 'ON' : false
      })
    }
    
    const interval = setInterval(updateMetrics, 1000)
    return () => clearInterval(interval)
  }, [])
  
  // Show/hide with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'P' && e.ctrlKey) {
        setIsVisible(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])
  
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/50 text-white p-2 rounded text-xs">
        Press Ctrl+P to show performance metrics
      </div>
    )
  }
  
  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400'
    if (fps >= 30) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg font-mono text-sm space-y-2 min-w-64">
      <div className="text-lg font-bold text-blue-400 mb-2">Performance Monitor</div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-gray-400">FPS</div>
          <div className={`text-2xl font-bold ${getFPSColor(metrics.fps)}`}>
            {metrics.fps}
          </div>
        </div>
        
        <div>
          <div className="text-gray-400">Draw Calls</div>
          <div className="text-xl text-white">
            {metrics.drawCalls}
          </div>
        </div>
        
        <div>
          <div className="text-gray-400">Triangles</div>
          <div className="text-xl text-white">
            {metrics.triangles}k
          </div>
        </div>
        
        <div>
          <div className="text-gray-400">Memory</div>
          <div className="text-xl text-white">
            {metrics.memory}MB
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-600 pt-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Performance Mode</span>
          <span className={`font-bold ${metrics.performanceMode ? 'text-red-400' : 'text-green-400'}`}>
            {metrics.performanceMode ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
      
      <div className="border-t border-gray-600 pt-2 text-xs text-gray-400">
        <div>Optimizations Applied:</div>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Instanced building rendering</li>
          <li>4-level LOD system</li>
          <li>Reduced SSAO samples (8-12 vs 32)</li>
          <li>Optimized atmospheric particles (300 vs 2000)</li>
          <li>Adaptive quality based on FPS</li>
        </ul>
      </div>
      
      <div className="text-xs text-gray-500 text-center pt-2">
        Press Ctrl+P to hide
      </div>
      
      {/* Hidden elements for Three.js to update */}
      <div className="hidden">
        <div id="fps-counter">{metrics.fps}</div>
        <div id="drawcall-counter">{metrics.drawCalls}</div>
        <div id="triangle-counter">{metrics.triangles}k</div>
        <div id="memory-counter">{metrics.memory}MB</div>
        <div id="performance-mode">{metrics.performanceMode ? 'ON' : 'OFF'}</div>
      </div>
    </div>
  )
}
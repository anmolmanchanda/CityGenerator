import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { usePerformanceStore } from '@/lib/store'

export const usePerformanceMonitor = () => {
  const setFPS = usePerformanceStore((state) => state.setFPS)
  const setMemory = usePerformanceStore((state) => state.setMemory)
  const setRenderTime = usePerformanceStore((state) => state.setRenderTime)
  
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const renderStartTime = useRef(0)

  useFrame(() => {
    // FPS calculation
    frameCount.current++
    const currentTime = performance.now()
    
    if (currentTime >= lastTime.current + 1000) {
      const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current))
      setFPS(fps)
      frameCount.current = 0
      lastTime.current = currentTime
    }

    // Render time calculation
    if (renderStartTime.current > 0) {
      const renderTime = currentTime - renderStartTime.current
      setRenderTime(renderTime)
    }
    renderStartTime.current = currentTime
  })

  useEffect(() => {
    // Memory monitoring (Chrome/Edge only - fallback for other browsers)
    const updateMemory = () => {
      if (typeof window !== 'undefined' && 'memory' in performance) {
        try {
          const memory = (performance as any).memory
          if (memory && memory.usedJSHeapSize) {
            const usedMB = Math.round(memory.usedJSHeapSize / 1048576)
            setMemory(usedMB)
          }
        } catch (error) {
          // Silently fail if memory API is not available
          setMemory(0)
        }
      } else {
        // Set a placeholder value for browsers without memory API
        setMemory(0)
      }
    }

    const interval = setInterval(updateMemory, 2000)
    return () => clearInterval(interval)
  }, [setMemory])

  return usePerformanceStore((state) => ({
    fps: state.fps,
    memory: state.memory,
    renderTime: state.renderTime,
  }))
}
import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

interface LoadingStep {
  name: string
  weight: number // Relative weight for progress calculation
  duration?: number // Optional estimated duration in ms
}

const LOADING_STEPS: LoadingStep[] = [
  { name: 'Initializing 3D engine...', weight: 10, duration: 500 },
  { name: 'Loading building data...', weight: 30, duration: 1500 },
  { name: 'Processing geometries...', weight: 25, duration: 1000 },
  { name: 'Applying materials...', weight: 15, duration: 800 },
  { name: 'Setting up lighting...', weight: 10, duration: 600 },
  { name: 'Optimizing performance...', weight: 10, duration: 400 },
]

export const useLoadingManager = () => {
  const {
    isLoading,
    loadingProgress,
    loadingMessage,
    setLoading,
    setLoadingProgress,
    setLoadingMessage,
  } = useAppStore()

  const startLoading = () => {
    setLoading(true)
    setLoadingProgress(0)
    setLoadingMessage(LOADING_STEPS[0].name)
    
    // Simulate realistic loading progression
    simulateLoading()
  }

  const finishLoading = () => {
    setLoadingProgress(100)
    setLoadingMessage('Complete!')
    
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  const simulateLoading = () => {
    let currentStep = 0
    let currentProgress = 0
    
    const totalWeight = LOADING_STEPS.reduce((sum, step) => sum + step.weight, 0)
    
    const processStep = () => {
      if (currentStep >= LOADING_STEPS.length) {
        finishLoading()
        return
      }
      
      const step = LOADING_STEPS[currentStep]
      setLoadingMessage(step.name)
      
      const stepProgress = (step.weight / totalWeight) * 100
      const stepDuration = step.duration || 1000
      const progressIncrement = stepProgress / (stepDuration / 50) // Update every 50ms
      
      const stepInterval = setInterval(() => {
        currentProgress += progressIncrement
        setLoadingProgress(Math.min(currentProgress, 100))
        
        // Check if step is complete
        if (currentProgress >= (currentStep + 1) * (stepProgress + (currentStep * stepProgress))) {
          clearInterval(stepInterval)
          currentStep++
          
          setTimeout(() => {
            processStep()
          }, 100) // Small delay between steps
        }
      }, 50)
    }
    
    // Start the loading simulation
    setTimeout(processStep, 200)
  }

  // Auto-start loading when hook is first used
  useEffect(() => {
    if (!isLoading) {
      startLoading()
    }
  }, [])

  return {
    isLoading,
    loadingProgress,
    loadingMessage,
    startLoading,
    finishLoading,
  }
}
'use client'

import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import LoadingScreen from '@/components/LoadingScreen'
import ErrorBoundary from '@/components/ErrorBoundary'

// Dynamically import the 3D scene to avoid SSR issues
const CityScene = dynamic(() => import('@/components/CityScene'), {
  ssr: false,
  loading: () => <LoadingScreen />
})

const HeroUI = dynamic(() => import('@/components/HeroUI'), {
  ssr: false,
})

const PostProcessingControls = dynamic(() => import('@/components/PostProcessingControls'), {
  ssr: false,
})

const PerformanceMonitor = dynamic(() => import('@/components/PerformanceMonitor'), {
  ssr: false,
})

interface PostProcessingSettings {
  enabled: boolean
  quality: 'low' | 'medium' | 'high' | 'ultra'
}

export default function Home() {
  const [postProcessingSettings, setPostProcessingSettings] = useState<PostProcessingSettings>({
    enabled: true,
    quality: 'high'
  })

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <CityScene postProcessingSettings={postProcessingSettings} />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* UI Overlay */}
      <div className="ui-overlay absolute inset-0 z-10">
        <Suspense fallback={null}>
          <HeroUI />
        </Suspense>
      </div>

      {/* Post-processing Controls */}
      <Suspense fallback={null}>
        <PostProcessingControls onSettingsChange={setPostProcessingSettings} />
      </Suspense>

      {/* Enhanced Performance Monitor */}
      <Suspense fallback={null}>
        <PerformanceMonitor />
      </Suspense>
    </main>
  )
}
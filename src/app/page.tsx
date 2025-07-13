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

interface PostProcessingSettings {
  ssao: boolean
  depthOfField: boolean
  bloom: boolean
  chromaticAberration: boolean
  vignette: boolean
  colorGrading: boolean
}

export default function Home() {
  const [postProcessingSettings, setPostProcessingSettings] = useState<PostProcessingSettings>({
    ssao: true,
    depthOfField: true,
    bloom: true,
    chromaticAberration: true,
    vignette: true,
    colorGrading: true
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

      {/* Performance Stats (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-4 left-4 z-20 glass-dark p-3 rounded-lg text-xs font-mono"
        >
          <div className="text-green-400">FPS: <span id="fps-counter">60</span></div>
          <div className="text-blue-400">Memory: <span id="memory-counter">--</span></div>
          <div className="text-purple-400">Triangles: <span id="triangle-counter">--</span></div>
        </motion.div>
      )}
    </main>
  )
}
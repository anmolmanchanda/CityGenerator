'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls } from '@react-three/drei'
import { Vector3, Euler } from 'three'
import * as THREE from 'three'

interface CameraKeyframe {
  position: Vector3
  target: Vector3
  duration: number
}

export default function CinematicCamera() {
  const controlsRef = useRef<any>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const { camera } = useThree()
  
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [currentKeyframe, setCurrentKeyframe] = useState(0)
  const [keyframeProgress, setKeyframeProgress] = useState(0)

  // Define cinematic camera keyframes (drone-style movements)
  const keyframes: CameraKeyframe[] = [
    // Opening shot - extreme high overview (satellite view)
    {
      position: new Vector3(1500, 1200, 1500),
      target: new Vector3(0, 0, 0),
      duration: 5000
    },
    // Dramatic descent toward downtown core
    {
      position: new Vector3(800, 600, 800),
      target: new Vector3(100, 100, 100),
      duration: 3500
    },
    // Sweep low over False Creek
    {
      position: new Vector3(400, 80, -200),
      target: new Vector3(200, 20, -300),
      duration: 4000
    },
    // Climb and rotate around downtown towers
    {
      position: new Vector3(300, 250, 400),
      target: new Vector3(100, 150, 100),
      duration: 3000
    },
    // Fly toward Stanley Park with banking turn
    {
      position: new Vector3(-200, 180, 600),
      target: new Vector3(-400, 50, 400),
      duration: 3500
    },
    // Orbit around seawall area
    {
      position: new Vector3(-600, 120, 200),
      target: new Vector3(-400, 0, 400),
      duration: 4000
    },
    // Fast flyby over English Bay
    {
      position: new Vector3(-800, 150, 800),
      target: new Vector3(-600, 0, 800),
      duration: 2500
    },
    // Rise and reveal the full city panorama
    {
      position: new Vector3(200, 400, 1200),
      target: new Vector3(0, 50, 0),
      duration: 4500
    },
    // Final establishing shot - pull back to overview
    {
      position: new Vector3(1000, 800, 1000),
      target: new Vector3(0, 0, 0),
      duration: 5000
    }
  ]

  // Handle keyboard controls
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault()
          setIsAutoPlaying(prev => !prev)
          break
        case 'r':
          setCurrentKeyframe(0)
          setKeyframeProgress(0)
          break
        case 'arrowleft':
          setCurrentKeyframe(prev => Math.max(0, prev - 1))
          setKeyframeProgress(0)
          break
        case 'arrowright':
          setCurrentKeyframe(prev => Math.min(keyframes.length - 1, prev + 1))
          setKeyframeProgress(0)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [keyframes.length]) // Remove isAutoPlaying and currentKeyframe from dependencies to prevent re-binding

  // Smooth camera interpolation with enhanced cinematic effects
  useFrame((state, delta) => {
    if (!controlsRef.current || !isAutoPlaying) return

    const deltaMs = delta * 1000
    const currentKf = keyframes[currentKeyframe]
    const nextKf = keyframes[(currentKeyframe + 1) % keyframes.length]

    setKeyframeProgress(prev => {
      const newProgress = prev + deltaMs
      
      if (newProgress >= currentKf.duration) {
        // Move to next keyframe
        setCurrentKeyframe((currentKeyframe + 1) % keyframes.length)
        return 0
      }
      
      return newProgress
    })

    // Calculate interpolation factor with enhanced easing
    const t = keyframeProgress / currentKf.duration
    const easedT = easeInOutCubicSmooth(t)

    // Interpolate camera position and target
    const newPosition = new Vector3().lerpVectors(currentKf.position, nextKf.position, easedT)
    const newTarget = new Vector3().lerpVectors(currentKf.target, nextKf.target, easedT)

    // Add dynamic height variation for more organic movement
    const heightWave = Math.sin(state.clock.getElapsedTime() * 0.3) * 10
    newPosition.y += heightWave

    // Calculate movement direction for banking effect
    const prevPosition = camera.position.clone()
    const movementDirection = newPosition.clone().sub(prevPosition).normalize()
    const bankingAngle = movementDirection.x * 0.1 // Bank into turns

    // Apply banking by rotating the camera around its forward axis
    if (bankingAngle !== 0) {
      camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, bankingAngle, 0.1)
    }

    // Update camera position and target
    camera.position.copy(newPosition)
    controlsRef.current.target.copy(newTarget)
    controlsRef.current.update()

    // Enhanced camera effects based on movement speed and altitude
    const altitude = newPosition.y
    const speed = newPosition.distanceTo(prevPosition)
    
    // Altitude-based shake (more shake at lower altitudes)
    const altitudeShake = Math.max(0, (200 - altitude) / 200) * 0.3
    
    // Speed-based shake (more shake at higher speeds)
    const speedShake = Math.min(speed * 10, 1) * 0.2
    
    // Time-based organic movement
    const time = state.clock.getElapsedTime()
    const organicShake = Math.sin(time * 15) * 0.1
    
    if (isAutoPlaying) {
      const totalShake = altitudeShake + speedShake + organicShake
      camera.position.x += Math.sin(time * 12 + currentKeyframe) * totalShake
      camera.position.y += Math.cos(time * 10 + currentKeyframe) * totalShake * 0.5
      camera.position.z += Math.sin(time * 14 + currentKeyframe) * totalShake
      
      // Add slight target wobble for handheld camera effect
      const targetWobble = totalShake * 0.5
      controlsRef.current.target.x += Math.sin(time * 8) * targetWobble
      controlsRef.current.target.y += Math.cos(time * 6) * targetWobble * 0.3
      controlsRef.current.target.z += Math.sin(time * 9) * targetWobble
    }
  })

  // Enhanced easing functions for cinematic movement
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  const easeInOutCubicSmooth = (t: number): number => {
    // More gradual acceleration/deceleration for smoother drone movement
    const smoothed = t < 0.5 
      ? 2 * t * t * (3 - 2 * t) 
      : 1 - 2 * (1 - t) * (1 - t) * (3 - 2 * (1 - t))
    return smoothed
  }

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enabled={true}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={20}
        maxDistance={5000}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.1}
        dampingFactor={0.03}
        enableDamping={true}
        target={[0, 0, 0]}
        zoomSpeed={1.5}
        panSpeed={2.0}
        rotateSpeed={1.0}
      />
      
      {/* Camera mode indicator */}
      <group position={[0, 0, 0]}>
        {/* This will be rendered by the UI overlay */}
      </group>
    </>
  )
}
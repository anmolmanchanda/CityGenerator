'use client'

import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAppStore } from '@/lib/store'
import * as THREE from 'three'
import { Plane, Points } from '@react-three/drei'

interface OptimizedAtmosphericEffectsProps {
  enabled?: boolean
  intensity?: number
  performanceMode?: boolean
}

// Simplified volumetric fog shader for better performance
const optimizedFogVertexShader = `
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const optimizedFogFragmentShader = `
  uniform float time;
  uniform float density;
  uniform vec3 fogColor;
  uniform float sunIntensity;
  
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  
  // Simplified noise function - much faster
  float simpleNoise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  
  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = simpleNoise(i);
    float b = simpleNoise(i + vec2(1.0, 0.0));
    float c = simpleNoise(i + vec2(0.0, 1.0));
    float d = simpleNoise(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  void main() {
    // Distance-based fog
    float distance = length(cameraPosition - vWorldPosition);
    float distanceFactor = 1.0 - exp(-distance * density * 0.0002);
    
    // Simplified animated noise - single octave for performance
    vec2 noisePos = vWorldPosition.xz * 0.0003 + time * 0.01;
    float fogNoise = smoothNoise(noisePos) * 0.5 + 0.5;
    
    // Height-based fog density (simplified)
    float heightFactor = exp(-max(0.0, vWorldPosition.y) * 0.002);
    
    // Combine factors
    float finalDensity = heightFactor * distanceFactor * fogNoise;
    finalDensity = clamp(finalDensity, 0.0, 1.0);
    
    // Simple god rays effect
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float godRays = max(0.0, dot(viewDirection, normalize(vec3(1.0, 0.5, 1.0)))) * sunIntensity;
    godRays = pow(godRays, 4.0); // Simplified calculation
    
    // Final color
    vec3 finalColor = mix(fogColor, fogColor * 1.3, godRays * 0.5);
    
    gl_FragColor = vec4(finalColor, finalDensity * 0.6);
  }
`

// Optimized particle system with significantly reduced count
function OptimizedAtmosphericParticles({ 
  count = 300,  // Reduced from 2000 to 300
  spread = 4000,
  performanceMode = false 
}: { 
  count?: number
  spread?: number
  performanceMode?: boolean 
}) {
  const points = useRef<THREE.Points>(null)
  const { timeOfDay, weatherCondition } = useAppStore()
  
  // Further reduce count in performance mode
  const effectiveCount = performanceMode ? Math.floor(count / 2) : count
  
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(effectiveCount * 3)
    const velocities = new Float32Array(effectiveCount * 3)
    const sizes = new Float32Array(effectiveCount)
    
    for (let i = 0; i < effectiveCount; i++) {
      // Random positions
      positions[i * 3] = (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = Math.random() * 800 + 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread
      
      // Simplified velocities
      velocities[i * 3] = (Math.random() - 0.5) * 1
      velocities[i * 3 + 1] = -Math.random() * 3 - 1
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 1
      
      // Random sizes
      sizes[i] = Math.random() * 2 + 1
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    return geometry
  }, [effectiveCount, spread])
  
  const particleMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 1.5,
      transparent: true,
      opacity: 0.4,
      color: weatherCondition === 'rainy' ? 0x666666 : 0xffffff,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [weatherCondition])
  
  // Check weather condition before hooks
  const shouldShowParticles = weatherCondition === 'rainy' || weatherCondition === 'snowy' || weatherCondition === 'foggy'
  
  useFrame((state, delta) => {
    if (!points.current || !shouldShowParticles) return
    
    const positions = points.current.geometry.attributes.position.array as Float32Array
    const velocities = points.current.geometry.attributes.velocity.array as Float32Array
    
    // Simplified particle update with reduced frequency
    if (state.clock.elapsedTime % 0.1 < delta) { // Update every 100ms instead of every frame
      for (let i = 0; i < effectiveCount; i++) {
        const i3 = i * 3
        
        // Update positions
        positions[i3] += velocities[i3] * delta * 10
        positions[i3 + 1] += velocities[i3 + 1] * delta * 10
        positions[i3 + 2] += velocities[i3 + 2] * delta * 10
        
        // Reset particles that fall below ground
        if (positions[i3 + 1] < 0) {
          positions[i3] = (Math.random() - 0.5) * spread
          positions[i3 + 1] = 800 + Math.random() * 100
          positions[i3 + 2] = (Math.random() - 0.5) * spread
        }
      }
      
      points.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  // Only show particles in specific weather conditions
  if (!shouldShowParticles) {
    return null
  }
  
  return (
    <points ref={points} geometry={particleGeometry} material={particleMaterial} />
  )
}

// Simplified cloud shadows
function OptimizedCloudShadows({ performanceMode = false }: { performanceMode?: boolean }) {
  const cloudShadowRef = useRef<THREE.Mesh>(null)
  const { timeOfDay } = useAppStore()
  
  // Check performance mode before hooks
  const shouldRenderShadows = !performanceMode
  
  const cloudShadowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 0.2 },
        scale: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float opacity;
        varying vec2 vUv;
        
        // Simplified noise
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        void main() {
          vec2 cloudUv = vUv * 2.0 + time * 0.02;
          float cloudPattern = noise(cloudUv * 2.0) * 0.7;
          cloudPattern += noise(cloudUv * 4.0) * 0.3;
          
          float shadow = smoothstep(0.4, 0.8, cloudPattern);
          gl_FragColor = vec4(0.0, 0.0, 0.0, shadow * opacity);
        }
      `,
      transparent: true,
      depthWrite: false
    })
  }, [])
  
  useFrame((state, delta) => {
    if (!shouldRenderShadows) return
    
    if (cloudShadowMaterial.uniforms.time) {
      cloudShadowMaterial.uniforms.time.value += delta * 0.5 // Slower animation
    }
    
    // Adjust opacity based on time of day
    const isDaytime = timeOfDay >= 6 && timeOfDay <= 18
    const targetOpacity = isDaytime ? 0.2 : 0.05
    if (cloudShadowMaterial.uniforms.opacity) {
      cloudShadowMaterial.uniforms.opacity.value = THREE.MathUtils.lerp(
        cloudShadowMaterial.uniforms.opacity.value,
        targetOpacity,
        delta
      )
    }
  })
  
  if (!shouldRenderShadows) {
    return null
  }
  
  return (
    <Plane
      ref={cloudShadowRef}
      args={[8000, 8000]} // Reduced size
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 1, 0]}
      material={cloudShadowMaterial}
    />
  )
}

// Optimized volumetric fog
function OptimizedVolumetricFog({ 
  density = 1.0, 
  color = '#404080',
  performanceMode = false 
}: { 
  density?: number
  color?: string
  performanceMode?: boolean 
}) {
  const fogRef = useRef<THREE.Mesh>(null)
  const { timeOfDay, weatherCondition } = useAppStore()
  const { camera } = useThree()
  
  const fogMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        density: { value: density },
        fogColor: { value: new THREE.Color(color) },
        sunIntensity: { value: 1.0 }
      },
      vertexShader: optimizedFogVertexShader,
      fragmentShader: optimizedFogFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }, [density, color])
  
  useFrame((state, delta) => {
    if (fogMaterial.uniforms.time) {
      fogMaterial.uniforms.time.value += delta * 0.5 // Slower animation for performance
    }
    
    // Adjust fog density based on weather (less frequent updates)
    if (state.clock.elapsedTime % 0.5 < delta) { // Update every 500ms
      const weatherMultiplier = {
        clear: 0.3,
        cloudy: 0.7,
        rainy: 1.0,
        foggy: performanceMode ? 1.5 : 2.0, // Reduced in performance mode
        snowy: 0.8
      }[weatherCondition] || 0.5
      
      if (fogMaterial.uniforms.density) {
        fogMaterial.uniforms.density.value = density * weatherMultiplier
      }
      
      // Update sun intensity
      const sunIntensity = timeOfDay >= 6 && timeOfDay <= 18 ? 
        Math.sin((timeOfDay - 6) / 12 * Math.PI) : 0.1
      
      if (fogMaterial.uniforms.sunIntensity) {
        fogMaterial.uniforms.sunIntensity.value = sunIntensity
      }
    }
  })
  
  const fogSize = performanceMode ? 10000 : 12000 // Smaller in performance mode
  
  return (
    <Plane
      ref={fogRef}
      args={[fogSize, fogSize]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 80, 0]}
      material={fogMaterial}
    />
  )
}

export default function OptimizedAtmosphericEffects({ 
  enabled = true, 
  intensity = 1.0,
  performanceMode = false 
}: OptimizedAtmosphericEffectsProps) {
  const { weatherCondition, timeOfDay } = useAppStore()
  
  if (!enabled) {
    return null
  }
  
  return (
    <group>
      {/* Optimized Volumetric Fog */}
      <OptimizedVolumetricFog 
        density={intensity * (performanceMode ? 0.7 : 1.0)}
        color={timeOfDay < 6 || timeOfDay > 18 ? '#202040' : '#8090b0'}
        performanceMode={performanceMode}
      />
      
      {/* Optimized Cloud Shadows */}
      <OptimizedCloudShadows performanceMode={performanceMode} />
      
      {/* Optimized Atmospheric Particles */}
      <OptimizedAtmosphericParticles 
        count={performanceMode ? 150 : 300} // Further reduced counts
        spread={6000}
        performanceMode={performanceMode}
      />
    </group>
  )
}
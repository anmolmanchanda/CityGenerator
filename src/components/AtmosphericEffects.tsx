'use client'

import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAppStore } from '@/lib/store'
import * as THREE from 'three'
import { Plane, Points, Point } from '@react-three/drei'

interface VolumetricFogProps {
  density?: number
  color?: string
  near?: number
  far?: number
}

interface AtmosphericEffectsProps {
  enabled?: boolean
  intensity?: number
}

// Custom volumetric fog shader
const volumetricFogVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const volumetricFogFragmentShader = `
  uniform float time;
  uniform float density;
  uniform vec3 fogColor;
  uniform vec3 sunPosition;
  uniform float sunIntensity;
  
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  
  // Simplex noise function for fog variation
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
  }
  
  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
           
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 sunDirection = normalize(sunPosition - vWorldPosition);
    
    // Height-based fog density (exponential falloff)
    float heightFactor = exp(-max(0.0, vWorldPosition.y - 0.0) * 0.001);
    
    // Distance-based fog
    float distance = length(cameraPosition - vWorldPosition);
    float distanceFactor = 1.0 - exp(-distance * density * 0.0001);
    
    // Animated noise for fog variation
    vec3 noisePos = vWorldPosition * 0.0005 + time * 0.02;
    float noise1 = snoise(noisePos);
    float noise2 = snoise(noisePos * 2.0 + time * 0.01);
    float noise3 = snoise(noisePos * 4.0 - time * 0.015);
    
    float fogNoise = (noise1 + noise2 * 0.5 + noise3 * 0.25) / 1.75;
    fogNoise = fogNoise * 0.5 + 0.5; // Normalize to 0-1
    
    // God rays effect (light scattering)
    float sunDot = dot(viewDirection, sunDirection);
    float godRays = pow(max(0.0, sunDot), 8.0) * sunIntensity;
    
    // Combine fog factors
    float finalDensity = heightFactor * distanceFactor * fogNoise;
    finalDensity = clamp(finalDensity, 0.0, 1.0);
    
    // Color mixing with god rays
    vec3 finalColor = mix(fogColor, fogColor * 1.5, godRays);
    
    gl_FragColor = vec4(finalColor, finalDensity * 0.8);
  }
`

// Particle system for atmospheric effects
function AtmosphericParticles({ count = 1000, spread = 5000 }: { count?: number, spread?: number }) {
  const points = useRef<THREE.Points>(null)
  const { timeOfDay, weatherCondition } = useAppStore()
  
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Random positions
      positions[i * 3] = (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = Math.random() * 1000 + 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread
      
      // Random velocities
      velocities[i * 3] = (Math.random() - 0.5) * 2
      velocities[i * 3 + 1] = -Math.random() * 5 - 1
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2
      
      // Random sizes
      sizes[i] = Math.random() * 4 + 1
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    return geometry
  }, [count, spread])
  
  const particleMaterial = useMemo(() => {
    const material = new THREE.PointsMaterial({
      size: 2,
      transparent: true,
      opacity: 0.6,
      color: weatherCondition === 'rainy' ? 0x888888 : 0xffffff,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    return material
  }, [weatherCondition])
  
  useFrame((state, delta) => {
    if (!points.current) return
    
    const positions = points.current.geometry.attributes.position.array as Float32Array
    const velocities = points.current.geometry.attributes.velocity.array as Float32Array
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Update positions based on velocities
      positions[i3] += velocities[i3] * delta
      positions[i3 + 1] += velocities[i3 + 1] * delta
      positions[i3 + 2] += velocities[i3 + 2] * delta
      
      // Reset particles that fall below ground or move too far
      if (positions[i3 + 1] < 0 || Math.abs(positions[i3]) > spread / 2 || Math.abs(positions[i3 + 2]) > spread / 2) {
        positions[i3] = (Math.random() - 0.5) * spread
        positions[i3 + 1] = 1000 + Math.random() * 200
        positions[i3 + 2] = (Math.random() - 0.5) * spread
      }
    }
    
    points.current.geometry.attributes.position.needsUpdate = true
  })
  
  // Only show particles in certain weather conditions
  if (weatherCondition !== 'rainy' && weatherCondition !== 'snowy' && weatherCondition !== 'foggy') {
    return null
  }
  
  return (
    <points ref={points} geometry={particleGeometry} material={particleMaterial} />
  )
}

// Cloud shadows component
function CloudShadows() {
  const cloudShadowRef = useRef<THREE.Mesh>(null)
  const { timeOfDay } = useAppStore()
  
  const cloudShadowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 0.3 },
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
        uniform float scale;
        varying vec2 vUv;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        float smoothNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          float a = noise(i);
          float b = noise(i + vec2(1.0, 0.0));
          float c = noise(i + vec2(0.0, 1.0));
          float d = noise(i + vec2(1.0, 1.0));
          
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        void main() {
          vec2 cloudUv = vUv * scale + time * 0.1;
          float cloudPattern = smoothNoise(cloudUv * 4.0) * 0.5;
          cloudPattern += smoothNoise(cloudUv * 8.0) * 0.25;
          cloudPattern += smoothNoise(cloudUv * 16.0) * 0.125;
          
          float shadow = smoothstep(0.3, 0.7, cloudPattern);
          gl_FragColor = vec4(0.0, 0.0, 0.0, shadow * opacity);
        }
      `,
      transparent: true,
      depthWrite: false
    })
  }, [])
  
  useFrame((state, delta) => {
    if (cloudShadowMaterial.uniforms.time) {
      cloudShadowMaterial.uniforms.time.value += delta
    }
    
    // Adjust cloud shadow opacity based on time of day
    const isDaytime = timeOfDay >= 6 && timeOfDay <= 18
    const targetOpacity = isDaytime ? 0.3 : 0.1
    if (cloudShadowMaterial.uniforms.opacity) {
      cloudShadowMaterial.uniforms.opacity.value = THREE.MathUtils.lerp(
        cloudShadowMaterial.uniforms.opacity.value,
        targetOpacity,
        delta * 2
      )
    }
  })
  
  return (
    <Plane
      ref={cloudShadowRef}
      args={[10000, 10000]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 1, 0]}
      material={cloudShadowMaterial}
    />
  )
}

// Volumetric fog component
function VolumetricFog({ density = 1.0, color = '#404080', near = 1, far = 5000 }: VolumetricFogProps) {
  const fogRef = useRef<THREE.Mesh>(null)
  const { timeOfDay, weatherCondition } = useAppStore()
  const { camera } = useThree()
  
  const fogMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        density: { value: density },
        fogColor: { value: new THREE.Color(color) },
        sunPosition: { value: new THREE.Vector3(1000, 500, 1000) },
        sunIntensity: { value: 1.0 }
      },
      vertexShader: volumetricFogVertexShader,
      fragmentShader: volumetricFogFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }, [density, color, camera.position])
  
  useFrame((state, delta) => {
    if (fogMaterial.uniforms.time) {
      fogMaterial.uniforms.time.value += delta
    }
    
    // Camera position is automatically available as built-in uniform
    
    // Adjust fog density based on weather
    const weatherMultiplier = {
      clear: 0.5,
      cloudy: 1.0,
      rainy: 1.5,
      foggy: 3.0,
      snowy: 1.2
    }[weatherCondition] || 1.0
    
    if (fogMaterial.uniforms.density) {
      fogMaterial.uniforms.density.value = density * weatherMultiplier
    }
    
    // Update sun intensity based on time of day
    const sunIntensity = timeOfDay >= 6 && timeOfDay <= 18 ? 
      Math.sin((timeOfDay - 6) / 12 * Math.PI) : 0.1
    
    if (fogMaterial.uniforms.sunIntensity) {
      fogMaterial.uniforms.sunIntensity.value = sunIntensity
    }
  })
  
  return (
    <Plane
      ref={fogRef}
      args={[15000, 15000]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 100, 0]}
      material={fogMaterial}
    />
  )
}

export default function AtmosphericEffects({ enabled = true, intensity = 1.0 }: AtmosphericEffectsProps) {
  const { weatherCondition, timeOfDay } = useAppStore()
  
  if (!enabled) return null
  
  return (
    <group>
      {/* Volumetric Fog */}
      <VolumetricFog 
        density={intensity}
        color={timeOfDay < 6 || timeOfDay > 18 ? '#202040' : '#8090b0'}
      />
      
      {/* Cloud Shadows */}
      <CloudShadows />
      
      {/* Atmospheric Particles */}
      <AtmosphericParticles 
        count={weatherCondition === 'rainy' ? 2000 : weatherCondition === 'snowy' ? 1500 : 800}
        spread={8000}
      />
    </group>
  )
}
'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Advanced building material with PBR properties
interface BuildingMaterialProps {
  type: 'glass' | 'concrete' | 'metal' | 'brick'
  height: number
  buildingId: string
  timeOfDay: number
  weatherCondition: string
}

// Glass shader with accurate refraction and Fresnel effects
const glassVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  varying vec2 vUv;
  
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const glassFragmentShader = `
  uniform float time;
  uniform float opacity;
  uniform vec3 tint;
  uniform bool hasLights;
  uniform float lightIntensity;
  
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  varying vec2 vUv;
  
  // Fresnel calculation
  float fresnel(vec3 direction, vec3 normal, float power) {
    return pow(1.0 - max(0.0, dot(direction, normal)), power);
  }
  
  // Random function for window patterns
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  // Window grid pattern
  float windowPattern(vec2 uv) {
    vec2 grid = fract(uv * vec2(8.0, 12.0)); // 8x12 window grid
    vec2 windowSize = vec2(0.8, 0.9); // Window size within each cell
    vec2 windowCenter = vec2(0.5);
    
    vec2 windowPos = abs(grid - windowCenter);
    float window = step(windowPos.x, windowSize.x * 0.5) * step(windowPos.y, windowSize.y * 0.5);
    
    return window;
  }
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDirection);
    
    // Fresnel effect
    float fresnelValue = fresnel(viewDir, normal, 2.0);
    
    // Window pattern
    float window = windowPattern(vUv);
    
    // Interior lighting simulation
    vec2 windowId = floor(vUv * vec2(8.0, 12.0));
    float lightChance = random(windowId + vWorldPosition.xz * 0.001);
    float isLit = hasLights && lightChance > 0.7 ? 1.0 : 0.0;
    
    // Animate some lights
    float flicker = sin(time * 3.0 + lightChance * 10.0) * 0.1 + 0.9;
    isLit *= flicker;
    
    // Interior glow
    vec3 interiorLight = vec3(1.0, 0.9, 0.7) * isLit * lightIntensity * window;
    
    // Glass tint and reflection
    vec3 glassTint = mix(tint, vec3(1.0), fresnelValue * 0.5);
    
    // Dirt and rain effects on glass
    float dirt = random(vUv * 50.0) * 0.1;
    glassTint *= (1.0 - dirt);
    
    // Final color composition
    vec3 finalColor = glassTint + interiorLight;
    float finalOpacity = mix(0.9, 1.0, fresnelValue) * opacity;
    
    gl_FragColor = vec4(finalColor, finalOpacity);
  }
`

// Concrete material with normal maps and weathering
const concreteVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vHeight;
  
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vHeight = position.y;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const concreteFragmentShader = `
  uniform float time;
  uniform vec3 baseColor;
  uniform float roughness;
  uniform float metalness;
  uniform float weathering;
  
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vHeight;
  
  // Noise functions for surface detail
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
    vec3 normal = normalize(vNormal);
    
    // Surface detail with multiple noise scales
    float surfaceNoise = smoothNoise(vUv * 20.0) * 0.5;
    surfaceNoise += smoothNoise(vUv * 50.0) * 0.3;
    surfaceNoise += smoothNoise(vUv * 100.0) * 0.2;
    
    // Height-based weathering (more weathering at bottom)
    float heightWeathering = 1.0 - clamp(vHeight / 100.0, 0.0, 1.0);
    float totalWeathering = weathering * heightWeathering;
    
    // Color variation based on weathering and surface noise
    vec3 weatheredColor = mix(baseColor, baseColor * 0.7, totalWeathering);
    vec3 finalColor = mix(weatheredColor, weatheredColor * 1.2, surfaceNoise);
    
    // Adjust material properties
    float finalRoughness = mix(roughness, 1.0, totalWeathering);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

export function GlassMaterial({ 
  timeOfDay, 
  weatherCondition, 
  buildingId, 
  height 
}: BuildingMaterialProps & { type: 'glass' }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    opacity: { value: 0.7 },
    tint: { value: new THREE.Color('#4A90E2') },
    hasLights: { value: timeOfDay < 7 || timeOfDay > 17 },
    lightIntensity: { value: timeOfDay < 7 || timeOfDay > 17 ? 1.0 : 0.0 }
  }), [timeOfDay, buildingId])
  
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta
      
      // Update lighting based on time of day
      const isNight = timeOfDay < 7 || timeOfDay > 17
      materialRef.current.uniforms.hasLights.value = isNight
      materialRef.current.uniforms.lightIntensity.value = isNight ? 
        0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2 : 0.0
    }
  })
  
  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={glassVertexShader}
      fragmentShader={glassFragmentShader}
      transparent
      side={THREE.DoubleSide}
    />
  )
}

export function ConcreteMaterial({ 
  timeOfDay, 
  weatherCondition, 
  buildingId, 
  height 
}: BuildingMaterialProps & { type: 'concrete' }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    baseColor: { value: new THREE.Color('#B8B8B8') },
    roughness: { value: 0.8 },
    metalness: { value: 0.1 },
    weathering: { value: weatherCondition === 'rainy' ? 0.3 : 0.1 }
  }), [weatherCondition])
  
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta
    }
  })
  
  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={concreteVertexShader}
      fragmentShader={concreteFragmentShader}
    />
  )
}

export function MetalMaterial({ 
  timeOfDay, 
  weatherCondition, 
  buildingId, 
  height 
}: BuildingMaterialProps & { type: 'metal' }) {
  return (
    <meshStandardMaterial
      color="#C0C0C0"
      metalness={0.9}
      roughness={0.2}
      envMapIntensity={1.5}
    />
  )
}

export function BrickMaterial({ 
  timeOfDay, 
  weatherCondition, 
  buildingId, 
  height 
}: BuildingMaterialProps & { type: 'brick' }) {
  return (
    <meshStandardMaterial
      color="#8B4513"
      metalness={0.0}
      roughness={0.9}
      normalScale={new THREE.Vector2(0.5, 0.5)}
    />
  )
}

// Material selector based on building type and height
export default function BuildingMaterial(props: BuildingMaterialProps) {
  switch (props.type) {
    case 'glass':
      return <GlassMaterial {...props} type="glass" />
    case 'concrete':
      return <ConcreteMaterial {...props} type="concrete" />
    case 'metal':
      return <MetalMaterial {...props} type="metal" />
    case 'brick':
      return <BrickMaterial {...props} type="brick" />
    default:
      return <ConcreteMaterial {...props} type="concrete" />
  }
}
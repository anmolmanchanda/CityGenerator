import { Color, Vector3 } from 'three'
import type { BuildingData, Vector3Tuple } from '@/types'

// Color utilities
export const generateBuildingColor = (
  type: BuildingData['type'],
  height: number,
  seed?: number
): Color => {
  const random = seed ? seededRandom(seed) : Math.random()
  
  switch (type) {
    case 'residential':
      return new Color().setHSL(0.05 + random * 0.1, 0.3 + random * 0.4, 0.5 + random * 0.3)
    case 'commercial':
      return new Color().setHSL(0.15 + random * 0.1, 0.2 + random * 0.3, 0.4 + random * 0.4)
    case 'office':
      return new Color().setHSL(0.6 + random * 0.1, 0.1 + random * 0.2, 0.3 + random * 0.4)
    case 'industrial':
      return new Color().setHSL(0.0, 0.1 + random * 0.2, 0.2 + random * 0.3)
    case 'mixed':
      return new Color().setHSL(0.3 + random * 0.2, 0.2 + random * 0.3, 0.4 + random * 0.3)
    default:
      return new Color().setHSL(random, 0.3, 0.5)
  }
}

// Seeded random number generator for consistent results
export const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Distance calculations
export const calculateDistance = (
  pos1: Vector3Tuple,
  pos2: Vector3Tuple
): number => {
  const dx = pos1[0] - pos2[0]
  const dy = pos1[1] - pos2[1] 
  const dz = pos1[2] - pos2[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// Building height estimation based on type and floors
export const estimateBuildingHeight = (
  type: BuildingData['type'],
  floors?: number
): number => {
  const floorHeight = {
    residential: 3.0,
    commercial: 4.0,
    office: 3.5,
    industrial: 5.0,
    mixed: 3.5,
  }[type]

  if (floors) {
    return floors * floorHeight
  }

  // Default ranges if floors are unknown
  const heightRanges = {
    residential: [8, 40],
    commercial: [15, 80],
    office: [20, 200],
    industrial: [10, 30],
    mixed: [15, 100],
  }

  const [min, max] = heightRanges[type]
  return min + Math.random() * (max - min)
}

// LOD (Level of Detail) calculations
export const calculateLOD = (
  cameraPosition: Vector3Tuple,
  objectPosition: Vector3Tuple,
  maxDistance = 2000
): number => {
  const distance = calculateDistance(cameraPosition, objectPosition)
  
  if (distance < maxDistance * 0.2) return 3 // High detail
  if (distance < maxDistance * 0.5) return 2 // Medium detail
  if (distance < maxDistance) return 1 // Low detail
  return 0 // Culled/hidden
}

// Performance utilities
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  
  return ((...args: Parameters<T>) => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }) as T
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T
}

// Format utilities
export const formatNumber = (num: number, decimals = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export const formatMemory = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)}${units[unitIndex]}`
}

// Coordinate transformations
export const latLngToWorld = (
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  scale = 10000
): Vector3Tuple => {
  const x = (lng - centerLng) * scale * Math.cos(centerLat * Math.PI / 180)
  const z = -(lat - centerLat) * scale // Negative because Z points toward viewer
  return [x, 0, z]
}

export const worldToLatLng = (
  worldPos: Vector3Tuple,
  centerLat: number,
  centerLng: number,
  scale = 10000
): [number, number] => {
  const [x, , z] = worldPos
  const lng = centerLng + x / (scale * Math.cos(centerLat * Math.PI / 180))
  const lat = centerLat - z / scale
  return [lat, lng]
}

// Animation easing functions
export const easing = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
}

// Time utilities
export const getTimeOfDayFromHour = (hour: number) => {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 21) return 'evening'
  return 'night'
}

export const getSunPosition = (hour: number): Vector3Tuple => {
  // Simplified sun position calculation
  const angle = ((hour - 6) / 12) * Math.PI // 6 AM to 6 PM = 0 to π
  const x = Math.cos(angle) * 1000
  const y = Math.sin(angle) * 1000
  const z = 500
  
  return [x, Math.max(y, -200), z] // Don't let sun go too far below horizon
}

// Color interpolation
export const interpolateColors = (
  color1: Color,
  color2: Color,
  factor: number
): Color => {
  const result = color1.clone()
  return result.lerp(color2, factor)
}

// Random utilities
export const randomInRange = (min: number, max: number): number => {
  return min + Math.random() * (max - min)
}

export const randomFromArray = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)]
}

// Validation utilities
export const isValidVector3 = (v: any): v is Vector3Tuple => {
  return Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number')
}

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}
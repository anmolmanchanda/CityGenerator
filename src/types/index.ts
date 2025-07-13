// City Data Types
export interface BuildingData {
  id: string
  position: [number, number, number]
  scale: [number, number, number]
  color?: string
  type: 'residential' | 'commercial' | 'office' | 'industrial' | 'mixed'
  height: number
  floors?: number
  yearBuilt?: number
  address?: string
  metadata?: Record<string, any>
}

export interface CityData {
  id: string
  name: string
  country: string
  coordinates: {
    lat: number
    lng: number
  }
  buildings: BuildingData[]
  landmarks: LandmarkData[]
  waterBodies: WaterBodyData[]
  greenSpaces: GreenSpaceData[]
  population?: number
  area?: number
  timezone?: string
}

export interface LandmarkData {
  id: string
  name: string
  position: [number, number, number]
  type: 'monument' | 'bridge' | 'tower' | 'stadium' | 'other'
  scale: [number, number, number]
  description?: string
}

export interface WaterBodyData {
  id: string
  name: string
  type: 'river' | 'lake' | 'bay' | 'ocean' | 'creek'
  coordinates: Array<[number, number]>
  depth?: number
}

export interface GreenSpaceData {
  id: string
  name: string
  type: 'park' | 'forest' | 'garden' | 'plaza'
  coordinates: Array<[number, number]>
  area?: number
}

// Camera and Controls
export interface CameraState {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  mode: 'cinematic' | 'free' | 'street' | 'drone'
}

export interface CameraKeyframe {
  position: [number, number, number]
  target: [number, number, number]
  duration: number
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

// UI State
export interface UIState {
  isLoading: boolean
  loadingProgress: number
  loadingMessage: string
  selectedBuilding?: BuildingData
  activeCity: string
  isMenuOpen: boolean
  showStats: boolean
  timeOfDay: number // 0-24 hours
  weatherCondition: 'clear' | 'cloudy' | 'rainy' | 'foggy' | 'snowy'
}

// Performance Metrics
export interface PerformanceMetrics {
  fps: number
  memory: number
  triangles: number
  drawCalls: number
  renderTime: number
}

// Quality of Life Data (for data overlays)
export interface QualityOfLifeData {
  cityId: string
  scores: {
    overall: number
    environment: number
    economy: number
    education: number
    healthcare: number
    safety: number
    culture: number
    mobility: number
    housing: number
  }
  lastUpdated: string
}

// Settings and Configuration
export interface AppSettings {
  graphics: {
    quality: 'low' | 'medium' | 'high' | 'ultra'
    shadows: boolean
    postProcessing: boolean
    antialiasing: boolean
    vsync: boolean
  }
  camera: {
    fieldOfView: number
    mouseSensitivity: number
    autoRotate: boolean
    dampingFactor: number
  }
  audio: {
    masterVolume: number
    ambientSounds: boolean
    uiSounds: boolean
  }
  accessibility: {
    reducedMotion: boolean
    highContrast: boolean
    fontSize: 'small' | 'medium' | 'large'
  }
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface CityLoadResponse {
  city: CityData
  qualityOfLife?: QualityOfLifeData
  lastModified: string
}

// Events
export interface CityEvent {
  type: 'building-click' | 'camera-move' | 'time-change' | 'weather-change'
  timestamp: number
  data: any
}

// Store Types (for Zustand)
export interface AppStore extends UIState {
  // Actions
  setLoading: (loading: boolean) => void
  setLoadingProgress: (progress: number) => void
  setLoadingMessage: (message: string) => void
  selectBuilding: (building: BuildingData | undefined) => void
  setActiveCity: (cityId: string) => void
  toggleMenu: () => void
  setTimeOfDay: (time: number) => void
  setWeatherCondition: (condition: UIState['weatherCondition']) => void
}

// Utility Types
export type Vector3Tuple = [number, number, number]
export type ColorTuple = [number, number, number]
export type PositionTuple = Vector3Tuple
export type ScaleTuple = Vector3Tuple
export type RotationTuple = Vector3Tuple
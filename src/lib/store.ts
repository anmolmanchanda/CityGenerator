import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AppStore, BuildingData } from '@/types'

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      isLoading: true,
      loadingProgress: 0,
      loadingMessage: 'Initializing...',
      selectedBuilding: undefined,
      activeCity: 'vancouver',
      isMenuOpen: false,
      showStats: process.env.NODE_ENV === 'development',
      timeOfDay: 12, // Noon by default
      weatherCondition: 'clear',

      // Actions
      setLoading: (loading: boolean) => 
        set({ isLoading: loading }, false, 'setLoading'),

      setLoadingProgress: (progress: number) => 
        set({ loadingProgress: progress }, false, 'setLoadingProgress'),

      setLoadingMessage: (message: string) => 
        set({ loadingMessage: message }, false, 'setLoadingMessage'),

      selectBuilding: (building: BuildingData | undefined) => 
        set({ selectedBuilding: building }, false, 'selectBuilding'),

      setActiveCity: (cityId: string) => 
        set({ activeCity: cityId }, false, 'setActiveCity'),

      toggleMenu: () => 
        set((state) => ({ isMenuOpen: !state.isMenuOpen }), false, 'toggleMenu'),

      setTimeOfDay: (time: number) => 
        set({ timeOfDay: Math.max(0, Math.min(24, time)) }, false, 'setTimeOfDay'),

      setWeatherCondition: (condition: AppStore['weatherCondition']) => 
        set({ weatherCondition: condition }, false, 'setWeatherCondition'),
    }),
    {
      name: 'city-generator-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

// Selectors for performance optimization
export const useLoadingState = () => useAppStore((state) => ({
  isLoading: state.isLoading,
  progress: state.loadingProgress,
  message: state.loadingMessage,
}))

export const useCameraState = () => useAppStore((state) => ({
  timeOfDay: state.timeOfDay,
  weatherCondition: state.weatherCondition,
}))

export const useUIState = () => useAppStore((state) => ({
  isMenuOpen: state.isMenuOpen,
  selectedBuilding: state.selectedBuilding,
  activeCity: state.activeCity,
}))

// Performance store for development metrics
interface PerformanceStore {
  fps: number
  memory: number
  triangles: number
  renderTime: number
  setFPS: (fps: number) => void
  setMemory: (memory: number) => void
  setTriangles: (triangles: number) => void
  setRenderTime: (time: number) => void
}

export const usePerformanceStore = create<PerformanceStore>()(
  devtools(
    (set) => ({
      fps: 60,
      memory: 0,
      triangles: 0,
      renderTime: 0,

      setFPS: (fps: number) => set({ fps }, false, 'setFPS'),
      setMemory: (memory: number) => set({ memory }, false, 'setMemory'),
      setTriangles: (triangles: number) => set({ triangles }, false, 'setTriangles'),
      setRenderTime: (time: number) => set({ renderTime: time }, false, 'setRenderTime'),
    }),
    {
      name: 'performance-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

// City data store for managing loaded cities
interface CityStore {
  cities: Record<string, any>
  currentCity: string | null
  loadedCities: Set<string>
  loadCity: (cityId: string, cityData: any) => void
  setCurrentCity: (cityId: string) => void
  isCityLoaded: (cityId: string) => boolean
}

export const useCityStore = create<CityStore>()(
  devtools(
    (set, get) => ({
      cities: {},
      currentCity: null,
      loadedCities: new Set(),

      loadCity: (cityId: string, cityData: any) =>
        set(
          (state) => ({
            cities: { ...state.cities, [cityId]: cityData },
            loadedCities: new Set([...state.loadedCities, cityId]),
          }),
          false,
          'loadCity'
        ),

      setCurrentCity: (cityId: string) =>
        set({ currentCity: cityId }, false, 'setCurrentCity'),

      isCityLoaded: (cityId: string) => get().loadedCities.has(cityId),
    }),
    {
      name: 'city-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)
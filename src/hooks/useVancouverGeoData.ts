import { useState, useEffect } from 'react'
import { loadVancouverBuildingsFromGeoJSON, ParsedBuilding, loadVancouverParks, loadVancouverWater, loadVancouverZoning } from '@/lib/geoJsonLoader'

interface UseVancouverGeoDataOptions {
  maxBuildings?: number
  enableParks?: boolean
  enableWater?: boolean
  enableZoning?: boolean
}

interface VancouverGeoData {
  buildings: ParsedBuilding[]
  parks: any[]
  water: any[]
  zoning: any[]
  loading: boolean
  error: string | null
  progress: number
}

export function useVancouverGeoData(options: UseVancouverGeoDataOptions = {}): VancouverGeoData {
  const {
    maxBuildings = 500, // Emergency reduction for performance
    enableParks = false, // Disable for initial load performance
    enableWater = false, // Disable for initial load performance
    enableZoning = false // Zoning data not essential for rendering
  } = options
  
  const [data, setData] = useState<VancouverGeoData>({
    buildings: [],
    parks: [],
    water: [],
    zoning: [],
    loading: true,
    error: null,
    progress: 0
  })
  
  useEffect(() => {
    let isCancelled = false
    
    async function loadGeoData() {
      try {
        setData(prev => ({ ...prev, loading: true, error: null, progress: 0 }))
        
        // Load buildings first (most important)
        setData(prev => ({ ...prev, progress: 10 }))
        const buildings = await loadVancouverBuildingsFromGeoJSON(maxBuildings)
        
        if (isCancelled) return
        
        setData(prev => ({ 
          ...prev, 
          buildings, 
          progress: 50 
        }))
        
        // Load additional datasets in parallel
        const promises: Promise<any>[] = []
        
        if (enableParks) {
          promises.push(loadVancouverParks())
        }
        
        if (enableWater) {
          promises.push(loadVancouverWater())
        }
        
        if (enableZoning) {
          promises.push(loadVancouverZoning())
        }
        
        if (promises.length > 0) {
          setData(prev => ({ ...prev, progress: 70 }))
          
          const results = await Promise.allSettled(promises)
          
          if (isCancelled) return
          
          let parks: any[] = []
          let water: any[] = []
          let zoning: any[] = []
          
          let resultIndex = 0
          
          if (enableParks) {
            const parkResult = results[resultIndex++]
            if (parkResult.status === 'fulfilled') {
              parks = parkResult.value
            }
          }
          
          if (enableWater) {
            const waterResult = results[resultIndex++]
            if (waterResult.status === 'fulfilled') {
              water = waterResult.value
            }
          }
          
          if (enableZoning) {
            const zoningResult = results[resultIndex++]
            if (zoningResult.status === 'fulfilled') {
              zoning = zoningResult.value
            }
          }
          
          setData(prev => ({
            ...prev,
            parks,
            water,
            zoning,
            progress: 100,
            loading: false
          }))
        } else {
          setData(prev => ({
            ...prev,
            progress: 100,
            loading: false
          }))
        }
        
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load Vancouver geo data:', error)
          setData(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Failed to load geo data',
            loading: false
          }))
        }
      }
    }
    
    loadGeoData()
    
    return () => {
      isCancelled = true
    }
  }, [maxBuildings, enableParks, enableWater, enableZoning])
  
  return data
}

// Hook specifically for building data with fallback
export function useVancouverBuildings() {
  const [fallbackActive, setFallbackActive] = useState(true) // Use fallback immediately for performance
  const geoData = useVancouverGeoData({ 
    maxBuildings: 200, // Ultra-reduced for immediate performance
    enableParks: false,
    enableWater: false,
    enableZoning: false
  })
  
  // Generate fallback data if GeoJSON fails
  const fallbackBuildings = useState(() => {
    if (geoData.error && !fallbackActive) {
      setFallbackActive(true)
      return generateFallbackBuildings()
    }
    return []
  })[0]
  
  return {
    buildings: fallbackActive ? generateFallbackBuildings() : geoData.buildings,
    loading: false, // Skip GeoJSON loading for immediate performance
    error: null,
    usingFallback: true // Always use fallback for performance
  }
}

// Generate fallback building data if GeoJSON fails
function generateFallbackBuildings(): ParsedBuilding[] {
  const buildings: ParsedBuilding[] = []
  const buildingCount = 300 // Emergency reduction for performance
  
  for (let i = 0; i < buildingCount; i++) {
    const x = (Math.random() - 0.5) * 8000
    const z = (Math.random() - 0.5) * 8000
    
    // Distance from center affects building height
    const distanceFromCenter = Math.sqrt(x * x + z * z)
    const heightMultiplier = Math.max(0.2, 1 - distanceFromCenter / 4000)
    
    const height = Math.random() * 200 * heightMultiplier + 10
    const width = Math.random() * 30 + 10
    const depth = Math.random() * 30 + 10
    
    let type = 'residential'
    if (height > 100) type = 'office'
    else if (height > 50) type = 'commercial'
    else if (width > 40 || depth > 40) type = 'industrial'
    
    buildings.push({
      id: `fallback_${i}`,
      position: [x, height / 2, z],
      scale: [width, height, depth],
      type,
      height,
      footprint: [
        [x - width/2, z - depth/2],
        [x + width/2, z - depth/2],
        [x + width/2, z + depth/2],
        [x - width/2, z + depth/2]
      ],
      roofType: height > 50 ? 'Flat' : 'Pitched',
      orientation: Math.random() * Math.PI * 2
    })
  }
  
  return buildings.sort((a, b) => b.height - a.height)
}
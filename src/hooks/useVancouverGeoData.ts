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

// Generate comprehensive Vancouver building data with realistic layout
function generateFallbackBuildings(): ParsedBuilding[] {
  const buildings: ParsedBuilding[] = []
  
  // Downtown core - High density, tall buildings
  generateBuildingCluster(buildings, 'downtown', 0, 0, 1500, 400, {
    count: 200,
    heightRange: [50, 300],
    widthRange: [20, 60],
    depthRange: [20, 60],
    density: 0.7,
    typeDistribution: { office: 0.6, commercial: 0.3, mixed: 0.1 }
  })
  
  // West End - Mid-rise residential
  generateBuildingCluster(buildings, 'westend', -800, 600, 800, 600, {
    count: 300,
    heightRange: [25, 80],
    widthRange: [15, 40],
    depthRange: [15, 40],
    density: 0.6,
    typeDistribution: { residential: 0.7, commercial: 0.2, mixed: 0.1 }
  })
  
  // Yaletown - Mixed development
  generateBuildingCluster(buildings, 'yaletown', 400, -400, 600, 400, {
    count: 180,
    heightRange: [30, 120],
    widthRange: [18, 45],
    depthRange: [18, 45],
    density: 0.5,
    typeDistribution: { residential: 0.4, commercial: 0.3, office: 0.3 }
  })
  
  // Kitsilano - Low-rise residential
  generateBuildingCluster(buildings, 'kitsilano', -1200, -800, 1000, 600, {
    count: 400,
    heightRange: [8, 35],
    widthRange: [12, 25],
    depthRange: [12, 25],
    density: 0.4,
    typeDistribution: { residential: 0.8, commercial: 0.2 }
  })
  
  // Commercial Drive area
  generateBuildingCluster(buildings, 'commercial', 1200, 800, 800, 800, {
    count: 350,
    heightRange: [10, 45],
    widthRange: [14, 30],
    depthRange: [14, 30],
    density: 0.5,
    typeDistribution: { residential: 0.6, commercial: 0.4 }
  })
  
  // Richmond suburbs
  generateBuildingCluster(buildings, 'richmond', 0, -2000, 2000, 800, {
    count: 600,
    heightRange: [6, 25],
    widthRange: [10, 20],
    depthRange: [10, 20],
    density: 0.3,
    typeDistribution: { residential: 0.9, commercial: 0.1 }
  })
  
  // Burnaby heights
  generateBuildingCluster(buildings, 'burnaby', 1800, 0, 1200, 1200, {
    count: 450,
    heightRange: [8, 40],
    widthRange: [12, 28],
    depthRange: [12, 28],
    density: 0.4,
    typeDistribution: { residential: 0.7, commercial: 0.3 }
  })
  
  return buildings.sort((a, b) => b.height - a.height)
}

// Helper function to generate building clusters for different Vancouver neighborhoods
function generateBuildingCluster(
  buildings: ParsedBuilding[], 
  prefix: string, 
  centerX: number, 
  centerZ: number, 
  width: number, 
  depth: number, 
  config: {
    count: number
    heightRange: [number, number]
    widthRange: [number, number]
    depthRange: [number, number]
    density: number
    typeDistribution: { [key: string]: number }
  }
) {
  const { count, heightRange, widthRange, depthRange, density, typeDistribution } = config
  
  for (let i = 0; i < count; i++) {
    // Grid-based placement with some randomness
    const gridX = (i % Math.sqrt(count)) / Math.sqrt(count)
    const gridZ = Math.floor(i / Math.sqrt(count)) / Math.sqrt(count)
    
    const x = centerX + (gridX - 0.5) * width + (Math.random() - 0.5) * 100
    const z = centerZ + (gridZ - 0.5) * depth + (Math.random() - 0.5) * 100
    
    // Skip some buildings based on density
    if (Math.random() > density) continue
    
    const height = heightRange[0] + Math.random() * (heightRange[1] - heightRange[0])
    const buildingWidth = widthRange[0] + Math.random() * (widthRange[1] - widthRange[0])
    const buildingDepth = depthRange[0] + Math.random() * (depthRange[1] - depthRange[0])
    
    // Determine building type based on distribution
    let type = 'residential'
    const rand = Math.random()
    let cumulative = 0
    for (const [buildingType, probability] of Object.entries(typeDistribution)) {
      cumulative += probability
      if (rand <= cumulative) {
        type = buildingType
        break
      }
    }
    
    buildings.push({
      id: `${prefix}_${i}`,
      position: [x, height / 2, z],
      scale: [buildingWidth, height, buildingDepth],
      type,
      height,
      footprint: [
        [x - buildingWidth/2, z - buildingDepth/2],
        [x + buildingWidth/2, z - buildingDepth/2],
        [x + buildingWidth/2, z + buildingDepth/2],
        [x - buildingWidth/2, z + buildingDepth/2]
      ],
      roofType: height > 50 ? 'Flat' : 'Pitched',
      orientation: Math.random() * Math.PI * 2
    })
  }
}
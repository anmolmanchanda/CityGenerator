import * as THREE from 'three'

// GeoJSON feature structure for Vancouver buildings
interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    coordinates: number[][][]
    type: 'Polygon'
  }
  properties: {
    hgt_agl: number      // Height above ground level
    area_m2: number      // Area in square meters
    geo_point_2d: [number, number]  // [lat, lng]
    maxht_m: number      // Maximum height in meters
    baseelev_m: number   // Base elevation
    bldgid: number       // Building ID
    rooftype: string     // Roof type (Flat, Pitched, Complex)
    topelev_m: number    // Top elevation
    avght_m: number      // Average height
    orient8: number      // Orientation
    len: number          // Length
    wid: number          // Width
  }
}

interface GeoJSONData {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

interface ParsedBuilding {
  id: string
  position: [number, number, number]
  scale: [number, number, number]
  type: string
  height: number
  footprint: number[][]
  roofType: string
  orientation: number
}

// Vancouver coordinate bounds for conversion
const VANCOUVER_BOUNDS = {
  minLat: 49.2,
  maxLat: 49.3,
  minLng: -123.25,
  maxLng: -123.0,
  // Convert to world coordinates (centered at origin)
  worldSize: 10000 // 10km x 10km world
}

// Convert lat/lng to Three.js world coordinates
function latLngToWorld(lat: number, lng: number): [number, number] {
  const normalizedX = (lng - VANCOUVER_BOUNDS.minLng) / (VANCOUVER_BOUNDS.maxLng - VANCOUVER_BOUNDS.minLng)
  const normalizedZ = (lat - VANCOUVER_BOUNDS.minLat) / (VANCOUVER_BOUNDS.maxLat - VANCOUVER_BOUNDS.minLat)
  
  const worldX = (normalizedX - 0.5) * VANCOUVER_BOUNDS.worldSize
  const worldZ = (normalizedZ - 0.5) * VANCOUVER_BOUNDS.worldSize
  
  return [worldX, worldZ]
}

// Determine building type from height and roof type
function determineBuildingType(height: number, roofType: string, area: number): string {
  if (height > 100) {
    return 'office'
  } else if (height > 50) {
    return roofType === 'Flat' ? 'commercial' : 'office'
  } else if (height > 20) {
    return roofType === 'Pitched' ? 'residential' : 'commercial'
  } else if (area > 1000) {
    return 'industrial'
  } else {
    return 'residential'
  }
}

// Parse building footprint coordinates
function parseFootprint(coordinates: number[][][]): number[][] {
  if (!coordinates || !coordinates[0]) return []
  
  return coordinates[0].map(coord => {
    const [lng, lat] = coord
    const [worldX, worldZ] = latLngToWorld(lat, lng)
    return [worldX, worldZ]
  })
}

// Calculate building scale from footprint
function calculateScale(footprint: number[][], height: number): [number, number, number] {
  if (footprint.length < 3) {
    // Fallback for invalid footprints
    return [20, height, 20]
  }
  
  // Calculate bounding box
  let minX = Infinity, maxX = -Infinity
  let minZ = Infinity, maxZ = -Infinity
  
  footprint.forEach(([x, z]) => {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minZ = Math.min(minZ, z)
    maxZ = Math.max(maxZ, z)
  })
  
  const width = Math.max(5, maxX - minX) // Minimum 5m width
  const depth = Math.max(5, maxZ - minZ) // Minimum 5m depth
  
  return [width, height, depth]
}

// Parse a single building feature
function parseBuilding(feature: GeoJSONFeature, index: number): ParsedBuilding | null {
  try {
    const props = feature.properties
    const [lat, lng] = props.geo_point_2d
    
    // Convert to world coordinates
    const [worldX, worldZ] = latLngToWorld(lat, lng)
    
    // Parse footprint
    const footprint = parseFootprint(feature.geometry.coordinates)
    
    // Use height above ground level, with fallback to average height
    const height = Math.max(3, props.hgt_agl || props.avght_m || 10)
    
    // Calculate scale from footprint
    const scale = calculateScale(footprint, height)
    
    // Determine building type
    const buildingType = determineBuildingType(height, props.rooftype, props.area_m2)
    
    return {
      id: props.bldgid?.toString() || `building_${index}`,
      position: [worldX, height / 2, worldZ], // Y is center of building
      scale,
      type: buildingType,
      height,
      footprint,
      roofType: props.rooftype || 'Flat',
      orientation: props.orient8 || 0
    }
  } catch (error) {
    console.warn(`Failed to parse building ${index}:`, error)
    return null
  }
}

// Sample data loader - loads a subset of buildings for performance
export async function loadVancouverBuildingsFromGeoJSON(maxBuildings = 5000): Promise<ParsedBuilding[]> {
  try {
    console.log('Loading Vancouver building data from GeoJSON...')
    
    const response = await fetch('/data/building-footprints.geojson')
    
    if (!response.ok) {
      throw new Error(`Failed to load GeoJSON: ${response.status}`)
    }
    
    // For large files, we'll need to stream or sample the data
    const text = await response.text()
    
    // Parse JSON in chunks to avoid blocking
    let data: GeoJSONData
    try {
      data = JSON.parse(text)
    } catch (parseError) {
      throw new Error('Invalid GeoJSON format')
    }
    
    console.log(`Found ${data.features.length} buildings in dataset`)
    
    // Sample buildings for performance - take every nth building
    const sampleRate = Math.max(1, Math.floor(data.features.length / maxBuildings))
    const sampledFeatures = data.features.filter((_, index) => index % sampleRate === 0)
    
    console.log(`Sampling ${sampledFeatures.length} buildings (every ${sampleRate}th building)`)
    
    // Parse buildings
    const buildings: ParsedBuilding[] = []
    const batchSize = 100
    
    for (let i = 0; i < sampledFeatures.length; i += batchSize) {
      const batch = sampledFeatures.slice(i, i + batchSize)
      
      for (let j = 0; j < batch.length; j++) {
        const building = parseBuilding(batch[j], i + j)
        if (building) {
          buildings.push(building)
        }
      }
      
      // Yield control to prevent blocking
      if (i % (batchSize * 10) === 0) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }
    
    console.log(`Successfully parsed ${buildings.length} buildings from GeoJSON`)
    
    // Sort by height for better LOD distribution
    buildings.sort((a, b) => b.height - a.height)
    
    return buildings
    
  } catch (error) {
    console.error('Failed to load Vancouver GeoJSON data:', error)
    throw error
  }
}

// Load additional GeoJSON datasets
export async function loadVancouverParks(): Promise<any[]> {
  try {
    const response = await fetch('/data/parks.geojson')
    if (!response.ok) throw new Error(`Parks data load failed: ${response.status}`)
    
    const data = await response.json()
    return data.features || []
  } catch (error) {
    console.warn('Failed to load parks data:', error)
    return []
  }
}

export async function loadVancouverWater(): Promise<any[]> {
  try {
    const response = await fetch('/data/water.json')
    if (!response.ok) throw new Error(`Water data load failed: ${response.status}`)
    
    const data = await response.json()
    return data.features || []
  } catch (error) {
    console.warn('Failed to load water data:', error)
    return []
  }
}

export async function loadVancouverZoning(): Promise<any[]> {
  try {
    const response = await fetch('/data/zoning.geojson')
    if (!response.ok) throw new Error(`Zoning data load failed: ${response.status}`)
    
    const data = await response.json()
    return data.features || []
  } catch (error) {
    console.warn('Failed to load zoning data:', error)
    return []
  }
}

// Export building type for use with existing systems
export type { ParsedBuilding }
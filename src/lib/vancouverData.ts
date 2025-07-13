import { useState, useEffect } from 'react'
import { logger } from '@/utils/logger'

// Fallback building data generator for when API fails
const generateFallbackBuildings = (): ProcessedBuilding[] => {
  const buildings: ProcessedBuilding[] = []
  const centerLat = 49.2827
  const centerLng = -123.1207
  
  // Downtown Vancouver core - High-rise buildings
  for (let i = 0; i < 150; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * 0.01 + 0.005 // ~0.5-1.5km from center
    const lat = centerLat + Math.cos(angle) * distance
    const lng = centerLng + Math.sin(angle) * distance
    
    const height = 80 + Math.random() * 120 // 80-200m towers
    const floors = Math.floor(height / 3.5)
    const width = 30 + Math.random() * 40
    const depth = 30 + Math.random() * 40
    
    buildings.push({
      id: `downtown-${i}`,
      coordinates: [[lat, lng], [lat + 0.001, lng], [lat + 0.001, lng + 0.001], [lat, lng + 0.001]],
      center: [lat, lng],
      area: width * depth,
      height,
      floors,
      type: Math.random() > 0.3 ? 'office' : 'mixed',
      position: latLngToWorld(lat, lng, centerLat, centerLng),
      scale: [width, height, depth]
    })
  }
  
  // Mid-rise residential/commercial areas
  for (let i = 0; i < 400; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = 0.01 + Math.random() * 0.02 // 1-3km from center
    const lat = centerLat + Math.cos(angle) * distance
    const lng = centerLng + Math.sin(angle) * distance
    
    const height = 20 + Math.random() * 60 // 20-80m mid-rise
    const floors = Math.floor(height / 3.5)
    const width = 20 + Math.random() * 30
    const depth = 20 + Math.random() * 30
    
    buildings.push({
      id: `midrise-${i}`,
      coordinates: [[lat, lng], [lat + 0.0005, lng], [lat + 0.0005, lng + 0.0005], [lat, lng + 0.0005]],
      center: [lat, lng],
      area: width * depth,
      height,
      floors,
      type: Math.random() > 0.5 ? 'residential' : 'commercial',
      position: latLngToWorld(lat, lng, centerLat, centerLng),
      scale: [width, height, depth]
    })
  }
  
  // Low-rise suburban areas
  for (let i = 0; i < 800; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = 0.02 + Math.random() * 0.03 // 2-5km from center
    const lat = centerLat + Math.cos(angle) * distance
    const lng = centerLng + Math.sin(angle) * distance
    
    const height = 8 + Math.random() * 25 // 8-33m low-rise
    const floors = Math.max(1, Math.floor(height / 3))
    const width = 12 + Math.random() * 20
    const depth = 12 + Math.random() * 20
    
    buildings.push({
      id: `lowrise-${i}`,
      coordinates: [[lat, lng], [lat + 0.0003, lng], [lat + 0.0003, lng + 0.0003], [lat, lng + 0.0003]],
      center: [lat, lng],
      area: width * depth,
      height,
      floors,
      type: 'residential',
      position: latLngToWorld(lat, lng, centerLat, centerLng),
      scale: [width, height, depth]
    })
  }
  
  return buildings
}

// Coordinate conversion utility
const latLngToWorld = (lat: number, lng: number, centerLat: number, centerLng: number): [number, number, number] => {
  const scale = 10000
  const x = (lng - centerLng) * scale * Math.cos(centerLat * Math.PI / 180)
  const z = -(lat - centerLat) * scale
  return [x, 0, z]
}

interface VancouverBuildingResponse {
  records: Array<{
    recordid: string
    fields: {
      geo_point_2d?: [number, number]
      geo_shape?: {
        type: string
        coordinates: any
      }
      [key: string]: any
    }
    geometry?: {
      type: string
      coordinates: any
    }
  }>
  nhits: number
}

interface ProcessedBuilding {
  id: string
  coordinates: Array<[number, number]>
  center: [number, number]
  area?: number
  height: number
  floors: number
  type: 'residential' | 'commercial' | 'office' | 'industrial' | 'mixed'
  position: [number, number, number]
  scale: [number, number, number]
}

export class VancouverBuildingService {
  private static readonly BASE_URL = 'https://opendata.vancouver.ca/api/records/1.0'
  private static readonly DATASET = 'building-footprints-2015'
  
  // Vancouver city center coordinates for conversion
  private static readonly VANCOUVER_CENTER = {
    lat: 49.2827,
    lng: -123.1207
  }

  static async fetchBuildingData(
    limit = 1000,
    offset = 0
  ): Promise<VancouverBuildingResponse> {
    const params = new URLSearchParams({
      dataset: this.DATASET,
      rows: limit.toString(),
      start: offset.toString(),
      format: 'json',
      timezone: 'UTC',
      // Get buildings within Vancouver area
      geofilter: {
        polygon: [
          [49.2, -123.3],
          [49.32, -123.3],
          [49.32, -123.0],
          [49.2, -123.0],
          [49.2, -123.3]
        ].map(coord => `${coord[0]},${coord[1]}`).join(',')
      }.toString()
    })

    const response = await fetch(`${this.BASE_URL}/search/?${params}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Vancouver building data: ${response.statusText}`)
    }

    return response.json()
  }

  static processBuildings(response: VancouverBuildingResponse): ProcessedBuilding[] {
    return response.records
      .filter(record => record.geometry || record.fields.geo_shape)
      .map(record => this.processBuilding(record))
      .filter(Boolean) as ProcessedBuilding[]
  }

  private static processBuilding(record: VancouverBuildingResponse['records'][0]): ProcessedBuilding | null {
    try {
      const geometry = record.geometry || record.fields.geo_shape
      if (!geometry || geometry.type !== 'Polygon') return null

      const coordinates = geometry.coordinates[0] as Array<[number, number]>
      if (!coordinates || coordinates.length < 3) return null

      // Calculate building center
      const center = this.calculatePolygonCenter(coordinates)
      
      // Calculate area (approximate)
      const area = this.calculatePolygonArea(coordinates)
      
      // Estimate building properties
      const { height, floors, type } = this.estimateBuildingProperties(area, center)
      
      // Convert to 3D world coordinates
      const position = this.latLngToWorld(center[0], center[1])
      
      // Calculate scale based on building footprint
      const bounds = this.calculateBounds(coordinates)
      const width = this.latLngToWorld(bounds.north, bounds.east)[0] - this.latLngToWorld(bounds.south, bounds.west)[0]
      const depth = this.latLngToWorld(bounds.north, bounds.east)[2] - this.latLngToWorld(bounds.south, bounds.west)[2]

      return {
        id: record.recordid,
        coordinates,
        center,
        area,
        height,
        floors,
        type,
        position,
        scale: [Math.abs(width), height, Math.abs(depth)]
      }
    } catch (error) {
      console.warn('Error processing building:', error)
      return null
    }
  }

  private static calculatePolygonCenter(coordinates: Array<[number, number]>): [number, number] {
    const lat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length
    const lng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length
    return [lat, lng]
  }

  private static calculatePolygonArea(coordinates: Array<[number, number]>): number {
    let area = 0
    const n = coordinates.length
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      area += coordinates[i][0] * coordinates[j][1]
      area -= coordinates[j][0] * coordinates[i][1]
    }
    
    return Math.abs(area) / 2
  }

  private static calculateBounds(coordinates: Array<[number, number]>) {
    return coordinates.reduce(
      (bounds, coord) => ({
        north: Math.max(bounds.north, coord[0]),
        south: Math.min(bounds.south, coord[0]),
        east: Math.max(bounds.east, coord[1]),
        west: Math.min(bounds.west, coord[1])
      }),
      {
        north: -Infinity,
        south: Infinity,
        east: -Infinity,
        west: Infinity
      }
    )
  }

  private static estimateBuildingProperties(area: number, center: [number, number]) {
    // Distance from city center (downtown)
    const distanceFromCenter = this.calculateDistance(
      center,
      [this.VANCOUVER_CENTER.lat, this.VANCOUVER_CENTER.lng]
    )

    // Area in square meters (approximate conversion)
    const areaSqM = area * 111000 * 111000 * Math.cos(center[0] * Math.PI / 180)

    let type: ProcessedBuilding['type'] = 'residential'
    let baseHeight = 10
    let floors = 3

    // Downtown core (high-rise)
    if (distanceFromCenter < 0.02) {
      if (areaSqM > 1000) {
        type = 'office'
        baseHeight = 40 + Math.random() * 120
        floors = Math.floor(baseHeight / 3.5)
      } else {
        type = 'commercial'
        baseHeight = 15 + Math.random() * 25
        floors = Math.floor(baseHeight / 4)
      }
    }
    // Mid-city (mid-rise)
    else if (distanceFromCenter < 0.05) {
      if (areaSqM > 800) {
        type = 'mixed'
        baseHeight = 20 + Math.random() * 40
        floors = Math.floor(baseHeight / 3.5)
      } else {
        type = 'residential'
        baseHeight = 12 + Math.random() * 20
        floors = Math.floor(baseHeight / 3)
      }
    }
    // Suburbs (low-rise)
    else {
      type = 'residential'
      baseHeight = 8 + Math.random() * 15
      floors = Math.floor(baseHeight / 3)
      
      if (areaSqM > 500) {
        type = 'commercial'
        baseHeight = 10 + Math.random() * 8
      }
    }

    return {
      height: baseHeight,
      floors: Math.max(1, floors),
      type
    }
  }

  private static calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const dx = coord1[0] - coord2[0]
    const dy = coord1[1] - coord2[1]
    return Math.sqrt(dx * dx + dy * dy)
  }

  private static latLngToWorld(lat: number, lng: number): [number, number, number] {
    // Convert lat/lng to world coordinates relative to Vancouver center
    const scale = 10000 // Scale factor for world coordinates
    const centerLat = this.VANCOUVER_CENTER.lat
    const centerLng = this.VANCOUVER_CENTER.lng
    
    const x = (lng - centerLng) * scale * Math.cos(centerLat * Math.PI / 180)
    const z = -(lat - centerLat) * scale // Negative because Z points toward viewer
    
    return [x, 0, z]
  }
}

// Hook for React components with fallback data
export const useVancouverBuildings = () => {
  const [buildings, setBuildings] = useState<ProcessedBuilding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        setLoading(true)
        setError(null)
        setUsingFallback(false)
        
        // Try to fetch real data first
        const allBuildings: ProcessedBuilding[] = []
        const chunkSize = 1000
        let offset = 0
        let hasMore = true
        
        while (hasMore && allBuildings.length < 2000) { // Reduced limit for better performance
          const response = await VancouverBuildingService.fetchBuildingData(chunkSize, offset)
          const processedBuildings = VancouverBuildingService.processBuildings(response)
          
          allBuildings.push(...processedBuildings)
          
          hasMore = response.records.length === chunkSize
          offset += chunkSize
          
          // Update progress
          logger.log(`Loaded ${allBuildings.length} real buildings...`)
        }
        
        if (allBuildings.length > 0) {
          setBuildings(allBuildings)
          logger.log(`Successfully loaded ${allBuildings.length} real Vancouver buildings`)
        } else {
          throw new Error('No buildings received from API')
        }
        
      } catch (err) {
        logger.warn('Failed to load real building data, using fallback:', err)
        setError('Using fallback building data due to API unavailability')
        setUsingFallback(true)
        
        // Generate fallback buildings
        const fallbackBuildings = generateFallbackBuildings()
        setBuildings(fallbackBuildings)
        logger.log(`Generated ${fallbackBuildings.length} fallback buildings for Vancouver`)
      } finally {
        setLoading(false)
      }
    }

    loadBuildings()
  }, [])

  return { buildings, loading, error, usingFallback }
}
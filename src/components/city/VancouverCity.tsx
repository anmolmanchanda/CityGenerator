'use client'

import { useMemo, useEffect } from 'react'
import { Color } from 'three'
import { Plane } from '@react-three/drei'
import { useVancouverBuildings } from '@/lib/vancouverData'
import { generateBuildingColor } from '@/utils'
import { useAppStore } from '@/lib/store'
import type { BuildingData } from '@/types'
import LODManager, { PerformanceStats } from '../LODManager'

// Building data structure for rendering
interface RenderBuilding {
  id: string
  position: [number, number, number]
  scale: [number, number, number]
  color: Color
  type: string
  materialType: 'glass' | 'concrete' | 'metal' | 'brick'
  hasDetails: boolean
}

export default function VancouverCity() {
  const { setLoadingProgress, setLoadingMessage } = useAppStore()
  
  // Fetch real Vancouver building data
  const { buildings: rawBuildings, loading, error, usingFallback } = useVancouverBuildings()
  
  // Process buildings for rendering with enhanced materials and details
  const buildings = useMemo((): RenderBuilding[] => {
    if (!rawBuildings.length) return []
    
    return rawBuildings.map(building => {
      const height = building.height
      const buildingType = building.type
      
      // Determine material type based on building characteristics
      let materialType: 'glass' | 'concrete' | 'metal' | 'brick' = 'concrete'
      
      if (buildingType === 'office' && height > 100) {
        materialType = Math.random() > 0.3 ? 'glass' : 'metal'
      } else if (buildingType === 'commercial' && height > 50) {
        materialType = Math.random() > 0.5 ? 'glass' : 'concrete'
      } else if (buildingType === 'industrial') {
        materialType = Math.random() > 0.6 ? 'metal' : 'concrete'
      } else if (buildingType === 'residential' && height < 30) {
        materialType = Math.random() > 0.7 ? 'brick' : 'concrete'
      }
      
      // Determine if building should have architectural details
      const hasDetails = height > 50 && Math.random() > 0.4
      
      return {
        id: building.id,
        position: building.position,
        scale: building.scale,
        color: generateBuildingColor(building.type as BuildingData['type'] || 'residential', building.height, building.id.charCodeAt(0)),
        type: building.type,
        materialType,
        hasDetails
      }
    })
  }, [rawBuildings])

  // Update loading state
  useEffect(() => {
    if (loading) {
      setLoadingMessage(usingFallback ? 'Optimizing Vancouver cityscape...' : 'Loading Vancouver building data...')
      setLoadingProgress(buildings.length > 0 ? 50 + (buildings.length / 100) : 20)
    } else if (buildings.length > 0) {
      setLoadingMessage('Applying performance optimizations...')
      setLoadingProgress(100)
      // Clear loading state after buildings are loaded
      setTimeout(() => {
        setLoadingProgress(100)
      }, 500)
    }
  }, [loading, buildings.length, usingFallback, setLoadingMessage, setLoadingProgress])

  // Handle errors
  useEffect(() => {
    if (error && !usingFallback) {
      console.error('Vancouver building data error:', error)
      setLoadingMessage('Switching to fallback data...')
    }
  }, [error, usingFallback, setLoadingMessage])

  return (
    <group>
      {/* Performance monitoring for development */}
      <PerformanceStats />
      
      {/* Ground Plane */}
      <Plane 
        args={[15000, 15000]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -2, 0]}
        receiveShadow
      >
        <meshStandardMaterial 
          color="#2a2a3e" 
          metalness={0.0}
          roughness={0.9}
        />
      </Plane>

      {/* Emergency Simple Building System - No LOD for performance */}
      {buildings.length > 0 && buildings.slice(0, 100).map(building => (
        <mesh
          key={building.id}
          position={building.position}
          scale={building.scale}
        >
          <boxGeometry />
          <meshBasicMaterial color={building.color} />
        </mesh>
      ))}

      {/* Water and Parks - Disabled for performance */}

      {/* Loading indicator */}
      {loading && (
        <group position={[0, 100, 0]}>
          <mesh>
            <boxGeometry args={[50, 10, 50]} />
            <meshBasicMaterial 
              color="white" 
              transparent 
              opacity={0.8} 
            />
          </mesh>
        </group>
      )}

      {/* Error indicator */}
      {error && (
        <group position={[0, 150, 0]}>
          <mesh>
            <boxGeometry args={[100, 20, 20]} />
            <meshBasicMaterial 
              color="red" 
              transparent 
              opacity={0.6} 
            />
          </mesh>
        </group>
      )}
    </group>
  )
}
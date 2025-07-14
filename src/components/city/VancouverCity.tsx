'use client'

import { useMemo } from 'react'
import { Color } from 'three'
import { Plane } from '@react-three/drei'
import { useVancouverBuildings } from '@/lib/vancouverData'
import { generateBuildingColor } from '@/utils'
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
  // Fetch Vancouver building data (using optimized fallback)
  const { buildings: rawBuildings } = useVancouverBuildings()
  
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

  // No loading state management needed - using immediate fallback data

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

      {/* Optimized LOD Building System - Full Vancouver Infrastructure */}
      {buildings.length > 0 && (
        <LODManager 
          buildings={buildings} 
          maxDetailedBuildings={300} // Increased for better city detail
        />
      )}

      {/* Vancouver Water Bodies */}
      <group>
        {/* English Bay */}
        <Plane 
          args={[2000, 1500]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[-1200, 0, 1000]}
        >
          <meshBasicMaterial 
            color="#0066aa" 
            transparent
            opacity={0.8}
          />
        </Plane>

        {/* False Creek */}
        <Plane 
          args={[1200, 300]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, -600]}
        >
          <meshBasicMaterial 
            color="#0066aa" 
            transparent
            opacity={0.8}
          />
        </Plane>

        {/* Burrard Inlet */}
        <Plane 
          args={[3000, 800]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 1800]}
        >
          <meshBasicMaterial 
            color="#0066aa" 
            transparent
            opacity={0.8}
          />
        </Plane>
      </group>

      {/* Vancouver Parks and Green Spaces */}
      <group>
        {/* Stanley Park */}
        <Plane 
          args={[800, 600]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[-800, 1, 1200]}
        >
          <meshBasicMaterial 
            color="#228B22" 
            transparent
            opacity={0.9}
          />
        </Plane>

        {/* Queen Elizabeth Park */}
        <Plane 
          args={[200, 150]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[800, 1, -400]}
        >
          <meshBasicMaterial 
            color="#228B22" 
            transparent
            opacity={0.9}
          />
        </Plane>

        {/* VanDusen Botanical Garden */}
        <Plane 
          args={[150, 100]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[600, 1, -600]}
        >
          <meshBasicMaterial 
            color="#32CD32" 
            transparent
            opacity={0.9}
          />
        </Plane>

        {/* Pacific Spirit Regional Park */}
        <Plane 
          args={[400, 600]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[-1400, 1, -200]}
        >
          <meshBasicMaterial 
            color="#228B22" 
            transparent
            opacity={0.9}
          />
        </Plane>
      </group>

      {/* Vancouver Landmarks and Infrastructure */}
      <group>
        {/* Lions Gate Bridge */}
        <mesh position={[-600, 50, 1500]}>
          <boxGeometry args={[1200, 10, 20]} />
          <meshBasicMaterial color="#888888" />
        </mesh>
        
        {/* Burrard Bridge */}
        <mesh position={[-400, 30, 200]}>
          <boxGeometry args={[800, 8, 15]} />
          <meshBasicMaterial color="#666666" />
        </mesh>

        {/* Granville Bridge */}
        <mesh position={[0, 40, -200]}>
          <boxGeometry args={[600, 8, 15]} />
          <meshBasicMaterial color="#666666" />
        </mesh>

        {/* Vancouver International Airport */}
        <group position={[0, 5, -2500]}>
          {/* Terminal buildings */}
          <mesh position={[0, 15, 0]}>
            <boxGeometry args={[400, 30, 100]} />
            <meshBasicMaterial color="#cccccc" />
          </mesh>
          {/* Runways */}
          <mesh position={[200, 1, 200]}>
            <boxGeometry args={[2000, 2, 50]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[-200, 1, -200]} rotation={[0, Math.PI/4, 0]}>
            <boxGeometry args={[1500, 2, 40]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
        </group>

        {/* Canada Place & Convention Centre */}
        <mesh position={[200, 25, 800]}>
          <boxGeometry args={[300, 50, 150]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* BC Place Stadium */}
        <mesh position={[400, 30, -100]}>
          <cylinderGeometry args={[80, 80, 60, 32]} />
          <meshBasicMaterial color="#0066cc" />
        </mesh>

        {/* Science World */}
        <mesh position={[600, 40, -300]}>
          <sphereGeometry args={[40, 16, 16]} />
          <meshBasicMaterial color="#silver" />
        </mesh>
      </group>

    </group>
  )
}
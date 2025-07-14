'use client'

import { useRef, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import InstancedBuildingSystem from './InstancedBuildingSystem'
import DetailedBuilding from './city/DetailedBuilding'

interface Building {
  id: string
  position: [number, number, number]
  scale: [number, number, number]
  materialType: 'glass' | 'concrete' | 'metal' | 'brick'
  type: string
  color: THREE.Color
  hasDetails: boolean
}

interface LODManagerProps {
  buildings: Building[]
  maxDetailedBuildings?: number
}

// LOD distance thresholds
const LOD_DISTANCES = {
  ULTRA_HIGH: 100,    // Individual detailed buildings with all features
  HIGH: 250,          // Individual buildings, no small details
  MEDIUM: 500,        // Instanced buildings with medium geometry
  LOW: 1000,          // Instanced buildings with low geometry
  VERY_LOW: 2500      // Instanced buildings with minimal geometry
}

interface LODGroup {
  level: number
  distance: number
  buildings: Building[]
}

export default function LODManager({ 
  buildings, 
  maxDetailedBuildings = 50 // Reduced from 100 to 50 for better performance
}: LODManagerProps) {
  const { camera } = useThree()
  const [lastCameraPosition, setLastCameraPosition] = useState(new THREE.Vector3())
  const updateThrottleRef = useRef(0)
  
  // Group buildings by LOD level based on distance from camera
  const lodGroups = useMemo(() => {
    const cameraPos = camera.position
    const groups: { [key: number]: Building[] } = {
      0: [], // Ultra high detail
      1: [], // High detail
      2: [], // Medium detail (instanced)
      3: [], // Low detail (instanced)
      4: []  // Very low detail (instanced)
    }
    
    // Calculate distances and assign LOD levels
    const buildingsWithDistance = buildings.map(building => ({
      ...building,
      distance: new THREE.Vector3(...building.position).distanceTo(cameraPos)
    })).sort((a, b) => a.distance - b.distance) // Sort by distance
    
    buildingsWithDistance.forEach(building => {
      const { distance } = building
      
      if (distance < LOD_DISTANCES.ULTRA_HIGH && groups[0].length < maxDetailedBuildings / 2) {
        groups[0].push(building) // Ultra high detail - top priority buildings
      } else if (distance < LOD_DISTANCES.HIGH && groups[1].length < maxDetailedBuildings) {
        groups[1].push(building) // High detail - remaining close buildings
      } else if (distance < LOD_DISTANCES.MEDIUM) {
        groups[2].push(building) // Medium detail instanced
      } else if (distance < LOD_DISTANCES.LOW) {
        groups[3].push(building) // Low detail instanced
      } else if (distance < LOD_DISTANCES.VERY_LOW) {
        groups[4].push(building) // Very low detail instanced
      }
      // Buildings beyond VERY_LOW distance are culled (not rendered)
    })
    
    return groups
  }, [buildings, camera.position, maxDetailedBuildings])
  
  // Performance-based adaptive LOD
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 60,
    frameTime: 16,
    triangles: 0
  })
  
  // Adaptive quality based on performance
  const adaptiveLODOffset = useMemo(() => {
    if (performanceMetrics.fps < 30) {
      return 2 // Reduce LOD quality significantly
    } else if (performanceMetrics.fps < 45) {
      return 1 // Reduce LOD quality moderately
    }
    return 0 // Maintain target quality
  }, [performanceMetrics.fps])
  
  // Throttled camera movement detection for LOD updates
  useFrame((state) => {
    const currentTime = state.clock.elapsedTime
    
    // Update performance metrics
    const deltaTime = state.clock.getDelta()
    const fps = Math.round(1 / deltaTime)
    
    setPerformanceMetrics(prev => ({
      fps: Math.round((prev.fps * 0.9) + (fps * 0.1)), // Smoothed FPS
      frameTime: deltaTime * 1000,
      triangles: state.gl.info.render.triangles
    }))
    
    // Throttle LOD updates to every 100ms when camera moves significantly
    if (currentTime - updateThrottleRef.current > 0.1) {
      const cameraMoved = camera.position.distanceTo(lastCameraPosition) > 10
      if (cameraMoved) {
        setLastCameraPosition(camera.position.clone())
        updateThrottleRef.current = currentTime
      }
    }
  })
  
  return (
    <group>
      {/* Ultra High Detail - Individual buildings with all details */}
      {lodGroups[0].map(building => (
        <DetailedBuilding
          key={building.id}
          id={building.id}
          position={building.position}
          scale={building.scale}
          materialType={building.materialType}
          buildingType={building.type}
          hasDetails={true} // Full details enabled
        />
      ))}
      
      {/* High Detail - Individual buildings without small details */}
      {lodGroups[1].map(building => (
        <DetailedBuilding
          key={building.id}
          id={building.id}
          position={building.position}
          scale={building.scale}
          materialType={building.materialType}
          buildingType={building.type}
          hasDetails={false} // Disable small details for performance
        />
      ))}
      
      {/* Medium Detail - Instanced buildings with medium geometry */}
      {lodGroups[2].length > 0 && (
        <InstancedBuildingSystem
          buildings={lodGroups[2]}
          lodLevel={Math.min(1 + adaptiveLODOffset, 3)}
        />
      )}
      
      {/* Low Detail - Instanced buildings with low geometry */}
      {lodGroups[3].length > 0 && (
        <InstancedBuildingSystem
          buildings={lodGroups[3]}
          lodLevel={Math.min(2 + adaptiveLODOffset, 3)}
        />
      )}
      
      {/* Very Low Detail - Instanced buildings with minimal geometry */}
      {lodGroups[4].length > 0 && (
        <InstancedBuildingSystem
          buildings={lodGroups[4]}
          lodLevel={3}
        />
      )}
      
      {/* Development performance display */}
      {process.env.NODE_ENV === 'development' && (
        <group position={[0, 500, 0]}>
          <mesh>
            <boxGeometry args={[100, 20, 5]} />
            <meshBasicMaterial color="white" transparent opacity={0.8} />
          </mesh>
          {/* Performance text would go here - handled by external UI */}
        </group>
      )}
    </group>
  )
}

// Performance statistics component for debugging
export function PerformanceStats() {
  const { gl } = useThree()
  
  useFrame(() => {
    if (process.env.NODE_ENV === 'development') {
      const info = gl.info
      
      // Update DOM elements if they exist
      const fpsElement = document.getElementById('fps-counter')
      const triangleElement = document.getElementById('triangle-counter')
      const drawCallElement = document.getElementById('drawcall-counter')
      const memoryElement = document.getElementById('memory-counter')
      
      if (fpsElement) {
        const fps = Math.round(1 / (performance.now() - (window as any).lastFrameTime || 16))
        fpsElement.textContent = fps.toString()
        ;(window as any).lastFrameTime = performance.now()
      }
      
      if (triangleElement) {
        triangleElement.textContent = `${Math.floor(info.render.triangles / 1000)}k`
      }
      
      if (drawCallElement) {
        drawCallElement.textContent = info.render.calls.toString()
      }
      
      if (memoryElement && (performance as any).memory) {
        const memory = (performance as any).memory
        const memoryMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
        memoryElement.textContent = `${memoryMB}MB`
      }
    }
  })
  
  return null
}
'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { InstancedMesh, Object3D, Color, Vector3 } from 'three'
import { Box, Plane } from '@react-three/drei'
import { useVancouverBuildings } from '@/lib/vancouverData'
import { generateBuildingColor } from '@/utils'
import { useAppStore } from '@/lib/store'
import { PerformanceOptimizer } from '@/lib/performanceOptimizer'
import BuildingMaterial from '@/shaders/BuildingMaterial'
import DetailedBuilding from './DetailedBuilding'

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
  const buildingsRef = useRef<InstancedMesh>(null)
  const { setLoadingProgress, setLoadingMessage } = useAppStore()
  const { camera, gl, scene } = useThree()
  
  // Performance optimization
  const optimizerRef = useRef(new PerformanceOptimizer())
  const [visibleBuildings, setVisibleBuildings] = useState<RenderBuilding[]>([])
  
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
        color: generateBuildingColor(building.type, building.height, building.id.charCodeAt(0)),
        type: building.type,
        materialType,
        hasDetails
      }
    })
  }, [rawBuildings])

  // Update loading state
  useEffect(() => {
    if (loading) {
      setLoadingMessage(usingFallback ? 'Generating Vancouver cityscape...' : 'Loading Vancouver building data...')
      setLoadingProgress(buildings.length > 0 ? 50 + (buildings.length / 100) : 20)
    } else if (buildings.length > 0) {
      setLoadingMessage(usingFallback ? 'Rendering procedural city...' : 'Rendering real city data...')
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

  useEffect(() => {
    if (!buildingsRef.current || !farBuildings.length) return

    const mesh = buildingsRef.current
    const dummy = new Object3D()

    farBuildings.forEach((building, i) => {
      dummy.position.set(...building.position)
      dummy.scale.set(...building.scale)
      dummy.updateMatrix()
      
      mesh.setMatrixAt(i, dummy.matrix)
      if (mesh.instanceColor) {
        mesh.setColorAt(i, building.color)
      }
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }
  }, [])

  // Performance-optimized rendering loop for far buildings
  useFrame((state) => {
    if (!buildingsRef.current || loading || farBuildings.length === 0) return
    
    const time = state.clock.getElapsedTime()
    const optimizer = optimizerRef.current
    
    // Update performance metrics
    optimizer.updateMetrics(gl, scene)
    
    // Simple LOD for far buildings
    if (farBuildings.length > 0 && buildingsRef.current) {
      const mesh = buildingsRef.current
      const dummy = new Object3D()
      const cameraPos = camera.position
      
      farBuildings.forEach((building, i) => {
        const distance = cameraPos.distanceTo(new Vector3(...building.position))
        const maxDistance = 6000
        
        if (distance > maxDistance) {
          dummy.position.set(...building.position)
          dummy.scale.set(0, 0, 0)
          dummy.updateMatrix()
          mesh.setMatrixAt(i, dummy.matrix)
        } else {
          dummy.position.set(...building.position)
          
          // Apply distance-based scaling
          let scaleFactor = 1.0
          if (distance > 4000) {
            scaleFactor = 0.6
          } else if (distance > 2000) {
            scaleFactor = 0.8
          }
          
          dummy.scale.set(
            building.scale[0] * scaleFactor, 
            building.scale[1] * scaleFactor, 
            building.scale[2] * scaleFactor
          )
          dummy.updateMatrix()
          mesh.setMatrixAt(i, dummy.matrix)
        }
      })
      
      mesh.instanceMatrix.needsUpdate = true
    }
    
    // Update development stats
    if (process.env.NODE_ENV === 'development') {
      const metrics = optimizer.getMetrics()
      
      const triangleElement = document.getElementById('triangle-counter')
      if (triangleElement) {
        triangleElement.textContent = `${Math.floor(metrics.triangles / 1000)}k`
      }
      
      const memoryElement = document.getElementById('memory-counter')
      if (memoryElement) {
        memoryElement.textContent = `${Math.round(metrics.memory)}MB`
      }
      
      const fpsElement = document.getElementById('fps-counter')
      if (fpsElement) {
        fpsElement.textContent = metrics.fps.toString()
      }
    }
  })

  // Separate buildings into LOD groups for performance
  const { nearBuildings, farBuildings } = useMemo(() => {
    if (!buildings.length) return { nearBuildings: [], farBuildings: [] }
    
    const cameraPos = camera.position
    const near: RenderBuilding[] = []
    const far: RenderBuilding[] = []
    
    buildings.forEach(building => {
      const distance = new Vector3(...building.position).distanceTo(cameraPos)
      if (distance < 1000) {
        near.push(building)
      } else {
        far.push(building)
      }
    })
    
    return { nearBuildings: near, farBuildings: far }
  }, [buildings, camera.position])

  return (
    <group>
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

      {/* High-detail buildings (near camera) */}
      {nearBuildings.slice(0, 100).map(building => (
        <DetailedBuilding
          key={building.id}
          id={building.id}
          position={building.position}
          scale={building.scale}
          materialType={building.materialType}
          buildingType={building.type}
          hasDetails={building.hasDetails}
        />
      ))}

      {/* Low-detail buildings (instanced mesh for far buildings) */}
      <instancedMesh
        ref={buildingsRef}
        args={[undefined, undefined, farBuildings.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#8a8a9a"
          metalness={0.1}
          roughness={0.8}
        />
      </instancedMesh>

      {/* Water Bodies (False Creek, English Bay) */}
      <group>
        {/* False Creek */}
        <Plane 
          args={[800, 200]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[200, 0, -300]}
        >
          <meshPhongMaterial 
            color="#001122" 
            transparent
            opacity={0.7}
            shininess={100}
          />
        </Plane>

        {/* English Bay */}
        <Plane 
          args={[1500, 1200]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[-600, 0, 800]}
        >
          <meshPhongMaterial 
            color="#001122" 
            transparent
            opacity={0.7}
            shininess={100}
          />
        </Plane>
      </group>

      {/* Parks (green spaces) */}
      <group>
        {/* Stanley Park */}
        <Plane 
          args={[400, 400]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[-400, 1, 400]}
        >
          <meshLambertMaterial 
            color="#0a4a0a" 
            transparent
            opacity={0.8}
          />
        </Plane>

        {/* Queen Elizabeth Park */}
        <Plane 
          args={[130, 130]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[300, 1, -200]}
        >
          <meshLambertMaterial 
            color="#0a4a0a" 
            transparent
            opacity={0.8}
          />
        </Plane>
      </group>

      {/* Loading indicator */}
      {loading && (
        <group position={[0, 100, 0]}>
          <Box args={[50, 10, 50]}>
            <meshBasicMaterial 
              color="white" 
              transparent 
              opacity={0.8} 
            />
          </Box>
        </group>
      )}

      {/* Error indicator */}
      {error && (
        <group position={[0, 150, 0]}>
          <Box args={[100, 20, 20]}>
            <meshBasicMaterial 
              color="red" 
              transparent 
              opacity={0.6} 
            />
          </Box>
        </group>
      )}
    </group>
  )
}
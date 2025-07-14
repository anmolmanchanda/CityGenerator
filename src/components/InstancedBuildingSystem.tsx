'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'

interface BuildingInstance {
  id: string
  position: [number, number, number]
  scale: [number, number, number]
  materialType: 'glass' | 'concrete' | 'metal' | 'brick'
  type: string
  color: THREE.Color
}

interface BuildingCategory {
  name: string
  heightRange: [number, number]
  baseGeometry: THREE.BoxGeometry
  material: THREE.Material
  instances: BuildingInstance[]
}

interface InstancedBuildingSystemProps {
  buildings: BuildingInstance[]
  lodLevel: number // 0 = highest detail, 3 = lowest detail
}

// LOD-based geometry creation
function createLODGeometry(lodLevel: number, baseScale: [number, number, number]): THREE.BoxGeometry {
  const [width, height, depth] = baseScale
  
  switch (lodLevel) {
    case 0: // High detail (0-250m) - Full geometry
      return new THREE.BoxGeometry(width, height, depth, 2, 4, 2)
    case 1: // Medium detail (250-500m) - Reduced segments
      return new THREE.BoxGeometry(width, height, depth, 1, 2, 1)
    case 2: // Low detail (500-1000m) - Simple box
      return new THREE.BoxGeometry(width, height, depth, 1, 1, 1)
    case 3: // Very low detail (1000m+) - Minimal box
      return new THREE.BoxGeometry(width, height, depth, 1, 1, 1)
    default:
      return new THREE.BoxGeometry(width, height, depth, 1, 1, 1)
  }
}

// Enhanced LOD-based material creation with better visuals
function createLODMaterial(lodLevel: number, materialType: string, timeOfDay: number): THREE.Material {
  const isNight = timeOfDay < 7 || timeOfDay > 17
  
  switch (lodLevel) {
    case 0: // High detail - Complex materials with custom shaders
      if (materialType === 'glass') {
        return new THREE.MeshPhongMaterial({
          color: '#4A90E2',
          transparent: true,
          opacity: 0.7,
          shininess: 100,
          emissive: isNight ? new THREE.Color('#FFE4B5').multiplyScalar(0.1) : new THREE.Color(0x000000)
        })
      } else if (materialType === 'metal') {
        return new THREE.MeshStandardMaterial({
          color: '#C0C0C0',
          metalness: 0.9,
          roughness: 0.2
        })
      } else {
        return new THREE.MeshStandardMaterial({
          color: materialType === 'brick' ? '#8B4513' : '#B8B8B8',
          metalness: 0.0,
          roughness: 0.8
        })
      }
    
    case 1: // Medium detail - Standard materials
      return new THREE.MeshLambertMaterial({
        color: materialType === 'glass' ? '#4A90E2' : 
               materialType === 'metal' ? '#C0C0C0' :
               materialType === 'brick' ? '#8B4513' : '#B8B8B8',
        emissive: isNight && materialType === 'glass' ? 
          new THREE.Color('#FFE4B5').multiplyScalar(0.05) : new THREE.Color(0x000000)
      })
    
    case 2: // Low detail - Basic materials
    case 3: // Very low detail - Simplest materials
      return new THREE.MeshBasicMaterial({
        color: materialType === 'glass' ? '#4A90E2' : 
               materialType === 'metal' ? '#C0C0C0' :
               materialType === 'brick' ? '#8B4513' : '#B8B8B8'
      })
    
    default:
      return new THREE.MeshBasicMaterial({ color: '#B8B8B8' })
  }
}

// Building categorization for instancing
function categorizeBuildingsForInstancing(buildings: BuildingInstance[]): BuildingCategory[] {
  const categories: { [key: string]: BuildingInstance[] } = {}
  
  buildings.forEach(building => {
    const height = building.scale[1]
    const material = building.materialType
    
    // Create categories based on height ranges and material types
    let categoryKey: string
    if (height < 30) {
      categoryKey = `low_${material}` // Low-rise buildings
    } else if (height < 100) {
      categoryKey = `medium_${material}` // Medium-rise buildings  
    } else if (height < 200) {
      categoryKey = `high_${material}` // High-rise buildings
    } else {
      categoryKey = `skyscraper_${material}` // Skyscrapers
    }
    
    if (!categories[categoryKey]) {
      categories[categoryKey] = []
    }
    categories[categoryKey].push(building)
  })
  
  // Convert to BuildingCategory objects
  return Object.entries(categories).map(([key, instances]) => {
    const [heightCategory, material] = key.split('_')
    const heightRange: [number, number] = 
      heightCategory === 'low' ? [5, 30] :
      heightCategory === 'medium' ? [30, 100] :
      heightCategory === 'high' ? [100, 200] : [200, 400]
    
    const avgHeight = (heightRange[0] + heightRange[1]) / 2
    const baseScale: [number, number, number] = [20, avgHeight, 20]
    
    return {
      name: key,
      heightRange,
      baseGeometry: createLODGeometry(0, baseScale), // Will be updated based on LOD
      material: createLODMaterial(0, material, 12), // Will be updated based on LOD
      instances
    }
  })
}

// Single instanced mesh component for one building category
function InstancedBuildingCategory({ 
  category, 
  lodLevel 
}: { 
  category: BuildingCategory
  lodLevel: number 
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { camera } = useThree()
  const { timeOfDay } = useAppStore()
  
  // Update geometry and material based on LOD level
  const lodGeometry = useMemo(() => {
    const avgHeight = (category.heightRange[0] + category.heightRange[1]) / 2
    return createLODGeometry(lodLevel, [20, avgHeight, 20])
  }, [lodLevel, category.heightRange])
  
  const lodMaterial = useMemo(() => {
    const materialType = category.name.split('_')[1] as 'glass' | 'concrete' | 'metal' | 'brick'
    return createLODMaterial(lodLevel, materialType, timeOfDay)
  }, [lodLevel, category.name, timeOfDay])
  
  // Set up instances
  useEffect(() => {
    if (!meshRef.current) return
    
    const mesh = meshRef.current
    const dummy = new THREE.Object3D()
    
    category.instances.forEach((building, i) => {
      dummy.position.set(...building.position)
      dummy.scale.set(...building.scale)
      dummy.updateMatrix()
      
      mesh.setMatrixAt(i, dummy.matrix)
      
      // Set color if using vertex colors
      if (mesh.instanceColor) {
        mesh.setColorAt(i, building.color)
      }
    })
    
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }
  }, [category.instances])
  
  // Check if we have instances before hooks
  const hasInstances = category.instances.length > 0
  
  // Frustum culling optimization
  useFrame(() => {
    if (!meshRef.current || !hasInstances) return
    
    const mesh = meshRef.current
    const frustum = new THREE.Frustum()
    const cameraMatrix = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    frustum.setFromProjectionMatrix(cameraMatrix)
    
    // Simple frustum culling - could be enhanced with per-instance culling
    const boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2000)
    mesh.visible = frustum.intersectsSphere(boundingSphere)
  })
  
  if (!hasInstances) return null
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[lodGeometry, lodMaterial, category.instances.length]}
      castShadow={lodLevel < 2} // Only cast shadows for high/medium detail
      receiveShadow={lodLevel < 3} // Only receive shadows for high/medium/low detail
    />
  )
}

export default function InstancedBuildingSystem({ 
  buildings, 
  lodLevel 
}: InstancedBuildingSystemProps) {
  const categories = useMemo(() => {
    return categorizeBuildingsForInstancing(buildings)
  }, [buildings])
  
  return (
    <group>
      {categories.map(category => (
        <InstancedBuildingCategory
          key={category.name}
          category={category}
          lodLevel={lodLevel}
        />
      ))}
    </group>
  )
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const { gl, scene } = useThree()
  
  useFrame(() => {
    if (process.env.NODE_ENV === 'development') {
      const info = gl.info
      
      // Update performance counters
      const triangleElement = document.getElementById('triangle-counter')
      if (triangleElement) {
        triangleElement.textContent = `${Math.floor(info.render.triangles / 1000)}k`
      }
      
      const drawCallElement = document.getElementById('drawcall-counter')
      if (drawCallElement) {
        drawCallElement.textContent = info.render.calls.toString()
      }
      
      // Reset for next frame
      info.render.calls = 0
      info.render.triangles = 0
    }
  })
}
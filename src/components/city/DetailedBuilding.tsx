'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Cylinder } from '@react-three/drei'
import { useAppStore } from '@/lib/store'
import BuildingMaterial from '@/shaders/BuildingMaterial'
import * as THREE from 'three'

interface DetailedBuildingProps {
  id: string
  position: [number, number, number]
  scale: [number, number, number]
  materialType: 'glass' | 'concrete' | 'metal' | 'brick'
  buildingType: string
  hasDetails: boolean
}

// Rooftop details component
function RooftopDetails({ 
  buildingScale, 
  buildingType 
}: { 
  buildingScale: [number, number, number]
  buildingType: string 
}) {
  const [width, height, depth] = buildingScale
  
  // Generate details based on building type
  const details = useMemo(() => {
    const items: Array<{
      type: 'ac' | 'antenna' | 'helipad' | 'garden'
      position: [number, number, number]
      scale: [number, number, number]
      rotation?: [number, number, number]
    }> = []
    
    if (buildingType === 'office' && height > 100) {
      // Helipad for tall office buildings
      if (Math.random() > 0.7) {
        items.push({
          type: 'helipad',
          position: [0, height / 2 + 2, 0],
          scale: [width * 0.3, 1, depth * 0.3]
        })
      }
      
      // Communication antennas
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        items.push({
          type: 'antenna',
          position: [
            (Math.random() - 0.5) * width * 0.8,
            height / 2 + 5 + Math.random() * 10,
            (Math.random() - 0.5) * depth * 0.8
          ],
          scale: [1, 8 + Math.random() * 12, 1]
        })
      }
    }
    
    // AC units for all buildings
    const numAcUnits = Math.floor(Math.random() * 4) + 2
    for (let i = 0; i < numAcUnits; i++) {
      items.push({
        type: 'ac',
        position: [
          (Math.random() - 0.5) * width * 0.9,
          height / 2 + 1,
          (Math.random() - 0.5) * depth * 0.9
        ],
        scale: [3 + Math.random() * 2, 1.5, 2 + Math.random()],
        rotation: [0, Math.random() * Math.PI * 2, 0]
      })
    }
    
    // Rooftop garden for residential buildings
    if (buildingType === 'residential' && Math.random() > 0.6) {
      items.push({
        type: 'garden',
        position: [0, height / 2 + 0.5, 0],
        scale: [width * 0.8, 1, depth * 0.8]
      })
    }
    
    return items
  }, [buildingScale, buildingType, width, height, depth])
  
  return (
    <group>
      {details.map((detail, index) => {
        switch (detail.type) {
          case 'helipad':
            return (
              <Cylinder
                key={`helipad-${index}`}
                args={[detail.scale[0], detail.scale[0], detail.scale[1], 16]}
                position={detail.position}
              >
                <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
              </Cylinder>
            )
          
          case 'antenna':
            return (
              <Cylinder
                key={`antenna-${index}`}
                args={[0.1, 0.1, detail.scale[1], 8]}
                position={detail.position}
              >
                <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
              </Cylinder>
            )
          
          case 'ac':
            return (
              <Box
                key={`ac-${index}`}
                args={detail.scale}
                position={detail.position}
                rotation={detail.rotation}
              >
                <meshStandardMaterial color="#808080" metalness={0.3} roughness={0.7} />
              </Box>
            )
          
          case 'garden':
            return (
              <Box
                key={`garden-${index}`}
                args={detail.scale}
                position={detail.position}
              >
                <meshStandardMaterial color="#228B22" metalness={0.0} roughness={0.9} />
              </Box>
            )
          
          default:
            return null
        }
      })}
    </group>
  )
}

// Ground floor details (entrances, canopies, etc.)
function GroundFloorDetails({ 
  buildingScale, 
  buildingType 
}: { 
  buildingScale: [number, number, number]
  buildingType: string 
}) {
  const [width, height, depth] = buildingScale
  
  if (buildingType === 'residential' || height < 20) return null
  
  return (
    <group>
      {/* Entrance canopy */}
      <Box
        args={[width * 0.4, 2, 4]}
        position={[0, -height / 2 + 8, depth / 2 + 2]}
      >
        <meshStandardMaterial 
          color="#2F4F4F" 
          metalness={0.1} 
          roughness={0.3}
          transparent
          opacity={0.8}
        />
      </Box>
      
      {/* Entrance pillars */}
      <Box
        args={[2, 12, 2]}
        position={[-width * 0.15, -height / 2 + 6, depth / 2 + 3]}
      >
        <meshStandardMaterial color="#696969" metalness={0.0} roughness={0.8} />
      </Box>
      <Box
        args={[2, 12, 2]}
        position={[width * 0.15, -height / 2 + 6, depth / 2 + 3]}
      >
        <meshStandardMaterial color="#696969" metalness={0.0} roughness={0.8} />
      </Box>
    </group>
  )
}

export default function DetailedBuilding({
  id,
  position,
  scale,
  materialType,
  buildingType,
  hasDetails
}: DetailedBuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { timeOfDay, weatherCondition } = useAppStore()
  
  // Animate building slightly for wind effect on tall buildings
  useFrame((state) => {
    if (meshRef.current && scale[1] > 200) {
      const wind = Math.sin(state.clock.elapsedTime * 0.5 + position[0] * 0.01) * 0.002
      meshRef.current.rotation.x = wind
      meshRef.current.rotation.z = wind * 0.5
    }
  })
  
  return (
    <group position={position}>
      {/* Main building structure */}
      <Box ref={meshRef} args={scale} castShadow receiveShadow>
        <BuildingMaterial
          type={materialType}
          height={scale[1]}
          buildingId={id}
          timeOfDay={timeOfDay}
          weatherCondition={weatherCondition}
        />
      </Box>
      
      {/* Architectural details */}
      {hasDetails && (
        <>
          <RooftopDetails buildingScale={scale} buildingType={buildingType} />
          <GroundFloorDetails buildingScale={scale} buildingType={buildingType} />
        </>
      )}
    </group>
  )
}
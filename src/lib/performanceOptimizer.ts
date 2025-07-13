import { Vector3, Camera, Frustum, Matrix4, Object3D } from 'three'
import { calculateDistance, calculateLOD } from '@/utils'

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  memory: number
  visibleObjects: number
}

export interface OptimizationSettings {
  enableLOD: boolean
  enableFrustumCulling: boolean
  maxRenderDistance: number
  lodDistances: {
    high: number
    medium: number
    low: number
  }
  targetFPS: number
  adaptiveQuality: boolean
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    drawCalls: 0,
    triangles: 0,
    memory: 0,
    visibleObjects: 0
  }

  private settings: OptimizationSettings = {
    enableLOD: true,
    enableFrustumCulling: false, // Temporarily disabled for debugging
    maxRenderDistance: 5000, // Increased for better visibility
    lodDistances: {
      high: 1200, // Increased from 500
      medium: 2500, // Increased from 1500
      low: 4000 // Increased from 3000
    },
    targetFPS: 60,
    adaptiveQuality: false // Temporarily disabled for debugging
  }

  private frustum = new Frustum()
  private cameraMatrix = new Matrix4()
  private frameCount = 0
  private lastTime = performance.now()
  private fpsHistory: number[] = []

  updateMetrics(renderer: any, scene: any) {
    const currentTime = performance.now()
    this.frameCount++

    // Calculate FPS every second
    if (currentTime >= this.lastTime + 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime))
      this.fpsHistory.push(this.metrics.fps)
      
      // Keep only last 10 FPS measurements
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift()
      }

      this.frameCount = 0
      this.lastTime = currentTime
    }

    // Update render info
    if (renderer.info) {
      this.metrics.drawCalls = renderer.info.render.calls
      this.metrics.triangles = renderer.info.render.triangles
    }

    // Update memory usage
    if ((performance as any).memory) {
      this.metrics.memory = (performance as any).memory.usedJSHeapSize / 1048576 // MB
    }

    // Adaptive quality adjustment
    if (this.settings.adaptiveQuality) {
      this.adaptQuality()
    }
  }

  private adaptQuality() {
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
    
    if (avgFPS < this.settings.targetFPS * 0.8) {
      // Performance is poor, reduce quality
      this.settings.lodDistances.high = Math.max(200, this.settings.lodDistances.high * 0.9)
      this.settings.lodDistances.medium = Math.max(800, this.settings.lodDistances.medium * 0.9)
      this.settings.maxRenderDistance = Math.max(2000, this.settings.maxRenderDistance * 0.95)
    } else if (avgFPS > this.settings.targetFPS * 1.1) {
      // Performance is good, can increase quality
      this.settings.lodDistances.high = Math.min(600, this.settings.lodDistances.high * 1.05)
      this.settings.lodDistances.medium = Math.min(1800, this.settings.lodDistances.medium * 1.05)
      this.settings.maxRenderDistance = Math.min(4000, this.settings.maxRenderDistance * 1.02)
    }
  }

  optimizeObjects(objects: Object3D[], camera: Camera): Object3D[] {
    // Update frustum for culling
    this.cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    this.frustum.setFromProjectionMatrix(this.cameraMatrix)

    const visibleObjects: Object3D[] = []
    const cameraPos = camera.position

    for (const obj of objects) {
      // Distance-based culling
      const distance = cameraPos.distanceTo(obj.position)
      if (distance > this.settings.maxRenderDistance) {
        obj.visible = false
        continue
      }

      // Frustum culling
      if (this.settings.enableFrustumCulling) {
        if (!this.frustum.intersectsObject(obj)) {
          obj.visible = false
          continue
        }
      }

      // LOD optimization
      if (this.settings.enableLOD) {
        this.applyLOD(obj, distance)
      }

      obj.visible = true
      visibleObjects.push(obj)
    }

    this.metrics.visibleObjects = visibleObjects.length
    return visibleObjects
  }

  private applyLOD(object: Object3D, distance: number) {
    let lodLevel = 0 // 0 = high, 1 = medium, 2 = low, 3 = culled

    if (distance > this.settings.lodDistances.low) {
      lodLevel = 3 // Cull
    } else if (distance > this.settings.lodDistances.medium) {
      lodLevel = 2 // Low detail
    } else if (distance > this.settings.lodDistances.high) {
      lodLevel = 1 // Medium detail
    } else {
      lodLevel = 0 // High detail
    }

    // Apply LOD-specific optimizations
    if (lodLevel >= 3) {
      object.visible = false
    } else {
      object.visible = true
      
      // Adjust material quality based on LOD
      object.traverse((child) => {
        if ((child as any).material) {
          const material = (child as any).material
          
          switch (lodLevel) {
            case 0: // High detail
              if (material.map) material.map.minFilter = 1006 // LinearMipmapLinearFilter
              material.transparent = true
              break
            case 1: // Medium detail
              if (material.map) material.map.minFilter = 1005 // LinearMipmapNearestFilter
              material.transparent = false
              break
            case 2: // Low detail
              if (material.map) material.map.minFilter = 1003 // NearestFilter
              material.transparent = false
              break
          }
        }
      })
    }
  }

  // Progressive loading system
  createProgressiveLoader<T>(items: T[], batchSize = 50, delay = 16): Promise<T[]> {
    return new Promise((resolve) => {
      const processedItems: T[] = []
      let currentIndex = 0

      const processBatch = () => {
        const endIndex = Math.min(currentIndex + batchSize, items.length)
        
        for (let i = currentIndex; i < endIndex; i++) {
          processedItems.push(items[i])
        }
        
        currentIndex = endIndex
        
        if (currentIndex >= items.length) {
          resolve(processedItems)
        } else {
          setTimeout(processBatch, delay)
        }
      }

      processBatch()
    })
  }

  // Memory management
  disposeUnusedObjects(scene: any, camera: Camera) {
    const cameraPos = camera.position
    const disposeDistance = this.settings.maxRenderDistance * 1.5

    scene.traverse((object: Object3D) => {
      const distance = cameraPos.distanceTo(object.position)
      
      if (distance > disposeDistance) {
        // Dispose geometry and materials for very distant objects
        if ((object as any).geometry) {
          (object as any).geometry.dispose()
        }
        
        if ((object as any).material) {
          const material = (object as any).material
          if (Array.isArray(material)) {
            material.forEach(mat => mat.dispose())
          } else {
            material.dispose()
          }
        }
        
        // Remove from scene
        if (object.parent) {
          object.parent.remove(object)
        }
      }
    })
  }

  // Render optimization suggestions
  getRenderOptimizations(): string[] {
    const suggestions: string[] = []
    
    if (this.metrics.fps < 30) {
      suggestions.push('Consider reducing post-processing effects')
      suggestions.push('Lower the number of visible buildings')
      suggestions.push('Reduce shadow map resolution')
    }
    
    if (this.metrics.drawCalls > 1000) {
      suggestions.push('Implement more aggressive object pooling')
      suggestions.push('Use instanced rendering for similar objects')
    }
    
    if (this.metrics.memory > 500) {
      suggestions.push('Implement texture compression')
      suggestions.push('Reduce texture resolution for distant objects')
    }
    
    if (this.metrics.triangles > 1000000) {
      suggestions.push('Implement more aggressive LOD system')
      suggestions.push('Use simplified geometry for distant buildings')
    }

    return suggestions
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getSettings(): OptimizationSettings {
    return { ...this.settings }
  }

  updateSettings(newSettings: Partial<OptimizationSettings>) {
    this.settings = { ...this.settings, ...newSettings }
  }
}
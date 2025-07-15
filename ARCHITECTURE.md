# CityGenerator Architecture Documentation

## System Overview

CityGenerator is built on a modern, performance-focused architecture that leverages the latest web technologies to deliver smooth 60 FPS 3D city visualization.

## Core Architecture Principles

1. **Performance First**: Every decision prioritizes maintaining 60 FPS
2. **Progressive Enhancement**: Start simple, add complexity based on device capabilities
3. **Modular Design**: Clear separation of concerns for maintainability
4. **Type Safety**: Full TypeScript coverage for reliability
5. **Optimized Rendering**: Minimal draw calls through instancing and LOD

## Technology Stack Deep Dive

### Frontend Framework
- **Next.js 15.3.5**: App Router for optimal performance and SEO
- **React 18**: Concurrent features for smooth updates
- **TypeScript 5.8.3**: Strict mode for type safety

### 3D Rendering Pipeline
- **Three.js**: Core 3D engine
- **React Three Fiber**: Declarative Three.js with React
- **@react-three/drei**: Helper components and utilities
- **@react-three/postprocessing**: Optimized post-processing effects

### State Management
- **Zustand**: Lightweight state management for performance-critical data
- **React Context**: UI state that doesn't impact rendering performance

### Styling & Animation
- **Tailwind CSS v4**: Utility-first CSS with custom 3D-specific utilities
- **Framer Motion**: Smooth UI animations without impacting 3D performance

## Component Architecture

### Scene Graph Hierarchy
```
<Canvas>
  ├── <CityScene>
  │   ├── <Lighting>
  │   │   ├── <ambientLight>
  │   │   └── <directionalLight>
  │   ├── <OrbitControls>
  │   ├── <VancouverCity>
  │   │   ├── <LODManager>
  │   │   │   ├── <DetailedBuilding> (0-60 instances)
  │   │   │   ├── <InstancedBuildingSystem> (multiple groups)
  │   │   │   └── Performance monitoring
  │   │   ├── <Landmarks>
  │   │   ├── <WaterBodies>
  │   │   └── <Parks>
  │   └── <OptimizedPostProcessing>
  │       ├── <SSAO>
  │       ├── <Bloom>
  │       └── <DepthOfField>
  └── <UI Overlay>
      ├── <HeroUI>
      ├── <PostProcessingControls>
      └── <PerformanceMonitor>
```

### Key Components

#### 1. **CityScene.tsx**
Main 3D scene container that manages:
- Canvas configuration
- Camera setup
- Global lighting
- Performance monitoring
- Post-processing pipeline

#### 2. **LODManager.tsx**
Critical performance component that:
- Groups buildings by distance from camera
- Manages detail levels (5 LOD levels)
- Handles building visibility culling
- Optimizes render order

#### 3. **InstancedBuildingSystem.tsx**
Renders thousands of buildings efficiently:
- Groups buildings by material/height
- Single draw call per group
- Dynamic material switching
- Time-of-day lighting updates

#### 4. **VancouverCity.tsx**
Main city component that:
- Loads building data
- Processes buildings for rendering
- Manages landmarks and geography
- Handles loading states

#### 5. **OptimizedPostProcessing.tsx**
Adaptive post-processing pipeline:
- Quality-based effect selection
- Performance monitoring
- Dynamic quality adjustment
- Minimal overhead design

## Data Flow

### Building Data Pipeline
```
1. useVancouverGeoData Hook
   ↓
2. Generate procedural buildings (7 neighborhoods)
   ↓
3. Process buildings (add materials, types)
   ↓
4. LODManager categorization
   ↓
5. InstancedBuildingSystem rendering
```

### State Management Flow
```
User Input → Zustand Store → React Components → Three.js Scene
     ↑                                                    ↓
     └────────── Performance Metrics ←──────────────────┘
```

## Performance Optimization Strategies

### 1. **Geometry Instancing**
- Buildings grouped by height categories (5 groups)
- Shared geometry with instance attributes
- Reduces draw calls from 2500+ to <50

### 2. **Level of Detail System**
```javascript
const LOD_DISTANCES = {
  ULTRA_HIGH: 200,    // 60 buildings max
  HIGH: 600,          // 120 buildings max
  MEDIUM: 1500,       // Instanced rendering
  LOW: 3000,          // Simplified geometry
  VERY_LOW: 8000      // Minimal detail
}
```

### 3. **Material Optimization**
- LOD 0-1: Full PBR materials
- LOD 2: Lambert materials
- LOD 3-4: Basic materials
- Shared material instances

### 4. **Culling Strategies**
- Frustum culling (automatic via Three.js)
- Distance culling (buildings beyond 8km)
- Occlusion culling (planned)

### 5. **Memory Management**
- Dispose unused geometries
- Texture size limits
- Progressive loading
- Automatic cleanup on unmount

## Rendering Pipeline

### Frame Lifecycle
1. **Update Phase**
   - Camera position check
   - LOD updates (throttled)
   - Animation updates

2. **Render Phase**
   - Frustum culling
   - Draw instanced meshes
   - Post-processing pass

3. **Cleanup Phase**
   - Dispose old LOD data
   - Update performance metrics

### Shader Architecture
- **Building Glass Shader**: Custom transparency with reflections
- **Volumetric Fog**: Optimized exponential fog
- **Post-processing**: Minimal overhead effects

## Build & Deployment

### Build Process
1. TypeScript compilation
2. Next.js optimization
3. Three.js tree shaking
4. Asset optimization
5. Static generation

### Bundle Optimization
- Code splitting by route
- Dynamic imports for 3D components
- Minimal first load JS (141KB)
- Progressive enhancement

## Scalability Considerations

### Adding New Cities
1. Create new city component
2. Define neighborhood structure
3. Add landmark data
4. Configure LOD settings
5. Test performance

### Performance Scaling
- Current: 2,500 buildings @ 60 FPS
- Tested: 5,000 buildings @ 45 FPS
- Maximum: 10,000 buildings @ 30 FPS

### Future Optimizations
1. **GPU Instancing**: Further reduce draw calls
2. **Texture Atlasing**: Combine building textures
3. **Web Workers**: Offload data processing
4. **WebGPU**: Next-gen rendering API
5. **Streaming LOD**: Progressive detail loading

## Development Workflow

### Local Development
```bash
npm run dev
# Runs Next.js dev server with HMR
# Three.js inspector available in dev mode
```

### Performance Profiling
1. Chrome DevTools Performance tab
2. Three.js inspector for draw calls
3. React DevTools for component updates
4. Custom performance monitor

### Testing Strategy
- Visual regression testing
- Performance benchmarks
- Device testing matrix
- Lighthouse CI integration

## Security Considerations

- No sensitive data in client
- CORS-enabled asset loading
- CSP headers configured
- Input sanitization for future features

## Monitoring & Analytics

### Performance Metrics
- FPS tracking
- Memory usage
- Draw call count
- Load time metrics

### Error Handling
- Error boundaries for React
- WebGL context loss handling
- Fallback rendering modes
- User-friendly error messages

---

This architecture is designed to scale from single city to global coverage while maintaining exceptional performance and visual quality.
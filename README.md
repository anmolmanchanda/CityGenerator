# CityGenerator 🏙️

A production-grade 3D city visualization platform featuring photorealistic Vancouver with real-time performance. Built to outperform traditional data dashboards with stunning visuals and smooth 60 FPS navigation.

![CityGenerator](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black)
![Three.js](https://img.shields.io/badge/Three.js-Latest-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Performance](https://img.shields.io/badge/Performance-60%20FPS-success)

## 🚀 Overview

CityGenerator transforms urban data into jaw-dropping 3D experiences. Navigate through a photorealistic Vancouver with 2,500+ buildings across 7 distinct neighborhoods, complete with landmarks, parks, and water bodies.

### ✨ Key Features

- **🏗️ Full Vancouver Infrastructure**: 2,500+ buildings procedurally generated across realistic neighborhoods
- **🎮 Smooth Navigation**: 60 FPS performance with full 360° camera rotation
- **🎨 Cinematic Graphics**: Advanced post-processing with SSAO, bloom, depth of field
- **⚡ Instant Loading**: <3 seconds initial load, immediate interaction
- **🌆 Dynamic LOD System**: Seamlessly renders from street-level detail to city-wide views
- **🌉 Iconic Landmarks**: Lions Gate Bridge, BC Place, Science World, Canada Place
- **🌳 Complete Geography**: Stanley Park, English Bay, False Creek, and more

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.3.5 (App Router) + TypeScript
- **3D Engine**: Three.js + React Three Fiber
- **Styling**: Tailwind CSS v4 + Framer Motion
- **State**: Zustand for performance-critical state management
- **Optimization**: Custom LOD system, instanced rendering, progressive loading

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/anmolmanchanda/CityGenerator.git
cd CityGenerator

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see Vancouver in 3D!

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 🎮 Controls & Usage

### Camera Navigation
- **Mouse**: Click and drag to rotate view
- **Scroll**: Zoom in/out (50m - 5000m range)
- **Click + Drag**: Pan across the city
- **Full 360°**: Rotate in any direction including under the city

### Graphics Settings
- **Low**: Basic rendering, 60+ FPS on all devices
- **Medium**: Balanced quality with post-processing (default)
- **High**: Cinematic quality with all effects
- **Ultra**: Maximum quality with advanced effects

### UI Features
- **Graphics Panel**: Real-time quality adjustment
- **Performance Monitor**: FPS and memory usage display
- **Responsive Design**: Works on desktop and mobile

## 🏗️ Architecture

### Project Structure
```
CityGenerator/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx             # Main entry point
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   ├── CityScene.tsx        # Main 3D scene container
│   │   ├── HeroUI.tsx           # UI overlay
│   │   ├── PostProcessingControls.tsx  # Graphics settings
│   │   ├── LODManager.tsx       # Level of detail system
│   │   ├── InstancedBuildingSystem.tsx # Instanced rendering
│   │   ├── OptimizedPostProcessing.tsx # Post-processing pipeline
│   │   └── city/
│   │       ├── VancouverCity.tsx      # Vancouver scene
│   │       └── DetailedBuilding.tsx   # High-detail buildings
│   ├── hooks/
│   │   └── useVancouverGeoData.ts    # Data loading hook
│   ├── lib/
│   │   ├── store.ts             # Zustand store
│   │   ├── vancouverData.ts     # Data processing
│   │   └── geoJsonLoader.ts     # GeoJSON parser
│   ├── shaders/                 # Custom GLSL shaders
│   ├── utils/                   # Utility functions
│   └── types/                   # TypeScript definitions
├── public/
│   ├── data/                    # GeoJSON data files
│   └── hdri/                    # HDR environment maps
└── package.json
```

### Core Systems

#### 1. **Level of Detail (LOD) System**
Dynamically adjusts building complexity based on distance:
- **Ultra High (0-200m)**: Full architectural details, rooftop features
- **High (200-600m)**: Individual buildings with PBR materials
- **Medium (600-1500m)**: Instanced buildings with optimized geometry
- **Low (1500-3000m)**: Simplified instanced rendering
- **Very Low (3000m+)**: Minimal geometry for distant views

#### 2. **Instanced Rendering**
Groups buildings by height/material for massive performance gains:
- Reduces draw calls from 2500+ to <50
- Maintains unique building characteristics
- Supports dynamic time-of-day lighting

#### 3. **Vancouver Neighborhoods**
Realistic city layout with distinct areas:
- **Downtown Core**: 200 high-rises (50-300m)
- **West End**: 300 mid-rise residential (25-80m)
- **Yaletown**: 180 mixed-use buildings (30-120m)
- **Kitsilano**: 400 low-rise residential (8-35m)
- **Commercial Drive**: 350 mixed buildings (10-45m)
- **Richmond**: 600 suburban houses (6-25m)
- **Burnaby**: 450 hillside buildings (8-40m)

#### 4. **Performance Optimizations**
- **Frustum Culling**: Only render visible buildings
- **Progressive Loading**: Load data in chunks
- **Adaptive Quality**: Adjust effects based on FPS
- **Memory Management**: Automatic cleanup of unused resources
- **Instanced Materials**: Share materials across similar buildings

## 📊 Performance Metrics

### Target Performance
- **Initial Load**: <3 seconds
- **Frame Rate**: 60 FPS (high-end), 30+ FPS (mobile)
- **Memory Usage**: <500MB peak
- **Building Count**: 2,500+ simultaneous
- **Draw Calls**: <50 (optimized from 2,500+)

### Optimization Techniques
1. **Geometry Instancing**: Single draw call per building category
2. **LOD System**: Distance-based detail reduction
3. **Texture Atlasing**: Shared textures for similar buildings
4. **Occlusion Culling**: Skip hidden buildings
5. **Progressive Enhancement**: Start simple, add detail

## 🎨 Visual Features

### Post-Processing Pipeline
- **SSAO**: Screen-space ambient occlusion for depth
- **Bloom**: Glowing lights and atmospheric effects
- **Depth of Field**: Focus effects for cinematic feel
- **Film Grain**: Subtle texture for realism
- **Color Grading**: Professional color correction
- **Chromatic Aberration**: Lens distortion effects

### Materials & Lighting
- **PBR Materials**: Physically-based rendering
- **Glass Buildings**: Transparency with reflections
- **Metal Surfaces**: Accurate metalness/roughness
- **Dynamic Shadows**: Real-time shadow mapping
- **Night Lighting**: Buildings glow after dark
- **Weather Effects**: Atmospheric conditions

## 🔧 Configuration

### Environment Variables
```env
# Performance Settings
NEXT_PUBLIC_MAX_DETAILED_BUILDINGS=300
NEXT_PUBLIC_LOD_DISTANCES="200,600,1500,3000,8000"

# Feature Flags
NEXT_PUBLIC_ENABLE_HDR=false  # Disabled for performance
NEXT_PUBLIC_ENABLE_GEOJSON=false  # Using optimized fallback
```

### Customization Options
- Adjust LOD distances in `LODManager.tsx`
- Modify building generation in `useVancouverGeoData.ts`
- Customize materials in `InstancedBuildingSystem.tsx`
- Add new post-processing effects in `OptimizedPostProcessing.tsx`

## 🧪 Development

### Prerequisites
- Node.js 18+
- Modern browser with WebGL 2.0 support
- 4GB+ RAM recommended
- GPU with decent 3D capabilities

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

### Performance Testing
1. Open Chrome DevTools
2. Go to Performance tab
3. Start recording
4. Navigate around the city
5. Stop recording and analyze frame times

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure tests pass and performance is maintained
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### Code Style
- Use TypeScript strict mode
- Follow React best practices
- Optimize for performance
- Add comments for complex logic
- Test on multiple devices

## 📈 Future Roadmap

- [ ] Real GeoJSON integration (currently using optimized fallback)
- [ ] HDR environment mapping (disabled for performance)
- [ ] Additional cities (Toronto, New York, Tokyo, London)
- [ ] Real-time data integration (traffic, weather)
- [ ] VR/AR support
- [ ] Multiplayer exploration
- [ ] Building interiors
- [ ] Day/night cycle automation
- [ ] Seasonal changes

## 🐛 Known Issues

- HDR environments temporarily disabled for performance
- GeoJSON loading bypassed in favor of procedural generation
- Post-processing may impact performance on older devices

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Three.js community for the amazing 3D framework
- React Three Fiber team for declarative 3D
- Next.js team for the blazing-fast framework
- Vancouver Open Data initiative (data structure reference)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/anmolmanchanda/CityGenerator/issues)
- **Email**: manchandaanmol@icloud.com
- **Documentation**: See `/docs` folder (coming soon)

---

**Built with passion for next-generation data visualization**

*Transform your city data into cinematic 3D experiences.*
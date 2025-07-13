# Vancouver Building Data Sources & Implementation Guide

## Overview
This guide provides comprehensive information on obtaining real building data for Vancouver, BC to create photorealistic 3D city visualizations, along with sample code for implementing data fetching in React/Next.js applications.

## 1. Data Sources Summary

### Vancouver Open Data Portal (Primary Source)
**Best for:** Current, official building footprints with API access

**Available Datasets:**
- Building Footprints 2015: Most recent official dataset
- Building Footprints 2009: Generated from LiDAR data
- Building Footprints 1999: Downtown peninsula only

**Formats:** GeoJSON, JSON, CSV, Shapefile, KML
**API Access:** Yes, RESTful API available

### OpenStreetMap Overpass API
**Best for:** Community-maintained data with some building attributes

**Advantages:**
- Global coverage
- May include building heights and floor counts
- Real-time data access
- Free to use

**Limitations:**
- Data quality varies by area
- Not all buildings have height information

### LiDAR Data (Advanced Option)
**Best for:** Creating custom 3D models with accurate heights

**Available:**
- 2022 LiDAR (most recent, 49 points/m²)
- 2018 LiDAR (30 points/m²)
- 2013 LiDAR (12 points/m²)

## 2. Specific URLs and API Endpoints

### Vancouver Open Data Portal APIs

#### Building Footprints 2015 (Recommended)
```
Base URL: https://opendata.vancouver.ca/api/records/1.0/search/?dataset=building-footprints-2015

GeoJSON Download: https://opendata.vancouver.ca/explore/dataset/building-footprints-2015/download?format=geojson

JSON Download: https://opendata.vancouver.ca/explore/dataset/building-footprints-2015/download?format=json
```

#### Building Footprints 2009
```
Base URL: https://opendata.vancouver.ca/api/records/1.0/search/?dataset=building-footprints-2009

GeoJSON Download: https://opendata.vancouver.ca/explore/dataset/building-footprints-2009/download?format=geojson
```

### OpenStreetMap Overpass API
```
Base URL: https://overpass-api.de/api/interpreter
Overpass Turbo: https://overpass-turbo.eu/
```

### LiDAR Data Access
```
2022 LiDAR: https://opendata.vancouver.ca/explore/dataset/lidar-2022/
2018 LiDAR: https://opendata.vancouver.ca/explore/dataset/lidar-2018/
2013 LiDAR: https://opendata.vancouver.ca/explore/dataset/lidar-2013/
```

## 3. Sample Code Implementation

### React Hook for Vancouver Building Data
```javascript
// hooks/useVancouverBuildings.js
import { useState, useEffect } from 'react';

export const useVancouverBuildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBuildingData();
  }, []);

  const fetchBuildingData = async () => {
    try {
      setLoading(true);
      
      // Option 1: Direct GeoJSON download (for complete dataset)
      const response = await fetch(
        'https://opendata.vancouver.ca/explore/dataset/building-footprints-2015/download?format=geojson'
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const geoJsonData = await response.json();
      
      // Transform GeoJSON to format suitable for 3D visualization
      const transformedBuildings = geoJsonData.features.map((feature, index) => ({
        id: index,
        coordinates: feature.geometry.coordinates,
        type: feature.geometry.type,
        properties: feature.properties,
        // Add default height since 2015 data doesn't include heights
        height: Math.random() * 50 + 10, // Random height for demo
        center: calculatePolygonCenter(feature.geometry.coordinates[0])
      }));
      
      setBuildings(transformedBuildings);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching building data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePolygonCenter = (coordinates) => {
    const x = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
    const y = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
    return [x, y];
  };

  return { buildings, loading, error, refetch: fetchBuildingData };
};
```

### API-based Data Fetching with Pagination
```javascript
// services/vancouverDataService.js
class VancouverDataService {
  constructor() {
    this.baseUrl = 'https://opendata.vancouver.ca/api/records/1.0/search/';
    this.dataset = 'building-footprints-2015';
  }

  async fetchBuildings(options = {}) {
    const {
      rows = 1000,
      start = 0,
      geofilter = null,
      facet = null
    } = options;

    const params = new URLSearchParams({
      dataset: this.dataset,
      rows: rows.toString(),
      start: start.toString(),
      format: 'json'
    });

    if (geofilter) {
      params.append('geofilter.polygon', geofilter);
    }

    if (facet) {
      params.append('facet', facet);
    }

    try {
      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return this.transformResponse(data);
    } catch (error) {
      console.error('Error fetching Vancouver building data:', error);
      throw error;
    }
  }

  transformResponse(apiResponse) {
    return {
      buildings: apiResponse.records.map(record => ({
        id: record.recordid,
        geometry: record.geometry,
        coordinates: record.geometry.coordinates,
        properties: record.fields,
        center: this.calculateCenter(record.geometry.coordinates)
      })),
      totalCount: apiResponse.nhits,
      hasMore: apiResponse.records.length === 1000
    };
  }

  calculateCenter(coordinates) {
    if (!coordinates || !coordinates[0]) return [0, 0];
    
    const coords = coordinates[0];
    const x = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
    const y = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
    return [x, y];
  }

  // Fetch buildings within a bounding box
  async fetchBuildingsInBounds(bounds) {
    const { north, south, east, west } = bounds;
    const polygon = `${west},${south},${east},${south},${east},${north},${west},${north},${west},${south}`;
    
    return this.fetchBuildings({
      geofilter: polygon,
      rows: 10000
    });
  }
}

export default new VancouverDataService();
```

### OpenStreetMap Overpass API Integration
```javascript
// services/overpassService.js
class OverpassService {
  constructor() {
    this.baseUrl = 'https://overpass-api.de/api/interpreter';
  }

  // Query buildings in Vancouver with height information
  async fetchVancouverBuildings() {
    const query = `
      [out:json][timeout:60];
      area["name"="Vancouver"]["admin_level"="8"]["place"="city"]->.vancouver;
      (
        way["building"](area.vancouver);
        relation["building"]["type"="multipolygon"](area.vancouver);
      );
      out geom;
    `;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformOverpassData(data);
    } catch (error) {
      console.error('Error fetching Overpass data:', error);
      throw error;
    }
  }

  transformOverpassData(overpassData) {
    return overpassData.elements
      .filter(element => element.type === 'way' && element.geometry)
      .map(element => ({
        id: element.id,
        coordinates: element.geometry.map(node => [node.lon, node.lat]),
        tags: element.tags || {},
        height: this.extractHeight(element.tags),
        buildingType: element.tags?.building || 'yes',
        levels: element.tags?.['building:levels'] || null
      }));
  }

  extractHeight(tags) {
    if (tags?.height) {
      const height = parseFloat(tags.height.replace(/[^0-9.]/g, ''));
      return isNaN(height) ? null : height;
    }
    
    if (tags?.['building:levels']) {
      const levels = parseInt(tags['building:levels']);
      return isNaN(levels) ? null : levels * 3; // Assume 3m per floor
    }
    
    return null;
  }
}

export default new OverpassService();
```

### Next.js API Route for Server-side Data Fetching
```javascript
// pages/api/buildings/vancouver.js
import VancouverDataService from '../../../services/vancouverDataService';
import OverpassService from '../../../services/overpassService';

export default async function handler(req, res) {
  const { method, query } = req;

  if (method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { source = 'vancouver', bounds } = query;
    let buildingData;

    switch (source) {
      case 'vancouver':
        if (bounds) {
          const boundsObj = JSON.parse(bounds);
          buildingData = await VancouverDataService.fetchBuildingsInBounds(boundsObj);
        } else {
          buildingData = await VancouverDataService.fetchBuildings();
        }
        break;

      case 'osm':
        buildingData = await OverpassService.fetchVancouverBuildings();
        break;

      default:
        return res.status(400).json({ message: 'Invalid data source' });
    }

    res.status(200).json(buildingData);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      message: 'Error fetching building data',
      error: error.message 
    });
  }
}
```

### React Component Integration
```javascript
// components/VancouverCityVisualization.jsx
import { useEffect, useState } from 'react';
import { useVancouverBuildings } from '../hooks/useVancouverBuildings';

const VancouverCityVisualization = () => {
  const { buildings, loading, error } = useVancouverBuildings();
  const [filteredBuildings, setFilteredBuildings] = useState([]);

  useEffect(() => {
    if (buildings.length > 0) {
      // Filter and process buildings for 3D visualization
      const processed = buildings
        .filter(building => building.coordinates && building.coordinates.length > 0)
        .slice(0, 1000); // Limit for performance
      
      setFilteredBuildings(processed);
    }
  }, [buildings]);

  if (loading) return <div>Loading Vancouver buildings...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="city-visualization">
      <h2>Vancouver 3D City Visualization</h2>
      <p>Loaded {filteredBuildings.length} buildings</p>
      
      {/* Your 3D visualization component here */}
      {/* Pass filteredBuildings to your Three.js or other 3D library */}
    </div>
  );
};

export default VancouverCityVisualization;
```

## 4. Data Processing Tips

### Converting Coordinates
Vancouver data uses geographic coordinates (lat/lng). For 3D visualization, you may need to convert to a local coordinate system:

```javascript
// utils/coordinateUtils.js
export const convertToLocalCoordinates = (buildings, centerLat = 49.2827, centerLng = -123.1207) => {
  return buildings.map(building => ({
    ...building,
    localCoordinates: building.coordinates.map(coord => [
      (coord[0] - centerLng) * 111320 * Math.cos(centerLat * Math.PI / 180),
      (coord[1] - centerLat) * 110540
    ])
  }));
};
```

### Adding Height Data
Since official datasets lack height information, you can estimate heights:

```javascript
// utils/heightEstimation.js
export const estimateBuildingHeight = (building) => {
  const area = calculatePolygonArea(building.coordinates);
  const baseHeight = 10; // Minimum height
  const maxHeight = 100; // Maximum height
  
  // Larger buildings tend to be taller
  const areaFactor = Math.min(area / 1000, 1);
  const estimatedHeight = baseHeight + (areaFactor * (maxHeight - baseHeight));
  
  return estimatedHeight + (Math.random() * 10 - 5); // Add some randomness
};
```

## 5. Performance Considerations

### Chunked Loading
```javascript
// utils/dataLoader.js
export const loadBuildingsInChunks = async (chunkSize = 1000) => {
  const chunks = [];
  let start = 0;
  let hasMore = true;

  while (hasMore) {
    const chunk = await VancouverDataService.fetchBuildings({
      rows: chunkSize,
      start
    });
    
    chunks.push(chunk.buildings);
    hasMore = chunk.hasMore;
    start += chunkSize;
  }

  return chunks.flat();
};
```

## 6. Legal and Attribution Requirements

### Vancouver Open Data
- Licensed under Open Government License - Vancouver
- Attribution: "Contains information licensed under the Open Government License – Vancouver"

### OpenStreetMap
- Licensed under Open Database License (ODbL)
- Attribution required: "© OpenStreetMap contributors"

## 7. Next Steps

1. **Start with Vancouver Open Data Portal** for reliable 2D footprints
2. **Supplement with OpenStreetMap** for additional building attributes
3. **Process LiDAR data** if you need accurate 3D heights
4. **Implement level-of-detail (LOD)** for performance with large datasets
5. **Consider caching strategies** for production applications

This implementation provides a solid foundation for integrating real Vancouver building data into your 3D city visualization application.
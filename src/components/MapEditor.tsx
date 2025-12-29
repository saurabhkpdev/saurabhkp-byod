import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, MapPin, Pencil, Trash2, Move, Square, Circle as CircleIcon } from 'lucide-react';
import { DataColumn, DataRow } from '@/types/data';
import { toast } from 'sonner';

interface MapEditorProps {
  columns: DataColumn[];
  rows: DataRow[];
  onUpdateCoordinates: (rowIndex: number, lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [10.0, 50.0]; // Europe center
const DEFAULT_ZOOM = 4;

export const MapEditor = ({ columns, rows, onUpdateCoordinates }: MapEditorProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [drawMode, setDrawMode] = useState<'select' | 'point' | 'polygon' | 'line'>('select');

  // Find latitude and longitude columns
  const latColumn = columns.find(c => 
    c.name.toLowerCase().includes('lat') || 
    c.name.toLowerCase() === 'latitude'
  );
  const lngColumn = columns.find(c => 
    c.name.toLowerCase().includes('lng') || 
    c.name.toLowerCase().includes('lon') || 
    c.name.toLowerCase() === 'longitude'
  );

  const hasGeoData = latColumn && lngColumn;

  const clearMarkers = useCallback(() => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
  }, []);

  const addMarkers = useCallback(() => {
    if (!map.current || !hasGeoData) return;

    clearMarkers();

    rows.forEach((row, index) => {
      const lat = row.values[latColumn!.name] as number;
      const lng = row.values[lngColumn!.name] as number;

      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = `
          <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform">
            ${index + 1}
          </div>
        `;

        const marker = new mapboxgl.Marker({
          element: el,
          draggable: true,
        })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        // Add popup
        const nameColumn = columns.find(c => c.name.toLowerCase().includes('name'));
        const popupContent = nameColumn 
          ? `<strong>${row.values[nameColumn.name]}</strong><br/>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
          : `Row ${index + 1}<br/>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(popupContent);

        marker.setPopup(popup);

        // Handle drag end
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onUpdateCoordinates(index, lngLat.lat, lngLat.lng);
          toast.success(`Updated coordinates for row ${index + 1}`);
        });

        // Handle click for selection
        el.addEventListener('click', () => {
          setSelectedMarker(index);
        });

        markers.current.push(marker);
      }
    });
  }, [rows, columns, latColumn, lngColumn, hasGeoData, onUpdateCoordinates, clearMarkers]);

  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Initialize draw controls
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          line_string: true,
          point: true,
          trash: true,
        },
        defaultMode: 'simple_select',
      });

      map.current.addControl(draw.current, 'top-left');

      map.current.on('load', () => {
        setIsMapLoaded(true);
        addMarkers();

        // Fit bounds to markers
        if (markers.current.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          markers.current.forEach(marker => {
            bounds.extend(marker.getLngLat());
          });
          map.current?.fitBounds(bounds, { padding: 50 });
        }
      });

      // Handle draw events
      map.current.on('draw.create', (e: { features: GeoJSON.Feature[] }) => {
        const features = e.features;
        if (features && features.length > 0) {
          toast.success(`Created ${features[0].geometry.type}`);
        }
      });

      map.current.on('draw.update', () => {
        toast.success('Shape updated');
      });

      map.current.on('draw.delete', () => {
        toast.success('Shape deleted');
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to initialize map. Check your Mapbox token.');
    }
  }, [mapboxToken, addMarkers]);

  useEffect(() => {
    if (mapboxToken && !map.current) {
      initializeMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, initializeMap]);

  useEffect(() => {
    if (isMapLoaded && hasGeoData) {
      addMarkers();
    }
  }, [rows, isMapLoaded, hasGeoData, addMarkers]);

  const handleDrawModeChange = (mode: typeof drawMode) => {
    setDrawMode(mode);
    if (draw.current) {
      switch (mode) {
        case 'point':
          draw.current.changeMode('draw_point');
          break;
        case 'polygon':
          draw.current.changeMode('draw_polygon');
          break;
        case 'line':
          draw.current.changeMode('draw_line_string');
          break;
        default:
          draw.current.changeMode('simple_select');
      }
    }
  };

  const handleDeleteSelected = () => {
    if (draw.current) {
      const selectedIds = draw.current.getSelectedIds();
      if (selectedIds.length > 0) {
        draw.current.delete(selectedIds);
        toast.success('Deleted selected shapes');
      }
    }
  };

  if (!hasGeoData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Geographic Data Found</h3>
          <p className="text-muted-foreground">
            This dataset doesn't contain latitude/longitude columns. 
            The map editor requires columns named 'latitude', 'lat', 'longitude', 'lng', or 'lon'.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!mapboxToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Map Editor Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            To use the map editor, you need to provide a Mapbox public access token.
            You can get one for free at{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              mapbox.com
            </a>
          </p>
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Access Token</Label>
            <div className="flex gap-2">
              <Input
                id="mapbox-token"
                type="text"
                placeholder="pk.eyJ1Ijoi..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="flex-1"
              />
              <Button onClick={initializeMap} disabled={!mapboxToken}>
                Load Map
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Map Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={drawMode === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDrawModeChange('select')}
              title="Select Mode"
            >
              <Move className="w-4 h-4" />
            </Button>
            <Button
              variant={drawMode === 'point' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDrawModeChange('point')}
              title="Add Point"
            >
              <CircleIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={drawMode === 'polygon' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDrawModeChange('polygon')}
              title="Draw Polygon"
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant={drawMode === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDrawModeChange('line')}
              title="Draw Line"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              title="Delete Selected"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Drag markers to update coordinates. Use drawing tools to add shapes.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapContainer} className="h-[500px] w-full" />
        {selectedMarker !== null && (
          <div className="p-4 border-t bg-muted/50">
            <p className="text-sm">
              <strong>Selected:</strong> Row {selectedMarker + 1}
              {columns.find(c => c.name.toLowerCase().includes('name')) && (
                <span className="ml-2">
                  ({rows[selectedMarker]?.values[columns.find(c => c.name.toLowerCase().includes('name'))!.name]})
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

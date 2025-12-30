import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, MapPin, Move, Trash2 } from 'lucide-react';
import { DataColumn, DataRow } from '@/types/data';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';

interface LeafletMapEditorProps {
  columns: DataColumn[];
  rows: DataRow[];
  onUpdateCoordinates: (rowIndex: number, lat: number, lng: number) => void;
}

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom numbered marker icon
const createNumberedIcon = (number: number, isSelected: boolean = false) => {
  return L.divIcon({
    className: 'custom-numbered-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${isSelected ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
        cursor: grab;
      ">
        ${number}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to fit bounds
const FitBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);
  
  return null;
};

// Draggable marker component
interface DraggableMarkerProps {
  position: [number, number];
  index: number;
  name?: string;
  onDragEnd: (index: number, lat: number, lng: number) => void;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

const DraggableMarker = ({ 
  position, 
  index, 
  name, 
  onDragEnd, 
  isSelected,
  onSelect 
}: DraggableMarkerProps) => {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const latlng = marker.getLatLng();
        onDragEnd(index, latlng.lat, latlng.lng);
      }
    },
    click() {
      onSelect(index);
    },
  };

  return (
    <Marker
      position={position}
      draggable
      ref={markerRef}
      eventHandlers={eventHandlers}
      icon={createNumberedIcon(index + 1, isSelected)}
    >
      <Popup>
        <div className="text-sm">
          {name ? <strong>{name}</strong> : <span>Row {index + 1}</span>}
          <br />
          <span className="text-muted-foreground">
            Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
          </span>
        </div>
      </Popup>
    </Marker>
  );
};

export const LeafletMapEditor = ({ columns, rows, onUpdateCoordinates }: LeafletMapEditorProps) => {
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const { logEvent } = useAuditLog();

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
  const nameColumn = columns.find(c => c.name.toLowerCase().includes('name'));

  const hasGeoData = latColumn && lngColumn;

  // Get valid points
  const points: { lat: number; lng: number; name?: string; index: number }[] = [];
  rows.forEach((row, index) => {
    const lat = row[latColumn?.name || ''] as number;
    const lng = row[lngColumn?.name || ''] as number;
    
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      points.push({
        lat,
        lng,
        name: nameColumn ? String(row[nameColumn.name] || '') : undefined,
        index,
      });
    }
  });

  const handleDragEnd = useCallback((index: number, lat: number, lng: number) => {
    onUpdateCoordinates(index, lat, lng);
    logEvent('coordinates_updated', `Updated coordinates for row ${index + 1} via map`, 'Data Upload', { rowIndex: index, lat, lng });
    toast.success(`Updated coordinates for row ${index + 1}`);
  }, [onUpdateCoordinates, logEvent]);

  const handleSelect = useCallback((index: number) => {
    setSelectedMarker(prev => prev === index ? null : index);
  }, []);

  const centerPoint: [number, number] = points.length > 0
    ? [
        points.reduce((sum, p) => sum + p.lat, 0) / points.length,
        points.reduce((sum, p) => sum + p.lng, 0) / points.length,
      ]
    : [50.0, 10.0]; // Default to Europe center

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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Map Editor
            <span className="text-xs font-normal text-muted-foreground ml-2">(OpenStreetMap - No API key required)</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMarker(null)}
              title="Clear Selection"
              disabled={selectedMarker === null}
            >
              <Move className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Drag markers to update coordinates. Click a marker to select it.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[500px] w-full">
          <MapContainer
            center={centerPoint}
            zoom={4}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.length > 0 && <FitBounds points={points.map(p => [p.lat, p.lng])} />}
            {points.map((point) => (
              <DraggableMarker
                key={point.index}
                position={[point.lat, point.lng]}
                index={point.index}
                name={point.name}
                onDragEnd={handleDragEnd}
                isSelected={selectedMarker === point.index}
                onSelect={handleSelect}
              />
            ))}
          </MapContainer>
        </div>
        {selectedMarker !== null && (
          <div className="p-4 border-t bg-muted/50">
            <p className="text-sm">
              <strong>Selected:</strong> Row {selectedMarker + 1}
              {nameColumn && rows[selectedMarker] && (
                <span className="ml-2">
                  ({rows[selectedMarker][nameColumn.name]})
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

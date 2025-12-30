import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, MapPin, Move } from 'lucide-react';
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
        background: ${isSelected ? '#dc2626' : '#6366f1'};
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

export const LeafletMapEditor = ({ columns, rows, onUpdateCoordinates }: LeafletMapEditorProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
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
  const getPoints = useCallback(() => {
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
    return points;
  }, [rows, latColumn, lngColumn, nameColumn]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !hasGeoData || mapRef.current) return;

    const points = getPoints();
    const centerLat = points.length > 0 
      ? points.reduce((sum, p) => sum + p.lat, 0) / points.length 
      : 50.0;
    const centerLng = points.length > 0 
      ? points.reduce((sum, p) => sum + p.lng, 0) / points.length 
      : 10.0;

    mapRef.current = L.map(mapContainer.current).setView([centerLat, centerLng], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.current);

    setIsMapInitialized(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [hasGeoData, getPoints]);

  // Add/update markers
  useEffect(() => {
    if (!mapRef.current || !isMapInitialized) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const points = getPoints();

    // Add markers
    points.forEach((point) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: createNumberedIcon(point.index + 1, selectedMarker === point.index),
        draggable: true,
      });

      // Popup content
      const popupContent = point.name 
        ? `<strong>${point.name}</strong><br/>Lat: ${point.lat.toFixed(4)}, Lng: ${point.lng.toFixed(4)}`
        : `Row ${point.index + 1}<br/>Lat: ${point.lat.toFixed(4)}, Lng: ${point.lng.toFixed(4)}`;
      
      marker.bindPopup(popupContent);

      // Click handler
      marker.on('click', () => {
        setSelectedMarker(prev => prev === point.index ? null : point.index);
      });

      // Drag end handler
      marker.on('dragend', () => {
        const latlng = marker.getLatLng();
        onUpdateCoordinates(point.index, latlng.lat, latlng.lng);
        logEvent('coordinates_updated', `Updated coordinates for row ${point.index + 1} via map`, 'Data Upload', { 
          rowIndex: point.index, 
          lat: latlng.lat, 
          lng: latlng.lng 
        });
        toast.success(`Updated coordinates for row ${point.index + 1}`);
      });

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // Fit bounds if we have points
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [isMapInitialized, rows, selectedMarker, getPoints, onUpdateCoordinates, logEvent]);

  // Update marker icons when selection changes
  useEffect(() => {
    if (!isMapInitialized) return;
    
    const points = getPoints();
    markersRef.current.forEach((marker, idx) => {
      if (points[idx]) {
        marker.setIcon(createNumberedIcon(points[idx].index + 1, selectedMarker === points[idx].index));
      }
    });
  }, [selectedMarker, getPoints, isMapInitialized]);

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

  const points = getPoints();

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
          Drag markers to update coordinates. Click a marker to select it. {points.length} locations shown.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapContainer} className="h-[500px] w-full" />
        {selectedMarker !== null && rows[selectedMarker] && (
          <div className="p-4 border-t bg-muted/50">
            <p className="text-sm">
              <strong>Selected:</strong> Row {selectedMarker + 1}
              {nameColumn && (
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

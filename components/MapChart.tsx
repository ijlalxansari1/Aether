'use client';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DataRow } from '@/lib/types';
import L from 'leaflet';

// Fix Leaflet's default icon path issues with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapChartProps {
  data: DataRow[];
  latCol: string;
  lngCol: string;
}

export default function MapChart({ data, latCol, lngCol }: MapChartProps) {
  const validData = data.filter(d => !isNaN(Number(d[latCol])) && !isNaN(Number(d[lngCol])));
  
  if (validData.length === 0) return <div style={{ color: 'var(--text-secondary)', padding: '24px', textAlign: 'center' }}>No valid coordinate data found for Map visualization. Please ensure you selected valid numeric columns for Latitude and Longitude.</div>;

  const centerLat = validData.reduce((sum, d) => sum + Number(d[latCol]), 0) / validData.length;
  const centerLng = validData.reduce((sum, d) => sum + Number(d[lngCol]), 0) / validData.length;

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer center={[centerLat, centerLng]} zoom={4} style={{ height: '100%', width: '100%', background: '#1a1a1a' }}>
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {validData.map((d, i) => (
          <CircleMarker 
            key={i} 
            center={[Number(d[latCol]), Number(d[lngCol])]} 
            radius={6} 
            fillColor="var(--cyan)" 
            color="var(--bg-body)" 
            weight={1.5} 
            fillOpacity={0.8}
          >
            <LeafletTooltip>
              <div style={{ color: '#000', fontSize: '12px' }}>
                <strong>Lat:</strong> {d[latCol]} <br/>
                <strong>Lng:</strong> {d[lngCol]}
              </div>
            </LeafletTooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

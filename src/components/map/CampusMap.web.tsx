import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORY_META, URI_CENTER, type IconName } from '@/data/locations';
import { colors } from '@/theme';
import type { CampusMapProps } from './types';

// Leaflet markers are plain HTML, so the icons are drawn with the same
// MaterialCommunityIcons font the rest of the app uses (loaded in _layout).
function glyph(name: IconName, size: number, color: string) {
  const code = (MaterialCommunityIcons.glyphMap as Record<string, number>)[name];
  return `<span style="font-family:material-community;font-size:${size}px;line-height:1;color:${color}">${String.fromCodePoint(code)}</span>`;
}

function badgeIcon(name: IconName, major: boolean) {
  const d = major ? 38 : 30;
  const bg = major ? colors.navy : colors.white;
  const fg = major ? colors.white : colors.navy;
  return L.divIcon({
    className: '',
    iconSize: [d, d],
    iconAnchor: [d / 2, d / 2],
    html: `<div style="width:${d}px;height:${d}px;border-radius:50%;background:${bg};border:2px solid ${colors.navy};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(4,30,66,.25)">${glyph(name, major ? 20 : 16, fg)}</div>`,
  });
}

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 34],
    html: `<div style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">${glyph('map-marker', 36, color)}</div>`,
  });
}

const TOOLTIP_OFFSET: Record<string, L.PointTuple> = { top: [0, -14], bottom: [0, 14], left: [-14, 0], right: [14, 0] };

function FitBounds({ from, to }: Pick<CampusMapProps, 'from' | 'to'>) {
  const map = useMap();
  useEffect(() => {
    const pts = [from, to].filter(Boolean).map((p) => [p!.lat, p!.lng] as [number, number]);
    if (pts.length === 2) map.fitBounds(pts, { padding: [70, 70], maxZoom: 18 });
    else if (pts.length === 1) map.setView(pts[0], 17);
  }, [map, from?.lat, from?.lng, to?.lat, to?.lng]);
  // The map's container can resize (e.g. switching to the mobile layout).
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

export function CampusMap({ places, from, to, onPlacePress }: CampusMapProps) {
  const fromPin = useMemo(() => pinIcon(colors.keaney), []);
  const toPin = useMemo(() => pinIcon(colors.danger), []);

  return (
    <MapContainer
      center={[URI_CENTER.lat, URI_CENTER.lng]}
      zoom={16}
      zoomControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ZoomControl position="bottomright" />
      <FitBounds from={from} to={to} />

      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={badgeIcon(CATEGORY_META[p.category].icon, !!p.major)}
          eventHandlers={{ click: () => onPlacePress?.(p) }}
          zIndexOffset={p.major ? 100 : 0}
        >
          <Tooltip direction={p.labelSide ?? 'top'} offset={TOOLTIP_OFFSET[p.labelSide ?? 'top']} permanent={!!p.major}>
            {p.name}
          </Tooltip>
        </Marker>
      ))}

      {from && to && (
        <Polyline
          positions={[[from.lat, from.lng], [to.lat, to.lng]]}
          pathOptions={{ color: '#1F5FD1', weight: 6, opacity: 0.85, lineCap: 'round' }}
        />
      )}
      {from && <Marker position={[from.lat, from.lng]} icon={fromPin} zIndexOffset={1000} />}
      {to && <Marker position={[to.lat, to.lng]} icon={toPin} zIndexOffset={1000} />}
    </MapContainer>
  );
}

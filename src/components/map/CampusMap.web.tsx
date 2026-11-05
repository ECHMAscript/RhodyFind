import { memo, useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORY_META, URI_CENTER, type CampusLocation, type IconName } from '@/data/locations';
import { colors } from '@/theme';
import type { LatLng } from '@/lib/geo';
import type { CampusMapProps } from './types';

// Leaflet markers are plain HTML, so the icons are drawn with the same
// MaterialCommunityIcons font the rest of the app uses (loaded in _layout).
function glyph(name: IconName, size: number, color: string) {
  const code = (MaterialCommunityIcons.glyphMap as Record<string, number>)[name];
  return `<span style="font-family:material-community;font-size:${size}px;line-height:1;color:${color}">${String.fromCodePoint(code)}</span>`;
}

// react-leaflet compares props by reference and rebuilds a marker's DOM when
// it gets a new icon object, so icons are created once and reused.
const badgeIcons = new Map<string, L.DivIcon>();

function badgeIcon(name: IconName, major: boolean) {
  const key = `${name}:${major}`;
  let icon = badgeIcons.get(key);
  if (!icon) {
    const d = major ? 38 : 30;
    const bg = major ? colors.navy : colors.white;
    const fg = major ? colors.white : colors.navy;
    icon = L.divIcon({
      className: '',
      iconSize: [d, d],
      iconAnchor: [d / 2, d / 2],
      html: `<div style="width:${d}px;height:${d}px;border-radius:50%;background:${bg};border:2px solid ${colors.navy};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(4,30,66,.25)">${glyph(name, major ? 20 : 16, fg)}</div>`,
    });
    badgeIcons.set(key, icon);
  }
  return icon;
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

const PlaceMarker = memo(function PlaceMarker({
  place,
  onPress,
}: {
  place: CampusLocation;
  onPress?: (place: CampusLocation) => void;
}) {
  const position = useMemo<L.LatLngTuple>(() => [place.lat, place.lng], [place.lat, place.lng]);
  const handlers = useMemo(() => ({ click: () => onPress?.(place) }), [onPress, place]);
  const side = place.labelSide ?? 'top';
  return (
    <Marker
      position={position}
      icon={badgeIcon(CATEGORY_META[place.category].icon, !!place.major)}
      eventHandlers={handlers}
      zIndexOffset={place.major ? 100 : 0}
    >
      <Tooltip direction={side} offset={TOOLTIP_OFFSET[side]} permanent={!!place.major}>
        {place.name}
      </Tooltip>
    </Marker>
  );
});

const toTuple = (p: LatLng): L.LatLngTuple => [p.lat, p.lng];

function FitBounds({ points }: { points: L.LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [60, 60], maxZoom: 18, animate: true });
    else if (points.length === 1) map.setView(points[0], 17, { animate: true });
  }, [map, points]);
  // The map's container can resize (e.g. switching to the mobile layout).
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

const FROM_PIN = pinIcon(colors.keaney);
const TO_PIN = pinIcon(colors.danger);
const USER_ICON = L.divIcon({
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#1F5FD1;border:3px solid #fff;box-shadow:0 0 0 6px rgba(31,95,209,.2)"></div>`,
});
const ROUTE_STYLE: L.PathOptions = { color: '#1F5FD1', weight: 6, opacity: 0.85, lineCap: 'round', lineJoin: 'round' };
const ROUTE_DIM_STYLE: L.PathOptions = { ...ROUTE_STYLE, opacity: 0.35 };
const HIGHLIGHT_STYLE: L.PathOptions = { color: colors.navy, weight: 8, opacity: 1, lineCap: 'round', lineJoin: 'round' };

export const CampusMap = memo(function CampusMap({ places, from, to, onPlacePress, route, highlight, user, fitTo }: CampusMapProps) {
  const fromPos = useMemo<L.LatLngTuple | undefined>(() => from && [from.lat, from.lng], [from?.lat, from?.lng]);
  const toPos = useMemo<L.LatLngTuple | undefined>(() => to && [to.lat, to.lng], [to?.lat, to?.lng]);
  const path = useMemo(
    () => (route ? route.map(toTuple) : fromPos && toPos ? [fromPos, toPos] : undefined),
    [route, fromPos, toPos],
  );
  const highlightPath = useMemo(() => highlight?.map(toTuple), [highlight]);
  const frame = useMemo(
    () => (fitTo ? fitTo.map(toTuple) : ([fromPos, toPos].filter(Boolean) as L.LatLngTuple[])),
    [fitTo, fromPos, toPos],
  );

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
      <FitBounds points={frame} />

      {places.map((p) => (
        <PlaceMarker key={p.id} place={p} onPress={onPlacePress} />
      ))}

      {path && <Polyline positions={path} pathOptions={highlightPath ? ROUTE_DIM_STYLE : ROUTE_STYLE} />}
      {highlightPath && <Polyline positions={highlightPath} pathOptions={HIGHLIGHT_STYLE} />}
      {fromPos && <Marker position={fromPos} icon={FROM_PIN} zIndexOffset={1000} />}
      {toPos && <Marker position={toPos} icon={TO_PIN} zIndexOffset={1000} />}
      {user && <Marker position={toTuple(user)} icon={USER_ICON} zIndexOffset={2000} interactive={false} />}
    </MapContainer>
  );
});

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORY_META, URI_CENTER, type CampusLocation, type IconName } from '@/data/locations';
import { colors } from '@/theme';
import { haversineMeters, type LatLng } from '@/lib/geo';
import { predictPosition, smoothToward } from '@/lib/motion';
import type { LiveFix } from '@/lib/useWatchPosition';
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
  dimmed = false,
}: {
  place: CampusLocation;
  onPress?: (place: CampusLocation) => void;
  /** A route is on the map and this place isn't on it: fade it and drop its label. */
  dimmed?: boolean;
}) {
  const position = useMemo<L.LatLngTuple>(() => [place.lat, place.lng], [place.lat, place.lng]);
  const handlers = useMemo(() => ({ click: () => onPress?.(place) }), [onPress, place]);
  const side = place.labelSide ?? 'top';
  return (
    <Marker
      position={position}
      icon={badgeIcon(CATEGORY_META[place.category].icon, !!place.major)}
      eventHandlers={handlers}
      zIndexOffset={place.major && !dimmed ? 100 : 0}
      opacity={dimmed ? 0.4 : 1}
    >
      {/* Keyed so the label is rebuilt when it switches between always-on and hover-only. */}
      <Tooltip
        key={String(place.major && !dimmed)}
        direction={side}
        offset={TOOLTIP_OFFSET[side]}
        permanent={!!place.major && !dimmed}
      >
        {place.name}
      </Tooltip>
    </Marker>
  );
});

const toTuple = (p: LatLng): L.LatLngTuple => [p.lat, p.lng];

function FitBounds({ points, bottomInset }: { points: L.LatLngTuple[]; bottomInset: number }) {
  const map = useMap();
  // Read when fitting, so a changing inset doesn't refit the map by itself.
  const inset = useRef(bottomInset);
  useEffect(() => {
    inset.current = bottomInset;
  }, [bottomInset]);
  useEffect(() => {
    if (!points.length) return;
    // Padding that scales with the map: 60 px on a big screen, about 24 px on
    // a phone's map strip, so a short route isn't framed far away. The top
    // gets room for the pins, which stand about 34 px above their point.
    const size = map.getSize();
    const pad = Math.round(Math.max(20, Math.min(60, Math.min(size.x, size.y) * 0.07)));
    map.fitBounds(L.latLngBounds(points), {
      paddingTopLeft: [pad, pad + 30],
      paddingBottomRight: [pad, pad + inset.current],
      maxZoom: points.length > 1 ? 18 : 17,
      animate: true,
    });
  }, [map, points]);
  // The map's container can resize (the mobile layout, or a phone browser's
  // toolbar sliding away). Resizing redraws the route, so never mid-zoom:
  // that would draw it at the in-between zoom, off the road.
  useEffect(() => {
    let zooming = false;
    let resized = false;
    const onZoomStart = () => {
      zooming = true;
    };
    const onZoomEnd = () => {
      zooming = false;
      if (resized) {
        resized = false;
        map.invalidateSize();
      }
    };
    map.on('zoomstart', onZoomStart);
    map.on('zoomend', onZoomEnd);
    const ro = new ResizeObserver(() => {
      if (zooming) resized = true;
      else map.invalidateSize();
    });
    ro.observe(map.getContainer());
    return () => {
      ro.disconnect();
      map.off('zoomstart', onZoomStart);
      map.off('zoomend', onZoomEnd);
    };
  }, [map]);
  // Keep the zoom buttons and map credits above whatever covers the bottom.
  useEffect(() => {
    map.getContainer().querySelectorAll<HTMLElement>('.leaflet-bottom').forEach((el) => {
      el.style.bottom = `${bottomInset}px`;
    });
  }, [map, bottomInset]);
  return null;
}

const FOLLOW_ZOOM = 18;
const NO_POINTS: L.LatLngTuple[] = [];

/**
 * The blue "you are here" dot during navigation, plus the camera that follows
 * it. GPS arrives about once a second; every animation frame this predicts
 * where the user is now (lib/motion.ts) and moves the marker, and the camera
 * when following, straight through Leaflet. React only re-renders once per fix.
 * The first followed frame zooms in; after that the user's zoom is kept.
 * Dragging the map hands the camera back to the user.
 */
function LiveUser({
  fix,
  follow,
  onUserPan,
  bottomInset,
  frameListeners,
}: {
  fix: LiveFix;
  follow: boolean;
  onUserPan?: () => void;
  bottomInset: number;
  /** Called with the dot's position on every frame it moves (route lines trim to it). */
  frameListeners: Set<FrameListener>;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  // Fixed initial position: the animation loop owns the marker's position after that.
  const [initial] = useState<L.LatLngTuple>(() => [fix.position.lat, fix.position.lng]);
  const fixRef = useRef(fix);
  const followRef = useRef(follow);
  useEffect(() => {
    fixRef.current = fix;
  }, [fix]);
  useEffect(() => {
    followRef.current = follow;
  }, [follow]);
  const insetRef = useRef(bottomInset);
  useEffect(() => {
    insetRef.current = bottomInset;
  }, [bottomInset]);

  // Rotate the heading arrow in place instead of building a new icon.
  useEffect(() => {
    const arrow = markerRef.current?.getElement()?.querySelector<HTMLElement>('.rf-heading');
    if (!arrow) return;
    arrow.style.display = fix.heading === undefined ? 'none' : 'block';
    if (fix.heading !== undefined) arrow.style.transform = `rotate(${fix.heading}deg)`;
  }, [fix.heading]);

  useEffect(() => {
    let raf = 0;
    let shown: LatLng | undefined;
    let last = performance.now();
    let zooming = false;
    let zoomedIn = false;
    let inset = insetRef.current; // eases toward insetRef so the camera never jumps
    // The camera's center: half the covered strip below the user, so the
    // user sits in the middle of the part of the map that can be seen.
    const cameraCenter = (ll: L.LatLngTuple, zoom: number) =>
      inset ? map.unproject(map.project(ll, zoom).add([0, inset / 2]), zoom) : L.latLng(ll);
    const onZoomStart = () => {
      zooming = true;
    };
    const onZoomEnd = () => {
      zooming = false;
    };
    map.on('zoomstart', onZoomStart);
    map.on('zoomend', onZoomEnd);

    const frame = (now: number) => {
      const frameMs = Math.min(now - last, 100);
      last = now;
      const target = predictPosition(fixRef.current, Date.now());
      const next = shown ? smoothToward(shown, target, frameMs) : target;
      const moved = !shown || next.lat !== shown.lat || next.lng !== shown.lng;
      shown = next;
      const ll: L.LatLngTuple = [next.lat, next.lng];
      if (moved) {
        markerRef.current?.setLatLng(ll);
        for (const listener of frameListeners) listener(next);
      }
      const insetMoved = Math.abs(insetRef.current - inset) > 0.5;
      inset = insetMoved ? inset + (insetRef.current - inset) * Math.min(1, frameMs / 150) : insetRef.current;
      if (!followRef.current) {
        zoomedIn = false;
      } else if (!zooming) {
        if (!zoomedIn) {
          zoomedIn = true;
          const zoom = Math.max(map.getZoom(), FOLLOW_ZOOM);
          map.setView(cameraCenter(ll, zoom), zoom, { animate: false });
        } else if (moved || insetMoved) {
          // A plain pan: no animation of its own, no re-projection of the layers.
          map.panTo(cameraCenter(ll, map.getZoom()), { animate: false, noMoveStart: true });
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      map.off('zoomstart', onZoomStart);
      map.off('zoomend', onZoomEnd);
    };
  }, [map, frameListeners]);

  useEffect(() => {
    if (!follow || !onUserPan) return;
    // 'dragstart' only fires for the user's own drags, not for panTo.
    map.on('dragstart', onUserPan);
    return () => {
      map.off('dragstart', onUserPan);
    };
  }, [map, follow, onUserPan]);

  return <Marker ref={markerRef} position={initial} icon={USER_ICON} zIndexOffset={2000} interactive={false} />;
}


/**
 * A route line that never redraws mid-zoom. While a zoom (a pinch, or an
 * animated zoom) is in progress Leaflet stretches the drawn line with a CSS
 * transform; redrawing it then (a new GPS fix trims the route) draws it at the
 * in-between zoom and stretches it again, so it slides off the road until the
 * zoom ends. New points that arrive mid-zoom are applied when the zoom ends.
 */
function RouteLine({
  positions,
  pathOptions,
  trimTo,
}: {
  positions: L.LatLngTuple[];
  pathOptions: L.PathOptions;
  /**
   * While navigating: the live dot's frame listeners. The line is then cut at
   * the dot's spot on it every frame, so no route is left behind the user
   * between GPS fixes (which only arrive about once a second).
   */
  trimTo?: Set<FrameListener>;
}) {
  const map = useMap();
  const [line] = useState(() => L.polyline([], pathOptions));
  const zooming = useRef(false);
  const pending = useRef<L.LatLngTuple[] | null>(null);
  const current = useRef(positions);
  const lastCut = useRef<{ index: number; point: LatLng } | null>(null);

  useEffect(() => {
    line.addTo(map);
    const onZoomStart = () => {
      zooming.current = true;
    };
    const onZoomEnd = () => {
      zooming.current = false;
      if (pending.current) {
        line.setLatLngs(pending.current);
        pending.current = null;
      }
    };
    map.on('zoomstart', onZoomStart);
    map.on('zoomend', onZoomEnd);
    return () => {
      map.off('zoomstart', onZoomStart);
      map.off('zoomend', onZoomEnd);
      line.remove();
    };
  }, [map, line]);

  useEffect(() => {
    line.setStyle(pathOptions);
  }, [line, pathOptions]);

  useEffect(() => {
    current.current = positions;
    lastCut.current = null;
    if (zooming.current) pending.current = positions;
    else {
      pending.current = null;
      line.setLatLngs(positions);
    }
  }, [line, positions]);

  useEffect(() => {
    if (!trimTo) return;
    const onFrame = (p: LatLng) => {
      // Never redraw mid-zoom (see above); the next frame after it catches up.
      if (zooming.current || pending.current) return;
      const pts = current.current;
      const cut = cutAtUser(pts, p);
      if (!cut) return;
      const prev = lastCut.current;
      // Skip changes too small to see (well under a pixel at street zoom).
      if (prev && prev.index === cut.index && haversineMeters(prev.point, cut.point) < 0.3) return;
      lastCut.current = cut;
      line.setLatLngs([[cut.point.lat, cut.point.lng], ...pts.slice(cut.index + 1)]);
    };
    trimTo.add(onFrame);
    return () => {
      trimTo.delete(onFrame);
      // No longer following: show the whole line again.
      lastCut.current = null;
      if (!zooming.current) line.setLatLngs(current.current);
    };
  }, [trimTo, line]);

  return null;
}

type FrameListener = (p: LatLng) => void;

// How far along the line to look for the user (segments), and how far off it
// they can be before the line is left alone (they're off route).
const TRIM_SEGMENTS = 16;
const TRIM_MAX_METERS = 40;

/**
 * Where to cut a route line so it starts at the user: the closest point to `p`
 * on the line's first few segments, and the segment it's on. Null when the
 * user isn't near the line.
 */
function cutAtUser(pts: L.LatLngTuple[], p: LatLng): { index: number; point: LatLng } | null {
  if (pts.length < 2) return null;
  // Flat x/y in meters around p; plenty accurate over a few hundred meters.
  const kx = 111320 * Math.cos((p.lat * Math.PI) / 180);
  const ky = 110540;
  let best: { index: number; point: LatLng; d2: number } | null = null;
  const last = Math.min(pts.length - 2, TRIM_SEGMENTS - 1);
  for (let i = 0; i <= last; i++) {
    const ax = (pts[i][1] - p.lng) * kx;
    const ay = (pts[i][0] - p.lat) * ky;
    const bx = (pts[i + 1][1] - p.lng) * kx;
    const by = (pts[i + 1][0] - p.lat) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const x = ax + t * dx;
    const y = ay + t * dy;
    const d2 = x * x + y * y;
    if (!best || d2 < best.d2) best = { index: i, point: { lat: p.lat + y / ky, lng: p.lng + x / kx }, d2 };
  }
  return best && best.d2 <= TRIM_MAX_METERS * TRIM_MAX_METERS ? best : null;
}

const FROM_PIN = pinIcon(colors.keaney);
const TO_PIN = pinIcon(colors.danger);
const USER_ICON = L.divIcon({
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  html:
    `<div style="position:relative;width:44px;height:44px">` +
    // Heading cone, rotated around the dot's center.
    `<div class="rf-heading" style="display:none;position:absolute;inset:0;transition:transform .3s linear">` +
    `<div style="position:absolute;left:14px;top:0;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:14px solid #1F5FD1"></div></div>` +
    `<div style="position:absolute;left:12px;top:12px;width:20px;height:20px;border-radius:50%;background:#1F5FD1;border:3px solid #fff;box-sizing:border-box;box-shadow:0 0 0 6px rgba(31,95,209,.2)"></div>` +
    `</div>`,
});
const ROUTE_STYLE: L.PathOptions = { color: '#1F5FD1', weight: 6, opacity: 0.85, lineCap: 'round', lineJoin: 'round' };
const ROUTE_DIM_STYLE: L.PathOptions = { ...ROUTE_STYLE, opacity: 0.35 };
const HIGHLIGHT_STYLE: L.PathOptions = { color: colors.navy, weight: 8, opacity: 1, lineCap: 'round', lineJoin: 'round' };

export const CampusMap = memo(function CampusMap({
  places,
  from,
  to,
  onPlacePress,
  route,
  highlight,
  userFix,
  follow = false,
  fitTo,
  onUserPan,
  bottomInset = 0,
  trimRouteToUser = false,
}: CampusMapProps) {
  const [frameListeners] = useState(() => new Set<FrameListener>());
  const trimTo = trimRouteToUser && userFix ? frameListeners : undefined;
  const fromPos = useMemo<L.LatLngTuple | undefined>(() => from && [from.lat, from.lng], [from?.lat, from?.lng]);
  const toPos = useMemo<L.LatLngTuple | undefined>(() => to && [to.lat, to.lng], [to?.lat, to?.lng]);
  const path = useMemo(
    () => (route ? route.map(toTuple) : fromPos && toPos ? [fromPos, toPos] : undefined),
    [route, fromPos, toPos],
  );
  const highlightPath = useMemo(() => highlight?.map(toTuple), [highlight]);
  const hasRoute = !!route;
  const frame = useMemo(
    () => (fitTo ? fitTo.map(toTuple) : ([fromPos, toPos].filter(Boolean) as L.LatLngTuple[])),
    [fitTo, fromPos, toPos],
  );
  // Lines are drawn a full screen beyond each edge (Leaflet's default is 10%),
  // so zooming out doesn't show the route cut off at the old screen edge.
  const [renderer] = useState(() => L.svg({ padding: 1 }));

  return (
    <MapContainer
      center={[URI_CENTER.lat, URI_CENTER.lng]}
      zoom={16}
      zoomControl={false}
      renderer={renderer}
      // Quarter-step zoom, so a route can be framed tightly instead of
      // dropping a whole level when it's slightly too big; the zoom
      // buttons still move a full level.
      zoomSnap={0.25}
      zoomDelta={1}
      wheelPxPerZoomLevel={120}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ZoomControl position="bottomright" />
      <FitBounds points={follow && userFix ? NO_POINTS : frame} bottomInset={bottomInset} />

      {places.map((p) => (
        <PlaceMarker
          key={p.id}
          place={p}
          onPress={onPlacePress}
          dimmed={hasRoute && p.id !== from?.id && p.id !== to?.id}
        />
      ))}

      {path && <RouteLine positions={path} pathOptions={highlightPath ? ROUTE_DIM_STYLE : ROUTE_STYLE} trimTo={trimTo} />}
      {highlightPath && <RouteLine positions={highlightPath} pathOptions={HIGHLIGHT_STYLE} trimTo={trimTo} />}
      {fromPos && <Marker position={fromPos} icon={FROM_PIN} zIndexOffset={1000} />}
      {toPos && <Marker position={toPos} icon={TO_PIN} zIndexOffset={1000} />}
      {userFix && (
        <LiveUser
          fix={userFix}
          follow={follow}
          onUserPan={onUserPan}
          bottomInset={bottomInset}
          frameListeners={frameListeners}
        />
      )}
    </MapContainer>
  );
});

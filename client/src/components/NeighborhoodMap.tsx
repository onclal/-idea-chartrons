import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CHARTRONS_MAP_CENTER } from '@idea-chartrons/shared';

export type MapPinKind = 'commerce' | 'sante' | 'tourisme' | 'relais' | 'marche' | 'event';

export interface MapPin {
  id: string;
  kind: MapPinKind;
  title: string;
  subtitle: string;
  adresse: string;
  latitude: number;
  longitude: number;
  href?: string;
}

const PIN_STYLE: Record<MapPinKind, { color: string; emoji: string }> = {
  commerce: { color: '#1F4D3A', emoji: '🏪' },
  sante: { color: '#3A6B55', emoji: '🩺' },
  tourisme: { color: '#C4A35A', emoji: '🧳' },
  relais: { color: '#5C6B4A', emoji: '📦' },
  marche: { color: '#8B5A2B', emoji: '🥬' },
  event: { color: '#2D6650', emoji: '📅' },
};

function pinIcon(kind: MapPinKind, selected: boolean) {
  const { color, emoji } = PIN_STYLE[kind];
  const size = selected ? 42 : 34;
  return L.divIcon({
    className: 'chartrons-map-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;border-radius:${size / 2}px ${size / 2}px ${size / 2}px 6px;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 2px 8px rgba(61,74,50,.35)"><span style="transform:rotate(45deg);font-size:${selected ? 16 : 13}px;line-height:1">${emoji}</span></div>`,
  });
}

function FlyToSelection({ pin }: { pin: MapPin | null }) {
  const map = useMap();
  useEffect(() => {
    if (!pin) return;
    map.flyTo([pin.latitude, pin.longitude], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [map, pin]);
  return null;
}

function LocateUser({
  active,
  onLocated,
  onError,
}: {
  active: number;
  onLocated: (lat: number, lng: number) => void;
  onError: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;

    if (!navigator.geolocation) {
      onError();
      return;
    }

    let marker: L.CircleMarker | null = null;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        onLocated(lat, lng);
        map.flyTo([lat, lng], 16, { duration: 0.7 });
        marker = L.circleMarker([lat, lng], {
          radius: 9,
          color: '#fff',
          weight: 2,
          fillColor: '#1F4D3A',
          fillOpacity: 1,
        }).addTo(map);
      },
      () => onError(),
      { enableHighAccuracy: true, timeout: 8000 },
    );

    return () => {
      marker?.remove();
    };
  }, [active, map, onError, onLocated]);

  return null;
}

interface NeighborhoodMapProps {
  pins: MapPin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  locateToken: number;
  onLocated: (lat: number, lng: number) => void;
  onLocateError: () => void;
}

export function NeighborhoodMap({
  pins,
  selectedId,
  onSelect,
  locateToken,
  onLocated,
  onLocateError,
}: NeighborhoodMapProps) {
  const selected = pins.find((pin) => pin.id === selectedId) ?? null;

  return (
    <MapContainer
      center={[CHARTRONS_MAP_CENTER.latitude, CHARTRONS_MAP_CENTER.longitude]}
      zoom={15}
      scrollWheelZoom
      className="h-full w-full rounded-2xl"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelection pin={selected} />
      <LocateUser active={locateToken} onLocated={onLocated} onError={onLocateError} />
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.latitude, pin.longitude]}
          icon={pinIcon(pin.kind, pin.id === selectedId)}
          eventHandlers={{ click: () => onSelect(pin.id) }}
        >
          <Popup>
            <p className="font-semibold text-sm m-0">{pin.title}</p>
            <p className="text-xs text-chartrons-warm-gray m-0 mt-1">{pin.adresse}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

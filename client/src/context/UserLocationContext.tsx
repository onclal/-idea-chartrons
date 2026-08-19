import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_USER_ORIGIN,
  type GeoCoordinates,
  type GeoOriginSource,
} from '@idea-chartrons/shared';

interface UserLocationValue {
  origin: GeoCoordinates;
  originSource: GeoOriginSource;
}

const UserLocationContext = createContext<UserLocationValue>({
  origin: DEFAULT_USER_ORIGIN,
  originSource: 'fallback',
});

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 60_000,
};

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [origin, setOrigin] = useState<GeoCoordinates>(DEFAULT_USER_ORIGIN);
  const [originSource, setOriginSource] = useState<GeoOriginSource>('fallback');

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setOriginSource('gps');
      },
      () => {
        setOrigin(DEFAULT_USER_ORIGIN);
        setOriginSource('fallback');
      },
      GEO_OPTIONS,
    );
  }, []);

  const value = useMemo<UserLocationValue>(() => ({ origin, originSource }), [origin, originSource]);
  return <UserLocationContext.Provider value={value}>{children}</UserLocationContext.Provider>;
}

export function useUserLocation(): UserLocationValue {
  return useContext(UserLocationContext);
}

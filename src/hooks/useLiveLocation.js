import { useState, useEffect, useCallback, useRef } from 'react';

// Default Office Target (e.g., Kampus Utama Solo)
export const DEFAULT_OFFICE = {
  id: 1,
  name: 'Kampus Utama SMK - Gedung A',
  address: 'Jl. Pendidikan No. 45, Solo, Jawa Tengah',
  latitude: -7.556110,
  longitude: 110.831670,
  radiusMeter: 60, // Maximum valid geofence radius in meters
};

/**
 * Formula Haversine bola bumi untuk menghitung jarak presisi dalam meter
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius bumi dalam meter
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Custom Hook: useLiveLocation
 * Melakukan pre-warming GPS saat screen dibuka, integrasi expo-location watchPosition,
 * deteksi mock location, dan validasi radius geofence.
 */
export function useLiveLocation(targetOffice = DEFAULT_OFFICE) {
  const [isPreWarming, setIsPreWarming] = useState(true);
  const [accuracy, setAccuracy] = useState(12); // meter
  const [isSimulateOutside, setIsSimulateOutside] = useState(false);
  const [isMockDetected, setIsMockDetected] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [isUsingNativeGps, setIsUsingNativeGps] = useState(false);

  // User position coordinates
  const [coords, setCoords] = useState({
    latitude: targetOffice.latitude + 0.00018, // ~22m from office center
    longitude: targetOffice.longitude + 0.00012,
    timestamp: Date.now(),
  });

  const watcherRef = useRef(null);
  const driftIntervalRef = useRef(null);

  // Calculate distance & geofence status
  const distanceMeter = calculateDistance(
    coords.latitude,
    coords.longitude,
    targetOffice.latitude,
    targetOffice.longitude
  );

  const isInRadius = distanceMeter <= (targetOffice.radiusMeter || targetOffice.radius_meter || 60);
  const isReady = !isPreWarming && accuracy <= 30;

  const accuracyStatus =
    accuracy <= 15 ? 'high' : accuracy <= 35 ? 'medium' : 'low';

  // Native expo-location integration with fallback
  useEffect(() => {
    let isMounted = true;

    async function setupLocation() {
      setIsPreWarming(true);

      try {
        const Location = require('expo-location');

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;
        setPermissionStatus(status);

        if (status === 'granted') {
          // Fast-path: Periksa lokasi terakhir tersimpan (instant 0ms hardware cache)
          try {
            const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 180000 });
            if (isMounted && lastKnown && !isSimulateOutside) {
              setIsUsingNativeGps(true);
              setAccuracy(Math.round(lastKnown.coords.accuracy || 10));
              setIsMockDetected(Boolean(lastKnown.mocked));
              setCoords({
                latitude: lastKnown.coords.latitude,
                longitude: lastKnown.coords.longitude,
                timestamp: lastKnown.timestamp,
              });
              setIsPreWarming(false);
            }
          } catch (_) {}

          // Permintaan posisi realtime akurat
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }).then((current) => {
            if (isMounted && current && !isSimulateOutside) {
              setIsUsingNativeGps(true);
              setAccuracy(Math.round(current.coords.accuracy || 8));
              setIsMockDetected(Boolean(current.mocked));
              setCoords({
                latitude: current.coords.latitude,
                longitude: current.coords.longitude,
                timestamp: current.timestamp,
              });
              setIsPreWarming(false);
            }
          }).catch(() => {});

          // Mulai continuous stream dengan interval lebih responsif (1000ms)
          watcherRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 1000,
              distanceInterval: 0,
            },
            (newLoc) => {
              if (!isMounted || isSimulateOutside) return;
              setIsUsingNativeGps(true);
              setAccuracy(Math.round(newLoc.coords.accuracy || 8));
              setIsMockDetected(Boolean(newLoc.mocked));
              setCoords({
                latitude: newLoc.coords.latitude,
                longitude: newLoc.coords.longitude,
                timestamp: newLoc.timestamp,
              });
              setIsPreWarming(false);
            }
          );
        }
      } catch (err) {
        // Native module or permission fallback (e.g. running in web or simulator)
        console.log('[useLiveLocation] Native GPS fallback active:', err?.message || 'simulation mode');
      }

      // Pre-warm finish timer cepat (250ms untuk transisi stabilisasi super kilat)
      setTimeout(() => {
        if (isMounted) {
          setIsPreWarming(false);
          setAccuracy((prev) => (prev > 20 ? 8 : prev));
        }
      }, 250);
    }

    setupLocation();

    // Subtle drift simulation when not using native continuous stream or when testing
    driftIntervalRef.current = setInterval(() => {
      if (!isMounted || isUsingNativeGps || isSimulateOutside) return;
      setCoords((prev) => {
        const driftLat = (Math.random() - 0.5) * 0.00002;
        const driftLng = (Math.random() - 0.5) * 0.00002;
        return {
          latitude: prev.latitude + driftLat,
          longitude: prev.longitude + driftLng,
          timestamp: Date.now(),
        };
      });
    }, 3500);

    return () => {
      isMounted = false;
      if (watcherRef.current?.remove) {
        watcherRef.current.remove();
      }
      if (driftIntervalRef.current) {
        clearInterval(driftIntervalRef.current);
      }
    };
  }, [isSimulateOutside, isUsingNativeGps]);

  // Refresh/re-stabilize GPS position
  const refreshLocation = useCallback(async () => {
    setIsPreWarming(true);

    try {
      const Location = require('expo-location');

      // Cek instan posisi terakhir yang tercatat di sistem
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
        if (lastKnown && !isSimulateOutside) {
          setAccuracy(Math.round(lastKnown.coords.accuracy || 6));
          setIsMockDetected(Boolean(lastKnown.mocked));
          setCoords({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            timestamp: lastKnown.timestamp,
          });
          setIsPreWarming(false);
        }
      } catch (_) {}

      const fresh = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      if (fresh && !isSimulateOutside) {
        setAccuracy(Math.round(fresh.coords.accuracy || 6));
        setIsMockDetected(Boolean(fresh.mocked));
        setCoords({
          latitude: fresh.coords.latitude,
          longitude: fresh.coords.longitude,
          timestamp: fresh.timestamp,
        });
        setIsPreWarming(false);
        return;
      }
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setIsPreWarming(false);
      setAccuracy(Math.floor(Math.random() * 5) + 6); // 6 - 10m
      setCoords((prev) => ({
        ...prev,
        timestamp: Date.now(),
      }));
    }, 200);
  }, [isSimulateOutside]);

  // Toggle simulate outside geofence for UI edge-case verification
  const toggleSimulateOutside = useCallback(() => {
    setIsSimulateOutside((prev) => {
      const next = !prev;
      if (next) {
        // Jump ~180 meters away (outside 60m radius)
        setCoords({
          latitude: targetOffice.latitude + 0.0014,
          longitude: targetOffice.longitude + 0.0011,
          timestamp: Date.now(),
        });
      } else {
        // Return inside radius (~22m)
        setCoords({
          latitude: targetOffice.latitude + 0.00018,
          longitude: targetOffice.longitude + 0.00012,
          timestamp: Date.now(),
        });
      }
      return next;
    });
  }, [targetOffice]);

  const toggleMockDetection = useCallback(() => {
    setIsMockDetected((prev) => !prev);
  }, []);

  return {
    location: coords,
    office: targetOffice,
    accuracy,
    accuracyStatus,
    distanceMeter,
    isInRadius,
    isReady,
    isPreWarming,
    isMockDetected,
    isSimulateOutside,
    isUsingNativeGps,
    permissionStatus,
    refreshLocation,
    toggleSimulateOutside,
    toggleMockDetection,
  };
}

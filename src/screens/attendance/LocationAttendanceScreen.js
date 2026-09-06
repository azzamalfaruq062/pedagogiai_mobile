import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useLiveLocation, DEFAULT_OFFICE } from '../../hooks/useLiveLocation';
import { locationAttendanceApi } from '../../api/locationAttendanceApi';
import { attendanceSyncQueue, generateUUID } from '../../services/attendanceSyncQueue';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_WIDTH = SCREEN_WIDTH - 40;
const MAP_HEIGHT = 190;

/**
 * Calculates physical meters-to-pixel scale at given latitude and zoom level
 * according to standard Web Mercator EPSG:3857 projection.
 */
function getMetersPerPixel(lat, zoom) {
  const safeLat = typeof lat === 'number' && !isNaN(lat) ? lat : -7.55611;
  const z = zoom || 16;
  return (156543.03392 * Math.cos((safeLat * Math.PI) / 180)) / Math.pow(2, z);
}

/**
 * Calculates ray intersection with the map card boundary
 * so connector lines and off-screen indicators always point along the true bearing.
 */
function clipRayToCard(fromX, fromY, toX, toY, minX = 22, maxX = MAP_WIDTH - 22, minY = 22, maxY = MAP_HEIGHT - 22) {
  const dx = toX - fromX;
  const dy = toY - fromY;

  if (toX >= minX && toX <= maxX && toY >= minY && toY <= maxY) {
    return { x: toX, y: toY, isClipped: false };
  }

  let tMin = 1;
  if (dx > 0 && toX > maxX) {
    tMin = Math.min(tMin, (maxX - fromX) / dx);
  } else if (dx < 0 && toX < minX) {
    tMin = Math.min(tMin, (minX - fromX) / dx);
  }

  if (dy > 0 && toY > maxY) {
    tMin = Math.min(tMin, (maxY - fromY) / dy);
  } else if (dy < 0 && toY < minY) {
    tMin = Math.min(tMin, (minY - fromY) / dy);
  }

  tMin = Math.max(0, Math.min(1, tMin));

  return {
    x: Math.round(fromX + dx * tMin),
    y: Math.round(fromY + dy * tMin),
    isClipped: true,
  };
}

/**
 * Dynamic Multi-Tile Canvas Map Background
 * Renders an exact 3x3 grid of map tiles (MapTiler or CartoDB) perfectly centered at (centerLat, centerLng)
 * giving the mobile app the same visual fidelity as Leaflet on the Web!
 */
const MapTileGrid = React.memo(({ centerLat, centerLng, zoom = 16, isDark = false, mapConfig = null, mapImageError = false, onTileError }) => {
  const containerWidth = MAP_WIDTH;
  const containerHeight = MAP_HEIGHT;
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  const tiles = useMemo(() => {
    const lat = typeof centerLat === 'number' && !isNaN(centerLat) ? centerLat : -7.55611;
    const lng = typeof centerLng === 'number' && !isNaN(centerLng) ? centerLng : 110.83167;
    const z = zoom || 18;

    // Web Mercator formula for tile coordinate and exact pixel offset
    const exactX = ((lng + 180) / 360) * Math.pow(2, z);
    const exactY =
      ((1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
        ) /
          Math.PI) /
        2) *
      Math.pow(2, z);

    const baseTileX = Math.floor(exactX);
    const baseTileY = Math.floor(exactY);

    const provider = mapConfig?.provider || 'maptiler';
    const apiKey = mapConfig?.maptiler_key || process.env.EXPO_PUBLIC_MAPTILER_KEY || '';
    const style = mapConfig?.map_style || (isDark ? 'streets-v2-dark' : 'streets-v2');

    const result = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tx = baseTileX + dx;
        const ty = baseTileY + dy;
        const left = Math.round(centerX + (tx - exactX) * 256);
        const top = Math.round(centerY + (ty - exactY) * 256);

        let uri;
        if (provider === 'maptiler' && apiKey && !mapImageError) {
          uri = `https://api.maptiler.com/maps/${style}/${z}/${tx}/${ty}.png?key=${apiKey}`;
        } else {
          const cartoStyle = isDark ? 'dark_all' : 'rastertiles/voyager';
          uri = `https://a.basemaps.cartocdn.com/${cartoStyle}/${z}/${tx}/${ty}.png`;
        }

        result.push({ key: `${z}-${tx}-${ty}`, uri, left, top });
      }
    }
    return result;
  }, [centerLat, centerLng, zoom, isDark, mapConfig, mapImageError, containerWidth]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {tiles.map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: tile.uri }}
          style={{
            position: 'absolute',
            left: tile.left,
            top: tile.top,
            width: 256,
            height: 256,
            opacity: isDark ? 0.72 : 0.95,
          }}
          resizeMode="cover"
          onError={onTileError}
        />
      ))}
    </View>
  );
});

export default function LocationAttendanceScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const [remoteOffice, setRemoteOffice] = useState(null);
  const [mapConfig, setMapConfig] = useState(null);
  const [mapImageError, setMapImageError] = useState(false);
  const [mapFocusMode, setMapFocusMode] = useState('office'); // 'office' | 'user'
  const [currentZoom, setCurrentZoom] = useState(18);

  const {
    location,
    office,
    accuracy,
    accuracyStatus,
    distanceMeter,
    isInRadius,
    isReady,
    isPreWarming,
    isMockDetected,
    isSimulateOutside,
    refreshLocation,
    toggleSimulateOutside,
    toggleMockDetection,
  } = useLiveLocation(remoteOffice || DEFAULT_OFFICE);

  // Live Digital Clock state
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [showDevSheet, setShowDevSheet] = useState(false);

  // Attendance records state for today
  const [checkInRecord, setCheckInRecord] = useState(null);
  const [checkOutRecord, setCheckOutRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [isQueueSyncing, setIsQueueSyncing] = useState(false);
  const [isLoadingToday, setIsLoadingToday] = useState(true);

  // Mapper from server resource to UI record
  const mapServerRecord = useCallback((item) => {
    if (!item) return null;
    return {
      type: item.type,
      time: item.time_formatted || (item.server_timestamp ? new Date(item.server_timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '--:--'),
      date: item.date_formatted || (item.server_timestamp ? new Date(item.server_timestamp).toLocaleDateString('id-ID') : ''),
      distance: Math.round(item.distance_from_office || 0),
      latitude: typeof item.latitude === 'number' ? item.latitude.toFixed(6) : item.latitude,
      longitude: typeof item.longitude === 'number' ? item.longitude.toFixed(6) : item.longitude,
      accuracy: `${Math.round(item.accuracy_meter || 0)}m`,
      officeName: item.office?.name || office.name,
      status: item.status || 'valid',
      idempotencyKey: item.idempotency_key,
    };
  }, [office.name]);

  // Load today's attendance status from server and initialize offline queue
  const fetchTodayStatus = useCallback(async () => {
    try {
      setIsLoadingToday(true);
      const res = await locationAttendanceApi.getTodayStatus();
      if (res?.success && res?.data) {
        if (res.data.check_in) {
          setCheckInRecord(mapServerRecord(res.data.check_in));
        }
        if (res.data.check_out) {
          setCheckOutRecord(mapServerRecord(res.data.check_out));
        }
      }
    } catch (err) {
      console.log('[AttendanceScreen] Status load offline/fallback:', err?.message || 'offline');
    } finally {
      setIsLoadingToday(false);
    }
  }, [mapServerRecord]);

  useEffect(() => {
    fetchTodayStatus();

    const loadInitialServerConfig = async () => {
      try {
        const [officesRes, mapConfigRes] = await Promise.allSettled([
          locationAttendanceApi.getOffices(),
          locationAttendanceApi.getMapConfig(),
        ]);

        if (officesRes.status === 'fulfilled' && officesRes.value?.data?.length > 0) {
          const activeOffice = officesRes.value.data[0];
          setRemoteOffice({
            id: activeOffice.id,
            name: activeOffice.name,
            latitude: Number(activeOffice.latitude),
            longitude: Number(activeOffice.longitude),
            radiusMeter: Number(activeOffice.radius_meter),
            address: activeOffice.address,
          });
        }

        if (mapConfigRes.status === 'fulfilled' && mapConfigRes.value?.data) {
          setMapConfig(mapConfigRes.value.data);
          if (mapConfigRes.value.data.default_zoom) {
            setCurrentZoom(Number(mapConfigRes.value.data.default_zoom));
          }
        }
      } catch (e) {
        console.log('[AttendanceScreen] Initial server config load error:', e?.message);
      }
    };
    loadInitialServerConfig();

    const checkQueue = async () => {
      const count = await attendanceSyncQueue.getPendingCount();
      setPendingQueueCount(count);
    };
    checkQueue();

    const unsub = attendanceSyncQueue.subscribe(checkQueue);

    // Auto-sync pending queue if any
    attendanceSyncQueue.processQueue().then((res) => {
      if (res?.syncedCount > 0) {
        fetchTodayStatus();
      }
    });

    return () => unsub();
  }, [fetchTodayStatus]);

  // Pulse animation for beacon effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Smooth transition animation when toggling map focus or changing zoom
  const mapTransitionAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    mapTransitionAnim.setValue(0.6);
    Animated.timing(mapTransitionAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mapFocusMode, currentZoom]);

  // Active map center depending on focus mode
  const mapCenter = useMemo(() => {
    if (mapFocusMode === 'user' && typeof location?.latitude === 'number' && !isNaN(location.latitude)) {
      return {
        lat: location.latitude,
        lng: location.longitude,
      };
    }
    return {
      lat: typeof office?.latitude === 'number' && !isNaN(office.latitude) ? office.latitude : -7.55611,
      lng: typeof office?.longitude === 'number' && !isNaN(office.longitude) ? office.longitude : 110.83167,
    };
  }, [mapFocusMode, location?.latitude, location?.longitude, office?.latitude, office?.longitude]);

  // 100% Mathematically exact Web Mercator projection between Office and User GPS
  // Coordinates are positioned exactly according to their real geographic coordinates on the map tiles.
  // Neither point is artificially clamped or shifted to fit the screen.
  // The radius circle is strictly attached to and follows the office coordinates.
  const realMapCoordinates = useMemo(() => {
    const officeLat = typeof office.latitude === 'number' && !isNaN(office.latitude) ? office.latitude : -7.55611;
    const officeLng = typeof office.longitude === 'number' && !isNaN(office.longitude) ? office.longitude : 110.83167;
    const userLat = typeof location.latitude === 'number' && !isNaN(location.latitude) ? location.latitude : officeLat;
    const userLng = typeof location.longitude === 'number' && !isNaN(location.longitude) ? location.longitude : officeLng;
    const z = currentZoom || 18;

    const centerX = MAP_WIDTH / 2;
    const centerY = MAP_HEIGHT / 2;

    // Center exact Web Mercator coordinate
    const centerExactX = ((mapCenter.lng + 180) / 360) * Math.pow(2, z);
    const centerRad = (mapCenter.lat * Math.PI) / 180;
    const centerExactY =
      ((1 - Math.log(Math.tan(centerRad) + 1 / Math.cos(centerRad)) / Math.PI) / 2) * Math.pow(2, z);

    // Office exact Web Mercator coordinate
    const officeExactX = ((officeLng + 180) / 360) * Math.pow(2, z);
    const officeRad = (officeLat * Math.PI) / 180;
    const officeExactY =
      ((1 - Math.log(Math.tan(officeRad) + 1 / Math.cos(officeRad)) / Math.PI) / 2) * Math.pow(2, z);

    // User exact Web Mercator coordinate
    const userExactX = ((userLng + 180) / 360) * Math.pow(2, z);
    const userRad = (userLat * Math.PI) / 180;
    const userExactY =
      ((1 - Math.log(Math.tan(userRad) + 1 / Math.cos(userRad)) / Math.PI) / 2) * Math.pow(2, z);

    // Exact physical coordinates on map (100% true geographic position)
    const officeScreenX = Math.round(centerX + (officeExactX - centerExactX) * 256);
    const officeScreenY = Math.round(centerY + (officeExactY - centerExactY) * 256);

    const userScreenX = Math.round(centerX + (userExactX - centerExactX) * 256);
    const userScreenY = Math.round(centerY + (userExactY - centerExactY) * 256);

    // Real physical radius in pixels scaled to current zoom level
    const mpp = getMetersPerPixel(officeLat, z);
    const rawRadiusPx = Math.round((office.radiusMeter || 60) / (mpp || 1));
    const visualRadius = Math.max(20, rawRadiusPx);

    // True angle and distance between coordinates
    const rawDx = userScreenX - officeScreenX;
    const rawDy = userScreenY - officeScreenY;
    const rawDist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
    const angleDeg = Math.round((Math.atan2(rawDy, rawDx) * 180) / Math.PI);

    // Anti-collision smart clearance when close:
    // Office badge radius is 14px, User dot radius is 8px.
    // Minimum clear separation is 28px so icons never collide or stack on each other.
    const minSeparation = 28;
    const isProximityClose = rawDist < minSeparation;
    let displayUserX = userScreenX;
    let displayUserY = userScreenY;

    if (isProximityClose) {
      const angleRad = rawDist > 0.01 ? Math.atan2(rawDy, rawDx) : -Math.PI / 4; // default top-right if exact center
      displayUserX = Math.round(officeScreenX + Math.cos(angleRad) * minSeparation);
      displayUserY = Math.round(officeScreenY + Math.sin(angleRad) * minSeparation);
    }

    // Dynamic office label position: if user blip is below the office icon, place label above to avoid collision
    const isUserBelowOffice = (displayUserY - officeScreenY) > 10 && Math.abs(displayUserX - officeScreenX) < 40;
    const officeLabelPosition = isUserBelowOffice ? 'top' : 'bottom';

    // Calculate line endpoints within the card
    let lineStartX = officeScreenX;
    let lineStartY = officeScreenY;
    let lineEndX = userScreenX;
    let lineEndY = userScreenY;

    const isOfficeInCard =
      officeScreenX >= 0 && officeScreenX <= MAP_WIDTH && officeScreenY >= 0 && officeScreenY <= MAP_HEIGHT;
    const isUserInCard =
      userScreenX >= 0 && userScreenX <= MAP_WIDTH && userScreenY >= 0 && userScreenY <= MAP_HEIGHT;

    if (isOfficeInCard && !isUserInCard) {
      const clipped = clipRayToCard(officeScreenX, officeScreenY, userScreenX, userScreenY);
      lineEndX = clipped.x;
      lineEndY = clipped.y;
    } else if (!isOfficeInCard && isUserInCard) {
      const clipped = clipRayToCard(userScreenX, userScreenY, officeScreenX, officeScreenY);
      lineStartX = clipped.x;
      lineStartY = clipped.y;
    } else if (!isOfficeInCard && !isUserInCard) {
      const clippedUser = clipRayToCard(centerX, centerY, userScreenX, userScreenY);
      const clippedOffice = clipRayToCard(centerX, centerY, officeScreenX, officeScreenY);
      lineStartX = clippedOffice.x;
      lineStartY = clippedOffice.y;
      lineEndX = clippedUser.x;
      lineEndY = clippedUser.y;
    }

    const lineDx = lineEndX - lineStartX;
    const lineDy = lineEndY - lineStartY;
    const lineLength = Math.max(8, Math.round(Math.sqrt(lineDx * lineDx + lineDy * lineDy)));
    const midX = Math.round((lineStartX + lineEndX) / 2);
    const midY = Math.round((lineStartY + lineEndY) / 2);

    // Number of dashes in the dashed line
    const dashCount = Math.max(3, Math.min(28, Math.floor(lineLength / 11)));

    // Visibility rules when close to prevent stacking/overlaps:
    // 1. Dashed line only renders when points are separated enough (>= 38px)
    const shouldShowDashedLine = lineLength >= 38;
    // 2. Floating distance badge (56px width) only renders when there is ample room (>= 70px)
    const shouldShowDistanceBadge = lineLength >= 70;

    return {
      officeScreenX,
      officeScreenY,
      userScreenX,
      userScreenY,
      displayUserX,
      displayUserY,
      isProximityClose,
      officeLabelPosition,
      shouldShowDashedLine,
      shouldShowDistanceBadge,
      visualRadius,
      lineStartX,
      lineStartY,
      lineEndX,
      lineEndY,
      lineLength,
      angleDeg,
      midX,
      midY,
      dashCount,
    };
  }, [office.latitude, office.longitude, office.radiusMeter, location.latitude, location.longitude, mapCenter.lat, mapCenter.lng, currentZoom]);

  // Clean formatted distance (e.g. "190.4 km" or "45m")
  const formattedDistance = useMemo(() => {
    if (!distanceMeter || isNaN(distanceMeter)) return '0m';
    if (distanceMeter >= 1000) {
      return `${(distanceMeter / 1000).toFixed(1)} km`;
    }
    return `${Math.round(distanceMeter)}m`;
  }, [distanceMeter]);

  // Clock ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTimeStr(`${h}:${m}:${s}`);

      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      setCurrentDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    };

    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Manual Trigger to Sync Pending Offline Queue
  const handleManualSync = async () => {
    if (isQueueSyncing) return;
    setIsQueueSyncing(true);
    try {
      const res = await attendanceSyncQueue.processQueue();
      Alert.alert('Sinkronisasi Antrean', res.message || 'Selesai.');
      if (res.syncedCount > 0) {
        fetchTodayStatus();
      }
    } catch (err) {
      Alert.alert('Gagal Sinkron', err?.message || 'Koneksi ke server terputus.');
    } finally {
      setIsQueueSyncing(false);
    }
  };

  // Primary Action Button Handler (Smart toggle: Check-In -> Check-Out -> Completed)
  const handlePrimaryAction = () => {
    if (checkInRecord && checkOutRecord) {
      Alert.alert('Presensi Selesai', 'Anda telah menyelesaikan presensi masuk dan pulang untuk hari ini.');
      return;
    }

    if (isMockDetected) {
      Alert.alert(
        'Peringatan Keamanan',
        'Terdeteksi aplikasi lokasi tiruan (Mock GPS / Fake Location). Presensi dibatalkan demi integritas data kehadiran.',
        [{ text: 'Mengerti' }]
      );
      return;
    }

    if (!isInRadius) {
      Alert.alert(
        'Di Luar Radius Kantor',
        `Posisi Anda berada ${distanceMeter} meter dari titik kantor (Batas radius: ${office.radiusMeter || 60} meter).\n\nSilakan berada di dalam area geofence kantor untuk melanjutkan presensi.`,
        [{ text: 'Tutup' }]
      );
      return;
    }

    if (!checkInRecord) {
      handleCheckIn();
    } else {
      handleCheckOut();
    }
  };

  const handleCheckIn = async () => {
    setSubmitting(true);
    const idempotencyKey = generateUUID();
    const clientTimestamp = new Date().toISOString();

    const payload = {
      office_id: office.id || 1,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: accuracy,
      is_mock_location: isMockDetected,
      device_id: Platform.OS + '-' + (user?.id || 'client'),
      idempotency_key: idempotencyKey,
      client_timestamp: clientTimestamp,
      notes: `Presensi Masuk (${distanceMeter}m)`,
    };

    try {
      const response = await locationAttendanceApi.checkIn(payload);
      if (response?.success && response?.data) {
        setCheckInRecord(mapServerRecord(response.data));
        Alert.alert(
          'Presensi Masuk Berhasil',
          response.message || `Waktu hadir tercatat pukul ${response.data.time_formatted || 'sekarang'}.`
        );
      } else {
        throw new Error(response?.message || 'Gagal tersimpan di server.');
      }
    } catch (error) {
      console.log('[AttendanceScreen] Check-in error, falling back to offline queue:', error?.message);
      await attendanceSyncQueue.enqueue({ ...payload, type: 'in' });

      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
      setCheckInRecord({
        type: 'in',
        time,
        date: currentDateStr,
        distance: distanceMeter,
        latitude: location.latitude.toFixed(6),
        longitude: location.longitude.toFixed(6),
        accuracy: `${accuracy}m`,
        officeName: office.name,
        status: 'pending_sync',
        idempotencyKey,
      });

      Alert.alert(
        'Tersimpan Offline (Menunggu Jaringan)',
        'Server sedang tidak dapat dijangkau. Presensi Anda telah diamankan di penyimpanan lokal perangkat dan akan otomatis disinkronkan saat terhubung kembali.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    const idempotencyKey = generateUUID();
    const clientTimestamp = new Date().toISOString();

    const payload = {
      office_id: office.id || 1,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: accuracy,
      is_mock_location: isMockDetected,
      device_id: Platform.OS + '-' + (user?.id || 'client'),
      idempotency_key: idempotencyKey,
      client_timestamp: clientTimestamp,
      notes: `Presensi Pulang (${distanceMeter}m)`,
    };

    try {
      const response = await locationAttendanceApi.checkOut(payload);
      if (response?.success && response?.data) {
        setCheckOutRecord(mapServerRecord(response.data));
        Alert.alert(
          'Presensi Pulang Berhasil',
          response.message || `Presensi kepulangan Anda tercatat pukul ${response.data.time_formatted || 'sekarang'}. Selamat beristirahat!`
        );
      } else {
        throw new Error(response?.message || 'Gagal tersimpan di server.');
      }
    } catch (error) {
      console.log('[AttendanceScreen] Check-out error, falling back to offline queue:', error?.message);
      await attendanceSyncQueue.enqueue({ ...payload, type: 'out' });

      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
      setCheckOutRecord({
        type: 'out',
        time,
        date: currentDateStr,
        distance: distanceMeter,
        latitude: location.latitude.toFixed(6),
        longitude: location.longitude.toFixed(6),
        accuracy: `${accuracy}m`,
        officeName: office.name,
        status: 'pending_sync',
        idempotencyKey,
      });

      Alert.alert(
        'Tersimpan Offline (Menunggu Jaringan)',
        'Server sedang tidak dapat dijangkau. Presensi kepulangan Anda telah tersimpan lokal dan akan disinkronkan saat online.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#0B0F19' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ========================================================================= */}
      {/* 1. TOP MINIMALIST APP HEADER                                              */}
      {/* ========================================================================= */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: safeTop,
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#FFFFFF',
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' },
            ]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={isDark ? '#F1F5F9' : '#1E293B'} />
          </TouchableOpacity>

          <View style={styles.headerTitles}>
            <Text style={styles.headerCategory}>GEOFENCING PRESENSI</Text>
            <Text
              style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
              numberOfLines={1}
            >
              Presensi Lokasi GPS
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.headerActionBtn,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' },
            ]}
            onPress={refreshLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={17} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================================= */}
        {/* 2. ELEGAN DIGITAL TIME & SHIFT CARD                                       */}
        {/* ========================================================================= */}
        <View
          style={[
            styles.timeHeroCard,
            {
              backgroundColor: isDark ? '#131C31' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.timeHeroTop}>
            <View style={styles.datePill}>
              <Ionicons name="calendar-outline" size={13} color="#4F46E5" />
              <Text style={styles.datePillText}>{currentDateStr}</Text>
            </View>

            <View style={styles.shiftBadge}>
              <View style={styles.shiftLiveDot} />
              <Text style={styles.shiftBadgeText}>Shift Reguler</Text>
            </View>
          </View>

          <View style={styles.digitalClockWrap}>
            <Text style={[styles.digitalClockText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {currentTimeStr || '00:00:00'}
            </Text>
            <Text style={styles.digitalClockZone}>WIB</Text>
          </View>

          <Text style={[styles.shiftScheduleText, { color: theme.textMuted }]}>
            Jadwal Kerja: <Text style={{ fontWeight: '700', color: isDark ? '#E2E8F0' : '#334155' }}>07.00 - 15.00 WIB</Text> • Batas Toleransi 15 Menit
          </Text>
        </View>

        {/* ========================================================================= */}
        {/* 3. RADAR GEOFENCE / MAPTILER PREVIEW VIEWPORT                            */}
        {/* ========================================================================= */}
        <View
          style={[
            styles.mapCard,
            {
              backgroundColor: isDark ? '#131C31' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.mapCanvasContainer}>
            {/* Seamless 3x3 Street Map Tile Canvas (Dynamic Center: Office or User GPS) */}
            <MapTileGrid
              centerLat={mapCenter.lat}
              centerLng={mapCenter.lng}
              zoom={currentZoom}
              isDark={isDark}
              mapConfig={mapConfig}
              mapImageError={mapImageError}
              onTileError={() => setMapImageError(true)}
            />

            {/* Geofence Radar Surface & Pins Overlay (Smooth Transition & Precise Layer Ordering) */}
            <Animated.View
              style={[
                styles.radarSurface,
                {
                  opacity: mapTransitionAnim,
                  transform: [
                    {
                      scale: mapTransitionAnim.interpolate({
                        inputRange: [0.6, 1],
                        outputRange: [0.97, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Visual Grid Lines */}
              <View style={styles.gridLineHorizontal} />
              <View style={styles.gridLineVertical} />

              {/* 1. LAYER PALING BAWAH: Garis Patah-Patah Penghubung Antar Koordinat (Hanya tampil jika jarak cukup renggang) */}
              {realMapCoordinates.shouldShowDashedLine && (
                <View
                  style={{
                    position: 'absolute',
                    left: realMapCoordinates.midX - realMapCoordinates.lineLength / 2,
                    top: realMapCoordinates.midY - 1.5,
                    width: realMapCoordinates.lineLength,
                    height: 3,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-evenly',
                    transform: [{ rotate: `${realMapCoordinates.angleDeg}deg` }],
                    zIndex: 2,
                    elevation: 1,
                  }}
                  pointerEvents="none"
                >
                  {Array.from({ length: realMapCoordinates.dashCount }).map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: 6,
                        height: 2.5,
                        borderRadius: 1.5,
                        backgroundColor: isInRadius ? '#10B981' : '#F43F5E',
                      }}
                    />
                  ))}
                </View>
              )}

              {/* Floating Distance Badge on the Dashed Line (Hanya tampil jika jarak >= 70px agar tidak menumpuk saat dekat) */}
              {realMapCoordinates.shouldShowDistanceBadge && (
                <View
                  style={[
                    styles.floatingDistBadge,
                    {
                      left: realMapCoordinates.midX - 28,
                      top: realMapCoordinates.midY - 14,
                      borderColor: isInRadius ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
                      borderWidth: 1,
                      zIndex: 4,
                      elevation: 2,
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Text style={styles.floatingDistText}>{formattedDistance}</Text>
                </View>
              )}

              {/* 2. LAYER TENGAH: Lingkaran Radius Geofence (Terkunci pada titik kantor, zIndex: 3) */}
              <View
                style={[
                  styles.officeRadiusContainer,
                  {
                    left: realMapCoordinates.officeScreenX,
                    top: realMapCoordinates.officeScreenY,
                  },
                ]}
                pointerEvents="none"
              >
                {/* Geofence Outer Boundary Circle */}
                <View
                  style={[
                    styles.geofenceCircleOuter,
                    {
                      width: realMapCoordinates.visualRadius * 2,
                      height: realMapCoordinates.visualRadius * 2,
                      borderRadius: realMapCoordinates.visualRadius,
                      borderColor: isInRadius ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)',
                      backgroundColor: isInRadius ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                    },
                  ]}
                />

                {/* Geofence Mid Wave Circle */}
                <View
                  style={[
                    styles.geofenceCircleMid,
                    {
                      width: realMapCoordinates.visualRadius * 1.3,
                      height: realMapCoordinates.visualRadius * 1.3,
                      borderRadius: realMapCoordinates.visualRadius * 0.65,
                      borderColor: isInRadius ? 'rgba(16, 185, 129, 0.6)' : 'rgba(244, 63, 94, 0.6)',
                    },
                  ]}
                />
              </View>

              {/* 3. LAYER ATAS: Office Marker Pin (100% PAKEM, zIndex: 10, elevation: 6, di atas garis) */}
              <View
                style={[
                  styles.officeMarkerContainer,
                  {
                    left: realMapCoordinates.officeScreenX,
                    top: realMapCoordinates.officeScreenY,
                  },
                ]}
                pointerEvents="none"
              >
                <View style={styles.officeAnchorWrap} pointerEvents="none">
                  <View style={styles.officeIconBadge}>
                    <Ionicons name="business" size={14} color="#FFFFFF" />
                  </View>
                  <View
                    style={[
                      styles.officeAnchorLabelWrap,
                      realMapCoordinates.officeLabelPosition === 'top' && { top: -26 },
                    ]}
                  >
                    <Text style={styles.officeAnchorLabel} numberOfLines={1}>
                      {office.name.split(' - ')[0]}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 4. LAYER PALING ATAS: User GPS Blip with Animated Ripple Beacon (Smart Non-overlapping Clearance saat dekat) */}
              <View
                style={[
                  styles.userBeaconContainer,
                  {
                    left: realMapCoordinates.displayUserX,
                    top: realMapCoordinates.displayUserY,
                  },
                ]}
                pointerEvents="none"
              >
                <Animated.View
                  style={[
                    styles.userPulseRing,
                    realMapCoordinates.isProximityClose && {
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                    },
                    {
                      transform: [{ scale: pulseAnim }],
                      borderColor: isInRadius ? '#10B981' : '#F43F5E',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.userCenterDot,
                    { backgroundColor: isInRadius ? '#10B981' : '#F43F5E' },
                  ]}
                >
                  <View style={styles.userCenterCore} />
                </View>
              </View>
            </Animated.View>

            {/* TOP OVERLAYS */}
            <View style={styles.mapTopOverlayRow}>
              {/* Office Target Tag */}
              <View style={styles.mapTargetPill}>
                <Ionicons name="shield-checkmark" size={12} color="#4F46E5" />
                <Text style={styles.mapTargetPillText}>Radius {office.radiusMeter}m</Text>
              </View>

              {/* Status Badge */}
              <View
                style={[
                  styles.mapStatusPill,
                  isInRadius ? styles.mapStatusPillInside : styles.mapStatusPillOutside,
                ]}
              >
                <View
                  style={[
                    styles.mapStatusDot,
                    { backgroundColor: isPreWarming ? '#F59E0B' : isInRadius ? '#10B981' : '#F43F5E' },
                  ]}
                />
                <Text
                  style={[
                    styles.mapStatusPillText,
                    { color: isInRadius ? '#065F46' : '#9F1239' },
                  ]}
                >
                  {isPreWarming
                    ? 'Stabilisasi GPS...'
                    : isInRadius
                    ? 'Di Dalam Area'
                    : 'Di Luar Area'}
                </Text>
              </View>
            </View>

            {/* Floating Zoom Controls (+ / -) */}
            <View
              style={[
                styles.mapZoomControl,
                {
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.94)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(226, 232, 240, 0.9)',
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCurrentZoom((z) => Math.min(18, z + 1))}
                style={styles.mapZoomBtn}
                disabled={currentZoom >= 18}
              >
                <Ionicons name="add" size={14} color={currentZoom >= 18 ? '#94A3B8' : isDark ? '#FFFFFF' : '#1E293B'} />
              </TouchableOpacity>
              <View style={[styles.mapZoomDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0' }]} />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCurrentZoom((z) => Math.max(14, z - 1))}
                style={styles.mapZoomBtn}
                disabled={currentZoom <= 14}
              >
                <Ionicons name="remove" size={14} color={currentZoom <= 14 ? '#94A3B8' : isDark ? '#FFFFFF' : '#1E293B'} />
              </TouchableOpacity>
            </View>

            {/* BOTTOM TELEMETRY BAR & DYNAMIC MAP FOCUS SWITCH */}
            <View style={styles.mapBottomTelemetryBar}>
              <View style={styles.telemetryItem}>
                <Ionicons
                  name={accuracyStatus === 'high' ? 'radio' : 'radio-outline'}
                  size={12}
                  color={accuracyStatus === 'high' ? '#10B981' : '#F59E0B'}
                />
                <Text style={styles.telemetryText}>Akurasi: {accuracy}m</Text>
              </View>

              <View style={styles.telemetryDivider} />

              <View style={styles.telemetryItem}>
                <Ionicons
                  name={isMockDetected ? 'alert-circle' : 'checkmark-circle'}
                  size={12}
                  color={isMockDetected ? '#F43F5E' : '#38BDF8'}
                />
                <Text style={styles.telemetryText}>
                  {isMockDetected ? 'Mock GPS' : 'GPS Asli'}
                </Text>
              </View>

              {/* Dynamic Map Recenter Button (Toggles between Office and User Location) */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setMapFocusMode((prev) => (prev === 'office' ? 'user' : 'office'))}
                style={styles.telemetryFocusBtn}
              >
                <Ionicons
                  name={mapFocusMode === 'office' ? 'locate' : 'business'}
                  size={12}
                  color="#ffffffff"
                />
                {/* <Text style={styles.telemetryFocusText}>
                  {mapFocusMode === 'office' ? 'Peta Lokasi Saya' : 'Peta Kantor'}
                </Text> */}
              </TouchableOpacity>
            </View>
          </View>

          {/* GEOFENCE CALLOUT INFO */}
          <View style={styles.geofenceNoticeRow}>
            <View
              style={[
                styles.noticeIconWrap,
                { backgroundColor: isInRadius ? '#ECFDF5' : '#FFF1F2' },
              ]}
            >
              <Ionicons
                name={isInRadius ? 'location' : 'alert-circle'}
                size={16}
                color={isInRadius ? '#047857' : '#E11D48'}
              />
            </View>
            <View style={styles.noticeTextCol}>
              <Text
                style={[
                  styles.noticeTitle,
                  { color: isInRadius ? (isDark ? '#34D399' : '#065F46') : (isDark ? '#FB7185' : '#9F1239') },
                ]}
              >
                {isInRadius
                  ? `Lokasi Terverifikasi Valid (${distanceMeter} meter dari titik kantor)`
                  : `Berada ${distanceMeter} meter di luar geofence (maksimal ${office.radiusMeter}m)`}
              </Text>
              <Text style={[styles.noticeDesc, { color: theme.textMuted }]}>
                {isInRadius
                  ? 'Sinyal satelit stabil & koordinat memenuhi syarat presensi kehadiran.'
                  : 'Dekati area kampus untuk dapat melakukan check-in atau check-out.'}
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 4. ATTENDANCE DUAL CARDS (MASUK & PULANG)                                 */}
        {/* ========================================================================= */}
        <View style={styles.dualCardsRow}>
          {/* CARD CHECK-IN */}
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: isDark ? '#131C31' : '#FFFFFF',
                borderColor: checkInRecord
                  ? '#10B981'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.statusCardHeader}>
              <View
                style={[
                  styles.cardIconWrap,
                  { backgroundColor: checkInRecord ? '#ECFDF5' : isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
                ]}
              >
                <Ionicons
                  name="log-in"
                  size={18}
                  color={checkInRecord ? '#059669' : '#94A3B8'}
                />
              </View>
              <View
                style={[
                  styles.cardBadgePill,
                  checkInRecord ? styles.badgeSuccess : styles.badgeMuted,
                ]}
              >
                <Text
                  style={[
                    styles.cardBadgePillText,
                    checkInRecord ? styles.textSuccess : styles.textMuted,
                  ]}
                >
                  {checkInRecord ? 'Tepat Waktu' : 'Belum Masuk'}
                </Text>
              </View>
            </View>

            <Text style={[styles.statusCardLabel, { color: theme.textMuted }]}>JAM MASUK</Text>
            <Text style={[styles.statusCardTime, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {checkInRecord ? checkInRecord.time.replace(' WIB', '') : '--:--'}
            </Text>
            <Text style={[styles.statusCardSub, { color: theme.textMuted }]}>
              {checkInRecord ? `Jarak: ${checkInRecord.distance}m` : 'Pagi (07.00 WIB)'}
            </Text>
          </View>

          {/* CARD CHECK-OUT */}
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: isDark ? '#131C31' : '#FFFFFF',
                borderColor: checkOutRecord
                  ? '#4F46E5'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.statusCardHeader}>
              <View
                style={[
                  styles.cardIconWrap,
                  { backgroundColor: checkOutRecord ? '#EEF2FF' : isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
                ]}
              >
                <Ionicons
                  name="log-out"
                  size={18}
                  color={checkOutRecord ? '#4338CA' : '#94A3B8'}
                />
              </View>
              <View
                style={[
                  styles.cardBadgePill,
                  checkOutRecord ? styles.badgePrimary : styles.badgeMuted,
                ]}
              >
                <Text
                  style={[
                    styles.cardBadgePillText,
                    checkOutRecord ? styles.textPrimary : styles.textMuted,
                  ]}
                >
                  {checkOutRecord ? 'Selesai' : 'Belum Pulang'}
                </Text>
              </View>
            </View>

            <Text style={[styles.statusCardLabel, { color: theme.textMuted }]}>JAM PULANG</Text>
            <Text style={[styles.statusCardTime, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {checkOutRecord ? checkOutRecord.time.replace(' WIB', '') : '--:--'}
            </Text>
            <Text style={[styles.statusCardSub, { color: theme.textMuted }]}>
              {checkOutRecord ? `Jarak: ${checkOutRecord.distance}m` : 'Sore (15.00 WIB)'}
            </Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 5. SMART PRIMARY ACTION BUTTON (FINGERPRINT HERO)                         */}
        {/* ========================================================================= */}
        <TouchableOpacity
          style={styles.heroActionBtnWrapper}
          onPress={handlePrimaryAction}
          disabled={submitting || isPreWarming}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={
              checkInRecord && checkOutRecord
                ? ['#475569', '#334155']
                : !isInRadius || isMockDetected || isPreWarming
                ? ['#94A3B8', '#64748B']
                : !checkInRecord
                ? ['#10B981', '#059669']
                : ['#4F46E5', '#3730A3']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroActionGradient}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.heroActionIconCircle}>
                  <Ionicons
                    name={
                      checkInRecord && checkOutRecord
                        ? 'checkmark-circle'
                        : !checkInRecord
                        ? 'finger-print'
                        : 'exit-outline'
                    }
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.heroActionTextCol}>
                  <Text style={styles.heroActionMainTitle}>
                    {checkInRecord && checkOutRecord
                      ? 'PRESENSI HARI INI LENGKAP'
                      : !isInRadius
                      ? 'DI LUAR RADIUS KANTOR'
                      : !checkInRecord
                      ? 'CATAT PRESENSI MASUK'
                      : 'CATAT PRESENSI PULANG'}
                  </Text>
                  <Text style={styles.heroActionSubtitle}>
                    {checkInRecord && checkOutRecord
                      ? 'Kehadiran dan kepulangan Anda telah tercatat'
                      : !isInRadius
                      ? `Jarak ${distanceMeter}m • Dekati kantor untuk presensi`
                      : !checkInRecord
                      ? 'Ketuk untuk mencatat kehadiran & lokasi saat ini'
                      : 'Ketuk untuk mencatat jam kepulangan'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ========================================================================= */}
        {/* 6. OFFICE INFO & SYNC STATUS DETAILS                                      */}
        {/* ========================================================================= */}
        <View
          style={[
            styles.infoMetaCard,
            {
              backgroundColor: isDark ? '#131C31' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.infoMetaRow}>
            <View style={styles.infoMetaIcon}>
              <Ionicons name="business-outline" size={16} color="#4F46E5" />
            </View>
            <View style={styles.infoMetaTextWrap}>
              <Text style={[styles.infoMetaLabel, { color: theme.textMuted }]}>LOKASI TERDAFTAR</Text>
              <Text style={[styles.infoMetaValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                {office.name}
              </Text>
              <Text style={[styles.infoMetaAddress, { color: theme.textMuted }]}>
                {office.address}
              </Text>
            </View>
          </View>

          <View style={styles.infoMetaDivider} />

          <View style={styles.infoMetaRow}>
            <View
              style={[
                styles.infoMetaIcon,
                { backgroundColor: pendingQueueCount > 0 ? '#FEF3C7' : '#ECFDF5' },
              ]}
            >
              <Ionicons
                name={pendingQueueCount > 0 ? 'cloud-upload-outline' : 'cloud-done-outline'}
                size={16}
                color={pendingQueueCount > 0 ? '#D97706' : '#10B981'}
              />
            </View>
            <View style={styles.infoMetaTextWrap}>
              <Text style={[styles.infoMetaLabel, { color: theme.textMuted }]}>
                {pendingQueueCount > 0 ? 'ANTREAN OFFLINE PENDING' : 'KONEKSI & IDEMPOTENCY'}
              </Text>
              <Text style={[styles.infoMetaValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                {pendingQueueCount > 0
                  ? `Tersimpan, Menunggu Jaringan (${pendingQueueCount} Pending)`
                  : 'Tersambung ke Server (Online)'}
              </Text>
              <Text style={[styles.infoMetaAddress, { color: theme.textMuted }]}>
                {pendingQueueCount > 0
                  ? 'Data presensi lokal akan otomatis tersinkron saat internet stabil.'
                  : 'Proteksi anti-duplikasi aktif • Waktu server tersinkron'}
              </Text>
            </View>
            {pendingQueueCount > 0 && (
              <TouchableOpacity
                style={styles.syncBtn}
                onPress={handleManualSync}
                disabled={isQueueSyncing}
                activeOpacity={0.8}
              >
                {isQueueSyncing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sync" size={12} color="#FFFFFF" />
                    <Text style={styles.syncBtnText}>Sync</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 7. TODAY'S TIMELINE LOG                                                   */}
        {/* ========================================================================= */}
        <View
          style={[
            styles.timelineCard,
            {
              backgroundColor: isDark ? '#131C31' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.timelineHeaderRow}>
            <Text style={[styles.timelineHeaderTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              RIWAYAT PRESENSI HARI INI
            </Text>
            <Text style={[styles.timelineHeaderCount, { color: theme.textMuted }]}>
              {checkInRecord && checkOutRecord ? '2/2 Sesi' : checkInRecord ? '1/2 Sesi' : '0/2 Sesi'}
            </Text>
          </View>

          {!checkInRecord && !checkOutRecord ? (
            <View style={styles.emptyTimelineBox}>
              <Ionicons name="time-outline" size={32} color="#94A3B8" />
              <Text style={[styles.emptyTimelineText, { color: theme.textMuted }]}>
                Belum ada aktivitas presensi lokasi tercatat hari ini.
              </Text>
            </View>
          ) : (
            <View style={styles.timelineFlow}>
              {checkInRecord && (
                <View style={styles.timelineItem}>
                  <View style={styles.timelineLeftTrack}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: checkInRecord.status === 'pending_sync' ? '#F59E0B' : '#10B981' },
                      ]}
                    />
                    {checkOutRecord && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineRightContent}>
                    <View style={styles.timelineMetaHeader}>
                      <Text style={[styles.timelineItemTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        Presensi Masuk (Check-In)
                      </Text>
                      <Text style={styles.timelineItemTime}>{checkInRecord.time}</Text>
                    </View>
                    <Text style={[styles.timelineItemCoords, { color: theme.textMuted }]}>
                      {checkInRecord.latitude}, {checkInRecord.longitude}
                    </Text>
                    <View style={styles.timelineBadgeRow}>
                      <View
                        style={
                          checkInRecord.status === 'pending_sync'
                            ? styles.timelineTagPending
                            : checkInRecord.status === 'flagged'
                            ? styles.timelineTagFlagged
                            : styles.timelineTagValid
                        }
                      >
                        <Text
                          style={
                            checkInRecord.status === 'pending_sync'
                              ? styles.timelineTagPendingText
                              : checkInRecord.status === 'flagged'
                              ? styles.timelineTagFlaggedText
                              : styles.timelineTagValidText
                          }
                        >
                          {checkInRecord.status === 'pending_sync'
                            ? 'Tersimpan Offline'
                            : checkInRecord.status === 'flagged'
                            ? 'Perlu Verifikasi'
                            : 'Terverifikasi Valid'}
                        </Text>
                      </View>
                      <Text style={[styles.timelineDistLabel, { color: theme.textMuted }]}>
                        Jarak {checkInRecord.distance}m • Akurasi {checkInRecord.accuracy}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {checkOutRecord && (
                <View style={styles.timelineItem}>
                  <View style={styles.timelineLeftTrack}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: checkOutRecord.status === 'pending_sync' ? '#F59E0B' : '#4F46E5' },
                      ]}
                    />
                  </View>
                  <View style={styles.timelineRightContent}>
                    <View style={styles.timelineMetaHeader}>
                      <Text style={[styles.timelineItemTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        Presensi Pulang (Check-Out)
                      </Text>
                      <Text style={[styles.timelineItemTime, { color: '#4F46E5' }]}>{checkOutRecord.time}</Text>
                    </View>
                    <Text style={[styles.timelineItemCoords, { color: theme.textMuted }]}>
                      {checkOutRecord.latitude}, {checkOutRecord.longitude}
                    </Text>
                    <View style={styles.timelineBadgeRow}>
                      <View
                        style={
                          checkOutRecord.status === 'pending_sync'
                            ? styles.timelineTagPending
                            : checkOutRecord.status === 'flagged'
                            ? styles.timelineTagFlagged
                            : styles.timelineTagValid
                        }
                      >
                        <Text
                          style={
                            checkOutRecord.status === 'pending_sync'
                              ? styles.timelineTagPendingText
                              : checkOutRecord.status === 'flagged'
                              ? styles.timelineTagFlaggedText
                              : styles.timelineTagValidText
                          }
                        >
                          {checkOutRecord.status === 'pending_sync'
                            ? 'Tersimpan Offline'
                            : checkOutRecord.status === 'flagged'
                            ? 'Perlu Verifikasi'
                            : 'Terverifikasi Valid'}
                        </Text>
                      </View>
                      <Text style={[styles.timelineDistLabel, { color: theme.textMuted }]}>
                        Jarak {checkOutRecord.distance}m • Akurasi {checkOutRecord.accuracy}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ========================================================================= */}
        {/* 8. COLLAPSIBLE SIMULATOR DRAWER (DEVELOPMENT / REVIEW CONTROLS)            */}
        {/* ========================================================================= */}
        <View
          style={[
            styles.simulatorBox,
            {
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#F1F5F9',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#CBD5E1',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.simulatorHeaderToggle}
            onPress={() => setShowDevSheet((prev) => !prev)}
            activeOpacity={0.7}
          >
            <View style={styles.simulatorHeaderLeft}>
              <Ionicons name="construct-outline" size={14} color="#6366F1" />
              <Text style={styles.simulatorHeaderTitle}>Simulator Pengujian Geofence & Mock GPS</Text>
            </View>
            <Ionicons
              name={showDevSheet ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#6366F1"
            />
          </TouchableOpacity>

          {showDevSheet && (
            <View style={styles.simulatorBody}>
              <Text style={[styles.simulatorDesc, { color: theme.textMuted }]}>
                Uji skenario radius dan deteksi keamanan langsung di aplikasi tanpa berpindah tempat fisik.
              </Text>

              <View style={styles.simulatorButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.simBtn,
                    isSimulateOutside && styles.simBtnActiveDanger,
                  ]}
                  onPress={toggleSimulateOutside}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isSimulateOutside ? 'close-circle' : 'navigate-circle'}
                    size={14}
                    color={isSimulateOutside ? '#FFFFFF' : '#4F46E5'}
                  />
                  <Text
                    style={[
                      styles.simBtnText,
                      isSimulateOutside && { color: '#FFFFFF' },
                    ]}
                  >
                    {isSimulateOutside ? 'Di Luar Radius (180m)' : 'Dalam Radius (22m)'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.simBtn,
                    isMockDetected && styles.simBtnActiveWarning,
                  ]}
                  onPress={toggleMockDetection}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="shield-outline"
                    size={14}
                    color={isMockDetected ? '#FFFFFF' : '#D97706'}
                  />
                  <Text
                    style={[
                      styles.simBtnText,
                      isMockDetected && { color: '#FFFFFF' },
                    ]}
                  >
                    {isMockDetected ? 'Fake GPS: ON' : 'Fake GPS: OFF'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  headerCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 1,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  /* 2. TIME HERO CARD */
  timeHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  timeHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shiftLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  shiftBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  digitalClockWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginVertical: 2,
  },
  digitalClockText: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  digitalClockZone: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6366F1',
  },
  shiftScheduleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  /* 3. RADAR & MAP CARD */
  mapCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  mapCanvasContainer: {
    height: 190,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  staticMapImage: {
    width: '100%',
    height: '100%',
  },
  radarSurface: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gridLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  gridLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  officeMarkerContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 6,
  },
  officeRadiusContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    elevation: 1,
  },
  userBeaconContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
    elevation: 7,
  },
  geofenceCircleOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  geofenceCircleMid: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
  },
  officeAnchorWrap: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  officeIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  officeAnchorLabelWrap: {
    position: 'absolute',
    top: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  officeAnchorLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4338CA',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    textAlign: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  distanceLine: {
    position: 'absolute',
    height: 0,
    marginTop: -1,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    zIndex: 5,
  },
  userBeaconWrap: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },
  userPulseRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    opacity: 0.6,
  },
  userCenterDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  userCenterCore: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  floatingDistBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  floatingDistText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mapTopOverlayRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },
  mapTargetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mapTargetPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E293B',
  },
  mapStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mapStatusPillInside: {
    backgroundColor: 'rgba(236, 253, 245, 0.92)',
    borderColor: '#A7F3D0',
  },
  mapStatusPillOutside: {
    backgroundColor: 'rgba(255, 241, 242, 0.92)',
    borderColor: '#FECDD3',
  },
  mapStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  mapStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  mapZoomControl: {
    position: 'absolute',
    right: 10,
    top: 42,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 6,
    overflow: 'hidden',
  },
  mapZoomBtn: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapZoomDivider: {
    width: 18,
    height: 1,
    alignSelf: 'center',
  },
  mapBottomTelemetryBar: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 8,
    zIndex: 5,
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  telemetryText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  telemetryDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  telemetryFocusBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  telemetryFocusText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#38BDF8',
  },
  geofenceNoticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  noticeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeTextCol: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  noticeDesc: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
  },
  /* 4. DUAL ATTENDANCE CARDS */
  dualCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: '#ECFDF5',
  },
  badgePrimary: {
    backgroundColor: '#EEF2FF',
  },
  badgeMuted: {
    backgroundColor: '#F1F5F9',
  },
  cardBadgePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  textSuccess: {
    color: '#047857',
  },
  textPrimary: {
    color: '#4338CA',
  },
  textMuted: {
    color: '#64748B',
  },
  statusCardLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusCardTime: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusCardSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  /* 5. HERO ACTION BUTTON */
  heroActionBtnWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  heroActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  heroActionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  heroActionTextCol: {
    flex: 1,
  },
  heroActionMainTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  heroActionSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
  },
  /* 6. OFFICE INFO & SYNC CARD */
  infoMetaCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  infoMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoMetaIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoMetaTextWrap: {
    flex: 1,
  },
  infoMetaLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoMetaValue: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  infoMetaAddress: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
  },
  infoMetaDivider: {
    height: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.5)',
  },
  /* 7. TODAY'S TIMELINE LOG */
  timelineCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.4)',
    paddingBottom: 8,
  },
  timelineHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timelineHeaderCount: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyTimelineBox: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  emptyTimelineText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  timelineFlow: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  timelineLeftTrack: {
    alignItems: 'center',
    width: 14,
    paddingTop: 3,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    width: 2,
    height: 46,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  timelineRightContent: {
    flex: 1,
    gap: 2,
  },
  timelineMetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineItemTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  timelineItemTime: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  timelineItemCoords: {
    fontSize: 10,
    fontWeight: '500',
  },
  timelineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  timelineTagValid: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timelineTagValidText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#047857',
  },
  timelineTagPending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timelineTagPendingText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#B45309',
  },
  timelineTagFlagged: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timelineTagFlaggedText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#E11D48',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'center',
  },
  syncBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timelineDistLabel: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  /* 8. SIMULATOR DRAWER */
  simulatorBox: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  simulatorHeaderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  simulatorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  simulatorHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.3,
  },
  simulatorBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
    paddingTop: 8,
  },
  simulatorDesc: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
  simulatorButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  simBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
  },
  simBtnActiveDanger: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  simBtnActiveWarning: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  simBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
  },
});

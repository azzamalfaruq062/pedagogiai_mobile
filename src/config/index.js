import { Platform, NativeModules } from 'react-native';

/**
 * Auto-detect the host IP where the Expo JavaScript bundle was served from.
 * This guarantees the physical phone or emulator always reaches the Mac running Laravel.
 */
const getDetectedHostIp = () => {
  try {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      if (
        match &&
        match[1] &&
        match[1] !== 'localhost' &&
        match[1] !== '127.0.0.1'
      ) {
        return match[1];
      }
    }
  } catch (e) {}

  // Fallback to local machine WiFi IP or emulator gateway
  if (Platform.OS === 'android') {
    return '192.168.1.206';
  }
  return 'localhost';
};

const resolveApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const detectedHost = getDetectedHostIp();
  return `http://${detectedHost}:8000/api`;
};

export const CONFIG = {
  APP_NAME: 'PedaGogiAI',
  APP_VERSION: '1.0.0',
  API_BASE_URL: resolveApiBaseUrl(),
  FALLBACK_URL: 'http://192.168.1.206:8000/api',
  STORAGE_KEYS: {
    AUTH_TOKEN: '@pedagogiai_auth_token',
    USER_DATA: '@pedagogiai_user_data',
    THEME_MODE: '@pedagogiai_theme_mode',
    BIOMETRIC_ENABLED: '@pedagogiai_biometric_enabled',
    BIOMETRIC_SAVED_CREDS: '@pedagogiai_biometric_saved_creds',
  },
  TIMEOUT: 5000,
};

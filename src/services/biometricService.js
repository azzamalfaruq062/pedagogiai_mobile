import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { appStorage } from '../utils/storage';
import { CONFIG } from '../config';

/**
 * Service for managing Biometrics (Face ID, Touch ID, Fingerprint, Iris)
 * on Android and iOS devices.
 */
export const biometricService = {
  /**
   * Check hardware availability and enrolled biometric types on the device.
   * Returns a detailed capability object.
   */
  async checkBiometricSupport() {
    try {
      if (Platform.OS === 'web') {
        return {
          hasHardware: false,
          isEnrolled: false,
          isAvailable: false,
          supportedTypes: [],
          hasFace: false,
          hasFingerprint: false,
          hasIris: false,
          label: 'Biometrik Tidak Didukung di Web',
          icon: 'shield-outline',
        };
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
      const supportedTypes = hasHardware
        ? await LocalAuthentication.supportedAuthenticationTypesAsync()
        : [];

      const hasFace = supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
      );
      const hasFingerprint = supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FINGERPRINT
      );
      const hasIris = supportedTypes.includes(
        LocalAuthentication.AuthenticationType.IRIS
      );

      // Determine friendly label & icon based on detected sensor
      let label = 'Biometrik';
      let icon = 'finger-print-outline';

      if (hasFace) {
        label = Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
        icon = 'scan-outline';
      } else if (hasFingerprint) {
        label = Platform.OS === 'ios' ? 'Touch ID' : 'Sidik Jari (Fingerprint)';
        icon = 'finger-print-outline';
      } else if (hasIris) {
        label = 'Pemindai Iris';
        icon = 'eye-outline';
      }

      return {
        hasHardware,
        isEnrolled,
        isAvailable: hasHardware && isEnrolled,
        supportedTypes,
        hasFace,
        hasFingerprint,
        hasIris,
        label,
        icon,
      };
    } catch (error) {
      console.warn('[BiometricService] checkBiometricSupport error:', error);
      return {
        hasHardware: false,
        isEnrolled: false,
        isAvailable: false,
        supportedTypes: [],
        hasFace: false,
        hasFingerprint: false,
        hasIris: false,
        label: 'Biometrik',
        icon: 'finger-print-outline',
        error: error?.message,
      };
    }
  },

  /**
   * Check if the user has enabled biometric authentication in app settings.
   */
  async isBiometricEnabled() {
    try {
      const val = await appStorage.getItem(CONFIG.STORAGE_KEYS.BIOMETRIC_ENABLED);
      return val === 'true';
    } catch (e) {
      return false;
    }
  },

  /**
   * Toggle biometric authentication setting.
   */
  async setBiometricEnabled(enabled) {
    try {
      await appStorage.setItem(
        CONFIG.STORAGE_KEYS.BIOMETRIC_ENABLED,
        enabled ? 'true' : 'false'
      );
      if (!enabled) {
        // Optionally keep or clear credentials
      }
      return true;
    } catch (e) {
      console.warn('[BiometricService] setBiometricEnabled error:', e);
      return false;
    }
  },

  /**
   * Launch native biometric authentication prompt.
   * @param {string} promptMessage Prompt description shown to the user
   * @param {object} options Extra options
   */
  async authenticate(promptMessage = 'Verifikasi biometrik Anda', options = {}) {
    try {
      if (Platform.OS === 'web') {
        return { success: false, error: 'Web platform does not support biometrics' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Gunakan Kata Sandi Akun',
        cancelLabel: 'Batal',
        disableDeviceFallback: false,
        ...options,
      });

      return result;
    } catch (error) {
      console.warn('[BiometricService] authenticate error:', error);
      return { success: false, error: error?.message || 'Gagal memverifikasi biometrik' };
    }
  },

  /**
   * Save user credentials securely for quick biometric login.
   */
  async saveBiometricCredentials(data) {
    try {
      if (!data) return false;
      await appStorage.setItem(
        CONFIG.STORAGE_KEYS.BIOMETRIC_SAVED_CREDS,
        JSON.stringify(data)
      );
      return true;
    } catch (e) {
      console.warn('[BiometricService] saveBiometricCredentials error:', e);
      return false;
    }
  },

  /**
   * Retrieve saved user credentials for biometric login.
   */
  async getBiometricCredentials() {
    try {
      const raw = await appStorage.getItem(CONFIG.STORAGE_KEYS.BIOMETRIC_SAVED_CREDS);
      if (raw) {
        return JSON.parse(raw);
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Clear saved biometric login credentials.
   */
  async clearBiometricCredentials() {
    try {
      await appStorage.removeItem(CONFIG.STORAGE_KEYS.BIOMETRIC_SAVED_CREDS);
      return true;
    } catch (e) {
      return false;
    }
  },
};

export default biometricService;

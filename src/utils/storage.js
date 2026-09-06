/**
 * Safe Persistent Storage Abstraction
 * Uses @react-native-async-storage/async-storage when available, with in-memory fallback.
 */

let NativeAsyncStorage = null;

try {
  // Dynamic require so bundler won't fail if native module is still installing
  const mod = require('@react-native-async-storage/async-storage');
  NativeAsyncStorage = mod.default || mod;
} catch (e) {
  // In-memory fallback
}

const memoryStore = new Map();

export const appStorage = {
  async getItem(key) {
    if (NativeAsyncStorage) {
      try {
        const val = await NativeAsyncStorage.getItem(key);
        if (val !== null) return val;
      } catch (err) {
        console.warn('[Storage] Failed to getItem from native storage:', err);
      }
    }
    return memoryStore.get(key) || null;
  },

  async setItem(key, value) {
    if (NativeAsyncStorage) {
      try {
        await NativeAsyncStorage.setItem(key, value);
      } catch (err) {
        console.warn('[Storage] Failed to setItem to native storage:', err);
      }
    }
    memoryStore.set(key, value);
  },

  async removeItem(key) {
    if (NativeAsyncStorage) {
      try {
        await NativeAsyncStorage.removeItem(key);
      } catch (err) {
        console.warn('[Storage] Failed to removeItem from native storage:', err);
      }
    }
    memoryStore.delete(key);
  },
};

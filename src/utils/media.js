import { CONFIG } from '../config';

/**
 * Robust image URL resolver for course thumbnails & media across platforms and dev network IPs
 */
export const getCourseImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // If already absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
      try {
        const apiHostMatch = CONFIG.API_BASE_URL.match(/^https?:\/\/([^:/]+)(?::(\d+))?/);
        if (apiHostMatch) {
          const targetHost = apiHostMatch[1];
          const targetPort = apiHostMatch[2] || '8000';
          return trimmed.replace(/https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?/, `http://${targetHost}:${targetPort}`);
        }
      } catch (e) {
        return trimmed;
      }
    }
    return trimmed;
  }

  // Relative storage paths
  const baseHost = CONFIG.API_BASE_URL.replace(/\/api\/?$/, '');
  if (trimmed.startsWith('/storage')) {
    return `${baseHost}${trimmed}`;
  }
  if (trimmed.startsWith('storage/')) {
    return `${baseHost}/${trimmed}`;
  }
  if (trimmed.startsWith('courses/')) {
    return `${baseHost}/storage/${trimmed}`;
  }
  return `${baseHost}/storage/${trimmed.replace(/^\//, '')}`;
};

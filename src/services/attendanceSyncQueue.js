import { appStorage } from '../utils/storage';
import { locationAttendanceApi } from '../api/locationAttendanceApi';

const STORAGE_QUEUE_KEY = '@inobel_offline_attendance_queue';

/**
 * Pure RFC4122 v4 UUID generator for unique idempotency keys
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Attendance Sync Queue Manager (Offline-First)
 */
class AttendanceSyncQueue {
  constructor() {
    this.listeners = new Set();
    this.isSyncing = false;
  }

  /**
   * Subscribe to queue status changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.warn('[Queue] Listener error:', err);
      }
    }
  }

  /**
   * Retrieve all items in the pending queue
   */
  async getQueue() {
    try {
      const raw = await appStorage.getItem(STORAGE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn('[Queue] Failed to parse queue:', err);
      return [];
    }
  }

  /**
   * Persist the queue
   */
  async saveQueue(queue) {
    try {
      await appStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
      this.notify();
    } catch (err) {
      console.warn('[Queue] Failed to save queue:', err);
    }
  }

  /**
   * Add an attendance submission to the offline queue
   * @param {Object} item
   */
  async enqueue(item) {
    const queue = await this.getQueue();
    const queuedItem = {
      ...item,
      idempotency_key: item.idempotency_key || generateUUID(),
      queued_at: new Date().toISOString(),
      status: 'pending_sync',
      retry_count: 0,
    };

    queue.push(queuedItem);
    await this.saveQueue(queue);
    return queuedItem;
  }

  /**
   * Remove a specific item from the queue by its idempotency_key
   */
  async dequeue(idempotencyKey) {
    const queue = await this.getQueue();
    const filtered = queue.filter((i) => i.idempotency_key !== idempotencyKey);
    await this.saveQueue(filtered);
  }

  /**
   * Clear all pending items in the queue
   */
  async clear() {
    await this.saveQueue([]);
  }

  /**
   * Get pending queue count
   */
  async getPendingCount() {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Process all pending items in the queue.
   * Employs idempotency key to prevent double submissions.
   */
  async processQueue() {
    if (this.isSyncing) return { success: true, count: 0, message: 'Sync sedang berjalan.' };

    const queue = await this.getQueue();
    if (queue.length === 0) return { success: true, count: 0, message: 'Tidak ada antrean presensi.' };

    this.isSyncing = true;
    let syncedCount = 0;
    const remainingQueue = [];

    for (const item of queue) {
      try {
        const payload = {
          office_id: item.office_id,
          latitude: item.latitude,
          longitude: item.longitude,
          accuracy: item.accuracy,
          is_mock_location: item.is_mock_location,
          device_id: item.device_id,
          idempotency_key: item.idempotency_key,
          client_timestamp: item.client_timestamp,
          notes: item.notes,
        };

        let response;
        if (item.type === 'in') {
          response = await locationAttendanceApi.checkIn(payload);
        } else {
          response = await locationAttendanceApi.checkOut(payload);
        }

        if (response && (response.success || response.idempotent)) {
          syncedCount++;
        } else {
          remainingQueue.push({
            ...item,
            retry_count: (item.retry_count || 0) + 1,
            last_error: response?.message || 'Gagal tersinkron',
          });
        }
      } catch (error) {
        console.warn('[Queue] Failed to sync item:', item.idempotency_key, error?.message);
        remainingQueue.push({
          ...item,
          retry_count: (item.retry_count || 0) + 1,
          last_error: error?.message || 'Koneksi terputus',
        });
      }
    }

    await this.saveQueue(remainingQueue);
    this.isSyncing = false;

    return {
      success: true,
      syncedCount,
      remainingCount: remainingQueue.length,
      message: syncedCount > 0
        ? `Berhasil menyinkronkan ${syncedCount} catatan presensi offline.`
        : 'Belum berhasil terhubung ke server.',
    };
  }
}

export const attendanceSyncQueue = new AttendanceSyncQueue();

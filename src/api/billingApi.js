import { apiClient } from './client';
import { CONFIG } from '../config';

export const billingApi = {
  /**
   * Mengambil daftar seluruh tagihan siswa yang sedang login beserta
   * metadata profil siswa, agregat statistik, tahun ajaran, dan kategori.
   * @param {Object} [params] - { status, category, academic_year_id }
   */
  getMyBills: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') {
      query.append('status', params.status);
    }
    if (params.category && params.category !== 'all') {
      query.append('category', params.category);
    }
    if (params.academic_year_id && params.academic_year_id !== 'all') {
      query.append('academic_year_id', params.academic_year_id);
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient(`/billing/bills${queryString}`);
  },

  /**
   * Mengambil detail satu tagihan beserta riwayat cicilan & beasiswa
   * @param {string|number} id
   */
  getBillDetail: async (id) => {
    return apiClient(`/billing/bills/${id}`);
  },

  /**
   * Menerbitkan nomor VA dan kode biller untuk tagihan yang akan dibayar
   * @param {string|number} billId
   */
  generateVA: async (billId) => {
    return apiClient('/billing/generate-va', {
      body: { bill_id: billId },
    });
  },

  /**
   * Cek / polling status tagihan berdasarkan nomor VA atau ID tagihan
   * @param {string|number} nomor
   */
  checkStatus: async (nomor) => {
    return apiClient(`/billing/check-status/${encodeURIComponent(nomor)}`);
  },

  /**
   * Mendapatkan URL resmi berkas formal Kwitansi PDF (DomPDF dari server)
   * @param {string|number} idOrNomor
   */
  getInvoicePdfUrl: (idOrNomor) => {
    const baseUrl = CONFIG.API_BASE_URL || CONFIG.FALLBACK_URL || 'http://192.168.1.206:8000/api';
    return `${baseUrl}/billing/bills/${encodeURIComponent(idOrNomor)}/pdf`;
  },

  /**
   * Mengambil daftar tahun ajaran yang tersedia
   */
  getAcademicYears: async () => {
    return apiClient('/billing/academic-years');
  },
};


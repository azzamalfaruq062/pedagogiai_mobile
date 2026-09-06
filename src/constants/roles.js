export const USER_ROLES = {
  SISWA: 'siswa',
  GURU: 'guru',
  ADMIN: 'admin',
  KARYAWAN: 'karyawan',
  KANTIN: 'kantin',
};

export const ROLE_DEFINITIONS = [
  {
    id: USER_ROLES.SISWA,
    label: 'Siswa',
    badge: 'Aktif',
    description: 'Akses KBM, Tugas, Ujian, & E-Kantin',
    icon: 'school',
    enabled: true,
  },
  {
    id: USER_ROLES.GURU,
    label: 'Guru & Tenaga Didik',
    badge: 'Khusus Admin',
    description: 'Dikelola oleh Administrator Sekolah',
    icon: 'briefcase',
    enabled: false,
  },
];

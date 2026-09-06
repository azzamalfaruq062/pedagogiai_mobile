# PedaGogiAI Mobile App (React Native / Expo)

Aplikasi mobile PedaGogiAI berbasis **React Native (Expo)** yang dirancang dengan arsitektur **Enterprise SaaS** dan pendekatan **mobile-first modern**.

---

## 🍽️ Fitur E-Kantin Mobile yang Sudah Tersedia

1. **Katalog & Menu Jajan Sekolah ([`CanteenMenuScreen.js`](file:///Users/azzamal/Downloads/inobel/mobile/src/screens/canteen/CanteenMenuScreen.js))**:
   - Bar saldo dompet real-time di bagian atas dengan tombol cepat *Top Up*.
   - Pencarian cerdas untuk makanan, minuman, dan stan kantin.
   - Filter kategori bergaya chips (*Semua*, *Makanan Berat*, *Snack & Roti*, *Minuman Segar*, *Paket Hemat*).
   - Kartu produk interaktif:
     - Nama stan/merchant (e.g. *Dapur Mbok Darmi, Kantin Barokah*), estimasi waktu saji, rating bintang, jumlah ulasan.
     - Tombol **+ Pesan** dengan stepper quantity mini jika sudah dimasukkan ke keranjang.
   - *Floating Cart Bar* di bagian bawah yang muncul otomatis saat ada pesanan di keranjang.

2. **Keranjang & Checkout Nontunai ([`CanteenCartModal.js`](file:///Users/azzamal/Downloads/inobel/mobile/src/screens/canteen/CanteenCartModal.js))**:
   - *Bottom-sheet* modal untuk meninjau rincian item, menambah/mengurangi porsi, dan melihat total belanja.
   - Pembayaran 1-klik menggunakan saldo Dompet Digital E-Kantin.
   - Validasi saldo dompet otomatis (memberikan saran Top Up jika saldo kurang).
   - Penerbitan nomor antrean kasir otomatis (e.g. `#K-241`).

3. **Dompet Digital Siswa ([`CanteenWalletScreen.js`](file:///Users/azzamal/Downloads/inobel/mobile/src/screens/canteen/CanteenWalletScreen.js))**:
   - Tampilan visual **Kartu Debit Pelajar Virtual (INOBEL E-MONEY)** dengan nomor kartu, nama siswa, chip emas, dan NISN.
   - **QR Barcode Siswa**: Modal QR code yang dapat di-scan langsung oleh kasir kantin.
   - **Isi Saldo (Top Up Midtrans / QRIS)**: Pilihan nominal instan (*Rp 10.000, Rp 20.000, Rp 50.000, Rp 100.000*).
   - **Kontrol Batas Jajan Harian (Parental Control)**: Bar progres jajan harian siswa (*Terpakai vs Batas Harian*).

4. **Riwayat Transaksi & Nota Digital ([`CanteenHistoryScreen.js`](file:///Users/azzamal/Downloads/inobel/mobile/src/screens/canteen/CanteenHistoryScreen.js))**:
   - Tab filter: *Semua*, *Jajan Kantin*, dan *Top Up*.
   - Daftar riwayat transaksi dengan tanggal, nama stan, status, dan nomor antrean.
   - **E-Receipt Digital Modal**: Klik salah satu transaksi untuk membuka struk pembayaran digital resmi.

---

## 🧪 Cara Cepat Menguji Semua Halaman (Dev Test Switcher)

Di bagian atas aplikasi (tepat di bawah header), terdapat bar khusus pengujian:
👉 **"Mode Uji Coba UI (Klik untuk buka menu tes)"**

Cukup klik bar tersebut untuk membuka tombol pintas instan ke seluruh halaman tanpa perlu login berulang-ulang:
- `[🔑 Login]` ➔ Formulir Masuk
- `[📝 Register]` ➔ Formulir Pendaftaran Siswa
- `[🍔 Menu Kantin]` ➔ Katalog Menu Jajan & Tambah Keranjang
- `[💳 Dompet & QR]` ➔ Kartu Pelajar, QR Kasir, & Top Up Saldo
- `[📜 Riwayat]` ➔ Riwayat Pesanan & E-Receipt
- `[🏠 Dashboard]` ➔ Beranda Siswa & Profil

Selain itu, di bagian bawah layar utama terdapat **Bottom Tab Bar** (`Kantin`, `Dompet`, `Riwayat`, `Akun`) seperti aplikasi mobile populer pada umumnya.

---

## 🚀 Cara Menjalankan

Buka terminal di folder `mobile`:

```bash
cd mobile
npm run web
```
*(Atau `npx expo start` untuk membuka di HP fisik melalui aplikasi Expo Go)*

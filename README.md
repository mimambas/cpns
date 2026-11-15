# Simulasi CAT SKD & Pusat Belajar CPNS (`cpns.imambas.my.id`)

Website simulasi ujian Computer Assisted Test (CAT) Seleksi Kompetensi Dasar (SKD) CPNS dan pusat sumber belajar tanpa login.

## Fitur Utama

- **Simulasi Ujian CAT Realistis**:
  - 2 paket penuh masing-masing **110 soal** sesuai komposisi resmi BKN (**30 TWK**, **35 TIU**, **45 TKP**) dengan timer **100 menit** otomatis.
  - Mode latihan fokus per subtes (TWK, TIU, TKP).
  - Navigasi nomor soal, penanda ragu-ragu, dan pintasan keyboard (`A`–`E`, panah kiri/kanan).
- **Perhitungan Skor & Passing Grade Resmi (Kepmenpan RB No. 321 Tahun 2024)**:
  - TWK & TIU: benar `+5`, salah/kosong `0` (maksimal TWK `150`, TIU `175`).
  - TKP: skor bertingkat `1`–`5`, kosong `0` (maksimal `225`).
  - Dukungan evaluasi ambang batas untuk formasi **Umum**, **Cumlaude / Diaspora**, dan **Disabilitas / Putra-Putri Papua / Daerah Tertinggal**.
- **Pembahasan Lengkap, Link Sumber Soal & Ekspor PDF**:
  - Setiap butir soal menampilkan jawaban pengguna, jawaban benar/bobot poin 1–5 TKP, pembahasan, link sumber asli dokumen soal, dan link materi rujukan.
  - Ekspor laporan lengkap ke **PDF** berisi skor, status kelulusan, waktu pengerjaan, dan rincian pembahasan seluruh soal beserta link sumbernya.
- **Pusat Belajar CPNS**:
  - Kumpulan rujukan dari [SSCASN BKN](https://sscasn.bkn.go.id/), [Materi CPNS Kerjago](https://kerjago.id/materi-cpns), [Arsip Google Drive](https://drive.google.com/drive/folders/1Ezv-eN2_sMBPWDpVsPInxOXzowBhlG15), dan [Video Pembahasan TIU Figural Ruang Tentor](https://youtu.be/aCEH7JRLJDY?si=Sl_7cWjqoV1xDQb6).

## Pengembangan Lokal

```bash
npm install
npm run dev
npm run build
```

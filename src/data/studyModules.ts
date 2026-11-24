import type { StudyLinkItem, StudyModuleId } from '../types';

export interface StudyModuleMeta {
  id: StudyModuleId;
  number: number;
  shortLabel: string;
  title: string;
  subtitle: string;
  duration: string;
  tag: string;
  practicePackageId: string;
  practiceLabel: string;
}

export const STUDY_MODULES: StudyModuleMeta[] = [
  {
    id: 'modul-regulasi',
    number: 1,
    shortLabel: '1. Regulasi',
    title: 'Sistem CAT BKN & Ambang Batas 2024',
    subtitle: 'Memahami aturan Kepmenpan RB No. 321 Tahun 2024, pembobotan nilai, dan portal resmi SSCASN.',
    duration: '10 mnt',
    tag: 'Regulasi & Alur',
    practicePackageId: 'paket-lolosasn-2023',
    practiceLabel: 'Siapkan simulasi penuh 110 soal',
  },
  {
    id: 'modul-twk',
    number: 2,
    shortLabel: '2. TWK',
    title: 'Tes Wawasan Kebangsaan (TWK)',
    subtitle: 'Intisari Pembukaan UUD 1945, UU ASN BerAKHLAK, amandemen konstitusi, dan modul Kerjago.',
    duration: '20 mnt',
    tag: '30 Soal · Min 65',
    practicePackageId: 'fokus-twk-paket2',
    practiceLabel: 'Latihan fokus TWK (30 soal)',
  },
  {
    id: 'modul-tiu',
    number: 3,
    shortLabel: '3. TIU & Figural',
    title: 'Tes Intelegensia Umum (TIU) & Figural',
    subtitle: 'Video pembahasan 15 soal deret gambar Ruang Tentor, checklist pola figural, dan rumus cepat.',
    duration: '25 mnt',
    tag: '35 Soal · Min 80',
    practicePackageId: 'fokus-tiu-paket2',
    practiceLabel: 'Latihan fokus TIU (35 soal)',
  },
  {
    id: 'modul-tkp',
    number: 4,
    shortLabel: '4. Strategi TKP',
    title: 'Strategi Skor 5 TKP (6 Aspek ASN)',
    subtitle: 'Panduan memilih opsi bernilai 5 poin pada pelayanan publik, jejaring kerja, TIK, hingga anti-radikalisme.',
    duration: '15 mnt',
    tag: '45 Soal · Min 166',
    practicePackageId: 'fokus-tkp-paket1',
    practiceLabel: 'Latihan fokus TKP (45 soal)',
  },
  {
    id: 'modul-drive',
    number: 5,
    shortLabel: '5. E-Book Drive',
    title: 'Perpustakaan E-Book & Bank Soal Drive',
    subtitle: 'Akses 6 e-book utama (LolosASN, Bank Drilling 2024/2025, Sukses SKD, CAT BKN) dan 4 folder arsip.',
    duration: 'Arsip',
    tag: 'Google Drive',
    practicePackageId: 'paket-hots-2024-2025',
    practiceLabel: 'Siapkan simulasi HOTS Paket 2',
  },
];

export const KERJAGO_MODULES: StudyLinkItem[] = [
  {
    title: 'UUD 1945 lengkap per pasal setelah amandemen',
    url: 'https://kerjago.id/materi-cpns/uud-1945',
    category: 'TWK: Konstitusi',
    description:
      'Naskah UUD NRI 1945 setelah empat kali perubahan per bab dan pasal beserta penanda perubahan tiap pasal.',
  },
  {
    title: 'Pembukaan UUD 1945: teks lengkap 4 alinea dan maknanya',
    url: 'https://kerjago.id/materi-cpns/pembukaan-uud-1945',
    category: 'TWK: Konstitusi',
    description:
      'Pokok isi tiap alinea Pembukaan UUD 1945: hak kemerdekaan, cita-cita perjuangan, pernyataan kemerdekaan, tujuan negara, dan dasar negara.',
  },
  {
    title: 'Pancasila dan 45 butir pengamalannya',
    url: 'https://kerjago.id/materi-cpns/pancasila',
    category: 'TWK: Ideologi',
    description:
      'Kelima sila Pancasila beserta 45 butir pedoman penghayatan dan pengamalan (Tap MPR No. I/MPR/2003) yang kerap keluar pada soal studi kasus TWK.',
  },
  {
    title: 'UU ASN Nomor 20 Tahun 2023: asas, nilai dasar & kode etik',
    url: 'https://kerjago.id/materi-cpns/uu-asn',
    category: 'TWK: Regulasi ASN',
    description:
      'Ringkasan pasal penting UU No. 20 Tahun 2023 tentang Aparatur Sipil Negara: nilai dasar BerAKHLAK, fungsi, tugas, dan kode etik ASN.',
  },
  {
    title: 'Lembaga negara menurut UUD 1945',
    url: 'https://kerjago.id/materi-cpns/lembaga-negara',
    category: 'TWK: Tata Negara',
    description:
      'Tugas, wewenang, dan dasar konstitusional MPR, DPR, DPD, Presiden, MA, MK, KY, dan BPK pasca amandemen.',
  },
  {
    title: 'Sejarah kebangsaan Indonesia',
    url: 'https://kerjago.id/materi-cpns/sejarah',
    category: 'TWK: Nasionalisme',
    description:
      'Garis waktu perjuangan bangsa dari Budi Utomo (1908), Sumpah Pemuda (1928), BPUPKI, Piagam Jakarta, PPKI, Proklamasi, hingga Dekrit Presiden 1959.',
  },
  {
    title: 'Rumus & pola TIU SKD CPNS',
    url: 'https://kerjago.id/materi-cpns/tiu',
    category: 'TIU: Verbal & Numerik',
    description:
      'Ringkasan pola deret angka dan huruf, hukum penarikan kesimpulan silogisme (modus ponens, tollens, ekuivalensi), persen, diskon, perbandingan, dan kecepatan.',
  },
  {
    title: 'Enam aspek TKP dan strategi meraih poin 5',
    url: 'https://kerjago.id/materi-cpns/tkp',
    category: 'TKP: Karakteristik Pribadi',
    description:
      'Panduan mengenali pola jawaban skor maksimal (5) pada aspek pelayanan publik, jejaring kerja, sosial budaya, TIK, profesionalisme, dan anti-radikalisme.',
  },
];

export const GOOGLE_DRIVE_ROOT_URL =
  'https://drive.google.com/drive/folders/1Ezv-eN2_sMBPWDpVsPInxOXzowBhlG15';

export const DRIVE_FILES: {
  title: string;
  format: string;
  url: string;
  focus: string;
  description: string;
}[] = [
  {
    title: 'TRYOUT CPNS 2023 By LolosASN - PEMBAHASAN.pdf',
    format: 'PDF (110 soal + kunci)',
    url: 'https://drive.google.com/file/d/1B74f7u1ul_4jIvn1nmtvnMuCr4fp3m5d/view',
    focus: 'TWK · TIU · TKP',
    description:
      'Paket lengkap 110 soal SKD (30 TWK, 35 TIU, 45 TKP) beserta konsep pembahasan dan tabel urutan skor TKP 5-1 (sumber Paket 1 aplikasi ini).',
  },
  {
    title: 'CPNS-2024-2025.pdf',
    format: 'PDF (253 halaman)',
    url: 'https://drive.google.com/file/d/1JK0AJgnLxIUq4uTZ96xmYR3Ht9qhd4Rf/view',
    focus: 'Bank Drilling HOTS',
    description:
      'E-book Bank Drilling soal SKD CPNS 2024/2025 berisi kisi-kisi terbaru, alur SSCASN, bahas per subtes, dan 3 paket latihan lengkap (sumber Paket 2, Paket 3, dan Paket 4 aplikasi ini).',
  },
  {
    title: 'CPNS-2025-Materi-Lengkap-TIU.pdf',
    format: 'PDF',
    url: 'https://drive.google.com/file/d/1z2d-GsW3U4mxckdB4ac3AjlXhiJNcM3B/view',
    focus: 'TIU Lengkap',
    description:
      'Kompilasi materi, rumus hitung cepat, penalaran logis, analitis, dan deret angka khusus Tes Intelegensia Umum.',
  },
  {
    title: 'Modul Resmi SKD + SKB CPNS 2024-2025.pdf',
    format: 'PDF (758 halaman · 10 paket CAT)',
    url: 'https://drive.google.com/file/d/10LeWsUT4p1HUR-_ilMr2hjnMHcoPkzuu/view',
    focus: 'TWK · TIU · TKP',
    description:
      'Buku latihan sistem CAT lengkap berisi 10 paket soal SKD (masing-masing 100 soal: 30 TWK, 30 TIU, 40 TKP) beserta pembahasan dan tabel poin TKP (sumber Paket 5 sampai Paket 14 aplikasi ini).',
  },
  {
    title: 'SUKSES SKD CPNS 2023-2024.pdf',
    format: 'PDF',
    url: 'https://drive.google.com/file/d/1L8ILOdFd5KnCY-JcBqT0MnkgauHpeY68/view',
    focus: 'TWK · TIU · TKP',
    description:
      'Panduan belajar dan kumpulan paket latihan soal SKD beserta kunci jawaban terstruktur.',
  },
  {
    title: 'Menaklukan Soal CPNS dalam 1 Jam.pdf',
    format: 'PDF',
    url: 'https://drive.google.com/file/d/14Wjty6MSuUszNEvLPfxndBVMleSljVWD/view',
    focus: 'Strategi & Trik Cepat',
    description:
      'Materi teknik manajemen waktu pengerjaan CAT BKN dan cara eliminasi pilihan jawaban pengecoh.',
  },
  {
    title: 'Simulasi CAT BKN.docx',
    format: 'Word (.docx, 100 soal)',
    url: 'https://drive.google.com/file/d/1yasJyOacnrtp0gxwT-DajOy830ycP2AA/view',
    focus: 'Latihan Mandiri',
    description:
      'Dokumen latihan soal simulasi CAT berbasis teks yang dapat dicetak atau dipelajari secara luring.',
  },
];

export const DRIVE_SUBFOLDERS: { title: string; url: string; note: string }[] = [
  {
    title: 'Folder referensi Al-Faiz',
    url: 'https://drive.google.com/drive/folders/1p0a7fjjpA16XQDjCj1XIt_pIqgL77mLP',
    note: 'Kumpulan modul dan latihan soal persiapan SKD.',
  },
  {
    title: 'Ebook CPNS & PPPK (LolosASN)',
    url: 'https://drive.google.com/drive/folders/1Rzfx0m3gWgw4sUrnSHEgFAaRbaYHCr-e',
    note: 'Arsip e-book dan paket try out terstruktur.',
  },
  {
    title: 'Resource CPNS 2023 (Google Drive)',
    url: 'https://drive.google.com/drive/folders/17pw_d9ci0O7RnQ6ICdo5Q0Q_7AZN3ps0',
    note: 'Bank soal dan catatan belajar bersama.',
  },
  {
    title: 'Soal latihan CPNS KPK',
    url: 'https://drive.google.com/drive/folders/1DVEU2RTwTkuy4lgTgbfOihgYqXxuBDG6',
    note: 'Latihan soal integritas, anti-korupsi, dan SKD.',
  },
];

export const YOUTUBE_RESOURCE = {
  id: 'aCEH7JRLJDY',
  title: '[8.15] 15 Soal Deret Gambar TIU SKD CPNS 2024 (Ruang Tentor)',
  url: 'https://youtu.be/aCEH7JRLJDY?si=Sl_7cWjqoV1xDQb6',
  embedUrl: 'https://www.youtube.com/embed/aCEH7JRLJDY',
  channel: 'Ruang Tentor',
  tips: [
    'Amati satu elemen spesifik terlebih dahulu (misalnya titik hitam, bintang, atau arah panah) daripada mencoba membaca seluruh gambar sekaligus.',
    'Periksa pola rotasi bertahap: apakah berputar 45°, 90°, atau 180° searah atau berlawanan jarum jam pada tiap langkah.',
    'Cek perubahan jumlah sisi bangun datar atau banyaknya garis/arsiran (+1, -1, atau selang-seling ganjil-genap).',
    'Pada soal ketidaksamaan (odd one out), putar gambar secara mental di bidang 2D, karena gambar hasil pencerminan (mirror) hampir selalu menjadi pengecoh yang berbeda.',
  ],
};

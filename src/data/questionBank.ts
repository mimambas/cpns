import rawData from './questions.json';
import type { Question, QuestionCategory, QuestionPackage, StudyLinkItem } from '../types';

interface RawPackage {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  sourceTitle: string;
  sourceUrl: string;
  questions: Question[];
}

const typedPackages = (rawData as { packages: RawPackage[] }).packages;

export const FULL_PACKAGES: QuestionPackage[] = typedPackages.map((pkg) => ({
  ...pkg,
  isFullSimulation: true,
  compositionLabel: '110 soal (30 TWK · 35 TIU · 45 TKP)',
}));

function buildFocusedPackage(
  id: string,
  title: string,
  description: string,
  category: QuestionCategory,
  durationMinutes: number,
  sourcePkg: RawPackage,
): QuestionPackage {
  const filtered = sourcePkg.questions
    .filter((q) => q.category === category)
    .map((q, index) => ({
      ...q,
      number: index + 1,
    }));

  return {
    id,
    title,
    description,
    durationMinutes,
    sourceTitle: sourcePkg.sourceTitle,
    sourceUrl: sourcePkg.sourceUrl,
    isFullSimulation: false,
    compositionLabel: `${filtered.length} soal khusus ${category}`,
    questions: filtered,
  };
}

export const ALL_PACKAGES: QuestionPackage[] = [
  ...FULL_PACKAGES,
  buildFocusedPackage(
    'fokus-twk-paket2',
    'Latihan fokus TWK: Tes Wawasan Kebangsaan',
    '30 soal TWK pilihan dari Bank Drilling CPNS 2024/2025 mencakup Pancasila, UUD 1945, NKRI, sejarah nasional, dan Bahasa Indonesia.',
    'TWK',
    30,
    typedPackages[1],
  ),
  buildFocusedPackage(
    'fokus-tiu-paket2',
    'Latihan fokus TIU: Tes Intelegensia Umum',
    '35 soal TIU pilihan mencakup analogi, silogisme, hitung cepat, deret angka, penalaran analitis, serta soal figural gambar.',
    'TIU',
    35,
    typedPackages[1],
  ),
  buildFocusedPackage(
    'fokus-tkp-paket1',
    'Latihan fokus TKP: Tes Karakteristik Pribadi',
    '45 soal TKP dari modul LolosASN dengan pembobotan poin 1–5 pada aspek pelayanan publik, jejaring kerja, sosial budaya, TIK, profesionalisme, dan anti-radikalisme.',
    'TKP',
    40,
    typedPackages[0],
  ),
];

export function getPackageById(id: string): QuestionPackage | undefined {
  return ALL_PACKAGES.find((p) => p.id === id);
}

export const SSCASN_PORTAL = {
  title: 'Portal resmi SSCASN Badan Kepegawaian Negara (BKN)',
  url: 'https://sscasn.bkn.go.id/',
  helpdeskUrl: 'https://helpdesk-sscasn.bkn.go.id/',
  description:
    'Portal pendaftaran CPNS resmi pemerintah Indonesia untuk mengecek pengumuman formasi, persyaratan dokumen, jadwal tahapan seleksi, dan informasi resmi CAT BKN.',
};

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
      'Paket lengkap 110 soal SKD (30 TWK, 35 TIU, 45 TKP) beserta konsep pembahasan dan tabel urutan skor TKP 5–1 (sumber Paket 1 aplikasi ini).',
  },
  {
    title: 'CPNS-2024-2025.pdf',
    format: 'PDF (253 halaman)',
    url: 'https://drive.google.com/file/d/1JK0AJgnLxIUq4uTZ96xmYR3Ht9qhd4Rf/view',
    focus: 'Bank Drilling HOTS',
    description:
      'E-book Bank Drilling soal SKD CPNS 2024/2025 berisi kisi-kisi terbaru, alur SSCASN, bahas per subtes, dan 3 paket latihan lengkap (sumber Paket 2 aplikasi ini).',
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

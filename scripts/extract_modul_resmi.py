#!/usr/bin/env python3
"""
Extract and verify all 10 SKD CAT packages (1,000 questions) from:
  Modul Resmi SKD + SKB CPNS 2024-2025.pdf
using pre-computed per-column Vision OCR + pixel-detected TKP tables in:
  .cache/sources/modul_resmi_json_v2/
"""

import glob
import json
import math
import os
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OCR_V2_DIR = ROOT / ".cache" / "sources" / "modul_resmi_json_v2"

SOURCE_TITLE = "Modul Resmi SKD + SKB CPNS 2024-2025 (All New Tes CPNS — Tim Garuda Eduka)"
# Strict no-em-dash policy per anti-slop guidelines
SOURCE_TITLE_CLEAN = "Modul Resmi SKD + SKB CPNS 2024-2025 (Tim Garuda Eduka)"
SOURCE_URL = "https://drive.google.com/file/d/10LeWsUT4p1HUR-_ilMr2hjnMHcoPkzuu/view"

CYR_MAP = str.maketrans({
    "А": "A", "В": "B", "С": "C", "Е": "E", "Н": "H", "К": "K",
    "М": "M", "О": "O", "Р": "P", "Т": "T", "Х": "X", "З": "3",
    "—": "-", "–": "-", "•": "-",
})

PAKETS = [
    (1, 167, 185, 186, 201),
    (2, 202, 218, 219, 233),
    (3, 234, 251, 252, 266),
    (4, 267, 286, 287, 302),
    (5, 303, 319, 320, 333),
    (6, 334, 351, 352, 365),
    (7, 366, 383, 384, 396),
    (8, 397, 413, 414, 426),
    (9, 427, 444, 445, 457),
    (10, 458, 474, 475, 488),
]

# Verified visual/table crops in public/figures/
FIGURE_OVERRIDES: dict[tuple[int, int], str] = {
    (3, 30): "/figures/modul-p3-q30.png",
    (4, 4): "/figures/modul-p4-q4.png",
    (4, 13): "/figures/modul-p4-q13.png",
    (4, 26): "/figures/modul-p4-q26.png",
    (4, 30): "/figures/modul-p4-q30.png",
    (6, 27): "/figures/modul-p6-q27.png",
    (7, 27): "/figures/modul-p7-q27.png",
}

# Verified visual transcriptions for stacked math formulas & full-width tables/options
QUESTION_OVERRIDES: dict[tuple[int, int], dict[str, Any]] = {
    (1, 47): {
        "options": {"A": "12 16", "B": "13 17", "C": "14 18", "D": "15 19", "E": "16 20"},
    },
    (3, 2): {
        "options": {
            "B": "Pancasila sebagai ideologi tertutup",
            "C": "Pancasila sebagai nilai instrumental",
        },
    },
    (3, 57): {
        "options": {
            "D": "E bisa bekerja pada hari Jumat.",
            "E": "D bisa bekerja pada hari Rabu.",
        },
    },
    (4, 46): {
        "question": "(88 × 88 × 88 + 37 × 37 × 37) / (88 × 88 + 37 × 37 - 88 × 37) = ....",
        "options": {"D": "147", "E": "155"},
    },
    (4, 71): {
        "options": {
            "D": "Anda hanya akan melakukan pekerjaan di luar deskripsi jabatan jika diminta oleh atasan.",
            "E": "Enggan berkontribusi lebih dari apa yang telah dikerjakan saat ini.",
        },
    },
    (5, 23): {
        "options": {"D": "1965", "E": "1995"},
    },
    (5, 70): {
        "options": {
            "D": "Mungkin berminat untuk mengajukan suatu ide kegiatan yang akan dilaksanakan. Namun tergantung situasi dan kondisi.",
            "E": "Ragu-ragu untuk mengajukan suatu ide kegiatan karena akan kecewa jika tidak diterima.",
        },
    },
    (6, 82): {
        "options": {
            "D": "Itu bukan wewenang saya.",
            "E": "Pasti sudah ada yang mengetahui dan melaporkannya.",
        },
    },
    (6, 99): {
        "options": {
            "D": "Melaporkannya pada atasan.",
            "E": "Tidak menghiraukannya.",
        },
    },
    (7, 31): {
        "options": {"A": "Panjar", "B": "Hutan"},
    },
    (7, 86): {
        "options": {
            "D": "Biasa saja yang penting nyaman.",
            "E": "Tempat tinggal bukan hal yang penting.",
        },
    },
    (8, 29): {
        "options": {
            "D": "Simpulannya, batik memiliki motif beragam yang diperoleh melalui laku sehingga bernilai filosofis.",
            "E": "Dengan begitu, batik adalah warisan leluhur yang memiliki kekuatan magis dan perlu ritual khusus.",
        },
    },
    (9, 12): {
        "options": {"D": "adat", "E": "hukum"},
    },
    (9, 83): {
        "options": {"D": "Suka melucu", "E": "Cenderung pendiam"},
    },
    (9, 95): {
        "options": {
            "D": "Memintanya agar belajar mandiri.",
            "E": "Memintanya dengan tegas agar belajar sendiri, karena itulah inti tanggung jawab.",
        },
    },
    (10, 15): {
        "options": {"D": "modern", "E": "harmonis"},
    },
    (3, 29): {
        "options": {
            "D": "Baru-baru ini sebuah lembaga survei pendidikan tinggi mengeluarkan daftar peringkat perguruan tinggi berkualitas di seluruh dunia.",
            "E": "Baru-baru ini sebuah lembaga survei pendidikan tinggi telah mengeluarkan daftar peringkat tentang perguruan tinggi berkualitas di seluruh dunia.",
        },
    },
    (4, 2): {
        "options": {
            "D": "negara menjamin kepentingan masyarakat seluruhnya sebagai suatu kesatuan",
            "E": "negara menjamin keselamatan hidup bangsa seluruhnya sebagai suatu kesatuan",
        },
    },
    (4, 29): {
        "question": "Belajar di Luar Negeri tidak harus selalu ke Perguruan Tinggi di Amerika Serikat, atau ke negara-negara di Eropa karena kualitas perguruan tinggi tidak ditentukan oleh lokasi tetapi oleh academic performance. Perbaikan ejaan kalimat di atas yang tepat adalah ...",
        "options": {
            "A": "Belajar di luar negeri tidak harus selalu ke Perguruan Tinggi di Amerika Serikat, atau ke negara-negara di Eropa karena kualitas perguruan tinggi tidak ditentukan oleh lokasi tetapi oleh academic performancenya.",
            "B": "Belajar di luar negeri tidak harus selalu ke perguruan tinggi di Amerika Serikat atau ke negara-negara di Eropa karena kualitas perguruan tinggi tidak ditentukan oleh lokasi, tetapi oleh academic performance-nya.",
            "C": "Belajar di luar negeri tidak harus selalu ke perguruan tinggi di Amerika Serikat, atau ke negara-negara di Eropa karena kualitas perguruan tinggi tidak ditentukan oleh lokasi tetapi oleh academic performance-nya.",
            "D": "Belajar di Luar Negeri tidak harus selalu ke Perguruan Tinggi di Amerika Serikat atau ke negara-negara di Eropa karena kualitas perguruan tinggi tidak ditentukan oleh lokasi tetapi oleh academic performance-nya.",
            "E": "Belajar di luar negeri tidak harus selalu ke Perguruan Tinggi di Amerika Serikat atau ke negara-negara di Eropa karena kualitas perguruan tinggi tidak ditentukan oleh lokasi tetapi oleh academic performance-nya.",
        },
    },
    (6, 26): {
        "options": {
            "D": "Riset tim dari Texas A&M University menunjukkan sel sensor lidah lalat buah bisa mengendalikan waktu makan dan jumlah makanan serta sangat berdampak terhadap nafsu makan serangga.",
            "E": "Studi yang dilakukan tim dari Texas A&M University mengungkap bahwa penelitian terhadap lidah lalat buah dapat menjadi solusi untuk mengendalikan nafsu makan pada serangga.",
        },
    },
    (7, 30): {
        "options": {
            "A": "Biran (dalam Effendy, 2010:46) menyatakan bahwa skenario adalah naskah cerita atau gagasan yang telah didesain cara penyajiannya agar komunikatif dan menarik untuk disampaikan dengan media film.",
            "B": '"Skenario adalah naskah cerita atau gagasan yang telah didesain cara penyajiannya agar komunikatif dan menarik untuk disampaikan dengan media film" (Biran, 2007).',
        },
    },
    (7, 80): {
        "options": {
            "D": "Saya jarang menolak perintah atasan kecuali jika hal tersebut benar-benar tidak mungkin.",
            "E": "Saya akan menerima karena walau bagaimanapun juga hal tersebut adalah perintah atasan.",
        },
    },
    (7, 81): {
        "options": {
            "D": "Menenangkan diri sebentar.",
            "E": "Segera memperbaiki kesalahan tersebut.",
        },
    },
    (8, 9): {
        "options": {
            "A": "Presiden mengangkat dan memberhentikan anggota anggota DPR/MPR.",
            "B": "Politik luar negeri Indonesia condong pada blok timur/negara sosialis-komunis.",
        },
    },
    (8, 90): {
        "options": {
            "B": "Jika dalam kondisi benar-benar mendesak maka saya akan minta tolong orang lain.",
            "C": "Tergantung situasi dan urgensi, terkadang saya meminta tolong terkadang tidak jika tidak dibutuhkan.",
        },
    },
    (9, 28): {
        "options": {
            "B": "tidak ada gagasan penjelas",
            "C": "mengandung kalimat sumbang",
        },
    },
    (10, 33): {
        "options": {"A": "Kabur", "B": "Jelas", "C": "Pasti", "D": "Nyata", "E": "Imajiner"},
    },
    (1, 46): {
        "question": "Manakah dari bilangan berikut yang nilainya melebihi nilai 4/3?",
        "options": {"A": "125%", "B": "14/16", "C": "√36 / √16", "D": "0,99", "E": "1,4 × 0,8"},
    },
    (2, 41): {
        "question": "Jika 2ak + 2 = 10 dan 4bk + 4 = 6, maka a/b = ....",
        "options": {"A": "3/4", "B": "1/2", "C": "8", "D": "6", "E": "3"},
    },
    (2, 42): {
        "question": "Jika a = 7 dan b = 2, x = (a - b)^2 dan y = (b - a)^2 maka ....",
        "options": {"A": "2x < 2y", "B": "x < y", "C": "x > y", "D": "x = y", "E": "x dan y tidak dapat ditentukan"},
    },
    (2, 44): {
        "question": "Jika x/y = 2/3 dan z/x = 3/4, maka nilai z/y = ....",
        "options": {"A": "2/3", "B": "3/4", "C": "1/3", "D": "1/2", "E": "3/5"},
    },
    (2, 46): {
        "question": "Setengah dari 1/30 adalah ....",
        "options": {"A": "1/80", "B": "1/40", "C": "1/30", "D": "1/18", "E": "1/9"},
    },
    (3, 41): {
        "question": "3x / 6 = 6y, maka (3x - y) / y = ....",
    },
    (3, 42): {
        "question": "Diketahui nilai a = 7, b = 5, dan c = (2a - b) / ab, maka nilai abc ....",
    },
    (3, 43): {
        "question": "Lima tahun yang akan datang, umur adik 3/4 umur kakak. Berapa umur adik sekarang jika 3 tahun yang lalu umur adik 1/2 umur kakak?",
    },
    (3, 44): {
        "question": "Andi memiliki 48 karung gula di tokonya dengan berat masing-masing sama. Andi kemudian mengirim 3/8 gulanya ke Toko Cibinong dan 2/5 gulanya ke Toko Cimahi. Jika yang masih tersedia adalah 1728 kg, berapa berat setiap karung semula?",
    },
    (4, 4): {
        "question": "Perbandingan ideologi Pancasila dengan ideologi liberalisme adalah .... (lihat tabel perbandingan Pancasila vs Liberalisme)",
        "options": {
            "A": "Pancasila: Hukum untuk menjunjung tinggi keadilan dan keberadaan individu dan masyarakat | Liberalisme: Hukum untuk melindungi individu",
            "B": "Pancasila: Kitab suci sebagai dasar hukum | Liberalisme: Demokrasi untuk kolektivitas",
            "C": "Pancasila: Demi kolektivitas berarti demi negara | Liberalisme: Peran negara ada untuk pemerataan",
            "D": "Pancasila: Masyarakat lebih penting daripada individu | Liberalisme: Individu lebih penting dari masyarakat",
            "E": "Pancasila: Individu-individu akan punya arti apabila hidup di tengah masyarakat | Liberalisme: Individu tidak penting",
        },
    },
    (4, 13): {
        "question": "Konsep negara hukum sering kali diterjemahkan dengan istilah rechtsstaat atau the rule of law. Secara historis kedua istilah rechtsstaat atau the rule of law lahir dari sistem politik dan hukum yang berlainan, perbedaan kedua istilah tersebut adalah, kecuali .... (lihat tabel)",
        "options": {
            "A": "Rechtsstaat: mulai populer di Eropa sejak abad XIX | The Rule of Law: mulai populer dengan terbitnya sebuah buku dari Albert van Dicey tahun 1885",
            "B": "Rechtsstaat: bersifat revolusioner | The Rule of Law: bersifat evolusioner",
            "C": "Rechtsstaat: bertumpu pada civil law system | The Rule of Law: bertumpu pada common law system",
            "D": "Rechtsstaat: karakteristik administratif | The Rule of Law: karakteristik judisial",
            "E": "Rechtsstaat: lahir dari kandungan negara konstitusi yang kemudian memunculkan doktrin egalitarian | The Rule of Law: lahir dari suatu perjuangan untuk menentang absolutisme",
        },
    },
    (4, 26): {
        "question": "Berikut adalah identitas buku yang dapat digunakan sebagai sumber untuk menulis karangan (lihat tabel). Daftar pustaka yang relevan dan tepat untuk laporan penelitian berjudul Manfaat BLT bagi Masyarakat Miskin adalah ....",
        "options": {
            "A": "Arif Muntaha. 2009. Pengentasan Kemiskinan di Indonesia. Yogyakarta: Harapan Jaya.\nB. Setiawan. 2009. Potret Kehidupan Penduduk Miskin. Yogyakarta: Jaya Maya.\nJalaluddin Rakhmat. 2009. Ide Genius Lahirnya BLT di Indonesia. Bandung: Remaja Jaya.\nHarsono Suwardi. 2010. Miskin Harta Kaya Hati. Surabaya: Sinar Harapan.",
            "B": "Muntaha, A. 2009. Pengentasan Kemiskinan di Indonesia. Yogyakarta: Harapan Jaya.\nSetiawan, B. 2009. Potret Kehidupan Penduduk Miskin. Yogyakarta: Jaya Maya.\nSuwardi, Harsono. 2010. Miskin Harta Kaya Hati. Surabaya: Sinar Harapan.",
            "C": "Arif Muntaha. (2009). Pengentasan Kemiskinan di Indonesia. Yogyakarta: Harapan Jaya.\nB. Setiawan. (2009). Potret Kehidupan Penduduk Miskin. Yogyakarta: Jaya Maya.\nHarsono Suwardi. (2010). Miskin Harta Kaya Hati. Surabaya: Sinar Harapan.\nJalaluddin Rakhmat. (2009). Ide Genius Lahirnya BLT di Indonesia. Bandung: Remaja Jaya.",
            "D": "Muntaha, A. 2009. Pengentasan Kemiskinan di Indonesia. Yogyakarta: Harapan Jaya.\nRakhmat, J. 2009. Ide Genius Lahirnya BLT di Indonesia. Bandung: Remaja Jaya.\nSetiawan, B. 2009. Potret Kehidupan Penduduk Miskin. Yogyakarta: Jaya Maya.",
            "E": "Muntaha, A. (2009). Pengentasan Kemiskinan di Indonesia. Yogyakarta: Jaya Maya.\nRakhmat, Jalaluddin. (2009). Ide Genius Lahirnya BLT di Indonesia. Bandung: Remaja Jaya.\nSuwardi, Harsono (2010). Miskin Harta Kaya Hati. Surabaya: Sinar Harapan.",
        },
    },
    (4, 30): {
        "question": "Bacalah tabel produksi jagung Kecamatan Sukamaju secara cermat! Pernyataan berikut yang sesuai dengan isi tabel di atas adalah ....",
        "options": {
            "A": "Produksi jagung setiap daerah selalu meningkat setiap tahun.",
            "B": "Persentase kenaikan produksi jagung daerah C paling tinggi.",
            "C": "Persentase kenaikan produksi jagung daerah D paling rendah.",
            "D": "Persentase kenaikan produksi jagung daerah B paling rendah.",
            "E": "Persentase kenaikan produksi jagung daerah D paling tinggi.",
        },
    },
    (4, 42): {
        "question": "Jika 0 < a < b dan a^2 + b^2 = -4ab, maka (b - a)/(a + b) = ....",
        "options": {"A": "1", "B": "3√3", "C": "(1/3)√3", "D": "√3", "E": "3"},
    },
    (4, 45): {
        "question": "66 2/3 % × (0,165 : 0,22) = ....",
    },
    (5, 41): {
        "question": "35% dari x adalah 42, sedangkan 5/6 dari y adalah 25. Berapakah nilai x + y?",
    },
    (5, 43): {
        "question": "Jika 1/3 : 3/5. Maka, hasilnya ....",
    },
    (5, 48): {
        "question": "1/3, 1, 5/6, 2, 1 1/2, 3, 2, 4, ..., 5",
        "options": {"A": "3", "B": "2", "C": "2 1/2", "D": "3 1/2", "E": "2 1/4"},
    },
    (6, 27): {
        "question": "Bacalah diagram perkembangan jumlah produksi buah-buahan di Kecamatan Jaya Makmur secara cermat! Pernyataan berikut yang sesuai dengan isi diagram di atas adalah dari tahun ke tahun ....",
    },
    (6, 43): {
        "question": "Bu Endang yang berusia x tahun melahirkan anaknya pada tahun ini. Berapa tahun lagi usia Bu Endang tiga kali usia anaknya?",
        "options": {"A": "x/3", "B": "x/2", "C": "2x/3", "D": "4x/3", "E": "3x/2"},
    },
    (6, 44): {
        "question": "Jika 4^x + 4^(-x) = 8 maka 8^x + 8^(-x) = ....",
    },
    (6, 45): {
        "question": "Nilai dari (0,25)^0,5 + (0,04)^(-0,5) = ....",
    },
    (6, 46): {
        "question": "(2^1 + 2^0 + 2^(-1)) / (2^(-2) + 2^(-3) + 2^(-4)) = ....",
    },
    (7, 26): {
        "options": {
            "A": "Jika (1), (2), dan (3) benar",
            "B": "Jika (1) dan (3) benar",
            "C": "Jika (2) dan (4) benar",
            "D": "Jika hanya (4) benar",
            "E": "Jika semua pernyataan benar",
        },
        "extra_stem": "\n(1) 2\n(2) 5\n(3) 9\n(4) 10",
    },
    (7, 27): {
        "options": {
            "A": "Jika (1), (2), dan (3) benar",
            "B": "Jika (1) dan (3) benar",
            "C": "Jika (2) dan (4) benar",
            "D": "Jika hanya (4) benar",
            "E": "Jika semua pernyataan benar",
        },
        "extra_stem": (
            "Teks berikut digunakan untuk menjawab soal nomor 26-28:\n"
            "Tabel Harga Eceran Daging Sapi di Jawa Tahun 2007-2010 (Rp/kg): "
            "2007 (Jatim 47.800, Jateng 46.900, DIY 47.400, Jabar 47.500); "
            "2008 (Jatim 49.800, Jateng 47.800, DIY 48.600, Jabar 48.800); "
            "2009 (Jatim 59.600, Jateng 59.700, DIY 50.500, Jabar 50.800); "
            "2010 (Jatim 60.000, Jateng 62.500, DIY 61.100, Jabar 61.600).\n\n"
            "Pernyataan berikut yang paling sesuai dengan isi tabel tersebut adalah ...\n"
            "(1) Harga eceran daging sapi di Jawa Timur dan Jawa Tengah pada 2009 relatif sama.\n"
            "(2) Harga eceran daging sapi di Jawa Tengah terendah pada 2007, tetapi tertinggi pada 2010.\n"
            "(3) Kenaikan harga daging di Jawa Timur selama empat tahun lebih rendah daripada yang terjadi di Jawa Barat.\n"
            "(4) Kenaikan harga daging di DIY selama empat tahun lebih tinggi daripada yang terjadi di Jawa Timur."
        ),
    },
    (7, 28): {
        "options": {
            "A": "Jika (1), (2), dan (3) benar",
            "B": "Jika (1) dan (3) benar",
            "C": "Jika (2) dan (4) benar",
            "D": "Jika hanya (4) benar",
            "E": "Jika semua pernyataan benar",
        },
        "extra_stem": (
            "Komentar yang paling tepat dengan isi teks di atas adalah ....\n"
            "(1) Untuk meningkatkan produksi daging sapi, peningkatan kualitas dan kuantitas peternakan sapi perlu dilakukan.\n"
            "(2) Untuk meningkatkan kesejahteraan peternak sapi, perlu diberikan subsidi meskipun harga daging sapi selalu naik pada hari raya agama.\n"
            "(3) Agar terjadi stabilitas harga daging sapi di pasaran, diperlukan pengendalian harga oleh pemerintah.\n"
            "(4) Agar kebutuhan daging sapi pada hari raya keagamaan terpenuhi, diperlukan mendatangkan sapi nonlokal."
        ),
    },
    (7, 46): {
        "question": "0,04 : (4 / 0,5) = ....",
    },
    (7, 47): {
        "question": "1/3, 2, 3/5, 4, 5/7, 6, ...",
        "options": {"A": "7/8", "B": "7/9", "C": "8/9", "D": "6/8", "E": "6/7"},
    },
    (8, 44): {
        "question": "Berapakah nilai 6/7 dari 87,5%?",
    },
    (8, 45): {
        "question": "2 1/4 : 4/11 = ....",
        "options": {"A": "6 1/2", "B": "6 3/4", "C": "6 1/4", "D": "36/44", "E": "99/16"},
    },
    (8, 46): {
        "question": "33,25^2 - 23,75^2 = ....",
    },
    (9, 44): {
        "question": "((5,74 × 63) + (5,74 × 37)) / (7,87^2 - 2,13^2) = ...",
        "options": {"A": "1", "B": "10", "C": "20", "D": "30", "E": "100"},
    },
    (9, 45): {
        "question": "(65,52^2 / 2,34^2) : (√48 / √27) = ...",
    },
}

# Verified full-width Pembahasan overrides (tables + exact keys)
PMB_KEY_OVERRIDES: dict[tuple[int, int], tuple[str, str]] = {
    (4, 3): ("D", "Ideologi Pancasila melindungi seluruh agama di seluruh wilayah tumpah darah Indonesia sebagaimana tersebut dalam Pasal 29 ayat (2) UUD 1945 memberikan kebebasan kepada seluruh warga negara untuk memeluk agama dan menjalankan ibadah sesuai dengan keimanan dan ketakwaan masing-masing. Negara kebangsaan yang berketuhanan Yang Maha Esa adalah negara yang merupakan penjelmaan dari hakikat kodrat manusia sebagai makhluk Tuhan Yang Maha Esa. Jawaban: D."),
    (4, 4): ("A", "Perbandingan ideologi Pancasila dengan ideologi liberalisme: Demokrasi Pancasila vs Demokrasi liberal; Hukum untuk menjunjung tinggi keadilan serta keberadaan individu dan masyarakat vs Hukum untuk melindungi individu; Peran negara agar tidak terjadi monopoli vs Swasta mendominasi; Agama menjiwai kehidupan vs Agama urusan pribadi. Jawaban: A."),
    (6, 56): ("D", "Berdasarkan diagram/arah pada pembahasan: Pinto berada di Timur Laut Ankur. Jawaban: D."),
    (6, 57): ("A", "Jarak total = 25 + 40 + 60 + 90 = 215 m. Jawaban: A."),
    (6, 58): ("C", "Tiga karyawan perokok seharusnya ditempatkan di ruang nomor 1, 2, 3 dan tidak langsung bersebelahan dengan Bu Heni yang alergi rokok. Jawaban: C."),
    (6, 59): ("E", "Ruang kerja yang paling jauh dari ruang kerja Pak Bono adalah ruang kerja Pak Dedi. Hal itu karena Pak Bono berdekatan dengan Pak Mara untuk mempermudah koordinasi dan Pak Dedi berada di ujung ruangan karena tidak suka mendengar suara-suara. Jawaban: E."),
    (10, 56): ("A", "Berdasarkan tabel perolehan suara (Calon A = 50, B = 35, C = 35, D = 45, E = 30): Suara terbanyak diraih calon A dengan jumlah suara 50 pada 2 program kerjanya. Jawaban: A."),
    (10, 57): ("E", "Suara paling sedikit diraih calon E yang hanya mengusung 1 program kerja (30 suara). Jawaban: E."),
    (10, 58): ("C", "A dan B memiliki perbedaan suara sebanyak 15 suara karena A = 50 suara dan B = 35 suara. Jawaban: C."),
    (10, 59): ("A", "Urutan perolehan tiga suara terbanyak dari hasil suara A(50), D(45), B(35)/C(35): ADB atau ADC. Jawaban: A."),
}


def norm_text(s: str) -> str:
    s = s.translate(CYR_MAP).replace("__QMARK__", "")
    return re.sub(r"[ \t]+", " ", s).strip()


def load_pages() -> dict[int, dict]:
    files = sorted(OCR_V2_DIR.glob("page-*.json"))
    if not files:
        raise RuntimeError(f"OCR directory not found or empty: {OCR_V2_DIR}")
    return {
        int(re.search(r"page-(\d+)", f.name).group(1)): json.loads(f.read_text(encoding="utf-8"))
        for f in files
    }


def build_tkp_templates(p199: dict) -> dict[str, list[float]]:
    t0, t1 = p199["tables"][0], p199["tables"][1]
    raw_samples = {
        "3": [t0["rows"][0]["rightSig"], t1["rows"][2]["rightSig"]],
        "2": [t0["rows"][1]["rightSig"], t1["rows"][0]["rightSig"]],
        "4": [t0["rows"][2]["rightSig"], t1["rows"][1]["rightSig"]],
        "5": [t0["rows"][3]["rightSig"], t1["rows"][3]["rightSig"]],
        "1": [t0["rows"][4]["rightSig"], t1["rows"][4]["rightSig"]],
    }
    return {
        k: [sum(v[i] for v in vecs) / len(vecs) for i in range(len(vecs[0]))]
        for k, vecs in raw_samples.items()
    }


def classify_sig(sig: list[int], templates: dict[str, list[float]]) -> tuple[int, float, float]:
    if not sig:
        return 0, 999.0, 0.0
    dists = sorted(
        (math.sqrt(sum((sig[i] - tmpl[i]) ** 2 for i in range(len(sig))) / len(sig)), int(digit))
        for digit, tmpl in templates.items()
    )
    return dists[0][1], dists[0][0], dists[1][0] - dists[0][0]


def page_to_lines(p: dict, cut_y: float = 0.0, use_full_after: float | None = None) -> list[dict]:
    """Order 2-column blocks (L then R), injecting margin markers and respecting x-gutter bounds."""
    gutter_x = p["xSplitNorm"]

    def extract_blocks(blks: list[dict], col_name: str) -> list[dict]:
        items = []
        for b in blks:
            if b["y"] < cut_y:
                continue
            item = dict(b)
            item["text"] = norm_text(b["text"])
            items.append(item)
        for m in p.get("marginMarkers", []):
            if m["col"] != col_name or m["yNorm"] < cut_y:
                continue
            mt = re.match(r"^(\d{1,3})\.", norm_text(m["stripText"]))
            txt_mark = (mt.group(1) + ".") if mt else "__QMARK__"
            mx = 0.115 if col_name == "L" else gutter_x + 0.002
            items.append({"text": txt_mark, "x": mx, "y": m["yNorm"], "w": 0.02, "h": 0.015, "conf": 1.0})

        items.sort(key=lambda b: b["y"])
        lines, cur = [], []
        for b in items:
            if cur and abs(b["y"] - cur[0]["y"]) <= 0.0088:
                cur.append(b)
            else:
                if cur:
                    lines.append(cur)
                cur = [b]
        if cur:
            lines.append(cur)

        out = []
        for ln in lines:
            ln.sort(key=lambda b: b["x"])
            txt = " ".join(b["text"] for b in ln).strip()
            if not txt:
                continue
            out.append({
                "y": ln[0]["y"],
                "x": ln[0]["x"],
                "col": col_name,
                "gutter": gutter_x,
                "file": p["file"],
                "text": txt,
            })
        return out

    if use_full_after is not None:
        # Handle mixed full-width + 2-col pages accurately:
        # tuple (y_start_fw, y_end_fw) gives the exact vertical band that spans full width
        if isinstance(use_full_after, tuple):
            y0_fw, y1_fw = use_full_after
            res = []
            res.extend(extract_blocks([b for b in p["leftBlocks"] if b["y"] < y0_fw], "L"))
            res.extend(extract_blocks([b for b in p["rightBlocks"] if b["y"] < y0_fw], "R"))
            res.extend(extract_blocks([b for b in p["fullBlocks"] if y0_fw <= b["y"] <= y1_fw], "FULL"))
            res.extend(extract_blocks([b for b in p["leftBlocks"] if b["y"] > y1_fw], "L"))
            res.extend(extract_blocks([b for b in p["rightBlocks"] if b["y"] > y1_fw], "R"))
            return res
        res = []
        res.extend(extract_blocks([b for b in p["leftBlocks"] if b["y"] < use_full_after], "L"))
        res.extend(extract_blocks([b for b in p["rightBlocks"] if b["y"] < use_full_after], "R"))
        res.extend(extract_blocks([b for b in p["fullBlocks"] if b["y"] >= use_full_after], "FULL"))
        return res

    return extract_blocks(p["leftBlocks"], "L") + extract_blocks(p["rightBlocks"], "R")


def is_in_number_gutter(line: dict) -> bool:
    col = line["col"]
    x = line["x"]
    g = line["gutter"]
    if col == "L":
        return x < 0.155
    if col == "R":
        return (g - 0.015) <= x < (g + 0.055)
    return x < 0.155


def is_at_option_indent(line: dict) -> bool:
    col = line["col"]
    x = line["x"]
    g = line["gutter"]
    if col == "L":
        return 0.158 <= x <= 0.198
    if col == "R":
        return (g + 0.045) <= x <= (g + 0.095)
    return 0.158 <= x <= 0.210


def infer_subtopic(category: str, text: str) -> tuple[str, str, str]:
    low = text.lower()
    if category == "TWK":
        if any(k in low for k in ["pancasila", "sila ", "ideologi", "bpupki", "ppki", "piagam jakarta", "sutasoma"]):
            return "Pancasila & Ideologi", "https://kerjago.id/skd-cpns/twk/pancasila", "KerjaGo: Modul TWK Pancasila"
        if any(k in low for k in ["uud", "pasal", "amandemen", "amendemen", "mpr", "dpr", "dpd", "presiden", "mahkamah", "konstitusi"]):
            return "UUD 1945 & Ketatanegaraan", "https://kerjago.id/skd-cpns/twk/uud-1945", "KerjaGo: Modul TWK UUD 1945"
        if any(k in low for k in ["bhinneka", "suku", "budaya", "agama", "adat", "toleransi", "integrasi", "nkri"]):
            return "Bhinneka Tunggal Ika & NKRI", "https://kerjago.id/skd-cpns/twk/bhinneka-tunggal-ika", "KerjaGo: Modul TWK Bhinneka Tunggal Ika"
        if any(k in low for k in ["proklamasi", "soekarno", "hatta", "budi utomo", "sumpah pemuda", "asean", "pbb", "kaa", "perjanjian", "sejarah", "belanda", "jepang"]):
            return "Sejarah Perjuangan & Politik Luar Negeri", "https://kerjago.id/skd-cpns/twk/nasionalisme", "KerjaGo: Modul TWK Nasionalisme"
        if any(k in low for k in ["paragraf", "kalimat", "ejaan", "kutipan", "daftar pustaka", "gagasan utama", "simpulan", "tabel", "diagram"]):
            return "Bahasa Indonesia & Literasi", "https://kerjago.id/skd-cpns/twk/bahasa-indonesia", "KerjaGo: Modul TWK Bahasa Indonesia"
        return "Wawasan Kebangsaan & Bela Negara", "https://kerjago.id/skd-cpns/twk", "KerjaGo: Panduan Belajar TWK"
    if category == "TIU":
        if re.search(r"(=|\><|> <|:\s*\.\.\.)", text) and len(text) < 140:
            return "Verbal (Sinonim, Antonim & Analogi)", "https://kerjago.id/skd-cpns/tiu/kemampuan-verbal", "KerjaGo: Modul TIU Kemampuan Verbal"
        if any(k in low for k in ["semua ", "sebagian ", "beberapa ", "maka,", "jadi,", "negasi", "tidak semua"]):
            return "Silogisme & Penalaran Logis", "https://kerjago.id/skd-cpns/tiu/silogisme", "KerjaGo: Modul TIU Silogisme"
        if any(k in low for k in ["urutan", "kursi", "meja", "kamar", "krayon", "jadwal", "parkir", "berlawanan", "kubus"]):
            return "Penalaran Analitis", "https://kerjago.id/skd-cpns/tiu/penalaran-analitis", "KerjaGo: Modul TIU Penalaran Analitis"
        if re.search(r"\b\d+\s+\d+\s+\d+", text) or "..." in text and len(text) < 120:
            return "Deret Angka & Huruf", "https://kerjago.id/skd-cpns/tiu/deret-angka", "KerjaGo: Modul TIU Deret Angka"
        return "Numerik & Berhitung Cepat", "https://kerjago.id/skd-cpns/tiu/kemampuan-numerik", "KerjaGo: Modul TIU Kemampuan Numerik"
    if any(k in low for k in ["pimpinan", "pemimpin", "atasan", "anak buah", "mendelegasikan", "keputusan"]):
        return "Kepemimpinan & Profesionalisme", "https://kerjago.id/skd-cpns/tkp/profesionalisme", "KerjaGo: Modul TKP Profesionalisme"
    if any(k in low for k in ["pelanggan", "tamu", "melayani", "masyarakat", "antrian", "formulir"]):
        return "Pelayanan Publik", "https://kerjago.id/skd-cpns/tkp/pelayanan-publik", "KerjaGo: Modul TKP Pelayanan Publik"
    if any(k in low for k in ["tim", "kelompok", "rekan kerja", "bekerja sama", "relasi", "musyawarah"]):
        return "Jejaring Kerja & Kerja Sama", "https://kerjago.id/skd-cpns/tkp/jejaring-kerja", "KerjaGo: Modul TKP Jejaring Kerja"
    if any(k in low for k in ["suap", "absensi", "curang", "aturan", "rahasia", "korupsi", "tanggung jawab"]):
        return "Integritas & Etika Kerja", "https://kerjago.id/skd-cpns/tkp/anti-radikalisme", "KerjaGo: Modul TKP Integritas & Sosial"
    return "Adaptabilitas & Inovasi Kerja", "https://kerjago.id/skd-cpns/tkp/sosial-budaya", "KerjaGo: Modul TKP Sosial Budaya & TIK"


def parse_soal_paket(pk: int, s0: int, s1: int, pages_by_no: dict[int, dict]) -> dict[int, dict]:
    soal_lines: list[dict] = []
    for pn in range(s0, s1 + 1):
        # Full-width layout bands detected visually on Soal pages
        fw_map = {
            240: (0.08, 0.56),
            268: (0.08, 0.40),
            269: (0.565, 1.0),
            272: (0.08, 1.0),
            274: (0.415, 1.0),
            339: (0.08, 1.0),
            371: (0.08, 1.0),
        }
        soal_lines.extend(page_to_lines(pages_by_no[pn], 0.34 if pn == s0 else 0.0, use_full_after=fw_map.get(pn)))

    expected_q = 1
    q_records: dict[int, dict] = {}
    cur_q: int | None = None
    cur_cat = "TWK"

    # Also capture shared reading passages attached before Q56/Q59 or Q26/Q29
    pending_stimulus_lines: list[str] = []
    shared_stimuli: list[tuple[int, int, str]] = [] # (q_start, q_end, text)
    collecting_stimulus: dict[str, Any] | None = None

    for l in soal_lines:
        raw_txt = l["text"]
        had_qmark = "__QMARK__" in raw_txt
        txt = re.sub(r"(?:^|\s)__QMARK__(?:\s|$)", " ", raw_txt).strip()
        txt = re.sub(r"^__QMARK__\s*", "", txt).strip()
        if not txt:
            continue
        up = txt.upper()
        if "TES WAWASAN KEBANGSAAN" in up:
            cur_cat = "TWK"
            collecting_stimulus = None
            continue
        if "TES INTELEGENSIA UMUM" in up or "TES INTELIGENSIA UMUM" in up:
            cur_cat = "TIU"
            collecting_stimulus = None
            continue
        if "TES KARAKTERISTIK PRIBADI" in up:
            cur_cat = "TKP"
            collecting_stimulus = None
            continue

        # Detect shared passage header: "Teks berikut digunakan untuk menjawab soal/pertanyaan nomor 56-58."
        if re.search(r"Teks\s+berikut\s+digunakan\s+untuk\s+menjawab", txt, re.I):
            clean_hdr = txt.replace("__QMARK__", "").strip()
            collecting_stimulus = {"header": clean_hdr, "lines": [], "q_start": None, "q_end": None}
            m_rng = re.search(r"nomor\s*(\d+)\s*[-–\s]+\s*(\d+)", clean_hdr, re.I)
            if m_rng:
                collecting_stimulus["q_start"] = int(m_rng.group(1))
                collecting_stimulus["q_end"] = int(m_rng.group(2))
            continue

        m = re.match(r"^(\d{1,3})\.(?:\s*(.*))?$", txt)
        if m and (is_in_number_gutter(l) or txt.startswith(f"{expected_q}.")):
            qn = int(m.group(1))
            if (
                qn == expected_q
                or (cur_q is not None and qn == cur_q and len(q_records[cur_q]["opts"]) >= 5)
                or (cur_q is not None and cur_q < qn <= expected_q + 2 and qn <= 100 and len(q_records[cur_q]["opts"]) >= 4)
            ):
                if cur_q is not None and qn == cur_q:
                    qn = expected_q
                if collecting_stimulus is not None:
                    qs = collecting_stimulus["q_start"] or qn
                    qe = collecting_stimulus["q_end"] or min(qs + 2, 60 if qs <= 60 else 100)
                    if qs <= 60:
                        qe = min(qe, 60)
                    stim_txt = collecting_stimulus["header"] + "\n" + "\n".join(collecting_stimulus["lines"])
                    shared_stimuli.append((qs, qe, stim_txt.replace("__QMARK__", "").strip()))
                    collecting_stimulus = None
                cur_q = qn
                expected_q = qn + 1
                q_records[cur_q] = {"cat": cur_cat, "lines": [], "opts": [], "file": l["file"], "col": l["col"]}
                rest = (m.group(2) or "").strip()
                if rest:
                    om0 = re.match(r"^([A-E])\.\s*(.*)$", rest)
                    if om0:
                        q_records[cur_q]["opts"].append((om0.group(1), om0.group(2).strip()))
                    else:
                        q_records[cur_q]["lines"].append(rest)
                continue

        if had_qmark and expected_q <= 100 and (cur_q is None or len(q_records[cur_q]["opts"]) >= 5):
            if collecting_stimulus is not None:
                qs = collecting_stimulus["q_start"] or expected_q
                qe = collecting_stimulus["q_end"] or min(qs + 2, 60 if qs <= 60 else 100)
                if qs <= 60:
                    qe = min(qe, 60)
                stim_txt = collecting_stimulus["header"] + "\n" + "\n".join(collecting_stimulus["lines"])
                shared_stimuli.append((qs, qe, stim_txt.strip()))
                collecting_stimulus = None
            cur_q = expected_q
            expected_q += 1
            q_records[cur_q] = {"cat": cur_cat, "lines": [], "opts": [], "file": l["file"], "col": l["col"]}
            om0 = re.match(r"^([A-E])\.\s*(.*)$", txt)
            if om0:
                q_records[cur_q]["opts"].append((om0.group(1), om0.group(2).strip()))
            else:
                q_records[cur_q]["lines"].append(txt)
            continue

        if collecting_stimulus is not None:
            m_rng = re.search(r"nomor\s*(\d+)\s*[-–\s]+\s*(\d+)", txt, re.I)
            if m_rng and not collecting_stimulus["q_start"]:
                collecting_stimulus["header"] = (collecting_stimulus["header"] + " " + txt.replace("__QMARK__", "")).strip()
                collecting_stimulus["q_start"] = int(m_rng.group(1))
                collecting_stimulus["q_end"] = int(m_rng.group(2))
            else:
                collecting_stimulus["lines"].append(txt.replace("__QMARK__", "").strip())
            continue

        if cur_q is None:
            continue

        opts = q_records[cur_q]["opts"]
        have = [o[0] for o in opts]

        # Option matching: strict so prose never creates out-of-order options
        om = re.match(r"^([A-E])\.(?:\s*(.*))?$", txt)
        if om:
            let = om.group(1)
            expected_let = "ABCDE"[len(have)] if len(have) < 5 else None
            if len(have) == 0 and let != "A":
                om = None
            elif len(have) >= 5 or let in have:
                om = None
            elif expected_let and let != expected_let and not is_at_option_indent(l):
                om = None
        if not om and len(have) < 5:
            expected_let = "ABCDE"[len(have)]
            om_nodot = re.match(r"^([A-E])\s+([A-Z0-9Rp(√\"'-].*)$", txt)
            if om_nodot and om_nodot.group(1) == expected_let and is_at_option_indent(l):
                om = om_nodot
            elif expected_let == "E" and re.match(r"^[LtfeI]\.\s*(.*)$", txt) and is_at_option_indent(l):
                opts.append(("E", re.sub(r"^[LtfeI]\.\s*", "", txt).strip()))
                continue
            elif re.match(r"^[•+\-]\.\s*(.*)$", txt) and is_at_option_indent(l):
                opts.append((expected_let, re.sub(r"^[•+\-]\.\s*", "", txt).strip()))
                continue
            elif re.match(rf"^{expected_let.lower()}\.\s*(.*)$", txt) and is_at_option_indent(l):
                opts.append((expected_let, re.sub(r"^[a-e]\.\s*", "", txt).strip()))
                continue

        if om:
            body = (om.group(2) or "").strip()
            let = om.group(1)
            if len(have) < 4:
                next_let = "ABCDE"[len(have) + 1]
                m_in = re.match(rf"^(.+?[\.\!\?]?)\s+{next_let}\.\s+(.+)$", body)
                if m_in:
                    opts.append((let, m_in.group(1).strip()))
                    opts.append((next_let, m_in.group(2).strip()))
                    continue
            opts.append((let, body))
        else:
            # Handle inline next option merged onto the end of a line (e.g., "... menggantikan. E. Mencarikan ...")
            split_inline = None
            if opts and len(have) < 5:
                next_let = "ABCDE"[len(have)]
                split_inline = re.match(rf"^(.+?)\s+{next_let}\.\s+(.+)$", txt)
            if split_inline:
                prev_part, next_body = split_inline.group(1).strip(), split_inline.group(2).strip()
                k0, v0 = opts[-1]
                opts[-1] = (k0, (v0 + " " + prev_part).strip())
                opts.append(("ABCDE"[len(have)], next_body))
            elif opts:
                k0, v0 = opts[-1]
                if v0.endswith("-"):
                    opts[-1] = (k0, v0[:-1] + txt)
                else:
                    # Also handle inline next option glued onto previous option string after concatenation
                    combined = (v0 + " " + txt).strip()
                    next_let = "ABCDE"[len(have)] if len(have) < 5 else None
                    m_tail = re.match(rf"^(.+?[\.\!\?])\s+{next_let}\.\s+(.+)$", combined) if next_let else None
                    if m_tail:
                        opts[-1] = (k0, m_tail.group(1).strip())
                        opts.append((next_let, m_tail.group(2).strip()))
                    else:
                        opts[-1] = (k0, combined)
            else:
                q_records[cur_q]["lines"].append(txt)

    # Apply shared stimuli to matching questions
    for qs, qe, stim_txt in shared_stimuli:
        for qn in range(qs, qe + 1):
            if qn in q_records:
                q_records[qn]["stimulus"] = stim_txt

    # Finalize strings + apply visual/math overrides
    for qn, rec in q_records.items():
        stem = " ".join(rec["lines"]).replace("- ", "")
        # Clean leading "A." etc. if empty stem on Verbal Odd-One-Out Q38-40
        if not stem.strip() and len(rec["opts"]) == 5:
            stem = "Tentukan satu pilihan yang tidak sekelompok dengan empat pilihan lainnya."
        if rec.get("stimulus") and rec["stimulus"] not in stem:
            stem = rec["stimulus"] + "\n\n" + stem

        opt_map = {k: v for k, v in rec["opts"]}
        ov = QUESTION_OVERRIDES.get((pk, qn), {})
        if "question" in ov:
            stem = ov["question"]
        if "extra_stem" in ov:
            stem = (stem + "\n" + ov["extra_stem"]).strip() if (pk, qn) == (7, 26) else ov["extra_stem"]
        if "options" in ov:
            for ok, oval in ov["options"].items():
                opt_map[ok] = oval
        if (pk, qn) in FIGURE_OVERRIDES:
            rec["figureUrl"] = FIGURE_OVERRIDES[(pk, qn)]

        rec["stem"] = re.sub(r"\s+", " ", stem).strip() if "\n" not in stem else "\n".join(re.sub(r"[ \t]+", " ", ln).strip() for ln in stem.splitlines())
        rec["opt_map"] = opt_map

    return q_records


def parse_pembahasan_paket(
    pk: int, p0: int, p1: int, pages_by_no: dict[int, dict], templates: dict[str, list[float]]
) -> tuple[dict[int, dict], dict[int, dict]]:
    pmb_lines: list[dict] = []
    pmb_tables: list[dict] = []

    for pn in range(p0, p1 + 1):
        p = pages_by_no[pn]
        cut_y = 0.28 if pn == p0 else 0.0
        use_full = 0.25 if pn == 359 else (0.10 if pn == 482 else None)
        pmb_lines.extend(page_to_lines(p, cut_y, use_full_after=use_full))
        for t in p["tables"]:
            rows = t["rows"]
            if rows and "pilihan" in norm_text(rows[0]["leftText"]).lower():
                rows = rows[1:]
                has_hdr = True
            else:
                has_hdr = t["hasHeader"]
            if not has_hdr and pmb_tables and len(pmb_tables[-1]["rows"]) + len(rows) == 5:
                pmb_tables[-1]["rows"].extend(rows)
            else:
                pmb_tables.append({"file": p["file"], "rows": list(rows)})

    # 1..60 Pembahasan (TWK + TIU)
    pmb_1_60: dict[int, dict] = {}
    cur_q: int | None = None
    exp_q = 1
    in_tkp = False
    tkp_lines: list[dict] = []

    for l in pmb_lines:
        txt = l["text"]
        if "TES KARAKTERISTIK PRIBADI" in txt.upper():
            in_tkp = True
            continue
        if in_tkp:
            tkp_lines.append(l)
            continue

        m = re.match(r"^(\d{1,2})\.(?:\s*(.*))?$", txt)
        if m and is_in_number_gutter(l):
            qn = int(m.group(1))
            can_advance = (cur_q is None) or (pmb_1_60[cur_q]["jaw"] is not None) or (qn == cur_q + 1 and is_in_number_gutter(l))
            if can_advance and (qn == exp_q or (qn <= 60 and (cur_q is None or cur_q < qn <= exp_q + 2))):
                cur_q = qn
                exp_q = qn + 1
                pmb_1_60[cur_q] = {"lines": [(m.group(2) or "").strip()], "jaw": None}
                continue
        if txt.startswith("__QMARK__") and exp_q <= 60:
            rest = txt.replace("__QMARK__", "", 1).strip()
            if cur_q is None or pmb_1_60[cur_q]["jaw"] is not None:
                cur_q = exp_q
                exp_q += 1
                pmb_1_60[cur_q] = {"lines": [rest], "jaw": None}
                continue
            txt = rest

        if cur_q is not None:
            pmb_1_60[cur_q]["lines"].append(txt)
            jm = re.search(r"J[ae]w[ae]b[ae]n\s*[:;.]?\s*([A-E])\b", txt, re.I)
            if jm:
                pmb_1_60[cur_q]["jaw"] = jm.group(1).upper()

    for qn in range(1, 61):
        if (pk, qn) in PMB_KEY_OVERRIDES:
            ans, exp_txt = PMB_KEY_OVERRIDES[(pk, qn)]
            pmb_1_60[qn] = {"jaw": ans, "lines": [exp_txt]}

    # 61..100 Pembahasan (TKP descriptions + 40 validated TKP tables)
    # Filter only genuine TKP tables (5 rows with clear digit classification margin)
    valid_tkp_tables: list[dict[str, int]] = []
    for mt in pmb_tables:
        if len(mt["rows"]) != 5:
            continue
        preds = [classify_sig(r["rightSig"], templates) for r in mt["rows"]]
        digits = [p[0] for p in preds]
        min_margin = min(p[2] for p in preds)
        # Skip non-TKP tables (e.g. TWK comparison tables) whose cells are multi-word prose (low margin < 8)
        if min_margin >= 8.0 and all(1 <= d <= 5 for d in digits):
            scores = {k: d for k, d in zip("ABCDE", digits)}
            valid_tkp_tables.append(scores)

    # Extract TKP text descriptions 61..100 sequentially
    tkp_desc: dict[int, list[str]] = {}
    cur_tq: int | None = None
    exp_tq = 61
    for l in tkp_lines:
        txt = l["text"]
        if any(x in txt for x in ["Pilihan Jawaban", "Poin Nilai"]) or re.match(r"^[A-E]$", txt) or re.match(r"^[1-5]$", txt):
            continue
        m = re.match(r"^(\d{2,3})\.(?:\s*(.*))?$", txt)
        if m and is_in_number_gutter(l):
            qn = int(m.group(1))
            if 61 <= qn <= 100 and (cur_tq is None or qn > cur_tq):
                cur_tq = qn
                exp_tq = qn + 1
                tkp_desc[cur_tq] = [(m.group(2) or "").strip()]
                continue
        if txt.startswith("__QMARK__") and exp_tq <= 100:
            cur_tq = exp_tq
            exp_tq += 1
            tkp_desc[cur_tq] = [txt.replace("__QMARK__", "", 1).strip()]
            continue
        if cur_tq is not None:
            tkp_desc[cur_tq].append(txt)

    pmb_61_100: dict[int, dict] = {}
    assert len(valid_tkp_tables) == 40, f"Paket {pk} expected 40 TKP tables, got {len(valid_tkp_tables)}"
    for idx in range(40):
        qn = 61 + idx
        scores = valid_tkp_tables[idx]
        best_opt = max("ABCDE", key=lambda k: scores[k])
        order_str = " > ".join(f"{k}({scores[k]})" for k in sorted("ABCDE", key=lambda x: (-scores[x], x)))
        desc = " ".join(x for x in tkp_desc.get(qn, []) if x).strip()
        exp_full = f"{desc}\nUrutan nilai TKP: {order_str}".strip() if desc else f"Urutan nilai TKP: {order_str}"
        pmb_61_100[qn] = {"scores": scores, "best": best_opt, "explanation": exp_full}

    return pmb_1_60, pmb_61_100


def extract_modul_resmi_packages() -> list[dict]:
    pages_by_no = load_pages()
    templates = build_tkp_templates(pages_by_no[199])

    packages = []
    for pk, s0, s1, p0, p1 in PAKETS:
        q_records = parse_soal_paket(pk, s0, s1, pages_by_no)
        pmb_1_60, pmb_61_100 = parse_pembahasan_paket(pk, p0, p1, pages_by_no, templates)

        questions = []
        for qn in range(1, 101):
            rec = q_records.get(qn)
            if not rec:
                raise RuntimeError(f"Missing P{pk} Q{qn}")
            cat = "TWK" if qn <= 30 else ("TIU" if qn <= 60 else "TKP")
            stem = rec["stem"]
            if not stem:
                raise RuntimeError(f"Empty stem P{pk} Q{qn}")

            opt_map = rec["opt_map"]
            missing_opts = [k for k in "ABCDE" if not opt_map.get(k)]
            if missing_opts:
                raise RuntimeError(f"Missing/empty options {missing_opts} on P{pk} Q{qn} ({rec['file']} {rec['col']}) -> {opt_map}")

            subtopic, study_url, study_label = infer_subtopic(cat, stem)

            if cat in ("TWK", "TIU"):
                pinfo = pmb_1_60.get(qn)
                if not pinfo or not pinfo["jaw"]:
                    raise RuntimeError(f"Missing key on P{pk} Q{qn}")
                ans = pinfo["jaw"]
                explanation = "\n".join(ln for ln in pinfo["lines"] if ln).strip()
                explanation = re.sub(r"\n?Jawaban\s*[:;.]?\s*[A-E]\.?\s*$", "", explanation, flags=re.I).strip()
                explanation = f"{explanation}\n\nJawaban: {ans}" if explanation else f"Jawaban: {ans}"
                options = [{"key": k, "text": opt_map[k], "score": 5 if k == ans else 0} for k in "ABCDE"]
            else:
                tinfo = pmb_61_100[qn]
                ans = tinfo["best"]
                explanation = tinfo["explanation"]
                options = [{"key": k, "text": opt_map[k], "score": tinfo["scores"][k]} for k in "ABCDE"]

            q_obj: dict[str, Any] = {
                "id": f"modul2024-p{pk}-{qn:03d}",
                "number": qn,
                "category": cat,
                "subtopic": subtopic,
                "question": stem.replace("__QMARK__", "").strip(),
                "options": options,
                "correctOption": ans,
                "explanation": explanation.replace("__QMARK__", "").strip(),
                "sourceTitle": f"{SOURCE_TITLE_CLEAN} - Paket {pk:02d}",
                "sourceUrl": SOURCE_URL,
                "studyUrl": study_url,
                "studyLabel": study_label,
            }
            if rec.get("figureUrl"):
                q_obj["figureUrl"] = rec["figureUrl"]
            questions.append(q_obj)

        packages.append({
            "id": f"paket-modul-resmi-{pk:02d}",
            "title": f"Paket {pk + 4}: Tryout SKD CPNS Modul Resmi (Paket {pk:02d} Buku)",
            "description": f"100 soal CAT SKD Paket {pk:02d} (30 TWK, 30 TIU, 40 TKP, 90 menit) dari buku Modul Resmi SKD + SKB CPNS 2024-2025.",
            "durationMinutes": 90,
            "sourceTitle": f"{SOURCE_TITLE_CLEAN} - Paket {pk:02d}",
            "sourceUrl": SOURCE_URL,
            "questions": questions,
        })
        print(f"Verified Modul Resmi Paket {pk:02d}: 100/100 questions OK (30 TWK, 30 TIU, 40 TKP)")

    return packages


if __name__ == "__main__":
    pkgs = extract_modul_resmi_packages()
    print(f"\nALL {len(pkgs)} PACKAGES VERIFIED ({sum(len(p['questions']) for p in pkgs)} total questions)!")

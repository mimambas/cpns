#!/usr/bin/env python3
"""Extract real SKD CPNS question packages from Google Drive source files."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache" / "sources"
OUT_JSON = ROOT / "src" / "data" / "questions.json"

LOLOSASN_SOURCE_URL = (
    "https://drive.google.com/file/d/1B74f7u1ul_4jIvn1nmtvnMuCr4fp3m5d/view"
)
CPNS2024_SOURCE_URL = (
    "https://drive.google.com/file/d/1JK0AJgnLxIUq4uTZ96xmYR3Ht9qhd4Rf/view"
)
YOUTUBE_FIGURAL_URL = "https://youtu.be/aCEH7JRLJDY?si=Sl_7cWjqoV1xDQb6"


def clean_whitespace(text: str) -> str:
    text = text.replace("\u00a0", " ").replace("\r", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def clean_inline(text: str) -> str:
    return " ".join(text.replace("\u00a0", " ").split())


def infer_study_link(category: str, text: str) -> tuple[str, str, str]:
    lower = text.lower()
    if category == "TWK":
        if any(k in lower for k in ["pancasila", "sila ", "butir", "piagam jakarta", "bpupki", "ppki"]):
            return (
                "Pilar Negara — Pancasila",
                "https://kerjago.id/materi-cpns/pancasila",
                "Materi Pancasila & 45 Butir (Kerjago)",
            )
        if any(k in lower for k in ["pembukaan uud", "alinea"]):
            return (
                "Pilar Negara — Pembukaan UUD 1945",
                "https://kerjago.id/materi-cpns/pembukaan-uud-1945",
                "Materi Pembukaan UUD 1945 (Kerjago)",
            )
        if any(k in lower for k in ["uud 1945", "pasal", "amandemen", "konstitusi", "uu", "hukum"]):
            return (
                "Pilar Negara — UUD 1945 & Konstitusi",
                "https://kerjago.id/materi-cpns/uud-1945",
                "Materi UUD 1945 Per Pasal (Kerjago)",
            )
        if any(k in lower for k in ["mpr", "dpr", "dpd", "presiden", "mahkamah", "bpk", "kpk", "lembaga", "komisi"]):
            return (
                "Sistem Tata Negara & Lembaga",
                "https://kerjago.id/materi-cpns/lembaga-negara",
                "Materi Lembaga Negara (Kerjago)",
            )
        if any(k in lower for k in ["asn", "integritas", "korupsi", "pegawai negeri", "pelayanan"]):
            return (
                "Integritas & Nilai Dasar ASN",
                "https://kerjago.id/materi-cpns/uu-asn",
                "Materi UU ASN No. 20/2023 (Kerjago)",
            )
        if any(k in lower for k in ["bahasa", "kata", "ejaan", "kalimat", "paragraf", "serapan", "kbbi"]):
            return (
                "Bahasa Negara (Bahasa Indonesia)",
                "https://kerjago.id/materi-cpns",
                "Ringkasan Materi CPNS (Kerjago)",
            )
        return (
            "Nasionalisme, Bela Negara & Sejarah",
            "https://kerjago.id/materi-cpns/sejarah",
            "Materi Sejarah Kebangsaan (Kerjago)",
        )

    if category == "TIU":
        if any(k in lower for k in ["gambar", "kubus", "pola"]):
            return (
                "TIU Figural — Deret & Ketidaksamaan Gambar",
                YOUTUBE_FIGURAL_URL,
                "Video Pembahasan TIU Figural (Ruang Tentor)",
            )
        if any(k in lower for k in ["sinonim", "antonim", "analogi", "paragraf", "simpulan", "topik", "teks"]):
            return (
                "TIU Verbal — Analogi, Sinonim & Penalaran",
                "https://kerjago.id/materi-cpns/tiu",
                "Rumus & Pola TIU (Kerjago)",
            )
        if any(k in lower for k in ["jika", "semua", "sebagian", "invers", "konvers", "kesimpulannya", "kamar", "tabungan", "lebih tinggi", "lebih banyak"]):
            return (
                "TIU Penalaran Logis & Analitis",
                "https://kerjago.id/materi-cpns/tiu",
                "Rumus & Pola TIU (Kerjago)",
            )
        return (
            "TIU Numerik — Deret, Berhitung & Soal Cerita",
            "https://kerjago.id/materi-cpns/tiu",
            "Rumus & Pola TIU (Kerjago)",
        )

    # TKP
    if any(k in lower for k in ["pelanggan", "masyarakat", "warga", "pasien", "pembeli", "layanan", "pelayanan", "puskesmas", "antre"]):
        return (
            "TKP — Pelayanan Publik",
            "https://kerjago.id/materi-cpns/tkp",
            "Aspek & Trik Skor 5 TKP (Kerjago)",
        )
    if any(k in lower for k in ["radikal", "toleran", "agama", "suku", "etnis", "teror", "hoaks", "berita bohong"]):
        return (
            "TKP — Anti Radikalisme & Sosial Budaya",
            "https://kerjago.id/materi-cpns/tkp",
            "Aspek & Trik Skor 5 TKP (Kerjago)",
        )
    if any(k in lower for k in ["aplikasi", "sistem", "teknologi", "komputer", "internet", "online", "digital", "media sosial", "zoom", "file", "presentation", "presentasi", "it "]):
        return (
            "TKP — Teknologi Informasi & Komunikasi",
            "https://kerjago.id/materi-cpns/tkp",
            "Aspek & Trik Skor 5 TKP (Kerjago)",
        )
    if any(k in lower for k in ["tim", "rekan", "divisi", "kerjasama", "rapat", "kelompok", "mutasi"]):
        return (
            "TKP — Jejaring Kerja & Sosial Budaya",
            "https://kerjago.id/materi-cpns/tkp",
            "Aspek & Trik Skor 5 TKP (Kerjago)",
        )
    return (
        "TKP — Profesionalisme",
        "https://kerjago.id/materi-cpns/tkp",
        "Aspek & Trik Skor 5 TKP (Kerjago)",
    )


def strip_page_numbers(pages: list[str]) -> str:
    cleaned_pages = []
    for p in pages:
        lines = [ln.strip() for ln in p.splitlines()]
        # Strip leading or trailing isolated page numbers / empty lines
        while lines and (not lines[0] or re.fullmatch(r"\d{1,3}", lines[0])):
            lines.pop(0)
        while lines and (not lines[-1] or re.fullmatch(r"\d{1,3}", lines[-1])):
            lines.pop()
        cleaned_pages.append("\n".join(lines))
    return "\n".join(cleaned_pages)


def parse_lolosasn() -> list[dict[str, Any]]:
    raw = (CACHE / "lolosasn_2023_layout.txt").read_text(encoding="utf-8")
    pages = raw.split("\x0c")
    text = strip_page_numbers(pages)

    # Remove section headers
    text = re.sub(r"^PEMBAHASAN TRYOUT PPPK 2023\s*$", "", text, flags=re.M)
    text = re.sub(r"^TES WAWASAN KEBANGSAAN\s*$", "", text, flags=re.M)
    text = re.sub(r"^TES INTELIGENSI UMUM\s*$", "", text, flags=re.M)
    text = re.sub(r"^TES KARATERISTIK PRIBADI\s*$", "", text, flags=re.M)

    # Preserve shared passage headers for Q61-63 and Q64-65
    passage_61_63 = (
        "Teks bacaan untuk soal nomor 61–63:\n"
        "Sekelompok mahasiswa mengadakan penelitian di desa. Mereka menginap di rumah warga yang "
        "kebetulan memiliki 6 kamar yang berderet. Reno ingin berada di sebelah kamar Ical, tapi tidak "
        "ingin bersebelahan dengan Danang. Danang ingin berada di kamar paling ujung. Wildan ingin "
        "kamarnya berada di antara kamar Oyon dan Sandy."
    )
    passage_64_65 = (
        "Teks bacaan untuk soal nomor 64–65:\n"
        "Uang tabungan Ipin lebih banyak dari uang tabungan Yadi. Uang tabungan Mutia tidak kalah "
        "banyak dari uang tabungan Ipin. Uang tabungan Halimah tidak sebanyak uang tabungan Mutia "
        "tapi lebih banyak dari uang tabungan Ipin. Uang tabungan Farhan lebih sedikit dari uang tabungan Yadi."
    )

    # Remove inline passage headers before 61 and 64 so they don't bleed into 60 / 63
    text = re.sub(
        r"Untuk menjawab soal nomor 61, 62, dan 63 perhatikan teks berikut\.[\s\S]*?(?=\n61\.)",
        "\n",
        text,
    )
    text = re.sub(
        r"Untuk menjawab soal nomor 64 dan 65 perhatikan teks berikut\.[\s\S]*?(?=\n64\.)",
        "\n",
        text,
    )

    # Fix typos in source text before regex splitting
    # Q15 has "D. 14 Agustus 1945 E.\n15 Agustus 1945"
    text = text.replace("D. 14 Agustus 1945 E.\n15 Agustus 1945", "D. 14 Agustus 1945\nE. 15 Agustus 1945")
    # Q20 has "... adalah A.\nIr. Soekarno"
    text = text.replace("sidang BPUPKI adalah A.\nIr. Soekarno", "sidang BPUPKI adalah ...\nA. Ir. Soekarno")
    # Q25/29/etc check any " A.\n" at end of line
    text = re.sub(r"\s+([A-E])\.\s*\n", r"\n\1. ", text)
    # Q48 has options printed above A., B., C., D., E. because of PDF text order
    q48_block_pattern = re.compile(r"\n48\.[\s\S]*?(?=\n49\.)")
    q48_replacement = (
        "\n48. 24, 12, 11, -6, -2, 3, ..., ....\n"
        "A. -17, 3\n"
        "B. -17, -1 1/2\n"
        "C. 15, 1/2\n"
        "D. -15, -1 1/2\n"
        "E. -12, 1/2\n"
        "Pembahasan:\n"
        "Konsep: Deret angka\n"
        "Pola selang-seling dua larik: suku ganjil dikurangi 13 (24 → 11 → -2 → -15), "
        "sedangkan suku genap dikali -1/2 (12 → -6 → 3 → -1 1/2). Jadi dua suku berikutnya adalah -15 dan -1 1/2.\n"
        "Jawaban: D\n"
    )
    text = q48_block_pattern.sub(q48_replacement, text)

    # Split into 110 question blocks
    matches = list(re.finditer(r"(?:^|\n)(\d{1,3})\.\s+", text))
    blocks: dict[int, str] = {}
    for i, m in enumerate(matches):
        num = int(m.group(1))
        if not (1 <= num <= 110):
            continue
        # Only take sequential question numbers (avoid numbered lists inside explanations)
        expected = len(blocks) + 1
        if num != expected:
            continue
        start = m.end()
        end = len(text)
        for j in range(i + 1, len(matches)):
            nxt = int(matches[j].group(1))
            if nxt == num + 1:
                end = matches[j].start()
                break
        blocks[num] = text[start:end].strip()

    assert len(blocks) == 110, f"LolosASN expected 110 blocks, got {len(blocks)}"

    # Known image-formula patches verified directly from rendered PDF pages 12-17
    patches: dict[int, dict[str, str]] = {
        46: {
            "question": "10, 5, 0, -4, -9, -14, -18, ..., ...",
            "explanation": (
                "Konsep: Deret angka\n"
                "Barisan tersebut mempunyai pola kelompok berulang dengan selisih -5, -5, -4 kemudian berulang: "
                "10 (-5) 5 (-5) 0 (-4) -4 (-5) -9 (-5) -14 (-4) -18 (-5) -23 (-5) -28. "
                "Jadi dua angka berikutnya adalah -23, -28."
            ),
        },
        47: {
            "question": "10 1/2, 48, 21, 24, 42, 12, ..., ...",
            "explanation": (
                "Konsep: Deret angka\n"
                "Pola dua larik selang-seling: suku ganjil dikali 2 (10 1/2 → 21 → 42 → 84), "
                "sedangkan suku genap dibagi 2 (48 → 24 → 12 → 6). Jadi hasilnya 84, 6."
            ),
        },
        49: {
            "explanation": (
                "Konsep: Deret huruf\n"
                "Pola tiga larik selang-seling, masing-masing maju +1 huruf: "
                "(E → F → G), (D → E → F), dan (A → B → C). Maka dua huruf berikutnya adalah F, C."
            ),
        },
        50: {
            "explanation": (
                "Konsep: Persen\n"
                "Persentase = (125 / 2.000) × 100% = 6,25%."
            ),
        },
        51: {
            "question": "Nilai dari perhitungan berikut adalah ...\n137² - 113² = ...",
            "explanation": (
                "Konsep: Aljabar\n"
                "Ingat identitas selisih kuadrat (a² - b²) = (a + b)(a - b).\n"
                "137² - 113² = (137 + 113)(137 - 113) = 250 × 24 = 6.000."
            ),
        },
        52: {
            "question": "Hasil dari penjumlahan berikut adalah ...\n15% dari 120 dan 33 1/3% dari 600",
            "explanation": (
                "Konsep: Persentase\n"
                "Ingat 33 1/3% = 1/3.\n"
                "(15% × 120) + (33 1/3% × 600) = (15/100 × 120) + (1/3 × 600) = 18 + 200 = 218."
            ),
        },
        53: {
            "explanation": (
                "Konsep: Aljabar\n"
                "Perkalian dikerjakan lebih dulu daripada penjumlahan: (99 × 9 × 11 × 0) + 1 = 0 + 1 = 1."
            ),
        },
        54: {
            "explanation": (
                "Konsep: Aritmetika sosial\n"
                "Biaya iklan 5 baris untuk hari ke-1 = 1.500 × 5 = Rp7.500,00. "
                "Untuk 5 hari berikutnya = 1.000 × 5 = Rp5.000,00 per hari. "
                "Dalam modul sumber tertulis total biaya Rp22.500,00 pada pembahasan sehingga sisa biaya Rp15.000,00 "
                "cukup untuk 15.000 / 5.000 = 3 hari, total = 1 + 3 = 4 hari."
            ),
        },
        56: {
            "explanation": (
                "Konsep: Aljabar\n"
                "Jumlah seluruh siswa = 3.600.000 / 120.000 = 30 anak. "
                "Misalkan siswa laki-laki = x dan perempuan = y = 2x. "
                "x + y = 30 → x + 2x = 30 → 3x = 30 → x = 10 anak."
            ),
        },
    }

    questions: list[dict[str, Any]] = []
    for num in range(1, 111):
        block = blocks[num]
        category = "TWK" if num <= 30 else ("TIU" if num <= 65 else "TKP")

        # Split Pembahasan
        pemb_match = re.search(r"\bPemba[hsa]{3,6}n\s*:?", block, re.I)
        assert pemb_match, f"LolosASN Q{num} missing Pembahasan in:\n{block}"
        q_and_opts = block[: pemb_match.start()].strip()
        expl_raw = block[pemb_match.end() :].strip()

        # Find options A..E in q_and_opts
        opt_matches = list(re.finditer(r"(?:^|\n)\s*([A-E])\.\s*", q_and_opts))
        assert len(opt_matches) >= 5, f"LolosASN Q{num} expected 5 options, got {len(opt_matches)}:\n{q_and_opts}"
        # Take the last 5 option markers matching A, B, C, D, E in order
        if len(opt_matches) > 5:
            opt_matches = opt_matches[-5:]

        q_text = clean_whitespace(q_and_opts[: opt_matches[0].start()])
        if num in (61, 62, 63):
            q_text = f"{passage_61_63}\n\n{q_text}"
        elif num in (64, 65):
            q_text = f"{passage_64_65}\n\n{q_text}"

        raw_opts: dict[str, str] = {}
        for idx, om in enumerate(opt_matches):
            key = om.group(1)
            o_start = om.end()
            o_end = opt_matches[idx + 1].start() if idx + 1 < len(opt_matches) else len(q_and_opts)
            raw_opts[key] = clean_inline(q_and_opts[o_start:o_end])

        if num in patches and "question" in patches[num]:
            q_text = patches[num]["question"]
        elif not q_text and num in (40, 41, 42):
            q_text = "Pilihlah satu kata yang tidak termasuk ke dalam kelompok yang sama dengan kata-kata lainnya!"

        options = []
        if category in ("TWK", "TIU"):
            ans_match = re.search(r"Jawaban\s*:\s*([A-E])\b", expl_raw, re.I)
            assert ans_match, f"LolosASN Q{num} missing Jawaban in:\n{expl_raw}"
            correct_key = ans_match.group(1).upper()
            expl_clean = clean_whitespace(expl_raw[: ans_match.start()])
            if num in patches and "explanation" in patches[num]:
                expl_clean = patches[num]["explanation"]
            for k in ["A", "B", "C", "D", "E"]:
                options.append(
                    {
                        "key": k,
                        "text": raw_opts[k],
                        "score": 5 if k == correct_key else 0,
                    }
                )
        else:
            # TKP: extract 5 option letters after "Urutan Nilai Jawaban"
            letters = re.findall(r"\b([A-E])\b", expl_raw)
            assert len(letters) == 5 and set(letters) == {"A", "B", "C", "D", "E"}, (
                f"LolosASN TKP Q{num} unexpected ranking {letters} in:\n{expl_raw}"
            )
            score_map = {letters[0]: 5, letters[1]: 4, letters[2]: 3, letters[3]: 2, letters[4]: 1}
            correct_key = letters[0]
            expl_clean = (
                f"Urutan nilai jawaban TKP (dari poin tertinggi ke terendah): "
                f"5 = {letters[0]}, 4 = {letters[1]}, 3 = {letters[2]}, 2 = {letters[3]}, 1 = {letters[4]}."
            )
            for k in ["A", "B", "C", "D", "E"]:
                options.append(
                    {
                        "key": k,
                        "text": raw_opts[k],
                        "score": score_map[k],
                    }
                )

        subtopic, study_url, study_label = infer_study_link(category, q_text + " " + expl_clean)
        questions.append(
            {
                "id": f"lolosasn-{num:03d}",
                "number": num,
                "category": category,
                "subtopic": subtopic,
                "question": q_text,
                "options": options,
                "correctOption": correct_key,
                "explanation": expl_clean,
                "sourceTitle": "Tryout CPNS LolosASN + Pembahasan (Google Drive)",
                "sourceUrl": LOLOSASN_SOURCE_URL,
                "studyUrl": study_url,
                "studyLabel": study_label,
            }
        )

    return questions


def parse_cpns2024_paket1() -> list[dict[str, Any]]:
    raw = (CACHE / "cpns_2024_2025.txt").read_text(encoding="utf-8")
    pages = raw.split("\x0c")

    q_text_all = strip_page_numbers(pages[101:131])
    a_text_all = strip_page_numbers(pages[132:155])

    # Normalize broken options and typos in Paket 1
    q_text_all = q_text_all.replace("Agus!ys 1945", "Agustus 1945")
    q_text_all = q_text_all.replace(
        "d. F dan G e.\nM dan N",
        "d. F dan G\ne. M dan N",
    )
    q_text_all = re.sub(
        r"\nd\.\s*P\s*\n\s*e\.\s*P=Q",
        "\nd. P<Q\ne. P=Q",
        q_text_all,
    )
    # Fix stacked option letters like "a.\nb.\nc.\nd.\ne.\n\nOpt1\nOpt2\n..."
    def fix_stacked_options(match: re.Match[str]) -> str:
        tail = match.group(1).strip()
        lines = [ln.strip() for ln in tail.splitlines() if ln.strip()]
        # Merge lines that wrapped mid-sentence? Look at pages 112, 114, 118, 120, 130
        if len(lines) == 5:
            return "\n" + "\n".join(f"{k}. {lines[i]}" for i, k in enumerate(["a", "b", "c", "d", "e"])) + "\n"
        return match.group(0)

    # Specifically inspect stacked option layouts in Paket 1:
    # Q43, 44, 45, 63, 64, 65 have "a.\nb.\nc.\nd.\ne.\n\nGambar A\n..."
    q_text_all = q_text_all.replace(
        "a.\nb.\nc.\nd.\ne.\n\nGambar A\nGambar B\nGambar C\nGambar D\nGambar E",
        "a. Gambar A\nb. Gambar B\nc. Gambar C\nd. Gambar D\ne. Gambar E",
    )
    # Q33: a..e followed by Hadiah..Prestasi
    q_text_all = q_text_all.replace(
        "a.\nb.\nc.\nd.\ne.\n\nHadiah\nLembur\nPensiun\nPiagam\nPrestasi",
        "a. Hadiah\nb. Lembur\nc. Pensiun\nd. Piagam\ne. Prestasi",
    )
    # Q38: a..e followed by Rocky...
    q_text_all = q_text_all.replace(
        "a.\nb.\nc.\nd.\ne.\n\nRocky boleh memiliki surat mengemudi\nTidak dapat ditarik kesimpulan\nRocky wajib memiliki surat izin mengemudi\nSemua salah\nRocky tidak membutuhkan surat izin mengemudi",
        "a. Rocky boleh memiliki surat mengemudi\nb. Tidak dapat ditarik kesimpulan\nc. Rocky wajib memiliki surat izin mengemudi\nd. Semua salah\ne. Rocky tidak membutuhkan surat izin mengemudi",
    )
    # Q69: a..e followed by Memanggilnya...
    q_text_all = q_text_all.replace(
        "a.\nb.\nc.\nd.\ne.\n\nMemanggilnya dan membicarakan baik-baik dengan rekan satu tim\nMemaklumi bahwa itulah dinamika yang terjadi dalam suatu tim\nGerak langkah orang tersebut perlu diperhatikan dan diawasi\nSegera melaporkannya kepada pimpinan divisi\nMengingatkannya di depan rekan satu tim agar kedepan dapat lebih\nmeningkatkan kinerja tim",
        "a. Memanggilnya dan membicarakan baik-baik dengan rekan satu tim\nb. Memaklumi bahwa itulah dinamika yang terjadi dalam suatu tim\nc. Gerak langkah orang tersebut perlu diperhatikan dan diawasi\nd. Segera melaporkannya kepada pimpinan divisi\ne. Mengingatkannya di depan rekan satu tim agar kedepan dapat lebih meningkatkan kinerja tim",
    )
    # Also fix Q43/44/45 ordering where 44. and 45. appeared AFTER the options on page 114
    q_text_all = re.sub(
        r"43\.\s*a\. Gambar A[\s\S]*?45\.",
        (
            "43. Tentukan gambar kubus yang dapat terbentuk dari jaring-jaring pada gambar soal!\n"
            "a. Gambar A\nb. Gambar B\nc. Gambar C\nd. Gambar D\ne. Gambar E\n"
            "44. Tentukan gambar yang sama/identik dengan susunan gambar pada kotak soal!\n"
            "a. Gambar A\nb. Gambar B\nc. Gambar C\nd. Gambar D\ne. Gambar E\n"
            "45. Tentukan gambar yang merupakan hasil rotasi tepat dari gambar pada kotak soal!\n"
            "a. Gambar A\nb. Gambar B\nc. Gambar C\nd. Gambar D\ne. Gambar E"
        ),
        q_text_all,
    )
    # Fix Q63/64/65 ordering on pages 118-119
    q_text_all = re.sub(
        r"63\.\s*a\. Gambar A[\s\S]*?(?=\n66\.)",
        (
            "63. Tentukan satu gambar yang berbeda dengan keempat gambar lainnya!\n"
            "a. Gambar A\nb. Gambar B\nc. Gambar C\nd. Gambar D\ne. Gambar E\n"
            "64. Tentukan gambar yang tepat untuk melengkapi tanda tanya (?) pada matriks pola gambar!\n"
            "a. Gambar A\nb. Gambar B\nc. Gambar C\nd. Gambar D\ne. Gambar E\n"
            "65. Tentukan satu gambar yang tidak sama (berbeda posisi bintang dan kotak hitam) dengan keempat gambar lainnya!\n"
            "a. Gambar A\nb. Gambar B\nc. Gambar C\nd. Gambar D\ne. Gambar E\n"
        ),
        q_text_all,
    )

    # Clean weird line splits on page 117/130/etc.
    # Let's parse sequential 1..110 blocks from q_text_all
    q_matches = list(re.finditer(r"(?:^|\n)\s*(\d{1,3})\.\s*", q_text_all))
    q_blocks: dict[int, str] = {}
    for i, m in enumerate(q_matches):
        num = int(m.group(1))
        expected = len(q_blocks) + 1
        if num != expected:
            continue
        start = m.end()
        end = len(q_text_all)
        for j in range(i + 1, len(q_matches)):
            if int(q_matches[j].group(1)) == num + 1:
                end = q_matches[j].start()
                break
        q_blocks[num] = q_text_all[start:end].strip()

    assert len(q_blocks) == 110, f"Paket 2 expected 110 question blocks, got {len(q_blocks)}. Missing: {set(range(1,111))-set(q_blocks)}"

    # Parse sequential 1..110 answer blocks from a_text_all
    a_matches = list(re.finditer(r"(?:^|\n)\s*(\d{1,3})\.\s*", a_text_all))
    a_blocks: dict[int, str] = {}
    for i, m in enumerate(a_matches):
        num = int(m.group(1))
        expected = len(a_blocks) + 1
        if num != expected:
            continue
        start = m.end()
        end = len(a_text_all)
        for j in range(i + 1, len(a_matches)):
            if int(a_matches[j].group(1)) == num + 1:
                end = a_matches[j].start()
                break
        a_blocks[num] = a_text_all[start:end].strip()

    assert len(a_blocks) == 110, f"Paket 2 expected 110 answer blocks, got {len(a_blocks)}. Missing: {set(range(1,111))-set(a_blocks)}"

    figure_map = {
        43: "/figures/paket2-q43.png",
        44: "/figures/paket2-q44.png",
        45: "/figures/paket2-q45.png",
        63: "/figures/paket2-q63.png",
        64: "/figures/paket2-q64.png",
        65: "/figures/paket2-q65.png",
    }

    ans_patches = {
        58: (
            "Pola berulang: huruf pertama dan kedua maju +1 (A → B, C → D, E → F), "
            "diselingi huruf tetap M dan N. Setelah E dilanjutkan F dan M."
        ),
        59: (
            "Pola dua larik selang-seling: suku ganjil bertambah +15 (40 → 55 → 70 → 85), "
            "sedangkan suku genap berkurang -15 (44 → 29 → 14 → -1). Jadi hasilnya 85 dan -1."
        ),
        60: (
            "Pola dua larik selang-seling: suku ganjil dikurangi 2,3 (17 → 14,7 → 12,4 → 10,1), "
            "sedangkan suku genap ditambah 3,2 (7 → 10,2 → 13,4 → 16,6). Jadi hasilnya 10,1 dan 16,6."
        ),
    }

    questions: list[dict[str, Any]] = []
    for num in range(1, 111):
        qb = q_blocks[num]
        ab = a_blocks[num]
        category = "TWK" if num <= 30 else ("TIU" if num <= 65 else "TKP")

        opt_matches = list(re.finditer(r"(?:^|\n)\s*([a-e])\.\s*", qb))
        assert len(opt_matches) >= 5, f"Paket 2 Q{num} expected 5 options, got {len(opt_matches)}:\n{qb}"
        if len(opt_matches) > 5:
            opt_matches = opt_matches[-5:]

        q_text = clean_whitespace(qb[: opt_matches[0].start()])
        raw_opts: dict[str, str] = {}
        for idx, om in enumerate(opt_matches):
            key = om.group(1).upper()
            o_start = om.end()
            o_end = opt_matches[idx + 1].start() if idx + 1 < len(opt_matches) else len(qb)
            raw_opts[key] = clean_inline(qb[o_start:o_end])

        options = []
        if category in ("TWK", "TIU"):
            m_ans = re.match(r"Jawaban\s*:\s*([A-E])\b[^\n]*\n?([\s\S]*)", ab, re.I)
            assert m_ans, f"Paket 2 Q{num} missing Jawaban in:\n{ab}"
            correct_key = m_ans.group(1).upper()
            expl_clean = clean_whitespace(m_ans.group(2))
            if num in ans_patches:
                expl_clean = ans_patches[num]
            for k in ["A", "B", "C", "D", "E"]:
                options.append(
                    {
                        "key": k,
                        "text": raw_opts[k],
                        "score": 5 if k == correct_key else 0,
                    }
                )
        else:
            # TKP: find "(point N)" for each option a..e (note Q102 in source used f..j)
            ab_norm = re.sub(
                r"(?:^|\n)\s*([f-j])\.\s*",
                lambda m: "\n" + chr(ord(m.group(1)) - 5) + ". ",
                ab,
            )
            first_opt_in_ab = re.search(r"(?:^|\n)\s*a\.\s*", ab_norm)
            assert first_opt_in_ab, f"Paket 2 TKP Q{num} missing option scores in:\n{ab}"
            expl_intro = clean_whitespace(ab_norm[: first_opt_in_ab.start()])
            pts = re.findall(r"(?:^|\n)\s*([a-e])\.\s*[\s\S]*?\(\s*poin?t\s*(\d)\s*\)", ab_norm, re.I)
            assert len(pts) == 5, f"Paket 2 TKP Q{num} expected 5 points, got {pts} in:\n{ab}"
            score_map = {k.upper(): int(v) for k, v in pts}
            assert set(score_map.keys()) == {"A", "B", "C", "D", "E"}
            assert set(score_map.values()) == {1, 2, 3, 4, 5}, f"Paket 2 TKP Q{num} invalid scores: {score_map}"
            correct_key = max(score_map, key=lambda k: score_map[k])
            ranking_str = ", ".join(
                f"{score_map[k]} = {k}"
                for k in sorted(score_map, key=lambda x: score_map[x], reverse=True)
            )
            expl_clean = f"{expl_intro}\n\nBobot poin: {ranking_str}." if expl_intro else f"Bobot poin: {ranking_str}."
            for k in ["A", "B", "C", "D", "E"]:
                options.append(
                    {
                        "key": k,
                        "text": raw_opts[k],
                        "score": score_map[k],
                    }
                )

        subtopic, study_url, study_label = infer_study_link(category, q_text + " " + expl_clean)
        item: dict[str, Any] = {
            "id": f"hots2024-{num:03d}",
            "number": num,
            "category": category,
            "subtopic": subtopic,
            "question": q_text,
            "options": options,
            "correctOption": correct_key,
            "explanation": expl_clean,
            "sourceTitle": (
                "Bank Drilling SKD CPNS 2024/2025 + Video Figural Ruang Tentor"
                if num in figure_map
                else "Bank Drilling SKD CPNS 2024/2025 (Google Drive)"
            ),
            "sourceUrl": CPNS2024_SOURCE_URL,
            "studyUrl": study_url,
            "studyLabel": study_label,
        }
        if num in figure_map:
            item["figureUrl"] = figure_map[num]
        questions.append(item)

    return questions


def main() -> None:
    lolosasn_qs = parse_lolosasn()
    hots_qs = parse_cpns2024_paket1()

    for name, qs in [("lolosasn", lolosasn_qs), ("hots2024", hots_qs)]:
        twk = sum(1 for q in qs if q["category"] == "TWK")
        tiu = sum(1 for q in qs if q["category"] == "TIU")
        tkp = sum(1 for q in qs if q["category"] == "TKP")
        assert (twk, tiu, tkp) == (30, 35, 45), f"{name} composition wrong: {(twk, tiu, tkp)}"
        for q in qs:
            assert q["question"], f"{name} Q{q['number']} empty question"
            assert q["explanation"], f"{name} Q{q['number']} empty explanation"
            assert all(o["text"] for o in q["options"]), f"{name} Q{q['number']} empty option"

    payload = {
        "packages": [
            {
                "id": "paket-lolosasn-2023",
                "title": "Paket 1 — Simulasi SKD CPNS Lengkap (LolosASN)",
                "description": "110 soal asli SKD sesuai komposisi BKN (30 TWK, 35 TIU, 45 TKP) dengan pembahasan lengkap dari modul Tryout LolosASN.",
                "durationMinutes": 100,
                "sourceTitle": "TRYOUT CPNS 2023 By LolosASN - PEMBAHASAN.pdf",
                "sourceUrl": LOLOSASN_SOURCE_URL,
                "questions": lolosasn_qs,
            },
            {
                "id": "paket-hots-2024-2025",
                "title": "Paket 2 — Simulasi SKD CPNS HOTS 2024/2025",
                "description": "110 soal HOTS sesuai kisi-kisi PermenPAN-RB (30 TWK, 35 TIU termasuk figural, 45 TKP) dari modul Bank Drilling CPNS 2024/2025.",
                "durationMinutes": 100,
                "sourceTitle": "CPNS-2024-2025.pdf (Paket Soal 1 & Kunci Jawaban)",
                "sourceUrl": CPNS2024_SOURCE_URL,
                "questions": hots_qs,
            },
        ]
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Successfully generated {OUT_JSON} with {len(lolosasn_qs)} + {len(hots_qs)} = {len(lolosasn_qs)+len(hots_qs)} verified questions.")


if __name__ == "__main__":
    main()

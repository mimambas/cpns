#!/usr/bin/env python3
"""Split src/data/questions.json into lightweight TypeScript metadata and on-demand JSON files."""

from __future__ import annotations

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
QUESTIONS_PATH = ROOT / "src" / "data" / "questions.json"
ANALYTICS_PATH = ROOT / "src" / "utils" / "analytics.ts"
OUT_PACKAGES_DIR = ROOT / "public" / "data" / "packages"
OUT_ALL_QUESTIONS_PATH = ROOT / "public" / "data" / "all-questions.json"
OUT_CATALOG_TS_PATH = ROOT / "src" / "data" / "generatedCatalog.ts"


def load_clusters():
    txt = ANALYTICS_PATH.read_text(encoding="utf-8")
    clusters = []
    raw_map = {}
    pattern = re.compile(
        r"id:\s*'([^']+)',\s*category:\s*'([^']+)',\s*label:\s*'([^']+)',\s*shortLabel:\s*'([^']+)',\s*description:\s*'([^']+)'[\s\S]*?rawSubtopics:\s*\[([^\]]+)\]"
    )
    for m in pattern.finditer(txt):
        cid, cat, label, short_label, desc, raw_block = (
            m.group(1),
            m.group(2),
            m.group(3),
            m.group(4),
            m.group(5),
            m.group(6),
        )
        raws = re.findall(r"'([^']+)'", raw_block)
        clusters.append(
            {
                "id": cid,
                "category": cat,
                "label": label,
                "shortLabel": short_label,
                "description": desc,
            }
        )
        for r in raws:
            raw_map[(cat, r.strip().lower())] = (cid, label)
    assert len(clusters) == 16, f"Expected 16 clusters, got {len(clusters)}"
    return clusters, raw_map


def to_meta(pkg: dict) -> dict:
    questions = pkg["questions"]
    return {
        "id": pkg["id"],
        "title": pkg["title"],
        "description": pkg["description"],
        "durationMinutes": pkg["durationMinutes"],
        "sourceTitle": pkg["sourceTitle"],
        "sourceUrl": pkg["sourceUrl"],
        "isFullSimulation": pkg["isFullSimulation"],
        "compositionLabel": pkg["compositionLabel"],
        "questionCount": len(questions),
        "twkCount": sum(1 for q in questions if q["category"] == "TWK"),
        "tiuCount": sum(1 for q in questions if q["category"] == "TIU"),
        "tkpCount": sum(1 for q in questions if q["category"] == "TKP"),
    }


def build_focused(
    pkg_id: str,
    title: str,
    description: str,
    category: str,
    duration_minutes: int,
    source_pkg: dict,
) -> dict:
    filtered = []
    for idx, q in enumerate(
        (q for q in source_pkg["questions"] if q["category"] == category), start=1
    ):
        copy_q = dict(q)
        copy_q["number"] = idx
        filtered.append(copy_q)

    return {
        "id": pkg_id,
        "title": title,
        "description": description,
        "durationMinutes": duration_minutes,
        "sourceTitle": source_pkg["sourceTitle"],
        "sourceUrl": source_pkg["sourceUrl"],
        "isFullSimulation": False,
        "compositionLabel": f"{len(filtered)} soal khusus {category}",
        "questions": filtered,
    }


def main() -> None:
    raw_data = json.loads(QUESTIONS_PATH.read_text(encoding="utf-8"))
    raw_packages = raw_data["packages"]
    clusters, raw_map = load_clusters()

    OUT_PACKAGES_DIR.mkdir(parents=True, exist_ok=True)
    for existing in OUT_PACKAGES_DIR.glob("*.json"):
        existing.unlink()

    full_packages = []
    for pkg in raw_packages:
        questions = pkg["questions"]
        twk = sum(1 for q in questions if q["category"] == "TWK")
        tiu = sum(1 for q in questions if q["category"] == "TIU")
        tkp = sum(1 for q in questions if q["category"] == "TKP")
        full_packages.append(
            {
                "id": pkg["id"],
                "title": pkg["title"],
                "description": pkg["description"],
                "durationMinutes": pkg["durationMinutes"],
                "sourceTitle": pkg["sourceTitle"],
                "sourceUrl": pkg["sourceUrl"],
                "isFullSimulation": True,
                "compositionLabel": f"{len(questions)} soal ({twk} TWK · {tiu} TIU · {tkp} TKP)",
                "questions": questions,
            }
        )

    focused_packages = [
        build_focused(
            "fokus-twk-paket2",
            "Latihan fokus TWK: Tes Wawasan Kebangsaan",
            "30 soal TWK pilihan dari Bank Drilling CPNS 2024/2025 mencakup Pancasila, UUD 1945, NKRI, sejarah nasional, dan Bahasa Indonesia.",
            "TWK",
            30,
            raw_packages[1],
        ),
        build_focused(
            "fokus-tiu-paket2",
            "Latihan fokus TIU: Tes Intelegensia Umum",
            "35 soal TIU pilihan mencakup analogi, silogisme, hitung cepat, deret angka, penalaran analitis, serta soal figural gambar.",
            "TIU",
            35,
            raw_packages[1],
        ),
        build_focused(
            "fokus-tkp-paket1",
            "Latihan fokus TKP: Tes Karakteristik Pribadi",
            "45 soal TKP dari modul LolosASN dengan pembobotan poin 1-5 pada aspek pelayanan publik, jejaring kerja, sosial budaya, TIK, profesionalisme, dan anti-radikalisme.",
            "TKP",
            40,
            raw_packages[0],
        ),
    ]

    all_standard_packages = full_packages + focused_packages

    # Build 16 deterministic subtopic drill packages
    drill_packages = {}
    for c in clusters:
        cid = c["id"]
        collected = []
        seen_ids = set()
        for pkg in full_packages:
            for q in pkg["questions"]:
                if q["category"] != c["category"]:
                    continue
                mapped_cid, _ = raw_map[(q["category"], q["subtopic"].strip().lower())]
                if mapped_cid != cid:
                    continue
                if q["id"] in seen_ids:
                    continue
                seen_ids.add(q["id"])
                copy_q = dict(q)
                copy_q["number"] = len(collected) + 1
                collected.append(copy_q)
                if len(collected) >= 20:
                    break
            if len(collected) >= 20:
                break

        assert len(collected) > 0, f"Drill package {cid} has 0 questions!"
        drill_id = f"drill-{cid}"
        drill_packages[cid] = {
            "id": drill_id,
            "title": f"Latihan subtopik {c['category']}: {c['label']}",
            "description": f"{len(collected)} soal terfokus pada rumpun subtopik {c['label']} ({c['description']})",
            "durationMinutes": max(10, len(collected)),
            "sourceTitle": "Bank Soal Gabungan CPNS Learning Hub",
            "sourceUrl": "https://drive.google.com/drive/folders/1Ezv-eN2_sMBPWDpVsPInxOXzowBhlG15",
            "isFullSimulation": False,
            "compositionLabel": f"{len(collected)} soal subtopik {c['shortLabel']}",
            "questions": collected,
        }

    # Write all 33 package JSON files
    written = 0
    for pkg in all_standard_packages + list(drill_packages.values()):
        out_file = OUT_PACKAGES_DIR / f"{pkg['id']}.json"
        out_file.write_text(
            json.dumps(pkg, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        written += 1

    # Write combined searchable question index (1,440 items from the 14 full packages)
    all_questions = []
    for pkg in full_packages:
        for q in pkg["questions"]:
            key = (q["category"], q["subtopic"].strip().lower())
            assert key in raw_map, f"Unmapped subtopic: {key}"
            cid, clabel = raw_map[key]
            item = dict(q)
            item["packageId"] = pkg["id"]
            item["packageTitle"] = pkg["title"]
            item["clusterId"] = cid
            item["clusterLabel"] = clabel
            item["hasFigure"] = bool(q.get("figureUrl"))
            all_questions.append(item)

    OUT_ALL_QUESTIONS_PATH.write_text(
        json.dumps(all_questions, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    # Generate lightweight TypeScript catalog
    full_metas = [to_meta(p) for p in full_packages]
    all_metas = [to_meta(p) for p in all_standard_packages]
    drill_metas = {cid: to_meta(pkg) for cid, pkg in drill_packages.items()}

    ts_content = (
        "// Auto-generated by scripts/split_question_bank.py - do not edit manually.\n"
        "import type { PackageMeta } from '../types';\n"
        "import type { SubtopicClusterId } from '../utils/analytics';\n\n"
        f"export const TOTAL_QUESTION_COUNT = {len(all_questions)};\n\n"
        f"export const FULL_PACKAGE_METAS: PackageMeta[] = {json.dumps(full_metas, ensure_ascii=False, indent=2)};\n\n"
        f"export const ALL_PACKAGE_METAS: PackageMeta[] = {json.dumps(all_metas, ensure_ascii=False, indent=2)};\n\n"
        f"export const DRILL_PACKAGE_METAS: Record<SubtopicClusterId, PackageMeta> = {json.dumps(drill_metas, ensure_ascii=False, indent=2)};\n"
    )
    assert "\u2014" not in ts_content, "Em dash detected in generatedCatalog.ts"
    OUT_CATALOG_TS_PATH.write_text(ts_content, encoding="utf-8")

    print(
        f"SPLIT_OK packages={written} (standard={len(all_standard_packages)}, drill={len(drill_packages)}) "
        f"all_questions={len(all_questions)} catalog_bytes={OUT_CATALOG_TS_PATH.stat().st_size}"
    )


if __name__ == "__main__":
    main()

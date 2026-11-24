import type {
  ExamAttempt,
  QuestionCategory,
  StudyModuleId,
} from '../types';
import { getQuestionScore, summarizeAttempt } from './scoring';

export type SubtopicClusterId =
  | 'twk-bela-negara'
  | 'twk-uud'
  | 'twk-pancasila'
  | 'twk-bahasa'
  | 'twk-integritas'
  | 'tiu-verbal'
  | 'tiu-numerik'
  | 'tiu-deret'
  | 'tiu-silogisme'
  | 'tiu-figural'
  | 'tkp-profesionalisme'
  | 'tkp-adaptabilitas'
  | 'tkp-jejaring'
  | 'tkp-tik'
  | 'tkp-pelayanan'
  | 'tkp-radikalisme';

export interface SubtopicClusterMeta {
  id: SubtopicClusterId;
  category: QuestionCategory;
  label: string;
  shortLabel: string;
  description: string;
  studyModuleId: StudyModuleId;
  rawSubtopics: string[];
}

export const SUBTOPIC_CLUSTERS: SubtopicClusterMeta[] = [
  // TWK (5 axes)
  {
    id: 'twk-bela-negara',
    category: 'TWK',
    label: 'Bela Negara, Sejarah & NKRI',
    shortLabel: 'Bela Negara',
    description: 'Nasionalisme, bela negara, Bhinneka Tunggal Ika, dan sejarah perjuangan bangsa.',
    studyModuleId: 'modul-twk',
    rawSubtopics: [
      'Wawasan Kebangsaan & Bela Negara',
      'Nasionalisme, Bela Negara & Sejarah',
      'Sejarah Perjuangan & Politik Luar Negeri',
      'Bhinneka Tunggal Ika & NKRI',
    ],
  },
  {
    id: 'twk-uud',
    category: 'TWK',
    label: 'UUD 1945 & Ketatanegaraan',
    shortLabel: 'UUD 1945',
    description: 'Pembukaan UUD 1945, pasal hasil amandemen, serta tugas lembaga negara.',
    studyModuleId: 'modul-twk',
    rawSubtopics: [
      'UUD 1945 & Ketatanegaraan',
      'Pilar Negara: UUD 1945 & Konstitusi',
      'Pilar Negara: Pembukaan UUD 1945',
      'Sistem Tata Negara & Lembaga',
    ],
  },
  {
    id: 'twk-pancasila',
    category: 'TWK',
    label: 'Pancasila & Ideologi Negara',
    shortLabel: 'Pancasila',
    description: 'Kedudukan Pancasila sebagai dasar negara, pandangan hidup, dan butir pengamalan.',
    studyModuleId: 'modul-twk',
    rawSubtopics: ['Pancasila & Ideologi', 'Pilar Negara: Pancasila'],
  },
  {
    id: 'twk-bahasa',
    category: 'TWK',
    label: 'Bahasa Indonesia & Literasi',
    shortLabel: 'Bahasa ID',
    description: 'Ejaan baku, kalimat efektif, gagasan utama paragraf, dan penalaran wacana.',
    studyModuleId: 'modul-twk',
    rawSubtopics: [
      'Bahasa Indonesia & Literasi',
      'Bahasa Negara (Bahasa Indonesia)',
    ],
  },
  {
    id: 'twk-integritas',
    category: 'TWK',
    label: 'Integritas & Nilai Dasar ASN',
    shortLabel: 'Integritas',
    description: 'Kejujuran, tanggung jawab jabatan, antikorupsi, dan etika pelayanan publik.',
    studyModuleId: 'modul-twk',
    rawSubtopics: ['Integritas & Nilai Dasar ASN'],
  },

  // TIU (5 axes)
  {
    id: 'tiu-verbal',
    category: 'TIU',
    label: 'Verbal: Analogi & Sinonim',
    shortLabel: 'Verbal',
    description: 'Padanan kata (sinonim/antonim) dan perbandingan hubungan analogi kalimat.',
    studyModuleId: 'modul-tiu',
    rawSubtopics: [
      'Verbal (Sinonim, Antonim & Analogi)',
      'TIU Verbal: Analogi, Sinonim & Penalaran',
    ],
  },
  {
    id: 'tiu-numerik',
    category: 'TIU',
    label: 'Numerik & Berhitung Cepat',
    shortLabel: 'Numerik',
    description: 'Operasi pecahan, persen, perbandingan senilai/berbalik nilai, dan soal cerita.',
    studyModuleId: 'modul-tiu',
    rawSubtopics: [
      'Numerik & Berhitung Cepat',
      'TIU Numerik: Deret, Berhitung & Soal Cerita',
    ],
  },
  {
    id: 'tiu-deret',
    category: 'TIU',
    label: 'Deret Angka & Huruf',
    shortLabel: 'Deret',
    description: 'Pola bilangan bertingkat, larik ganda, fibonaci, serta deret alfabet.',
    studyModuleId: 'modul-tiu',
    rawSubtopics: ['Deret Angka & Huruf'],
  },
  {
    id: 'tiu-silogisme',
    category: 'TIU',
    label: 'Silogisme & Penalaran Analitis',
    shortLabel: 'Silogisme',
    description: 'Penarikan kesimpulan premis logika (modus ponens/tollens) dan urutan posisi.',
    studyModuleId: 'modul-tiu',
    rawSubtopics: [
      'Silogisme & Penalaran Logis',
      'TIU Penalaran Logis & Analitis',
      'Penalaran Analitis',
    ],
  },
  {
    id: 'tiu-figural',
    category: 'TIU',
    label: 'Figural: Deret & Pola Gambar',
    shortLabel: 'Figural',
    description: 'Analogi bentuk, ketidaksamaan gambar, rotasi, pencerminan, dan serial figural.',
    studyModuleId: 'modul-tiu',
    rawSubtopics: ['TIU Figural: Deret & Ketidaksamaan Gambar'],
  },

  // TKP (6 axes)
  {
    id: 'tkp-profesionalisme',
    category: 'TKP',
    label: 'Profesionalisme & Integritas',
    shortLabel: 'Profesional',
    description: 'Ketuntasan target kerja, kepemimpinan, tanggung jawab, dan kepatuhan kode etik.',
    studyModuleId: 'modul-tkp',
    rawSubtopics: [
      'TKP: Profesionalisme',
      'Kepemimpinan & Profesionalisme',
      'Integritas & Etika Kerja',
    ],
  },
  {
    id: 'tkp-adaptabilitas',
    category: 'TKP',
    label: 'Adaptabilitas & Inovasi Kerja',
    shortLabel: 'Adaptabilitas',
    description: 'Kesiapan menghadapi perubahan aturan, lingkungan kerja baru, dan solusi kreatif.',
    studyModuleId: 'modul-tkp',
    rawSubtopics: ['Adaptabilitas & Inovasi Kerja'],
  },
  {
    id: 'tkp-jejaring',
    category: 'TKP',
    label: 'Jejaring Kerja & Sosial Budaya',
    shortLabel: 'Jejaring Kerja',
    description: 'Kolaborasi lintas unit, musyawarah, dan penghormatan terhadap keberagaman.',
    studyModuleId: 'modul-tkp',
    rawSubtopics: [
      'Jejaring Kerja & Kerja Sama',
      'TKP: Jejaring Kerja & Sosial Budaya',
    ],
  },
  {
    id: 'tkp-tik',
    category: 'TKP',
    label: 'Teknologi Informasi (TIK)',
    shortLabel: 'TIK',
    description: 'Pemanfaatan sistem digital, keamanan data, dan keterbukaan belajar teknologi.',
    studyModuleId: 'modul-tkp',
    rawSubtopics: ['TKP: Teknologi Informasi & Komunikasi'],
  },
  {
    id: 'tkp-pelayanan',
    category: 'TKP',
    label: 'Pelayanan Publik',
    shortLabel: 'Pelayanan',
    description: 'Sikap ramah, responsif, solutif, dan adil saat melayani kebutuhan masyarakat.',
    studyModuleId: 'modul-tkp',
    rawSubtopics: ['TKP: Pelayanan Publik', 'Pelayanan Publik'],
  },
  {
    id: 'tkp-radikalisme',
    category: 'TKP',
    label: 'Anti-Radikalisme',
    shortLabel: 'Anti-Radikal',
    description: 'Deteksi sikap toleransi, penolakan intoleransi/hoaks, dan komitmen kebangsaan.',
    studyModuleId: 'modul-tkp',
    rawSubtopics: ['TKP: Anti Radikalisme & Sosial Budaya'],
  },
];

const CLUSTER_BY_ID = new Map<SubtopicClusterId, SubtopicClusterMeta>(
  SUBTOPIC_CLUSTERS.map((c) => [c.id, c]),
);

const RAW_TO_CLUSTER = new Map<string, SubtopicClusterMeta>();
for (const cluster of SUBTOPIC_CLUSTERS) {
  for (const raw of cluster.rawSubtopics) {
    RAW_TO_CLUSTER.set(`${cluster.category}::${raw.toLowerCase()}`, cluster);
  }
}

export function getSubtopicClusterMeta(id: string): SubtopicClusterMeta | undefined {
  return CLUSTER_BY_ID.get(id as SubtopicClusterId);
}

export function getDrillPackageId(clusterId: SubtopicClusterId): string {
  return `drill-${clusterId}`;
}

export function classifySubtopic(
  category: QuestionCategory,
  rawSubtopic: string,
): SubtopicClusterMeta {
  const normalized = (rawSubtopic ?? '').trim().toLowerCase();
  const exact = RAW_TO_CLUSTER.get(`${category}::${normalized}`);
  if (exact) return exact;

  if (category === 'TWK') {
    if (normalized.includes('uud') || normalized.includes('tata negara')) {
      return CLUSTER_BY_ID.get('twk-uud')!;
    }
    if (normalized.includes('pancasila')) return CLUSTER_BY_ID.get('twk-pancasila')!;
    if (normalized.includes('bahasa')) return CLUSTER_BY_ID.get('twk-bahasa')!;
    if (normalized.includes('integritas')) return CLUSTER_BY_ID.get('twk-integritas')!;
    return CLUSTER_BY_ID.get('twk-bela-negara')!;
  }

  if (category === 'TIU') {
    if (normalized.includes('figural') || normalized.includes('gambar')) {
      return CLUSTER_BY_ID.get('tiu-figural')!;
    }
    if (normalized.includes('deret')) return CLUSTER_BY_ID.get('tiu-deret')!;
    if (normalized.includes('silogisme') || normalized.includes('analitis') || normalized.includes('logis')) {
      return CLUSTER_BY_ID.get('tiu-silogisme')!;
    }
    if (normalized.includes('numerik') || normalized.includes('hitung')) {
      return CLUSTER_BY_ID.get('tiu-numerik')!;
    }
    return CLUSTER_BY_ID.get('tiu-verbal')!;
  }

  if (normalized.includes('pelayanan')) return CLUSTER_BY_ID.get('tkp-pelayanan')!;
  if (normalized.includes('jejaring') || normalized.includes('sosial')) {
    return CLUSTER_BY_ID.get('tkp-jejaring')!;
  }
  if (normalized.includes('tik') || normalized.includes('teknologi')) {
    return CLUSTER_BY_ID.get('tkp-tik')!;
  }
  if (normalized.includes('radikal')) return CLUSTER_BY_ID.get('tkp-radikalisme')!;
  if (normalized.includes('adaptab')) return CLUSTER_BY_ID.get('tkp-adaptabilitas')!;
  return CLUSTER_BY_ID.get('tkp-profesionalisme')!;
}

export type MasteryLevel = 'untested' | 'weak' | 'moderate' | 'strong';

export interface SubtopicStat {
  cluster: SubtopicClusterMeta;
  totalSeen: number;
  answeredCount: number;
  perfectCount: number;
  earnedPoints: number;
  maxPoints: number;
  masteryPct: number;
  avgPointsPerQuestion: number;
  level: MasteryLevel;
}

export interface CategoryAnalyticsSummary {
  category: QuestionCategory;
  totalSeen: number;
  earnedPoints: number;
  maxPoints: number;
  masteryPct: number;
  avgPointsPerQuestion: number;
}

export interface AttemptTrendPoint {
  attemptId: string;
  label: string;
  packageTitle: string;
  finishedAt: string;
  totalScore: number;
  maxTotalScore: number;
  pct: number;
  twkScore: number;
  tiuScore: number;
  tkpScore: number;
  passed: boolean;
}

export interface SubtopicAnalyticsReport {
  totalAttempts: number;
  totalQuestionsEvaluated: number;
  testedClustersCount: number;
  totalClustersCount: number;
  statsByCluster: Record<SubtopicClusterId, SubtopicStat>;
  clustersByCategory: Record<QuestionCategory, SubtopicStat[]>;
  categorySummary: Record<QuestionCategory, CategoryAnalyticsSummary>;
  weakestTop3: SubtopicStat[];
  trend: AttemptTrendPoint[];
}

export function getMasteryLevel(totalSeen: number, masteryPct: number): MasteryLevel {
  if (totalSeen === 0) return 'untested';
  if (masteryPct < 60) return 'weak';
  if (masteryPct < 80) return 'moderate';
  return 'strong';
}

export function computeSubtopicAnalytics(attempts: ExamAttempt[]): SubtopicAnalyticsReport {
  const accumulators = new Map<
    SubtopicClusterId,
    { totalSeen: number; answeredCount: number; perfectCount: number; earnedPoints: number; maxPoints: number }
  >();
  for (const cluster of SUBTOPIC_CLUSTERS) {
    accumulators.set(cluster.id, {
      totalSeen: 0,
      answeredCount: 0,
      perfectCount: 0,
      earnedPoints: 0,
      maxPoints: 0,
    });
  }

  let totalQuestionsEvaluated = 0;

  for (const attempt of attempts) {
    for (const q of attempt.questions) {
      totalQuestionsEvaluated += 1;
      const meta = classifySubtopic(q.category, q.subtopic);
      const bucket = accumulators.get(meta.id)!;
      const chosen = attempt.answers[q.id];
      const pts = getQuestionScore(q, chosen);

      bucket.totalSeen += 1;
      if (chosen) {
        bucket.answeredCount += 1;
      }
      if (pts === 5) {
        bucket.perfectCount += 1;
      }
      bucket.earnedPoints += pts;
      bucket.maxPoints += 5;
    }
  }

  const statsByCluster = {} as Record<SubtopicClusterId, SubtopicStat>;
  for (const cluster of SUBTOPIC_CLUSTERS) {
    const acc = accumulators.get(cluster.id)!;
    const masteryPct = acc.maxPoints > 0 ? Math.round((acc.earnedPoints / acc.maxPoints) * 100) : 0;
    const avgPointsPerQuestion =
      acc.totalSeen > 0 ? Number((acc.earnedPoints / acc.totalSeen).toFixed(1)) : 0;

    statsByCluster[cluster.id] = {
      cluster,
      totalSeen: acc.totalSeen,
      answeredCount: acc.answeredCount,
      perfectCount: acc.perfectCount,
      earnedPoints: acc.earnedPoints,
      maxPoints: acc.maxPoints,
      masteryPct,
      avgPointsPerQuestion,
      level: getMasteryLevel(acc.totalSeen, masteryPct),
    };
  }

  const categories: QuestionCategory[] = ['TWK', 'TIU', 'TKP'];
  const clustersByCategory = {} as Record<QuestionCategory, SubtopicStat[]>;
  const categorySummary = {} as Record<QuestionCategory, CategoryAnalyticsSummary>;

  for (const cat of categories) {
    const items = SUBTOPIC_CLUSTERS.filter((c) => c.category === cat).map(
      (c) => statsByCluster[c.id],
    );
    clustersByCategory[cat] = items;

    const totalSeen = items.reduce((s, x) => s + x.totalSeen, 0);
    const earnedPoints = items.reduce((s, x) => s + x.earnedPoints, 0);
    const maxPoints = items.reduce((s, x) => s + x.maxPoints, 0);
    categorySummary[cat] = {
      category: cat,
      totalSeen,
      earnedPoints,
      maxPoints,
      masteryPct: maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0,
      avgPointsPerQuestion: totalSeen > 0 ? Number((earnedPoints / totalSeen).toFixed(1)) : 0,
    };
  }

  const testedStats = SUBTOPIC_CLUSTERS.map((c) => statsByCluster[c.id]).filter(
    (s) => s.totalSeen > 0,
  );
  const weakestTop3 = [...testedStats]
    .sort((a, b) => {
      if (a.masteryPct !== b.masteryPct) return a.masteryPct - b.masteryPct;
      return b.totalSeen - a.totalSeen;
    })
    .slice(0, 3);

  const chronological = [...attempts]
    .sort((a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime())
    .slice(-8);

  const trend: AttemptTrendPoint[] = chronological.map((attempt, idx) => {
    const ev = summarizeAttempt(attempt);
    const pct = ev.maxTotalScore > 0 ? Math.round((ev.totalScore / ev.maxTotalScore) * 100) : 0;
    return {
      attemptId: attempt.id,
      label: `#${idx + 1}`,
      packageTitle: attempt.packageTitle,
      finishedAt: attempt.finishedAt,
      totalScore: ev.totalScore,
      maxTotalScore: ev.maxTotalScore,
      pct,
      twkScore: ev.subtests.TWK.score,
      tiuScore: ev.subtests.TIU.score,
      tkpScore: ev.subtests.TKP.score,
      passed: ev.passed,
    };
  });

  return {
    totalAttempts: attempts.length,
    totalQuestionsEvaluated,
    testedClustersCount: testedStats.length,
    totalClustersCount: SUBTOPIC_CLUSTERS.length,
    statsByCluster,
    clustersByCategory,
    categorySummary,
    weakestTop3,
    trend,
  };
}

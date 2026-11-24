import type { PackageMeta, QuestionPackage, SearchableQuestionItem } from '../types';
import type { SubtopicClusterId } from '../utils/analytics';
import {
  ALL_PACKAGE_METAS,
  DRILL_PACKAGE_METAS,
  FULL_PACKAGE_METAS,
  TOTAL_QUESTION_COUNT,
} from './generatedCatalog';

export {
  ALL_PACKAGE_METAS,
  DRILL_PACKAGE_METAS,
  FULL_PACKAGE_METAS,
  TOTAL_QUESTION_COUNT,
};

const packageCache = new Map<string, QuestionPackage>();
const inflightPackages = new Map<string, Promise<QuestionPackage | undefined>>();

let allQuestionsCache: SearchableQuestionItem[] | null = null;
let inflightAllQuestions: Promise<SearchableQuestionItem[]> | null = null;

export function getPackageMetaById(id: string): PackageMeta | undefined {
  const standard = ALL_PACKAGE_METAS.find((p) => p.id === id);
  if (standard) return standard;
  if (id.startsWith('drill-')) {
    const cid = id.slice('drill-'.length) as SubtopicClusterId;
    return DRILL_PACKAGE_METAS[cid];
  }
  return undefined;
}

export function getSubtopicQuestionCount(clusterId: SubtopicClusterId): number {
  return DRILL_PACKAGE_METAS[clusterId]?.questionCount ?? 0;
}

export function getCachedPackageById(id: string): QuestionPackage | undefined {
  return packageCache.get(id);
}

export async function loadPackageById(id: string): Promise<QuestionPackage | undefined> {
  const cached = packageCache.get(id);
  if (cached) return cached;

  if (!getPackageMetaById(id)) {
    return undefined;
  }

  const inflight = inflightPackages.get(id);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const res = await fetch(`/data/packages/${encodeURIComponent(id)}.json`);
      if (!res.ok) return undefined;
      const pkg = (await res.json()) as QuestionPackage;
      packageCache.set(id, pkg);
      return pkg;
    } catch {
      return undefined;
    } finally {
      inflightPackages.delete(id);
    }
  })();

  inflightPackages.set(id, promise);
  return promise;
}

export function preloadPackageById(id: string): void {
  if (packageCache.has(id) || inflightPackages.has(id)) return;
  void loadPackageById(id);
}

export async function loadAllQuestionsIndex(): Promise<SearchableQuestionItem[]> {
  if (allQuestionsCache) return allQuestionsCache;
  if (inflightAllQuestions) return inflightAllQuestions;

  inflightAllQuestions = (async () => {
    try {
      const res = await fetch('/data/all-questions.json');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const items = (await res.json()) as SearchableQuestionItem[];
      allQuestionsCache = items;
      return items;
    } finally {
      inflightAllQuestions = null;
    }
  })();

  return inflightAllQuestions;
}

export const SSCASN_PORTAL = {
  title: 'Portal resmi SSCASN Badan Kepegawaian Negara (BKN)',
  url: 'https://sscasn.bkn.go.id/',
  helpdeskUrl: 'https://helpdesk-sscasn.bkn.go.id/',
  description:
    'Portal pendaftaran CPNS resmi pemerintah Indonesia untuk mengecek pengumuman formasi, persyaratan dokumen, jadwal tahapan seleksi, dan informasi resmi CAT BKN.',
};

import type React from 'react';
import type { StudyModuleId } from '../types';

export type AppTab = 'home' | 'study' | 'exam' | 'history';

const MODULE_SLUG_BY_ID: Record<StudyModuleId, string> = {
  'modul-regulasi': 'regulasi',
  'modul-twk': 'twk',
  'modul-tiu': 'tiu',
  'modul-tkp': 'tkp',
  'modul-drive': 'ebook',
};

const MODULE_ID_BY_SLUG: Record<string, StudyModuleId> = {
  regulasi: 'modul-regulasi',
  'modul-regulasi': 'modul-regulasi',
  twk: 'modul-twk',
  'modul-twk': 'modul-twk',
  tiu: 'modul-tiu',
  'modul-tiu': 'modul-tiu',
  tkp: 'modul-tkp',
  'modul-tkp': 'modul-tkp',
  ebook: 'modul-drive',
  drive: 'modul-drive',
  'modul-drive': 'modul-drive',
};

export function moduleIdToSlug(moduleId: StudyModuleId): string {
  return MODULE_SLUG_BY_ID[moduleId] ?? 'regulasi';
}

export function slugToModuleId(slug: string): StudyModuleId | null {
  const key = slug.trim().toLowerCase();
  return MODULE_ID_BY_SLUG[key] ?? null;
}

export function buildHomePath(): string {
  return '/';
}

export function buildStudyPath(moduleId: StudyModuleId = 'modul-regulasi'): string {
  return `/kelas/${moduleIdToSlug(moduleId)}`;
}

export function buildExamHubPath(packageId?: string): string {
  if (!packageId) return '/simulasi';
  return `/simulasi/${encodeURIComponent(packageId)}`;
}

export function buildActiveExamPath(packageId: string): string {
  return `/ujian/${encodeURIComponent(packageId)}`;
}

export function buildHistoryPath(attemptId?: string | null): string {
  if (!attemptId) return '/hasil';
  return `/hasil/${encodeURIComponent(attemptId)}`;
}

export function buildLeaderboardPath(packageId?: string): string {
  if (!packageId) return '/peringkat';
  return `/peringkat/${encodeURIComponent(packageId)}`;
}

export function buildAnalyticsPath(): string {
  return '/analitik';
}

export type ParsedRoute =
  | { tab: 'home'; replaceWith?: string }
  | { tab: 'study'; moduleId: StudyModuleId; replaceWith?: string }
  | { tab: 'exam'; packageId?: string; running: boolean; replaceWith?: string }
  | {
      tab: 'history';
      subview: 'attempts' | 'analytics' | 'leaderboard';
      attemptId: string | null;
      leaderboardPkgId?: string;
      replaceWith?: string;
    };

export function parsePathname(rawPathname: string): ParsedRoute {
  const normalized =
    rawPathname.length > 1 && rawPathname.endsWith('/')
      ? rawPathname.slice(0, -1)
      : rawPathname || '/';
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length === 0) {
    return {
      tab: 'home',
      replaceWith: rawPathname !== '/' ? '/' : undefined,
    };
  }

  const head = segments[0].toLowerCase();

  if (head === 'kelas') {
    if (segments.length === 1) {
      return {
        tab: 'study',
        moduleId: 'modul-regulasi',
        replaceWith: buildStudyPath('modul-regulasi'),
      };
    }
    const rawSlug = decodeURIComponent(segments[1]);
    const matched = slugToModuleId(rawSlug);
    if (matched) {
      const canonical = buildStudyPath(matched);
      return {
        tab: 'study',
        moduleId: matched,
        replaceWith: rawPathname !== canonical ? canonical : undefined,
      };
    }
    return {
      tab: 'study',
      moduleId: 'modul-regulasi',
      replaceWith: buildStudyPath('modul-regulasi'),
    };
  }

  if (head === 'simulasi') {
    if (segments.length === 1) {
      return {
        tab: 'exam',
        packageId: undefined,
        running: false,
        replaceWith: rawPathname !== '/simulasi' ? '/simulasi' : undefined,
      };
    }
    const pkgId = decodeURIComponent(segments[1]);
    return {
      tab: 'exam',
      packageId: pkgId,
      running: false,
    };
  }

  if (head === 'ujian') {
    if (segments.length === 1) {
      return {
        tab: 'exam',
        packageId: undefined,
        running: false,
        replaceWith: '/simulasi',
      };
    }
    const pkgId = decodeURIComponent(segments[1]);
    return {
      tab: 'exam',
      packageId: pkgId,
      running: true,
    };
  }

  if (head === 'hasil') {
    if (segments.length === 1) {
      return {
        tab: 'history',
        subview: 'attempts',
        attemptId: null,
        replaceWith: rawPathname !== '/hasil' ? '/hasil' : undefined,
      };
    }
    const attemptId = decodeURIComponent(segments[1]);
    return {
      tab: 'history',
      subview: 'attempts',
      attemptId,
    };
  }

  if (head === 'peringkat') {
    if (segments.length === 1) {
      return {
        tab: 'history',
        subview: 'leaderboard',
        attemptId: null,
        replaceWith: rawPathname !== '/peringkat' ? '/peringkat' : undefined,
      };
    }
    const pkgId = decodeURIComponent(segments[1]);
    return {
      tab: 'history',
      subview: 'leaderboard',
      attemptId: null,
      leaderboardPkgId: pkgId,
    };
  }

  if (head === 'analitik') {
    return {
      tab: 'history',
      subview: 'analytics',
      attemptId: null,
      replaceWith: rawPathname !== '/analitik' ? '/analitik' : undefined,
    };
  }

  return {
    tab: 'home',
    replaceWith: '/',
  };
}

export function shouldHandleClientClick(e: React.MouseEvent<HTMLAnchorElement>): boolean {
  return (
    !e.defaultPrevented &&
    e.button === 0 &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    !e.altKey
  );
}

export function buildAbsoluteUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).toString();
}

export async function copyUrlToClipboard(path: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const fullUrl = buildAbsoluteUrl(path);
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(fullUrl);
      return true;
    }
  } catch {
    // Fallback below handles insecure contexts or restricted clipboard permissions
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = fullUrl;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, fullUrl.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

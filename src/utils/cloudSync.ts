import type {
  ActiveExamSession,
  CloudProfile,
  ExamAttempt,
  FormationType,
  LeaderboardResponse,
  OptionKey,
  RankInfo,
} from '../types';
import { getPackageById } from '../data/questionBank';
import { summarizeAttempt } from './scoring';

const STORAGE_CLOUD_PROFILE_KEY = 'cpns_cloud_profile_v1';
const SYNC_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SYNC_CODE_REGEX = /^SKD-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

export interface CloudAttemptDto {
  id: string;
  userId: string;
  displayName: string;
  packageId: string;
  packageTitle: string;
  isFullSimulation: boolean;
  formationId: FormationType;
  startedAt: string;
  finishedAt: string;
  elapsedSeconds: number;
  allocatedSeconds: number;
  twkScore: number;
  tiuScore: number;
  tkpScore: number;
  totalScore: number;
  maxScore: number;
  passed: boolean;
  answers: Record<string, OptionKey>;
  flaggedIds: string[];
}

export interface SyncPayload {
  displayName: string;
  explicitProfileUpdate?: boolean;
  selectedFormation: FormationType;
  replaceFormation?: boolean;
  completedModules: string[];
  replaceModules?: boolean;
  activeSession?: ActiveExamSession | null;
  updateActiveSession?: boolean;
  attempts?: ReturnType<typeof toCloudAttemptPayload>[];
}

export interface SyncResponse {
  ok: boolean;
  profile: {
    userId: string;
    displayName: string;
    selectedFormation: FormationType;
    completedModules: string[];
    activeSession: ActiveExamSession | null;
    updatedAt: string;
  };
  attempts: CloudAttemptDto[];
}

export interface PublicAttemptResponse {
  ok: boolean;
  attempt: CloudAttemptDto;
  rankInfo: RankInfo;
}

function randomFromAlphabet(alphabet: string, length: number): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[arr[i] % alphabet.length];
  }
  return out;
}

export function generateSyncCode(): string {
  const g1 = randomFromAlphabet(SYNC_CODE_ALPHABET, 4);
  const g2 = randomFromAlphabet(SYNC_CODE_ALPHABET, 4);
  const g3 = randomFromAlphabet(SYNC_CODE_ALPHABET, 4);
  return `SKD-${g1}-${g2}-${g3}`;
}

export function normalizeSyncCode(raw: string): string | null {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  let body = cleaned;
  if (body.startsWith('SKD')) {
    body = body.slice(3);
  }
  if (body.length !== 12) return null;
  const formatted = `SKD-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
  return SYNC_CODE_REGEX.test(formatted) ? formatted : null;
}

export function generateAttemptId(): string {
  const rand = randomFromAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12);
  return `att_${rand}`;
}

export function loadOrCreateCloudProfile(): CloudProfile {
  try {
    const raw = localStorage.getItem(STORAGE_CLOUD_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CloudProfile>;
      const validCode = parsed.syncCode ? normalizeSyncCode(parsed.syncCode) : null;
      if (validCode) {
        return {
          syncCode: validCode,
          userId: typeof parsed.userId === 'string' ? parsed.userId : '',
          displayName:
            typeof parsed.displayName === 'string' && parsed.displayName.trim().length >= 2
              ? parsed.displayName.trim()
              : 'Peserta CPNS',
          lastSyncedAt: typeof parsed.lastSyncedAt === 'string' ? parsed.lastSyncedAt : null,
        };
      }
    }
  } catch {
    // ignore storage read error
  }

  const fresh: CloudProfile = {
    syncCode: generateSyncCode(),
    userId: '',
    displayName: 'Peserta CPNS',
    lastSyncedAt: null,
  };
  saveCloudProfile(fresh);
  return fresh;
}

export function saveCloudProfile(profile: CloudProfile): void {
  try {
    localStorage.setItem(STORAGE_CLOUD_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage quota errors
  }
}

export function toCloudAttemptPayload(attempt: ExamAttempt) {
  const ev = summarizeAttempt(attempt);
  return {
    id: attempt.id,
    packageId: attempt.packageId,
    packageTitle: attempt.packageTitle,
    isFullSimulation: attempt.isFullSimulation,
    formationId: attempt.formationId,
    startedAt: attempt.startedAt,
    finishedAt: attempt.finishedAt,
    elapsedSeconds: attempt.elapsedSeconds,
    allocatedSeconds: attempt.allocatedSeconds,
    twkScore: ev.subtests.TWK.score,
    tiuScore: ev.subtests.TIU.score,
    tkpScore: ev.subtests.TKP.score,
    totalScore: ev.totalScore,
    maxScore: ev.maxTotalScore,
    passed: ev.passed,
    answers: attempt.answers,
    flaggedIds: attempt.flaggedIds,
  };
}

export function rehydrateCloudAttempt(dto: CloudAttemptDto): ExamAttempt | null {
  const pkg = getPackageById(dto.packageId);
  if (!pkg) return null;
  return {
    id: dto.id,
    packageId: pkg.id,
    packageTitle: dto.packageTitle || pkg.title,
    isFullSimulation: pkg.isFullSimulation,
    formationId: dto.formationId,
    startedAt: dto.startedAt,
    finishedAt: dto.finishedAt,
    elapsedSeconds: dto.elapsedSeconds,
    allocatedSeconds: dto.allocatedSeconds,
    answers: dto.answers ?? {},
    flaggedIds: Array.isArray(dto.flaggedIds) ? dto.flaggedIds : [],
    questions: pkg.questions,
  };
}

export async function syncWithCloud(
  syncCode: string,
  payload: SyncPayload,
): Promise<SyncResponse | null> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Code': syncCode,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SyncResponse;
    return data.ok ? data : null;
  } catch {
    return null;
  }
}

export async function postFinishedAttempt(
  syncCode: string,
  displayName: string,
  attempt: ExamAttempt,
): Promise<{ attemptId: string; rankInfo: RankInfo } | null> {
  try {
    const res = await fetch('/api/attempts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Code': syncCode,
      },
      body: JSON.stringify({
        displayName,
        attempt: toCloudAttemptPayload(attempt),
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      ok: boolean;
      attemptId: string;
      rankInfo: RankInfo;
    };
    return data.ok ? { attemptId: data.attemptId, rankInfo: data.rankInfo } : null;
  } catch {
    return null;
  }
}

export async function clearCloudAttempts(syncCode: string): Promise<boolean> {
  try {
    const res = await fetch('/api/attempts', {
      method: 'DELETE',
      headers: {
        'X-Sync-Code': syncCode,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchPublicAttempt(attemptId: string): Promise<PublicAttemptResponse | null> {
  try {
    const res = await fetch(`/api/attempts/${encodeURIComponent(attemptId)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as PublicAttemptResponse;
    return data.ok ? data : null;
  } catch {
    return null;
  }
}

export async function fetchLeaderboard(
  packageId: string,
  syncCode?: string,
  limit = 25,
): Promise<LeaderboardResponse | null> {
  try {
    const headers: Record<string, string> = {};
    if (syncCode) {
      headers['X-Sync-Code'] = syncCode;
    }
    const res = await fetch(
      `/api/leaderboard?packageId=${encodeURIComponent(packageId)}&limit=${limit}`,
      { headers },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as LeaderboardResponse;
    return data.ok ? data : null;
  } catch {
    return null;
  }
}

import type { D1Database, Env } from './types';

const SYNC_CODE_REGEX = /^SKD-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
const VALID_FORMATIONS = new Set(['umum', 'cumlaude', 'khusus']);
const VALID_MODULES = new Set([
  'modul-regulasi',
  'modul-twk',
  'modul-tiu',
  'modul-tkp',
  'modul-drive',
]);

interface UserRow {
  id: string;
  sync_hash: string;
  display_name: string;
  selected_formation: string;
  completed_modules_json: string;
  active_session_json: string | null;
  created_at: string;
  updated_at: string;
}

interface AttemptRow {
  id: string;
  user_id: string;
  display_name: string;
  package_id: string;
  package_title: string;
  is_full_simulation: number;
  formation_id: string;
  started_at: string;
  finished_at: string;
  elapsed_seconds: number;
  allocated_seconds: number;
  twk_score: number;
  tiu_score: number;
  tkp_score: number;
  total_score: number;
  max_score: number;
  passed: number;
  answers_json: string;
  flagged_json: string;
}

interface BestScoreRow {
  package_id: string;
  user_id: string;
  attempt_id: string;
  display_name: string;
  formation_id: string;
  twk_score: number;
  tiu_score: number;
  tkp_score: number;
  total_score: number;
  max_score: number;
  passed: number;
  elapsed_seconds: number;
  finished_at: string;
  attempts_count: number;
}

interface IncomingAttempt {
  id: string;
  packageId: string;
  packageTitle: string;
  isFullSimulation: boolean;
  formationId: string;
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
  answers: Record<string, string>;
  flaggedIds: string[];
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ ok: false, error: message }, status);
}

async function authenticateSyncCode(
  rawHeader: string | null,
): Promise<{ userId: string; syncHash: string } | null> {
  if (!rawHeader) return null;
  const normalized = rawHeader.trim().toUpperCase();
  if (!SYNC_CODE_REGEX.test(normalized)) {
    return null;
  }
  const encoded = new TextEncoder().encode(`cpns-v1:${normalized}`);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const bytes = new Uint8Array(digest);
  const syncHash = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return {
    userId: `usr_${syncHash.slice(0, 16)}`,
    syncHash,
  };
}

function sanitizeDisplayName(raw: unknown): string {
  if (typeof raw !== 'string') return 'Peserta CPNS';
  const cleaned = raw
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32);
  return cleaned.length >= 2 ? cleaned : 'Peserta CPNS';
}

function sanitizeFormation(raw: unknown): string {
  return typeof raw === 'string' && VALID_FORMATIONS.has(raw) ? raw : 'umum';
}

function sanitizeModules(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item === 'string' && VALID_MODULES.has(item)) {
      seen.add(item);
    }
  }
  return Array.from(seen);
}

function parseModulesJson(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    return sanitizeModules(JSON.parse(raw));
  } catch {
    return [];
  }
}

function sanitizeActiveSession(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (
    typeof obj.packageId !== 'string' ||
    typeof obj.packageTitle !== 'string' ||
    typeof obj.startedAt !== 'string' ||
    typeof obj.allocatedSeconds !== 'number' ||
    typeof obj.remainingSeconds !== 'number'
  ) {
    return null;
  }
  const serialized = JSON.stringify({
    packageId: obj.packageId.slice(0, 80),
    packageTitle: obj.packageTitle.slice(0, 140),
    isFullSimulation: Boolean(obj.isFullSimulation),
    formationId: sanitizeFormation(obj.formationId),
    startedAt: obj.startedAt.slice(0, 40),
    allocatedSeconds: Math.max(60, Math.min(36000, Math.round(obj.allocatedSeconds))),
    remainingSeconds: Math.max(0, Math.min(36000, Math.round(obj.remainingSeconds))),
    currentIndex:
      typeof obj.currentIndex === 'number' && Number.isFinite(obj.currentIndex)
        ? Math.max(0, Math.round(obj.currentIndex))
        : 0,
    answers:
      obj.answers && typeof obj.answers === 'object' && !Array.isArray(obj.answers)
        ? obj.answers
        : {},
    flaggedIds: Array.isArray(obj.flaggedIds)
      ? obj.flaggedIds.filter((x): x is string => typeof x === 'string').slice(0, 200)
      : [],
  });
  return serialized.length <= 32768 ? serialized : null;
}

function parseJsonSafe<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, Math.round(val)));
}

function validateIncomingAttempt(raw: unknown): IncomingAttempt | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.id !== 'string' ||
    !/^[A-Za-z0-9_-]{4,80}$/.test(o.id) ||
    typeof o.packageId !== 'string' ||
    o.packageId.trim().length === 0 ||
    o.packageId.length > 80 ||
    typeof o.packageTitle !== 'string' ||
    o.packageTitle.trim().length === 0 ||
    o.packageTitle.length > 140
  ) {
    return null;
  }

  const answersObj =
    o.answers && typeof o.answers === 'object' && !Array.isArray(o.answers)
      ? (o.answers as Record<string, string>)
      : {};
  const flaggedArr = Array.isArray(o.flaggedIds)
    ? o.flaggedIds.filter((x): x is string => typeof x === 'string').slice(0, 200)
    : [];

  return {
    id: o.id,
    packageId: o.packageId.trim(),
    packageTitle: o.packageTitle.trim(),
    isFullSimulation: Boolean(o.isFullSimulation),
    formationId: sanitizeFormation(o.formationId),
    startedAt: typeof o.startedAt === 'string' ? o.startedAt.slice(0, 40) : new Date().toISOString(),
    finishedAt:
      typeof o.finishedAt === 'string' ? o.finishedAt.slice(0, 40) : new Date().toISOString(),
    elapsedSeconds: clampInt(o.elapsedSeconds, 1, 36000, 1),
    allocatedSeconds: clampInt(o.allocatedSeconds, 60, 36000, 6000),
    twkScore: clampInt(o.twkScore, 0, 350, 0),
    tiuScore: clampInt(o.tiuScore, 0, 350, 0),
    tkpScore: clampInt(o.tkpScore, 0, 350, 0),
    totalScore: clampInt(o.totalScore, 0, 700, 0),
    maxScore: clampInt(o.maxScore, 5, 700, 550),
    passed: Boolean(o.passed),
    answers: answersObj,
    flaggedIds: flaggedArr,
  };
}

async function upsertAttemptAndBest(
  db: D1Database,
  userId: string,
  displayName: string,
  item: IncomingAttempt,
): Promise<boolean> {
  const answersJson = JSON.stringify(item.answers);
  const flaggedJson = JSON.stringify(item.flaggedIds);
  if (answersJson.length > 32768 || flaggedJson.length > 8192) {
    return false;
  }

  const insertResult = await db
    .prepare(
      `INSERT INTO exam_attempts (
        id, user_id, display_name, package_id, package_title,
        is_full_simulation, formation_id, started_at, finished_at,
        elapsed_seconds, allocated_seconds,
        twk_score, tiu_score, tkp_score, total_score, max_score, passed,
        answers_json, flagged_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING`,
    )
    .bind(
      item.id,
      userId,
      displayName,
      item.packageId,
      item.packageTitle,
      item.isFullSimulation ? 1 : 0,
      item.formationId,
      item.startedAt,
      item.finishedAt,
      item.elapsedSeconds,
      item.allocatedSeconds,
      item.twkScore,
      item.tiuScore,
      item.tkpScore,
      item.totalScore,
      item.maxScore,
      item.passed ? 1 : 0,
      answersJson,
      flaggedJson,
    )
    .run();

  const insertedNew = (insertResult.meta?.changes ?? 0) > 0;
  if (!insertedNew) {
    return false;
  }

  await db
    .prepare(
      `INSERT INTO package_best_scores (
        package_id, user_id, attempt_id, display_name, formation_id,
        twk_score, tiu_score, tkp_score, total_score, max_score,
        passed, elapsed_seconds, finished_at, attempts_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(package_id, user_id) DO UPDATE SET
        attempts_count = package_best_scores.attempts_count + 1,
        display_name = excluded.display_name,
        attempt_id = CASE
          WHEN excluded.total_score > package_best_scores.total_score
            OR (excluded.total_score = package_best_scores.total_score
                AND excluded.elapsed_seconds < package_best_scores.elapsed_seconds)
          THEN excluded.attempt_id ELSE package_best_scores.attempt_id END,
        formation_id = CASE
          WHEN excluded.total_score > package_best_scores.total_score
            OR (excluded.total_score = package_best_scores.total_score
                AND excluded.elapsed_seconds < package_best_scores.elapsed_seconds)
          THEN excluded.formation_id ELSE package_best_scores.formation_id END,
        twk_score = CASE
          WHEN excluded.total_score > package_best_scores.total_score
            OR (excluded.total_score = package_best_scores.total_score
                AND excluded.elapsed_seconds < package_best_scores.elapsed_seconds)
          THEN excluded.twk_score ELSE package_best_scores.twk_score END,
        tiu_score = CASE
          WHEN excluded.total_score > package_best_scores.total_score
            OR (excluded.total_score = package_best_scores.total_score
                AND excluded.elapsed_seconds < package_best_scores.elapsed_seconds)
          THEN excluded.tiu_score ELSE package_best_scores.tiu_score END,
        tkp_score = CASE
          WHEN excluded.total_score > package_best_scores.total_score
            OR (excluded.total_score = package_best_scores.total_score
                AND excluded.elapsed_seconds < package_best_scores.elapsed_seconds)
          THEN excluded.tkp_score ELSE package_best_scores.tkp_score END,
        total_score = CASE
          WHEN excluded.total_score > package_best_scores.total_score
          THEN excluded.total_score ELSE package_best_scores.total_score END,
        max_score = excluded.max_score,
        passed = CASE
          WHEN excluded.total_score > package_best_scores.total_score
            OR (excluded.total_score = package_best_scores.total_score
                AND excluded.elapsed_seconds < package_best_scores.elapsed_seconds)
          THEN excluded.passed ELSE package_best_scores.passed END,
        elapsed_seconds = CASE
          WHEN excluded.total_score > package_best_scores.total_score
            OR (excluded.total_score = package_best_scores.total_score
                AND excluded.elapsed_seconds < package_best_scores.elapsed_seconds)
          THEN excluded.elapsed_seconds ELSE package_best_scores.elapsed_seconds END,
        finished_at = CASE
          WHEN excluded.total_score > package_best_scores.total_score
            OR (excluded.total_score = package_best_scores.total_score
                AND excluded.elapsed_seconds < package_best_scores.elapsed_seconds)
          THEN excluded.finished_at ELSE package_best_scores.finished_at END`,
    )
    .bind(
      item.packageId,
      userId,
      item.id,
      displayName,
      item.formationId,
      item.twkScore,
      item.tiuScore,
      item.tkpScore,
      item.totalScore,
      item.maxScore,
      item.passed ? 1 : 0,
      item.elapsedSeconds,
      item.finishedAt,
    )
    .run();

  return true;
}

function serializeAttemptRow(row: AttemptRow) {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    packageId: row.package_id,
    packageTitle: row.package_title,
    isFullSimulation: row.is_full_simulation === 1,
    formationId: sanitizeFormation(row.formation_id),
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    elapsedSeconds: row.elapsed_seconds,
    allocatedSeconds: row.allocated_seconds,
    twkScore: row.twk_score,
    tiuScore: row.tiu_score,
    tkpScore: row.tkp_score,
    totalScore: row.total_score,
    maxScore: row.max_score,
    passed: row.passed === 1,
    answers: parseJsonSafe<Record<string, string>>(row.answers_json, {}),
    flaggedIds: parseJsonSafe<string[]>(row.flagged_json, []),
  };
}

async function computeRankInfo(
  db: D1Database,
  packageId: string,
  totalScore: number,
  elapsedSeconds: number,
): Promise<{ rank: number; totalParticipants: number }> {
  const rankRow = await db
    .prepare(
      `SELECT COUNT(*) + 1 AS rank FROM package_best_scores
       WHERE package_id = ?
         AND (total_score > ? OR (total_score = ? AND elapsed_seconds < ?))`,
    )
    .bind(packageId, totalScore, totalScore, elapsedSeconds)
    .first<{ rank: number }>();

  const totalRow = await db
    .prepare(`SELECT COUNT(*) AS total FROM package_best_scores WHERE package_id = ?`)
    .bind(packageId)
    .first<{ total: number }>();

  const totalParticipants = Math.max(1, totalRow?.total ?? 1);
  return {
    rank: Math.min(totalParticipants, Math.max(1, rankRow?.rank ?? 1)),
    totalParticipants,
  };
}

async function handleSync(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateSyncCode(request.headers.get('X-Sync-Code'));
  if (!auth) {
    return errorResponse('Header X-Sync-Code tidak valid atau kosong.', 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse('Payload JSON tidak valid.', 400);
  }

  const now = new Date().toISOString();
  const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(auth.userId)
    .first<UserRow>();

  const hasExplicitDisplayName = typeof body.displayName === 'string' && body.displayName.trim().length >= 2;
  const requestedName = sanitizeDisplayName(body.displayName);
  const explicitProfileUpdate = Boolean(body.explicitProfileUpdate);

  const requestedFormation = sanitizeFormation(body.selectedFormation);
  const replaceFormation = Boolean(body.replaceFormation);

  const clientModules = sanitizeModules(body.completedModules);
  const replaceModules = Boolean(body.replaceModules);

  const updateActiveSession = Boolean(body.updateActiveSession);
  const sanitizedIncomingSession = sanitizeActiveSession(body.activeSession);

  let finalName = requestedName;
  let finalFormation = requestedFormation;
  let finalModules = clientModules;
  let finalActiveSessionJson: string | null = sanitizedIncomingSession;

  if (!existing) {
    await env.DB.prepare(
      `INSERT INTO users (
        id, sync_hash, display_name, selected_formation,
        completed_modules_json, active_session_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        auth.userId,
        auth.syncHash,
        finalName,
        finalFormation,
        JSON.stringify(finalModules),
        finalActiveSessionJson,
        now,
        now,
      )
      .run();
  } else {
    if (explicitProfileUpdate && hasExplicitDisplayName) {
      finalName = requestedName;
    } else if (existing.display_name === 'Peserta CPNS' && requestedName !== 'Peserta CPNS') {
      finalName = requestedName;
    } else {
      finalName = existing.display_name;
    }

    finalFormation = replaceFormation
      ? requestedFormation
      : sanitizeFormation(existing.selected_formation);

    const existingModules = parseModulesJson(existing.completed_modules_json);
    if (replaceModules) {
      finalModules = clientModules;
    } else {
      finalModules = Array.from(new Set([...existingModules, ...clientModules]));
    }

    if (updateActiveSession) {
      finalActiveSessionJson = sanitizedIncomingSession;
    } else if (sanitizedIncomingSession !== null) {
      finalActiveSessionJson = sanitizedIncomingSession;
    } else {
      finalActiveSessionJson = existing.active_session_json;
    }

    await env.DB.prepare(
      `UPDATE users
       SET display_name = ?,
           selected_formation = ?,
           completed_modules_json = ?,
           active_session_json = ?,
           updated_at = ?
       WHERE id = ?`,
    )
      .bind(
        finalName,
        finalFormation,
        JSON.stringify(finalModules),
        finalActiveSessionJson,
        now,
        auth.userId,
      )
      .run();

    if (finalName !== existing.display_name) {
      await env.DB.batch([
        env.DB.prepare('UPDATE exam_attempts SET display_name = ? WHERE user_id = ?').bind(
          finalName,
          auth.userId,
        ),
        env.DB.prepare('UPDATE package_best_scores SET display_name = ? WHERE user_id = ?').bind(
          finalName,
          auth.userId,
        ),
      ]);
    }
  }

  const rawAttempts = Array.isArray(body.attempts) ? body.attempts.slice(0, 50) : [];
  for (const rawAttempt of rawAttempts) {
    const valid = validateIncomingAttempt(rawAttempt);
    if (valid) {
      await upsertAttemptAndBest(env.DB, auth.userId, finalName, valid);
    }
  }

  const attemptsResult = await env.DB.prepare(
    `SELECT * FROM exam_attempts WHERE user_id = ? ORDER BY finished_at DESC LIMIT 50`,
  )
    .bind(auth.userId)
    .all<AttemptRow>();

  return jsonResponse({
    ok: true,
    profile: {
      userId: auth.userId,
      displayName: finalName,
      selectedFormation: finalFormation,
      completedModules: finalModules,
      activeSession: parseJsonSafe(finalActiveSessionJson, null),
      updatedAt: now,
    },
    attempts: (attemptsResult.results ?? []).map(serializeAttemptRow),
  });
}

async function handlePostAttempt(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateSyncCode(request.headers.get('X-Sync-Code'));
  if (!auth) {
    return errorResponse('Header X-Sync-Code tidak valid atau kosong.', 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse('Payload JSON tidak valid.', 400);
  }

  const attempt = validateIncomingAttempt(body.attempt ?? body);
  if (!attempt) {
    return errorResponse('Data hasil ujian tidak lengkap atau tidak valid.', 400);
  }

  const now = new Date().toISOString();
  const existing = await env.DB.prepare('SELECT id, display_name FROM users WHERE id = ?')
    .bind(auth.userId)
    .first<{ id: string; display_name: string }>();

  const requestedName = sanitizeDisplayName(body.displayName);
  const finalName = !existing
    ? requestedName
    : existing.display_name === 'Peserta CPNS' && requestedName !== 'Peserta CPNS'
      ? requestedName
      : existing.display_name;

  if (!existing) {
    await env.DB.prepare(
      `INSERT INTO users (
        id, sync_hash, display_name, selected_formation,
        completed_modules_json, active_session_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, '[]', NULL, ?, ?)`,
    )
      .bind(auth.userId, auth.syncHash, finalName, attempt.formationId, now, now)
      .run();
  } else {
    await env.DB.prepare(
      `UPDATE users SET active_session_json = NULL, display_name = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(finalName, now, auth.userId)
      .run();
  }

  await upsertAttemptAndBest(env.DB, auth.userId, finalName, attempt);

  const userBest = await env.DB.prepare(
    `SELECT total_score, elapsed_seconds FROM package_best_scores
     WHERE package_id = ? AND user_id = ?`,
  )
    .bind(attempt.packageId, auth.userId)
    .first<{ total_score: number; elapsed_seconds: number }>();

  const rankInfo = await computeRankInfo(
    env.DB,
    attempt.packageId,
    userBest?.total_score ?? attempt.totalScore,
    userBest?.elapsed_seconds ?? attempt.elapsedSeconds,
  );

  return jsonResponse({
    ok: true,
    attemptId: attempt.id,
    rankInfo,
  });
}

async function handleDeleteAttempts(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateSyncCode(request.headers.get('X-Sync-Code'));
  if (!auth) {
    return errorResponse('Header X-Sync-Code tidak valid atau kosong.', 401);
  }

  await env.DB.batch([
    env.DB.prepare('DELETE FROM exam_attempts WHERE user_id = ?').bind(auth.userId),
    env.DB.prepare('DELETE FROM package_best_scores WHERE user_id = ?').bind(auth.userId),
  ]);

  return jsonResponse({ ok: true });
}

async function handleGetAttemptById(attemptId: string, env: Env): Promise<Response> {
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(attemptId)) {
    return errorResponse('ID riwayat tidak valid.', 400);
  }

  const row = await env.DB.prepare('SELECT * FROM exam_attempts WHERE id = ?')
    .bind(attemptId)
    .first<AttemptRow>();

  if (!row) {
    return errorResponse('Rapor hasil ujian tidak ditemukan.', 404);
  }

  const rankInfo = await computeRankInfo(
    env.DB,
    row.package_id,
    row.total_score,
    row.elapsed_seconds,
  );

  return jsonResponse({
    ok: true,
    attempt: serializeAttemptRow(row),
    rankInfo,
  });
}

async function handleGetLeaderboard(request: Request, url: URL, env: Env): Promise<Response> {
  const packageId = url.searchParams.get('packageId')?.trim();
  if (!packageId || packageId.length > 80) {
    return errorResponse('Parameter packageId wajib diisi.', 400);
  }

  const rawLimit = Number(url.searchParams.get('limit') ?? '25');
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(50, Math.round(rawLimit))) : 25;

  const auth = await authenticateSyncCode(request.headers.get('X-Sync-Code'));
  const callerUserId = auth?.userId ?? null;

  const summaryRow = await env.DB.prepare(
    `SELECT
       COUNT(*) AS totalParticipants,
       COALESCE(MAX(total_score), 0) AS topScore,
       ROUND(COALESCE(AVG(total_score), 0)) AS avgScore,
       COALESCE(SUM(passed), 0) AS passedCount
     FROM package_best_scores
     WHERE package_id = ?`,
  )
    .bind(packageId)
    .first<{
      totalParticipants: number;
      topScore: number;
      avgScore: number;
      passedCount: number;
    }>();

  const entriesResult = await env.DB.prepare(
    `SELECT * FROM package_best_scores
     WHERE package_id = ?
     ORDER BY total_score DESC, elapsed_seconds ASC, finished_at ASC
     LIMIT ?`,
  )
    .bind(packageId, limit)
    .all<BestScoreRow>();

  const toEntry = (row: BestScoreRow, rank: number) => ({
    rank,
    userId: row.user_id,
    attemptId: row.attempt_id,
    displayName: row.display_name,
    formationId: sanitizeFormation(row.formation_id),
    twkScore: row.twk_score,
    tiuScore: row.tiu_score,
    tkpScore: row.tkp_score,
    totalScore: row.total_score,
    maxScore: row.max_score,
    passed: row.passed === 1,
    elapsedSeconds: row.elapsed_seconds,
    finishedAt: row.finished_at,
    attemptsCount: row.attempts_count,
    isMe: callerUserId !== null && row.user_id === callerUserId,
  });

  const entries = (entriesResult.results ?? []).map((row, idx) => toEntry(row, idx + 1));

  let myEntry = entries.find((e) => e.isMe) ?? null;
  if (!myEntry && callerUserId) {
    const myRow = await env.DB.prepare(
      `SELECT * FROM package_best_scores WHERE package_id = ? AND user_id = ?`,
    )
      .bind(packageId, callerUserId)
      .first<BestScoreRow>();
    if (myRow) {
      const rankRow = await env.DB.prepare(
        `SELECT COUNT(*) + 1 AS rank FROM package_best_scores
         WHERE package_id = ?
           AND (total_score > ? OR (total_score = ? AND elapsed_seconds < ?))`,
      )
        .bind(packageId, myRow.total_score, myRow.total_score, myRow.elapsed_seconds)
        .first<{ rank: number }>();
      myEntry = toEntry(myRow, Math.max(1, rankRow?.rank ?? 1));
    }
  }

  return jsonResponse({
    ok: true,
    packageId,
    summary: {
      totalParticipants: summaryRow?.totalParticipants ?? 0,
      topScore: summaryRow?.topScore ?? 0,
      avgScore: summaryRow?.avgScore ?? 0,
      passedCount: summaryRow?.passedCount ?? 0,
    },
    entries,
    myEntry,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (!pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    try {
      if (pathname === '/api/health' && request.method === 'GET') {
        return jsonResponse({ ok: true, service: 'cpns-d1-api' });
      }
      if (pathname === '/api/sync' && request.method === 'POST') {
        return await handleSync(request, env);
      }
      if (pathname === '/api/attempts' && request.method === 'POST') {
        return await handlePostAttempt(request, env);
      }
      if (pathname === '/api/attempts' && request.method === 'DELETE') {
        return await handleDeleteAttempts(request, env);
      }
      if (pathname.startsWith('/api/attempts/') && request.method === 'GET') {
        const attemptId = decodeURIComponent(pathname.slice('/api/attempts/'.length));
        return await handleGetAttemptById(attemptId, env);
      }
      if (pathname === '/api/leaderboard' && request.method === 'GET') {
        return await handleGetLeaderboard(request, url, env);
      }
      return errorResponse('Endpoint API tidak ditemukan.', 404);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Internal server error';
      return errorResponse(msg, 500);
    }
  },
};

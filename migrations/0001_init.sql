CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  sync_hash TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Peserta CPNS',
  selected_formation TEXT NOT NULL DEFAULT 'umum',
  completed_modules_json TEXT NOT NULL DEFAULT '[]',
  active_session_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_sync_hash ON users(sync_hash);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  package_id TEXT NOT NULL,
  package_title TEXT NOT NULL,
  is_full_simulation INTEGER NOT NULL DEFAULT 1,
  formation_id TEXT NOT NULL DEFAULT 'umum',
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  elapsed_seconds INTEGER NOT NULL,
  allocated_seconds INTEGER NOT NULL,
  twk_score INTEGER NOT NULL DEFAULT 0,
  tiu_score INTEGER NOT NULL DEFAULT 0,
  tkp_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 550,
  passed INTEGER NOT NULL DEFAULT 0,
  answers_json TEXT NOT NULL DEFAULT '{}',
  flagged_json TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_finished
  ON exam_attempts(user_id, finished_at DESC);

CREATE TABLE IF NOT EXISTS package_best_scores (
  package_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  attempt_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  formation_id TEXT NOT NULL DEFAULT 'umum',
  twk_score INTEGER NOT NULL DEFAULT 0,
  tiu_score INTEGER NOT NULL DEFAULT 0,
  tkp_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 550,
  passed INTEGER NOT NULL DEFAULT 0,
  elapsed_seconds INTEGER NOT NULL,
  finished_at TEXT NOT NULL,
  attempts_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (package_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_best_pkg_rank
  ON package_best_scores(package_id, total_score DESC, elapsed_seconds ASC);

CREATE INDEX IF NOT EXISTS idx_best_user
  ON package_best_scores(user_id);

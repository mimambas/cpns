import React, { useEffect, useState } from 'react';
import type { LeaderboardResponse, QuestionPackage } from '../types';
import { ALL_PACKAGES, getPackageById } from '../data/questionBank';
import { FORMATION_RULES, formatDurationText } from '../utils/scoring';
import { fetchLeaderboard } from '../utils/cloudSync';
import { buildExamHubPath, buildHistoryPath, buildLeaderboardPath, shouldHandleClientClick } from '../utils/router';
import { CheckCircleIcon, TrophyIcon } from './Icons';

interface LeaderboardViewProps {
  selectedPackageId: string;
  onSelectPackage?: (packageId: string) => void;
  currentUserId: string;
  syncCode: string;
  onStartPackage?: (pkg: QuestionPackage) => void;
  onOpenAttempt?: (attemptId: string) => void;
  embedded?: boolean;
  onOpenFullLeaderboard?: (packageId: string) => void;
  refreshKey?: string;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  selectedPackageId,
  onSelectPackage,
  currentUserId,
  syncCode,
  onStartPackage,
  onOpenAttempt,
  embedded = false,
  onOpenFullLeaderboard,
  refreshKey = '',
}) => {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const activePkg = getPackageById(selectedPackageId) ?? ALL_PACKAGES[0];
  const selectPackages = ALL_PACKAGES.some((p) => p.id === activePkg.id)
    ? ALL_PACKAGES
    : [activePkg, ...ALL_PACKAGES];
  const limit = embedded ? 10 : 25;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchLeaderboard(activePkg.id, syncCode, limit).then((res) => {
      if (cancelled) return;
      if (res) {
        setData(res);
      } else {
        setError(true);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activePkg.id, syncCode, limit, reloadTick, refreshKey]);

  const summary = data?.summary;
  const entries = data?.entries ?? [];
  const myEntry = data?.myEntry ?? null;
  const passPct =
    summary && summary.totalParticipants > 0
      ? Math.round((summary.passedCount / summary.totalParticipants) * 100)
      : 0;

  return (
    <section className="stack-300" aria-label="Papan peringkat simulasi CAT">
      {/* Header / Package Selector */}
      {!embedded ? (
        <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
          <div className="stack-200" style={{ gap: '4px', flex: 1, minWidth: '240px' }}>
            <h1 className="h-xlarge">Papan peringkat nasional per paket</h1>
            <p className="body text-subtle">
              Peringkat diurutkan berdasarkan skor terbaik tertinggi dan waktu pengerjaan tercepat setiap peserta.
            </p>
          </div>

          <div className="row-wrap" style={{ gap: '8px' }}>
            <select
              id="leaderboard-package-select"
              aria-label="Pilih paket peringkat"
              className="select-input"
              style={{ maxWidth: '340px' }}
              value={activePkg.id}
              onChange={(e) => onSelectPackage?.(e.target.value)}
            >
              {selectPackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title} ({pkg.questions.length} soal)
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn"
              onClick={() => setReloadTick((t) => t + 1)}
            >
              Muat ulang
            </button>
          </div>
        </div>
      ) : (
        <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
          <div className="row-wrap" style={{ gap: '8px' }}>
            <TrophyIcon size={18} />
            <h2 className="h-medium">Peringkat peserta paket ini (Top 10)</h2>
          </div>

          {onOpenFullLeaderboard && (
            <a
              href={buildLeaderboardPath(activePkg.id)}
              className="btn btn-compact"
              onClick={(e) => {
                if (!shouldHandleClientClick(e)) return;
                e.preventDefault();
                onOpenFullLeaderboard(activePkg.id);
              }}
            >
              Lihat semua peringkat
            </a>
          )}
        </div>
      )}

      {/* Personal Rank Banner */}
      {myEntry && (
        <div className="section-message section-message-info" role="status">
          <span className="section-message-icon">
            <TrophyIcon size={18} />
          </span>
          <div className="section-message-content">
            <h3 className="h-small">
              Peringkat terbaik Anda: #{myEntry.rank} dari {summary?.totalParticipants ?? 1} peserta
            </h3>
            <p className="section-message-body">
              Nama tampil: <strong>{myEntry.displayName}</strong> · Skor terbaik{' '}
              <span className="mono">{myEntry.totalScore}/{myEntry.maxScore}</span> (TWK {myEntry.twkScore} · TIU {myEntry.tiuScore} · TKP {myEntry.tkpScore}) ·{' '}
              {myEntry.attemptsCount}x percobaan.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid-4">
          <div className="kpi-card">
            <span className="body-small">Total peserta</span>
            <div className="metric-medium mono">{summary.totalParticipants}</div>
            <span className="body-small">{activePkg.compositionLabel}</span>
          </div>
          <div className="kpi-card">
            <span className="body-small">Skor tertinggi</span>
            <div className="metric-medium mono">
              {summary.topScore}{' '}
              <span className="body-small">/ {activePkg.questions.length * 5}</span>
            </div>
            <span className="body-small">Rekor paket ini</span>
          </div>
          <div className="kpi-card">
            <span className="body-small">Rata-rata peserta</span>
            <div className="metric-medium mono">{summary.avgScore}</div>
            <span className="body-small">Poin akumulasi SKD</span>
          </div>
          <div className="kpi-card">
            <span className="body-small">Lulus passing grade</span>
            <div className="metric-medium mono">{passPct}%</div>
            <span className="body-small">{summary.passedCount} peserta memenuhi PG</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="card">
          <p className="body text-subtle">Memuat papan peringkat dari Cloudflare D1...</p>
        </div>
      )}

      {!loading && error && (
        <div className="section-message section-message-warning">
          <div className="section-message-content row-wrap" style={{ justifyContent: 'space-between', width: '100%' }}>
            <p className="section-message-body">
              Tidak dapat memuat papan peringkat saat ini. Periksa koneksi lalu coba lagi.
            </p>
            <button
              type="button"
              className="btn btn-compact"
              onClick={() => setReloadTick((t) => t + 1)}
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="card stack-200" style={{ alignItems: 'flex-start' }}>
          <h3 className="h-small">Belum ada peserta pada paket ini</h3>
          <p className="body text-subtle">
            Selesaikan paket <strong>{activePkg.title}</strong> untuk mencatat skor pertama Anda di papan peringkat.
          </p>
          {onStartPackage && (
            <a
              href={buildExamHubPath(activePkg.id)}
              className="btn btn-primary"
              onClick={(e) => {
                if (!shouldHandleClientClick(e)) return;
                e.preventDefault();
                onStartPackage(activePkg);
              }}
            >
              Kerjakan paket ini sekarang
            </a>
          )}
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          {/* Mobile Leaderboard Cards */}
          <div className="history-mobile-list">
            {entries.map((entry) => {
              const isMe = entry.isMe || (currentUserId !== '' && entry.userId === currentUserId);
              const reportPath = buildHistoryPath(entry.attemptId);
              return (
                <article
                  key={`${entry.userId}-${entry.attemptId}`}
                  className="card stack-200"
                  data-me={isMe}
                >
                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <div className="row-wrap" style={{ gap: '8px' }}>
                      <span
                        className={`lozenge mono ${
                          entry.rank <= 3 ? 'lozenge-info' : ''
                        }`}
                      >
                        #{entry.rank}
                      </span>
                      <strong>{entry.displayName}</strong>
                      {isMe && <span className="lozenge lozenge-info">Anda</span>}
                    </div>
                    <span
                      className={`lozenge ${
                        entry.passed ? 'lozenge-success' : 'lozenge-danger'
                      }`}
                    >
                      {entry.passed ? <CheckCircleIcon size={12} /> : null}
                      {entry.passed ? 'Lulus PG' : 'Belum PG'}
                    </span>
                  </div>

                  <div
                    className="well-sunken row-wrap"
                    style={{ justifyContent: 'space-between', padding: '10px 12px' }}
                  >
                    <div className="mono">
                      <strong style={{ fontSize: '18px' }}>{entry.totalScore}</strong>{' '}
                      <span className="body-small">/ {entry.maxScore}</span>
                    </div>
                    <span className="body-small mono">
                      TWK {entry.twkScore} · TIU {entry.tiuScore} · TKP {entry.tkpScore}
                    </span>
                  </div>

                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="body-small">
                      {FORMATION_RULES[entry.formationId]?.shortLabel ?? entry.formationId} ·{' '}
                      {formatDurationText(entry.elapsedSeconds)}
                    </span>
                    {onOpenAttempt && (
                      <a
                        href={reportPath}
                        className="btn btn-compact"
                        onClick={(e) => {
                          if (!shouldHandleClientClick(e)) return;
                          e.preventDefault();
                          onOpenAttempt(entry.attemptId);
                        }}
                      >
                        Lihat rapor
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop Leaderboard Table */}
          <div className="table-wrap history-desktop-table">
            <table className="ads-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama peserta</th>
                  <th>Skor total</th>
                  <th>Rincian subtes</th>
                  <th>Durasi</th>
                  <th>Status PG</th>
                  <th>Rapor</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isMe = entry.isMe || (currentUserId !== '' && entry.userId === currentUserId);
                  const reportPath = buildHistoryPath(entry.attemptId);
                  return (
                    <tr
                      key={`${entry.userId}-${entry.attemptId}`}
                      className={isMe ? 'leaderboard-row-me' : undefined}
                    >
                      <td className="mono">
                        <span
                          className={`lozenge ${entry.rank <= 3 ? 'lozenge-info' : ''}`}
                        >
                          #{entry.rank}
                        </span>
                      </td>
                      <td>
                        <div className="row-wrap" style={{ gap: '8px' }}>
                          <strong>{entry.displayName}</strong>
                          {isMe && <span className="lozenge lozenge-info">Anda</span>}
                        </div>
                        <div className="body-small">
                          {FORMATION_RULES[entry.formationId]?.shortLabel ?? entry.formationId} · {entry.attemptsCount}x percobaan
                        </div>
                      </td>
                      <td className="mono">
                        <strong>{entry.totalScore}</strong> / {entry.maxScore}
                      </td>
                      <td className="body-small mono">
                        TWK {entry.twkScore} · TIU {entry.tiuScore} · TKP {entry.tkpScore}
                      </td>
                      <td className="mono body-small">
                        {formatDurationText(entry.elapsedSeconds)}
                      </td>
                      <td>
                        <span
                          className={`lozenge ${
                            entry.passed ? 'lozenge-success' : 'lozenge-danger'
                          }`}
                        >
                          {entry.passed ? <CheckCircleIcon size={12} /> : null}
                          {entry.passed ? 'Lulus PG' : 'Belum lulus PG'}
                        </span>
                      </td>
                      <td>
                        {onOpenAttempt && (
                          <a
                            href={reportPath}
                            className="btn btn-compact"
                            onClick={(e) => {
                              if (!shouldHandleClientClick(e)) return;
                              e.preventDefault();
                              onOpenAttempt(entry.attemptId);
                            }}
                          >
                            Lihat rapor
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};

import React, { useMemo, useState } from 'react';
import type { ExamAttempt, FormationType, Question, QuestionCategory, RankInfo } from '../types';
import {
  FORMATION_RULES,
  evaluateExam,
  formatDateTimeId,
  formatDurationText,
  getQuestionScore,
} from '../utils/scoring';
import { exportResultToPdf } from '../utils/pdfExport';
import {
  buildAnalyticsPath,
  buildExamHubPath,
  buildHistoryPath,
  shouldHandleClientClick,
} from '../utils/router';
import { computeSubtopicAnalytics, getDrillPackageId } from '../utils/analytics';
import { getSubtopicQuestionCount } from '../data/questionBank';
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CrossCircleIcon,
  DownloadIcon,
  ExternalLinkIcon,
  GridIcon,
  InfoIcon,
  ListIcon,
  RadarIcon,
  TrophyIcon,
} from './Icons';
import { ShareLinkButton } from './ShareLinkButton';
import { LeaderboardView } from './LeaderboardView';

interface ResultViewProps {
  attempt: ExamAttempt;
  onUpdateFormation: (attemptId: string, formationId: FormationType) => void;
  onRetakePackage: (packageId: string) => void;
  onBackHome: () => void;
  isSharedAttempt?: boolean;
  sharedOwnerName?: string;
  rankInfo?: RankInfo | null;
  currentUserId?: string;
  syncCode?: string;
  onOpenLeaderboard?: (pkgId: string) => void;
  onOpenAttempt?: (attemptId: string) => void;
  onOpenAnalytics?: () => void;
}

type ReviewFilter = 'ALL' | QuestionCategory | 'IMPROVABLE' | 'UNANSWERED';
type ReviewMode = 'focus' | 'list';

const PAGE_SIZE = 10;

export const ResultView: React.FC<ResultViewProps> = ({
  attempt,
  onUpdateFormation,
  onRetakePackage,
  onBackHome,
  isSharedAttempt = false,
  sharedOwnerName,
  rankInfo,
  currentUserId = '',
  syncCode = '',
  onOpenLeaderboard,
  onOpenAttempt,
  onOpenAnalytics,
}) => {
  const [filter, setFilter] = useState<ReviewFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewMode, setReviewMode] = useState<ReviewMode>('focus');
  const [focusQuestionIndex, setFocusQuestionIndex] = useState(0);
  const [listPage, setListPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const evaluation = useMemo(
    () =>
      evaluateExam(
        attempt.questions,
        attempt.answers,
        attempt.formationId,
        attempt.isFullSimulation,
      ),
    [attempt],
  );

  const avgSecondsPerQuestion =
    attempt.questions.length > 0
      ? Math.round(attempt.elapsedSeconds / attempt.questions.length)
      : 0;

  const attemptSubtopics = useMemo(() => {
    const analytics = computeSubtopicAnalytics([attempt]);
    return (['TWK', 'TIU', 'TKP'] as const)
      .flatMap((cat) => analytics.clustersByCategory[cat])
      .filter((s) => s.totalSeen > 0)
      .sort((a, b) => a.masteryPct - b.masteryPct);
  }, [attempt]);

  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return attempt.questions.filter((q) => {
      const selected = attempt.answers[q.id];
      const earned = getQuestionScore(q, selected);
      if (filter === 'TWK' || filter === 'TIU' || filter === 'TKP') {
        if (q.category !== filter) return false;
      } else if (filter === 'IMPROVABLE') {
        if (earned >= 5) return false;
      } else if (filter === 'UNANSWERED') {
        if (selected) return false;
      }
      if (query) {
        const hay = `${q.number} ${q.subtopic} ${q.question} ${q.explanation}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [attempt, filter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const safePage = Math.min(listPage, totalPages);
  const paginatedQuestions = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, safePage]);

  const safeFocusIdx = Math.min(
    focusQuestionIndex,
    Math.max(0, attempt.questions.length - 1),
  );
  const focusedQuestion = attempt.questions[safeFocusIdx] ?? attempt.questions[0];

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      await exportResultToPdf(attempt, evaluation);
    } finally {
      setIsExporting(false);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setFocusQuestionIndex(index);
    setReviewMode('focus');
  };

  const renderQuestionCard = (q: Question) => {
    const userChoice = attempt.answers[q.id];
    const earned = getQuestionScore(q, userChoice);

    const scoreLozengeClass =
      earned === 5
        ? 'lozenge-success'
        : earned > 0
          ? 'lozenge-warning'
          : 'lozenge-danger';

    return (
      <article key={q.id} className="card stack-200">
        <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
          <div className="row-wrap" style={{ gap: '8px' }}>
            <span className="h-small">Soal #{q.number}</span>
            <span className="lozenge lozenge-info">{q.category}</span>
            <span className="body-small">{q.subtopic}</span>
          </div>

          <div className="row-wrap" style={{ gap: '8px' }}>
            <span className="body-small">
              Jawaban Anda: <strong>{userChoice ? userChoice : 'Kosong'}</strong>
            </span>
            <span className="body-small">
              Kunci poin 5: <strong>{q.correctOption}</strong>
            </span>
            <span className={`lozenge ${scoreLozengeClass}`}>+{earned} poin</span>
          </div>
        </div>

        <div className="question-stem">{q.question}</div>

        {q.figureUrl && (
          <div className="figure-box">
            <img
              width={560}
              height={220}
              src={q.figureUrl}
              alt={`Gambar soal nomor ${q.number}`}
              className="figure-img"
            />
          </div>
        )}

        {/* Options Breakdown */}
        <div className="stack-200" style={{ gap: '8px' }}>
          {q.options.map((opt) => {
            const isUser = userChoice === opt.key;
            const isBest = opt.key === q.correctOption;

            let highlight = '';
            if (isBest) {
              highlight = 'correct';
            } else if (isUser && opt.score === 0) {
              highlight = 'wrong';
            } else if (isUser) {
              highlight = 'user-selected';
            }

            return (
              <div
                key={opt.key}
                className="review-option"
                data-highlight={highlight}
              >
                <div className="body" style={{ flex: 1, minWidth: '220px' }}>
                  <strong>{opt.key}.</strong> {opt.text}
                </div>

                <div className="row-wrap" style={{ gap: '6px' }}>
                  {isUser && <span className="lozenge lozenge-info">Pilihan Anda</span>}
                  {isBest && (
                    <span className="lozenge lozenge-success">
                      <CheckCircleIcon size={12} />
                      {q.category === 'TKP' ? 'Poin 5 (tertinggi)' : 'Jawaban benar'}
                    </span>
                  )}
                  {q.category === 'TKP' && !isBest && (
                    <span className="badge">Poin {opt.score}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation & Source Links */}
        <div className="well-sunken stack-200" style={{ gap: '10px' }}>
          <div>
            <div className="h-xsmall">Pembahasan soal</div>
            <p className="body" style={{ whiteSpace: 'pre-line', marginTop: '4px' }}>
              {q.explanation}
            </p>
          </div>

          <div
            className="row-wrap"
            style={{
              paddingTop: '10px',
              borderTop: '1px solid var(--border-faint)',
              justifyContent: 'space-between',
            }}
          >
            <div className="body-small">
              <strong>Sumber soal:</strong>{' '}
              <a
                href={q.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                {q.sourceTitle}
                <ExternalLinkIcon size={12} />
              </a>
            </div>

            <div className="body-small">
              <strong>Materi terkait:</strong>{' '}
              <a
                href={q.studyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                {q.studyLabel}
                <ExternalLinkIcon size={12} />
              </a>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="stack-400">
      {/* Top Action Header */}
      <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
        <div className="stack-200" style={{ gap: '4px' }}>
          <a
            href={buildHistoryPath(null)}
            className="btn btn-subtle btn-compact"
            style={{ alignSelf: 'flex-start' }}
            onClick={(e) => {
              if (!shouldHandleClientClick(e)) return;
              e.preventDefault();
              onBackHome();
            }}
          >
            <ChevronLeftIcon size={16} />
            Kembali ke daftar riwayat
          </a>
          <h1 className="h-xlarge">Rapor hasil &amp; pembahasan soal</h1>
          <p className="body text-subtle">
            {attempt.packageTitle} · Selesai pada {formatDateTimeId(attempt.finishedAt)}
          </p>
        </div>

        <div className="row-wrap" style={{ gap: '8px' }}>
          <ShareLinkButton
            path={buildHistoryPath(attempt.id)}
            shareTitle={`Rapor SKD CPNS: ${attempt.packageTitle} (Skor ${evaluation.totalScore}/${evaluation.maxTotalScore})`}
            label="Share hasil"
            copiedLabel="Link tersalin"
          />
          <a
            href={buildExamHubPath(attempt.packageId)}
            className="btn"
            onClick={(e) => {
              if (!shouldHandleClientClick(e)) return;
              e.preventDefault();
              onRetakePackage(attempt.packageId);
            }}
          >
            Kerjakan ulang paket ini
          </a>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isExporting}
            onClick={handleDownloadPdf}
          >
            <DownloadIcon size={16} />
            {isExporting ? 'Menyiapkan PDF...' : 'Unduh hasil ujian (PDF)'}
          </button>
        </div>
      </div>

      {isSharedAttempt && (
        <div className="section-message section-message-info" role="status">
          <span className="section-message-icon">
            <InfoIcon size={18} />
          </span>
          <div className="section-message-content">
            <h2 className="h-small">
              Rapor hasil simulasi milik {sharedOwnerName ?? 'Peserta CPNS'}
            </h2>
            <p className="section-message-body">
              Anda sedang melihat tautan rapor hasil ujian yang tersimpan di Cloudflare D1. Ingin mengukur kemampuan Anda pada paket yang sama?
            </p>
            <div className="row-wrap" style={{ marginTop: '8px' }}>
              <a
                href={buildExamHubPath(attempt.packageId)}
                className="btn btn-primary btn-compact"
                onClick={(e) => {
                  if (!shouldHandleClientClick(e)) return;
                  e.preventDefault();
                  onRetakePackage(attempt.packageId);
                }}
              >
                Kerjakan paket soal ini sekarang
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Passing Grade Status Banner */}
      <div
        className={`section-message ${
          evaluation.passed ? 'section-message-success' : 'section-message-error'
        }`}
        role="status"
      >
        <span className="section-message-icon">
          {evaluation.passed ? (
            <CheckCircleIcon size={20} />
          ) : (
            <CrossCircleIcon size={20} />
          )}
        </span>
        <div className="section-message-content">
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <h2 className="h-small">
              {evaluation.passed
                ? 'Selamat, skor Anda memenuhi nilai ambang batas (passing grade)'
                : 'Belum memenuhi nilai ambang batas (passing grade)'}
            </h2>
            {rankInfo && (
              <span className="lozenge lozenge-info mono">
                <TrophyIcon size={12} />
                Peringkat #{rankInfo.rank} dari {rankInfo.totalParticipants} peserta
              </span>
            )}
          </div>
          <p className="section-message-body">{evaluation.reason}</p>
        </div>
      </div>

      {/* Metrics & Formation Row */}
      <div className="grid-4">
        <div className="kpi-card">
          <span className="body-small">Total skor SKD</span>
          <div className="metric-large mono">
            {evaluation.totalScore}{' '}
            <span className="body text-subtle">/ {evaluation.maxTotalScore}</span>
          </div>
          <span className="body-small">
            Dijawab: {evaluation.answeredTotal}/{attempt.questions.length} soal
          </span>
        </div>

        <div className="kpi-card">
          <span className="body-small">Waktu pengerjaan</span>
          <div
            className="h-medium mono"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ClockIcon size={18} />
            <span>{formatDurationText(attempt.elapsedSeconds)}</span>
          </div>
          <span className="body-small">
            Rata-rata {avgSecondsPerQuestion} dtk/soal (alokasi{' '}
            {Math.round(attempt.allocatedSeconds / 60)} mnt)
          </span>
        </div>

        <div className="kpi-card">
          <label htmlFor="result-formation-select" className="form-label">
            Acuan formasi passing grade
          </label>
          <select
            id="result-formation-select"
            className="select-input"
            value={attempt.formationId}
            onChange={(e) =>
              onUpdateFormation(attempt.id, e.target.value as FormationType)
            }
          >
            {(Object.keys(FORMATION_RULES) as FormationType[]).map((key) => (
              <option key={key} value={key}>
                {FORMATION_RULES[key].shortLabel}
              </option>
            ))}
          </select>
          <span className="body-small">{evaluation.formation.description}</span>
        </div>

        <div className="kpi-card">
          <span className="body-small">Ekspor laporan PDF</span>
          <button
            type="button"
            className="btn"
            disabled={isExporting}
            onClick={handleDownloadPdf}
          >
            <DownloadIcon size={16} />
            Unduh PDF lengkap
          </button>
          <span className="body-small">
            Memuat skor, waktu, jawaban, kunci, pembahasan, &amp; link sumber.
          </span>
        </div>
      </div>

      {/* Subtest Breakdown Cards */}
      <section className="stack-200">
        <h2 className="h-medium">Rincian nilai per subtes</h2>
        <div className="grid-3">
          {(['TWK', 'TIU', 'TKP'] as const)
            .filter((cat) => evaluation.subtests[cat].totalQuestions > 0)
            .map((cat) => {
              const s = evaluation.subtests[cat];
              const pct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
              const barColor =
                s.passed === null
                  ? 'var(--chart-brand)'
                  : s.passed
                    ? 'var(--chart-success)'
                    : 'var(--chart-danger)';

              return (
                <div key={cat} className="card stack-200">
                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="h-small">{cat}</span>
                    {s.passed !== null ? (
                      <span
                        className={`lozenge ${
                          s.passed ? 'lozenge-success' : 'lozenge-danger'
                        }`}
                      >
                        {s.passed ? (
                          <CheckCircleIcon size={12} />
                        ) : (
                          <CrossCircleIcon size={12} />
                        )}
                        {s.passed ? 'Memenuhi PG' : 'Di bawah PG'}
                      </span>
                    ) : (
                      <span className="lozenge lozenge-info">Latihan fokus</span>
                    )}
                  </div>

                  <div>
                    <div className="metric-medium mono">
                      {s.score}{' '}
                      <span className="body text-subtle">/ {s.maxScore}</span>
                    </div>
                    <div className="body-small">{s.label}</div>
                  </div>

                  <div className="chart-bar-track" aria-label={`Persentase skor ${cat}: ${pct}%`}>
                    <div
                      className="chart-bar-fill"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>

                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="body-small">
                      Ambang batas:{' '}
                      <strong>
                        {s.passingGrade !== null ? s.passingGrade : 'Kumulatif'}
                      </strong>
                    </span>
                    <span className="body-small">
                      Poin 5: {s.correctCount}/{s.totalQuestions}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Single-Attempt Subtopic Weakness Breakdown */}
      {attemptSubtopics.length > 0 && (
        <section className="card stack-200" aria-label="Peta subtopik simulasi ini">
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <div>
              <h2 className="h-medium">Peta subtopik pada simulasi ini</h2>
              <p className="body-small text-subtle">
                Diurutkan dari topik dengan akurasi terendah agar fokus perbaikan tepat sasaran.
              </p>
            </div>
            {onOpenAnalytics && (
              <a
                href={buildAnalyticsPath()}
                className="btn btn-compact"
                onClick={(e) => {
                  if (!shouldHandleClientClick(e)) return;
                  e.preventDefault();
                  onOpenAnalytics();
                }}
              >
                <RadarIcon size={14} />
                Buka Radar Chart lengkap
              </a>
            )}
          </div>

          <div className="grid-2" style={{ gap: '12px' }}>
            {attemptSubtopics.slice(0, 6).map((stat) => {
              const barColor =
                stat.level === 'weak'
                  ? 'var(--chart-danger)'
                  : stat.level === 'moderate'
                    ? 'var(--warning-bold)'
                    : 'var(--chart-brand)';
              const drillId = getDrillPackageId(stat.cluster.id);
              const drillCount = getSubtopicQuestionCount(stat.cluster.id);
              return (
                <div key={stat.cluster.id} className="well-sunken stack-200" style={{ gap: '8px', padding: '12px 14px' }}>
                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="h-xsmall">
                      {stat.cluster.category}: {stat.cluster.shortLabel}
                    </span>
                    <span className="body-small mono">
                      {stat.cluster.category === 'TKP'
                        ? `${stat.avgPointsPerQuestion.toFixed(1)}/5.0 · ${stat.masteryPct}%`
                        : `${stat.perfectCount}/${stat.totalSeen} benar · ${stat.masteryPct}%`}
                    </span>
                  </div>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill"
                      style={{ width: `${stat.masteryPct}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="body-small text-subtle">{stat.totalSeen} soal diuji</span>
                    <a
                      href={buildExamHubPath(drillId)}
                      className="link body-small"
                      onClick={(e) => {
                        if (!shouldHandleClientClick(e)) return;
                        e.preventDefault();
                        onRetakePackage(drillId);
                      }}
                    >
                      Latih ({drillCount} soal)
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Embedded Package Leaderboard */}
      <LeaderboardView
        selectedPackageId={attempt.packageId}
        currentUserId={currentUserId}
        syncCode={syncCode}
        onOpenAttempt={onOpenAttempt}
        embedded
        onOpenFullLeaderboard={onOpenLeaderboard}
        refreshKey={rankInfo ? `${rankInfo.rank}-${rankInfo.totalParticipants}` : 'pending'}
      />

      {/* Interactive Question Jumper Map */}
      <section className="card stack-200" aria-label="Peta nomor pembahasan soal">
        <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 className="h-medium">Peta nomor pembahasan</h2>
            <p className="body-small">
              Klik nomor mana saja untuk meninjau pembahasan dan link sumber soal secara langsung.
            </p>
          </div>
          <div className="row-wrap" style={{ gap: '8px' }}>
            <span className="lozenge lozenge-success">Poin 5</span>
            <span className="lozenge lozenge-warning">TKP 1–4</span>
            <span className="lozenge lozenge-danger">Salah / Kosong</span>
          </div>
        </div>

        <div className="review-jumper-grid">
          {attempt.questions.map((q, idx) => {
            const pts = getQuestionScore(q, attempt.answers[q.id]);
            const scoreTier = pts === 5 ? 'full' : pts > 0 ? 'partial' : 'zero';
            const isActive = reviewMode === 'focus' && safeFocusIdx === idx;
            return (
              <button
                key={q.id}
                type="button"
                className="review-num-btn"
                data-score={scoreTier}
                data-active={isActive}
                onClick={() => handleJumpToQuestion(idx)}
                aria-label={`Tinjau soal nomor ${q.number} (${q.category}), skor ${pts}`}
              >
                {q.number}
              </button>
            );
          })}
        </div>
      </section>

      {/* Dual-Mode Review Stage */}
      <section className="stack-200">
        <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 className="h-medium">
              Pembahasan dan link sumber setiap soal
            </h2>
            <p className="body text-subtle">
              Pilih tampilan satu per satu tanpa gulir panjang, atau mode daftar berhalaman dengan filter &amp; pencarian.
            </p>
          </div>

          <div className="row-wrap" style={{ gap: '8px' }}>
            <button
              type="button"
              className={`btn btn-compact ${reviewMode === 'focus' ? 'btn-selected' : ''}`}
              onClick={() => setReviewMode('focus')}
            >
              <GridIcon size={14} />
              Mode fokus per soal
            </button>
            <button
              type="button"
              className={`btn btn-compact ${reviewMode === 'list' ? 'btn-selected' : ''}`}
              onClick={() => setReviewMode('list')}
            >
              <ListIcon size={14} />
              Mode daftar ({filteredQuestions.length})
            </button>
          </div>
        </div>

        {reviewMode === 'focus' && focusedQuestion ? (
          <div className="stack-200">
            <div className="well-sunken row-wrap" style={{ justifyContent: 'space-between' }}>
              <span className="body-small mono">
                Menampilkan soal {safeFocusIdx + 1} dari {attempt.questions.length}
              </span>
              <div className="row-wrap" style={{ gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-compact"
                  disabled={safeFocusIdx === 0}
                  onClick={() => setFocusQuestionIndex(Math.max(0, safeFocusIdx - 1))}
                >
                  <ChevronLeftIcon size={14} />
                  Soal sebelumnya
                </button>
                <button
                  type="button"
                  className="btn btn-compact"
                  disabled={safeFocusIdx >= attempt.questions.length - 1}
                  onClick={() =>
                    setFocusQuestionIndex(
                      Math.min(attempt.questions.length - 1, safeFocusIdx + 1),
                    )
                  }
                >
                  Soal berikutnya
                  <ChevronRightIcon size={14} />
                </button>
              </div>
            </div>

            {renderQuestionCard(focusedQuestion)}
          </div>
        ) : (
          <div className="stack-200">
            <div className="well-sunken stack-200">
              <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                <div className="row-wrap" style={{ gap: '6px' }}>
                  {(
                    [
                      { id: 'ALL', label: `Semua (${attempt.questions.length})` },
                      { id: 'TWK', label: 'TWK' },
                      { id: 'TIU', label: 'TIU' },
                      { id: 'TKP', label: 'TKP' },
                      { id: 'IMPROVABLE', label: 'Salah / belum poin 5' },
                      { id: 'UNANSWERED', label: 'Belum dijawab' },
                    ] as { id: ReviewFilter; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`btn btn-compact ${filter === item.id ? 'btn-selected' : ''}`}
                      onClick={() => {
                        setFilter(item.id);
                        setListPage(1);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="form-field" style={{ minWidth: '260px' }}>
                  <label htmlFor="review-search" className="form-label">
                    Cari kata kunci soal atau pembahasan
                  </label>
                  <input
                    id="review-search"
                    type="search"
                    className="text-input"
                    placeholder="Ketik kata kunci, mis. Pancasila atau deret..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setListPage(1);
                    }}
                  />
                </div>
              </div>
            </div>

            {filteredQuestions.length === 0 ? (
              <div className="card stack-200" style={{ alignItems: 'flex-start' }}>
                <h3 className="h-small">Tidak ada soal yang cocok dengan filter</h3>
                <p className="body text-subtle">
                  Ubah kategori filter atau kosongkan kotak pencarian untuk melihat kembali seluruh butir soal.
                </p>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setFilter('ALL');
                    setSearchQuery('');
                    setListPage(1);
                  }}
                >
                  Tampilkan semua soal
                </button>
              </div>
            ) : (
              <div className="stack-200">
                {paginatedQuestions.map((q) => renderQuestionCard(q))}

                {totalPages > 1 && (
                  <div className="well-sunken row-wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="body-small mono">
                      Halaman {safePage} dari {totalPages} ({filteredQuestions.length} soal)
                    </span>
                    <div className="row-wrap" style={{ gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-compact"
                        disabled={safePage <= 1}
                        onClick={() => setListPage(Math.max(1, safePage - 1))}
                      >
                        <ChevronLeftIcon size={14} />
                        Halaman sebelumnya
                      </button>
                      <button
                        type="button"
                        className="btn btn-compact"
                        disabled={safePage >= totalPages}
                        onClick={() => setListPage(Math.min(totalPages, safePage + 1))}
                      >
                        Halaman berikutnya
                        <ChevronRightIcon size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

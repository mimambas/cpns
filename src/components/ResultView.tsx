import React, { useMemo, useState } from 'react';
import type { ExamAttempt, FormationType, QuestionCategory } from '../types';
import {
  FORMATION_RULES,
  evaluateExam,
  formatDateTimeId,
  formatDurationText,
  getQuestionScore,
} from '../utils/scoring';
import { exportResultToPdf } from '../utils/pdfExport';
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  CrossCircleIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from './Icons';

interface ResultViewProps {
  attempt: ExamAttempt;
  onUpdateFormation: (attemptId: string, formationId: FormationType) => void;
  onRetakePackage: (packageId: string) => void;
  onBackHome: () => void;
}

type ReviewFilter = 'ALL' | QuestionCategory | 'IMPROVABLE' | 'UNANSWERED';

export const ResultView: React.FC<ResultViewProps> = ({
  attempt,
  onUpdateFormation,
  onRetakePackage,
  onBackHome,
}) => {
  const [filter, setFilter] = useState<ReviewFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      await exportResultToPdf(attempt, evaluation);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="stack-400">
      {/* Top Action Header */}
      <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
        <div className="stack-200" style={{ gap: 'var(--space-050)' }}>
          <button
            type="button"
            className="btn btn-subtle btn-compact"
            style={{ alignSelf: 'flex-start' }}
            onClick={onBackHome}
          >
            <ChevronLeftIcon size={16} />
            Kembali ke beranda paket
          </button>
          <h1 className="h-xlarge">Hasil simulasi dan pembahasan soal</h1>
          <p className="body text-subtle">
            {attempt.packageTitle} · Selesai pada {formatDateTimeId(attempt.finishedAt)}
          </p>
        </div>

        <div className="row-wrap">
          <button
            type="button"
            className="btn"
            onClick={() => onRetakePackage(attempt.packageId)}
          >
            Kerjakan ulang paket ini
          </button>
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
          <h2 className="h-small">
            {evaluation.passed
              ? 'Selamat, skor Anda memenuhi nilai ambang batas (passing grade)'
              : 'Belum memenuhi nilai ambang batas (passing grade)'}
          </h2>
          <p className="section-message-body">{evaluation.reason}</p>
        </div>
      </div>

      {/* Formation Switcher & Time Metric Row */}
      <div className="grid-4">
        <div className="card stack-200" style={{ gap: 'var(--space-075)' }}>
          <span className="body-small">Total skor SKD</span>
          <div className="metric-large mono">
            {evaluation.totalScore}{' '}
            <span className="body text-subtle">/ {evaluation.maxTotalScore}</span>
          </div>
          <span className="body-small">
            Dijawab: {evaluation.answeredTotal}/{attempt.questions.length} soal
          </span>
        </div>

        <div className="card stack-200" style={{ gap: 'var(--space-075)' }}>
          <span className="body-small">Waktu pengerjaan</span>
          <div className="h-medium mono" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-075)' }}>
            <ClockIcon size={18} />
            <span>{formatDurationText(attempt.elapsedSeconds)}</span>
          </div>
          <span className="body-small">
            Rata-rata {avgSecondsPerQuestion} detik per soal (alokasi{' '}
            {Math.round(attempt.allocatedSeconds / 60)} menit)
          </span>
        </div>

        <div className="card stack-200" style={{ gap: 'var(--space-075)' }}>
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
                {FORMATION_RULES[key].label}
              </option>
            ))}
          </select>
          <span className="body-small">
            {evaluation.formation.description}
          </span>
        </div>

        <div className="card stack-200" style={{ gap: 'var(--space-075)' }}>
          <span className="body-small">Ekspor laporan lengkap</span>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isExporting}
            onClick={handleDownloadPdf}
          >
            <DownloadIcon size={16} />
            Unduh PDF lengkap
          </button>
          <span className="body-small">
            Memuat skor, waktu, jawaban Anda, kunci, pembahasan, dan seluruh link sumber.
          </span>
        </div>
      </div>

      {/* Subtest Breakdown Cards with Chart Bars */}
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
                        {s.passingGrade !== null ? s.passingGrade : 'Mengikuti kumulatif'}
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

      {/* Filter & Search Bar for Question Review */}
      <section className="stack-200">
        <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 className="h-medium">
              Pembahasan dan link sumber setiap soal ({filteredQuestions.length} ditampilkan)
            </h2>
            <p className="body text-subtle">
              Setiap butir dilengkapi perbandingan jawaban Anda dengan jawaban benar, bobot poin 1–5 untuk TKP, pembahasan, dan tautan sumber soal.
            </p>
          </div>
        </div>

        <div className="well-sunken stack-200">
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <div className="row-wrap" style={{ gap: 'var(--space-075)' }}>
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
                  onClick={() => setFilter(item.id)}
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Question Review Cards */}
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
              }}
            >
              Tampilkan semua soal
            </button>
          </div>
        ) : (
          <div className="stack-200">
            {filteredQuestions.map((q) => {
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
                    <div className="row-wrap" style={{ gap: 'var(--space-100)' }}>
                      <span className="h-small">Soal #{q.number}</span>
                      <span className="lozenge lozenge-info">{q.category}</span>
                      <span className="tag tag-teal">{q.subtopic}</span>
                    </div>

                    <div className="row-wrap" style={{ gap: 'var(--space-075)' }}>
                      <span className="body-small">
                        Jawaban Anda:{' '}
                        <strong>{userChoice ? userChoice : 'Kosong'}</strong>
                      </span>
                      <span className="body-small">
                        Kunci poin 5: <strong>{q.correctOption}</strong>
                      </span>
                      <span className={`lozenge ${scoreLozengeClass}`}>
                        +{earned} poin
                      </span>
                    </div>
                  </div>

                  <div className="question-stem">{q.question}</div>

                  {q.figureUrl && (
                    <div className="figure-box">
                      <img
                        src={q.figureUrl}
                        alt={`Gambar soal nomor ${q.number}`}
                        className="figure-img"
                      />
                    </div>
                  )}

                  {/* Options Breakdown */}
                  <div className="stack-200" style={{ gap: 'var(--space-075)' }}>
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

                          <div className="row-wrap" style={{ gap: 'var(--space-075)' }}>
                            {isUser && (
                              <span className="lozenge lozenge-info">
                                Pilihan Anda
                              </span>
                            )}
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
                  <div className="well-sunken stack-200" style={{ gap: 'var(--space-100)' }}>
                    <div>
                      <div className="h-xsmall">Pembahasan soal</div>
                      <p className="body" style={{ whiteSpace: 'pre-line', marginTop: 'var(--space-050)' }}>
                        {q.explanation}
                      </p>
                    </div>

                    <div
                      className="row-wrap"
                      style={{
                        paddingTop: 'var(--space-100)',
                        borderTop: 'var(--border-width-default) solid var(--border)',
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
            })}
          </div>
        )}
      </section>
    </div>
  );
};

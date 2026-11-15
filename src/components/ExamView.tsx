import React, { useEffect, useMemo, useState } from 'react';
import type { OptionKey, Question, QuestionCategory, QuestionPackage } from '../types';
import { FORMATION_RULES, formatCountdown } from '../utils/scoring';
import type { FormationType } from '../types';
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FlagIcon,
  WarningIcon,
} from './Icons';

interface ExamViewProps {
  pkg: QuestionPackage;
  formationId: FormationType;
  currentIndex: number;
  answers: Record<string, OptionKey>;
  flaggedIds: string[];
  remainingSeconds: number;
  onSelectAnswer: (questionId: string, optionKey: OptionKey) => void;
  onClearAnswer: (questionId: string) => void;
  onToggleFlag: (questionId: string) => void;
  onNavigate: (index: number) => void;
  onFinishExam: () => void;
}

export const ExamView: React.FC<ExamViewProps> = ({
  pkg,
  formationId,
  currentIndex,
  answers,
  flaggedIds,
  remainingSeconds,
  onSelectAnswer,
  onClearAnswer,
  onToggleFlag,
  onNavigate,
  onFinishExam,
}) => {
  const [navFilter, setNavFilter] = useState<'ALL' | QuestionCategory>('ALL');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const questions = pkg.questions;
  const currentQuestion: Question = questions[currentIndex] ?? questions[0];
  const selectedKey = answers[currentQuestion.id];
  const isFlagged = flaggedIds.includes(currentQuestion.id);

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = flaggedIds.length;

  const urgency =
    remainingSeconds <= 300
      ? 'danger'
      : remainingSeconds <= 900
        ? 'warning'
        : 'normal';

  const filteredNavItems = useMemo(() => {
    return questions
      .map((q, idx) => ({ question: q, index: idx }))
      .filter((item) => navFilter === 'ALL' || item.question.category === navFilter);
  }, [questions, navFilter]);

  // Keyboard shortcuts: ArrowLeft / ArrowRight and A..E
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (confirmOpen) {
        if (e.key === 'Escape') {
          setConfirmOpen(false);
        }
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        e.preventDefault();
        onNavigate(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        onNavigate(currentIndex - 1);
      } else {
        const upper = e.key.toUpperCase();
        if (['A', 'B', 'C', 'D', 'E'].includes(upper)) {
          onSelectAnswer(currentQuestion.id, upper as OptionKey);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [confirmOpen, currentIndex, questions.length, currentQuestion.id, onNavigate, onSelectAnswer]);

  const categoryLozengeClass =
    currentQuestion.category === 'TWK'
      ? 'lozenge-info'
      : currentQuestion.category === 'TIU'
        ? 'lozenge-discovery'
        : 'lozenge-success';

  return (
    <div className="stack-300">
      {/* Top Exam Status Bar */}
      <header className="exam-header-bar">
        <div className="stack-200" style={{ gap: 'var(--space-050)' }}>
          <div className="row-wrap" style={{ gap: 'var(--space-100)' }}>
            <h1 className="h-small">{pkg.title}</h1>
            <span className="tag">{FORMATION_RULES[formationId].shortLabel}</span>
          </div>
          <p className="body-small">
            Soal {currentIndex + 1} dari {questions.length} · Dijawab: {answeredCount} · Belum dijawab: {unansweredCount} · Ragu-ragu: {flaggedCount}
          </p>
        </div>

        <div className="row-wrap">
          <div
            className="timer-pill"
            data-urgency={urgency}
            role="timer"
            aria-live="polite"
            aria-label={`Sisa waktu ujian ${formatCountdown(remainingSeconds)}`}
          >
            <ClockIcon size={16} />
            <span>{formatCountdown(remainingSeconds)}</span>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => setConfirmOpen(true)}
          >
            Selesaikan ujian
          </button>
        </div>
      </header>

      {/* Main Split Workspace */}
      <div className="exam-layout">
        {/* Question Card */}
        <section className="card stack-300" aria-label={`Soal nomor ${currentQuestion.number}`}>
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <div className="row-wrap" style={{ gap: 'var(--space-100)' }}>
              <span className={`lozenge ${categoryLozengeClass}`}>
                {currentQuestion.category} — Soal #{currentQuestion.number}
              </span>
              <span className="tag tag-teal">{currentQuestion.subtopic}</span>
            </div>
            {isFlagged && (
              <span className="lozenge lozenge-warning">
                <FlagIcon size={12} />
                Ditandai ragu-ragu
              </span>
            )}
          </div>

          <div className="question-stem">{currentQuestion.question}</div>

          {currentQuestion.figureUrl && (
            <div className="figure-box">
              <span className="body-small">Gambar soal figural (perhatikan opsi gambar A sampai E):</span>
              <img
                src={currentQuestion.figureUrl}
                alt={`Gambar figural soal nomor ${currentQuestion.number}`}
                className="figure-img"
              />
            </div>
          )}

          {/* Options A-E */}
          <div
            className="options-list"
            role="radiogroup"
            aria-label={`Pilihan jawaban soal nomor ${currentQuestion.number}`}
          >
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className="option-item"
                  onClick={() => onSelectAnswer(currentQuestion.id, opt.key)}
                >
                  <span className="option-key" aria-hidden="true">
                    {opt.key}
                  </span>
                  <span className="body" style={{ flex: 1, paddingTop: '2px', color: 'inherit' }}>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Question Footer Controls */}
          <div
            className="row-wrap"
            style={{
              justifyContent: 'space-between',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-faint)',
            }}
          >
            <div className="row-wrap" style={{ gap: 'var(--space-100)' }}>
              <button
                type="button"
                className="btn"
                disabled={currentIndex === 0}
                onClick={() => onNavigate(currentIndex - 1)}
              >
                <ChevronLeftIcon size={16} />
                Sebelumnya
              </button>

              <button
                type="button"
                className={isFlagged ? 'btn btn-warning' : 'btn'}
                aria-pressed={isFlagged}
                onClick={() => onToggleFlag(currentQuestion.id)}
              >
                <FlagIcon size={16} />
                {isFlagged ? 'Batal ragu-ragu' : 'Tandai ragu-ragu'}
              </button>

              {selectedKey && (
                <button
                  type="button"
                  className="btn btn-subtle"
                  onClick={() => onClearAnswer(currentQuestion.id)}
                >
                  Kosongkan jawaban
                </button>
              )}
            </div>

            <div>
              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onNavigate(currentIndex + 1)}
                >
                  Simpan &amp; lanjutkan
                  <ChevronRightIcon size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setConfirmOpen(true)}
                >
                  Tinjau &amp; selesaikan ujian
                  <CheckCircleIcon size={16} />
                </button>
              )}
            </div>
          </div>

          <p className="body-small text-subtlest">
            Pintasan papan ketik: tekan huruf A sampai E untuk memilih jawaban, atau panah kiri/kanan untuk berpindah nomor soal.
          </p>
        </section>

        {/* Sunken Sidebar Question Navigator */}
        <aside className="well-sunken stack-200" aria-label="Navigasi nomor soal">
          <div className="stack-200" style={{ gap: 'var(--space-100)' }}>
            <h2 className="h-small">Navigasi nomor soal</h2>
            <div className="row-wrap" style={{ gap: 'var(--space-050)' }}>
              {(['ALL', 'TWK', 'TIU', 'TKP'] as const).map((cat) => {
                const count =
                  cat === 'ALL'
                    ? questions.length
                    : questions.filter((q) => q.category === cat).length;
                if (cat !== 'ALL' && count === 0) return null;
                const active = navFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`btn btn-compact ${active ? 'btn-selected' : ''}`}
                    onClick={() => setNavFilter(cat)}
                  >
                    {cat === 'ALL' ? 'Semua' : cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="nav-grid">
            {filteredNavItems.map(({ question, index }) => {
              const isCurrent = index === currentIndex;
              const isAns = Boolean(answers[question.id]);
              const isFlg = flaggedIds.includes(question.id);
              const state = isFlg ? 'flagged' : isAns ? 'answered' : 'unanswered';
              const chosen = answers[question.id];

              return (
                <button
                  key={question.id}
                  type="button"
                  className="nav-num-btn"
                  data-state={state}
                  data-current={isCurrent}
                  onClick={() => onNavigate(index)}
                  aria-label={`Soal ${question.number}${chosen ? `, dijawab ${chosen}` : ', belum dijawab'}${isFlg ? ', ditandai ragu-ragu' : ''}`}
                >
                  <span>
                    {question.number}
                    {chosen ? `.${chosen}` : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Non-color Legend */}
          <div
            className="stack-200"
            style={{
              gap: 'var(--space-2)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--border-faint)',
            }}
          >
            <div className="row-wrap" style={{ gap: 'var(--space-100)' }}>
              <span className="lozenge lozenge-success">Sudah dijawab ({answeredCount})</span>
              <span className="lozenge lozenge-warning">Ragu-ragu ({flaggedCount})</span>
              <span className="lozenge">Kosong ({unansweredCount})</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal Dialog */}
      {confirmOpen && (
        <div className="modal-blanket" role="dialog" aria-modal="true" aria-labelledby="finish-modal-title">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 id="finish-modal-title" className="h-medium">
                Konfirmasi penyelesaian ujian
              </h2>
            </div>
            <div className="modal-body stack-200">
              <p className="body">
                Pastikan Anda telah memeriksa kembali seluruh jawaban sebelum mengakhiri sesi simulasi ini.
              </p>

              <div className="table-wrap">
                <table className="ads-table">
                  <tbody>
                    <tr>
                      <td>Soal sudah dijawab</td>
                      <td className="mono">
                        <strong>{answeredCount}</strong> dari {questions.length}
                      </td>
                    </tr>
                    <tr>
                      <td>Soal ditandai ragu-ragu</td>
                      <td className="mono">{flaggedCount}</td>
                    </tr>
                    <tr>
                      <td>Soal belum dijawab</td>
                      <td className="mono">{unansweredCount}</td>
                    </tr>
                    <tr>
                      <td>Sisa waktu</td>
                      <td className="mono">{formatCountdown(remainingSeconds)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {(unansweredCount > 0 || flaggedCount > 0) && (
                <div className="section-message section-message-warning">
                  <span className="section-message-icon">
                    <WarningIcon size={16} />
                  </span>
                  <div className="section-message-content">
                    <p className="section-message-body">
                      Masih ada {unansweredCount} soal kosong dan {flaggedCount} soal ragu-ragu. Jawaban kosong bernilai 0 pada seluruh subtes termasuk TKP.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn"
                onClick={() => setConfirmOpen(false)}
              >
                Kembali periksa soal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setConfirmOpen(false);
                  onFinishExam();
                }}
              >
                Ya, kumpulkan sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

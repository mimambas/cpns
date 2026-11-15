import React, { useCallback, useEffect, useState } from 'react';
import type {
  ActiveExamSession,
  ExamAttempt,
  FormationType,
  OptionKey,
  QuestionPackage,
} from './types';
import { FULL_PACKAGES, getPackageById } from './data/questionBank';
import {
  formatCountdown,
  formatDateTimeId,
  formatDurationText,
  summarizeAttempt,
} from './utils/scoring';
import { exportResultToPdf } from './utils/pdfExport';
import { AppLogoIcon, CheckCircleIcon, CrossCircleIcon, DownloadIcon } from './components/Icons';
import { HomeView } from './components/HomeView';
import { ExamView } from './components/ExamView';
import { ExamSetupView } from './components/ExamSetupView';
import { ResultView } from './components/ResultView';
import { StudyView } from './components/StudyView';

type AppTab = 'home' | 'exam' | 'study' | 'history';

const STORAGE_ACTIVE_KEY = 'cpns_active_session_v1';
const STORAGE_HISTORY_KEY = 'cpns_exam_history_v1';
const STORAGE_FORMATION_KEY = 'cpns_formation_v1';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const App: React.FC = () => {
  const [selectedFormation, setSelectedFormation] = useState<FormationType>(() =>
    loadJson<FormationType>(STORAGE_FORMATION_KEY, 'umum'),
  );
  const [activeSession, setActiveSession] = useState<ActiveExamSession | null>(() =>
    loadJson<ActiveExamSession | null>(STORAGE_ACTIVE_KEY, null),
  );
  const [history, setHistory] = useState<ExamAttempt[]>(() =>
    loadJson<ExamAttempt[]>(STORAGE_HISTORY_KEY, []),
  );
  const [selectedPackageId, setSelectedPackageId] = useState<string>(FULL_PACKAGES[0].id);
  const [isSessionRunning, setIsSessionRunning] = useState<boolean>(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FORMATION_KEY, JSON.stringify(selectedFormation));
    } catch {
      // ignore storage quota errors
    }
  }, [selectedFormation]);

  useEffect(() => {
    try {
      if (activeSession) {
        localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(activeSession));
      } else {
        localStorage.removeItem(STORAGE_ACTIVE_KEY);
      }
    } catch {
      // ignore storage quota errors
    }
  }, [activeSession]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore storage quota errors
    }
  }, [history]);

  const finishExam = useCallback(() => {
    if (!activeSession) return;
    const pkg = getPackageById(activeSession.packageId);
    if (!pkg) return;

    const elapsed = Math.max(
      1,
      activeSession.allocatedSeconds - activeSession.remainingSeconds,
    );
    const attempt: ExamAttempt = {
      id: `attempt-${Date.now()}`,
      packageId: pkg.id,
      packageTitle: pkg.title,
      isFullSimulation: pkg.isFullSimulation,
      formationId: activeSession.formationId,
      startedAt: activeSession.startedAt,
      finishedAt: new Date().toISOString(),
      elapsedSeconds: elapsed,
      allocatedSeconds: activeSession.allocatedSeconds,
      answers: activeSession.answers,
      flaggedIds: activeSession.flaggedIds,
      questions: pkg.questions,
    };

    setHistory((prev) => [attempt, ...prev]);
    setActiveSession(null);
    setIsSessionRunning(false);
    setSelectedResultId(attempt.id);
    setActiveTab('history');
  }, [activeSession]);

  // Countdown tick only runs while the exam workspace is actively started and open
  useEffect(() => {
    if (!activeSession || !isSessionRunning || activeTab !== 'exam') return;

    const timer = window.setInterval(() => {
      setActiveSession((prev) => {
        if (!prev) return null;
        if (prev.remainingSeconds <= 1) {
          return { ...prev, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeSession !== null, isSessionRunning, activeTab]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (activeSession && isSessionRunning && activeSession.remainingSeconds === 0) {
      finishExam();
    }
  }, [activeSession, isSessionRunning, finishExam]);

  const handleOpenExamPrep = (pkg: QuestionPackage) => {
    setSelectedPackageId(pkg.id);
    setIsSessionRunning(false);
    setSelectedResultId(null);
    setActiveTab('exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmStartExam = (pkg: QuestionPackage, formationId: FormationType) => {
    const allocatedSeconds = pkg.durationMinutes * 60;
    const newSession: ActiveExamSession = {
      packageId: pkg.id,
      packageTitle: pkg.title,
      isFullSimulation: pkg.isFullSimulation,
      formationId,
      startedAt: new Date().toISOString(),
      allocatedSeconds,
      remainingSeconds: allocatedSeconds,
      currentIndex: 0,
      answers: {},
      flaggedIds: [],
    };
    setSelectedPackageId(pkg.id);
    setActiveSession(newSession);
    setIsSessionRunning(true);
    setSelectedResultId(null);
    setActiveTab('exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchTab = (nextTab: AppTab) => {
    if (nextTab !== 'exam') {
      setIsSessionRunning(false);
    }
    if (nextTab === 'history') {
      setSelectedResultId(null);
    }
    setActiveTab(nextTab);
  };

  const handleSelectAnswer = (questionId: string, optionKey: OptionKey) => {
    setActiveSession((prev) =>
      prev
        ? {
            ...prev,
            answers: { ...prev.answers, [questionId]: optionKey },
          }
        : null,
    );
  };

  const handleClearAnswer = (questionId: string) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const copy = { ...prev.answers };
      delete copy[questionId];
      return { ...prev, answers: copy };
    });
  };

  const handleToggleFlag = (questionId: string) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const exists = prev.flaggedIds.includes(questionId);
      const flaggedIds = exists
        ? prev.flaggedIds.filter((id) => id !== questionId)
        : [...prev.flaggedIds, questionId];
      return { ...prev, flaggedIds };
    });
  };

  const handleNavigateQuestion = (index: number) => {
    setActiveSession((prev) => (prev ? { ...prev, currentIndex: index } : null));
  };

  const handleUpdateAttemptFormation = (attemptId: string, formationId: FormationType) => {
    setHistory((prev) =>
      prev.map((a) => (a.id === attemptId ? { ...a, formationId } : a)),
    );
  };

  const selectedSetupPkg =
    getPackageById(selectedPackageId) ?? FULL_PACKAGES[0];

  const currentExamPkg = activeSession
    ? getPackageById(activeSession.packageId)
    : undefined;

  const selectedAttempt =
    selectedResultId !== null
      ? history.find((h) => h.id === selectedResultId) ?? null
      : null;

  return (
    <div className="app-shell">
      <nav className="topbar" aria-label="Navigasi utama">
        <div className="topbar-inner">
          <button
            type="button"
            className="brand-link"
            onClick={() => switchTab('home')}
          >
            <AppLogoIcon size={22} className="brand-glyph" />
            <span>Simulasi &amp; Belajar CPNS</span>
          </button>

          <div className="tablist" role="tablist" aria-label="Halaman aplikasi">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'home'}
              className="tab-btn"
              onClick={() => switchTab('home')}
            >
              Paket try out
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'exam'}
              className="tab-btn"
              onClick={() => switchTab('exam')}
            >
              <span>Simulasi ujian</span>
              {activeSession && (
                <span className="lozenge lozenge-warning">
                  {formatCountdown(activeSession.remainingSeconds)}
                </span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'study'}
              className="tab-btn"
              onClick={() => switchTab('study')}
            >
              Pusat belajar
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              className="tab-btn"
              onClick={() => switchTab('history')}
            >
              <span>Hasil &amp; riwayat</span>
              {history.length > 0 && <span className="badge">{history.length}</span>}
            </button>
          </div>
        </div>
      </nav>

      <main className="main-container">
        {activeTab === 'home' && (
          <HomeView
            selectedFormation={selectedFormation}
            onSelectFormation={setSelectedFormation}
            activeSession={activeSession}
            history={history}
            onStartPackage={handleOpenExamPrep}
            onResumeExam={() => {
              setIsSessionRunning(true);
              setActiveTab('exam');
            }}
            onDiscardSession={() => {
              setActiveSession(null);
              setIsSessionRunning(false);
            }}
            onOpenStudy={() => switchTab('study')}
            onOpenHistory={() => {
              setSelectedResultId(history[0]?.id ?? null);
              setActiveTab('history');
            }}
          />
        )}

        {activeTab === 'exam' && activeSession && currentExamPkg && isSessionRunning && (
          <ExamView
            pkg={currentExamPkg}
            formationId={activeSession.formationId}
            currentIndex={activeSession.currentIndex}
            answers={activeSession.answers}
            flaggedIds={activeSession.flaggedIds}
            remainingSeconds={activeSession.remainingSeconds}
            onSelectAnswer={handleSelectAnswer}
            onClearAnswer={handleClearAnswer}
            onToggleFlag={handleToggleFlag}
            onNavigate={handleNavigateQuestion}
            onFinishExam={finishExam}
          />
        )}

        {activeTab === 'exam' && (!activeSession || !currentExamPkg || !isSessionRunning) && (
          <ExamSetupView
            selectedPackage={selectedSetupPkg}
            selectedFormation={selectedFormation}
            activeSession={activeSession}
            onChangePackage={setSelectedPackageId}
            onChangeFormation={setSelectedFormation}
            onConfirmStartExam={handleConfirmStartExam}
            onResumeActiveSession={() => setIsSessionRunning(true)}
            onDiscardActiveSession={() => {
              setActiveSession(null);
              setIsSessionRunning(false);
            }}
          />
        )}

        {activeTab === 'study' && (
          <StudyView onStartTryout={() => handleOpenExamPrep(FULL_PACKAGES[0])} />
        )}

        {activeTab === 'history' && selectedAttempt && (
          <ResultView
            attempt={selectedAttempt}
            onUpdateFormation={handleUpdateAttemptFormation}
            onRetakePackage={(pkgId) => {
              const found = getPackageById(pkgId);
              if (found) handleOpenExamPrep(found);
            }}
            onBackHome={() => setSelectedResultId(null)}
          />
        )}

        {activeTab === 'history' && !selectedAttempt && (
          <div className="stack-300">
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <div>
                <h1 className="h-xlarge">Riwayat hasil simulasi ujian</h1>
                <p className="body text-subtle" style={{ marginTop: 'var(--space-050)' }}>
                  Semua riwayat tersimpan langsung di peramban Anda tanpa memerlukan login. Buka detail hasil untuk meninjau pembahasan dan link sumber atau unduh berkas PDF.
                </p>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setHistory([])}
                >
                  Hapus seluruh riwayat
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="card stack-200" style={{ alignItems: 'flex-start' }}>
                <h2 className="h-small">Belum ada riwayat simulasi</h2>
                <p className="body text-subtle">
                  Mulai salah satu paket simulasi 110 soal atau latihan fokus subtes untuk melihat skor, analisis nilai ambang batas, dan mengunduh laporan PDF.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenExamPrep(FULL_PACKAGES[0])}
                >
                  Siapkan simulasi 110 soal sekarang
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="ads-table">
                  <thead>
                    <tr>
                      <th>Tanggal selesai</th>
                      <th>Paket simulasi</th>
                      <th>Waktu pengerjaan</th>
                      <th>Skor total</th>
                      <th>Rincian subtes</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => {
                      const ev = summarizeAttempt(item);
                      return (
                        <tr key={item.id}>
                          <td className="body-small">{formatDateTimeId(item.finishedAt)}</td>
                          <td>
                            <strong>{item.packageTitle}</strong>
                            <div className="body-small">{ev.formation.shortLabel}</div>
                          </td>
                          <td className="mono body-small">
                            {formatDurationText(item.elapsedSeconds)}
                          </td>
                          <td className="mono">
                            <strong>{ev.totalScore}</strong> / {ev.maxTotalScore}
                          </td>
                          <td className="body-small mono">
                            TWK {ev.subtests.TWK.score} · TIU {ev.subtests.TIU.score} · TKP{' '}
                            {ev.subtests.TKP.score}
                          </td>
                          <td>
                            <span
                              className={`lozenge ${
                                ev.passed ? 'lozenge-success' : 'lozenge-danger'
                              }`}
                            >
                              {ev.passed ? (
                                <CheckCircleIcon size={12} />
                              ) : (
                                <CrossCircleIcon size={12} />
                              )}
                              {ev.passed ? 'Lulus PG' : 'Belum lulus PG'}
                            </span>
                          </td>
                          <td>
                            <div className="row-wrap" style={{ gap: 'var(--space-075)' }}>
                              <button
                                type="button"
                                className="btn btn-compact"
                                onClick={() => setSelectedResultId(item.id)}
                              >
                                Lihat pembahasan
                              </button>
                              <button
                                type="button"
                                className="btn btn-compact"
                                onClick={() => {
                                  void exportResultToPdf(item, ev);
                                }}
                              >
                                <DownloadIcon size={14} />
                                PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span className="body-small">
            cpns.imambas.my.id — Simulasi CAT SKD CPNS tanpa login dengan acuan resmi Kepmenpan RB No. 321 Tahun 2024.
          </span>
          <div className="row-wrap" style={{ gap: 'var(--space-150)' }}>
            <a
              href="https://sscasn.bkn.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="link body-small"
            >
              SSCASN BKN
            </a>
            <a
              href="https://kerjago.id/materi-cpns"
              target="_blank"
              rel="noopener noreferrer"
              className="link body-small"
            >
              Materi Kerjago
            </a>
            <a
              href="https://drive.google.com/drive/folders/1Ezv-eN2_sMBPWDpVsPInxOXzowBhlG15"
              target="_blank"
              rel="noopener noreferrer"
              className="link body-small"
            >
              Google Drive Soal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;

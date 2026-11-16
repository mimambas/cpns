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
  FORMATION_RULES,
  formatCountdown,
  formatDateTimeId,
  formatDurationText,
  summarizeAttempt,
} from './utils/scoring';
import { exportResultToPdf } from './utils/pdfExport';
import {
  AppLogoIcon,
  CheckCircleIcon,
  CourseIcon,
  CrossCircleIcon,
  DashboardIcon,
  DownloadIcon,
  ExamIcon,
  ReportIcon,
} from './components/Icons';
import { HomeView } from './components/HomeView';
import { ExamView } from './components/ExamView';
import { ExamSetupView } from './components/ExamSetupView';
import { ResultView } from './components/ResultView';
import { STUDY_MODULES, StudyModuleId, StudyView } from './components/StudyView';

type AppTab = 'home' | 'study' | 'exam' | 'history';

const STORAGE_ACTIVE_KEY = 'cpns_active_session_v1';
const STORAGE_HISTORY_KEY = 'cpns_exam_history_v1';
const STORAGE_FORMATION_KEY = 'cpns_formation_v1';
const STORAGE_COMPLETED_MODULES_KEY = 'cpns_completed_modules_v1';

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
  const [completedModules, setCompletedModules] = useState<string[]>(() =>
    loadJson<string[]>(STORAGE_COMPLETED_MODULES_KEY, []),
  );
  const [activeModuleId, setActiveModuleId] = useState<StudyModuleId>('modul-regulasi');
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_COMPLETED_MODULES_KEY, JSON.stringify(completedModules));
    } catch {
      // ignore storage quota errors
    }
  }, [completedModules]);

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

  // Countdown tick only runs while the exam classroom is active and running
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCompleteModule = (moduleId: StudyModuleId) => {
    setCompletedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId],
    );
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

  const selectedSetupPkg = getPackageById(selectedPackageId) ?? FULL_PACKAGES[0];
  const currentExamPkg = activeSession ? getPackageById(activeSession.packageId) : undefined;
  const selectedAttempt =
    selectedResultId !== null ? history.find((h) => h.id === selectedResultId) ?? null : null;

  const isClassroomActive =
    activeTab === 'exam' && Boolean(activeSession) && Boolean(currentExamPkg) && isSessionRunning;

  // Mode 2: Fullscreen Distraction-Free CAT Classroom
  if (isClassroomActive && activeSession && currentExamPkg) {
    return (
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
        onPauseExam={() => setIsSessionRunning(false)}
        onFinishExam={finishExam}
      />
    );
  }

  const navItems: {
    id: AppTab;
    label: string;
    icon: React.ReactNode;
    badge?: React.ReactNode;
  }[] = [
    {
      id: 'home',
      label: 'Beranda belajar',
      icon: <DashboardIcon size={16} />,
    },
    {
      id: 'study',
      label: 'Kelas & modul SKD',
      icon: <CourseIcon size={16} />,
      badge: (
        <span className="badge">
          {completedModules.length}/{STUDY_MODULES.length}
        </span>
      ),
    },
    {
      id: 'exam',
      label: 'Simulasi ujian',
      icon: <ExamIcon size={16} />,
      badge: activeSession ? (
        <span className="lozenge lozenge-warning">
          {formatCountdown(activeSession.remainingSeconds)}
        </span>
      ) : undefined,
    },
    {
      id: 'history',
      label: 'Hasil & riwayat',
      icon: <ReportIcon size={16} />,
      badge: history.length > 0 ? <span className="badge">{history.length}</span> : undefined,
    },
  ];

  const sectionTitle =
    activeTab === 'home'
      ? 'Beranda belajar & dasbor'
      : activeTab === 'study'
        ? 'Kelas & modul materi SKD'
        : activeTab === 'exam'
          ? 'Pusat asesmen & persiapan CAT'
          : selectedAttempt
            ? `Rapor detail: ${selectedAttempt.packageTitle}`
            : 'Rapor hasil & riwayat simulasi';

  // Mode 1: LMS Workspace Shell
  return (
    <div className="lms-shell">
      {/* Left Navigation Sidebar */}
      <aside className="lms-sidebar" aria-label="Navigasi LMS">
        <div className="lms-sidebar-top">
          <button
            type="button"
            className="lms-brand"
            onClick={() => switchTab('home')}
          >
            <AppLogoIcon size={24} className="brand-glyph" />
            <span>
              <span className="lms-brand-title">CPNS Learning Hub</span>
              <span className="lms-brand-sub">LMS &amp; Simulasi CAT BKN</span>
            </span>
          </button>

          <nav className="lms-nav-group" aria-label="Menu utama LMS">
            <div className="lms-nav-label">Menu pembelajaran</div>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="lms-nav-item"
                aria-current={activeTab === item.id ? 'page' : undefined}
                onClick={() => switchTab(item.id)}
              >
                <span className="lms-nav-item-left">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.badge}
              </button>
            ))}
          </nav>
        </div>

        <div className="lms-sidebar-footer">
          {/* Target Formasi Widget */}
          <div className="lms-sidebar-widget">
            <label htmlFor="sidebar-formation-select" className="form-label">
              Target formasi passing grade
            </label>
            <select
              id="sidebar-formation-select"
              className="select-input"
              value={selectedFormation}
              onChange={(e) => setSelectedFormation(e.target.value as FormationType)}
            >
              {(Object.keys(FORMATION_RULES) as FormationType[]).map((key) => (
                <option key={key} value={key}>
                  {FORMATION_RULES[key].shortLabel}
                </option>
              ))}
            </select>
            <span className="body-small">{FORMATION_RULES[selectedFormation].description}</span>
          </div>

          {/* Progres Belajar Widget */}
          <div className="lms-sidebar-widget">
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <span className="h-xsmall">Progres belajar</span>
              <span className="mono body-small">
                {completedModules.length}/{STUDY_MODULES.length}
              </span>
            </div>
            <div className="body-small">
              {completedModules.length} modul selesai · {history.length} simulasi selesai
            </div>
          </div>
        </div>
      </aside>

      {/* Main LMS Workspace Column */}
      <div className="lms-workspace">
        {/* Top Context Bar */}
        <header className="lms-contextbar">
          <div className="row-wrap" style={{ gap: '10px' }}>
            <button
              type="button"
              className="lms-mobile-header-brand"
              onClick={() => switchTab('home')}
            >
              <AppLogoIcon size={20} className="brand-glyph" />
              <span>CPNS LMS</span>
            </button>
            <span className="body-small text-subtle">{sectionTitle}</span>
          </div>

          <div className="row-wrap" style={{ gap: '8px' }}>
            {activeSession ? (
              <button
                type="button"
                className="btn btn-compact btn-warning"
                onClick={() => switchTab('exam')}
              >
                Sesi dijeda · {formatCountdown(activeSession.remainingSeconds)}
              </button>
            ) : null}
          </div>
        </header>

        {/* Mobile Tab Strip (hidden on desktop >= 996px) */}
        <nav className="lms-mobile-nav" aria-label="Navigasi seluler LMS">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="tab-btn"
              aria-selected={activeTab === item.id}
              onClick={() => switchTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge}
            </button>
          ))}
        </nav>

        {/* Content Stage */}
        <main className="lms-main">
          {activeTab === 'home' && (
            <HomeView
              selectedFormation={selectedFormation}
              onSelectFormation={setSelectedFormation}
              activeSession={activeSession}
              history={history}
              completedModules={completedModules}
              totalModulesCount={STUDY_MODULES.length}
              onStartPackage={handleOpenExamPrep}
              onResumeExam={() => {
                setIsSessionRunning(true);
                setActiveTab('exam');
              }}
              onDiscardSession={() => {
                setActiveSession(null);
                setIsSessionRunning(false);
              }}
              onOpenStudy={(moduleId) => {
                if (moduleId) setActiveModuleId(moduleId);
                switchTab('study');
              }}
              onOpenHistory={(attemptId) => {
                setSelectedResultId(attemptId ?? history[0]?.id ?? null);
                setActiveTab('history');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activeTab === 'study' && (
            <StudyView
              activeModuleId={activeModuleId}
              onSelectModule={setActiveModuleId}
              completedModules={completedModules}
              onToggleCompleteModule={handleToggleCompleteModule}
              onPracticePackage={(pkgId) => {
                const found = getPackageById(pkgId);
                if (found) handleOpenExamPrep(found);
              }}
            />
          )}

          {activeTab === 'exam' && (
            <ExamSetupView
              selectedPackage={selectedSetupPkg}
              selectedFormation={selectedFormation}
              activeSession={activeSession}
              history={history}
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
                  <h1 className="h-xlarge">Hasil &amp; riwayat simulasi ujian</h1>
                  <p className="body text-subtle" style={{ marginTop: '4px' }}>
                    Semua riwayat tersimpan otomatis di peramban Anda tanpa login. Klik detail untuk melihat peta pembahasan soal dan ekspor PDF.
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
                    Mulai salah satu paket simulasi 110 soal atau latihan fokus subtes untuk melihat rapor nilai, peta pembahasan, dan mengunduh laporan PDF.
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
                              <div className="row-wrap" style={{ gap: '8px' }}>
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
              cpns.imambas.my.id · LMS &amp; Simulasi CAT SKD CPNS tanpa login (Kepmenpan RB No. 321/2024).
            </span>
            <div className="row-wrap" style={{ gap: '16px' }}>
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
    </div>
  );
};

export default App;

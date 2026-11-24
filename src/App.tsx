import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ActiveExamSession,
  CloudProfile,
  CloudSyncStatus,
  ExamAttempt,
  FormationType,
  OptionKey,
  QuestionPackage,
  RankInfo,
  StudyModuleId,
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
  type AppTab,
  buildActiveExamPath,
  buildExamHubPath,
  buildHistoryPath,
  buildHomePath,
  buildLeaderboardPath,
  buildStudyPath,
  parsePathname,
  shouldHandleClientClick,
} from './utils/router';
import {
  clearCloudAttempts,
  fetchPublicAttempt,
  generateAttemptId,
  loadOrCreateCloudProfile,
  postFinishedAttempt,
  rehydrateCloudAttempt,
  saveCloudProfile,
  syncWithCloud,
  type SyncResponse,
  toCloudAttemptPayload,
} from './utils/cloudSync';
import {
  AppLogoIcon,
  CheckCircleIcon,
  CloudIcon,
  CourseIcon,
  CrossCircleIcon,
  DashboardIcon,
  DownloadIcon,
  ExamIcon,
  ReportIcon,
  TrophyIcon,
} from './components/Icons';
import { HomeView } from './components/HomeView';
import { ExamView } from './components/ExamView';
import { ExamSetupView } from './components/ExamSetupView';
import { ResultView } from './components/ResultView';
import { STUDY_MODULES, StudyView } from './components/StudyView';
import { ShareLinkButton } from './components/ShareLinkButton';
import { CloudSyncModal } from './components/CloudSyncModal';
import { LeaderboardView } from './components/LeaderboardView';

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

function mergeAttempts(cloudDtos: SyncResponse['attempts'], localHistory: ExamAttempt[]): ExamAttempt[] {
  const byId = new Map<string, ExamAttempt>();
  for (const dto of cloudDtos) {
    const hydrated = rehydrateCloudAttempt(dto);
    if (hydrated) {
      byId.set(hydrated.id, hydrated);
    }
  }
  for (const local of localHistory) {
    if (!byId.has(local.id)) {
      byId.set(local.id, local);
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime(),
  );
}

interface InitialRouteResolution {
  tab: AppTab;
  historySubview: 'attempts' | 'leaderboard';
  leaderboardPkgId: string;
  moduleId: StudyModuleId;
  packageId: string;
  isRunning: boolean;
  resultId: string | null;
  canonicalPath: string;
  needsReplace: boolean;
}

function resolveRouteState(
  pathname: string,
  activeSession: ActiveExamSession | null,
): InitialRouteResolution {
  const parsed = parsePathname(pathname);

  if (parsed.tab === 'home') {
    return {
      tab: 'home',
      historySubview: 'attempts',
      leaderboardPkgId: FULL_PACKAGES[0].id,
      moduleId: 'modul-regulasi',
      packageId: FULL_PACKAGES[0].id,
      isRunning: false,
      resultId: null,
      canonicalPath: '/',
      needsReplace: Boolean(parsed.replaceWith && parsed.replaceWith !== pathname),
    };
  }

  if (parsed.tab === 'study') {
    const targetPath = buildStudyPath(parsed.moduleId);
    return {
      tab: 'study',
      historySubview: 'attempts',
      leaderboardPkgId: FULL_PACKAGES[0].id,
      moduleId: parsed.moduleId,
      packageId: FULL_PACKAGES[0].id,
      isRunning: false,
      resultId: null,
      canonicalPath: targetPath,
      needsReplace: pathname !== targetPath,
    };
  }

  if (parsed.tab === 'exam') {
    const requestedPkg = parsed.packageId ? getPackageById(parsed.packageId) : undefined;
    if (parsed.running) {
      const canResume =
        Boolean(activeSession) &&
        Boolean(requestedPkg) &&
        activeSession?.packageId === requestedPkg?.id;
      if (canResume && requestedPkg) {
        const activePath = buildActiveExamPath(requestedPkg.id);
        return {
          tab: 'exam',
          historySubview: 'attempts',
          leaderboardPkgId: FULL_PACKAGES[0].id,
          moduleId: 'modul-regulasi',
          packageId: requestedPkg.id,
          isRunning: true,
          resultId: null,
          canonicalPath: activePath,
          needsReplace: pathname !== activePath,
        };
      }
      const safePath = requestedPkg ? buildExamHubPath(requestedPkg.id) : '/simulasi';
      return {
        tab: 'exam',
        historySubview: 'attempts',
        leaderboardPkgId: FULL_PACKAGES[0].id,
        moduleId: 'modul-regulasi',
        packageId: requestedPkg?.id ?? FULL_PACKAGES[0].id,
        isRunning: false,
        resultId: null,
        canonicalPath: safePath,
        needsReplace: true,
      };
    }

    if (parsed.packageId) {
      if (requestedPkg) {
        const pkgPath = buildExamHubPath(requestedPkg.id);
        return {
          tab: 'exam',
          historySubview: 'attempts',
          leaderboardPkgId: FULL_PACKAGES[0].id,
          moduleId: 'modul-regulasi',
          packageId: requestedPkg.id,
          isRunning: false,
          resultId: null,
          canonicalPath: pkgPath,
          needsReplace: pathname !== pkgPath,
        };
      }
      return {
        tab: 'exam',
        historySubview: 'attempts',
        leaderboardPkgId: FULL_PACKAGES[0].id,
        moduleId: 'modul-regulasi',
        packageId: FULL_PACKAGES[0].id,
        isRunning: false,
        resultId: null,
        canonicalPath: '/simulasi',
        needsReplace: true,
      };
    }

    return {
      tab: 'exam',
      historySubview: 'attempts',
      leaderboardPkgId: FULL_PACKAGES[0].id,
      moduleId: 'modul-regulasi',
      packageId: activeSession?.packageId ?? FULL_PACKAGES[0].id,
      isRunning: false,
      resultId: null,
      canonicalPath: '/simulasi',
      needsReplace: pathname !== '/simulasi',
    };
  }

  // parsed.tab === 'history'
  if (parsed.subview === 'leaderboard') {
    const validPkg = parsed.leaderboardPkgId ? getPackageById(parsed.leaderboardPkgId) : undefined;
    const pkgId = validPkg?.id ?? FULL_PACKAGES[0].id;
    const targetPath = validPkg ? buildLeaderboardPath(pkgId) : '/peringkat';
    return {
      tab: 'history',
      historySubview: 'leaderboard',
      leaderboardPkgId: pkgId,
      moduleId: 'modul-regulasi',
      packageId: FULL_PACKAGES[0].id,
      isRunning: false,
      resultId: null,
      canonicalPath: targetPath,
      needsReplace: pathname !== targetPath,
    };
  }

  if (parsed.attemptId) {
    const attemptPath = buildHistoryPath(parsed.attemptId);
    return {
      tab: 'history',
      historySubview: 'attempts',
      leaderboardPkgId: FULL_PACKAGES[0].id,
      moduleId: 'modul-regulasi',
      packageId: FULL_PACKAGES[0].id,
      isRunning: false,
      resultId: parsed.attemptId,
      canonicalPath: attemptPath,
      needsReplace: pathname !== attemptPath,
    };
  }

  return {
    tab: 'history',
    historySubview: 'attempts',
    leaderboardPkgId: FULL_PACKAGES[0].id,
    moduleId: 'modul-regulasi',
    packageId: FULL_PACKAGES[0].id,
    isRunning: false,
    resultId: null,
    canonicalPath: '/hasil',
    needsReplace: pathname !== '/hasil',
  };
}

export const App: React.FC = () => {
  const [cloudProfile, setCloudProfile] = useState<CloudProfile>(() => loadOrCreateCloudProfile());
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('idle');
  const [syncModalOpen, setSyncModalOpen] = useState(false);

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

  const initialRouteRef = useRef<InitialRouteResolution | null>(null);
  if (initialRouteRef.current === null) {
    initialRouteRef.current = resolveRouteState(
      typeof window !== 'undefined' ? window.location.pathname : '/',
      activeSession,
    );
  }
  const initRoute = initialRouteRef.current;

  const [activeModuleId, setActiveModuleId] = useState<StudyModuleId>(initRoute.moduleId);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(initRoute.packageId);
  const [isSessionRunning, setIsSessionRunning] = useState<boolean>(initRoute.isRunning);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(initRoute.resultId);
  const [historySubview, setHistorySubview] = useState<'attempts' | 'leaderboard'>(
    initRoute.historySubview,
  );
  const [leaderboardPkgId, setLeaderboardPkgId] = useState<string>(initRoute.leaderboardPkgId);
  const [activeTab, setActiveTab] = useState<AppTab>(initRoute.tab);
  const [currentPath, setCurrentPath] = useState<string>(initRoute.canonicalPath);

  const [latestRankInfo, setLatestRankInfo] = useState<{
    attemptId: string;
    rankInfo: RankInfo;
  } | null>(null);
  const [sharedReport, setSharedReport] = useState<{
    attempt: ExamAttempt;
    ownerName: string;
    rankInfo: RankInfo;
  } | null>(null);
  const [sharedReportLoading, setSharedReportLoading] = useState(false);

  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;
  const historyRef = useRef(history);
  historyRef.current = history;
  const completedModulesRef = useRef(completedModules);
  completedModulesRef.current = completedModules;
  const selectedFormationRef = useRef(selectedFormation);
  selectedFormationRef.current = selectedFormation;
  const cloudProfileRef = useRef(cloudProfile);
  cloudProfileRef.current = cloudProfile;

  const hasInitialSyncRef = useRef(false);
  const skipNextMetaSyncRef = useRef(false);

  useEffect(() => {
    saveCloudProfile(cloudProfile);
  }, [cloudProfile]);

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

  const applySyncResult = useCallback(
    (res: SyncResponse, baseProfile: CloudProfile) => {
      skipNextMetaSyncRef.current = true;
      setCloudProfile({
        syncCode: baseProfile.syncCode,
        userId: res.profile.userId,
        displayName: res.profile.displayName,
        lastSyncedAt: res.profile.updatedAt,
      });

      setSelectedFormation(res.profile.selectedFormation);
      setCompletedModules((prev) =>
        Array.from(new Set([...prev, ...res.profile.completedModules])),
      );
      setHistory((prev) => mergeAttempts(res.attempts, prev));

      if (!activeSessionRef.current && res.profile.activeSession) {
        setActiveSession(res.profile.activeSession);
      }
    },
    [],
  );

  // Initial automatic Cloud D1 sync on mount
  useEffect(() => {
    let cancelled = false;
    setSyncStatus('syncing');

    syncWithCloud(cloudProfileRef.current.syncCode, {
      displayName: cloudProfileRef.current.displayName,
      selectedFormation: selectedFormationRef.current,
      completedModules: completedModulesRef.current,
      activeSession: activeSessionRef.current,
      attempts: historyRef.current.slice(0, 50).map(toCloudAttemptPayload),
    }).then((res) => {
      if (cancelled) return;
      hasInitialSyncRef.current = true;
      if (res) {
        applySyncResult(res, cloudProfileRef.current);
        setSyncStatus('synced');
      } else {
        setSyncStatus('offline');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [applySyncResult]);

  // Debounced background sync when modules or target formation change
  useEffect(() => {
    if (!hasInitialSyncRef.current) return;
    if (skipNextMetaSyncRef.current) {
      skipNextMetaSyncRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      setSyncStatus('syncing');
      void syncWithCloud(cloudProfileRef.current.syncCode, {
        displayName: cloudProfileRef.current.displayName,
        selectedFormation,
        replaceFormation: true,
        completedModules,
        replaceModules: true,
      }).then((res) => {
        if (res) {
          setCloudProfile((prev) => ({
            ...prev,
            userId: res.profile.userId,
            lastSyncedAt: res.profile.updatedAt,
          }));
          setSyncStatus('synced');
        } else {
          setSyncStatus('offline');
        }
      });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [completedModules, selectedFormation]);

  // Debounced 20-second checkpoint during live exam when answers/flags change (never on countdown tick)
  const answeredCountCheckpoint = activeSession ? Object.keys(activeSession.answers).length : 0;
  const flaggedCountCheckpoint = activeSession ? activeSession.flaggedIds.length : 0;

  useEffect(() => {
    if (!hasInitialSyncRef.current || !isSessionRunning || !activeSessionRef.current) return;

    const timer = window.setTimeout(() => {
      const current = activeSessionRef.current;
      if (!current) return;
      void syncWithCloud(cloudProfileRef.current.syncCode, {
        displayName: cloudProfileRef.current.displayName,
        selectedFormation: selectedFormationRef.current,
        completedModules: completedModulesRef.current,
        activeSession: current,
        updateActiveSession: true,
      }).then((res) => {
        if (res) {
          setSyncStatus('synced');
          setCloudProfile((prev) => ({
            ...prev,
            userId: res.profile.userId,
            lastSyncedAt: res.profile.updatedAt,
          }));
        }
      });
    }, 20000);

    return () => window.clearTimeout(timer);
  }, [isSessionRunning, answeredCountCheckpoint, flaggedCountCheckpoint]);

  const pushPath = useCallback(
    (path: string, options?: { replace?: boolean; scroll?: boolean }) => {
      if (typeof window !== 'undefined') {
        if (window.location.pathname !== path) {
          if (options?.replace) {
            window.history.replaceState(null, '', path);
          } else {
            window.history.pushState(null, '', path);
          }
        }
        setCurrentPath(path);
        if (options?.scroll !== false) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    },
    [],
  );

  // Fetch shared public report when opening /hasil/:attemptId not present locally
  useEffect(() => {
    if (activeTab !== 'history' || selectedResultId === null) {
      setSharedReport(null);
      setSharedReportLoading(false);
      return;
    }

    const existsLocally = history.some((h) => h.id === selectedResultId);
    if (existsLocally) {
      setSharedReport(null);
      setSharedReportLoading(false);
      return;
    }

    let cancelled = false;
    setSharedReportLoading(true);
    setSharedReport(null);

    fetchPublicAttempt(selectedResultId).then((res) => {
      if (cancelled) return;
      if (res) {
        const hydrated = rehydrateCloudAttempt(res.attempt);
        if (hydrated) {
          setSharedReport({
            attempt: hydrated,
            ownerName: res.attempt.displayName,
            rankInfo: res.rankInfo,
          });
          setSharedReportLoading(false);
          return;
        }
      }
      setSharedReportLoading(false);
      if (!historyRef.current.some((h) => h.id === selectedResultId)) {
        setSelectedResultId(null);
        pushPath('/hasil', { replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedResultId, history, pushPath]);

  // Normalize initial canonical URL once on mount if needed
  useEffect(() => {
    if (initRoute.needsReplace && typeof window !== 'undefined') {
      window.history.replaceState(null, '', initRoute.canonicalPath);
      setCurrentPath(initRoute.canonicalPath);
    }
  }, [initRoute]);

  // Listen to browser Back / Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const parsed = parsePathname(pathname);
      const resolved = resolveRouteState(pathname, activeSessionRef.current);

      if (resolved.needsReplace) {
        window.history.replaceState(null, '', resolved.canonicalPath);
      }

      setActiveTab(resolved.tab);
      setIsSessionRunning(resolved.isRunning);
      setCurrentPath(resolved.canonicalPath);

      if (resolved.tab === 'study') {
        setActiveModuleId(resolved.moduleId);
      }
      if (resolved.tab === 'exam' && parsed.tab === 'exam' && parsed.packageId) {
        const valid = getPackageById(parsed.packageId);
        if (valid) {
          setSelectedPackageId(valid.id);
        }
      }
      if (resolved.tab === 'history') {
        setHistorySubview(resolved.historySubview);
        setLeaderboardPkgId(resolved.leaderboardPkgId);
        setSelectedResultId(resolved.resultId);
      } else {
        setSelectedResultId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const syncSessionSnapshot = useCallback((sessionValue: ActiveExamSession | null) => {
    void syncWithCloud(cloudProfileRef.current.syncCode, {
      displayName: cloudProfileRef.current.displayName,
      selectedFormation: selectedFormationRef.current,
      completedModules: completedModulesRef.current,
      activeSession: sessionValue,
      updateActiveSession: true,
    }).then((res) => {
      if (res) {
        setSyncStatus('synced');
        setCloudProfile((prev) => ({
          ...prev,
          userId: res.profile.userId,
          lastSyncedAt: res.profile.updatedAt,
        }));
      }
    });
  }, []);

  const finishExam = useCallback(() => {
    if (!activeSession) return;
    const pkg = getPackageById(activeSession.packageId);
    if (!pkg) return;

    const elapsed = Math.max(
      1,
      activeSession.allocatedSeconds - activeSession.remainingSeconds,
    );
    const attempt: ExamAttempt = {
      id: generateAttemptId(),
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
    setHistorySubview('attempts');
    setSelectedResultId(attempt.id);
    setActiveTab('history');
    pushPath(buildHistoryPath(attempt.id), { replace: true });

    setSyncStatus('syncing');
    void postFinishedAttempt(
      cloudProfileRef.current.syncCode,
      cloudProfileRef.current.displayName,
      attempt,
    ).then((res) => {
      if (res) {
        setSyncStatus('synced');
        setLatestRankInfo({ attemptId: res.attemptId, rankInfo: res.rankInfo });
      } else {
        setSyncStatus('offline');
      }
    });
  }, [activeSession, pushPath]);

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
    pushPath(buildExamHubPath(pkg.id));
  };

  const handleChangePackage = (pkgId: string) => {
    const found = getPackageById(pkgId);
    if (!found) return;
    setSelectedPackageId(found.id);
    pushPath(buildExamHubPath(found.id), { scroll: false });
  };

  const handleSelectModule = (moduleId: StudyModuleId) => {
    setActiveModuleId(moduleId);
    setActiveTab('study');
    pushPath(buildStudyPath(moduleId));
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
    pushPath(buildActiveExamPath(pkg.id));
  };

  const handleResumeExam = () => {
    if (!activeSession) return;
    setSelectedPackageId(activeSession.packageId);
    setIsSessionRunning(true);
    setActiveTab('exam');
    pushPath(buildActiveExamPath(activeSession.packageId));
  };

  const handlePauseExam = () => {
    setIsSessionRunning(false);
    const current = activeSessionRef.current;
    const pkgId = current?.packageId ?? selectedPackageId;
    pushPath(buildExamHubPath(pkgId));
    syncSessionSnapshot(current);
  };

  const handleDiscardActiveSession = () => {
    setActiveSession(null);
    setIsSessionRunning(false);
    syncSessionSnapshot(null);
  };

  const switchTab = (nextTab: AppTab) => {
    if (nextTab !== 'exam') {
      setIsSessionRunning(false);
    }
    if (nextTab === 'history') {
      setSelectedResultId(null);
      setHistorySubview('attempts');
    }
    setActiveTab(nextTab);

    if (nextTab === 'home') {
      pushPath(buildHomePath());
    } else if (nextTab === 'study') {
      pushPath(buildStudyPath(activeModuleId));
    } else if (nextTab === 'exam') {
      pushPath(buildExamHubPath());
    } else {
      pushPath(buildHistoryPath(null));
    }
  };

  const handleOpenLeaderboard = (pkgId?: string) => {
    const targetPkg = pkgId && getPackageById(pkgId) ? pkgId : leaderboardPkgId;
    setLeaderboardPkgId(targetPkg);
    setSelectedResultId(null);
    setHistorySubview('leaderboard');
    setActiveTab('history');
    pushPath(pkgId ? buildLeaderboardPath(targetPkg) : buildLeaderboardPath());
  };

  const handleManualSync = async (): Promise<boolean> => {
    setSyncStatus('syncing');
    const res = await syncWithCloud(cloudProfile.syncCode, {
      displayName: cloudProfile.displayName,
      selectedFormation,
      completedModules,
      activeSession,
      attempts: history.slice(0, 50).map(toCloudAttemptPayload),
    });
    if (res) {
      applySyncResult(res, cloudProfile);
      setSyncStatus('synced');
      return true;
    }
    setSyncStatus('offline');
    return false;
  };

  const handleSaveDisplayName = async (nextName: string): Promise<boolean> => {
    setSyncStatus('syncing');
    const res = await syncWithCloud(cloudProfile.syncCode, {
      displayName: nextName,
      explicitProfileUpdate: true,
      selectedFormation,
      completedModules,
      attempts: history.slice(0, 50).map(toCloudAttemptPayload),
    });
    if (res) {
      applySyncResult(res, { ...cloudProfile, displayName: res.profile.displayName });
      setSyncStatus('synced');
      return true;
    }
    setSyncStatus('offline');
    return false;
  };

  const handleLinkSyncCode = async (
    nextCode: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    setSyncStatus('syncing');
    const res = await syncWithCloud(nextCode, {
      displayName: cloudProfile.displayName,
      selectedFormation,
      completedModules,
      activeSession,
      attempts: history.slice(0, 50).map(toCloudAttemptPayload),
    });
    if (!res) {
      setSyncStatus('offline');
      return {
        ok: false,
        error: 'Gagal terhubung ke server Cloudflare D1. Periksa koneksi lalu coba lagi.',
      };
    }

    const linkedProfile: CloudProfile = {
      syncCode: nextCode,
      userId: res.profile.userId,
      displayName: res.profile.displayName,
      lastSyncedAt: res.profile.updatedAt,
    };
    applySyncResult(res, linkedProfile);
    setSyncStatus('synced');
    return { ok: true };
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
  const localAttempt =
    selectedResultId !== null ? history.find((h) => h.id === selectedResultId) ?? null : null;
  const displayedAttempt = localAttempt ?? sharedReport?.attempt ?? null;
  const isViewingSharedAttempt = localAttempt === null && sharedReport !== null;

  const isClassroomActive =
    activeTab === 'exam' && Boolean(activeSession) && Boolean(currentExamPkg) && isSessionRunning;

  const activeModuleMeta =
    STUDY_MODULES.find((m) => m.id === activeModuleId) ?? STUDY_MODULES[0];

  const pageTitle = isClassroomActive && currentExamPkg
    ? `Ujian Aktif: ${currentExamPkg.title} | CPNS Learning Hub`
    : activeTab === 'home'
      ? 'Beranda Belajar & Simulasi CAT SKD CPNS | cpns.imambas.my.id'
      : activeTab === 'study'
        ? `Kelas ${activeModuleMeta.number}: ${activeModuleMeta.title} | CPNS Learning Hub`
        : activeTab === 'exam'
          ? currentPath.startsWith('/simulasi/')
            ? `Simulasi: ${selectedSetupPkg.title} | CPNS Learning Hub`
            : 'Persiapan Simulasi CAT SKD CPNS | CPNS Learning Hub'
          : displayedAttempt
            ? `Rapor Hasil: ${displayedAttempt.packageTitle} | CPNS Learning Hub`
            : historySubview === 'leaderboard'
              ? 'Papan Peringkat Nasional Simulasi CAT | CPNS Learning Hub'
              : 'Hasil & Riwayat Simulasi CAT | CPNS Learning Hub';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

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
        onPauseExam={handlePauseExam}
        onFinishExam={finishExam}
      />
    );
  }

  const navItems: {
    id: AppTab;
    label: string;
    mobileLabel: string;
    href: string;
    icon: React.ReactNode;
    mobileIcon: React.ReactNode;
    badge?: React.ReactNode;
    mobileBadge?: string;
    mobileAlert?: boolean;
  }[] = [
    {
      id: 'home',
      label: 'Beranda belajar',
      mobileLabel: 'Beranda',
      href: buildHomePath(),
      icon: <DashboardIcon size={16} />,
      mobileIcon: <DashboardIcon size={20} />,
    },
    {
      id: 'study',
      label: 'Kelas & modul SKD',
      mobileLabel: 'Kelas',
      href: buildStudyPath(activeModuleId),
      icon: <CourseIcon size={16} />,
      mobileIcon: <CourseIcon size={20} />,
      badge: (
        <span className="badge">
          {completedModules.length}/{STUDY_MODULES.length}
        </span>
      ),
      mobileBadge: `${completedModules.length}/${STUDY_MODULES.length}`,
    },
    {
      id: 'exam',
      label: 'Simulasi ujian',
      mobileLabel: 'Simulasi',
      href: buildExamHubPath(),
      icon: <ExamIcon size={16} />,
      mobileIcon: <ExamIcon size={20} />,
      badge: activeSession ? (
        <span className="lozenge lozenge-warning">
          {formatCountdown(activeSession.remainingSeconds)}
        </span>
      ) : undefined,
      mobileAlert: Boolean(activeSession),
    },
    {
      id: 'history',
      label: 'Hasil & peringkat',
      mobileLabel: 'Hasil',
      href: buildHistoryPath(null),
      icon: <ReportIcon size={16} />,
      mobileIcon: <ReportIcon size={20} />,
      badge: history.length > 0 ? <span className="badge">{history.length}</span> : undefined,
      mobileBadge: history.length > 0 ? String(history.length) : undefined,
    },
  ];

  const sectionTitle =
    activeTab === 'home'
      ? 'Beranda belajar & dasbor'
      : activeTab === 'study'
        ? `Kelas · Modul ${activeModuleMeta.number}: ${activeModuleMeta.title}`
        : activeTab === 'exam'
          ? 'Pusat asesmen & persiapan CAT'
          : displayedAttempt
            ? `Rapor detail: ${displayedAttempt.packageTitle}`
            : historySubview === 'leaderboard'
              ? 'Papan peringkat nasional per paket'
              : 'Rapor hasil & riwayat simulasi';

  const cloudStatusLabel =
    syncStatus === 'syncing'
      ? 'Sinkron...'
      : syncStatus === 'synced'
        ? 'Sinkron'
        : 'Lokal';

  // Mode 1: LMS Workspace Shell
  return (
    <div className="lms-shell">
      {/* Left Navigation Sidebar (Desktop > 996px) */}
      <aside className="lms-sidebar" aria-label="Navigasi LMS">
        <div className="lms-sidebar-top">
          <a
            href={buildHomePath()}
            className="lms-brand"
            onClick={(e) => {
              if (!shouldHandleClientClick(e)) return;
              e.preventDefault();
              switchTab('home');
            }}
          >
            <AppLogoIcon size={24} className="brand-glyph" />
            <span>
              <span className="lms-brand-title">CPNS Learning Hub</span>
              <span className="lms-brand-sub">LMS &amp; Simulasi CAT BKN</span>
            </span>
          </a>

          <nav className="lms-nav-group" aria-label="Menu utama LMS">
            <div className="lms-nav-label">Menu pembelajaran</div>
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="lms-nav-item"
                aria-current={activeTab === item.id ? 'page' : undefined}
                onClick={(e) => {
                  if (!shouldHandleClientClick(e)) return;
                  e.preventDefault();
                  switchTab(item.id);
                }}
              >
                <span className="lms-nav-item-left">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.badge}
              </a>
            ))}
          </nav>
        </div>

        <div className="lms-sidebar-footer">
          {/* Cloud Sync Profile Widget */}
          <div className="lms-sidebar-widget">
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <span className="h-xsmall">{cloudProfile.displayName}</span>
              <span
                className={`lozenge ${
                  syncStatus === 'synced'
                    ? 'lozenge-success'
                    : syncStatus === 'syncing'
                      ? 'lozenge-info'
                      : 'lozenge-warning'
                }`}
              >
                {syncStatus === 'synced' ? 'Cloud D1' : cloudStatusLabel}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-compact"
              onClick={() => setSyncModalOpen(true)}
            >
              <CloudIcon size={14} />
              <span>Sinkronisasi perangkat</span>
            </button>
          </div>

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
        {/* Top Context App Bar */}
        <header className="lms-contextbar">
          <div className="lms-contextbar-left">
            <a
              href={buildHomePath()}
              className="lms-mobile-header-brand"
              onClick={(e) => {
                if (!shouldHandleClientClick(e)) return;
                e.preventDefault();
                switchTab('home');
              }}
            >
              <AppLogoIcon size={20} className="brand-glyph" />
              <span>CPNS LMS</span>
            </a>
            <span className="body-small text-subtle lms-contextbar-title">
              {sectionTitle}
            </span>
          </div>

          <div className="lms-contextbar-actions">
            {activeSession ? (
              <a
                href={buildExamHubPath(activeSession.packageId)}
                className="btn btn-compact btn-warning"
                onClick={(e) => {
                  if (!shouldHandleClientClick(e)) return;
                  e.preventDefault();
                  setSelectedPackageId(activeSession.packageId);
                  setIsSessionRunning(false);
                  setActiveTab('exam');
                  pushPath(buildExamHubPath(activeSession.packageId));
                }}
              >
                Dijeda · {formatCountdown(activeSession.remainingSeconds)}
              </a>
            ) : null}

            <button
              type="button"
              className={`btn btn-compact ${syncStatus === 'synced' ? 'btn-selected' : ''}`}
              onClick={() => setSyncModalOpen(true)}
              title="Pengaturan sinkronisasi Cloud D1 dan kode perangkat"
            >
              <CloudIcon size={14} />
              <span>{cloudStatusLabel}</span>
            </button>

            <ShareLinkButton
              path={currentPath}
              shareTitle={pageTitle}
              label="Share"
              copiedLabel="Link tersalin"
              compact
            />
          </div>
        </header>

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
              onResumeExam={handleResumeExam}
              onDiscardSession={handleDiscardActiveSession}
              onOpenStudy={(moduleId) => {
                const target = moduleId ?? activeModuleId;
                setActiveModuleId(target);
                setActiveTab('study');
                pushPath(buildStudyPath(target));
              }}
              onOpenHistory={(attemptId) => {
                const targetId = attemptId ?? history[0]?.id ?? null;
                setHistorySubview('attempts');
                setSelectedResultId(targetId);
                setActiveTab('history');
                pushPath(buildHistoryPath(targetId));
              }}
            />
          )}

          {activeTab === 'study' && (
            <StudyView
              activeModuleId={activeModuleId}
              onSelectModule={handleSelectModule}
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
              onChangePackage={handleChangePackage}
              onChangeFormation={setSelectedFormation}
              onConfirmStartExam={handleConfirmStartExam}
              onResumeActiveSession={handleResumeExam}
              onDiscardActiveSession={handleDiscardActiveSession}
            />
          )}

          {activeTab === 'history' && sharedReportLoading && (
            <div className="card">
              <p className="body text-subtle">Memuat rapor hasil ujian dari Cloudflare D1...</p>
            </div>
          )}

          {activeTab === 'history' && !sharedReportLoading && displayedAttempt && (
            <ResultView
              attempt={displayedAttempt}
              onUpdateFormation={handleUpdateAttemptFormation}
              onRetakePackage={(pkgId) => {
                const found = getPackageById(pkgId);
                if (found) handleOpenExamPrep(found);
              }}
              onBackHome={() => {
                setSelectedResultId(null);
                setHistorySubview('attempts');
                pushPath(buildHistoryPath(null));
              }}
              isSharedAttempt={isViewingSharedAttempt}
              sharedOwnerName={sharedReport?.ownerName}
              rankInfo={
                isViewingSharedAttempt
                  ? sharedReport?.rankInfo
                  : latestRankInfo && latestRankInfo.attemptId === displayedAttempt.id
                    ? latestRankInfo.rankInfo
                    : null
              }
              currentUserId={cloudProfile.userId}
              syncCode={cloudProfile.syncCode}
              onOpenLeaderboard={(pkgId) => handleOpenLeaderboard(pkgId)}
              onOpenAttempt={(attemptId) => {
                setSelectedResultId(attemptId);
                setHistorySubview('attempts');
                pushPath(buildHistoryPath(attemptId));
              }}
            />
          )}

          {activeTab === 'history' && !sharedReportLoading && !displayedAttempt && (
            <div className="stack-300">
              {/* Subview Switcher: Riwayat Saya <-> Papan Peringkat */}
              <div className="row-wrap" style={{ gap: '8px' }}>
                <a
                  href={buildHistoryPath(null)}
                  className={`btn btn-compact ${
                    historySubview === 'attempts' ? 'btn-selected' : ''
                  }`}
                  onClick={(e) => {
                    if (!shouldHandleClientClick(e)) return;
                    e.preventDefault();
                    setHistorySubview('attempts');
                    pushPath(buildHistoryPath(null), { scroll: false });
                  }}
                >
                  <ReportIcon size={14} />
                  <span>Riwayat saya ({history.length})</span>
                </a>
                <a
                  href={buildLeaderboardPath(leaderboardPkgId)}
                  className={`btn btn-compact ${
                    historySubview === 'leaderboard' ? 'btn-selected' : ''
                  }`}
                  onClick={(e) => {
                    if (!shouldHandleClientClick(e)) return;
                    e.preventDefault();
                    handleOpenLeaderboard(leaderboardPkgId);
                  }}
                >
                  <TrophyIcon size={14} />
                  <span>Papan peringkat</span>
                </a>
              </div>

              {historySubview === 'leaderboard' ? (
                <LeaderboardView
                  selectedPackageId={leaderboardPkgId}
                  onSelectPackage={(pkgId) => {
                    setLeaderboardPkgId(pkgId);
                    pushPath(buildLeaderboardPath(pkgId), { scroll: false });
                  }}
                  currentUserId={cloudProfile.userId}
                  syncCode={cloudProfile.syncCode}
                  onStartPackage={handleOpenExamPrep}
                  onOpenAttempt={(attemptId) => {
                    setSelectedResultId(attemptId);
                    setHistorySubview('attempts');
                    pushPath(buildHistoryPath(attemptId));
                  }}
                />
              ) : (
                <>
                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <h1 className="h-xlarge">Hasil &amp; riwayat simulasi ujian</h1>
                      <p className="body text-subtle" style={{ marginTop: '4px' }}>
                        Riwayat tersimpan otomatis di peramban dan tersinkron ke Cloudflare D1 melalui kode perangkat.
                      </p>
                    </div>
                    {history.length > 0 && (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          setHistory([]);
                          setSelectedResultId(null);
                          pushPath(buildHistoryPath(null), { replace: true });
                          void clearCloudAttempts(cloudProfile.syncCode);
                        }}
                      >
                        Hapus seluruh riwayat
                      </button>
                    )}
                  </div>

                  {history.length === 0 ? (
                    <div className="card stack-200" style={{ alignItems: 'flex-start' }}>
                      <h2 className="h-small">Belum ada riwayat simulasi</h2>
                      <p className="body text-subtle">
                        Mulai salah satu paket simulasi 110 soal atau latihan fokus subtes untuk melihat rapor nilai, peta pembahasan, peringkat, dan mengunduh laporan PDF.
                      </p>
                      <a
                        href={buildExamHubPath(FULL_PACKAGES[0].id)}
                        className="btn btn-primary"
                        onClick={(e) => {
                          if (!shouldHandleClientClick(e)) return;
                          e.preventDefault();
                          handleOpenExamPrep(FULL_PACKAGES[0]);
                        }}
                      >
                        Siapkan simulasi 110 soal sekarang
                      </a>
                    </div>
                  ) : (
                    <>
                      {/* Mobile History Cards (shown <= 768px) */}
                      <div className="history-mobile-list">
                        {history.map((item) => {
                          const ev = summarizeAttempt(item);
                          const detailPath = buildHistoryPath(item.id);
                          return (
                            <article key={item.id} className="card stack-200">
                              <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                                <span className="body-small">{formatDateTimeId(item.finishedAt)}</span>
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
                              </div>
                              <div>
                                <h2 className="h-small">{item.packageTitle}</h2>
                                <span className="body-small text-subtle">{ev.formation.shortLabel}</span>
                              </div>
                              <div
                                className="well-sunken row-wrap"
                                style={{ justifyContent: 'space-between', padding: '10px 12px' }}
                              >
                                <div className="mono">
                                  <strong style={{ fontSize: '18px' }}>{ev.totalScore}</strong>{' '}
                                  <span className="body-small">/ {ev.maxTotalScore}</span>
                                </div>
                                <span className="body-small mono">
                                  TWK {ev.subtests.TWK.score} · TIU {ev.subtests.TIU.score} · TKP {ev.subtests.TKP.score}
                                </span>
                              </div>
                              <div className="row-wrap" style={{ gap: '8px' }}>
                                <a
                                  href={detailPath}
                                  className="btn btn-primary"
                                  style={{ flex: 1 }}
                                  onClick={(e) => {
                                    if (!shouldHandleClientClick(e)) return;
                                    e.preventDefault();
                                    setSelectedResultId(item.id);
                                    pushPath(detailPath);
                                  }}
                                >
                                  Lihat pembahasan
                                </a>
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => {
                                    void exportResultToPdf(item, ev);
                                  }}
                                >
                                  <DownloadIcon size={14} />
                                  PDF
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      {/* Desktop History Table (shown > 768px) */}
                      <div className="table-wrap history-desktop-table">
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
                              const detailPath = buildHistoryPath(item.id);
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
                                      <a
                                        href={detailPath}
                                        className="btn btn-compact"
                                        onClick={(e) => {
                                          if (!shouldHandleClientClick(e)) return;
                                          e.preventDefault();
                                          setSelectedResultId(item.id);
                                          pushPath(detailPath);
                                        }}
                                      >
                                        Lihat pembahasan
                                      </a>
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
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </main>

        <footer className="footer">
          <div className="footer-inner">
            <span className="body-small">
              cpns.imambas.my.id · LMS, Sinkronisasi D1, &amp; Simulasi CAT SKD CPNS (Kepmenpan RB No. 321/2024).
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

      {/* Fixed Bottom Web-App Navigation Bar (Mobile <= 996px) */}
      <nav className="lms-bottom-nav" aria-label="Navigasi utama aplikasi">
        {navItems.map((item) => {
          const isCurrent = activeTab === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              className="lms-bottom-nav-item"
              aria-current={isCurrent ? 'page' : undefined}
              onClick={(e) => {
                if (!shouldHandleClientClick(e)) return;
                e.preventDefault();
                switchTab(item.id);
              }}
            >
              <span className="lms-bottom-nav-icon-wrap" aria-hidden="true">
                {item.mobileIcon}
                {item.mobileAlert ? (
                  <span className="lms-bottom-nav-dot" />
                ) : item.mobileBadge ? (
                  <span className="lms-bottom-nav-pill">{item.mobileBadge}</span>
                ) : null}
              </span>
              <span className="lms-bottom-nav-label">{item.mobileLabel}</span>
            </a>
          );
        })}
      </nav>

      {/* Cloud Sync & Profile Modal */}
      <CloudSyncModal
        open={syncModalOpen}
        profile={cloudProfile}
        syncStatus={syncStatus}
        onClose={() => setSyncModalOpen(false)}
        onSaveDisplayName={handleSaveDisplayName}
        onManualSync={handleManualSync}
        onLinkSyncCode={handleLinkSyncCode}
      />
    </div>
  );
};

export default App;

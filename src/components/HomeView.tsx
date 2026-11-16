import React, { useMemo } from 'react';
import type { ActiveExamSession, ExamAttempt, FormationType, QuestionPackage } from '../types';
import { ALL_PACKAGES, SSCASN_PORTAL } from '../data/questionBank';
import { FORMATION_RULES, formatCountdown, summarizeAttempt } from '../utils/scoring';
import type { StudyModuleId } from './StudyView';
import {
  BookIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  CourseIcon,
  ExternalLinkIcon,
  PlayIcon,
  ReportIcon,
} from './Icons';

interface HomeViewProps {
  selectedFormation: FormationType;
  onSelectFormation: (formation: FormationType) => void;
  activeSession: ActiveExamSession | null;
  history: ExamAttempt[];
  completedModules: string[];
  totalModulesCount: number;
  onStartPackage: (pkg: QuestionPackage) => void;
  onResumeExam: () => void;
  onDiscardSession: () => void;
  onOpenStudy: (moduleId?: StudyModuleId) => void;
  onOpenHistory: (attemptId?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  selectedFormation,
  onSelectFormation,
  activeSession,
  history,
  completedModules,
  totalModulesCount,
  onStartPackage,
  onResumeExam,
  onDiscardSession,
  onOpenStudy,
  onOpenHistory,
}) => {
  const fullPackages = ALL_PACKAGES.filter((p) => p.isFullSimulation);
  const focusedPackages = ALL_PACKAGES.filter((p) => !p.isFullSimulation);
  const activeRule = FORMATION_RULES[selectedFormation];

  const stats = useMemo(() => {
    const byPackage = new Map<string, { attempts: number; bestScore: number; maxScore: number }>();
    let bestFullScore = 0;
    let bestAttemptId: string | undefined;

    for (const item of history) {
      const ev = summarizeAttempt(item);
      const prev = byPackage.get(item.packageId);
      if (!prev) {
        byPackage.set(item.packageId, {
          attempts: 1,
          bestScore: ev.totalScore,
          maxScore: ev.maxTotalScore,
        });
      } else {
        byPackage.set(item.packageId, {
          attempts: prev.attempts + 1,
          bestScore: Math.max(prev.bestScore, ev.totalScore),
          maxScore: ev.maxTotalScore,
        });
      }

      if (ev.totalScore >= bestFullScore) {
        bestFullScore = ev.totalScore;
        bestAttemptId = item.id;
      }
    }

    const latestAttempt = history[0];
    const latestEval = latestAttempt ? summarizeAttempt(latestAttempt) : null;

    return {
      byPackage,
      bestAttemptId,
      latestAttempt,
      latestEval,
    };
  }, [history]);

  const modulePct =
    totalModulesCount > 0
      ? Math.round((completedModules.length / totalModulesCount) * 100)
      : 0;

  return (
    <div className="stack-400">
      {/* Paused / Active Session Resume Notice */}
      {activeSession && (
        <div className="section-message section-message-warning" role="status">
          <span className="section-message-icon">
            <ClockIcon size={18} />
          </span>
          <div className="section-message-content">
            <h2 className="h-small">Sesi try out belum diselesaikan (timer dijeda)</h2>
            <p className="section-message-body">
              Anda memiliki sesi tersimpan pada <strong>{activeSession.packageTitle}</strong> dengan{' '}
              {Object.keys(activeSession.answers).length} soal terjawab dan sisa waktu{' '}
              <span className="mono">{formatCountdown(activeSession.remainingSeconds)}</span>.
            </p>
            <div className="row-wrap" style={{ marginTop: '8px' }}>
              <button type="button" className="btn btn-warning" onClick={onResumeExam}>
                <PlayIcon size={16} />
                Lanjutkan ujian sekarang
              </button>
              <button type="button" className="btn btn-subtle" onClick={onDiscardSession}>
                Hapus sesi tersimpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Header */}
      <section className="stack-200" style={{ gap: '8px' }}>
        <div className="row-wrap" style={{ gap: '8px' }}>
          <span className="lozenge lozenge-info">LMS Persiapan CPNS</span>
          <span className="tag tag-blue">Tanpa login · Progres tersimpan otomatis</span>
        </div>
        <h1 className="h-xlarge">Beranda belajar &amp; simulasi CAT SKD CPNS</h1>
        <p className="body-large" style={{ maxWidth: '72ch' }}>
          Ikuti alur belajar terstruktur mulai dari modul materi, latihan fokus subtes, hingga simulasi 110 soal berstandar Kepmenpan RB No. 321 Tahun 2024 lengkap dengan pembahasan, link sumber, dan ekspor PDF.
        </p>
      </section>

      {/* 4 LMS KPI Cards */}
      <section className="grid-4" aria-label="Ringkasan progres belajar">
        {/* Card 1: Target Formasi */}
        <article className="kpi-card">
          <span className="body-small">Target formasi aktif</span>
          <select
            aria-label="Pilih target formasi aktif"
            className="select-input"
            value={selectedFormation}
            onChange={(e) => onSelectFormation(e.target.value as FormationType)}
          >
            {(Object.keys(FORMATION_RULES) as FormationType[]).map((key) => (
              <option key={key} value={key}>
                {FORMATION_RULES[key].shortLabel}
              </option>
            ))}
          </select>
          <span className="body-small">{activeRule.description}</span>
        </article>

        {/* Card 2: Progres Kelas Modul */}
        <article className="kpi-card">
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <span className="body-small">Progres kelas modul</span>
            <span className="lozenge lozenge-info mono">{modulePct}%</span>
          </div>
          <div className="metric-medium mono">
            {completedModules.length} / {totalModulesCount}{' '}
            <span className="body text-subtle">modul</span>
          </div>
          <div className="chart-bar-track" aria-label={`Progres kelas ${modulePct}%`}>
            <div
              className="chart-bar-fill"
              style={{ width: `${modulePct}%`, backgroundColor: 'var(--brand-primary)' }}
            />
          </div>
          <div style={{ marginTop: 'auto' }}>
            <button
              type="button"
              className="btn btn-compact"
              onClick={() => onOpenStudy()}
            >
              <CourseIcon size={14} />
              Lanjutkan modul belajar
            </button>
          </div>
        </article>

        {/* Card 3: Hasil Terakhir / Riwayat */}
        <article className="kpi-card">
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <span className="body-small">Simulasi diselesaikan</span>
            <span className="badge">{history.length}x</span>
          </div>
          {stats.latestEval && stats.latestAttempt ? (
            <>
              <div className="metric-medium mono">
                {stats.latestEval.totalScore}{' '}
                <span className="body text-subtle">/ {stats.latestEval.maxTotalScore}</span>
              </div>
              <span className="body-small">
                Terakhir: {stats.latestEval.passed ? 'Lulus PG' : 'Belum lulus PG'}
              </span>
              <div style={{ marginTop: 'auto' }}>
                <button
                  type="button"
                  className="btn btn-compact"
                  onClick={() => onOpenHistory(stats.latestAttempt.id)}
                >
                  <ReportIcon size={14} />
                  Buka rapor terakhir
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="metric-medium text-subtle">—</div>
              <span className="body-small">Belum ada riwayat pengerjaan</span>
              <div style={{ marginTop: 'auto' }}>
                <button
                  type="button"
                  className="btn btn-compact"
                  onClick={() => onStartPackage(focusedPackages[0])}
                >
                  Mulai latihan 30 soal
                </button>
              </div>
            </>
          )}
        </article>

        {/* Card 4: Main Primary Action */}
        <article className="kpi-card" style={{ justifyContent: 'space-between' }}>
          <div className="stack-200" style={{ gap: '4px' }}>
            <span className="body-small">Simulasi penuh CAT BKN</span>
            <div className="h-small">110 soal · 100 menit</div>
            <span className="body-small">
              Timer mulai hanya setelah Anda menekan konfirmasi mulai ujian.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onStartPackage(fullPackages[0])}
          >
            Siapkan simulasi 110 soal (Paket 1)
            <ChevronRightIcon size={16} />
          </button>
        </article>
      </section>

      {/* Guided 3-Step LMS Learning Roadmap */}
      <section className="stack-200">
        <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 className="h-medium">Alur belajar terpandu (3 langkah persiapan)</h2>
            <p className="body text-subtle" style={{ marginTop: '4px' }}>
              Ikuti tahapan berikut agar belajar materi dan latihan soal terasa lebih terarah.
            </p>
          </div>
          <a
            href={SSCASN_PORTAL.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link body-small"
          >
            Portal resmi SSCASN BKN
            <ExternalLinkIcon size={12} />
          </a>
        </div>

        <div className="roadmap-grid">
          <article className="roadmap-card">
            <div className="row-wrap" style={{ gap: '10px' }}>
              <span className="roadmap-step-num">1</span>
              <span className="h-small">Pelajari 5 modul kelas</span>
            </div>
            <p className="body">
              Pahami aturan Passing Grade Kepmenpan RB 321/2024, rangkuman TWK Kerjago, video pembahasan TIU Figural, dan trik skor 5 TKP.
            </p>
            <div style={{ marginTop: 'auto' }}>
              <button type="button" className="btn btn-compact" onClick={() => onOpenStudy('modul-regulasi')}>
                <BookIcon size={14} />
                Buka kelas &amp; modul ({completedModules.length}/{totalModulesCount})
              </button>
            </div>
          </article>

          <article className="roadmap-card">
            <div className="row-wrap" style={{ gap: '10px' }}>
              <span className="roadmap-step-num">2</span>
              <span className="h-small">Latihan fokus subtes</span>
            </div>
            <p className="body">
              Latih kecepatan per subtes dengan paket singkat (30 soal TWK, 35 soal TIU, atau 45 soal TKP) sebelum mengerjakan 110 soal penuh.
            </p>
            <div style={{ marginTop: 'auto' }}>
              <button
                type="button"
                className="btn btn-compact"
                onClick={() => onStartPackage(focusedPackages[0])}
              >
                <PlayIcon size={14} />
                Pilih latihan fokus subtes
              </button>
            </div>
          </article>

          <article className="roadmap-card">
            <div className="row-wrap" style={{ gap: '10px' }}>
              <span className="roadmap-step-num">3</span>
              <span className="h-small">Simulasi penuh &amp; unduh PDF</span>
            </div>
            <p className="body">
              Uji kesiapan pada paket penuh 110 soal selama 100 menit, evaluasi kelulusan Passing Grade, lalu unduh laporan PDF beserta pembahasan &amp; link sumber.
            </p>
            <div style={{ marginTop: 'auto' }}>
              <button
                type="button"
                className="btn btn-compact"
                onClick={() => onStartPackage(fullPackages[0])}
              >
                <ChevronRightIcon size={14} />
                Siapkan simulasi 110 soal
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Full Simulation Packages Catalog */}
      <section className="stack-200">
        <div>
          <h2 className="h-medium">Paket simulasi penuh CAT SKD (110 soal · 100 menit)</h2>
          <p className="body text-subtle" style={{ marginTop: '4px' }}>
            Soal diambil langsung dari arsip modul Tryout LolosASN dan Bank Drilling CPNS 2024/2025 pada Google Drive sumber belajar.
          </p>
        </div>

        <div className="grid-2">
          {fullPackages.map((pkg, idx) => {
            const pkgStats = stats.byPackage.get(pkg.id);
            return (
              <article key={pkg.id} className="card stack-200">
                <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                  <span className="lozenge lozenge-success">
                    <CheckCircleIcon size={14} />
                    Komposisi asli BKN
                  </span>
                  <div className="row-wrap" style={{ gap: '6px' }}>
                    {pkgStats && (
                      <span className="lozenge lozenge-info mono">
                        Terbaik: {pkgStats.bestScore}/{pkgStats.maxScore}
                      </span>
                    )}
                    <span className="tag tag-blue">{pkg.durationMinutes} menit</span>
                  </div>
                </div>

                <div className="stack-200" style={{ gap: '6px' }}>
                  <h3 className="h-small">{pkg.title}</h3>
                  <p className="body">{pkg.description}</p>
                </div>

                <div className="well-sunken stack-200" style={{ gap: '4px', padding: '12px 14px' }}>
                  <div className="body-small">
                    <strong>Rincian soal:</strong> 30 TWK · 35 TIU · 45 TKP (total 110 butir)
                  </div>
                  <div className="body-small">
                    <strong>Sumber dokumen:</strong>{' '}
                    <a
                      href={pkg.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                    >
                      {pkg.sourceTitle}
                      <ExternalLinkIcon size={12} />
                    </a>
                  </div>
                </div>

                <div className="row-wrap" style={{ justifyContent: 'space-between', marginTop: 'auto' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onStartPackage(pkg)}
                  >
                    Pilih paket {idx + 1}
                    <ChevronRightIcon size={16} />
                  </button>
                  {pkgStats && (
                    <span className="body-small text-subtlest">
                      Dikerjakan {pkgStats.attempts}x
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Focused Subtest Practice */}
      <section className="stack-200">
        <div>
          <h2 className="h-medium">Latihan fokus per subtes</h2>
          <p className="body text-subtle" style={{ marginTop: '4px' }}>
            Latihan ringkas untuk mengasah kecepatan pada satu subtes tertentu.
          </p>
        </div>

        <div className="grid-3">
          {focusedPackages.map((pkg) => {
            const pkgStats = stats.byPackage.get(pkg.id);
            return (
              <article key={pkg.id} className="card stack-200">
                <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                  <span className="tag tag-teal">{pkg.compositionLabel}</span>
                  <span className="body-small mono">{pkg.durationMinutes} mnt</span>
                </div>
                <h3 className="h-small">{pkg.title}</h3>
                <p className="body">{pkg.description}</p>
                {pkgStats && (
                  <span className="body-small">
                    Skor terbaik: <strong>{pkgStats.bestScore}</strong>/{pkgStats.maxScore} ({pkgStats.attempts}x)
                  </span>
                )}
                <div style={{ marginTop: 'auto' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onStartPackage(pkg)}
                  >
                    Pilih latihan fokus
                    <ChevronRightIcon size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

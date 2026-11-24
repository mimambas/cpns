import React, { useMemo } from 'react';
import type { ActiveExamSession, ExamAttempt, FormationType, PackageMeta, StudyModuleId } from '../types';
import { ALL_PACKAGE_METAS, SSCASN_PORTAL, TOTAL_QUESTION_COUNT } from '../data/questionBank';
import { FORMATION_RULES, formatCountdown, summarizeAttempt } from '../utils/scoring';
import {
  buildExamHubPath,
  buildHistoryPath,
  buildStudyPath,
  shouldHandleClientClick,
} from '../utils/router';
import {
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
  onStartPackage: (pkg: PackageMeta) => void;
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
  const fullPackages = ALL_PACKAGE_METAS.filter((p) => p.isFullSimulation);
  const focusedPackages = ALL_PACKAGE_METAS.filter((p) => !p.isFullSimulation);
  const activeRule = FORMATION_RULES[selectedFormation];

  const stats = useMemo(() => {
    const byPackage = new Map<string, { attempts: number; bestScore: number; maxScore: number }>();

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
    }

    const latestAttempt = history[0];
    const latestEval = latestAttempt ? summarizeAttempt(latestAttempt) : null;

    return {
      byPackage,
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
        <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
          <h1 className="h-xlarge">Beranda belajar &amp; simulasi CAT SKD CPNS</h1>
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
        <p className="body-large" style={{ maxWidth: '72ch' }}>
          Pelajari 5 modul materi tanpa login, latih kecepatan tiap subtes, atau kerjakan 14 paket simulasi CAT SKD ({TOTAL_QUESTION_COUNT.toLocaleString('id-ID')} soal total) berstandar Kepmenpan RB No. 321 Tahun 2024 lengkap dengan link sumber soal dan ekspor PDF.
        </p>
      </section>

      {/* 4 LMS KPI Cards */}
      <section className="grid-4" aria-label="Ringkasan progres belajar">
        {/* Card 1: Target Formasi */}
        <article className="kpi-card">
          <label htmlFor="dashboard-formation-select" className="body-small">
            Target formasi aktif
          </label>
          <select
            id="dashboard-formation-select"
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
            <a
              href={buildStudyPath('modul-regulasi')}
              className="btn btn-compact"
              onClick={(e) => {
                if (!shouldHandleClientClick(e)) return;
                e.preventDefault();
                onOpenStudy();
              }}
            >
              <CourseIcon size={14} />
              Buka modul belajar
            </a>
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
                <a
                  href={buildHistoryPath(stats.latestAttempt.id)}
                  className="btn btn-compact"
                  onClick={(e) => {
                    if (!shouldHandleClientClick(e)) return;
                    e.preventDefault();
                    onOpenHistory(stats.latestAttempt.id);
                  }}
                >
                  <ReportIcon size={14} />
                  Buka rapor terakhir
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="h-medium text-subtle">Belum ada skor</div>
              <span className="body-small">Belum ada riwayat pengerjaan</span>
              <div style={{ marginTop: 'auto' }}>
                <a
                  href={buildExamHubPath(focusedPackages[0].id)}
                  className="btn btn-compact"
                  onClick={(e) => {
                    if (!shouldHandleClientClick(e)) return;
                    e.preventDefault();
                    onStartPackage(focusedPackages[0]);
                  }}
                >
                  Mulai latihan 30 soal
                </a>
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
          <a
            href={buildExamHubPath(fullPackages[0].id)}
            className="btn btn-primary"
            onClick={(e) => {
              if (!shouldHandleClientClick(e)) return;
              e.preventDefault();
              onStartPackage(fullPackages[0]);
            }}
          >
            Siapkan simulasi 110 soal (Paket 1)
          </a>
        </article>
      </section>

      {/* Full Simulation Packages Catalog */}
      <section className="stack-200">
        <div>
          <h2 className="h-medium">Paket simulasi CAT SKD ({fullPackages.length} paket)</h2>
          <p className="body text-subtle" style={{ marginTop: '4px' }}>
            Soal diambil langsung dari arsip Tryout LolosASN, Bank Drilling CPNS 2024/2025, dan 10 paket CAT Modul Resmi SKD + SKB CPNS 2024-2025 pada Google Drive sumber belajar.
          </p>
        </div>

        <div className="grid-2">
          {fullPackages.map((pkg, idx) => {
            const pkgStats = stats.byPackage.get(pkg.id);
            return (
              <article key={pkg.id} className="card stack-200">
                <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                  <span className="body-small mono">
                    {pkg.compositionLabel} · {pkg.durationMinutes} menit
                  </span>
                  {pkgStats && (
                    <span className="lozenge lozenge-info mono">
                      Terbaik: {pkgStats.bestScore}/{pkgStats.maxScore}
                    </span>
                  )}
                </div>

                <div className="stack-200" style={{ gap: '6px' }}>
                  <h3 className="h-small">{pkg.title}</h3>
                  <p className="body">{pkg.description}</p>
                </div>

                <div className="well-sunken stack-200" style={{ gap: '4px', padding: '12px 14px' }}>
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
                  <a
                    href={buildExamHubPath(pkg.id)}
                    className="btn"
                    onClick={(e) => {
                      if (!shouldHandleClientClick(e)) return;
                      e.preventDefault();
                      onStartPackage(pkg);
                    }}
                  >
                    Pilih paket {idx + 1}
                  </a>
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
                  <span className="body-small mono">{pkg.compositionLabel}</span>
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
                  <a
                    href={buildExamHubPath(pkg.id)}
                    className="btn"
                    onClick={(e) => {
                      if (!shouldHandleClientClick(e)) return;
                      e.preventDefault();
                      onStartPackage(pkg);
                    }}
                  >
                    Pilih latihan fokus
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

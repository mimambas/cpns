import React, { useMemo, useState } from 'react';
import type { ActiveExamSession, ExamAttempt, FormationType, QuestionPackage } from '../types';
import { ALL_PACKAGES } from '../data/questionBank';
import { FORMATION_RULES, formatCountdown, summarizeAttempt } from '../utils/scoring';
import { buildExamHubPath, shouldHandleClientClick } from '../utils/router';
import {
  CheckCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  InfoIcon,
} from './Icons';
import { ShareLinkButton } from './ShareLinkButton';

interface ExamSetupViewProps {
  selectedPackage: QuestionPackage;
  selectedFormation: FormationType;
  activeSession: ActiveExamSession | null;
  history: ExamAttempt[];
  onChangePackage: (pkgId: string) => void;
  onChangeFormation: (formation: FormationType) => void;
  onConfirmStartExam: (pkg: QuestionPackage, formationId: FormationType) => void;
  onResumeActiveSession: () => void;
  onDiscardActiveSession: () => void;
}

type PackageFilter = 'ALL' | 'FULL' | 'FOCUSED';

export const ExamSetupView: React.FC<ExamSetupViewProps> = ({
  selectedPackage,
  selectedFormation,
  activeSession,
  history,
  onChangePackage,
  onChangeFormation,
  onConfirmStartExam,
  onResumeActiveSession,
  onDiscardActiveSession,
}) => {
  const [pkgFilter, setPkgFilter] = useState<PackageFilter>('ALL');

  const filteredPackages = useMemo(() => {
    if (pkgFilter === 'FULL') return ALL_PACKAGES.filter((p) => p.isFullSimulation);
    if (pkgFilter === 'FOCUSED') return ALL_PACKAGES.filter((p) => !p.isFullSimulation);
    return ALL_PACKAGES;
  }, [pkgFilter]);

  const bestByPkg = useMemo(() => {
    const map = new Map<string, { score: number; max: number; count: number }>();
    for (const item of history) {
      const ev = summarizeAttempt(item);
      const prev = map.get(item.packageId);
      if (!prev) {
        map.set(item.packageId, { score: ev.totalScore, max: ev.maxTotalScore, count: 1 });
      } else {
        map.set(item.packageId, {
          score: Math.max(prev.score, ev.totalScore),
          max: ev.maxTotalScore,
          count: prev.count + 1,
        });
      }
    }
    return map;
  }, [history]);

  const twkCount = selectedPackage.questions.filter((q) => q.category === 'TWK').length;
  const tiuCount = selectedPackage.questions.filter((q) => q.category === 'TIU').length;
  const tkpCount = selectedPackage.questions.filter((q) => q.category === 'TKP').length;
  const maxScore = selectedPackage.questions.length * 5;
  const packagePath = buildExamHubPath(selectedPackage.id);

  return (
    <div className="stack-300">
      <section className="stack-200" style={{ gap: '6px' }}>
        <h1 className="h-xlarge">Persiapan simulasi ujian CAT SKD CPNS</h1>
        <p className="body-large" style={{ maxWidth: '72ch' }}>
          Pilih paket soal dan kategori formasi target terlebih dahulu. Timer hitung mundur hanya akan berjalan setelah Anda menekan tombol <strong>Mulai kerjakan ujian sekarang</strong>.
        </p>
      </section>

      {/* Paused session banner */}
      {activeSession && (
        <div className="section-message section-message-warning" role="status">
          <span className="section-message-icon">
            <ClockIcon size={18} />
          </span>
          <div className="section-message-content">
            <h2 className="h-small">Sesi ujian sebelumnya sedang dijeda</h2>
            <p className="section-message-body">
              Anda masih memiliki sesi tersimpan untuk{' '}
              <strong>{activeSession.packageTitle}</strong> ({Object.keys(activeSession.answers).length} soal terjawab, sisa waktu{' '}
              <span className="mono">{formatCountdown(activeSession.remainingSeconds)}</span>). Waktu tidak berkurang selama Anda berada di halaman persiapan ini.
            </p>
            <div className="row-wrap" style={{ marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onResumeActiveSession}
              >
                Lanjutkan sesi ujian
              </button>
              <button
                type="button"
                className="btn"
                onClick={onDiscardActiveSession}
              >
                Batalkan &amp; pilih paket lain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Assessment Hub */}
      <div className="setup-layout">
        {/* Left: Visual Package Browser + Synced Select */}
        <section className="stack-200">
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <h2 className="h-medium">1. Pilih paket simulasi atau latihan</h2>
            <div className="row-wrap" style={{ gap: '6px' }}>
              {(
                [
                  { id: 'ALL', label: `Semua (${ALL_PACKAGES.length})` },
                  { id: 'FULL', label: 'Simulasi CAT lengkap' },
                  { id: 'FOCUSED', label: 'Latihan fokus' },
                ] as { id: PackageFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`btn btn-compact ${pkgFilter === tab.id ? 'btn-selected' : ''}`}
                  onClick={() => setPkgFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="setup-package-select" className="form-label">
              Pilihan cepat paket soal
            </label>
            <select
              id="setup-package-select"
              className="select-input"
              value={selectedPackage.id}
              onChange={(e) => onChangePackage(e.target.value)}
            >
              {ALL_PACKAGES.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title} ({pkg.questions.length} soal · {pkg.durationMinutes} mnt)
                </option>
              ))}
            </select>
          </div>

          <div className="stack-200" style={{ gap: '10px' }} role="radiogroup" aria-label="Daftar paket soal">
            {filteredPackages.map((pkg) => {
              const isSelected = pkg.id === selectedPackage.id;
              const best = bestByPkg.get(pkg.id);
              const href = buildExamHubPath(pkg.id);
              return (
                <a
                  key={pkg.id}
                  href={href}
                  role="radio"
                  aria-checked={isSelected}
                  data-selected={isSelected}
                  className="pkg-choice-card"
                  onClick={(e) => {
                    if (!shouldHandleClientClick(e)) return;
                    e.preventDefault();
                    onChangePackage(pkg.id);
                    if (window.innerWidth <= 996) {
                      document.getElementById('exam-briefing-card')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }
                  }}
                >
                  <div className="row-wrap" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <span className="body-small mono">
                      {pkg.compositionLabel} · {pkg.durationMinutes} menit
                    </span>
                    {best && (
                      <span className="lozenge lozenge-info mono">
                        Skor terbaik: {best.score}/{best.max}
                      </span>
                    )}
                  </div>
                  <div className="h-small">{pkg.title}</div>
                  <p className="body text-subtle">{pkg.description}</p>
                </a>
              );
            })}
          </div>
        </section>

        {/* Right Sticky (and Top-First on Mobile <= 996px): Briefing & Confirmation Card */}
        <aside
          id="exam-briefing-card"
          className="card briefing-card stack-300"
          aria-label="Ringkasan dan mulai ujian"
        >
          <div className="stack-200" style={{ gap: '12px' }}>
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <h2 className="h-medium">2. Lembar briefing &amp; mulai</h2>
              <ShareLinkButton
                path={packagePath}
                shareTitle={`Simulasi CPNS: ${selectedPackage.title}`}
                shareText={`Coba kerjakan ${selectedPackage.title} (${selectedPackage.questions.length} soal) di CPNS Learning Hub`}
                label="Share paket"
                copiedLabel="Link tersalin"
                compact
              />
            </div>

            <div className="form-field mobile-only-field">
              <label htmlFor="mobile-setup-package-select" className="form-label">
                Ganti paket simulasi
              </label>
              <select
                id="mobile-setup-package-select"
                className="select-input"
                value={selectedPackage.id}
                onChange={(e) => onChangePackage(e.target.value)}
              >
                {ALL_PACKAGES.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.title} ({pkg.questions.length} soal)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="setup-formation-select" className="form-label">
                Kategori formasi acuan passing grade
              </label>
              <select
                id="setup-formation-select"
                className="select-input"
                value={selectedFormation}
                onChange={(e) => onChangeFormation(e.target.value as FormationType)}
              >
                {(Object.keys(FORMATION_RULES) as FormationType[]).map((key) => (
                  <option key={key} value={key}>
                    {FORMATION_RULES[key].label}
                  </option>
                ))}
              </select>
              <span className="body-small">
                {FORMATION_RULES[selectedFormation].description}
              </span>
            </div>

            <div className="well-sunken stack-200" style={{ gap: '6px' }}>
              <div className="h-xsmall">{selectedPackage.title}</div>
              <div className="body-small">
                <strong>Sumber soal:</strong>{' '}
                <a
                  href={selectedPackage.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  {selectedPackage.sourceTitle}
                  <ExternalLinkIcon size={12} />
                </a>
              </div>
            </div>

            <div className="table-wrap">
              <table className="ads-table">
                <tbody>
                  <tr>
                    <td>Total jumlah soal</td>
                    <td className="mono">
                      <strong>{selectedPackage.questions.length} butir</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>Komposisi subtes</td>
                    <td className="mono">
                      {twkCount > 0 ? `TWK ${twkCount}` : null}
                      {twkCount > 0 && tiuCount > 0 ? ' · ' : null}
                      {tiuCount > 0 ? `TIU ${tiuCount}` : null}
                      {(twkCount > 0 || tiuCount > 0) && tkpCount > 0 ? ' · ' : null}
                      {tkpCount > 0 ? `TKP ${tkpCount}` : null}
                    </td>
                  </tr>
                  <tr>
                    <td>Alokasi waktu timer</td>
                    <td className="mono">
                      <strong>{selectedPackage.durationMinutes} menit</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>Skor maksimal</td>
                    <td className="mono">{maxScore} poin</td>
                  </tr>
                  <tr>
                    <td>Sistem pembobotan</td>
                    <td>TWK &amp; TIU (+5 / 0) · TKP (poin 1–5 / kosong 0)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="section-message section-message-info">
            <span className="section-message-icon">
              <InfoIcon size={16} />
            </span>
            <div className="section-message-content">
              <p className="section-message-body">
                Saat masuk ruang ujian, tampilan fokus aktif penuh dan Anda tetap dapat menjeda ujian kapan saja tanpa kehilangan jawaban.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={activeSession ? 'btn' : 'btn btn-primary'}
            style={{ width: '100%' }}
            onClick={() => onConfirmStartExam(selectedPackage, selectedFormation)}
          >
            <CheckCircleIcon size={16} />
            {activeSession ? 'Mulai sesi baru sekarang' : 'Mulai kerjakan ujian sekarang'}
          </button>
        </aside>
      </div>
    </div>
  );
};

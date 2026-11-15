import React from 'react';
import type { ActiveExamSession, FormationType, QuestionPackage } from '../types';
import { ALL_PACKAGES } from '../data/questionBank';
import { FORMATION_RULES, formatCountdown } from '../utils/scoring';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  ExternalLinkIcon,
  InfoIcon,
} from './Icons';

interface ExamSetupViewProps {
  selectedPackage: QuestionPackage;
  selectedFormation: FormationType;
  activeSession: ActiveExamSession | null;
  onChangePackage: (pkgId: string) => void;
  onChangeFormation: (formation: FormationType) => void;
  onConfirmStartExam: (pkg: QuestionPackage, formationId: FormationType) => void;
  onResumeActiveSession: () => void;
  onDiscardActiveSession: () => void;
}

export const ExamSetupView: React.FC<ExamSetupViewProps> = ({
  selectedPackage,
  selectedFormation,
  activeSession,
  onChangePackage,
  onChangeFormation,
  onConfirmStartExam,
  onResumeActiveSession,
  onDiscardActiveSession,
}) => {
  const twkCount = selectedPackage.questions.filter((q) => q.category === 'TWK').length;
  const tiuCount = selectedPackage.questions.filter((q) => q.category === 'TIU').length;
  const tkpCount = selectedPackage.questions.filter((q) => q.category === 'TKP').length;
  const maxScore = selectedPackage.questions.length * 5;

  return (
    <div className="stack-400">
      <section className="stack-200">
        <div className="row-wrap">
          <span className="lozenge lozenge-info">Persiapan simulasi</span>
          <span className="tag tag-blue">Timer belum berjalan</span>
        </div>
        <h1 className="h-xlarge">Persiapan simulasi ujian CAT SKD CPNS</h1>
        <p className="body-large" style={{ maxWidth: '72ch' }}>
          Atur paket soal dan kategori formasi terlebih dahulu. Waktu hitung mundur hanya akan mulai berjalan setelah Anda menekan tombol <strong>Mulai kerjakan ujian sekarang</strong>.
        </p>
      </section>

      {/* Paused session card when user previously started an exam and navigated away or refreshed */}
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
            <div className="row-wrap" style={{ marginTop: 'var(--space-100)' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onResumeActiveSession}
              >
                Lanjutkan sesi ujian
                <ChevronRightIcon size={16} />
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

      {/* Package & Formation Selection Card */}
      <div className="grid-2">
        <section className="card stack-300">
          <div className="stack-200" style={{ gap: 'var(--space-100)' }}>
            <h2 className="h-medium">1. Pilih paket dan formasi</h2>
            <div className="form-field">
              <label htmlFor="setup-package-select" className="form-label">
                Paket soal simulasi
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
          </div>

          <div className="well-sunken stack-200" style={{ gap: 'var(--space-075)' }}>
            <div className="h-xsmall">Ringkasan paket terpilih</div>
            <p className="body">{selectedPackage.description}</p>
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
        </section>

        {/* Rules & Launch Card */}
        <section className="card stack-300">
          <div className="stack-200" style={{ gap: 'var(--space-100)' }}>
            <h2 className="h-medium">2. Ketentuan pengerjaan &amp; mulai ujian</h2>
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
                Anda dapat menandai soal ragu-ragu, berpindah bebas antar nomor, dan mengunduh hasil akhir beserta pembahasan dan link sumber dalam format PDF.
              </p>
            </div>
          </div>

          <div className="row-wrap" style={{ marginTop: 'auto' }}>
            <button
              type="button"
              className={activeSession ? 'btn' : 'btn btn-primary'}
              onClick={() => onConfirmStartExam(selectedPackage, selectedFormation)}
            >
              <CheckCircleIcon size={16} />
              {activeSession ? 'Mulai sesi baru sekarang' : 'Mulai kerjakan ujian sekarang'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

import React from 'react';
import type { ActiveExamSession, ExamAttempt, FormationType, QuestionPackage } from '../types';
import { ALL_PACKAGES, SSCASN_PORTAL } from '../data/questionBank';
import { FORMATION_RULES, formatCountdown } from '../utils/scoring';
import {
  BookIcon,
  CheckCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  InfoIcon,
  ChevronRightIcon,
} from './Icons';

interface HomeViewProps {
  selectedFormation: FormationType;
  onSelectFormation: (formation: FormationType) => void;
  activeSession: ActiveExamSession | null;
  history: ExamAttempt[];
  onStartPackage: (pkg: QuestionPackage) => void;
  onResumeExam: () => void;
  onDiscardSession: () => void;
  onOpenStudy: () => void;
  onOpenHistory: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  selectedFormation,
  onSelectFormation,
  activeSession,
  history,
  onStartPackage,
  onResumeExam,
  onDiscardSession,
  onOpenStudy,
  onOpenHistory,
}) => {
  const fullPackages = ALL_PACKAGES.filter((p) => p.isFullSimulation);
  const focusedPackages = ALL_PACKAGES.filter((p) => !p.isFullSimulation);

  return (
    <div className="stack-400">
      {/* Hero / Page Header */}
      <section className="hero-header-row">
        <div className="stack-200">
          <div className="row-wrap">
            <span className="lozenge lozenge-info">Simulasi CAT BKN</span>
            <span className="tag tag-blue">Tanpa login · Ekspor PDF langsung</span>
          </div>
          <h1 className="h-xlarge">
            Latihan simulasi ujian dan pusat belajar SKD CPNS
          </h1>
          <p className="body-large" style={{ maxWidth: '68ch' }}>
            Kerjakan try out dengan komposisi resmi 110 soal (30 TWK, 35 TIU, 45 TKP) dalam waktu 100 menit, evaluasi skor berdasarkan aturan Kepmenpan RB Nomor 321 Tahun 2024, tinjau link sumber pada tiap butir soal, lalu ekspor hasil lengkapnya ke berkas PDF.
          </p>
          <div className="row-wrap">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onStartPackage(fullPackages[0])}
            >
              Siapkan simulasi 110 soal (Paket 1)
              <ChevronRightIcon size={16} />
            </button>
            <button type="button" className="btn" onClick={onOpenStudy}>
              <BookIcon size={16} />
              Buka pusat belajar materi
            </button>
            {history.length > 0 && (
              <button type="button" className="btn btn-subtle" onClick={onOpenHistory}>
                Lihat riwayat ujian ({history.length})
              </button>
            )}
          </div>
        </div>

        <aside className="ascii-flame-card" aria-hidden="true">
          <div>
            {'       '}
            <span className="ascii-flame-warm">{'./)'}</span>
            {'\n'}
            {'      '}
            <span className="ascii-flame-warm">{'.('}</span>
            <span className="ascii-flame-hot">{'^'}</span>
            <span className="ascii-flame-warm">{')'}</span>
            {'\n'}
            {'     '}
            <span className="ascii-flame-hot">{'/(  )\\'}</span>
            {'   TWK 30\n'}
            {'    '}
            <span className="ascii-flame-hot">{'(  /\\ )'}</span>
            {'   TIU 35\n'}
            {'     '}
            <span className="ascii-flame-warm">{'\\__/'}</span>
            {'     TKP 45'}
          </div>
          <span className="ascii-flame-caption">CAT BKN · 110 SOAL / 100M</span>
        </aside>
      </section>

      {/* Active Session Resume Notice */}
      {activeSession && (
        <div className="section-message section-message-warning" role="status">
          <span className="section-message-icon">
            <ClockIcon size={18} />
          </span>
          <div className="section-message-content">
            <h2 className="h-small">Sesi try out belum diselesaikan</h2>
            <p className="section-message-body">
              Anda memiliki sesi aktif pada <strong>{activeSession.packageTitle}</strong> dengan{' '}
              {Object.keys(activeSession.answers).length} soal terjawab dan sisa waktu{' '}
              <span className="mono">{formatCountdown(activeSession.remainingSeconds)}</span>.
            </p>
            <div className="row-wrap" style={{ marginTop: 'var(--space-100)' }}>
              <button type="button" className="btn btn-warning" onClick={onResumeExam}>
                Lanjutkan ujian sekarang
              </button>
              <button type="button" className="btn btn-subtle" onClick={onDiscardSession}>
                Hapus sesi tersimpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules SectionMessage */}
      <div className="section-message section-message-info">
        <span className="section-message-icon">
          <InfoIcon size={18} />
        </span>
        <div className="section-message-content">
          <h2 className="h-small">Komposisi soal dan aturan penilaian resmi SKD CPNS</h2>
          <p className="section-message-body">
            Simulasi ini mengikuti ketentuan Kepmenpan RB Nomor 321 Tahun 2024: TWK (30 soal, benar +5, salah/kosong 0, maksimal 150), TIU (35 soal, benar +5, salah/kosong 0, maksimal 175), dan TKP (45 soal, skor bertingkat 1 sampai 5, tidak menjawab 0, maksimal 225). Total nilai kumulatif maksimal adalah 550 dengan durasi 100 menit.
          </p>
          <div style={{ marginTop: 'var(--space-050)' }}>
            <a
              href={SSCASN_PORTAL.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link body"
            >
              Buka portal resmi SSCASN BKN
              <ExternalLinkIcon size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Formation Selector */}
      <section className="stack-200">
        <div>
          <h2 className="h-medium">Pilih jenis formasi acuan ambang batas</h2>
          <p className="body text-subtle" style={{ marginTop: 'var(--space-050)' }}>
            Penentuan status lulus nilai ambang batas (passing grade) pada hasil ujian mengikuti kategori formasi yang Anda pilih.
          </p>
        </div>

        <div className="formation-grid" role="radiogroup" aria-label="Pilih jenis formasi">
          {(Object.keys(FORMATION_RULES) as FormationType[]).map((key) => {
            const rule = FORMATION_RULES[key];
            const isSelected = selectedFormation === key;
            return (
              <button
                key={rule.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                data-selected={isSelected}
                className="formation-option"
                onClick={() => onSelectFormation(rule.id)}
              >
                <span className="radio-circle" data-checked={isSelected} aria-hidden="true">
                  {isSelected && <span className="radio-dot" />}
                </span>
                <span className="stack-200" style={{ gap: 'var(--space-050)' }}>
                  <span className="h-xsmall">{rule.label}</span>
                  <span className="body-small">{rule.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Full CAT Simulation Packages */}
      <section className="stack-200">
        <div>
          <h2 className="h-medium">Paket simulasi penuh CAT SKD (110 soal · 100 menit)</h2>
          <p className="body text-subtle" style={{ marginTop: 'var(--space-050)' }}>
            Soal diambil langsung dari arsip modul Tryout LolosASN dan Bank Drilling CPNS 2024/2025 pada Google Drive sumber belajar.
          </p>
        </div>

        <div className="grid-2">
          {fullPackages.map((pkg, idx) => (
            <article key={pkg.id} className="card stack-200">
              <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                <span className="lozenge lozenge-success">
                  <CheckCircleIcon size={14} />
                  Komposisi asli BKN
                </span>
                <span className="tag tag-blue">{pkg.durationMinutes} menit</span>
              </div>

              <div className="stack-200" style={{ gap: 'var(--space-100)' }}>
                <h3 className="h-small">{pkg.title}</h3>
                <p className="body">{pkg.description}</p>
              </div>

              <div className="well-sunken stack-200" style={{ gap: 'var(--space-050)', padding: 'var(--space-150)' }}>
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
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Focused Subtest Practice */}
      <section className="stack-200">
        <div>
          <h2 className="h-medium">Latihan fokus per subtes</h2>
          <p className="body text-subtle" style={{ marginTop: 'var(--space-050)' }}>
            Cocok jika Anda ingin melatih kecepatan pada satu subtes tertentu sebelum mengerjakan paket lengkap 110 soal.
          </p>
        </div>

        <div className="grid-3">
          {focusedPackages.map((pkg) => (
            <article key={pkg.id} className="card stack-200">
              <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                <span className="tag tag-teal">{pkg.compositionLabel}</span>
                <span className="body-small mono">{pkg.durationMinutes} mnt</span>
              </div>
              <h3 className="h-small">{pkg.title}</h3>
              <p className="body">{pkg.description}</p>
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
          ))}
        </div>
      </section>

      {/* Passing Grade Reference Table */}
      <section className="stack-200">
        <h2 className="h-medium">Tabel acuan ambang batas SKD CPNS (Kepmenpan RB 321/2024)</h2>
        <div className="table-wrap">
          <table className="ads-table">
            <thead>
              <tr>
                <th>Kategori formasi</th>
                <th>Minimal TWK</th>
                <th>Minimal TIU</th>
                <th>Minimal TKP</th>
                <th>Kumulatif minimal</th>
                <th>Skor maksimal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Kebutuhan Umum &amp; Putra/Putri Kalimantan</td>
                <td className="mono">65</td>
                <td className="mono">80</td>
                <td className="mono">166</td>
                <td className="mono">311 (akumulasi)</td>
                <td className="mono">550</td>
              </tr>
              <tr>
                <td>Khusus Lulusan Terbaik (Cumlaude) &amp; Diaspora</td>
                <td>Tidak dibatasi</td>
                <td className="mono">85</td>
                <td>Tidak dibatasi</td>
                <td className="mono">311</td>
                <td className="mono">550</td>
              </tr>
              <tr>
                <td>Khusus Disabilitas, Putra/Putri Papua &amp; 3T</td>
                <td>Tidak dibatasi</td>
                <td className="mono">60</td>
                <td>Tidak dibatasi</td>
                <td className="mono">286</td>
                <td className="mono">550</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

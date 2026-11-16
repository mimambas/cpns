import React from 'react';
import {
  DRIVE_FILES,
  DRIVE_SUBFOLDERS,
  GOOGLE_DRIVE_ROOT_URL,
  KERJAGO_MODULES,
  SSCASN_PORTAL,
  YOUTUBE_RESOURCE,
} from '../data/questionBank';
import {
  BookIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  FolderIcon,
  InfoIcon,
  PlayIcon,
  VideoIcon,
} from './Icons';

export type StudyModuleId =
  | 'modul-regulasi'
  | 'modul-twk'
  | 'modul-tiu'
  | 'modul-tkp'
  | 'modul-drive';

export interface StudyModuleMeta {
  id: StudyModuleId;
  number: number;
  title: string;
  subtitle: string;
  duration: string;
  tag: string;
  practicePackageId: string;
  practiceLabel: string;
}

export const STUDY_MODULES: StudyModuleMeta[] = [
  {
    id: 'modul-regulasi',
    number: 1,
    title: 'Sistem CAT BKN & Ambang Batas 2024',
    subtitle: 'Memahami aturan Kepmenpan RB No. 321 Tahun 2024, pembobotan nilai, dan portal resmi SSCASN.',
    duration: '10 mnt',
    tag: 'Regulasi & Alur',
    practicePackageId: 'paket-lolosasn-2023',
    practiceLabel: 'Siapkan simulasi penuh 110 soal',
  },
  {
    id: 'modul-twk',
    number: 2,
    title: 'Tes Wawasan Kebangsaan (TWK)',
    subtitle: 'Intisari Pembukaan UUD 1945, UU ASN BerAKHLAK, amandemen konstitusi, dan modul Kerjago.',
    duration: '20 mnt',
    tag: '30 Soal · Min 65',
    practicePackageId: 'fokus-twk-paket2',
    practiceLabel: 'Latihan fokus TWK (30 soal)',
  },
  {
    id: 'modul-tiu',
    number: 3,
    title: 'Tes Intelegensia Umum (TIU) & Figural',
    subtitle: 'Video pembahasan 15 soal deret gambar Ruang Tentor, checklist pola figural, dan rumus cepat.',
    duration: '25 mnt',
    tag: '35 Soal · Min 80',
    practicePackageId: 'fokus-tiu-paket2',
    practiceLabel: 'Latihan fokus TIU (35 soal)',
  },
  {
    id: 'modul-tkp',
    number: 4,
    title: 'Strategi Skor 5 TKP (6 Aspek ASN)',
    subtitle: 'Panduan memilih opsi bernilai 5 poin pada pelayanan publik, jejaring kerja, TIK, hingga anti-radikalisme.',
    duration: '15 mnt',
    tag: '45 Soal · Min 166',
    practicePackageId: 'fokus-tkp-paket1',
    practiceLabel: 'Latihan fokus TKP (45 soal)',
  },
  {
    id: 'modul-drive',
    number: 5,
    title: 'Perpustakaan E-Book & Bank Soal Drive',
    subtitle: 'Akses 6 e-book utama (LolosASN, Bank Drilling 2024/2025, Sukses SKD, CAT BKN) dan 4 folder arsip.',
    duration: 'Arsip',
    tag: 'Google Drive',
    practicePackageId: 'paket-hots-2024-2025',
    practiceLabel: 'Siapkan simulasi HOTS Paket 2',
  },
];

interface StudyViewProps {
  activeModuleId: StudyModuleId;
  onSelectModule: (id: StudyModuleId) => void;
  completedModules: string[];
  onToggleCompleteModule: (id: StudyModuleId) => void;
  onPracticePackage: (pkgId: string) => void;
}

export const StudyView: React.FC<StudyViewProps> = ({
  activeModuleId,
  onSelectModule,
  completedModules,
  onToggleCompleteModule,
  onPracticePackage,
}) => {
  const currentIdx = STUDY_MODULES.findIndex((m) => m.id === activeModuleId);
  const activeMeta = STUDY_MODULES[currentIdx >= 0 ? currentIdx : 0];
  const prevMeta = currentIdx > 0 ? STUDY_MODULES[currentIdx - 1] : null;
  const nextMeta =
    currentIdx >= 0 && currentIdx < STUDY_MODULES.length - 1
      ? STUDY_MODULES[currentIdx + 1]
      : null;

  const isCompleted = completedModules.includes(activeMeta.id);
  const progressPct = Math.round((completedModules.length / STUDY_MODULES.length) * 100);

  return (
    <div className="stack-300">
      {/* Header Summary */}
      <section className="row-wrap" style={{ justifyContent: 'space-between' }}>
        <div className="stack-200" style={{ gap: '4px' }}>
          <div className="row-wrap" style={{ gap: '8px' }}>
            <span className="lozenge lozenge-info">Kurikulum Terstruktur</span>
            <span className="tag tag-blue">SSCASN · Kerjago · Google Drive · YouTube</span>
          </div>
          <h1 className="h-xlarge">Kelas &amp; modul belajar SKD CPNS</h1>
          <p className="body text-subtle">
            Pelajari modul secara berurutan dari regulasi, materi TWK, video TIU figural, strategi TKP, hingga arsip e-book lalu lanjutkan ke latihan fokus.
          </p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => onPracticePackage('paket-lolosasn-2023')}
        >
          <PlayIcon size={16} />
          Siapkan try out 110 soal
        </button>
      </section>

      {/* Two-Pane Interactive LMS Course Player */}
      <div className="course-layout">
        {/* Left Curriculum Sidebar */}
        <aside className="course-sidebar" aria-label="Daftar modul pembelajaran">
          <div className="card stack-200" style={{ padding: '16px', gap: '12px' }}>
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <span className="h-xsmall">Progres belajar</span>
              <span className="mono body-small">
                {completedModules.length}/{STUDY_MODULES.length} modul
              </span>
            </div>
            <div className="chart-bar-track" aria-label={`Progres modul ${progressPct}%`}>
              <div
                className="chart-bar-fill"
                style={{ width: `${progressPct}%`, backgroundColor: 'var(--brand-primary)' }}
              />
            </div>
            <span className="body-small">
              {completedModules.length === STUDY_MODULES.length
                ? 'Seluruh modul dasar telah selesai dipelajari.'
                : 'Klik modul di bawah untuk membaca dan menandai progres.'}
            </span>
          </div>

          <div className="course-module-list" role="tablist" aria-label="Pilih modul kelas">
            {STUDY_MODULES.map((mod) => {
              const modActive = mod.id === activeMeta.id;
              const modDone = completedModules.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  type="button"
                  role="tab"
                  aria-selected={modActive}
                  data-active={modActive}
                  data-completed={modDone}
                  className="course-module-item"
                  onClick={() => onSelectModule(mod.id)}
                >
                  <span className="course-module-status" aria-hidden="true">
                    {modDone ? <CheckCircleIcon size={14} /> : mod.number}
                  </span>
                  <span className="stack-200" style={{ gap: '2px', flex: 1, minWidth: 0 }}>
                    <span className="h-xsmall">
                      Modul {mod.number}: {mod.title}
                    </span>
                    <span className="body-small">
                      {mod.tag} · {mod.duration}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Lesson Reader Stage */}
        <article className="course-stage" aria-label={activeMeta.title}>
          <header
            className="row-wrap"
            style={{
              justifyContent: 'space-between',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-faint)',
            }}
          >
            <div className="stack-200" style={{ gap: '6px', flex: 1, minWidth: '240px' }}>
              <div className="row-wrap" style={{ gap: '8px' }}>
                <span className="lozenge lozenge-info">Modul {activeMeta.number} dari 5</span>
                <span className="tag">{activeMeta.tag}</span>
                {isCompleted && (
                  <span className="lozenge lozenge-success">
                    <CheckCircleIcon size={12} />
                    Selesai dipelajari
                  </span>
                )}
              </div>
              <h2 className="h-large">{activeMeta.title}</h2>
              <p className="body text-subtle">{activeMeta.subtitle}</p>
            </div>

            <div className="row-wrap" style={{ gap: '8px' }}>
              <button
                type="button"
                className={isCompleted ? 'btn btn-selected' : 'btn'}
                onClick={() => onToggleCompleteModule(activeMeta.id)}
              >
                <CheckCircleIcon size={16} />
                {isCompleted ? 'Modul selesai dipelajari' : 'Tandai modul selesai'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onPracticePackage(activeMeta.practicePackageId)}
              >
                <PlayIcon size={16} />
                {activeMeta.practiceLabel}
              </button>
            </div>
          </header>

          {/* Module 1: Regulasi CAT & SSCASN */}
          {activeMeta.id === 'modul-regulasi' && (
            <div className="stack-300">
              <div className="section-message section-message-info">
                <span className="section-message-icon">
                  <InfoIcon size={18} />
                </span>
                <div className="section-message-content">
                  <h3 className="h-small">Struktur resmi SKD CPNS (Kepmenpan RB No. 321 Tahun 2024)</h3>
                  <p className="section-message-body">
                    Total ujian terdiri atas <strong>110 butir soal</strong> dikerjakan dalam <strong>100 menit</strong> dengan skor kumulatif maksimal <strong>550 poin</strong>: TWK (30 soal, benar +5 / salah 0), TIU (35 soal, benar +5 / salah 0), dan TKP (45 soal, skala nilai 1 sampai 5 / kosong 0).
                  </p>
                </div>
              </div>

              <div className="table-wrap">
                <table className="ads-table">
                  <thead>
                    <tr>
                      <th>Kategori formasi</th>
                      <th>Minimal TWK</th>
                      <th>Minimal TIU</th>
                      <th>Minimal TKP</th>
                      <th>Kumulatif minimal</th>
                      <th>Maksimal</th>
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

              <div className="grid-2">
                <article className="well-sunken stack-200">
                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="lozenge lozenge-info">Portal resmi pemerintah</span>
                    <span className="tag">BKN</span>
                  </div>
                  <h3 className="h-small">{SSCASN_PORTAL.title}</h3>
                  <p className="body">{SSCASN_PORTAL.description}</p>
                  <div className="row-wrap">
                    <a
                      href={SSCASN_PORTAL.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link body"
                    >
                      Kunjungi sscasn.bkn.go.id
                      <ExternalLinkIcon size={14} />
                    </a>
                    <a
                      href={SSCASN_PORTAL.helpdeskUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link body"
                    >
                      Helpdesk SSCASN
                      <ExternalLinkIcon size={14} />
                    </a>
                  </div>
                </article>

                <article className="well-sunken stack-200">
                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="lozenge lozenge-success">Rangkuman teori gratis</span>
                    <span className="tag tag-teal">Kerjago</span>
                  </div>
                  <h3 className="h-small">Indeks materi CPNS lengkap — Kerjago</h3>
                  <p className="body">
                    Berisi naskah UUD 1945 per pasal dengan penanda amandemen, 45 butir Pancasila, UU ASN Nomor 20 Tahun 2023, lembaga negara, sejarah, rumus TIU, dan aspek TKP.
                  </p>
                  <div>
                    <a
                      href="https://kerjago.id/materi-cpns"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link body"
                    >
                      Buka kerjago.id/materi-cpns
                      <ExternalLinkIcon size={14} />
                    </a>
                  </div>
                </article>
              </div>
            </div>
          )}

          {/* Module 2: TWK */}
          {activeMeta.id === 'modul-twk' && (
            <div className="stack-300">
              <div className="well-sunken stack-200">
                <h3 className="h-small">Intisari cepat TWK yang paling sering diujikan</h3>
                <div className="grid-3">
                  <div className="card stack-200" style={{ padding: '16px', gap: '6px' }}>
                    <h4 className="h-xsmall">Pembukaan UUD 1945 (4 alinea)</h4>
                    <p className="body-small">
                      Alinea 1: hak kemerdekaan &amp; anti-penjajahan; Alinea 2: cita-cita negara berdaulat, adil, makmur; Alinea 3: rahmat Tuhan; Alinea 4: tujuan negara, bentuk republik, &amp; dasar Pancasila.
                    </p>
                  </div>
                  <div className="card stack-200" style={{ padding: '16px', gap: '6px' }}>
                    <h4 className="h-xsmall">UU ASN No. 20 Tahun 2023</h4>
                    <p className="body-small">
                      Nilai dasar BerAKHLAK: Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif. Fungsi ASN: pelaksana kebijakan, pelayan publik, &amp; perekat bangsa.
                    </p>
                  </div>
                  <div className="card stack-200" style={{ padding: '16px', gap: '6px' }}>
                    <h4 className="h-xsmall">Amandemen UUD 1945</h4>
                    <p className="body-small">
                      UUD 1945 diamandemen 4 kali (1999–2002). DPA dihapuskan pada amandemen keempat, sedangkan MK, DPD, dan KY dibentuk sebagai lembaga baru pasca amandemen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid-2">
                {KERJAGO_MODULES.filter((m) => m.category.startsWith('TWK')).map((mod) => (
                  <article key={mod.url} className="well-sunken stack-200">
                    <span className="tag tag-blue" style={{ alignSelf: 'flex-start' }}>
                      {mod.category}
                    </span>
                    <h3 className="h-small">{mod.title}</h3>
                    <p className="body">{mod.description}</p>
                    <div style={{ marginTop: 'auto' }}>
                      <a
                        href={mod.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link body"
                      >
                        Baca modul lengkap di Kerjago
                        <ExternalLinkIcon size={14} />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Module 3: TIU & Video Figural */}
          {activeMeta.id === 'modul-tiu' && (
            <div className="grid-2">
              <div className="well-sunken stack-200">
                <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                  <span className="lozenge lozenge-discovery">
                    <VideoIcon size={14} />
                    Video pembahasan TIU Figural
                  </span>
                  <span className="tag tag-purple">{YOUTUBE_RESOURCE.channel}</span>
                </div>
                <h3 className="h-small">{YOUTUBE_RESOURCE.title}</h3>
                <div className="video-frame">
                  <iframe
                    src={YOUTUBE_RESOURCE.embedUrl}
                    title={YOUTUBE_RESOURCE.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div>
                  <a
                    href={YOUTUBE_RESOURCE.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link body"
                  >
                    Tonton langsung di YouTube
                    <ExternalLinkIcon size={14} />
                  </a>
                </div>
              </div>

              <div className="stack-200">
                <article className="well-sunken stack-200">
                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="lozenge lozenge-info">Modul rumus cepat</span>
                    <span className="tag tag-teal">Kerjago</span>
                  </div>
                  <h3 className="h-small">Ringkasan rumus dan pola TIU SKD CPNS</h3>
                  <p className="body">
                    Pelajari hukum silogisme (modus ponens, modus tollens, ekuivalensi semua/sebagian), trik identitas aljabar (a² - b²), persen cepat (33 1/3% = 1/3), perbandingan senilai vs berbalik nilai, serta deret larik ganda.
                  </p>
                  <div>
                    <a
                      href={KERJAGO_MODULES.find((m) => m.category.startsWith('TIU'))?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link body"
                    >
                      Buka materi TIU di Kerjago
                      <ExternalLinkIcon size={14} />
                    </a>
                  </div>
                </article>

                <article className="well-sunken stack-200">
                  <h3 className="h-small">Checklist pola soal deret gambar figural</h3>
                  <ul
                    className="stack-200"
                    style={{ margin: 0, paddingInlineStart: '20px', gap: '8px' }}
                  >
                    {YOUTUBE_RESOURCE.tips.map((tip) => (
                      <li key={tip} className="body">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>
          )}

          {/* Module 4: TKP */}
          {activeMeta.id === 'modul-tkp' && (
            <div className="grid-2">
              <article className="well-sunken stack-200">
                <div className="row-wrap">
                  <span className="lozenge lozenge-success">
                    <CheckCircleIcon size={14} />
                    Ciri pilihan bernilai 5 poin
                  </span>
                </div>
                <ul
                  className="stack-200"
                  style={{ margin: 0, paddingInlineStart: '20px', gap: '10px' }}
                >
                  <li className="body">
                    <strong>Pelayanan publik:</strong> Mengutamakan kepuasan masyarakat, cepat tanggap, ramah, dan patuh SOP tanpa diskriminasi.
                  </li>
                  <li className="body">
                    <strong>Jejaring kerja:</strong> Mengedepankan musyawarah, berbagi informasi secara transparan, dan membangun kolaborasi lintas tim.
                  </li>
                  <li className="body">
                    <strong>Sosial budaya:</strong> Menghargai keberagaman adat, agama, dan pendapat serta mampu beradaptasi di lingkungan baru.
                  </li>
                  <li className="body">
                    <strong>TIK:</strong> Proaktif mempelajari sistem digital terbaru untuk mempercepat efektivitas kerja tim.
                  </li>
                  <li className="body">
                    <strong>Profesionalisme:</strong> Fokus menuntaskan target sesuai tenggat meski terdapat tekanan atau gangguan eksternal.
                  </li>
                  <li className="body">
                    <strong>Anti-radikalisme:</strong> Menolak tegas intoleransi dan hoaks, serta menempuh klarifikasi melalui jalur hukum resmi.
                  </li>
                </ul>
              </article>

              <article className="well-sunken stack-200">
                <span className="tag tag-blue" style={{ alignSelf: 'flex-start' }}>
                  TKP — Panduan Kerjago
                </span>
                <h3 className="h-small">
                  {KERJAGO_MODULES.find((m) => m.category.startsWith('TKP'))?.title}
                </h3>
                <p className="body">
                  {KERJAGO_MODULES.find((m) => m.category.startsWith('TKP'))?.description}
                </p>
                <div className="section-message section-message-info" style={{ marginTop: 'auto' }}>
                  <span className="section-message-icon">
                    <InfoIcon size={16} />
                  </span>
                  <div className="section-message-content">
                    <p className="section-message-body">
                      Jangan pernah membiarkan soal TKP kosong saat ujian, karena nilai maksimal TKP (225) sangat menentukan pencapaian ambang batas 166 dan total skor SKD.
                    </p>
                  </div>
                </div>
                <div>
                  <a
                    href={KERJAGO_MODULES.find((m) => m.category.startsWith('TKP'))?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link body"
                  >
                    Pelajari aspek TKP di Kerjago
                    <ExternalLinkIcon size={14} />
                  </a>
                </div>
              </article>
            </div>
          )}

          {/* Module 5: Google Drive Library */}
          {activeMeta.id === 'modul-drive' && (
            <div className="stack-300">
              <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                <p className="body text-subtle">
                  Arsip berkas PDF, dokumen latihan CAT, dan subfolder bersama dari folder utama Google Drive sumber belajar.
                </p>
                <a
                  href={GOOGLE_DRIVE_ROOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-compact"
                >
                  <FolderIcon size={14} />
                  Buka folder utama Google Drive
                  <ExternalLinkIcon size={12} />
                </a>
              </div>

              <div className="table-wrap">
                <table className="ads-table">
                  <thead>
                    <tr>
                      <th>Nama berkas</th>
                      <th>Fokus materi</th>
                      <th>Format</th>
                      <th>Ringkasan isi</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DRIVE_FILES.map((file) => (
                      <tr key={file.url}>
                        <td>
                          <strong>{file.title}</strong>
                        </td>
                        <td>
                          <span className="tag tag-teal">{file.focus}</span>
                        </td>
                        <td className="body-small">{file.format}</td>
                        <td>{file.description}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link"
                          >
                            <BookIcon size={14} />
                            Buka berkas
                            <ExternalLinkIcon size={12} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="stack-200">
                <h3 className="h-small">Subfolder referensi tambahan di Google Drive</h3>
                <div className="grid-2">
                  {DRIVE_SUBFOLDERS.map((sub) => (
                    <article
                      key={sub.url}
                      className="well-sunken row-wrap"
                      style={{ justifyContent: 'space-between' }}
                    >
                      <div className="stack-200" style={{ gap: '4px' }}>
                        <h4 className="h-xsmall">{sub.title}</h4>
                        <p className="body-small">{sub.note}</p>
                      </div>
                      <a
                        href={sub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-compact"
                      >
                        <FolderIcon size={14} />
                        Buka folder
                        <ExternalLinkIcon size={12} />
                      </a>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Module Stepper Footer */}
          <footer
            className="row-wrap"
            style={{
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-faint)',
            }}
          >
            <button
              type="button"
              className="btn"
              disabled={!prevMeta}
              onClick={() => prevMeta && onSelectModule(prevMeta.id)}
            >
              <ChevronLeftIcon size={16} />
              {prevMeta ? `Modul ${prevMeta.number}: ${prevMeta.title}` : 'Modul pertama'}
            </button>

            {nextMeta ? (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  if (!isCompleted) {
                    onToggleCompleteModule(activeMeta.id);
                  }
                  onSelectModule(nextMeta.id);
                }}
              >
                {isCompleted
                  ? `Lanjut ke Modul ${nextMeta.number}`
                  : `Selesai & lanjut Modul ${nextMeta.number}`}
                <ChevronRightIcon size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  if (!isCompleted) {
                    onToggleCompleteModule(activeMeta.id);
                  }
                  onPracticePackage('paket-lolosasn-2023');
                }}
              >
                Selesai &amp; lanjut ke simulasi ujian
                <ChevronRightIcon size={16} />
              </button>
            )}
          </footer>
        </article>
      </div>
    </div>
  );
};

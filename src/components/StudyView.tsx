import React, { useState } from 'react';
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
  ExternalLinkIcon,
  FolderIcon,
  InfoIcon,
  VideoIcon,
} from './Icons';

type StudyTab = 'ALL' | 'TWK' | 'TIU' | 'TKP' | 'DRIVE';

interface StudyViewProps {
  onStartTryout: () => void;
}

export const StudyView: React.FC<StudyViewProps> = ({ onStartTryout }) => {
  const [activeTab, setActiveTab] = useState<StudyTab>('ALL');

  const showSection = (section: Exclude<StudyTab, 'ALL'>) =>
    activeTab === 'ALL' || activeTab === section;

  return (
    <div className="stack-400">
      {/* Header */}
      <section className="stack-200">
        <div className="row-wrap">
          <span className="lozenge lozenge-info">Sumber belajar terkurasi</span>
          <span className="tag tag-blue">SSCASN · Kerjago · Google Drive · YouTube</span>
        </div>
        <h1 className="h-xlarge">Pusat belajar materi dan sumber persiapan CPNS</h1>
        <p className="body-large" style={{ maxWidth: '72ch' }}>
          Seluruh rujukan belajar di bawah ini dikumpulkan dari portal resmi SSCASN BKN, ringkasan materi SKD Kerjago, arsip e-book Google Drive, dan video pembahasan TIU figural agar Anda dapat belajar sebelum maupun sesudah mengerjakan try out.
        </p>
        <div className="row-wrap">
          <button type="button" className="btn btn-primary" onClick={onStartTryout}>
            Uji kemampuan di simulasi try out
          </button>
          <a
            href={SSCASN_PORTAL.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            Buka portal SSCASN BKN
            <ExternalLinkIcon size={16} />
          </a>
        </div>
      </section>

      {/* Study Category Tabs */}
      <div
        role="tablist"
        aria-label="Filter materi belajar"
        className="tablist"
        style={{ borderBottom: '1px solid var(--border-muted)' }}
      >
        {(
          [
            { id: 'ALL', label: 'Semua sumber belajar' },
            { id: 'TWK', label: 'Materi TWK (Kerjago & BKN)' },
            { id: 'TIU', label: 'Materi & video TIU Figural' },
            { id: 'TKP', label: 'Strategi TKP skor 5' },
            { id: 'DRIVE', label: 'Arsip e-book Google Drive' },
          ] as { id: StudyTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className="tab-btn"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Portal SSCASN & Kerjago Overview */}
      {activeTab === 'ALL' && (
        <div className="grid-2">
          <article className="card stack-200">
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <span className="lozenge lozenge-info">Portal resmi pemerintah</span>
              <span className="tag">BKN</span>
            </div>
            <h2 className="h-small">{SSCASN_PORTAL.title}</h2>
            <p className="body">{SSCASN_PORTAL.description}</p>
            <div className="row-wrap" style={{ marginTop: 'auto' }}>
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

          <article className="card stack-200">
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <span className="lozenge lozenge-success">Rangkuman teori gratis</span>
              <span className="tag tag-teal">Kerjago</span>
            </div>
            <h2 className="h-small">Indeks materi CPNS lengkap — Kerjago</h2>
            <p className="body">
              Berisi teks UUD 1945 lengkap per pasal dengan penanda amandemen, 45 butir Pancasila, UU ASN Nomor 20 Tahun 2023, lembaga negara, sejarah, rumus TIU, dan aspek TKP.
            </p>
            <div style={{ marginTop: 'auto' }}>
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
      )}

      {/* TWK Section */}
      {showSection('TWK') && (
        <section className="stack-200">
          <div>
            <h2 className="h-medium">Materi TWK — Tes Wawasan Kebangsaan</h2>
            <p className="body text-subtle" style={{ marginTop: 'var(--space-050)' }}>
              Kisi-kisi TWK menguji penguasaan Nasionalisme, Integritas, Bela Negara, Pilar Negara (Pancasila, UUD 1945, NKRI, Bhinneka Tunggal Ika), dan Bahasa Negara.
            </p>
          </div>

          <div className="well-sunken stack-200">
            <h3 className="h-small">Intisari cepat TWK yang paling sering muncul</h3>
            <div className="grid-3">
              <div className="card stack-200" style={{ gap: 'var(--space-075)' }}>
                <h4 className="h-xsmall">Pembukaan UUD 1945 (4 alinea)</h4>
                <p className="body-small">
                  Alinea 1: hak kemerdekaan &amp; penghapusan penjajahan; Alinea 2: cita-cita negara merdeka, bersatu, berdaulat, adil, makmur; Alinea 3: pengakuan kemerdekaan atas rahmat Tuhan; Alinea 4: tujuan negara, bentuk republik, &amp; dasar negara Pancasila.
                </p>
              </div>
              <div className="card stack-200" style={{ gap: 'var(--space-075)' }}>
                <h4 className="h-xsmall">UU ASN No. 20 Tahun 2023 (BerAKHLAK)</h4>
                <p className="body-small">
                  Nilai dasar ASN: Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, dan Kolaboratif. Fungsi ASN: pelaksana kebijakan publik, pelayan publik, serta perekat dan pemersatu bangsa.
                </p>
              </div>
              <div className="card stack-200" style={{ gap: 'var(--space-075)' }}>
                <h4 className="h-xsmall">Sejarah &amp; amandemen UUD 1945</h4>
                <p className="body-small">
                  UUD 1945 diamandemen 4 kali (1999, 2000, 2001, 2002). DPA dihapuskan pada amandemen keempat, sedangkan MK, DPD, dan KY dibentuk sebagai lembaga baru pasca amandemen.
                </p>
              </div>
            </div>
          </div>

          <div className="grid-3">
            {KERJAGO_MODULES.filter((m) => m.category.startsWith('TWK')).map((mod) => (
              <article key={mod.url} className="card stack-200">
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
                    Baca modul di Kerjago
                    <ExternalLinkIcon size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* TIU + Video Figural Section */}
      {showSection('TIU') && (
        <section className="stack-200">
          <div>
            <h2 className="h-medium">Materi TIU dan pembahasan video deret gambar figural</h2>
            <p className="body text-subtle" style={{ marginTop: 'var(--space-050)' }}>
              Meliputi kemampuan verbal (analogi, silogisme, analitis), numerik (deret, berhitung, perbandingan kuantitatif, soal cerita), dan figural.
            </p>
          </div>

          <div className="grid-2">
            {/* Embedded YouTube Player */}
            <div className="card stack-200">
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

            {/* TIU Study Card + Checklist */}
            <div className="stack-200">
              <article className="card stack-200">
                <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                  <span className="lozenge lozenge-info">Modul rumus cepat</span>
                  <span className="tag tag-teal">Kerjago</span>
                </div>
                <h3 className="h-small">Ringkasan rumus dan pola TIU SKD CPNS</h3>
                <p className="body">
                  Pelajari hukum silogisme (modus ponens, modus tollens, penarikan kesimpulan semua/sebagian), trik identitas aljabar (a² - b²), persen cepat (33 1/3% = 1/3), perbandingan senilai vs berbalik nilai, serta pola deret larik ganda.
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
                <h3 className="h-small">Checklist pola soal deret gambar TIU figural</h3>
                <ul className="stack-200" style={{ margin: 0, paddingInlineStart: 'var(--space-250)', gap: 'var(--space-100)' }}>
                  {YOUTUBE_RESOURCE.tips.map((tip) => (
                    <li key={tip} className="body">
                      {tip}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>
      )}

      {/* TKP Section */}
      {showSection('TKP') && (
        <section className="stack-200">
          <div>
            <h2 className="h-medium">Materi TKP — Tes Karakteristik Pribadi (6 aspek utama)</h2>
            <p className="body text-subtle" style={{ marginTop: 'var(--space-050)' }}>
              Pada TKP tidak ada jawaban bernilai 0 selama Anda menjawab; setiap pilihan bernilai 1 sampai 5 poin sesuai orientasi perilaku ASN profesional.
            </p>
          </div>

          <div className="grid-2">
            <article className="card stack-200">
              <div className="row-wrap">
                <span className="lozenge lozenge-success">
                  <CheckCircleIcon size={14} />
                  Ciri pilihan bernilai 5 poin
                </span>
              </div>
              <ul className="stack-200" style={{ margin: 0, paddingInlineStart: 'var(--space-250)', gap: 'var(--space-100)' }}>
                <li className="body">
                  <strong>Pelayanan publik:</strong> Mengutamakan kepuasan masyarakat, cepat tanggap, ramah, dan tidak diskriminatif sesuai SOP.
                </li>
                <li className="body">
                  <strong>Jejaring kerja:</strong> Mengedepankan musyawarah, berbagi informasi secara transparan, dan membangun kerja sama lintas tim.
                </li>
                <li className="body">
                  <strong>Sosial budaya:</strong> Menghargai keberagaman adat, agama, dan pendapat serta mampu beradaptasi di lingkungan baru.
                </li>
                <li className="body">
                  <strong>TIK:</strong> Terbuka mempelajari sistem digital terbaru untuk mempercepat efektivitas kerja tim dan instansi.
                </li>
                <li className="body">
                  <strong>Profesionalisme:</strong> Tetap fokus menuntaskan target sesuai tenggat meski terdapat tekanan atau gangguan eksternal.
                </li>
                <li className="body">
                  <strong>Anti-radikalisme:</strong> Menolak tegas intoleransi, hoaks pemecah belah, dan menempuh klarifikasi maupun jalur resmi sesuai aturan hukum.
                </li>
              </ul>
            </article>

            <article className="card stack-200">
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
                    Jangan pernah membiarkan soal TKP kosong saat ujian, karena nilai maksimal TKP (225) sangat menentukan pencapaian ambang batas 166 dan mendongkrak skor total SKD.
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
        </section>
      )}

      {/* Google Drive E-Books & Soal Archive */}
      {showSection('DRIVE') && (
        <section className="stack-200">
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <div>
              <h2 className="h-medium">Perpustakaan e-book &amp; bank soal Google Drive</h2>
              <p className="body text-subtle" style={{ marginTop: 'var(--space-050)' }}>
                Daftar lengkap berkas PDF, dokumen latihan CAT, dan folder bersama dari arsip Google Drive sumber belajar.
              </p>
            </div>
            <a
              href={GOOGLE_DRIVE_ROOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              <FolderIcon size={16} />
              Buka folder utama Google Drive
              <ExternalLinkIcon size={14} />
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
                <article key={sub.url} className="card row-wrap" style={{ justifyContent: 'space-between' }}>
                  <div className="stack-200" style={{ gap: 'var(--space-050)' }}>
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
        </section>
      )}
    </div>
  );
};

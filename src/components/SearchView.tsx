import React, { useEffect, useMemo, useState } from 'react';
import type {
  OptionKey,
  PackageMeta,
  QuestionCategory,
  SearchableQuestionItem,
  StudyModuleId,
} from '../types';
import {
  getPackageMetaById,
  getSubtopicQuestionCount,
  loadAllQuestionsIndex,
  TOTAL_QUESTION_COUNT,
} from '../data/questionBank';
import {
  getDrillPackageId,
  getSubtopicClusterMeta,
  SUBTOPIC_CLUSTERS,
  type SubtopicClusterId,
} from '../utils/analytics';
import { getQuestionScore } from '../utils/scoring';
import {
  buildExamHubPath,
  buildStudyPath,
  shouldHandleClientClick,
} from '../utils/router';
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CourseIcon,
  ExternalLinkIcon,
  InfoIcon,
  PlayIcon,
  SearchIcon,
} from './Icons';

interface SearchViewProps {
  onStartPackage: (pkg: PackageMeta) => void;
  onOpenStudy: (moduleId: StudyModuleId) => void;
}

const SUGGESTION_KEYWORDS = [
  'UUD 1945',
  'Pancasila',
  'BerAKHLAK',
  'Silogisme',
  'Deret',
  'Perbandingan',
  'Pelayanan Publik',
  'Anti Radikalisme',
];

const PAGE_SIZE = 15;

export const SearchView: React.FC<SearchViewProps> = ({
  onStartPackage,
  onOpenStudy,
}) => {
  const [items, setItems] = useState<SearchableQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const [queryInput, setQueryInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | QuestionCategory>('ALL');
  const [clusterFilter, setClusterFilter] = useState<'ALL' | SubtopicClusterId>('ALL');
  const [figureOnly, setFigureOnly] = useState(false);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [page, setPage] = useState(1);

  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [selfTestChoices, setSelfTestChoices] = useState<Record<string, OptionKey>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    loadAllQuestionsIndex()
      .then((loaded) => {
        if (cancelled) return;
        setItems(loaded);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(queryInput);
      setPage(1);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  const availableClusters = useMemo(() => {
    if (categoryFilter === 'ALL') return SUBTOPIC_CLUSTERS;
    return SUBTOPIC_CLUSTERS.filter((c) => c.category === categoryFilter);
  }, [categoryFilter]);

  const baseMatchedItems = useMemo(() => {
    const qLower = debouncedQuery.trim().toLowerCase();
    const tokens = qLower ? qLower.split(/\s+/).filter(Boolean) : [];

    return items.filter((item) => {
      if (figureOnly && !item.hasFigure) return false;
      if (clusterFilter !== 'ALL' && item.clusterId !== clusterFilter) return false;
      if (tokens.length === 0) return true;

      const haystack = `${item.category} ${item.subtopic} ${item.clusterLabel} ${item.question} ${item.explanation} ${item.packageTitle} ${item.options.map((o) => o.text).join(' ')}`.toLowerCase();
      return tokens.every((tok) => haystack.includes(tok));
    });
  }, [items, debouncedQuery, figureOnly, clusterFilter]);

  const categoryCounts = useMemo(() => {
    let twk = 0;
    let tiu = 0;
    let tkp = 0;
    for (const item of baseMatchedItems) {
      if (item.category === 'TWK') twk += 1;
      else if (item.category === 'TIU') tiu += 1;
      else tkp += 1;
    }
    return {
      ALL: baseMatchedItems.length,
      TWK: twk,
      TIU: tiu,
      TKP: tkp,
    };
  }, [baseMatchedItems]);

  const filteredItems = useMemo(() => {
    if (categoryFilter === 'ALL') return baseMatchedItems;
    return baseMatchedItems.filter((item) => item.category === categoryFilter);
  }, [baseMatchedItems, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, safePage]);

  const selectedClusterMeta =
    clusterFilter !== 'ALL' ? getSubtopicClusterMeta(clusterFilter) : undefined;
  const selectedDrillMeta = selectedClusterMeta
    ? getPackageMetaById(getDrillPackageId(selectedClusterMeta.id))
    : undefined;

  const handleSelectOption = (questionId: string, optKey: OptionKey) => {
    setSelfTestChoices((prev) => ({ ...prev, [questionId]: optKey }));
    setRevealedIds((prev) => ({ ...prev, [questionId]: true }));
  };

  const toggleReveal = (questionId: string) => {
    setRevealedIds((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleCategoryPick = (cat: 'ALL' | QuestionCategory) => {
    setCategoryFilter(cat);
    if (
      cat !== 'ALL' &&
      clusterFilter !== 'ALL' &&
      getSubtopicClusterMeta(clusterFilter)?.category !== cat
    ) {
      setClusterFilter('ALL');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setQueryInput('');
    setDebouncedQuery('');
    setCategoryFilter('ALL');
    setClusterFilter('ALL');
    setFigureOnly(false);
    setPage(1);
  };

  const startIndex = filteredItems.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(filteredItems.length, safePage * PAGE_SIZE);

  return (
    <section className="stack-300" aria-label="Pencarian bank soal SKD">
      {/* Header */}
      <div className="stack-200" style={{ gap: '4px' }}>
        <h1 className="h-xlarge">
          Pencarian cepat bank soal ({TOTAL_QUESTION_COUNT.toLocaleString('id-ID')} soal)
        </h1>
        <p className="body text-subtle">
          Cari materi, kata kunci pasal, rumus hitungan, atau soal bergambar lintas 14 paket. Klik opsi jawaban untuk menguji pemahaman dan membuka kunci serta pembahasan langsung.
        </p>
      </div>

      {/* Search & Filter Panel */}
      <div className="card stack-200">
        <div className="search-input-row">
          <div className="search-field-wrap">
            <SearchIcon size={16} className="search-field-icon" />
            <input
              id="bank-soal-search-input"
              type="search"
              className="text-input search-field-input"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Cari soal atau pembahasan (mis. UUD 1945, silogisme, BerAKHLAK, perbandingan)..."
              aria-label="Kata kunci pencarian soal"
            />
          </div>

          {(queryInput || categoryFilter !== 'ALL' || clusterFilter !== 'ALL' || figureOnly) && (
            <button
              type="button"
              className="btn"
              onClick={handleResetFilters}
            >
              Reset filter
            </button>
          )}
        </div>

        {/* Quick keyword chips */}
        <div className="row-wrap" style={{ gap: '6px' }}>
          <span className="body-small">Topik cepat:</span>
          {SUGGESTION_KEYWORDS.map((kw) => {
            const active = queryInput.trim().toLowerCase() === kw.toLowerCase();
            return (
              <button
                key={kw}
                type="button"
                className={`btn btn-compact search-chip ${active ? 'btn-selected' : ''}`}
                onClick={() => {
                  setQueryInput(active ? '' : kw);
                  setPage(1);
                }}
              >
                {kw}
              </button>
            );
          })}
        </div>

        {/* Category Tabs + Cluster Filter + Toggle Controls */}
        <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
          <div className="row-wrap" style={{ gap: '6px' }}>
            {(
              [
                { id: 'ALL', label: `Semua (${categoryCounts.ALL})` },
                { id: 'TWK', label: `TWK (${categoryCounts.TWK})` },
                { id: 'TIU', label: `TIU (${categoryCounts.TIU})` },
                { id: 'TKP', label: `TKP (${categoryCounts.TKP})` },
              ] as { id: 'ALL' | QuestionCategory; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-compact ${categoryFilter === tab.id ? 'btn-selected' : ''}`}
                onClick={() => handleCategoryPick(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="row-wrap" style={{ gap: '8px' }}>
            <select
              id="search-subtopic-select"
              aria-label="Filter subtopik"
              className="select-input"
              style={{ maxWidth: '280px' }}
              value={clusterFilter}
              onChange={(e) => {
                setClusterFilter(e.target.value as 'ALL' | SubtopicClusterId);
                setPage(1);
              }}
            >
              <option value="ALL">Semua subtopik ({availableClusters.length})</option>
              {availableClusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category}: {c.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={`btn btn-compact ${figureOnly ? 'btn-selected' : ''}`}
              aria-pressed={figureOnly}
              onClick={() => {
                setFigureOnly((v) => !v);
                setPage(1);
              }}
            >
              Hanya soal bergambar
            </button>

            <button
              type="button"
              className={`btn btn-compact ${showAllAnswers ? 'btn-selected' : ''}`}
              aria-pressed={showAllAnswers}
              onClick={() => setShowAllAnswers((v) => !v)}
            >
              {showAllAnswers ? 'Tutup semua pembahasan' : 'Buka semua pembahasan'}
            </button>
          </div>
        </div>
      </div>

      {/* Selected Subtopic Contextual Drill Banner */}
      {selectedClusterMeta && selectedDrillMeta && (
        <div className="section-message section-message-info" role="region" aria-label="Latihan subtopik terpilih">
          <span className="section-message-icon">
            <InfoIcon size={18} />
          </span>
          <div className="section-message-content">
            <h2 className="h-small">
              Subtopik: {selectedClusterMeta.category} - {selectedClusterMeta.label}
            </h2>
            <p className="section-message-body">{selectedClusterMeta.description}</p>
            <div className="row-wrap" style={{ marginTop: '8px', gap: '8px' }}>
              <a
                href={buildExamHubPath(selectedDrillMeta.id)}
                className="btn btn-primary btn-compact"
                onClick={(e) => {
                  if (!shouldHandleClientClick(e)) return;
                  e.preventDefault();
                  onStartPackage(selectedDrillMeta);
                }}
              >
                <PlayIcon size={12} />
                Latih subtopik ini dalam mode ujian ({getSubtopicQuestionCount(selectedClusterMeta.id)} soal)
              </a>
              <a
                href={buildStudyPath(selectedClusterMeta.studyModuleId)}
                className="btn btn-compact"
                onClick={(e) => {
                  if (!shouldHandleClientClick(e)) return;
                  e.preventDefault();
                  onOpenStudy(selectedClusterMeta.studyModuleId);
                }}
              >
                <CourseIcon size={12} />
                Buka kelas materi
              </a>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="card">
          <p className="body text-subtle">Memuat indeks {TOTAL_QUESTION_COUNT.toLocaleString('id-ID')} soal SKD...</p>
        </div>
      )}

      {!loading && loadError && (
        <div className="section-message section-message-warning">
          <div className="section-message-content row-wrap" style={{ justifyContent: 'space-between', width: '100%' }}>
            <p className="section-message-body">
              Tidak dapat memuat bank soal saat ini. Periksa koneksi internet lalu coba lagi.
            </p>
            <button
              type="button"
              className="btn btn-compact"
              onClick={() => setReloadTick((t) => t + 1)}
            >
              Muat ulang
            </button>
          </div>
        </div>
      )}

      {!loading && !loadError && filteredItems.length === 0 && (
        <div className="card stack-200" style={{ alignItems: 'flex-start' }}>
          <h2 className="h-small">Tidak ada soal yang cocok</h2>
          <p className="body text-subtle">
            Coba kata kunci yang lebih umum atau hapus filter subtopik dan kategori.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleResetFilters}>
            Tampilkan semua {TOTAL_QUESTION_COUNT.toLocaleString('id-ID')} soal
          </button>
        </div>
      )}

      {!loading && !loadError && filteredItems.length > 0 && (
        <>
          {/* Pagination Summary Bar */}
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <span className="body-small">
              Menampilkan <strong>{startIndex}-{endIndex}</strong> dari{' '}
              <strong className="mono">{filteredItems.length.toLocaleString('id-ID')}</strong> soal ditemukan
            </span>

            {totalPages > 1 && (
              <div className="row-wrap" style={{ gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-compact"
                  disabled={safePage <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <ChevronLeftIcon size={14} />
                  Sebelumnya
                </button>
                <span className="body-small mono">
                  Hal {safePage}/{totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-compact"
                  disabled={safePage >= totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Berikutnya
                  <ChevronRightIcon size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Search Result Question Cards */}
          <div className="stack-200">
            {pageItems.map((q) => {
              const userChoice = selfTestChoices[q.id];
              const isRevealed = showAllAnswers || Boolean(revealedIds[q.id]);
              const earned = userChoice ? getQuestionScore(q, userChoice) : 0;
              const pkgMeta = getPackageMetaById(q.packageId);
              const categoryLozenge =
                q.category === 'TWK'
                  ? 'lozenge-info'
                  : q.category === 'TIU'
                    ? 'lozenge-discovery'
                    : 'lozenge-success';

              return (
                <article key={q.id} className="card stack-200">
                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <div className="row-wrap" style={{ gap: '8px' }}>
                      <span className={`lozenge ${categoryLozenge}`}>
                        {q.category} · No. {q.number}
                      </span>
                      <span className="badge">{q.clusterLabel}</span>
                    </div>

                    {pkgMeta && (
                      <a
                        href={buildExamHubPath(pkgMeta.id)}
                        className="link body-small"
                        onClick={(e) => {
                          if (!shouldHandleClientClick(e)) return;
                          e.preventDefault();
                          onStartPackage(pkgMeta);
                        }}
                      >
                        {pkgMeta.title}
                      </a>
                    )}
                  </div>

                  <div className="question-stem">{q.question}</div>

                  {q.figureUrl && (
                    <div className="figure-box">
                      <img
                        width={560}
                        height={220}
                        src={q.figureUrl}
                        alt={`Gambar pendukung soal ${q.category} nomor ${q.number}`}
                        className="figure-img"
                      />
                    </div>
                  )}

                  {/* Clickable Options A-E */}
                  <div className="stack-200" style={{ gap: '8px' }} role="radiogroup" aria-label={`Uji mandiri soal ${q.id}`}>
                    {q.options.map((opt) => {
                      const isPicked = userChoice === opt.key;
                      const isBest = opt.key === q.correctOption;
                      let highlight = '';
                      if (isRevealed && isBest) {
                        highlight = 'correct';
                      } else if (isRevealed && isPicked && opt.score === 0) {
                        highlight = 'wrong';
                      } else if (isPicked) {
                        highlight = 'user-selected';
                      }

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          role="radio"
                          aria-checked={isPicked}
                          className="review-option search-option-btn"
                          data-highlight={highlight}
                          onClick={() => handleSelectOption(q.id, opt.key)}
                        >
                          <div className="body" style={{ flex: 1, minWidth: '200px', textAlign: 'start' }}>
                            <strong>{opt.key}.</strong> {opt.text}
                          </div>

                          {isRevealed && (
                            <div className="row-wrap" style={{ gap: '6px' }}>
                              {isPicked && <span className="lozenge lozenge-info">Pilihan Anda</span>}
                              {isBest && (
                                <span className="lozenge lozenge-success">
                                  <CheckCircleIcon size={12} />
                                  {q.category === 'TKP' ? 'Poin 5' : 'Benar (+5)'}
                                </span>
                              )}
                              {q.category === 'TKP' && !isBest && (
                                <span className="badge">Poin {opt.score}</span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      className={`btn btn-compact ${isRevealed ? 'btn-selected' : ''}`}
                      aria-expanded={isRevealed}
                      onClick={() => toggleReveal(q.id)}
                    >
                      {isRevealed ? 'Sembunyikan kunci & pembahasan' : 'Lihat kunci & pembahasan'}
                    </button>

                    {userChoice && (
                      <span className={`lozenge ${earned === 5 ? 'lozenge-success' : earned > 0 ? 'lozenge-warning' : 'lozenge-danger'}`}>
                        Pilihan Anda ({userChoice}): +{earned} poin
                      </span>
                    )}
                  </div>

                  {isRevealed && (
                    <div className="well-sunken stack-200" style={{ gap: '10px' }}>
                      <div>
                        <div className="h-xsmall">
                          Kunci {q.category === 'TKP' ? 'poin tertinggi' : 'jawaban'}:{' '}
                          <strong>{q.correctOption}</strong>
                          {q.category === 'TKP'
                            ? ` (${[...q.options]
                                .sort((a, b) => b.score - a.score)
                                .map((o) => `${o.key}=${o.score}`)
                                .join(' · ')})`
                            : ''}
                        </div>
                        <p className="body" style={{ whiteSpace: 'pre-line', marginTop: '6px' }}>
                          {q.explanation}
                        </p>
                      </div>

                      <div
                        className="row-wrap"
                        style={{
                          paddingTop: '10px',
                          borderTop: '1px solid var(--border-faint)',
                          justifyContent: 'space-between',
                        }}
                      >
                        <a
                          href={q.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link body-small"
                        >
                          Sumber: {q.sourceTitle}
                          <ExternalLinkIcon size={12} />
                        </a>
                        <a
                          href={q.studyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link body-small"
                        >
                          {q.studyLabel}
                          <ExternalLinkIcon size={12} />
                        </a>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Bottom Pagination Controls */}
          {totalPages > 1 && (
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <span className="body-small">
                Halaman {safePage} dari {totalPages}
              </span>
              <div className="row-wrap" style={{ gap: '8px' }}>
                <button
                  type="button"
                  className="btn"
                  disabled={safePage <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <ChevronLeftIcon size={16} />
                  Sebelumnya
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={safePage >= totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Berikutnya
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

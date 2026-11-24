import React, { useMemo, useState } from 'react';
import type {
  ExamAttempt,
  QuestionCategory,
  QuestionPackage,
  StudyModuleId,
} from '../types';
import {
  ALL_PACKAGES,
  FULL_PACKAGES,
  getPackageById,
  getSubtopicQuestionCount,
} from '../data/questionBank';
import {
  computeSubtopicAnalytics,
  getDrillPackageId,
  type MasteryLevel,
  type SubtopicClusterId,
  type SubtopicStat,
} from '../utils/analytics';
import { formatDateTimeId } from '../utils/scoring';
import { buildExamHubPath, buildHistoryPath, buildStudyPath, shouldHandleClientClick } from '../utils/router';
import { CourseIcon, InfoIcon, PlayIcon, RadarIcon } from './Icons';
import { RadarChart, type RadarAxisPoint } from './RadarChart';

interface AnalyticsViewProps {
  history: ExamAttempt[];
  onStartPackage: (pkg: QuestionPackage) => void;
  onOpenStudy: (moduleId: StudyModuleId) => void;
  onOpenAttempt: (attemptId: string) => void;
}

function levelBadge(level: MasteryLevel): { text: string; className: string } {
  if (level === 'untested') return { text: 'Belum diuji', className: 'badge' };
  if (level === 'weak') return { text: 'Perlu dilatih', className: 'lozenge lozenge-danger' };
  if (level === 'moderate') return { text: 'Cukup baik', className: 'lozenge lozenge-warning' };
  return { text: 'Kuat', className: 'lozenge lozenge-success' };
}

function levelColor(level: MasteryLevel): string {
  if (level === 'weak') return 'var(--chart-danger)';
  if (level === 'moderate') return 'var(--warning-bold)';
  if (level === 'strong') return 'var(--chart-brand)';
  return 'var(--border-muted)';
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  history,
  onStartPackage,
  onOpenStudy,
  onOpenAttempt,
}) => {
  const report = useMemo(() => computeSubtopicAnalytics(history), [history]);
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>('TWK');
  const [selectedClusterId, setSelectedClusterId] = useState<SubtopicClusterId | null>(null);

  const categoryStats = report.clustersByCategory[activeCategory];

  const sortedCategoryStats = useMemo(() => {
    return [...categoryStats].sort((a, b) => {
      if (a.totalSeen === 0 && b.totalSeen > 0) return 1;
      if (a.totalSeen > 0 && b.totalSeen === 0) return -1;
      if (a.masteryPct !== b.masteryPct) return a.masteryPct - b.masteryPct;
      return b.totalSeen - a.totalSeen;
    });
  }, [categoryStats]);

  const effectiveSelected: SubtopicStat = useMemo(() => {
    if (selectedClusterId) {
      const found = categoryStats.find((s) => s.cluster.id === selectedClusterId);
      if (found) return found;
    }
    const weakestTested = sortedCategoryStats.find((s) => s.totalSeen > 0);
    return weakestTested ?? categoryStats[0];
  }, [categoryStats, sortedCategoryStats, selectedClusterId]);

  const radarAxes: RadarAxisPoint[] = useMemo(() => {
    return categoryStats.map((stat) => ({
      id: stat.cluster.id,
      label: stat.cluster.shortLabel,
      value: stat.masteryPct,
      tested: stat.totalSeen > 0,
      detailText:
        stat.totalSeen === 0
          ? '--'
          : stat.cluster.category === 'TKP'
            ? `${stat.avgPointsPerQuestion.toFixed(1)}/5`
            : `${stat.masteryPct}%`,
    }));
  }, [categoryStats]);

  const handleCategoryChange = (cat: QuestionCategory) => {
    setActiveCategory(cat);
    const items = report.clustersByCategory[cat];
    const tested = items
      .filter((x) => x.totalSeen > 0)
      .sort((a, b) => a.masteryPct - b.masteryPct)[0];
    setSelectedClusterId((tested ?? items[0]).cluster.id);
  };

  const launchDrill = (clusterId: SubtopicClusterId) => {
    const drillPkg = getPackageById(getDrillPackageId(clusterId));
    if (drillPkg) {
      onStartPackage(drillPkg);
    }
  };

  const twkSummary = report.categorySummary.TWK;
  const tiuSummary = report.categorySummary.TIU;
  const tkpSummary = report.categorySummary.TKP;

  const selectedDrillId = getDrillPackageId(effectiveSelected.cluster.id);
  const selectedDrillCount = getSubtopicQuestionCount(effectiveSelected.cluster.id);
  const selectedBadge = levelBadge(effectiveSelected.level);

  return (
    <section className="stack-300" aria-label="Analitik peta kelemahan subtopik">
      {/* Header */}
      <div className="stack-200" style={{ gap: '4px' }}>
        <h1 className="h-xlarge">Analitik peta kelemahan per subtopik</h1>
        <p className="body text-subtle">
          Pantau tingkat penguasaan tiap rumpun materi pada Radar Chart untuk menemukan subtopik terlemah dan langsung berlatih soal terfokus.
        </p>
      </div>

      {/* Empty history CTA notice (still shows preview Radar Chart below) */}
      {history.length === 0 && (
        <div className="section-message section-message-info" role="status">
          <span className="section-message-icon">
            <InfoIcon size={18} />
          </span>
          <div className="section-message-content">
            <h2 className="h-small">Belum ada riwayat simulasi untuk dianalisis</h2>
            <p className="section-message-body">
              Selesaikan minimal satu paket simulasi atau latihan subtopik agar Radar Chart terisi otomatis oleh data skor Anda. Anda tetap dapat memilih salah satu sudut subtopik di bawah untuk langsung memulai latihan.
            </p>
            <div className="row-wrap" style={{ marginTop: '8px' }}>
              <a
                href={buildExamHubPath(FULL_PACKAGES[0].id)}
                className="btn btn-primary btn-compact"
                onClick={(e) => {
                  if (!shouldHandleClientClick(e)) return;
                  e.preventDefault();
                  onStartPackage(FULL_PACKAGES[0]);
                }}
              >
                <PlayIcon size={14} />
                Mulai simulasi 110 soal (Paket 1)
              </a>
              <a
                href={buildExamHubPath(ALL_PACKAGES.find((p) => !p.isFullSimulation)?.id ?? FULL_PACKAGES[0].id)}
                className="btn btn-compact"
                onClick={(e) => {
                  if (!shouldHandleClientClick(e)) return;
                  e.preventDefault();
                  const focused = ALL_PACKAGES.find((p) => !p.isFullSimulation) ?? FULL_PACKAGES[0];
                  onStartPackage(focused);
                }}
              >
                Latihan fokus 30 soal
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div className="grid-4">
        <div className="kpi-card">
          <span className="body-small">Soal dievaluasi</span>
          <div className="metric-medium mono">{report.totalQuestionsEvaluated}</div>
          <span className="body-small">
            {report.totalAttempts} simulasi · {report.testedClustersCount}/{report.totalClustersCount} subtopik teruji
          </span>
        </div>

        <div className="kpi-card">
          <span className="body-small">Penguasaan TWK</span>
          <div className="metric-medium mono">
            {twkSummary.totalSeen > 0 ? `${twkSummary.masteryPct}%` : '--'}
          </div>
          <span className="body-small">
            {twkSummary.totalSeen > 0
              ? `${twkSummary.earnedPoints}/${twkSummary.maxPoints} poin (${twkSummary.totalSeen} soal)`
              : 'Belum ada soal TWK'}
          </span>
        </div>

        <div className="kpi-card">
          <span className="body-small">Penguasaan TIU</span>
          <div className="metric-medium mono">
            {tiuSummary.totalSeen > 0 ? `${tiuSummary.masteryPct}%` : '--'}
          </div>
          <span className="body-small">
            {tiuSummary.totalSeen > 0
              ? `${tiuSummary.earnedPoints}/${tiuSummary.maxPoints} poin (${tiuSummary.totalSeen} soal)`
              : 'Belum ada soal TIU'}
          </span>
        </div>

        <div className="kpi-card">
          <span className="body-small">Rata-rata poin TKP</span>
          <div className="metric-medium mono">
            {tkpSummary.totalSeen > 0 ? (
              <>
                {tkpSummary.avgPointsPerQuestion.toFixed(1)}{' '}
                <span className="body-small">/ 5.0</span>
              </>
            ) : (
              '--'
            )}
          </div>
          <span className="body-small">
            {tkpSummary.totalSeen > 0
              ? `${tkpSummary.masteryPct}% optimal (${tkpSummary.totalSeen} soal)`
              : 'Belum ada soal TKP'}
          </span>
        </div>
      </div>

      {/* Top 3 Weakest Priorities */}
      {report.weakestTop3.length > 0 && (
        <section className="stack-200" aria-label="Prioritas perbaikan teratas">
          <div>
            <h2 className="h-medium">3 prioritas subtopik untuk ditingkatkan</h2>
            <p className="body-small text-subtle">
              Diurutkan dari persentase penguasaan terendah di seluruh simulasi yang sudah diselesaikan.
            </p>
          </div>

          <div className="grid-3">
            {report.weakestTop3.map((stat, idx) => {
              const badge = levelBadge(stat.level);
              const drillId = getDrillPackageId(stat.cluster.id);
              const drillCount = getSubtopicQuestionCount(stat.cluster.id);
              return (
                <article key={stat.cluster.id} className="card stack-200">
                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="body-small mono">
                      Prioritas #{idx + 1} · {stat.cluster.category}
                    </span>
                    <span className={badge.className}>{badge.text}</span>
                  </div>

                  <div>
                    <h3 className="h-small">{stat.cluster.label}</h3>
                    <p className="body-small text-subtle" style={{ marginTop: '4px' }}>
                      {stat.cluster.category === 'TKP'
                        ? `Rata-rata ${stat.avgPointsPerQuestion.toFixed(1)}/5.0 poin · ${stat.perfectCount}/${stat.totalSeen} soal poin 5`
                        : `${stat.perfectCount}/${stat.totalSeen} soal benar (${stat.masteryPct}%)`}
                    </p>
                  </div>

                  <div className="chart-bar-track" aria-label={`Penguasaan ${stat.masteryPct}%`}>
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: `${stat.masteryPct}%`,
                        backgroundColor: levelColor(stat.level),
                      }}
                    />
                  </div>

                  <div className="row-wrap" style={{ gap: '8px', marginTop: 'auto' }}>
                    <a
                      href={buildExamHubPath(drillId)}
                      className="btn btn-primary btn-compact"
                      onClick={(e) => {
                        if (!shouldHandleClientClick(e)) return;
                        e.preventDefault();
                        launchDrill(stat.cluster.id);
                      }}
                    >
                      <PlayIcon size={12} />
                      Latih ({drillCount} soal)
                    </a>
                    <a
                      href={buildStudyPath(stat.cluster.studyModuleId)}
                      className="btn btn-compact"
                      onClick={(e) => {
                        if (!shouldHandleClientClick(e)) return;
                        e.preventDefault();
                        onOpenStudy(stat.cluster.studyModuleId);
                      }}
                    >
                      <CourseIcon size={12} />
                      Materi
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Interactive Radar Chart + Category Breakdown */}
      <div className="analytics-radar-layout">
        {/* Left Card: Radar Chart */}
        <div className="card stack-200">
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <div className="row-wrap" style={{ gap: '8px' }}>
              <RadarIcon size={18} />
              <h2 className="h-medium">Radar penguasaan {activeCategory}</h2>
            </div>

            <div className="row-wrap" style={{ gap: '6px' }}>
              {(['TWK', 'TIU', 'TKP'] as QuestionCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-compact ${activeCategory === cat ? 'btn-selected' : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat} ({report.clustersByCategory[cat].length})
                </button>
              ))}
            </div>
          </div>

          <RadarChart
            axes={radarAxes}
            targetValue={75}
            selectedId={effectiveSelected.cluster.id}
            onSelectAxis={(id) => setSelectedClusterId(id as SubtopicClusterId)}
            ariaLabel={`Radar Chart penguasaan subtopik ${activeCategory}`}
          />

          <div className="row-wrap" style={{ justifyContent: 'center', gap: '14px' }}>
            <span className="body-small">
              <strong style={{ color: 'var(--brand-primary)' }}>Area biru:</strong> Skor Anda
            </span>
            <span className="body-small">
              <strong>Garis putus-putus:</strong> Target aman 75%
            </span>
          </div>

          {/* Selected Axis Action Panel */}
          <div className="well-sunken stack-200" style={{ gap: '10px' }}>
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <strong className="h-xsmall">{effectiveSelected.cluster.label}</strong>
              <span className={selectedBadge.className}>{selectedBadge.text}</span>
            </div>
            <p className="body-small">{effectiveSelected.cluster.description}</p>
            <div className="body-small mono">
              {effectiveSelected.totalSeen === 0
                ? 'Belum ada riwayat pengerjaan pada subtopik ini.'
                : effectiveSelected.cluster.category === 'TKP'
                  ? `Capaian: ${effectiveSelected.masteryPct}% · Rata-rata ${effectiveSelected.avgPointsPerQuestion.toFixed(1)}/5.0 poin (${effectiveSelected.totalSeen} soal)`
                  : `Capaian: ${effectiveSelected.masteryPct}% · ${effectiveSelected.perfectCount} dari ${effectiveSelected.totalSeen} soal benar (+5)`}
            </div>
            <div className="row-wrap" style={{ gap: '8px' }}>
              <a
                href={buildExamHubPath(selectedDrillId)}
                className="btn btn-primary btn-compact"
                onClick={(e) => {
                  if (!shouldHandleClientClick(e)) return;
                  e.preventDefault();
                  launchDrill(effectiveSelected.cluster.id);
                }}
              >
                <PlayIcon size={12} />
                Latih subtopik ini ({selectedDrillCount} soal)
              </a>
              <a
                href={buildStudyPath(effectiveSelected.cluster.studyModuleId)}
                className="btn btn-compact"
                onClick={(e) => {
                  if (!shouldHandleClientClick(e)) return;
                  e.preventDefault();
                  onOpenStudy(effectiveSelected.cluster.studyModuleId);
                }}
              >
                <CourseIcon size={12} />
                Buka kelas materi
              </a>
            </div>
          </div>
        </div>

        {/* Right Card: Subtopic List for Active Category */}
        <div className="card stack-200">
          <div>
            <h2 className="h-medium">Rincian subtopik {activeCategory}</h2>
            <p className="body-small text-subtle">
              Ketuk salah satu subtopik untuk menyorot sudutnya pada Radar Chart.
            </p>
          </div>

          <div className="stack-200" style={{ gap: '10px' }}>
            {sortedCategoryStats.map((stat) => {
              const isSelected = stat.cluster.id === effectiveSelected.cluster.id;
              const badge = levelBadge(stat.level);
              const drillId = getDrillPackageId(stat.cluster.id);
              const drillCount = getSubtopicQuestionCount(stat.cluster.id);
              return (
                <div
                  key={stat.cluster.id}
                  className="subtopic-row"
                  data-selected={isSelected}
                  onClick={() => setSelectedClusterId(stat.cluster.id)}
                >
                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="h-xsmall">{stat.cluster.label}</span>
                    <span className={badge.className}>{badge.text}</span>
                  </div>

                  <div className="chart-bar-track" aria-label={`${stat.cluster.label} ${stat.masteryPct}%`}>
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: `${stat.masteryPct}%`,
                        backgroundColor: levelColor(stat.level),
                      }}
                    />
                  </div>

                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="body-small mono">
                      {stat.totalSeen === 0
                        ? '0 soal dikerjakan'
                        : stat.cluster.category === 'TKP'
                          ? `${stat.avgPointsPerQuestion.toFixed(1)}/5.0 · ${stat.masteryPct}% (${stat.totalSeen} soal)`
                          : `${stat.perfectCount}/${stat.totalSeen} benar · ${stat.masteryPct}%`}
                    </span>

                    <a
                      href={buildExamHubPath(drillId)}
                      className="btn btn-compact"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!shouldHandleClientClick(e)) return;
                        e.preventDefault();
                        launchDrill(stat.cluster.id);
                      }}
                    >
                      Latih ({drillCount} soal)
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Attempt Score Trend */}
      {report.trend.length >= 1 && (
        <section className="card stack-200" aria-label="Tren perkembangan skor simulasi">
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <h2 className="h-medium">Tren perkembangan skor ({report.trend.length} percobaan terakhir)</h2>
          </div>

          <div className="stack-200" style={{ gap: '10px' }}>
            {report.trend.map((pt) => (
              <div key={pt.attemptId} className="well-sunken stack-200" style={{ gap: '8px', padding: '12px 14px' }}>
                <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                  <div className="row-wrap" style={{ gap: '8px' }}>
                    <span className="badge mono">{pt.label}</span>
                    <strong className="h-xsmall">{pt.packageTitle}</strong>
                    <span className="body-small text-subtle">{formatDateTimeId(pt.finishedAt)}</span>
                  </div>

                  <div className="row-wrap" style={{ gap: '8px' }}>
                    <span className="mono">
                      <strong>{pt.totalScore}</strong> / {pt.maxTotalScore} ({pt.pct}%)
                    </span>
                    <span className={`lozenge ${pt.passed ? 'lozenge-success' : 'lozenge-danger'}`}>
                      {pt.passed ? 'Lulus PG' : 'Belum PG'}
                    </span>
                    <a
                      href={buildHistoryPath(pt.attemptId)}
                      className="btn btn-compact"
                      onClick={(e) => {
                        if (!shouldHandleClientClick(e)) return;
                        e.preventDefault();
                        onOpenAttempt(pt.attemptId);
                      }}
                    >
                      Rapor
                    </a>
                  </div>
                </div>

                <div className="chart-bar-track">
                  <div
                    className="chart-bar-fill"
                    style={{
                      width: `${pt.pct}%`,
                      backgroundColor: pt.passed ? 'var(--chart-success)' : 'var(--chart-brand)',
                    }}
                  />
                </div>

                <div className="body-small mono">
                  TWK {pt.twkScore} · TIU {pt.tiuScore} · TKP {pt.tkpScore}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
};

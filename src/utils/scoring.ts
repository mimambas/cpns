import type {
  ExamAttempt,
  ExamEvaluation,
  FormationRule,
  FormationType,
  OptionKey,
  Question,
  QuestionCategory,
  SubtestResult,
} from '../types';

/**
 * Ambang batas kelulusan resmi SKD CPNS berdasarkan
 * Keputusan Menteri PANRB Nomor 321 Tahun 2024.
 */
export const FORMATION_RULES: Record<FormationType, FormationRule> = {
  umum: {
    id: 'umum',
    label: 'Kebutuhan Umum & Putra/Putri Kalimantan',
    shortLabel: 'Umum',
    description: 'TWK minimal 65 · TIU minimal 80 · TKP minimal 166',
    twkMin: 65,
    tiuMin: 80,
    tkpMin: 166,
    totalMin: 311,
  },
  cumlaude: {
    id: 'cumlaude',
    label: 'Kebutuhan Khusus Cumlaude & Diaspora',
    shortLabel: 'Cumlaude / Diaspora',
    description: 'Nilai kumulatif SKD minimal 311 · TIU minimal 85',
    twkMin: null,
    tiuMin: 85,
    tkpMin: null,
    totalMin: 311,
  },
  khusus: {
    id: 'khusus',
    label: 'Disabilitas, Putra/Putri Papua & Daerah Tertinggal',
    shortLabel: 'Disabilitas / Papua / 3T',
    description: 'Nilai kumulatif SKD minimal 286 · TIU minimal 60',
    twkMin: null,
    tiuMin: 60,
    tkpMin: null,
    totalMin: 286,
  },
};

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  TWK: 'Tes Wawasan Kebangsaan',
  TIU: 'Tes Intelegensia Umum',
  TKP: 'Tes Karakteristik Pribadi',
};

export function getQuestionScore(question: Question, selected?: OptionKey): number {
  if (!selected) return 0;
  const opt = question.options.find((o) => o.key === selected);
  return opt ? opt.score : 0;
}

export function evaluateExam(
  questions: Question[],
  answers: Record<string, OptionKey>,
  formationId: FormationType,
  isFullSimulation: boolean,
): ExamEvaluation {
  const formation = FORMATION_RULES[formationId];

  const categories: QuestionCategory[] = ['TWK', 'TIU', 'TKP'];
  const subtests = {} as Record<QuestionCategory, SubtestResult>;

  let totalScore = 0;
  let maxTotalScore = 0;
  let answeredTotal = 0;

  for (const cat of categories) {
    const catQuestions = questions.filter((q) => q.category === cat);
    let score = 0;
    let answeredCount = 0;
    let correctCount = 0;
    const maxScore = catQuestions.length * 5;

    for (const q of catQuestions) {
      const selected = answers[q.id];
      if (selected) {
        answeredCount += 1;
        const pts = getQuestionScore(q, selected);
        score += pts;
        if (pts === 5) {
          correctCount += 1;
        }
      }
    }

    totalScore += score;
    maxTotalScore += maxScore;
    answeredTotal += answeredCount;

    let passingGrade: number | null = null;
    if (isFullSimulation) {
      if (cat === 'TWK' && formation.twkMin !== null) {
        passingGrade = maxScore === 150 ? formation.twkMin : Math.round((formation.twkMin * maxScore) / 150);
      }
      if (cat === 'TIU') {
        passingGrade = maxScore === 175 ? formation.tiuMin : Math.round((formation.tiuMin * maxScore) / 175);
      }
      if (cat === 'TKP' && formation.tkpMin !== null) {
        passingGrade = maxScore === 225 ? formation.tkpMin : Math.round((formation.tkpMin * maxScore) / 225);
      }
    }

    const passed =
      passingGrade === null || catQuestions.length === 0 ? null : score >= passingGrade;

    subtests[cat] = {
      category: cat,
      label: CATEGORY_LABELS[cat],
      totalQuestions: catQuestions.length,
      answeredCount,
      correctCount,
      score,
      maxScore,
      passingGrade,
      passed,
    };
  }

  let passed = false;
  let reason = '';

  const scaleNote =
    maxTotalScore !== 550 && maxTotalScore > 0
      ? ` (penyesuaian proporsional paket ${questions.length} soal)`
      : '';

  if (!isFullSimulation) {
    const targetPct = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
    passed = targetPct >= 60;
    reason = `Mode latihan fokus subtes selesai dengan capaian ${totalScore} dari ${maxTotalScore} poin (${targetPct}%). Evaluasi ambang batas penuh berlaku pada paket simulasi CAT.`;
  } else if (formation.id === 'umum') {
    const twkMin = subtests.TWK.passingGrade ?? 0;
    const tiuMin = subtests.TIU.passingGrade ?? 0;
    const tkpMin = subtests.TKP.passingGrade ?? 0;
    const failedParts: string[] = [];
    if (subtests.TWK.score < twkMin) {
      failedParts.push(`TWK (${subtests.TWK.score} < ${twkMin})`);
    }
    if (subtests.TIU.score < tiuMin) {
      failedParts.push(`TIU (${subtests.TIU.score} < ${tiuMin})`);
    }
    if (subtests.TKP.score < tkpMin) {
      failedParts.push(`TKP (${subtests.TKP.score} < ${tkpMin})`);
    }
    passed = failedParts.length === 0;
    reason = passed
      ? `Seluruh subtes memenuhi nilai ambang batas ${formation.label} (TWK >= ${twkMin}, TIU >= ${tiuMin}, TKP >= ${tkpMin})${scaleNote}.`
      : `Belum memenuhi nilai ambang batas pada: ${failedParts.join(', ')}${scaleNote}.`;
  } else {
    const totalMin =
      maxTotalScore === 550 ? formation.totalMin : Math.round((formation.totalMin * maxTotalScore) / 550);
    const tiuMin = subtests.TIU.passingGrade ?? formation.tiuMin;
    const failedParts: string[] = [];
    if (totalScore < totalMin) {
      failedParts.push(`Total SKD (${totalScore} < ${totalMin})`);
    }
    if (subtests.TIU.score < tiuMin) {
      failedParts.push(`TIU (${subtests.TIU.score} < ${tiuMin})`);
    }
    passed = failedParts.length === 0;
    reason = passed
      ? `Memenuhi nilai ambang batas ${formation.label} (Total >= ${totalMin} dan TIU >= ${tiuMin})${scaleNote}.`
      : `Belum memenuhi ambang batas ${formation.label} pada: ${failedParts.join(', ')}${scaleNote}.`;
  }

  return {
    formation,
    totalScore,
    maxTotalScore,
    passed,
    reason,
    subtests,
    answeredTotal,
    unansweredTotal: questions.length - answeredTotal,
  };
}

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function formatDurationText(seconds: number): string {
  const clamped = Math.max(0, Math.round(seconds));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs} jam`);
  if (mins > 0) parts.push(`${mins} menit`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} detik`);
  return parts.join(' ');
}

export function formatDateTimeId(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function summarizeAttempt(attempt: ExamAttempt): ExamEvaluation {
  return evaluateExam(
    attempt.questions,
    attempt.answers,
    attempt.formationId,
    attempt.isFullSimulation,
  );
}

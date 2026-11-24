export type QuestionCategory = 'TWK' | 'TIU' | 'TKP';

export type StudyModuleId =
  | 'modul-regulasi'
  | 'modul-twk'
  | 'modul-tiu'
  | 'modul-tkp'
  | 'modul-drive';

export type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';

export interface QuestionOption {
  key: OptionKey;
  text: string;
  score: number;
}

export interface Question {
  id: string;
  number: number;
  category: QuestionCategory;
  subtopic: string;
  question: string;
  figureUrl?: string;
  options: QuestionOption[];
  correctOption: OptionKey;
  explanation: string;
  sourceTitle: string;
  sourceUrl: string;
  studyUrl: string;
  studyLabel: string;
}

export interface QuestionPackage {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  sourceTitle: string;
  sourceUrl: string;
  isFullSimulation: boolean;
  compositionLabel: string;
  questions: Question[];
}

export interface PackageMeta {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  sourceTitle: string;
  sourceUrl: string;
  isFullSimulation: boolean;
  compositionLabel: string;
  questionCount: number;
  twkCount: number;
  tiuCount: number;
  tkpCount: number;
}

export interface SearchableQuestionItem extends Question {
  packageId: string;
  packageTitle: string;
  clusterId: string;
  clusterLabel: string;
  hasFigure: boolean;
}

export type FormationType = 'umum' | 'cumlaude' | 'khusus';

export interface FormationRule {
  id: FormationType;
  label: string;
  shortLabel: string;
  description: string;
  twkMin: number | null;
  tiuMin: number;
  tkpMin: number | null;
  totalMin: number;
}

export interface SubtestResult {
  category: QuestionCategory;
  label: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  score: number;
  maxScore: number;
  passingGrade: number | null;
  passed: boolean | null;
}

export interface ExamEvaluation {
  formation: FormationRule;
  totalScore: number;
  maxTotalScore: number;
  passed: boolean;
  reason: string;
  subtests: Record<QuestionCategory, SubtestResult>;
  answeredTotal: number;
  unansweredTotal: number;
}

export interface ExamAttempt {
  id: string;
  packageId: string;
  packageTitle: string;
  isFullSimulation: boolean;
  formationId: FormationType;
  startedAt: string;
  finishedAt: string;
  elapsedSeconds: number;
  allocatedSeconds: number;
  answers: Record<string, OptionKey>;
  flaggedIds: string[];
  questions: Question[];
}

export interface ActiveExamSession {
  packageId: string;
  packageTitle: string;
  isFullSimulation: boolean;
  formationId: FormationType;
  startedAt: string;
  allocatedSeconds: number;
  remainingSeconds: number;
  currentIndex: number;
  answers: Record<string, OptionKey>;
  flaggedIds: string[];
}

export interface StudyLinkItem {
  title: string;
  url: string;
  category: string;
  description: string;
}

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'offline';

export interface CloudProfile {
  syncCode: string;
  userId: string;
  displayName: string;
  lastSyncedAt: string | null;
}

export interface RankInfo {
  rank: number;
  totalParticipants: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  attemptId: string;
  displayName: string;
  formationId: FormationType;
  twkScore: number;
  tiuScore: number;
  tkpScore: number;
  totalScore: number;
  maxScore: number;
  passed: boolean;
  elapsedSeconds: number;
  finishedAt: string;
  attemptsCount: number;
  isMe: boolean;
}

export interface LeaderboardSummary {
  totalParticipants: number;
  topScore: number;
  avgScore: number;
  passedCount: number;
}

export interface LeaderboardResponse {
  ok: boolean;
  packageId: string;
  summary: LeaderboardSummary;
  entries: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
}

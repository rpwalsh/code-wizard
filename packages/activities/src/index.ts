// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
export type {
  Activity,
  ActivityKind,
  ActivityOption,
  ActivityResponse,
  Blank,
  FillBlanksActivity,
  MatchPair,
  MatchPairsActivity,
  CategorizeActivity,
  CategoryBucket,
  CategoryItem,
  BuildTreeActivity,
  TreeNode,
  MultipleChoiceActivity,
  OrderLinesActivity,
  PredictOutputActivity,
  SpotTheBugActivity,
} from './model.ts';
export { dimensionsByKind } from './model.ts';

export type { ActivityGrade } from './grading.ts';
export { grade, normalizeOutput, normalizeToken } from './grading.ts';

export type { ActivityEvidence } from './evidence.ts';
export { ACTIVITY_CEILING, evidenceFrom, unreachableByActivities } from './evidence.ts';

export type { Run, RunState, RunSummary } from './run.ts';
export { answer, currentActivity, isFinished, startRun, summarize, verdict } from './run.ts';

export type { PracticeLog } from './streak.ts';
export {
  carryForward,
  dayOf,
  DEFAULT_MINIMUM,
  minimumMet,
  newPracticeLog,
  practiceLine,
  recordRun,
} from './streak.ts';

export { checkActivities, checkActivity } from './checks.ts';

export { activityFileSchema, activitySchema, parseActivity } from './schema.ts';
export { ActivityLoadError, loadActivities, loadActivitiesForLanguage } from './loader.ts';

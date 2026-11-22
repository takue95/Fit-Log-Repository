import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  CalendarDays,
  Check,
  ChevronRight,
  Dumbbell,
  Plus,
  Scale,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { RoutineTemplate, CompletedWorkout, ActiveWorkout, UserSettings, BodyWeightEntry, Exercise, CoachStartAction, TrainingBlock } from '../types/fitness';
import { TrendLineChart } from './TrendLineChart';
import { getAdaptiveSuggestion } from '../utils/fitnessCalc';

interface DashboardProps {
  routines: RoutineTemplate[];
  trainingBlocks: TrainingBlock[];
  exercises: Exercise[];
  history: CompletedWorkout[];
  bodyWeights: BodyWeightEntry[];
  activeWorkout: ActiveWorkout | null;
  settings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => void;
  onUpdateActiveWorkout: (updater: (prev: ActiveWorkout) => ActiveWorkout) => void;
  onAddExerciseToActive: (exercise: Exercise, sets?: number, reps?: number, fallbackWeight?: number) => void;
  onStartEmptyWorkout: () => void;
  onStartRoutine: (routine: RoutineTemplate, coachAction?: CoachStartAction) => void;
  onViewRoutine: (routine: RoutineTemplate) => void;
  onOpenTrainingBlocks: () => void;
  onResumeActiveWorkout: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToHistory: () => void;
  onAddBodyWeight: (weight: number, date: string) => void;
  onOpenPlateCalc: () => void;
  onOpenOneRMCalc: () => void;
}

const SPLIT_PREFERENCE_KEY = 'fitlog_current_split_v1';
const SPLIT_CHANGE_EVENT = 'fitlog-split-change';

const startOfLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const splitNameForRoutine = (routine: RoutineTemplate) => {
  if (routine.title.toLowerCase().includes('arnold split')) return 'Arnold Split';
  if (routine.isCustom || routine.category === 'Custom') return 'Custom';
  return routine.category;
};

const inferCurrentSplit = (
  routines: RoutineTemplate[],
  history: CompletedWorkout[],
  activeWorkout: ActiveWorkout | null
) => {
  const activeRoutine = activeWorkout?.routineId
    ? routines.find((routine) => routine.id === activeWorkout.routineId)
    : undefined;
  if (activeRoutine) return splitNameForRoutine(activeRoutine);

  const recentWorkouts = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const workout of recentWorkouts) {
    const routine = routines.find((item) =>
      (workout as CompletedWorkout & { routineId?: string }).routineId === item.id ||
      item.title.toLowerCase() === workout.title.toLowerCase()
    );
    if (routine) return splitNameForRoutine(routine);
  }

  const available = Array.from(new Set(routines.map(splitNameForRoutine)));
  return available.includes('Arnold Split')
    ? 'Arnold Split'
    : available.includes('Push / Pull / Legs')
      ? 'Push / Pull / Legs'
      : available[0] || 'All';
};

export const Dashboard: React.FC<DashboardProps> = ({
  routines,
  trainingBlocks,
  exercises,
  history,
  bodyWeights,
  activeWorkout,
  settings,
  onUpdateSettings,
  onUpdateActiveWorkout,
  onAddExerciseToActive,
  onStartEmptyWorkout,
  onStartRoutine,
  onViewRoutine,
  onOpenTrainingBlocks,
  onResumeActiveWorkout,
  onNavigateToAnalytics,
  onNavigateToHistory,
  onAddBodyWeight,
  onOpenPlateCalc,
  onOpenOneRMCalc
}) => {
  const [isAddingWeight, setIsAddingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [insightCycle, setInsightCycle] = useState<{ key: string; index: number }>({ key: '', index: 0 });
  const [selectedSplit, setSelectedSplit] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SPLIT_PREFERENCE_KEY);
      if (saved && routines.some((routine) => splitNameForRoutine(routine) === saved)) return saved;
    } catch {
      // Fall back to the split inferred from the current workout history.
    }
    return inferCurrentSplit(routines, history, activeWorkout);
  });

  useEffect(() => {
    const syncSplit = (split: string) => {
      if (routines.some((routine) => splitNameForRoutine(routine) === split)) setSelectedSplit(split);
    };
    const handleSplitChange = (event: Event) => {
      const split = (event as CustomEvent<string>).detail;
      if (typeof split === 'string') syncSplit(split);
    };
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem(SPLIT_PREFERENCE_KEY);
        if (saved) syncSplit(saved);
      } catch {
        // Keep the current in-memory choice if storage is unavailable.
      }
    };

    window.addEventListener(SPLIT_CHANGE_EVENT, handleSplitChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(SPLIT_CHANGE_EVENT, handleSplitChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [routines]);
  const now = new Date();
  const localToday = startOfLocalDay(now);
  const weekStart = new Date(localToday);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const recentHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [history]
  );
  const thisWeek = recentHistory.filter((workout) => new Date(workout.date) >= weekStart);
  const weeklyVolume = thisWeek.reduce((sum, workout) => sum + workout.totalVolume, 0);
  const weeklyMinutes = thisWeek.reduce((sum, workout) => sum + workout.durationMinutes, 0);
  const weeklyPRs = recentHistory
    .filter((workout) => new Date(workout.date) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, workout) => sum + workout.prsAchieved.length, 0);

  const dayCells = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    const hasWorkout = recentHistory.some((workout) => startOfLocalDay(new Date(workout.date)).getTime() === date.getTime());
    return { date, label: date.toLocaleDateString(undefined, { weekday: 'short' }), hasWorkout, isToday: date.getTime() === localToday.getTime() };
  });

  const activeRoutine = activeWorkout?.routineId
    ? routines.find((routine) => routine.id === activeWorkout.routineId)
    : undefined;
  const splitRoutines = routines.filter((routine) => splitNameForRoutine(routine) === selectedSplit);
  const lastSplitWorkout = recentHistory.find((workout) =>
    splitRoutines.some((routine) =>
      routine.title.toLowerCase() === workout.title.toLowerCase() ||
      (workout as CompletedWorkout & { routineId?: string }).routineId === routine.id
    )
  );
  const lastSplitIndex = splitRoutines.findIndex((routine) =>
    routine.title.toLowerCase() === lastSplitWorkout?.title.toLowerCase() ||
    routine.id === (lastSplitWorkout as (CompletedWorkout & { routineId?: string }) | undefined)?.routineId
  );
  const nextSplitRoutine = splitRoutines.length > 0
    ? splitRoutines[(lastSplitIndex + 1) % splitRoutines.length]
    : undefined;

  const arnoldRoutines = splitRoutines
    .filter((routine) => routine.title.toLowerCase().includes('arnold split'))
    .sort((a, b) => {
      const order = (title: string) => title.toLowerCase().includes('chest & back') ? 0 : title.toLowerCase().includes('legs') ? 1 : title.toLowerCase().includes('shoulders & arms') ? 2 : 3;
      return order(a.title) - order(b.title);
    });
  const lastArnoldIndex = arnoldRoutines.findIndex((routine) =>
    routine.title.toLowerCase() === lastSplitWorkout?.title.toLowerCase()
  );
  const nextArnoldRoutine = arnoldRoutines.length > 0
    ? arnoldRoutines[(lastArnoldIndex + 1) % arnoldRoutines.length]
    : undefined;

  const pplRoutines = splitRoutines.filter((routine) => routine.category === 'Push / Pull / Legs');
  const lastTitle = lastSplitWorkout?.title.toLowerCase() ?? '';
  const nextFocus = lastTitle.includes('push') ? 'pull' : lastTitle.includes('pull') ? 'legs' : lastTitle.includes('legs') ? 'push' : 'push';
  const nextPplRoutine = pplRoutines.find((routine) => routine.title.toLowerCase().includes(nextFocus)) ?? pplRoutines[0];
  const nextRoutine = activeRoutine ?? (
    selectedSplit === 'Arnold Split'
      ? nextArnoldRoutine ?? nextSplitRoutine
      : selectedSplit === 'Push / Pull / Legs'
        ? nextPplRoutine ?? nextSplitRoutine
        : nextSplitRoutine
  ) ?? routines[0];
  const nextSessionLabel = selectedSplit === 'Push / Pull / Legs'
    ? `${nextFocus} day`
    : selectedSplit;
  const activeTrainingBlock = trainingBlocks.find((block) => block.status === 'active' || block.status === 'paused');
  const blockRoutines = activeTrainingBlock
    ? (activeTrainingBlock.routineIds || [])
        .map((id) => routines.find((routine) => routine.id === id))
        .filter((routine): routine is RoutineTemplate => Boolean(routine))
    : [];
  const resolvedBlockRoutines = activeTrainingBlock && blockRoutines.length === 0
    ? routines.filter((routine) => (activeTrainingBlock.routineTitles || []).some((title) => title.toLowerCase() === routine.title.toLowerCase()))
    : blockRoutines;
  const blockSessions = activeTrainingBlock
    ? recentHistory.filter((workout) => {
        if (new Date(workout.date).getTime() < new Date(activeTrainingBlock.startDate + 'T00:00:00').getTime()) return false;
        if (workout.routineId) return activeTrainingBlock.routineIds.includes(workout.routineId);
        return activeTrainingBlock.routineTitles.some((title) => title.toLowerCase() === workout.title.toLowerCase());
      })
    : [];
  const blockNextRoutine = activeTrainingBlock && resolvedBlockRoutines.length
    ? resolvedBlockRoutines[blockSessions.length % resolvedBlockRoutines.length]
    : null;
  const blockWeek = activeTrainingBlock
    ? Math.max(1, Math.min(activeTrainingBlock.durationWeeks, Math.floor((
        (activeTrainingBlock.status === 'paused' && activeTrainingBlock.pausedAt
          ? new Date(activeTrainingBlock.pausedAt).getTime()
          : now.getTime()) -
        new Date(activeTrainingBlock.startDate + 'T00:00:00').getTime() -
        (activeTrainingBlock.pausedDurationMs || 0)
      ) / 604800000) + 1))
    : 1;
  const blockWeekStart = activeTrainingBlock
    ? new Date(new Date(activeTrainingBlock.startDate + 'T00:00:00').getTime() + (blockWeek - 1) * 604800000)
    : localToday;
  const blockWeekEnd = new Date(blockWeekStart.getTime() + 604800000);
  const blockWeekSessions = blockSessions.filter((workout) => {
    const date = new Date(workout.date);
    return date >= blockWeekStart && date < blockWeekEnd;
  });
  const blockWeekPhase = activeTrainingBlock && blockWeek === activeTrainingBlock.durationWeeks
    ? 'Review'
    : activeTrainingBlock && activeTrainingBlock.easierWeek === blockWeek
      ? 'Easier week'
      : blockWeek === 1 ? 'Starting week' : 'Build';
  const workoutOfDay = (activeTrainingBlock ? blockNextRoutine : nextRoutine) ?? nextRoutine;
  const blockWeekPercent = activeTrainingBlock
    ? Math.round((blockWeek / activeTrainingBlock.durationWeeks) * 100)
    : 0;
  const sortedWeights = useMemo(
    () => [...bodyWeights].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [bodyWeights]
  );
  const latestWeight = sortedWeights[sortedWeights.length - 1];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const comparisonWeight = [...sortedWeights].reverse().find((entry) => new Date(entry.date) <= thirtyDaysAgo) ?? sortedWeights[0];
  const weightChange = latestWeight && comparisonWeight && latestWeight.id !== comparisonWeight.id
    ? latestWeight.weight - comparisonWeight.weight
    : 0;
  const chartEntries = sortedWeights.slice(-7);
  const chartData = chartEntries.map((entry) => ({ date: entry.date, value: entry.weight }));

  const weeklyTarget = Math.min(7, Math.max(2, Math.round(settings.weeklyWorkoutTarget ?? 3)));
  const completedThisWeek = thisWeek.length;
  const weeklyProgress = Math.min(100, Math.round((completedThisWeek / weeklyTarget) * 100));
  const focusRoutine = activeRoutine ?? nextRoutine;
  const focusExerciseTemplates = activeWorkout
    ? activeWorkout.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        defaultSets: Math.max(1, exercise.sets.length),
        defaultReps: exercise.sets[0]?.reps || 8
      }))
    : focusRoutine?.exercises ?? [];
  const focusExerciseDefinitions = focusExerciseTemplates
    .map((template) => exercises.find((exercise) => exercise.id === template.exerciseId))
    .filter((exercise): exercise is Exercise => Boolean(exercise));
  const findLatestExerciseLog = (exerciseId: string, exerciseName: string) =>
    recentHistory
      .map((workout) => ({
        workout,
        exercise: workout.exercises.find((entry) =>
          entry.exerciseId === exerciseId ||
          entry.exerciseName.toLowerCase() === exerciseName.toLowerCase()
        )
      }))
      .find((entry) => entry.exercise && entry.exercise.sets.some((set) => set.completed));

  const progressionInsight = focusExerciseTemplates
    .map((template) => {
      const exercise = exercises.find((item) => item.id === template.exerciseId);
      if (!exercise) return null;
      const lastLog = findLatestExerciseLog(template.exerciseId, exercise.name);
      if (!lastLog?.exercise) return null;
      const workSets = lastLog.exercise.sets.filter((set) => set.completed && set.type === 'normal');
      const plannedSets = Math.max(1, template.defaultSets);
      const targetReached = workSets.length >= plannedSets &&
        workSets.slice(-plannedSets).every((set) => set.reps >= template.defaultReps);
      const lastSet = workSets[workSets.length - 1];
      if (!targetReached || !lastSet || lastSet.rpe === undefined) return null;
      const suggestion = getAdaptiveSuggestion(lastSet, exercise.equipment, settings.weightUnit);
      if (!suggestion.isOverload) return null;
      return {
        exercise,
        workout: lastLog.workout,
        lastSet,
        suggestion,
        completedSetCount: workSets.length
      };
    })
    .find((candidate) => candidate !== null);

  const planCategories = focusExerciseDefinitions.map((exercise) => exercise.category);
  const isLegSession = /leg|lower body/i.test(focusRoutine?.title ?? '') ||
    planCategories.some((category) => ['Quads', 'Hamstrings', 'Glutes', 'Calves'].includes(category));
  const hasCalfWorkPlanned = planCategories.includes('Calves');
  const calfExercise = exercises.find((exercise) =>
    exercise.category === 'Calves' && /calf.*(raise|press)|(raise|press).*calf/i.test(exercise.name)
  ) || exercises.find((exercise) => exercise.category === 'Calves');
  const lastCalfWorkout = recentHistory.find((workout) =>
    workout.exercises.some((exercise) =>
      (exercise.category === 'Calves' || exercises.some((libraryExercise) =>
        libraryExercise.id === exercise.exerciseId && libraryExercise.category === 'Calves'
      )) &&
      exercise.sets.some((set) => set.completed && set.type === 'normal')
    )
  );
  const daysSinceCalves = lastCalfWorkout
    ? Math.max(0, Math.floor((now.getTime() - new Date(lastCalfWorkout.date).getTime()) / (24 * 60 * 60 * 1000)))
    : null;
  const calfInsightIsUseful = isLegSession && !hasCalfWorkPlanned && calfExercise &&
    (daysSinceCalves === null || daysSinceCalves >= 14);

  const milestoneWorkout = recentHistory.find((workout) =>
    workout.prsAchieved.length > 0 &&
    new Date(workout.date).getTime() >= now.getTime() - 90 * 24 * 60 * 60 * 1000
  );
  const milestone = milestoneWorkout?.prsAchieved[0];
  const cueExercise = focusExerciseDefinitions.find((exercise) => exercise.tips || exercise.instructions.length > 0);
  const trainingCue = cueExercise?.tips || cueExercise?.instructions[0];

  type HomeCoachInsight = {
    kind: 'target' | 'calves' | 'milestone' | 'cue' | 'start';
    label: string;
    title: string;
    context: string;
    kicker: string;
    suggestion: string;
    actionLabel: string;
    footnote: string;
    exerciseId?: string;
    exercise?: Exercise;
    weight?: number;
    reps?: number;
    cue?: string;
    routine?: RoutineTemplate;
  };

  const homeCoachInsights: HomeCoachInsight[] = [];
  if (progressionInsight) {
    const weightText = progressionInsight.suggestion.targetWeight.toLocaleString(undefined, { maximumFractionDigits: 2 });
    homeCoachInsights.push({
      kind: 'target',
      label: 'Lift progression',
      title: progressionInsight.exercise.name,
      context: `Last session · ${progressionInsight.completedSetCount} work sets · ${progressionInsight.lastSet.weight.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${settings.weightUnit} × ${progressionInsight.lastSet.reps} · RPE ${progressionInsight.lastSet.rpe}`,
      kicker: 'A GOOD NEXT STEP',
      suggestion: `Try ${weightText} ${settings.weightUnit} × ${progressionInsight.suggestion.targetReps}`,
      actionLabel: activeWorkout ? 'Apply target & resume' : 'Start with this target',
      footnote: 'Based on completed work sets · Adjust or skip any time',
      exerciseId: progressionInsight.exercise.id,
      weight: progressionInsight.suggestion.targetWeight,
      reps: progressionInsight.suggestion.targetReps,
      routine: focusRoutine
    });
  }
  if (calfInsightIsUseful && calfExercise) {
    homeCoachInsights.push({
      kind: 'calves',
      label: 'Muscle attention',
      title: 'Give calves a little attention',
      context: `${activeWorkout ? 'Workout in progress' : focusRoutine?.title ?? 'Leg session'} · ${daysSinceCalves === null ? 'No direct calf work logged yet' : `Last direct calf work · ${daysSinceCalves} days ago`}`,
      kicker: 'OPTIONAL ADD-ON',
      suggestion: '2 calf-raise sets',
      actionLabel: activeWorkout ? 'Add sets & resume' : 'Add to today’s session',
      footnote: 'Added for today only · Your saved routine stays the same',
      exercise: calfExercise,
      exerciseId: calfExercise.id,
      reps: 12,
      routine: focusRoutine
    });
  }
  if (milestone && milestoneWorkout) {
    homeCoachInsights.push({
      kind: 'milestone',
      label: 'Recent milestone',
      title: milestone.exerciseName,
      context: `${milestoneWorkout.title} · ${new Date(milestoneWorkout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      kicker: 'PERSONAL RECORD',
      suggestion: milestone.description || milestone.value,
      actionLabel: 'View progress',
      footnote: milestone.value,
      routine: focusRoutine
    });
  }
  if (cueExercise && trainingCue) {
    homeCoachInsights.push({
      kind: 'cue',
      label: 'Today’s training cue',
      title: cueExercise.name,
      context: focusRoutine?.title ?? activeWorkout?.title ?? 'Your next session',
      kicker: 'FORM FOCUS',
      suggestion: trainingCue,
      actionLabel: activeWorkout ? 'Save cue & resume' : 'Start with this cue',
      footnote: 'From your exercise guide · Keep your usual form and range of motion',
      cue: trainingCue,
      routine: focusRoutine
    });
  }
  if (homeCoachInsights.length === 0) {
    homeCoachInsights.push({
      kind: 'start',
      label: 'Build your training insights',
      title: 'Log a few working sets',
      context: 'FitLog uses your completed sets to find useful next steps.',
      kicker: 'START HERE',
      suggestion: 'Record your weight, reps and RPE to unlock personalized cues.',
      actionLabel: activeWorkout ? 'Resume workout' : 'Start session',
      footnote: 'Your Next session card stays right below',
      routine: focusRoutine
    });
  }

  const insightKey = `${localToday.toISOString().slice(0, 10)}:${activeWorkout?.id ?? focusRoutine?.id ?? 'no-session'}`;
  const insightIndex = insightCycle.key === insightKey ? insightCycle.index % homeCoachInsights.length : 0;
  const selectedInsight = homeCoachInsights[insightIndex];

  const handleAnotherInsight = () => {
    setInsightCycle({ key: insightKey, index: (insightIndex + 1) % homeCoachInsights.length });
  };

  const handleCoachAction = () => {
    if (!selectedInsight) return;
    if (selectedInsight.kind === 'milestone') {
      onNavigateToAnalytics();
      return;
    }
    if (selectedInsight.kind === 'target' && selectedInsight.exerciseId &&
        selectedInsight.weight !== undefined && selectedInsight.reps !== undefined) {
      if (activeWorkout) {
        onUpdateActiveWorkout((previous) => ({
          ...previous,
          exercises: previous.exercises.map((exercise) => {
            if (exercise.exerciseId !== selectedInsight.exerciseId) return exercise;
            let targetApplied = false;
            return {
              ...exercise,
              sets: exercise.sets.map((set) => {
                if (!targetApplied && !set.completed) {
                  targetApplied = true;
                  return { ...set, weight: selectedInsight.weight!, reps: selectedInsight.reps! };
                }
                return set;
              })
            };
          })
        }));
        onResumeActiveWorkout();
      } else if (selectedInsight.routine) {
        onStartRoutine(selectedInsight.routine, {
          kind: 'target',
          exerciseId: selectedInsight.exerciseId,
          weight: selectedInsight.weight,
          reps: selectedInsight.reps
        });
      }
      return;
    }
    if (selectedInsight.kind === 'calves' && selectedInsight.exercise) {
      if (activeWorkout) {
        onAddExerciseToActive(selectedInsight.exercise, 2, selectedInsight.reps ?? 12, 0);
        onResumeActiveWorkout();
      } else if (selectedInsight.routine) {
        onStartRoutine(selectedInsight.routine, {
          kind: 'add-exercise',
          exerciseId: selectedInsight.exercise.id,
          sets: 2,
          reps: selectedInsight.reps ?? 12
        });
      }
      return;
    }
    if (selectedInsight.kind === 'cue' && selectedInsight.cue) {
      if (activeWorkout) {
        onUpdateActiveWorkout((previous) => ({ ...previous, focusCue: selectedInsight.cue }));
        onResumeActiveWorkout();
      } else if (selectedInsight.routine) {
        onStartRoutine(selectedInsight.routine, { kind: 'cue', text: selectedInsight.cue });
      }
      return;
    }
    if (activeWorkout) onResumeActiveWorkout();
    else if (selectedInsight.routine) onStartRoutine(selectedInsight.routine);
    else onStartEmptyWorkout();
  };

  const saveWeight = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(weightInput);
    if (!Number.isFinite(value) || value <= 0) return;
    onAddBodyWeight(value, new Date().toISOString().slice(0, 10));
    setWeightInput('');
    setIsAddingWeight(false);
  };

  const sectionHeader = (title: string, action?: string, onClick?: () => void) => (
    <div className="flex items-center justify-between mt-5 mb-2 px-0.5">
      <h3 className="text-[11px] font-bold tracking-[0.12em] text-neutral-300 uppercase">{title}</h3>
      {action && onClick && <button onClick={onClick} className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400">{action}<ChevronRight className="w-3.5 h-3.5" /></button>}
    </div>
  );

  return (
    <div className="flex flex-col gap-2 pb-5 animate-in fade-in duration-200">
      <section className="relative isolate overflow-hidden rounded-[1.4rem] border border-emerald-700/35 bg-[radial-gradient(ellipse_at_95%_5%,rgba(120,169,141,0.13),transparent_32%),radial-gradient(ellipse_at_95%_5%,rgba(41,70,50,0.72),rgba(24,35,27,0.92)_42%,rgba(19,25,21,1)_78%)] px-5 py-5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 top-14 -z-10 h-44 w-44 rounded-full border border-emerald-300/15 shadow-[0_0_0_18px_rgba(120,169,141,0.045),0_0_0_37px_rgba(120,169,141,0.022)]" />
        <p className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.13em] uppercase text-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <h2 className="mt-3 text-[32px] leading-[1.08] font-extrabold tracking-tight text-white">
          Make today<br />count.
        </h2>
        <blockquote className="mt-4 max-w-[18rem] border-l-2 border-emerald-400 pl-3 text-xs leading-relaxed text-neutral-300">
          “Strength is built by the work you show up for.”
        </blockquote>
        <div className="mt-4 rounded-2xl border border-neutral-800/90 bg-neutral-950/70 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><CalendarDays className="h-4 w-4" aria-hidden="true" /></span>
              <span className="min-w-0"><span className="block text-[8px] font-bold uppercase tracking-[.12em] text-neutral-400">This week</span><strong className="mt-0.5 block text-xs font-bold text-white">{Math.min(completedThisWeek, weeklyTarget)} of {weeklyTarget} sessions</strong></span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-[9px] font-semibold text-neutral-400">
              <span>Goal</span>
              <div className="inline-flex items-center rounded-lg border border-emerald-800/60 bg-emerald-950/35 p-0.5">
                <button type="button" aria-label="Decrease weekly workout target" disabled={weeklyTarget <= 2}
                  onClick={() => onUpdateSettings({ weeklyWorkoutTarget: Math.max(2, weeklyTarget - 1) })}
                  className="grid h-6 w-6 place-items-center rounded-md text-sm leading-none text-neutral-400 transition hover:bg-neutral-800 hover:text-white disabled:opacity-30">−</button>
                <span className="min-w-[3.2rem] px-1 text-center text-[10px] font-bold tabular-nums text-emerald-200">
                  {weeklyTarget}<span className="ml-0.5 text-[8px] font-semibold text-neutral-400">/wk</span>
                </span>
                <button type="button" aria-label="Increase weekly workout target" disabled={weeklyTarget >= 7}
                  onClick={() => onUpdateSettings({ weeklyWorkoutTarget: Math.min(7, weeklyTarget + 1) })}
                  className="grid h-6 w-6 place-items-center rounded-md text-sm leading-none text-neutral-400 transition hover:bg-neutral-800 hover:text-white disabled:opacity-30">+</button>
              </div>
            </div>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-800" role="progressbar" aria-label="Weekly workout target progress" aria-valuenow={Math.min(completedThisWeek, weeklyTarget)} aria-valuemin={0} aria-valuemax={weeklyTarget}>
            <span className="block h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all" style={{ width: `${weeklyProgress}%` }} />
          </div>
        </div>

        <section className="mt-3 rounded-2xl border border-emerald-800/40 bg-neutral-950/85 p-3.5 shadow-inner" aria-label="Mesocycle preview">
          {activeTrainingBlock ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-emerald-300">Mesocycle preview</span>
                  <h3 className="mt-1 truncate text-[15px] font-extrabold leading-tight text-white">{activeTrainingBlock.title}</h3>
                </div>
                <span className={'shrink-0 rounded-full border px-2 py-1 text-[8px] font-extrabold uppercase tracking-wider ' + (activeTrainingBlock.status === 'paused' ? 'border-amber-700/50 bg-amber-950/40 text-amber-300' : 'border-emerald-800/60 bg-emerald-950/45 text-emerald-200')}>{activeTrainingBlock.status === 'paused' ? 'Paused' : 'Active'}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-neutral-300">Week {blockWeek} of {activeTrainingBlock.durationWeeks} <span className="text-neutral-600">·</span> <strong className="text-white">{blockWeekPhase}</strong></span>
                <span className="text-[9px] font-semibold text-neutral-400">{Math.round((blockWeekSessions.length / Math.max(1, resolvedBlockRoutines.length)) * 100)}% this week</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-800" role="progressbar" aria-label="Mesocycle week progress" aria-valuenow={blockWeekPercent} aria-valuemin={0} aria-valuemax={100}>
                <span className="block h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300" style={{ width: blockWeekPercent + '%' }} />
              </div>
              <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: 'repeat(' + activeTrainingBlock.durationWeeks + ', minmax(0, 1fr))' }}>
                {Array.from({ length: activeTrainingBlock.durationWeeks }, (_, index) => {
                  const week = index + 1;
                  return <span key={week} className={'rounded-md px-0.5 py-1 text-center text-[8px] font-bold ' + (week === blockWeek ? 'bg-emerald-500 text-neutral-950' : week < blockWeek ? 'bg-emerald-950/70 text-emerald-300' : 'bg-neutral-900 text-neutral-500')}>W{week}</span>;
                })}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-200">This week</span>
                <span className="text-[9px] text-neutral-400">{blockWeekSessions.length} of {resolvedBlockRoutines.length || activeTrainingBlock.routineIds.length} sessions</span>
              </div>
              {resolvedBlockRoutines.length > 0 && (
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {resolvedBlockRoutines.slice(0, 3).map((routine) => {
                    const completed = blockWeekSessions.some((workout) =>
                      workout.routineId ? workout.routineId === routine.id : workout.title.toLowerCase() === routine.title.toLowerCase()
                    );
                    const isNext = routine.id === blockNextRoutine?.id && !completed;
                    return (
                      <div key={routine.id} className={'min-w-0 rounded-lg border px-2 py-1.5 ' + (isNext ? 'border-emerald-700/70 bg-emerald-950/35' : completed ? 'border-emerald-900/60 bg-emerald-950/20' : 'border-neutral-800 bg-neutral-900/55')}>
                        <p className="truncate text-[8px] font-bold text-neutral-200">{routine.title}</p>
                        <p className={'mt-0.5 truncate text-[8px] ' + (completed ? 'text-emerald-300' : isNext ? 'text-emerald-200' : 'text-neutral-500')}>{completed ? 'Completed' : isNext ? 'Next in rotation' : 'In this week'}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-emerald-300">Mesocycle preview</span>
                <h3 className="mt-1 text-[13px] font-extrabold text-white">No active training block</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">Start an optional block to see your week and rotation here.</p>
              </div>
              <button type="button" onClick={onOpenTrainingBlocks} className="shrink-0 rounded-xl border border-emerald-700/60 bg-emerald-950/45 px-3 py-2 text-[10px] font-bold text-emerald-200">Set up</button>
            </div>
          )}
          {workoutOfDay && (
            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900/80 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[8px] font-extrabold uppercase tracking-[.1em] text-emerald-300">Workout of the day</span>
                  <h4 className="mt-1 truncate text-[13px] font-extrabold text-white">{workoutOfDay.title}</h4>
                  <p className="mt-1 text-[9px] text-neutral-400">{activeTrainingBlock?.splitName ?? selectedSplit} · about {workoutOfDay.estimatedMinutes} min</p>
                </div>
                <Dumbbell className="mt-1 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onViewRoutine(workoutOfDay)} className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-neutral-700 bg-neutral-950 px-2 text-[10px] font-bold text-neutral-200 transition hover:border-emerald-700/60">
                  View workout <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onStartRoutine(workoutOfDay)} className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-emerald-500 px-2 text-[10px] font-extrabold text-neutral-950 transition hover:bg-emerald-400">
                  Start workout <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </section>
      </section>

      {activeWorkout ? (
        <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-neutral-900 p-3.5">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-[9px] font-bold tracking-[.1em] uppercase text-emerald-300">Workout in progress</span></div>
          <h3 className="mt-2 text-lg font-bold text-white">{activeWorkout.title}</h3>
          <div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-neutral-300">{activeWorkout.exercises.length} exercises logged</span><button onClick={onResumeActiveWorkout} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-neutral-950">Resume workout</button></div>
        </section>
      ) : !workoutOfDay ? (
        <button onClick={onStartEmptyWorkout} className="rounded-2xl border border-emerald-800/50 bg-emerald-950/30 p-4 text-left"><span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">Ready when you are</span><span className="mt-1 block text-lg font-bold text-white">Start a workout</span></button>
      ) : null}

      {sectionHeader('Your training week', 'Progress', onNavigateToAnalytics)}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5">
        <div className="flex items-baseline justify-between"><div className="text-[15px] font-extrabold text-white">{thisWeek.length}<span className="ml-1.5 text-[10px] font-medium text-neutral-400">of 5 sessions</span></div><span className="text-[10px] text-neutral-400">{Math.min(100, Math.round((thisWeek.length / 5) * 100))}% of weekly goal</span></div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {dayCells.map((day) => <div key={day.date.toISOString()} className={`flex flex-col items-center gap-1.5 text-[8px] ${day.isToday ? 'font-bold text-neutral-200' : 'text-neutral-500'}`}><span className={`grid h-7 w-7 place-items-center rounded-full border ${day.hasWorkout ? 'border-emerald-800 bg-emerald-950/70 text-emerald-300' : day.isToday ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300' : 'border-neutral-700 bg-neutral-800/70 text-neutral-600'}`}>{day.hasWorkout ? <Check className="h-3.5 w-3.5" /> : '·'}</span>{day.label}</div>)}
        </div>
        <div className="mt-3 grid grid-cols-2 border-t border-neutral-800 pt-2.5">
          <div><strong className="block text-xs font-bold text-white">{weeklyVolume.toLocaleString()} {settings.weightUnit}</strong><span className="text-[9px] text-neutral-400">Volume this week</span></div>
          <div className="border-l border-neutral-800 pl-3"><strong className="block text-xs font-bold text-white">{Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m</strong><span className="text-[9px] text-neutral-400">Time under the bar</span></div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 mt-0.5">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3"><span className="text-[9px] font-semibold tracking-wide text-fitlog-gold-soft uppercase">Personal records</span><strong className="mt-1 block text-base font-extrabold text-fitlog-gold">{weeklyPRs}</strong><span className="text-[9px] text-neutral-400">in the last 30 days</span></div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3"><span className="text-[9px] font-semibold tracking-wide text-neutral-400 uppercase">Sessions logged</span><strong className="mt-1 block text-base font-extrabold text-white">{thisWeek.length}</strong><span className="text-[9px] text-neutral-400">this training week</span></div>
      </div>

      {sectionHeader('Bodyweight', 'History', onNavigateToAnalytics)}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5">
        {latestWeight ? <>
          <div className="flex items-start justify-between"><div><span className="text-[9px] font-bold tracking-[.1em] uppercase text-neutral-400">Latest weigh-in</span><strong className="mt-1 block text-lg font-extrabold text-white">{latestWeight.weight.toFixed(1)} <span className="text-[10px] font-semibold text-neutral-400">{settings.weightUnit}</span></strong><span className="text-[9px] text-neutral-400">{new Date(latestWeight.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div><div className={`text-right text-[10px] font-bold ${weightChange <= 0 ? 'text-emerald-400' : 'text-neutral-300'}`}>{weightChange === 0 ? 'Trend building' : <>{weightChange < 0 ? <TrendingDown className="mr-1 inline h-3.5 w-3.5" /> : <TrendingUp className="mr-1 inline h-3.5 w-3.5" />}{Math.abs(weightChange).toFixed(1)} {settings.weightUnit}<span className="mt-1 block text-[8px] font-medium text-neutral-400">since earliest log</span></>}</div></div>
          {chartData.length > 0 && <TrendLineChart points={chartData} unit={settings.weightUnit} label="Bodyweight" className="mt-3" />}
        </> : <div className="flex items-center gap-3 py-1"><span className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-800 text-neutral-300"><Scale className="h-4 w-4" /></span><div><strong className="block text-xs text-white">Start tracking bodyweight</strong><span className="text-[9px] text-neutral-400">Log consistently to see your trend.</span></div></div>}
        {isAddingWeight ? <form onSubmit={saveWeight} className="mt-3 flex gap-2"><input autoFocus type="text" inputMode="decimal" value={weightInput} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setWeightInput(event.target.value)} placeholder={`Weight (${settings.weightUnit})`} className="numeric-entry min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" /><button type="submit" className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-neutral-950">Save</button><button type="button" onClick={() => { setIsAddingWeight(false); setWeightInput(''); }} className="rounded-xl border border-neutral-700 px-3 py-2 text-xs text-neutral-300">Cancel</button></form> : <button onClick={() => setIsAddingWeight(true)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-800/80 py-2.5 text-xs font-bold text-emerald-300 hover:bg-neutral-800"><Plus className="h-3.5 w-3.5" />Log weigh-in</button>}
      </section>

      {sectionHeader('Recent workouts', 'Full log', onNavigateToHistory)}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 px-3.5">
        {recentHistory.slice(0, 3).map((workout) => (
          <button key={workout.id} onClick={onNavigateToHistory} className="flex w-full items-center justify-between gap-2 border-b border-neutral-800 py-3 text-left last:border-b-0">
            <span className="flex min-w-0 items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-neutral-800 text-emerald-300"><Dumbbell className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate text-[11px] font-bold text-white">{workout.title}</strong><span className="mt-0.5 block text-[10px] text-neutral-400">{new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {workout.durationMinutes} min · {workout.totalVolume.toLocaleString()} {settings.weightUnit}</span></span></span>
            {workout.prsAchieved.length ? <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-fitlog-gold"><Trophy className="h-3 w-3" />+{workout.prsAchieved.length}</span> : <ChevronRight className="h-4 w-4 shrink-0 text-neutral-500" />}
          </button>
        ))}
        {!recentHistory.length && <p className="py-4 text-center text-xs text-neutral-400">Your completed workouts will appear here.</p>}
      </section>

      {sectionHeader('Training tools')}
      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={onOpenPlateCalc} className="flex items-center gap-2.5 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3 text-left"><Dumbbell className="h-4 w-4 text-emerald-300" /><span><strong className="block text-[10px] text-white">Plate calculator</strong><small className="text-[8px] text-neutral-400">Load the bar evenly</small></span></button>
        <button onClick={onOpenOneRMCalc} className="flex items-center gap-2.5 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3 text-left"><Calculator className="h-4 w-4 text-emerald-300" /><span><strong className="block text-[10px] text-white">1RM estimator</strong><small className="text-[8px] text-neutral-400">Estimate your max</small></span></button>
      </div>
    </div>
  );
};


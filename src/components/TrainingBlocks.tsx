import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Flag,
  Plus,
  TrendingUp
} from 'lucide-react';
import { CompletedWorkout, RoutineTemplate, TrainingBlock, UserSettings } from '../types/fitness';
import { calculate1RM } from '../utils/fitnessCalc';

interface TrainingBlocksProps {
  routines: RoutineTemplate[];
  history: CompletedWorkout[];
  trainingBlocks: TrainingBlock[];
  settings: UserSettings;
  currentSplit: string;
  onUpdateTrainingBlocks: (blocks: TrainingBlock[]) => void;
  onStartRoutine: (routine: RoutineTemplate) => void;
  onBack: () => void;
}

const splitNameForRoutine = (routine: RoutineTemplate) => {
  if (routine.title.toLowerCase().includes('arnold split')) return 'Arnold Split';
  if (routine.isCustom || routine.category === 'Custom') return 'Custom';
  return routine.category;
};

const localDateString = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const getBlockSessions = (block: TrainingBlock, history: CompletedWorkout[]) => {
  const routineIds = new Set(block.routineIds);
  const routineTitles = new Set(block.routineTitles.map((title) => title.trim().toLowerCase()));
  const start = new Date(block.startDate + 'T00:00:00').getTime();
  return history
    .filter((workout) => {
      const date = new Date(workout.date).getTime();
      if (date < start) return false;
      if (workout.routineId) return routineIds.has(workout.routineId);
      return routineTitles.has(workout.title.trim().toLowerCase());
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const getWeekIndex = (block: TrainingBlock) => {
  const start = new Date(block.startDate + 'T00:00:00').getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.min(block.durationWeeks, Math.floor((today.getTime() - start) / 604800000) + 1));
};

const formatNumber = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);

export const TrainingBlocksView: React.FC<TrainingBlocksProps> = ({
  routines,
  history,
  trainingBlocks,
  settings,
  currentSplit,
  onUpdateTrainingBlocks,
  onStartRoutine,
  onBack
}) => {
  const activeBlock = trainingBlocks.find((block) => block.status === 'active');
  const splitOptions = Array.from(new Set(routines.map(splitNameForRoutine)));
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('Hypertrophy block');
  const [goal, setGoal] = useState<TrainingBlock['goal']>('Hypertrophy');
  const [splitName, setSplitName] = useState(splitOptions.includes(currentSplit) ? currentSplit : splitOptions[0] || '');
  const [durationWeeks, setDurationWeeks] = useState(6);
  const [progressionRule, setProgressionRule] = useState<TrainingBlock['progressionRule']>('double-progression');
  const [easierWeek, setEasierWeek] = useState('');
  const [previewWeek, setPreviewWeek] = useState<number | null>(null);

  const displayedSplit = activeBlock?.splitName ?? splitName;
  const selectedRoutines = routines
    .filter((routine) => splitNameForRoutine(routine) === displayedSplit)
    .sort((a, b) => {
      const order = (value: string) =>
        value.toLowerCase().includes('chest & back') ? 0 :
        value.toLowerCase().includes('legs') ? 1 :
        value.toLowerCase().includes('shoulders & arms') ? 2 : 3;
      return order(a.title) - order(b.title);
    });

  const activeSessions = activeBlock ? getBlockSessions(activeBlock, history) : [];
  const currentWeek = activeBlock ? getWeekIndex(activeBlock) : 1;
  const shownWeek = Math.min(activeBlock?.durationWeeks || 1, Math.max(1, previewWeek || currentWeek));
  const activeWeekStart = activeBlock
    ? new Date(new Date(activeBlock.startDate + 'T00:00:00').getTime() + (shownWeek - 1) * 604800000)
    : new Date();
  const activeWeekEnd = new Date(activeWeekStart.getTime() + 604800000);
  const sessionsThisWeek = activeSessions.filter((workout) => {
    const date = new Date(workout.date);
    return date >= activeWeekStart && date < activeWeekEnd;
  }).length;
  const totalSets = activeSessions.reduce((sum, workout) => sum + workout.totalSets, 0);
  const totalVolume = activeSessions.reduce((sum, workout) => sum + workout.totalVolume, 0);
  const prCount = activeSessions.reduce((sum, workout) => sum + workout.prsAchieved.length, 0);
  const muscleSetTotals = new Map<string, number>();
  const liftTrends = new Map<string, { name: string; first: number; latest: number; sessions: number }>();
  activeSessions.forEach((workout) => workout.exercises.forEach((exercise) => {
    const sets = exercise.sets.filter((set) => set.completed);
    if (!sets.length) return;
    muscleSetTotals.set(exercise.category, (muscleSetTotals.get(exercise.category) || 0) + sets.length);
    const best = sets.reduce((top, set) => Math.max(top, calculate1RM(set.weight, set.reps)), 0);
    const key = exercise.exerciseId || exercise.exerciseName.trim().toLowerCase();
    const trend = liftTrends.get(key);
    if (trend) {
      trend.latest = best;
      trend.sessions += 1;
    } else {
      liftTrends.set(key, { name: exercise.exerciseName, first: best, latest: best, sessions: 1 });
    }
  }));
  const topMuscles = Array.from(muscleSetTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const mostTrackedLift = Array.from(liftTrends.values()).filter((trend) => trend.sessions > 1).sort((a, b) => b.sessions - a.sessions)[0];
  const phaseName = activeBlock && shownWeek === activeBlock.durationWeeks
    ? 'Review'
    : activeBlock && activeBlock.easierWeek === shownWeek
      ? 'Optional easier week'
      : shownWeek === 1 ? 'Starting week' : 'Build week';
  const ruleDescription = activeBlock?.progressionRule === 'double-progression'
    ? 'Use your target rep range. When all working sets reach its top at your chosen effort, add a small amount of load next time.'
    : 'Keep the planned targets steady. Review your logged performance before changing the load or reps.';
  const nextRoutine = activeBlock && selectedRoutines.length
    ? selectedRoutines[activeSessions.length % selectedRoutines.length]
    : null;

  const startBlock = (event: React.FormEvent) => {
    event.preventDefault();
    if (activeBlock || !title.trim() || !selectedRoutines.length) return;
    const block: TrainingBlock = {
      id: 'training-block-' + Date.now(),
      title: title.trim(),
      goal,
      splitName,
      routineIds: selectedRoutines.map((routine) => routine.id),
      routineTitles: selectedRoutines.map((routine) => routine.title),
      durationWeeks,
      startDate: localDateString(),
      progressionRule,
      easierWeek: easierWeek ? Number(easierWeek) : null,
      status: 'active'
    };
    onUpdateTrainingBlocks([...trainingBlocks, block]);
    setShowForm(false);
    setPreviewWeek(null);
  };

  const finishBlock = () => {
    if (!activeBlock) return;
    onUpdateTrainingBlocks(trainingBlocks.map((block) =>
      block.id === activeBlock.id
        ? { ...block, status: 'completed', completedAt: new Date().toISOString() }
        : block
    ));
    setPreviewWeek(null);
  };

  const completedBlocks = trainingBlocks.filter((block) => block.status === 'completed').slice().reverse();

  return (
    <div className="flex flex-col gap-4 pb-12 animate-in fade-in duration-200">
      <header className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to routines"
          className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 transition hover:border-emerald-700/70 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-white">Training blocks</h2>
            <span className="rounded-full border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-400">Optional</span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">A flexible plan layered over your existing routines.</p>
        </div>
      </header>

      {activeBlock ? (
        <>
          <section className="relative overflow-hidden rounded-3xl border border-emerald-800/50 bg-gradient-to-br from-emerald-950/55 via-neutral-900 to-neutral-900 shadow-xl shadow-black/20">
            <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border border-emerald-400/10" />
            <div className="pointer-events-none absolute -right-5 -top-9 h-32 w-32 rounded-full border border-emerald-400/10" />
            <div className="relative p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-700/40 bg-emerald-950/70 text-emerald-300 shadow-lg shadow-emerald-950/30">
                    <Flag className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-300">Current training block</p>
                    <h3 className="mt-1 truncate text-lg font-extrabold text-white">{activeBlock.title}</h3>
                    <p className="mt-1 text-[11px] text-neutral-300">{activeBlock.splitName} <span className="px-1 text-neutral-600">/</span> {activeBlock.goal}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-700/60 bg-emerald-950/70 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-300">Active</span>
              </div>

              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{currentWeek === shownWeek ? 'You are in' : 'Previewing'}</p>
                  <p className="mt-0.5 text-xl font-extrabold text-white">Week {shownWeek}<span className="ml-2 text-sm font-semibold text-emerald-300">{phaseName}</span></p>
                </div>
                <p className="pb-1 text-[11px] font-semibold tabular-nums text-neutral-400">{shownWeek} <span className="text-neutral-600">/</span> {activeBlock.durationWeeks}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-950/80">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-200 transition-[width]" style={{ width: (shownWeek / activeBlock.durationWeeks * 100) + '%' }} />
              </div>
              <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(' + activeBlock.durationWeeks + ', minmax(0, 1fr))' }}>
                {Array.from({ length: activeBlock.durationWeeks }, (_, index) => {
                  const week = index + 1;
                  const label = week === activeBlock.durationWeeks ? 'Review' : activeBlock.easierWeek === week ? 'Easy' : week === 1 ? 'Start' : 'Build';
                  return (
                    <button
                      key={week}
                      type="button"
                      aria-pressed={shownWeek === week}
                      aria-label={'Preview week ' + week + ', ' + label}
                      onClick={() => setPreviewWeek(week)}
                      className={'min-h-11 rounded-xl border px-0.5 py-1.5 text-center transition ' + (shownWeek === week
                        ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100 shadow-inner shadow-emerald-300/5'
                        : week <= currentWeek ? 'border-neutral-800 bg-neutral-950/55 text-neutral-300' : 'border-neutral-800/70 bg-neutral-950/20 text-neutral-500')}
                    >
                      <span className="block text-[10px] font-extrabold">W{week}</span>
                      <span className="block truncate text-[8px]">{label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-neutral-800/90 bg-neutral-950/60 p-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-950/80 text-emerald-300">
                  {phaseName === 'Review' ? <CheckCircle2 className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{phaseName === 'Optional easier week' ? 'Recovery is your call' : phaseName}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                    {phaseName === 'Starting week'
                      ? 'Set a comfortable baseline and confirm your routine and targets feel right.'
                      : phaseName === 'Optional easier week'
                        ? 'This week is optional. Adjust workload only if you choose; FitLog will not change your logged weights.'
                        : phaseName === 'Review'
                          ? 'Look back at your sessions and lift trends, then finish the block or plan another.'
                          : 'Build gradually using your chosen progression rule. Your workout stays in your control.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-4">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-300">Block check-in</p>
                <h3 className="mt-1 text-sm font-extrabold text-white">Your training so far</h3>
              </div>
              <span className="text-[10px] text-neutral-500">{activeSessions.length} sessions</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-500">This week</p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-white">{sessionsThisWeek}</p>
                <p className="text-[9px] text-neutral-500">sessions</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-500">Work sets</p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-white">{formatNumber(totalSets)}</p>
                <p className="text-[9px] text-neutral-500">completed</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-500">PRs</p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-emerald-300">{prCount}</p>
                <p className="text-[9px] text-neutral-500">in this block</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-950/45 px-3 py-2 text-[10px]">
              <span className="text-neutral-500">Total training volume</span>
              <span className="font-bold text-neutral-200">{formatNumber(totalVolume)} {settings.weightUnit}</span>
            </div>

            {topMuscles.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Muscle group volume</p>
                  <span className="text-[9px] text-neutral-600">work sets</span>
                </div>
                <div className="space-y-2.5">
                  {topMuscles.map(([muscle, sets]) => {
                    const maxSets = Math.max(...topMuscles.map(([, count]) => count), 1);
                    return (
                      <div key={muscle}>
                        <div className="mb-1 flex justify-between text-[10px]"><span className="text-neutral-300">{muscle}</span><span className="tabular-nums text-neutral-500">{sets}</span></div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800"><div className="h-full rounded-full bg-emerald-500/80" style={{ width: (sets / maxSets * 100) + '%' }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {mostTrackedLift && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-950/70 text-emerald-300"><TrendingUp className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold uppercase tracking-wider text-neutral-500">Lift trend · estimated 1RM</p>
                  <p className="mt-1 truncate text-xs font-bold text-white">{mostTrackedLift.name}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-neutral-500">First → latest</p>
                  <p className={'text-xs font-extrabold tabular-nums ' + (mostTrackedLift.latest >= mostTrackedLift.first ? 'text-emerald-300' : 'text-neutral-300')}>
                    {mostTrackedLift.first.toFixed(1)} → {mostTrackedLift.latest.toFixed(1)} {settings.weightUnit}
                  </p>
                </div>
              </div>
            )}
          </section>

          {selectedRoutines.length > 0 && (
            <section className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-300">Your selected split</p>
                  <h3 className="mt-1 text-sm font-extrabold text-white">Next session rotation</h3>
                </div>
                <Dumbbell className="h-5 w-5 text-neutral-600" />
              </div>
              <div className="space-y-2">
                {selectedRoutines.map((routine, index) => {
                  const isNext = routine.id === nextRoutine?.id;
                  return (
                    <div key={routine.id} className={'flex items-center gap-3 rounded-2xl border p-3 transition ' + (isNext ? 'border-emerald-700/60 bg-emerald-950/25' : 'border-neutral-800 bg-neutral-950/45')}>
                      <span className={'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold ' + (isNext ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-900 text-neutral-400')}>{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-white">{routine.title}</p>
                        <p className="mt-0.5 text-[9px] text-neutral-500">{routine.exercises.length} exercises · about {routine.estimatedMinutes} min</p>
                      </div>
                      {isNext && <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-emerald-300">Next</span>}
                    </div>
                  );
                })}
              </div>
              {nextRoutine && (
                <button
                  type="button"
                  onClick={() => onStartRoutine(nextRoutine)}
                  className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-extrabold text-neutral-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400"
                >
                  <Dumbbell className="h-4 w-4" /> Start next session <span className="max-w-[45%] truncate font-semibold opacity-75">· {nextRoutine.title}</span>
                </button>
              )}
            </section>
          )}

          <button
            type="button"
            onClick={finishBlock}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-3 text-xs font-bold text-neutral-400 transition hover:border-emerald-700/60 hover:text-white"
          >
            Finish block and save review
          </button>
        </>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-3xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/45 via-neutral-900 to-neutral-900 p-4 shadow-xl shadow-black/20">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border border-emerald-400/10" />
            <div className="relative flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-800/60 bg-emerald-950/75 text-emerald-300"><CalendarDays className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-300">Optional training plan</p>
                <h3 className="mt-1 text-base font-extrabold text-white">Give your next split a direction</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-300">Choose a goal and progression style. Your routine cards, exercises and everyday logging stay as they are.</p>
              </div>
            </div>
            {!showForm && (
              <button
                type="button"
                onClick={() => {
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={routines.length === 0}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-extrabold text-neutral-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Build a training block
              </button>
            )}
          </section>

          {showForm && (
            <form onSubmit={startBlock} className="space-y-3.5">
              <section className="rounded-3xl border border-neutral-800 bg-neutral-900/85 p-4 shadow-xl shadow-black/15">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500 text-xs font-extrabold text-neutral-950">1</span>
                  <div><h3 className="text-sm font-extrabold text-white">Name your block</h3><p className="text-[10px] text-neutral-500">You can change this label later.</p></div>
                </div>
                <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={48} aria-label="Training block name" className="min-h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 text-sm font-semibold text-white outline-none transition placeholder:text-neutral-600 focus:border-emerald-500" />
              </section>

              <section className="rounded-3xl border border-neutral-800 bg-neutral-900/85 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500 text-xs font-extrabold text-neutral-950">2</span>
                  <div><h3 className="text-sm font-extrabold text-white">Choose a focus</h3><p className="text-[10px] text-neutral-500">What do you want this block to emphasize?</p></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'Hypertrophy', label: 'Muscle', detail: 'Build size', Icon: Dumbbell },
                    { value: 'Strength', label: 'Strength', detail: 'Lift heavier', Icon: Flag },
                    { value: 'General fitness', label: 'Balanced', detail: 'Build consistency', Icon: TrendingUp }
                  ] as const).map(({ value, label, detail, Icon }) => {
                    const selected = goal === value;
                    return (
                      <button key={value} type="button" aria-pressed={selected} onClick={() => setGoal(value)} className={'min-h-24 rounded-2xl border p-2.5 text-left transition ' + (selected ? 'border-emerald-500/70 bg-emerald-500/10 shadow-inner shadow-emerald-500/5' : 'border-neutral-800 bg-neutral-950/45 hover:border-neutral-700')}>
                        <Icon className={'h-4 w-4 ' + (selected ? 'text-emerald-300' : 'text-neutral-500')} />
                        <span className={'mt-2 block text-[11px] font-bold ' + (selected ? 'text-white' : 'text-neutral-300')}>{label}</span>
                        <span className="mt-0.5 block text-[9px] leading-tight text-neutral-500">{detail}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-neutral-800 bg-neutral-900/85 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500 text-xs font-extrabold text-neutral-950">3</span>
                  <div><h3 className="text-sm font-extrabold text-white">Pick your split</h3><p className="text-[10px] text-neutral-500">Choose which routines this block follows.</p></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {splitOptions.map((option) => {
                    const count = routines.filter((routine) => splitNameForRoutine(routine) === option).length;
                    const selected = splitName === option;
                    return (
                      <button key={option} type="button" aria-pressed={selected} onClick={() => setSplitName(option)} className={'flex min-h-[68px] items-center gap-2.5 rounded-2xl border p-3 text-left transition ' + (selected ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-neutral-800 bg-neutral-950/45 hover:border-neutral-700')}>
                        <span className={'grid h-8 w-8 shrink-0 place-items-center rounded-xl ' + (selected ? 'bg-emerald-950 text-emerald-300' : 'bg-neutral-900 text-neutral-500')}><Layers className="h-4 w-4" /></span>
                        <span className="min-w-0"><span className={'block truncate text-[11px] font-bold ' + (selected ? 'text-white' : 'text-neutral-300')}>{option}</span><span className="mt-0.5 block text-[9px] text-neutral-500">{count} routines</span></span>
                      </button>
                    );
                  })}
                </div>
                {selectedRoutines.length > 0 && (
                  <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-950/55 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">Included in {splitName}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedRoutines.map((routine, index) => (
                        <span key={routine.id} className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-[9px] font-semibold text-neutral-300">{index + 1}. {routine.title}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-neutral-800 bg-neutral-900/85 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500 text-xs font-extrabold text-neutral-950">4</span>
                  <div><h3 className="text-sm font-extrabold text-white">Set the timeline</h3><p className="text-[10px] text-neutral-500">Choose a length that fits your schedule.</p></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[4, 6, 8].map((weeks) => {
                    const selected = durationWeeks === weeks;
                    return (
                      <button key={weeks} type="button" aria-pressed={selected} onClick={() => { setDurationWeeks(weeks); if (easierWeek && Number(easierWeek) >= weeks) setEasierWeek(''); }} className={'min-h-14 rounded-2xl border text-center transition ' + (selected ? 'border-emerald-500/70 bg-emerald-500/10 text-white' : 'border-neutral-800 bg-neutral-950/45 text-neutral-400 hover:border-neutral-700')}>
                        <span className="text-base font-extrabold">{weeks}</span><span className="ml-1 text-[10px] font-semibold">weeks</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/55 px-3 py-2.5">
                  <span className="min-w-0"><span className="block text-[10px] font-bold text-neutral-200">Optional easier week</span><span className="block text-[9px] text-neutral-500">Only if it suits your training.</span></span>
                  <select value={easierWeek} onChange={(event) => setEasierWeek(event.target.value)} className="min-h-10 max-w-[130px] rounded-xl border border-neutral-800 bg-neutral-900 px-2.5 text-xs font-semibold text-neutral-200 outline-none focus:border-emerald-500" aria-label="Optional easier week">
                    <option value="">None</option>
                    {Array.from({ length: Math.max(0, durationWeeks - 3) }, (_, index) => index + 3).map((week) => <option key={week} value={week}>Week {week}</option>)}
                  </select>
                </div>
              </section>

              <section className="rounded-3xl border border-neutral-800 bg-neutral-900/85 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500 text-xs font-extrabold text-neutral-950">5</span>
                  <div><h3 className="text-sm font-extrabold text-white">Choose progression</h3><p className="text-[10px] text-neutral-500">FitLog will track this choice, not change your weights.</p></div>
                </div>
                <div className="space-y-2">
                  {([
                    { value: 'double-progression', title: 'Reps, then load', detail: 'Build reps within your target range, then increase weight.', Icon: TrendingUp },
                    { value: 'repeat-and-review', title: 'Repeat and review', detail: 'Keep the current targets and decide what to change each week.', Icon: CheckCircle2 }
                  ] as const).map(({ value, title: optionTitle, detail, Icon }) => {
                    const selected = progressionRule === value;
                    return (
                      <button key={value} type="button" aria-pressed={selected} onClick={() => setProgressionRule(value)} className={'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ' + (selected ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-neutral-800 bg-neutral-950/45 hover:border-neutral-700')}>
                        <span className={'grid h-9 w-9 shrink-0 place-items-center rounded-xl ' + (selected ? 'bg-emerald-950 text-emerald-300' : 'bg-neutral-900 text-neutral-500')}><Icon className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1"><span className={'block text-xs font-bold ' + (selected ? 'text-white' : 'text-neutral-300')}>{optionTitle}</span><span className="mt-1 block text-[10px] leading-relaxed text-neutral-500">{detail}</span></span>
                        {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />}
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="min-h-12 flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 text-xs font-bold text-neutral-300 transition hover:text-white">Cancel</button>
                <button type="submit" disabled={!title.trim() || !selectedRoutines.length} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-extrabold text-neutral-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Start block</button>
              </div>
            </form>
          )}
        </>
      )}

      {completedBlocks.length > 0 && (
        <details className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/70">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
            <span><span className="block text-sm font-bold text-white">Previous blocks</span><span className="mt-0.5 block text-[10px] text-neutral-500">Saved summaries from completed cycles</span></span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-neutral-950 text-neutral-400">{completedBlocks.length}</span>
          </summary>
          <div className="space-y-2 border-t border-neutral-800 p-3">
            {completedBlocks.map((block) => {
              const sessions = getBlockSessions(block, history);
              const sets = sessions.reduce((sum, workout) => sum + workout.totalSets, 0);
              const prs = sessions.reduce((sum, workout) => sum + workout.prsAchieved.length, 0);
              const volume = sessions.reduce((sum, workout) => sum + workout.totalVolume, 0);
              return (
                <div key={block.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/55 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-xs font-bold text-white">{block.title}</p><p className="mt-1 text-[10px] text-neutral-400">{block.splitName} · {block.durationWeeks} weeks</p></div>
                    <span className="shrink-0 rounded-full border border-neutral-800 bg-neutral-900 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-emerald-300">Review saved</span>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    {[
                      ['Sessions', sessions.length],
                      ['Work sets', sets],
                      ['PRs', prs],
                      ['Volume', formatNumber(volume)]
                    ].map(([label, value]) => <div key={String(label)}><p className="text-[8px] font-bold uppercase tracking-wide text-neutral-600">{label}</p><p className="mt-1 truncate text-[10px] font-bold text-neutral-300">{value}</p></div>)}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
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
          className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold tracking-tight text-white">Training blocks</h2>
          <p className="mt-1 text-xs text-neutral-400">Plan a focused cycle around one of your existing splits.</p>
        </div>
      </header>

      {activeBlock ? (
        <section className="rounded-3xl border border-emerald-800/50 bg-gradient-to-br from-emerald-950/35 via-neutral-900 to-neutral-900 p-4 shadow-xl shadow-black/20">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">Current mesocycle</p>
              <h3 className="mt-1 text-lg font-extrabold text-white">{activeBlock.title}</h3>
              <p className="mt-1 text-xs text-neutral-300">{activeBlock.splitName} <span className="text-neutral-500">·</span> {activeBlock.durationWeeks} weeks</p>
            </div>
            <span className="shrink-0 rounded-full border border-emerald-700/60 bg-emerald-950/60 px-2.5 py-1 text-[9px] font-bold tracking-wide text-emerald-300">ACTIVE</span>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">Week {shownWeek} <span className="font-medium text-emerald-300">· {phaseName}</span></p>
              <p className="mt-0.5 text-[10px] text-neutral-400">{currentWeek === shownWeek ? 'Current week' : 'Week preview'} · {activeBlock.goal}</p>
            </div>
            <span className="text-xs font-semibold text-neutral-300">{shownWeek}/{activeBlock.durationWeeks}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-[width]" style={{ width: (shownWeek / activeBlock.durationWeeks * 100) + '%' }} />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {Array.from({ length: activeBlock.durationWeeks }, (_, index) => {
              const week = index + 1;
              const label = week === activeBlock.durationWeeks ? 'Review' : activeBlock.easierWeek === week ? 'Easy' : week === 1 ? 'Start' : 'Build';
              return (
                <button
                  key={week}
                  type="button"
                  aria-pressed={shownWeek === week}
                  onClick={() => setPreviewWeek(week)}
                  className={'min-h-11 rounded-xl border px-1 py-1 text-center transition ' + (shownWeek === week
                    ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-200'
                    : week <= currentWeek ? 'border-neutral-800 bg-neutral-950/60 text-neutral-300' : 'border-neutral-800/70 bg-neutral-950/20 text-neutral-500')}
                >
                  <span className="block text-[11px] font-bold">W{week}</span>
                  <span className="block truncate text-[9px]">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950/45 p-3">
            <div className="flex items-start gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-950/70 text-emerald-300">
                {phaseName === 'Review' ? <CheckCircle2 className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              </span>
              <div>
                <p className="text-xs font-bold text-white">{phaseName}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                  {phaseName === 'Starting week'
                    ? 'Set a comfortable baseline and confirm your routine and targets feel right.'
                    : phaseName === 'Optional easier week'
                      ? 'This week is optional. Reduce workload only if you choose; FitLog will not change your logged weights.'
                      : phaseName === 'Review'
                        ? 'Review your block results, then finish the block or continue with another cycle.'
                        : 'Build gradually using your progression rule. FitLog tracks your logs but does not automatically change your workout.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-950/45 p-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
              <Flag className="h-3.5 w-3.5 text-emerald-300" /> Progression rule
            </div>
            <p className="mt-1 text-xs font-semibold text-white">{activeBlock.progressionRule === 'double-progression' ? 'Rep range, then increase load' : 'Repeat targets and review'}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">{ruleDescription}</p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-neutral-950/50 p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500">Sessions</p>
              <p className="mt-1 text-sm font-bold text-white">{activeSessions.length}</p>
              <p className="text-[9px] text-neutral-500">{sessionsThisWeek} this week</p>
            </div>
            <div className="rounded-xl bg-neutral-950/50 p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500">Work sets</p>
              <p className="mt-1 text-sm font-bold text-white">{formatNumber(totalSets)}</p>
              <p className="text-[9px] text-neutral-500">logged in block</p>
            </div>
            <div className="rounded-xl bg-neutral-950/50 p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500">PRs</p>
              <p className="mt-1 text-sm font-bold text-white">{prCount}</p>
              <p className="text-[9px] text-neutral-500">logged in block</p>
            </div>
          </div>
          <p className="mt-2 text-right text-[9px] text-neutral-500">Training volume: {formatNumber(totalVolume)} {settings.weightUnit}</p>
          {topMuscles.length > 0 && (
            <p className="mt-1 text-right text-[9px] text-neutral-500">
              Top muscle volumes: {topMuscles.map(([muscle, sets]) => muscle + ' ' + sets).join(' · ')} sets
            </p>
          )}
          {mostTrackedLift && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/45 px-3 py-2">
              <span className="min-w-0 truncate text-[10px] text-neutral-400">{mostTrackedLift.name} · estimated 1RM</span>
              <span className={'shrink-0 text-[10px] font-bold ' + (mostTrackedLift.latest >= mostTrackedLift.first ? 'text-emerald-300' : 'text-neutral-300')}>
                {mostTrackedLift.first.toFixed(1)} → {mostTrackedLift.latest.toFixed(1)} {settings.weightUnit}
              </span>
            </div>
          )}

          {selectedRoutines.length > 0 && (
            <div className="mt-4 border-t border-neutral-800/80 pt-3">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                <Dumbbell className="h-3.5 w-3.5 text-emerald-300" /> This split
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedRoutines.map((routine, index) => (
                  <span key={routine.id} className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-2.5 py-1.5 text-[10px] text-neutral-300">
                    {index + 1}. {routine.title}
                  </span>
                ))}
              </div>
              {nextRoutine && (
                <button
                  type="button"
                  onClick={() => onStartRoutine(nextRoutine)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-neutral-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400"
                >
                  <Dumbbell className="h-4 w-4" /> Start next session: {nextRoutine.title}
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={finishBlock}
            className="mt-3 w-full rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-2.5 text-xs font-semibold text-neutral-300 transition hover:border-emerald-600/60 hover:text-white"
          >
            Finish block and save review
          </button>
        </section>
      ) : (
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-950/60 text-emerald-300"><CalendarDays className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-white">Plan your next training block</h3>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">Choose a goal, one of your existing splits, and how you want to progress. Your workouts and logging stay the same.</p>
            </div>
          </div>
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              disabled={routines.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-neutral-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Create training block
            </button>
          ) : (
            <form onSubmit={startBlock} className="mt-4 space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                Block name
                <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={48} className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none focus:border-emerald-500" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                  Goal
                  <select value={goal} onChange={(event) => setGoal(event.target.value as TrainingBlock['goal'])} className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-xs font-semibold normal-case tracking-normal text-white outline-none focus:border-emerald-500">
                    <option>Hypertrophy</option><option>Strength</option><option>General fitness</option>
                  </select>
                </label>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                  Duration
                  <select value={durationWeeks} onChange={(event) => { const nextDuration = Number(event.target.value); setDurationWeeks(nextDuration); if (easierWeek && Number(easierWeek) >= nextDuration) setEasierWeek(''); }} className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-xs font-semibold normal-case tracking-normal text-white outline-none focus:border-emerald-500">
                    <option value={4}>4 weeks</option><option value={6}>6 weeks</option><option value={8}>8 weeks</option>
                  </select>
                </label>
              </div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                Training split
                <select value={splitName} onChange={(event) => setSplitName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-xs font-semibold normal-case tracking-normal text-white outline-none focus:border-emerald-500">
                  {splitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                Progression approach
                <select value={progressionRule} onChange={(event) => setProgressionRule(event.target.value as TrainingBlock['progressionRule'])} className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-xs font-semibold normal-case tracking-normal text-white outline-none focus:border-emerald-500">
                  <option value="double-progression">Rep range, then increase load</option>
                  <option value="repeat-and-review">Repeat targets and review weekly</option>
                </select>
              </label>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                Optional easier week
                <select value={easierWeek} onChange={(event) => setEasierWeek(event.target.value)} className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-xs font-semibold normal-case tracking-normal text-white outline-none focus:border-emerald-500">
                  <option value="">None planned</option>
                  {Array.from({ length: Math.max(0, durationWeeks - 3) }, (_, index) => index + 3).map((week) => (
                    <option key={week} value={week}>Week {week}</option>
                  ))}
                </select>
              </label>
              <p className="text-[10px] leading-relaxed text-neutral-500">This is a tracker and guide. FitLog will not automatically change your exercise list, weights, or reps.</p>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-neutral-800 px-4 py-3 text-xs font-semibold text-neutral-300">Cancel</button>
                <button type="submit" disabled={!title.trim() || !selectedRoutines.length} className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-neutral-950 disabled:opacity-50">Start block</button>
              </div>
            </form>
          )}
        </section>
      )}

      {completedBlocks.length > 0 && (
        <details className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <summary className="cursor-pointer list-none text-sm font-bold text-white">Previous blocks <span className="ml-1 text-xs font-medium text-neutral-500">({completedBlocks.length})</span></summary>
          <div className="mt-3 space-y-2">
            {completedBlocks.map((block) => {
              const sessions = getBlockSessions(block, history);
              const sets = sessions.reduce((sum, workout) => sum + workout.totalSets, 0);
              const prs = sessions.reduce((sum, workout) => sum + workout.prsAchieved.length, 0);
              return (
                <div key={block.id} className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-bold text-white">{block.title}</p><p className="mt-1 text-[10px] text-neutral-400">{block.splitName} · {block.durationWeeks} weeks</p></div>
                    <span className="shrink-0 text-[9px] font-semibold text-emerald-300">REVIEW SAVED</span>
                  </div>
                  <p className="mt-2 text-[10px] text-neutral-400">{sessions.length} sessions · {sets} work sets · {prs} PRs · {formatNumber(sessions.reduce((sum, workout) => sum + workout.totalVolume, 0))} {settings.weightUnit} total volume</p>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
};

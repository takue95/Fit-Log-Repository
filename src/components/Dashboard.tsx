import React, { useMemo, useState } from 'react';
import {
  Calculator,
  Check,
  ChevronRight,
  Dumbbell,
  Plus,
  Scale,
  TrendingDown,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { RoutineTemplate, CompletedWorkout, ActiveWorkout, UserSettings, BodyWeightEntry } from '../types/fitness';

interface DashboardProps {
  routines: RoutineTemplate[];
  history: CompletedWorkout[];
  bodyWeights: BodyWeightEntry[];
  activeWorkout: ActiveWorkout | null;
  settings: UserSettings;
  onStartEmptyWorkout: () => void;
  onStartRoutine: (routine: RoutineTemplate) => void;
  onResumeActiveWorkout: () => void;
  onNavigateToRoutines: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToHistory: () => void;
  onAddBodyWeight: (weight: number, date: string) => void;
  onOpenPlateCalc: () => void;
  onOpenOneRMCalc: () => void;
}

const startOfLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const Dashboard: React.FC<DashboardProps> = ({
  routines,
  history,
  bodyWeights,
  activeWorkout,
  settings,
  onStartEmptyWorkout,
  onStartRoutine,
  onResumeActiveWorkout,
  onNavigateToRoutines,
  onNavigateToAnalytics,
  onNavigateToHistory,
  onAddBodyWeight,
  onOpenPlateCalc,
  onOpenOneRMCalc
}) => {
  const [isAddingWeight, setIsAddingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState('');
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

  const pplRoutines = routines.filter((routine) => routine.category === 'Push / Pull / Legs');
  const lastPplWorkout = recentHistory.find((workout) => pplRoutines.some((routine) => routine.title === workout.title));
  const lastTitle = lastPplWorkout?.title.toLowerCase() ?? '';
  const nextFocus = lastTitle.includes('push') ? 'pull' : lastTitle.includes('pull') ? 'legs' : lastTitle.includes('legs') ? 'push' : 'push';
  const nextRoutine = pplRoutines.find((routine) => routine.title.toLowerCase().includes(nextFocus)) ?? pplRoutines[0] ?? routines[0];
  const splitLabel = pplRoutines.length ? 'Push · Pull · Legs' : nextRoutine?.category ?? 'Training plan';

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
  const chartPoints = chartEntries.map((entry, index) => {
    const weights = chartEntries.map((item) => item.weight);
    const minWeight = Math.min(...weights);
    const range = Math.max(1, Math.max(...weights) - minWeight);
    const x = chartEntries.length < 2 ? 150 : 8 + (index / (chartEntries.length - 1)) * 284;
    const y = 46 - ((entry.weight - minWeight) / range) * 34;
    return `${x},${y}`;
  }).join(' ');

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
      <div className="pt-1 pb-1">
        <p className="text-[10px] font-bold tracking-[0.13em] uppercase text-neutral-400">
          {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h2 className="mt-1 text-[23px] leading-tight font-extrabold tracking-tight text-white">Ready for today’s work?</h2>
        <p className="mt-1 text-xs text-neutral-400">One good session at a time.</p>
      </div>

      <button onClick={onNavigateToRoutines} className="w-full flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-3 text-left active:scale-[.99] transition">
        <span><span className="block text-[9px] font-bold tracking-[.12em] uppercase text-neutral-400">Your training split</span><span className="block mt-1 text-sm font-bold text-white">{splitLabel}</span><span className="block mt-0.5 text-[10px] text-neutral-400">Choose and manage your routines</span></span>
        <ChevronRight className="w-4 h-4 text-neutral-500" />
      </button>

      {activeWorkout ? (
        <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-neutral-900 p-3.5">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-[9px] font-bold tracking-[.1em] uppercase text-emerald-300">Workout in progress</span></div>
          <h3 className="mt-2 text-lg font-bold text-white">{activeWorkout.title}</h3>
          <div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-neutral-300">{activeWorkout.exercises.length} exercises logged</span><button onClick={onResumeActiveWorkout} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-neutral-950">Resume workout</button></div>
        </section>
      ) : nextRoutine ? (
        <section className="rounded-2xl border border-emerald-800/60 bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-900 p-3.5">
          <div className="flex items-center gap-2"><span className="rounded-md bg-emerald-900/70 px-2 py-1 text-[8px] font-bold tracking-[.1em] uppercase text-emerald-200">Next session</span><span className="text-[9px] font-semibold tracking-[.08em] uppercase text-neutral-400">{nextFocus} day</span></div>
          <h3 className="mt-2 text-lg leading-tight font-bold text-white">{nextRoutine.title}</h3>
          <p className="mt-1 text-[11px] text-neutral-300 line-clamp-2">{nextRoutine.description}</p>
          <div className="mt-3 flex items-center justify-between gap-2"><span className="text-[10px] text-neutral-400">{nextRoutine.exercises.length} exercises · {nextRoutine.estimatedMinutes} min</span><button onClick={() => onStartRoutine(nextRoutine)} className="rounded-xl bg-emerald-500 px-3.5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 active:scale-[.98] transition">Start workout <span aria-hidden="true">›</span></button></div>
        </section>
      ) : (
        <button onClick={onStartEmptyWorkout} className="rounded-2xl border border-emerald-800/50 bg-emerald-950/30 p-4 text-left"><span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">Ready when you are</span><span className="mt-1 block text-lg font-bold text-white">Start a workout</span></button>
      )}

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
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3"><span className="text-[9px] font-semibold tracking-wide text-neutral-400 uppercase">Personal records</span><strong className="mt-1 block text-base font-extrabold text-white">{weeklyPRs}</strong><span className="text-[9px] text-neutral-400">in the last 30 days</span></div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3"><span className="text-[9px] font-semibold tracking-wide text-neutral-400 uppercase">Sessions logged</span><strong className="mt-1 block text-base font-extrabold text-white">{thisWeek.length}</strong><span className="text-[9px] text-neutral-400">this training week</span></div>
      </div>

      {sectionHeader('Bodyweight', 'History', onNavigateToAnalytics)}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5">
        {latestWeight ? <>
          <div className="flex items-start justify-between"><div><span className="text-[9px] font-bold tracking-[.1em] uppercase text-neutral-400">Latest weigh-in</span><strong className="mt-1 block text-lg font-extrabold text-white">{latestWeight.weight.toFixed(1)} <span className="text-[10px] font-semibold text-neutral-400">{settings.weightUnit}</span></strong><span className="text-[9px] text-neutral-400">{new Date(latestWeight.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div><div className={`text-right text-[10px] font-bold ${weightChange <= 0 ? 'text-emerald-400' : 'text-neutral-300'}`}>{weightChange === 0 ? 'Trend building' : <>{weightChange < 0 ? <TrendingDown className="mr-1 inline h-3.5 w-3.5" /> : <TrendingUp className="mr-1 inline h-3.5 w-3.5" />}{Math.abs(weightChange).toFixed(1)} {settings.weightUnit}<span className="mt-1 block text-[8px] font-medium text-neutral-400">since earliest log</span></>}</div></div>
          {chartEntries.length > 1 && <div className="mt-2"><svg viewBox="0 0 300 56" className="h-12 w-full" preserveAspectRatio="none" role="img" aria-label="Bodyweight trend"><polyline points={chartPoints} fill="none" stroke="#71b593" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />{chartPoints.split(' ').map((point, index) => { const [cx, cy] = point.split(','); return <circle key={index} cx={cx} cy={cy} r={index === chartEntries.length - 1 ? 3.5 : 2} fill={index === chartEntries.length - 1 ? '#71b593' : '#b4c9bc'} />; })}</svg><div className="flex justify-between text-[8px] text-neutral-500"><span>{new Date(chartEntries[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><span>{new Date(chartEntries[chartEntries.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div></div>}
        </> : <div className="flex items-center gap-3 py-1"><span className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-800 text-neutral-300"><Scale className="h-4 w-4" /></span><div><strong className="block text-xs text-white">Start tracking bodyweight</strong><span className="text-[9px] text-neutral-400">Log consistently to see your trend.</span></div></div>}
        {isAddingWeight ? <form onSubmit={saveWeight} className="mt-3 flex gap-2"><input autoFocus type="number" min="1" step="0.1" value={weightInput} onChange={(event) => setWeightInput(event.target.value)} placeholder={`Weight (${settings.weightUnit})`} className="min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" /><button type="submit" className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-neutral-950">Save</button><button type="button" onClick={() => { setIsAddingWeight(false); setWeightInput(''); }} className="rounded-xl border border-neutral-700 px-3 py-2 text-xs text-neutral-300">Cancel</button></form> : <button onClick={() => setIsAddingWeight(true)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-800/80 py-2.5 text-xs font-bold text-emerald-300 hover:bg-neutral-800"><Plus className="h-3.5 w-3.5" />Log weigh-in</button>}
      </section>

      {sectionHeader('Recent workouts', 'Full log', onNavigateToHistory)}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 px-3.5">
        {recentHistory.slice(0, 3).map((workout) => (
          <button key={workout.id} onClick={onNavigateToHistory} className="flex w-full items-center justify-between gap-2 border-b border-neutral-800 py-3 text-left last:border-b-0">
            <span className="flex min-w-0 items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-neutral-800 text-emerald-300"><Dumbbell className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate text-[11px] font-bold text-white">{workout.title}</strong><span className="mt-0.5 block text-[9px] text-neutral-400">{new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {workout.durationMinutes} min · {workout.totalVolume.toLocaleString()} {settings.weightUnit}</span></span></span>
            {workout.prsAchieved.length ? <span className="flex shrink-0 items-center gap-1 text-[9px] font-semibold text-emerald-300"><Trophy className="h-3 w-3" />+{workout.prsAchieved.length}</span> : <ChevronRight className="h-4 w-4 shrink-0 text-neutral-500" />}
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

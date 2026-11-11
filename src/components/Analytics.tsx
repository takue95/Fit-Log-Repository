import React, { useState } from 'react';
import { 
  TrendingUp, 
  Trophy, 
  Flame, 
  Calendar, 
  Scale, 
  Plus, 
  Award, 
  ChevronDown,
  BarChart3,
  Dumbbell
} from 'lucide-react';
import { CompletedWorkout, BodyWeightEntry, UserSettings, Exercise } from '../types/fitness';
import { calculate1RM } from '../utils/fitnessCalc';
import { MuscleEngagementHeatmap } from './MuscleEngagementHeatmap';
import { TrendLineChart } from './TrendLineChart';

interface AnalyticsProps {
  history: CompletedWorkout[];
  bodyWeights: BodyWeightEntry[];
  exercises: Exercise[];
  settings: UserSettings;
  onAddBodyWeight: (weight: number, date: string) => void;
  onOpenOneRMCalc: () => void;
}

export const AnalyticsView: React.FC<AnalyticsProps> = ({
  history,
  bodyWeights,
  exercises,
  settings,
  onAddBodyWeight,
  onOpenOneRMCalc
}) => {
  const [selectedPRCompound, setSelectedPRCompound] = useState<string>('barbell-bench-press');
  const [progressionRange, setProgressionRange] = useState<'3M' | '6M' | '12M' | 'All'>('6M');
  const [selectedProgressPoint, setSelectedProgressPoint] = useState<string | null>(null);
  const [newBwValue, setNewBwValue] = useState<string>('');
  const [isAddingBw, setIsAddingBw] = useState<boolean>(false);

  // Big compounds for 1RM curve
  const trackedCompounds = [
    { id: 'barbell-bench-press', name: 'Bench Press' },
    { id: 'barbell-back-squat', name: 'Back Squat' },
    { id: 'barbell-deadlift', name: 'Deadlift' },
    { id: 'overhead-press', name: 'Overhead Press' },
    { id: 'barbell-bent-over-row', name: 'Barbell Row' }
  ];

  const compoundNamePatterns: Record<string, RegExp> = {
    'barbell-bench-press': /(?:barbell\s+)?bench\s+press/i,
    'barbell-back-squat': /(?:barbell\s+)?back\s+squat|squat/i,
    'barbell-deadlift': /deadlift/i,
    'overhead-press': /overhead\s+press|military\s+press/i,
    'barbell-bent-over-row': /(?:barbell\s+)?(?:bent.?over\s+)?row/i
  };

  const matchesTrackedCompound = (exercise: CompletedWorkout['exercises'][number], compoundId: string) => {
    if (exercise.exerciseId === compoundId) return true;
    const name = exercise.exerciseName.toLowerCase();
    if (compoundId === 'barbell-bench-press' && /dumbbell|machine|smith/i.test(name)) return false;
    if (compoundId === 'barbell-bent-over-row' && /cable|machine|dumbbell|seated/i.test(name)) return false;
    return compoundNamePatterns[compoundId]?.test(name) ?? false;
  };

  // Keep the full session history for the selected lift; the chart later summarizes it by month.
  const sessionProgressionData = React.useMemo(() => {
    const points: { date: string; dateISO: string; maxWeight: number; estimated1RM: number; reps: number }[] = [];

    // Reverse to chronological order
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedHistory.forEach((w) => {
      const match = w.exercises.find((e) => matchesTrackedCompound(e, selectedPRCompound));
      if (match) {
        const completedSets = match.sets.filter((s) => s.completed && s.weight > 0 && s.reps > 0);
        if (completedSets.length > 0) {
          // Find set with highest estimated 1RM
          let best1RM = 0;
          let bestWeight = 0;
          let bestReps = 0;

          completedSets.forEach((s) => {
            const current1RM = calculate1RM(s.weight, s.reps);
            if (current1RM > best1RM) {
              best1RM = current1RM;
              bestWeight = s.weight;
              bestReps = s.reps;
            }
          });

          points.push({
            date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            dateISO: w.date,
            maxWeight: bestWeight,
            estimated1RM: best1RM,
            reps: bestReps
          });
        }
      }
    });

    return points;
  }, [history, selectedPRCompound]);

  const rangeWindow = React.useMemo(() => {
    if (!sessionProgressionData.length) return null;
    const first = new Date(sessionProgressionData[0].dateISO);
    const latest = new Date(sessionProgressionData[sessionProgressionData.length - 1].dateISO);
    const end = new Date(latest.getFullYear(), latest.getMonth() + 1, 1);
    const start = progressionRange === 'All'
      ? new Date(first.getFullYear(), first.getMonth(), 1)
      : new Date(latest.getFullYear(), latest.getMonth() - (Number(progressionRange.slice(0, -1)) - 1), 1);
    return { start, end };
  }, [sessionProgressionData, progressionRange]);

  const progressionData = React.useMemo(() => {
    if (!rangeWindow) return [];
    const startTime = rangeWindow.start.getTime();
    const endTime = rangeWindow.end.getTime();
    const bestByMonth = new Map<string, (typeof sessionProgressionData)[number]>();
    sessionProgressionData.forEach((point) => {
      const date = new Date(point.dateISO);
      const time = date.getTime();
      if (time < startTime || time >= endTime) return;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = bestByMonth.get(month);
      if (!current || point.estimated1RM > current.estimated1RM) bestByMonth.set(month, point);
    });
    return Array.from(bestByMonth.values()).sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
  }, [sessionProgressionData, rangeWindow]);

  const growthPercent = progressionData.length > 1
    ? ((progressionData[progressionData.length - 1].estimated1RM - progressionData[0].estimated1RM) / progressionData[0].estimated1RM) * 100
    : null;
  const activeProgressPoint = progressionData.find((point) => point.dateISO === selectedProgressPoint)
    ?? progressionData[progressionData.length - 1];

  // SVG Chart Dimensions
  const chartHeight = 160;
  const chartWidth = 360;
  const paddingX = 42;
  const rightX = chartWidth - 14;
  const paddingY = 24;

  const rawMin = progressionData.length ? Math.min(...progressionData.map((d) => d.estimated1RM)) : 0;
  const rawMax = progressionData.length ? Math.max(...progressionData.map((d) => d.estimated1RM)) : 1;
  const minVal = Math.max(0, rawMin - Math.max((rawMax - rawMin) * 0.2, rawMax * 0.06, 1));
  const maxVal = rawMax + Math.max((rawMax - rawMin) * 0.2, rawMax * 0.06, 1);
  const dateToX = (dateISO: string) => {
    if (!rangeWindow) return (paddingX + rightX) / 2;
    const start = rangeWindow.start.getTime();
    const span = Math.max(1, rangeWindow.end.getTime() - start);
    const date = new Date(dateISO);
    return paddingX + ((date.getTime() - start) / span) * (rightX - paddingX);
  };
  const dateToY = (value: number) => chartHeight - paddingY - ((value - minVal) / Math.max(1, maxVal - minVal)) * (chartHeight - paddingY * 2);

  const pointsString = progressionData
    .map((point) => `${dateToX(point.dateISO)},${dateToY(point.estimated1RM)}`)
    .join(' ');

  const formatAxisDate = (date: Date) => date.toLocaleDateString(undefined, {
    month: 'short',
    ...(progressionRange === 'All' || rangeWindow && rangeWindow.start.getFullYear() !== new Date(rangeWindow.end.getTime() - 1).getFullYear() ? { year: 'numeric' as const } : {})
  });

  const weeklyVolumeBars = React.useMemo(() => {
    const today = new Date();
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return Array.from({ length: 5 }, (_, index) => {
      const start = new Date(monday);
      start.setDate(start.getDate() - (4 - index) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const vol = history.reduce((sum, workout) => {
        const date = new Date(workout.date);
        return date >= start && date < end ? sum + workout.totalVolume : sum;
      }, 0);
      return {
        week: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        vol,
        label: vol >= 1000 ? `${(vol / 1000).toFixed(vol >= 10000 ? 0 : 1)}k` : `${Math.round(vol)}`
      };
    });
  }, [history]);
  const maxWeeklyVolume = Math.max(1, ...weeklyVolumeBars.map((bar) => bar.vol));

  const muscleDistribution = React.useMemo(() => {
    const setCounts = new Map<string, number>();
    history.forEach((workout) => workout.exercises.forEach((exercise) => {
      if (exercise.category === 'Cardio') return;
      const completed = exercise.sets.filter((set) => set.completed && set.reps > 0).length;
      if (completed) setCounts.set(exercise.category, (setCounts.get(exercise.category) ?? 0) + completed);
    }));
    const total = Array.from(setCounts.values()).reduce((sum, value) => sum + value, 0);
    const colors = ['bg-emerald-500', 'bg-emerald-700', 'bg-emerald-300', 'bg-teal-500', 'bg-neutral-500'];
    return Array.from(setCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([group, count], index) => ({ group, pct: total ? Math.round((count / total) * 100) : 0, color: colors[index] }));
  }, [history]);

  const allPRs = React.useMemo(() => {
    const bestByExercise = new Map<string, { exercise: string; weight: number; reps: number; estimated1RM: number; date: string; dateValue: number }>();
    history.forEach((workout) => workout.exercises.forEach((exercise) => exercise.sets.forEach((set) => {
      if (!set.completed || set.weight <= 0 || set.reps <= 0) return;
      const key = exercise.exerciseName.trim().toLowerCase();
      const estimated1RM = calculate1RM(set.weight, set.reps);
      const current = bestByExercise.get(key);
      if (!current || estimated1RM > current.estimated1RM) {
        bestByExercise.set(key, {
          exercise: exercise.exerciseName,
          weight: set.weight,
          reps: set.reps,
          estimated1RM,
          date: new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
          dateValue: new Date(workout.date).getTime()
        });
      }
    })));
    return Array.from(bestByExercise.values()).sort((a, b) => b.estimated1RM - a.estimated1RM).slice(0, 6);
  }, [history]);

  const bodyweightPoints = React.useMemo(() => [...bodyWeights]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-12)
    .map((entry) => ({ date: entry.date, value: entry.weight })), [bodyWeights]);

  const handleSaveBw = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newBwValue);
    if (!val || val <= 0) return;
    onAddBodyWeight(val, new Date().toISOString().split('T')[0]);
    setNewBwValue('');
    setIsAddingBw(false);
  };

  return (
    <div className="flex flex-col gap-5 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Strength & Analytics</h2>
          <p className="text-xs text-neutral-400">Progression curves, PR milestones, and volume</p>
        </div>

      </div>

      {/* Muscle Engagement Heat Map (7-Day Biometrics) */}
      <MuscleEngagementHeatmap
        history={history}
        exercises={exercises}
        settings={settings}
      />

      {/* PR Wall (Medals & Trophies) */}
      <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-fitlog-gold" />
            <h3 className="text-base font-bold text-white">Personal Records Wall</h3>
          </div>
          <span className="text-xs bg-fitlog-gold/10 text-fitlog-gold border border-fitlog-gold/20 px-2 py-0.5 rounded-full font-bold">
            All-Time Bests
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {allPRs.map((pr, idx) => {
            const medalColor =
              idx === 0 ? 'text-fitlog-gold' : idx === 1 ? 'text-slate-300' : 'text-amber-700';

            return (
              <div
                key={pr.exercise}
                className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center shrink-0">
                    <Award className={`w-4 h-4 ${medalColor}`} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {pr.exercise}
                    </span>
                    <span className="text-[10px] text-neutral-400">Best set · {pr.date}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold font-mono text-fitlog-gold block">
                    {pr.weight} {settings.weightUnit}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    for {pr.reps} reps
                  </span>
                </div>
              </div>
            );
          })}
          {!allPRs.length && <p className="col-span-full py-5 text-center text-xs text-neutral-500">Completed strength sets will appear here as personal bests.</p>}
        </div>
      </div>

      {/* Weekly Volume & Muscle Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Volume Chart */}
        <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-neutral-400" />
              Weekly Volume Tonnage ({settings.weightUnit})
            </div>
            <h4 className="text-base font-bold text-white mt-1">Consistency Trend</h4>
          </div>

          <div className="flex items-end justify-between h-36 pt-4 px-2">
            {weeklyVolumeBars.map((bar, i) => {
              const heightPct = bar.vol > 0 ? Math.max(5, Math.round((bar.vol / maxWeeklyVolume) * 100)) : 0;
              const isCurrent = i === weeklyVolumeBars.length - 1;

              return (
                <div key={bar.week} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-[10px] font-mono font-bold text-neutral-400">
                    {bar.label}
                  </span>
                  <div className="w-7 bg-neutral-800 rounded-t-lg h-24 flex items-end p-0.5">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isCurrent && bar.vol > 0
                          ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                          : 'bg-neutral-700 hover:bg-neutral-600'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium truncate max-w-[50px]">
                    {bar.week}
                  </span>
                </div>
              );
            })}
          </div>
          {!history.length && <p className="text-center text-[10px] text-neutral-500">No workout volume logged yet.</p>}
        </div>

        {/* Muscle Distribution Breakdown */}
        <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl flex flex-col gap-3.5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              Volume Distribution
            </div>
            <h4 className="text-base font-bold text-white mt-1">Muscle Group Balance</h4>
          </div>

          {/* Progress bar split */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-neutral-800">
            {muscleDistribution.map((m) => (
              <div
                key={m.group}
                className={`${m.color} h-full transition-all`}
                style={{ width: `${m.pct}%` }}
                title={`${m.group}: ${m.pct}%`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-1 text-xs">
            {muscleDistribution.map((m) => (
              <div key={m.group} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${m.color}`} />
                  <span className="text-neutral-300 font-medium">{m.group}</span>
                </div>
                <span className="font-mono font-bold text-white">{m.pct}%</span>
              </div>
            ))}
            {!muscleDistribution.length && <p className="py-4 text-center text-xs text-neutral-500">Muscle group totals will appear after strength workouts are logged.</p>}
          </div>
        </div>
      </div>

      {/* Body Weight Tracker */}
      <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-500/10 text-neutral-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Bodyweight Tracker</h3>
              <p className="text-xs text-neutral-400">Track body composition & trend</p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingBw(!isAddingBw)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Log Weight
          </button>
        </div>

        <TrendLineChart points={bodyweightPoints} unit={settings.weightUnit} label="Bodyweight" />

        {/* Quick Log Form */}
        {isAddingBw && (
          <form
            onSubmit={handleSaveBw}
            className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center gap-2 animate-in fade-in"
          >
            <input
              type="text"
              inputMode="decimal"
              placeholder={`Enter weight (${settings.weightUnit})...`}
              value={newBwValue}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(e) => setNewBwValue(e.target.value)}
              className="numeric-entry flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl shadow"
            >
              Save
            </button>
          </form>
        )}

        {/* Weight Entries List */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[...bodyWeights].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((bw) => (
            <div
              key={bw.id}
              className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 flex flex-col text-center gap-1"
            >
              <span className="text-[10px] text-neutral-400">
                {new Date(bw.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-base font-extrabold font-mono text-white">
                {bw.weight} <span className="text-[10px] text-neutral-400 font-normal">{settings.weightUnit}</span>
              </span>
              {bw.bodyFatPercent && (
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {bw.bodyFatPercent}% BF
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* 1RM Progression Interactive Chart */}
      <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                1RM Strength Curve
              </span>
              {growthPercent !== null && (
                <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${growthPercent >= 0 ? 'bg-fitlog-gold/10 text-fitlog-gold border-fitlog-gold/20' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'}`}>
                  {growthPercent > 0 ? '+' : ''}{growthPercent.toFixed(1)}% in range
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Estimated One Rep Max
            </h3>
          </div>

          {/* Exercise picker and 1RM calculator */}
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <select
              value={selectedPRCompound}
              onChange={(e) => setSelectedPRCompound(e.target.value)}
              className="min-w-0 flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-neutral-200 focus:outline-none focus:border-emerald-500 sm:flex-none"
            >
              {trackedCompounds.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.name}
                </option>
              ))}
            </select>
            <button
              onClick={onOpenOneRMCalc}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-bold text-neutral-400 transition hover:border-neutral-500/50"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              1RM Calc
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] text-neutral-500">Best estimated 1RM per month</span>
          <div className="grid grid-cols-4 rounded-xl border border-neutral-800 bg-neutral-950 p-1" aria-label="Chart date range">
            {(['3M', '6M', '12M', 'All'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setProgressionRange(range)}
                aria-pressed={progressionRange === range}
                className={`min-w-10 rounded-lg px-2 py-1.5 text-[10px] font-bold transition ${progressionRange === range ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Curve */}
        {progressionData.length ? <div className="relative w-full overflow-hidden bg-neutral-950/60 rounded-2xl p-2 border border-neutral-800/80">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-44 overflow-visible"
            role="img"
            aria-label={`${trackedCompounds.find((compound) => compound.id === selectedPRCompound)?.name ?? 'Strength'} estimated one rep max trend, ${progressionRange} range`}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#71b593" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#71b593" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.5, 1].map((fraction) => {
              const y = chartHeight - paddingY - fraction * (chartHeight - paddingY * 2);
              const value = minVal + fraction * (maxVal - minVal);
              return (
                <g key={fraction}>
                  <line x1={paddingX} y1={y} x2={rightX} y2={y} stroke="#262626" strokeDasharray="4 4" strokeWidth="1" />
                  <text x={paddingX - 7} y={y + 3} textAnchor="end" fill="#737373" fontSize="9" fontFamily="monospace">{Math.round(value)}</text>
                </g>
              );
            })}

            {/* Area fill */}
            {progressionData.length > 1 && (
              <polygon
                points={`${paddingX},${chartHeight - paddingY} ${pointsString} ${rightX},${chartHeight - paddingY}`}
                fill="url(#chartGradient)"
              />
            )}

            {progressionData.length > 1 && <polyline fill="none" stroke="#71b593" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pointsString} />}

            {progressionData.map((point, index) => {
              const isLast = index === progressionData.length - 1;
              const isSelected = point.dateISO === activeProgressPoint?.dateISO;
              const pointLabel = `${new Date(point.dateISO).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}: ${Math.round(point.estimated1RM)} ${settings.weightUnit} estimated 1RM from ${point.maxWeight} ${settings.weightUnit} × ${point.reps} reps`;
              return (
                <g key={point.dateISO}>
                  <circle
                    cx={dateToX(point.dateISO)}
                    cy={dateToY(point.estimated1RM)}
                    r={isSelected ? 6 : isLast ? 4.5 : 3.5}
                    fill={isSelected ? '#e8d7ac' : isLast ? '#d8b36a' : '#71b593'}
                    stroke={isSelected ? '#d8b36a' : '#0a0a0a'}
                    strokeWidth={isSelected ? 3 : 2}
                    role="button"
                    tabIndex={0}
                    aria-label={pointLabel}
                    onClick={() => setSelectedProgressPoint(point.dateISO)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedProgressPoint(point.dateISO);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  ><title>{pointLabel}</title></circle>
                </g>
              );
            })}
            {rangeWindow && [0, 0.5, 1].map((fraction) => {
              const start = rangeWindow.start.getTime();
              const end = rangeWindow.end.getTime() - 1;
              const date = new Date(start + (end - start) * fraction);
              const x = paddingX + fraction * (rightX - paddingX);
              return <text key={fraction} x={x} y={chartHeight - 5} textAnchor={fraction === 0 ? 'start' : fraction === 1 ? 'end' : 'middle'} fill="#737373" fontSize="9">{formatAxisDate(date)}</text>;
            })}
          </svg>
        </div> : (
          <div className="flex min-h-44 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950/50 px-6 text-center text-xs text-neutral-500">
            No logged sets for this lift yet. Your strength curve will start when it appears in a completed workout.
          </div>
        )}

        {/* Current Stat highlight */}
        {activeProgressPoint && <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-xs">
          <span className="min-w-0 text-neutral-400">
            <span className="block text-[9px] font-semibold uppercase tracking-wide text-neutral-500">{activeProgressPoint.dateISO === progressionData[progressionData.length - 1]?.dateISO ? 'Latest month' : 'Selected month'}</span>
            <span className="font-bold text-white">{activeProgressPoint.maxWeight} {settings.weightUnit} × {activeProgressPoint.reps} reps</span>
            <span className="ml-1.5 text-neutral-500">{new Date(activeProgressPoint.dateISO).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
          </span>
          <span className="shrink-0 font-mono font-bold text-emerald-400">
            Est. 1RM: {Math.round(activeProgressPoint.estimated1RM)} {settings.weightUnit}
          </span>
        </div>}
      </div>

    </div>
  );
};


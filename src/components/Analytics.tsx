import React, { useState } from 'react';
import { TrendingUp, Trophy, BarChart3 } from 'lucide-react';
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
  onOpenOneRMCalc
}) => {
  const [selectedPRCompound, setSelectedPRCompound] = useState<string>('barbell-bench-press');
  const [progressionRange, setProgressionRange] = useState<'3M' | '6M' | '12M' | 'All'>('6M');
  const [selectedProgressPoint, setSelectedProgressPoint] = useState<string | null>(null);

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
      const weekWorkouts = history.filter((workout) => {
        const date = new Date(workout.date);
        return date >= start && date < end;
      });
      const vol = weekWorkouts.reduce((sum, workout) => sum + workout.totalVolume, 0);
      return {
        week: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        vol,
        sessions: weekWorkouts.length,
        label: vol >= 1000 ? `${(vol / 1000).toFixed(vol >= 10000 ? 0 : 1)}k` : `${Math.round(vol)}`
      };
    });
  }, [history]);
  const maxWeeklyVolume = Math.max(1, ...weeklyVolumeBars.map((bar) => bar.vol));

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

  const sortedBodyWeights = React.useMemo(() => [...bodyWeights]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [bodyWeights]);
  const bodyweightPoints = sortedBodyWeights.slice(-12).map((entry) => ({ date: entry.date, value: entry.weight }));
  const latestBodyweight = sortedBodyWeights[sortedBodyWeights.length - 1];
  const bodyweightMonthStart = new Date();
  bodyweightMonthStart.setDate(bodyweightMonthStart.getDate() - 30);
  const previousMonthBodyweight = [...sortedBodyWeights].reverse().find((entry) => new Date(entry.date) <= bodyweightMonthStart);
  const bodyweightMonthChange = latestBodyweight && previousMonthBodyweight
    ? latestBodyweight.weight - previousMonthBodyweight.weight
    : null;

  return (
    <div className="flex flex-col gap-5 pb-12 animate-in fade-in duration-200">
      {/* Progress header and shared workout period */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Progress</h2>
          <p className="text-xs text-neutral-400">Your training, connected in one view</p>
        </div>
      </div>

      {/* Interactive muscle map follows the shared workout period */}
      <MuscleEngagementHeatmap
        history={history}
        exercises={exercises}
        settings={settings}
      />

      {/* One weekly workload trend combines training volume and consistency */}
      <section className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-4 shadow-xl" aria-labelledby="workload-heading">
        <div className="mb-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
            Last five training weeks
          </div>
          <h3 id="workload-heading" className="mt-1 text-base font-bold text-white">Training workload</h3>
          <p className="text-[9px] text-neutral-500">Volume bars · session counts below</p>
        </div>
        <div className="flex h-36 items-end justify-between gap-2 px-1 pt-2">
          {weeklyVolumeBars.map((bar, index) => {
            const heightPct = bar.vol > 0 ? Math.max(5, Math.round((bar.vol / maxWeeklyVolume) * 100)) : 0;
            const isCurrent = index === weeklyVolumeBars.length - 1;
            return (
              <div key={bar.week} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-[8px] font-mono font-semibold text-neutral-500">{bar.label}</span>
                <div className="flex h-24 w-full max-w-9 items-end rounded-t-lg bg-neutral-800/80 p-0.5">
                  <div className={`w-full rounded-t-md transition-all ${isCurrent && bar.vol > 0 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-neutral-700'}`} style={{ height: `${heightPct}%` }} />
                </div>
                <span className={`max-w-full truncate text-[8px] font-medium ${isCurrent ? 'text-emerald-300' : 'text-neutral-500'}`}>{isCurrent ? 'This wk' : bar.week}</span>
                <span className="text-[8px] text-neutral-500">{bar.sessions} sess</span>
              </div>
            );
          })}
        </div>
        {!history.length && <p className="mt-2 text-center text-[10px] text-neutral-500">Your workload trend will appear after workouts are logged.</p>}
      </section>

      {/* Bodyweight trend remains independent of workout filters */}
      <section className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-4 shadow-xl" aria-labelledby="bodyweight-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 id="bodyweight-heading" className="text-base font-bold text-white">Bodyweight trend</h3>
            <p className="text-[9px] text-neutral-500">Latest 12 weigh-ins · log weight on Home</p>
          </div>
          {latestBodyweight && (
            <div className="shrink-0 text-right">
              <span className="block text-base font-extrabold tabular-nums text-white">{latestBodyweight.weight.toFixed(1)} <span className="text-[9px] font-medium text-neutral-400">{settings.weightUnit}</span></span>
              {bodyweightMonthChange !== null && (
                <span className={`text-[9px] font-semibold ${bodyweightMonthChange <= 0 ? 'text-emerald-400' : 'text-neutral-300'}`}>
                  {bodyweightMonthChange > 0 ? '+' : ''}{bodyweightMonthChange.toFixed(1)} {settings.weightUnit} this month
                </span>
              )}
            </div>
          )}
        </div>
        <TrendLineChart points={bodyweightPoints} unit={settings.weightUnit} label="Bodyweight" latestPointColor="#4fbd80" />
      </section>

      {/* Compact personal bests */}
      <section className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-4 shadow-xl" aria-labelledby="personal-bests-heading">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-fitlog-gold" />
            <h3 id="personal-bests-heading" className="text-base font-bold text-white">Personal bests</h3>
          </div>
          <span className="text-[9px] font-semibold text-neutral-500">Top lifts · all time</span>
        </div>
        <div className="divide-y divide-neutral-800/80">
          {allPRs.slice(0, 3).map((pr, index) => (
            <div key={pr.exercise} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fitlog-gold/10 text-[10px] font-bold text-fitlog-gold">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-white">{pr.exercise}</span>
                <span className="block truncate text-[9px] text-neutral-400">{pr.weight} {settings.weightUnit} × {pr.reps} reps · {pr.date}</span>
              </div>
              <span className="shrink-0 text-right text-[10px] font-bold text-fitlog-gold">~{Math.round(pr.estimated1RM)} {settings.weightUnit}</span>
            </div>
          ))}
          {!allPRs.length && <p className="py-4 text-center text-xs text-neutral-500">Completed strength sets will appear here as personal bests.</p>}
        </div>
      </section>

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
                    fill={isSelected ? '#7bd4a0' : isLast ? '#4fbd80' : '#71b593'}
                    stroke={isSelected ? '#4fbd80' : '#0a0a0a'}
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


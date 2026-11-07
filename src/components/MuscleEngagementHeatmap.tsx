import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Activity, 
  Dumbbell, 
  RotateCw, 
  ShieldCheck,
  AlertCircle,
  Zap,
  Crosshair,
  TrendingUp,
  Layers
} from 'lucide-react';
import { CompletedWorkout, Exercise, UserSettings } from '../types/fitness';
import { MuscleMap } from '@musclemap/react';
import type { MuscleGroup, MuscleMapValues } from '@musclemap/core';
import maleFront from '@musclemap/assets/bodies/male-front.webp';
import maleBack from '@musclemap/assets/bodies/male-back.webp';

interface MuscleEngagementHeatmapProps {
  history: CompletedWorkout[];
  exercises: Exercise[];
  settings: UserSettings;
}

export type MuscleKey = 
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Biceps'
  | 'Forearms'
  | 'Triceps'
  | 'Core'
  | 'Calves';

interface MuscleStats {
  key: MuscleKey;
  displayName: string;
  category: 'Push' | 'Pull' | 'Legs' | 'Core';
  setsCount: number;
  totalVolume: number;
  exercisesUsed: { name: string; sets: number; volume: number }[];
  lastTrainedDaysAgo: number | null;
  heatLevel: 0 | 1 | 2 | 3 | 4; // 0=cold, 1=light, 2=moderate, 3=optimal, 4=overdrive
  recoveryStatus: 'Rested' | 'Recovering' | 'Ready';
  recoveryPercent: number; // 0-100%
}

const HEAT_LEVEL_METRICS = {
  0: {
    label: 'Cold / Rested',
    shortLabel: 'Cold',
    setsRange: '0 sets',
    fillGrad: 'url(#gradHeat0)',
    stroke: '#2c3345',
    glowColor: 'rgba(55, 65, 81, 0.4)',
    badgeBg: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    indicatorColor: '#64748b'
  },
  1: {
    label: 'Light Warmth (1-4 sets)',
    shortLabel: 'Light',
    setsRange: '1-4 sets',
    fillGrad: 'url(#gradHeat1)',
    stroke: '#14b8a6',
    glowColor: 'rgba(20, 184, 166, 0.6)',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    indicatorColor: '#14b8a6'
  },
  2: {
    label: 'Moderate (5-8 sets)',
    shortLabel: 'Moderate',
    setsRange: '5-8 sets',
    fillGrad: 'url(#gradHeat2)',
    stroke: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.65)',
    badgeBg: 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30',
    indicatorColor: '#3b82f6'
  },
  3: {
    label: 'Optimal Stimulus (9-13 sets)',
    shortLabel: 'Optimal',
    setsRange: '9-13 sets',
    fillGrad: 'url(#gradHeat3)',
    stroke: '#78b48f',
    glowColor: 'rgba(245, 158, 11, 0.75)',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    indicatorColor: '#78b48f'
  },
  4: {
    label: 'Overdrive / High Heat (14+ sets)',
    shortLabel: 'Overdrive',
    setsRange: '14+ sets',
    fillGrad: 'url(#gradHeat4)',
    stroke: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.85)',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
    indicatorColor: '#f43f5e'
  }
};

const MUSCLE_MAP_LABELS: Partial<Record<MuscleGroup, string>> = {
  CHEST: 'Chest',
  TRAPEZIUS: 'Traps',
  RHOMBOIDS: 'Rhomboids',
  LATS: 'Lats',
  SHOULDERS_FRONT: 'Front delts',
  SHOULDERS_SIDE: 'Side delts',
  SHOULDERS_REAR: 'Rear delts',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Forearms',
  CORE: 'Abs',
  OBLIQUES: 'Obliques',
  BACK_LOWER: 'Lower back',
  GLUTES: 'Glutes',
  QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  CALVES: 'Calves',
  ADDUCTORS: 'Adductors',
  ABDUCTORS: 'Abductors',
};

const MAP_GROUP_TO_MUSCLE: Partial<Record<MuscleGroup, MuscleKey>> = {
  CHEST: 'Chest',
  BACK_UPPER: 'Back',
  BACK_LOWER: 'Back',
  TRAPEZIUS: 'Back',
  RHOMBOIDS: 'Back',
  LATS: 'Back',
  SHOULDERS_FRONT: 'Shoulders',
  SHOULDERS_SIDE: 'Shoulders',
  SHOULDERS_REAR: 'Shoulders',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Forearms',
  CORE: 'Core',
  OBLIQUES: 'Core',
  GLUTES: 'Glutes',
  QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  CALVES: 'Calves',
  ADDUCTORS: 'Quads',
  ABDUCTORS: 'Glutes',
};

const mapAnatomyName = (name: string): MuscleGroup[] => {
  const value = name.toLowerCase();
  if (value.includes('pectoral') || value.includes('chest')) return ['CHEST'];
  if (value.includes('trapez') || value.includes('trap')) return ['TRAPEZIUS'];
  if (value.includes('rhomboid') || value.includes('mid back') || value.includes('upper back')) return ['RHOMBOIDS'];
  if (value.includes('lat')) return ['LATS'];
  if (value.includes('lower back') || value.includes('erector') || value.includes('erector spinae')) return ['BACK_LOWER'];
  if (value.includes('rear deltoid') || value.includes('posterior deltoid') || value.includes('rear delt')) return ['SHOULDERS_REAR'];
  if (value.includes('front deltoid') || value.includes('anterior deltoid') || value.includes('front delt') || value.includes('anterior delt')) return ['SHOULDERS_FRONT'];
  if (value.includes('side deltoid') || value.includes('lateral deltoid') || value.includes('side delt') || value.includes('lateral delt')) return ['SHOULDERS_SIDE'];
  if (value.includes('shoulder') || value.includes('deltoid') || value.includes('delt')) return ['SHOULDERS_SIDE'];
  if (value.includes('bicep') || value.includes('brachialis')) return ['BICEPS'];
  if (value.includes('tricep')) return ['TRICEPS'];
  if (value.includes('forearm') || value.includes('grip')) return ['FOREARMS'];
  if (value.includes('oblique')) return ['OBLIQUES'];
  if (value.includes('abdominal') || value.includes('abs') || value.includes('core')) return ['CORE'];
  if (value.includes('glute')) return ['GLUTES'];
  if (value.includes('quad')) return ['QUADS'];
  if (value.includes('hamstring')) return ['HAMSTRINGS'];
  if (value.includes('calf') || value.includes('calves') || value.includes('gastrocnemius') || value.includes('soleus')) return ['CALVES'];
  if (value.includes('adductor')) return ['ADDUCTORS'];
  if (value.includes('abductor')) return ['ABDUCTORS'];
  if (value.includes('hip flexor')) return ['HIP_FLEXORS'];
  return [];
};

export const MuscleEngagementHeatmap: React.FC<MuscleEngagementHeatmapProps> = ({
  history,
  exercises,
  settings
}) => {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleKey>('Chest');
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleKey | null>(null);
  const [activeSplitFilter, setActiveSplitFilter] = useState<'All' | 'Push' | 'Pull' | 'Legs' | 'Core'>('All');
  const [viewOrientation, setViewOrientation] = useState<'both' | 'front' | 'back'>('both');
  const [timeRangeDays, setTimeRangeDays] = useState<number>(7);

  // Compute muscle engagement analytics
  const muscleData = useMemo(() => {
    const now = Date.now();
    const cutoffTime = now - timeRangeDays * 24 * 60 * 60 * 1000;

    const recentWorkouts = history.filter((w) => new Date(w.date).getTime() >= cutoffTime);

    const baseMuscles: Record<MuscleKey, {
      displayName: string;
      category: 'Push' | 'Pull' | 'Legs' | 'Core';
      setsCount: number;
      totalVolume: number;
      exercisesMap: Map<string, { sets: number; volume: number }>;
      latestTimestamp: number | null;
    }> = {
      Chest: { displayName: 'Chest (Pectorals)', category: 'Push', setsCount: 0, totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null },
      Shoulders: { displayName: 'Shoulders (Deltoids)', category: 'Push', setsCount: 0, totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null },
      Triceps: { displayName: 'Triceps Brachii', category: 'Push', setsCount: 0, totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null },
      Back: { displayName: 'Back & Lats', category: 'Pull', setsCount: 0, totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null },
      Biceps: { displayName: 'Biceps Brachii', category: 'Pull', setsCount: 0, totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null },
      Forearms: { displayName: 'Forearms & Grip', category: 'Pull', setsCount: 0, totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null },
      Quads: { displayName: 'Quadriceps', category: 'Legs', setsCount: 0, totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null },
      Hamstrings: { displayName: 'Hamstrings', category: 'Legs', setsCount: 0, totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null },
      Glutes: { displayName: 'Gluteus Maximus', category: 'Legs', setsCount: 0, totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null },
      Calves: { displayName: 'Calves (Gastrocnemius)', category: 'Legs', setsCount: 0, totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null },
      Core: { displayName: 'Abs & Obliques', category: 'Core', setsCount: 0, totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null },
    };

    const resolveMuscleKey = (category: string, exName: string): MuscleKey => {
      const lowerCat = category.toLowerCase();
      const lowerName = exName.toLowerCase();

      if (lowerCat.includes('chest') || lowerName.includes('bench') || lowerName.includes('chest') || lowerName.includes('push-up')) return 'Chest';
      // Respect the specific hamstring category before the broad deadlift rule,
      // so Romanian deadlifts are attributed to hamstrings like the anatomy map.
      if (lowerCat.includes('hamstring') || lowerName.includes('rdl') || lowerName.includes('romanian') || lowerName.includes('leg curl')) return 'Hamstrings';
      if (lowerCat.includes('back') || lowerName.includes('deadlift') || lowerName.includes('row') || lowerName.includes('lat') || lowerName.includes('pull-up')) return 'Back';
      if (lowerCat.includes('shoulder') || (lowerName.includes('press') && !lowerName.includes('bench') && !lowerName.includes('leg')) || lowerName.includes('lateral raise') || lowerName.includes('face pull')) return 'Shoulders';
      if (lowerCat.includes('quad') || lowerName.includes('squat') || lowerName.includes('leg press') || lowerName.includes('lunge') || lowerName.includes('leg extension')) return 'Quads';
      if (lowerCat.includes('glute') || lowerName.includes('hip thrust')) return 'Glutes';
      if (lowerCat.includes('forearm') || lowerName.includes('wrist curl') || lowerName.includes('farmer carry')) return 'Forearms';
      if (lowerCat.includes('bicep') || lowerName.includes('curl')) return 'Biceps';
      if (lowerCat.includes('tricep') || lowerName.includes('pushdown') || lowerName.includes('skull crusher') || lowerName.includes('dip')) return 'Triceps';
      if (lowerCat.includes('calf') || lowerCat.includes('calves') || lowerName.includes('calf')) return 'Calves';
      if (lowerCat.includes('core') || lowerCat.includes('abs') || lowerName.includes('plank') || (lowerName.includes('raise') && lowerName.includes('leg'))) return 'Core';

      return 'Back';
    };

    recentWorkouts.forEach((workout) => {
      const workoutTime = new Date(workout.date).getTime();

      workout.exercises.forEach((ex) => {
        const completedSets = ex.sets.filter((s) => s.completed);
        if (completedSets.length === 0) return;

        const muscleKey = resolveMuscleKey(ex.category || '', ex.exerciseName || '');
        const target = baseMuscles[muscleKey];
        if (!target) return;

        const volume = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
        target.setsCount += completedSets.length;
        target.totalVolume += volume;

        if (!target.latestTimestamp || workoutTime > target.latestTimestamp) {
          target.latestTimestamp = workoutTime;
        }

        const existingEx = target.exercisesMap.get(ex.exerciseName) || { sets: 0, volume: 0 };
        target.exercisesMap.set(ex.exerciseName, {
          sets: existingEx.sets + completedSets.length,
          volume: existingEx.volume + volume
        });
      });
    });

    const result: Record<MuscleKey, MuscleStats> = {} as Record<MuscleKey, MuscleStats>;

    (Object.keys(baseMuscles) as MuscleKey[]).forEach((k) => {
      const item = baseMuscles[k];
      let heatLevel: 0 | 1 | 2 | 3 | 4 = 0;
      if (item.setsCount >= 14) heatLevel = 4;
      else if (item.setsCount >= 9) heatLevel = 3;
      else if (item.setsCount >= 5) heatLevel = 2;
      else if (item.setsCount >= 1) heatLevel = 1;

      let lastTrainedDaysAgo: number | null = null;
      let recoveryStatus: 'Rested' | 'Recovering' | 'Ready' = 'Rested';
      let recoveryPercent = 100;

      if (item.latestTimestamp) {
        const diffDays = Math.max(0, Math.round((now - item.latestTimestamp) / (24 * 60 * 60 * 1000)));
        lastTrainedDaysAgo = diffDays;

        if (diffDays <= 1) {
          recoveryStatus = 'Recovering';
          recoveryPercent = 40;
        } else if (diffDays === 2) {
          recoveryStatus = 'Recovering';
          recoveryPercent = 70;
        } else if (diffDays >= 3) {
          recoveryStatus = 'Ready';
          recoveryPercent = 100;
        }
      }

      const exercisesUsed = Array.from(item.exercisesMap.entries()).map(([name, data]) => ({
        name,
        sets: data.sets,
        volume: data.volume
      }));

      result[k] = {
        key: k,
        displayName: item.displayName,
        category: item.category,
        setsCount: item.setsCount,
        totalVolume: item.totalVolume,
        exercisesUsed,
        lastTrainedDaysAgo,
        heatLevel,
        recoveryStatus,
        recoveryPercent
      };
    });

    return result;
  }, [history, timeRangeDays]);

  const muscleMapValues = useMemo<MuscleMapValues>(() => {
    const totals: Partial<Record<MuscleGroup, { weightedSets: number; workouts: Set<string> }>> = {};
    const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
    const cutoffTime = Date.now() - timeRangeDays * 24 * 60 * 60 * 1000;

    const categoryFallback: Partial<Record<Exercise['category'], MuscleGroup>> = {
      Chest: 'CHEST',
      Back: 'LATS',
      Shoulders: 'SHOULDERS_SIDE',
      Quads: 'QUADS',
      Hamstrings: 'HAMSTRINGS',
      Glutes: 'GLUTES',
      Biceps: 'BICEPS',
      Forearms: 'FOREARMS',
      Triceps: 'TRICEPS',
      Core: 'CORE',
      Calves: 'CALVES',
    };

    const addSets = (group: MuscleGroup, count: number, workoutId: string) => {
      // The bundled figure currently has no traced surfaces for these groups.
      if (group === 'HIP_FLEXORS' || group === 'BACK_UPPER') return;
      const total = totals[group] ?? { weightedSets: 0, workouts: new Set<string>() };
      total.weightedSets += count;
      total.workouts.add(workoutId);
      totals[group] = total;
    };

    history
      .filter((workout) => new Date(workout.date).getTime() >= cutoffTime)
      .forEach((workout) => {
        workout.exercises.forEach((loggedExercise) => {
          const completedSets = loggedExercise.sets.filter((set) => set.completed);
          if (completedSets.length === 0) return;

          const exercise = exerciseById.get(loggedExercise.exerciseId);
          const primaryGroups = [...new Set((exercise?.primaryMuscles ?? []).flatMap(mapAnatomyName))];
          const secondaryGroups = [...new Set((exercise?.secondaryMuscles ?? []).flatMap(mapAnatomyName))]
            .filter((group) => !primaryGroups.includes(group));
          const targets = primaryGroups.length > 0
            ? primaryGroups
            : [mapAnatomyName(loggedExercise.exerciseName)[0] ?? categoryFallback[loggedExercise.category]].filter(
                (group): group is MuscleGroup => Boolean(group)
              );

          targets.forEach((group) => addSets(group, completedSets.length, workout.id));
          secondaryGroups.forEach((group) => addSets(group, completedSets.length * 0.5, workout.id));
        });
      });

    return Object.fromEntries(
      Object.entries(totals).map(([group, total]) => [group, {
        score: Math.min(100, (total.weightedSets / 14) * 100),
        sets: Math.round(total.weightedSets * 10) / 10,
        sessions: total.workouts.size,
      }])
    ) as MuscleMapValues;
  }, [exercises, history, timeRangeDays]);

  const totalSetsLogged = Object.values(muscleData).reduce((sum, m) => sum + m.setsCount, 0);
  const activeMusclesCount = Object.values(muscleData).filter((m) => m.setsCount > 0).length;
  const coveragePercent = Math.round((activeMusclesCount / Object.keys(muscleData).length) * 100);

  const topMuscle = useMemo(() => {
    return Object.values(muscleData).reduce((max, cur) => (cur.setsCount > max.setsCount ? cur : max), muscleData.Chest);
  }, [muscleData]);

  const filteredMuscles = useMemo(() => {
    return Object.values(muscleData).filter((m) => {
      if (activeSplitFilter === 'All') return true;
      return m.category === activeSplitFilter;
    });
  }, [muscleData, activeSplitFilter]);

  const selectedStats = muscleData[selectedMuscle];
  const activeFocusMuscle = hoveredMuscle ? muscleData[hoveredMuscle] : selectedStats;

  return (
    <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl flex flex-col gap-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-neutral-500 via-neutral-600 to-neutral-600 p-0.5 shadow-lg shadow-neutral-500/20">
            <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center text-neutral-400">
              <Flame className="w-4 h-4 fill-neutral-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Muscle Engagement Heat Map
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-500/15 text-neutral-300 border border-neutral-500/30 px-2 py-0.5 rounded-full">
                Interactive Biometrics
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Modern athletic anatomical silhouette with interactive volume and recovery distribution
            </p>
          </div>
        </div>

        {/* View Controls & Time Range */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Orientation View Switcher */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setViewOrientation('both')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                viewOrientation === 'both'
                  ? 'bg-neutral-800 text-neutral-400 border border-neutral-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewOrientation('front')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                viewOrientation === 'front'
                  ? 'bg-neutral-800 text-neutral-400 border border-neutral-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() => setViewOrientation('back')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                viewOrientation === 'back'
                  ? 'bg-neutral-800 text-neutral-400 border border-neutral-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Posterior
            </button>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setTimeRangeDays(7)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                timeRangeDays === 7
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRangeDays(14)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                timeRangeDays === 14
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              14 Days
            </button>
          </div>
        </div>
      </div>

      {/* Overall summary, separate from the selected muscle diagnostics below. */}
      <div className="flex items-center justify-between gap-2 -mb-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
        <span>Overall training</span>
        <span>All muscle groups · Last {timeRangeDays} days</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-neutral-950/80 border border-neutral-800 p-3 rounded-2xl flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-neutral-400" />
            Body Coverage
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-neutral-400 tabular-nums">
            {coveragePercent}%
          </span>
          <span className="text-[10px] text-neutral-400">
            {activeMusclesCount} of 10 groups stimulated
          </span>
        </div>

        <div className="bg-neutral-950/80 border border-neutral-800 p-3 rounded-2xl flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Flame className="w-3 h-3 text-emerald-400" />
            Highest Heat
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-white truncate">
            {topMuscle.displayName.split(' ')[0]}
          </span>
          <span className="text-[10px] text-emerald-400 font-medium tabular-nums">
            {topMuscle.setsCount} sets · {(topMuscle.totalVolume / 1000).toFixed(1)}k {settings.weightUnit}
          </span>
        </div>

        <div className="bg-neutral-950/80 border border-neutral-800 p-3 rounded-2xl flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Dumbbell className="w-3 h-3 text-emerald-400" />
            Volume Sets Logged
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-400 tabular-nums">
            {totalSetsLogged}
          </span>
          <span className="text-[10px] text-neutral-400">Last {timeRangeDays} days</span>
        </div>
      </div>

      {/* Main Heatmap Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* MuscleMap male anatomy heat map */}
        <div className="lg:col-span-7 bg-neutral-950 rounded-2xl border border-neutral-800/90 p-4 flex flex-col gap-3 relative shadow-inner">
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800/80">
            <div className="flex items-center gap-2 min-w-0">
              <Crosshair className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0 text-xs">
                <span className="font-bold text-white">{selectedStats.displayName}</span>
                <span className="text-neutral-500"> · </span>
                <span className="text-neutral-400">{selectedStats.setsCount} completed sets</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${HEAT_LEVEL_METRICS[selectedStats.heatLevel].badgeBg}`}>
              {HEAT_LEVEL_METRICS[selectedStats.heatLevel].shortLabel}
            </span>
          </div>

          <div className="flex min-h-[300px] items-center justify-center py-2">
            <MuscleMap
              values={muscleMapValues}
              sex="MALE"
              view={viewOrientation === 'both' ? 'BOTH' : viewOrientation === 'front' ? 'FRONT' : 'BACK'}
              colorModel="LOAD"
              monochromeColor="#78b48f"
              monochromeBaseColor="#303932"
              glow
              showLegend={false}
              tooltipFields={['group', 'sets', 'sessions']}
              labels={MUSCLE_MAP_LABELS}
              figureWidth={220}
              backgroundImageFront={maleFront}
              backgroundImageBack={maleBack}
              backgroundGrayscale
              backgroundBrightness={1.05}
              backgroundOpacity={0.45}
              onSelectMuscle={({ group }) => {
                const muscle = MAP_GROUP_TO_MUSCLE[group];
                if (muscle) {
                  setSelectedMuscle(muscle);
                  setHoveredMuscle(null);
                }
              }}
              className={`muscle-map-figures ${viewOrientation === 'both' ? 'paired-view' : 'single-view'}`}
              style={{ width: '100%' }}
            />
          </div>

          <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              <span>Training volume</span>
              <span>Tap a muscle to inspect</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
              <span>Less</span>
              <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-neutral-700 via-emerald-800 to-emerald-300" />
              <span>More</span>
            </div>
          </div>
        </div>
        {/* Selected Muscle Diagnostic Panel & Exercises (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Target Group Diagnostic
                </span>
                <h4 className="text-base font-extrabold text-white">
                  {selectedStats.displayName}
                </h4>
              </div>

              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${HEAT_LEVEL_METRICS[selectedStats.heatLevel].badgeBg}`}>
                {HEAT_LEVEL_METRICS[selectedStats.heatLevel].shortLabel}
              </span>
            </div>

            {/* Metric Counters */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Sets Completed</span>
                <span className="text-lg font-extrabold font-mono text-neutral-400 tabular-nums">
                  {selectedStats.setsCount} <span className="text-xs font-normal text-neutral-400">/ 12 target</span>
                </span>
              </div>

              <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Volume</span>
                <span className="text-lg font-extrabold font-mono text-white tabular-nums">
                  {selectedStats.totalVolume.toLocaleString()}{' '}
                  <span className="text-[10px] text-neutral-400 font-normal">{settings.weightUnit}</span>
                </span>
              </div>
            </div>

            {/* Recovery Status Bar */}
            <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800/80 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  {selectedStats.recoveryStatus === 'Ready' || selectedStats.recoveryStatus === 'Rested' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-emerald-400" />
                  )}
                  Recovery Status: <span className="font-bold text-white">{selectedStats.recoveryStatus}</span>
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                  {selectedStats.recoveryPercent}%
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${selectedStats.recoveryPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-400">
                {selectedStats.lastTrainedDaysAgo !== null
                  ? `Last stimulated ${selectedStats.lastTrainedDaysAgo === 0 ? 'today' : `${selectedStats.lastTrainedDaysAgo} day(s) ago`}`
                  : `Untrained in the last ${timeRangeDays} days`}
              </span>
            </div>

            {/* Exercises Logged for this Muscle Group */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Contributing Exercises ({selectedStats.exercisesUsed.length})
              </span>
              {selectedStats.exercisesUsed.length === 0 ? (
                <div className="p-3 bg-neutral-900/50 rounded-xl border border-dashed border-neutral-800 text-center text-xs text-neutral-500 italic">
                  No sets logged for {selectedMuscle} in the past {timeRangeDays} days.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedStats.exercisesUsed.map((ex, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-white truncate block">{ex.name}</span>
                        <span className="text-[10px] text-neutral-400 tabular-nums">{ex.sets} completed sets</span>
                      </div>
                      <span className="font-mono font-bold text-neutral-400 text-[11px] shrink-0 tabular-nums">
                        {ex.volume.toLocaleString()} {settings.weightUnit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Muscle Group Engagement Matrix Grid */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            Full Muscle Group Engagement Matrix
          </h4>

          {/* Category Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            {(['All', 'Push', 'Pull', 'Legs', 'Core'] as const).map((split) => (
              <button
                key={split}
                onClick={() => setActiveSplitFilter(split)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  activeSplitFilter === split
                    ? 'bg-neutral-800 text-neutral-400 border border-neutral-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                {split}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {filteredMuscles.map((muscle) => {
            const isSelected = selectedMuscle === muscle.key;
            const isHovered = hoveredMuscle === muscle.key;
            const metric = HEAT_LEVEL_METRICS[muscle.heatLevel];

            return (
              <div
                key={muscle.key}
                onClick={() => setSelectedMuscle(muscle.key)}
                onMouseEnter={() => setHoveredMuscle(muscle.key)}
                onMouseLeave={() => setHoveredMuscle(null)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2 group ${
                  isSelected
                    ? 'bg-neutral-900 border-neutral-500 shadow-md shadow-neutral-500/10'
                    : isHovered
                    ? 'bg-neutral-900/90 border-neutral-500/50'
                    : 'bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      {muscle.category}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: metric.stroke }}
                      title={metric.label}
                    />
                  </div>
                  <h5 className="text-xs font-bold text-white group-hover:text-neutral-400 transition truncate">
                    {muscle.key}
                  </h5>
                </div>

                <div>
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-sm font-extrabold text-neutral-400 tabular-nums">
                      {muscle.setsCount}{' '}
                      <span className="text-[10px] font-normal text-neutral-400">sets</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 tabular-nums">
                      {muscle.lastTrainedDaysAgo !== null ? `${muscle.lastTrainedDaysAgo}d ago` : '—'}
                    </span>
                  </div>

                  {/* Volume progress bar */}
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (muscle.setsCount / 12) * 100)}%`,
                        backgroundColor: metric.stroke
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import { Flame, ShieldCheck, AlertCircle, ChevronRight, X } from 'lucide-react';
import { CompletedWorkout, Exercise, UserSettings } from '../types/fitness';
import { MuscleMap } from '@musclemap/react';
import type { MuscleGroup, MuscleMapValues } from '@musclemap/core';

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

type HeatMapRange = 'latest' | '7d' | '1m';

interface MuscleStats {
  key: MuscleKey;
  displayName: string;
  category: 'Push' | 'Pull' | 'Legs' | 'Core';
  setsCount: number;
  sessionsCount: number;
  totalVolume: number;
  exercisesUsed: { name: string; sets: number; volume: number }[];
  lastTrainedDaysAgo: number | null;
  latestWorkoutId: string | null;
  heatLevel: 0 | 1 | 2 | 3 | 4; // 0=cold, 1=light, 2=moderate, 3=optimal, 4=overdrive
  recoveryStatus: 'Rested' | 'Recovering' | 'Ready';
  recoveryPercent: number; // 0-100%
}


const MUSCLE_DESCRIPTIONS: Record<MuscleKey, string> = {
  Chest: 'The pectorals support pressing and pushing movements, including bench presses, push-ups and chest presses.',
  Back: 'The back includes the lats, traps and mid-back muscles used for pulling, rowing and keeping the torso stable.',
  Shoulders: 'The deltoids help raise and control the arms during presses, raises and many upper-body movements.',
  Quads: 'The quadriceps straighten the knee and drive the upward phase of squats, lunges and leg presses.',
  Hamstrings: 'The hamstrings bend the knee and extend the hip during hinges, curls and sprinting movements.',
  Glutes: 'The glutes extend and stabilize the hips during squats, hinges, lunges and hip thrusts.',
  Biceps: 'The biceps bend the elbow and assist with pulling movements such as curls and rows.',
  Forearms: 'The forearms support grip strength and control the wrists during lifting and carrying.',
  Triceps: 'The triceps straighten the elbow and contribute to presses, push-downs and overhead extensions.',
  Core: 'The core muscles brace and stabilize the trunk during lifts, carries and controlled movement.',
  Calves: 'The calf muscles point the foot and support ankle strength during raises, jumps and walking.'
};

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

const ANTERIOR_MAP_GROUPS: ReadonlySet<MuscleGroup> = new Set([
  'CHEST', 'SHOULDERS_FRONT', 'BICEPS', 'CORE', 'OBLIQUES', 'QUADS', 'ADDUCTORS'
]);
const POSTERIOR_MAP_GROUPS: ReadonlySet<MuscleGroup> = new Set([
  'BACK_UPPER', 'BACK_LOWER', 'TRAPEZIUS', 'RHOMBOIDS', 'LATS',
  'SHOULDERS_REAR', 'TRICEPS', 'GLUTES', 'HAMSTRINGS'
]);

type MuscleMapView = 'both' | 'front' | 'back';

const viewForMapGroups = (groups: MuscleGroup[]): MuscleMapView => {
  const hasAnterior = groups.some((group) => ANTERIOR_MAP_GROUPS.has(group));
  const hasPosterior = groups.some((group) => POSTERIOR_MAP_GROUPS.has(group));
  if (hasAnterior === hasPosterior) return 'both';
  return hasAnterior ? 'front' : 'back';
};

const viewForMuscle = (muscle: MuscleKey): MuscleMapView => {
  const groups = Object.entries(MAP_GROUP_TO_MUSCLE)
    .filter(([, mappedMuscle]) => mappedMuscle === muscle)
    .map(([group]) => group as MuscleGroup);
  return viewForMapGroups(groups);
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
  settings,
}) => {
  const [overviewTimeRange, setOverviewTimeRange] = useState<HeatMapRange>('latest');
  const [detailTimeRange, setDetailTimeRange] = useState<HeatMapRange>('latest');
  const changeOverviewTimeRange = setOverviewTimeRange;
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleKey>('Chest');
  const [isMuscleDetailsOpen, setIsMuscleDetailsOpen] = useState(false);
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleKey | null>(null);
  const [activeSplitFilter, setActiveSplitFilter] = useState<'All' | 'Push' | 'Pull' | 'Legs' | 'Core'>('All');
  const [viewOrientation, setViewOrientation] = useState<MuscleMapView>('both');
  const closeMuscleDetails = () => setIsMuscleDetailsOpen(false);
  const openMuscleDetails = (muscle: MuscleKey, groups?: MuscleGroup[]) => {
    setSelectedMuscle(muscle);
    setDetailTimeRange('latest');
    setViewOrientation(groups ? viewForMapGroups(groups) : viewForMuscle(muscle));
    setHoveredMuscle(null);
    setIsMuscleDetailsOpen(true);
  };

  const overviewWorkouts = useMemo(() => {
    const now = new Date();

    if (overviewTimeRange === 'latest') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const todayWorkouts = history.filter((workout) => {
        const timestamp = new Date(workout.date).getTime();
        return Number.isFinite(timestamp) && timestamp >= startOfToday && timestamp <= now.getTime();
      });
      if (todayWorkouts.length > 0) return todayWorkouts;

      const latestWorkout = history.reduce<CompletedWorkout | null>((latest, workout) => {
        if (!Number.isFinite(new Date(workout.date).getTime())) return latest;
        return !latest || new Date(workout.date).getTime() > new Date(latest.date).getTime() ? workout : latest;
      }, null);
      return latestWorkout ? [latestWorkout] : [];
    }

    const cutoff = new Date(now);
    if (overviewTimeRange === '7d') cutoff.setDate(cutoff.getDate() - 7);
    else cutoff.setDate(cutoff.getDate() - 30);
    return history.filter((workout) => {
      const timestamp = new Date(workout.date).getTime();
      return Number.isFinite(timestamp) && timestamp >= cutoff.getTime() && timestamp <= now.getTime();
    });
  }, [history, overviewTimeRange]);

  const overviewRangeDescription = useMemo(() => {
    if (overviewTimeRange === '7d') return 'Last 7 days';
    if (overviewTimeRange === '1m') return 'Last 30 days';
    if (overviewWorkouts.length === 0) return 'No workouts recorded';
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return overviewWorkouts.some((workout) => new Date(workout.date).getTime() >= startOfToday.getTime())
      ? 'Today’s workouts'
      : 'Latest recorded workout';
  }, [overviewWorkouts, overviewTimeRange]);

  // Compute muscle engagement analytics
  const buildMuscleData = (workouts: CompletedWorkout[]) => {
    const now = Date.now();

    const baseMuscles: Record<MuscleKey, {
      displayName: string;
      category: 'Push' | 'Pull' | 'Legs' | 'Core';
      setsCount: number;
      sessions: Set<string>;
      totalVolume: number;
      exercisesMap: Map<string, { sets: number; volume: number }>;
      latestTimestamp: number | null;
      latestWorkoutId: string | null;
    }> = {
      Chest: { displayName: 'Chest (Pectorals)', category: 'Push', setsCount: 0, sessions: new Set(), totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null, latestWorkoutId: null },
      Shoulders: { displayName: 'Shoulders (Deltoids)', category: 'Push', setsCount: 0, sessions: new Set(), totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null, latestWorkoutId: null },
      Triceps: { displayName: 'Triceps Brachii', category: 'Push', setsCount: 0, sessions: new Set(), totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null, latestWorkoutId: null },
      Back: { displayName: 'Back & Lats', category: 'Pull', setsCount: 0, sessions: new Set(), totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null, latestWorkoutId: null },
      Biceps: { displayName: 'Biceps Brachii', category: 'Pull', setsCount: 0, sessions: new Set(), totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null, latestWorkoutId: null },
      Forearms: { displayName: 'Forearms & Grip', category: 'Pull', setsCount: 0, sessions: new Set(), totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null, latestWorkoutId: null },
      Quads: { displayName: 'Quadriceps', category: 'Legs', setsCount: 0, sessions: new Set(), totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null, latestWorkoutId: null },
      Hamstrings: { displayName: 'Hamstrings', category: 'Legs', setsCount: 0, sessions: new Set(), totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null, latestWorkoutId: null },
      Glutes: { displayName: 'Gluteus Maximus', category: 'Legs', setsCount: 0, sessions: new Set(), totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null, latestWorkoutId: null },
      Calves: { displayName: 'Calves (Gastrocnemius)', category: 'Legs', setsCount: 0, sessions: new Set(), totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null, latestWorkoutId: null },
      Core: { displayName: 'Abs & Obliques', category: 'Core', setsCount: 0, sessions: new Set(), totalVolume: 0, exercisesMap: new Map(), latestTimestamp: null, latestWorkoutId: null },
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

    workouts.forEach((workout) => {
      const workoutTime = new Date(workout.date).getTime();

      workout.exercises.forEach((ex) => {
        const completedSets = ex.sets.filter((s) => s.completed);
        if (completedSets.length === 0) return;

        const muscleKey = resolveMuscleKey(ex.category || '', ex.exerciseName || '');
        const target = baseMuscles[muscleKey];
        if (!target) return;

        const volume = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
        target.setsCount += completedSets.length;
        target.sessions.add(workout.id);
        target.totalVolume += volume;

        if (!target.latestTimestamp || workoutTime > target.latestTimestamp) {
          target.latestTimestamp = workoutTime;
          target.latestWorkoutId = workout.id;
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
        sessionsCount: item.sessions.size,
        totalVolume: item.totalVolume,
        exercisesUsed,
        lastTrainedDaysAgo,
        latestWorkoutId: item.latestWorkoutId,
        heatLevel,
        recoveryStatus,
        recoveryPercent
      };
    });

    return result;
  };

  const muscleData = useMemo(() => buildMuscleData(overviewWorkouts), [overviewWorkouts]);
  const allHistoryMuscleData = useMemo(() => buildMuscleData(history), [history]);

  const latestSessionMuscleData = useMemo(() => {
    const latest: Partial<Record<MuscleKey, MuscleStats>> = {};
    (Object.keys(allHistoryMuscleData) as MuscleKey[]).forEach((muscle) => {
      const workoutId = allHistoryMuscleData[muscle].latestWorkoutId;
      const workout = workoutId ? history.find((entry) => entry.id === workoutId) : undefined;
      if (workout) latest[muscle] = buildMuscleData([workout])[muscle];
    });
    return latest;
  }, [allHistoryMuscleData, history]);

  const latestMuscleWorkoutId = allHistoryMuscleData[selectedMuscle].latestWorkoutId;
  const detailWorkouts = useMemo(() => {
    if (detailTimeRange === 'latest') {
      return latestMuscleWorkoutId
        ? history.filter((workout) => workout.id === latestMuscleWorkoutId)
        : [];
    }

    const cutoff = new Date();
    if (detailTimeRange === '7d') cutoff.setDate(cutoff.getDate() - 7);
    else cutoff.setDate(cutoff.getDate() - 30);
    return history.filter((workout) => {
      const timestamp = new Date(workout.date).getTime();
      return Number.isFinite(timestamp) && timestamp >= cutoff.getTime() && timestamp <= Date.now();
    });
  }, [detailTimeRange, history, latestMuscleWorkoutId]);

  const detailRangeDescription = useMemo(() => {
    if (detailTimeRange === '7d') return 'Last 7 days';
    if (detailTimeRange === '1m') return 'Last 30 days';
    if (detailWorkouts.length === 0) return 'No session recorded';
    const date = new Date(detailWorkouts[0].date);
    return `Latest session · ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [detailTimeRange, detailWorkouts]);

  const detailMuscleData = useMemo(() => buildMuscleData(detailWorkouts), [detailWorkouts]);
  const selectedDetailStats = detailMuscleData[selectedMuscle];
  const selectedRecoveryStats = allHistoryMuscleData[selectedMuscle];

  const overviewMuscleMapValues = useMemo<MuscleMapValues>(() => {
    const trainedGroups = Object.entries(MAP_GROUP_TO_MUSCLE)
      .filter(([, muscle]) => muscleData[muscle].setsCount > 0)
      .map(([group]) => [group, { score: 100 }]);
    return Object.fromEntries(trainedGroups) as MuscleMapValues;
  }, [muscleData]);

  const selectedMuscleMapValues = useMemo<MuscleMapValues>(() => {
    const selectedGroups = Object.entries(MAP_GROUP_TO_MUSCLE)
      .filter(([, muscle]) => muscle === selectedMuscle)
      .map(([group]) => [group, { score: 100 }]);
    return Object.fromEntries(selectedGroups) as MuscleMapValues;
  }, [selectedMuscle]);
  const selectedStats = selectedDetailStats;
  const trainedMuscleCount = Object.values(muscleData).filter((muscle) => muscle.setsCount > 0).length;
  const totalCompletedSets = overviewWorkouts.reduce((total, workout) => total + workout.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0), 0);

  const filteredMuscles = useMemo(() => {
    return Object.values(allHistoryMuscleData).filter((m) => {
      if (activeSplitFilter === 'All') return true;
      return m.category === activeSplitFilter;
    });
  }, [allHistoryMuscleData, activeSplitFilter]);

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
                Muscle engagement
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-500/15 text-neutral-300 border border-neutral-500/30 px-2 py-0.5 rounded-full">
                Interactive map
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Choose a period above, then tap a muscle for details
            </p>
          </div>
        </div>

        {/* Map View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Orientation View Switcher */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setViewOrientation('both')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                viewOrientation === 'both'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shadow-sm'
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

        </div>
      </div>

      {/* Full period overview map */}
      <section className="flex flex-col gap-4" aria-label="Muscle engagement overview">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-inner">
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1" role="group" aria-label="Muscle map date range">
            {([
              ['latest', 'Today / latest'],
              ['7d', '7 days'],
              ['1m', '1 month']
            ] as const).map(([range, label]) => (
              <button
                key={range}
                type="button"
                aria-pressed={overviewTimeRange === range}
                onClick={() => changeOverviewTimeRange(range)}
                className={`min-h-9 rounded-lg px-1.5 text-[10px] font-bold transition sm:px-2 ${
                  overviewTimeRange === range ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-extrabold text-white">Full-body map</h4>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-200">
                  {overviewRangeDescription}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-neutral-400">
                {trainedMuscleCount} of 11 groups trained · {overviewWorkouts.length} {overviewWorkouts.length === 1 ? 'workout' : 'workouts'} · {totalCompletedSets} completed sets
              </p>
            </div>
          </div>

          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-neutral-800/80 bg-[#080b09] px-2 py-3 sm:min-h-[350px]">
            <MuscleMap
              values={overviewMuscleMapValues}
              sex="MALE"
              view={viewOrientation === 'both' ? 'BOTH' : viewOrientation === 'front' ? 'FRONT' : 'BACK'}
              monochromeColor="#4fbd80"
              monochromeBaseColor="#515459"
              glow={false}
              showLegend={false}
              tooltipFields={[]}
              labels={MUSCLE_MAP_LABELS}
              figureWidth={250}
              onSelectMuscle={({ group }) => {
                const muscle = MAP_GROUP_TO_MUSCLE[group];
                if (muscle) openMuscleDetails(muscle, [group]);
              }}
              className={`muscle-map-figures ${viewOrientation === 'both' ? 'paired-view' : 'single-view'}`}
              style={{ width: '100%' }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800 pt-3 text-[10px] text-neutral-400">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />Trained in this period</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#515459]" />No sets in this period</span>
            <span className="w-full text-neutral-500 sm:w-auto">Tap a highlighted muscle or a group below for more detail</span>
          </div>
        </div>
      </section>

      {/* Muscle Group Engagement Matrix Grid */}
      <section aria-label="Muscle group breakdown" className="flex flex-col gap-3 border-t border-neutral-800 pt-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-white">Muscle group breakdown</h4>
            <p className="text-[10px] text-neutral-400">{overviewRangeDescription} on the map · tiles preview each group’s latest session and recovery</p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-300">Tap a tile for details <ChevronRight className="inline h-3 w-3" /></span>
        </div>
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-neutral-500">Filter groups</span>

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
            const isSelected = isMuscleDetailsOpen && selectedMuscle === muscle.key;
            const isHovered = hoveredMuscle === muscle.key;
            const latestSession = latestSessionMuscleData[muscle.key];
            const muscleRecovery = allHistoryMuscleData[muscle.key];

            return (
              <button
                key={muscle.key}
                type="button"
                onClick={() => openMuscleDetails(muscle.key)}
                onMouseEnter={() => setHoveredMuscle(muscle.key)}
                onMouseLeave={() => setHoveredMuscle(null)}
                aria-haspopup="dialog"
                aria-label={`Open ${muscle.key} muscle details. ${latestSession ? `${latestSession.setsCount} sets in the latest session` : 'No logged session'}`}
                className={`flex min-h-[84px] w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition group ${
                  isSelected
                    ? 'bg-neutral-900 border-emerald-500/40 shadow-md shadow-emerald-500/5'
                    : isHovered
                    ? 'bg-neutral-900/90 border-neutral-600/70'
                    : 'bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-600 hover:bg-neutral-900/60'
                }`}
              >
                <span className="min-w-0">
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-neutral-500">{muscle.category}</span>
                  <span className="block truncate text-xs font-bold text-white">{muscle.key}</span>
                  <span className="mt-1 block truncate text-[10px] font-medium text-neutral-300">
                    {latestSession ? `${latestSession.setsCount} sets · latest session` : 'No session logged'}
                  </span>
                  <span className="mt-1 block text-[9px] font-semibold text-neutral-400">
                    {muscleRecovery.lastTrainedDaysAgo !== null
                      ? `Last trained ${muscleRecovery.lastTrainedDaysAgo === 0 ? 'today' : `${muscleRecovery.lastTrainedDaysAgo}d ago`}`
                      : 'No training history'} <span className="text-emerald-300">· Tap for details</span>
                  </span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-neutral-700 bg-neutral-900 text-emerald-300 transition group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10" aria-hidden="true">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      </section>

      {isMuscleDetailsOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={closeMuscleDetails}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="muscle-details-title"
            className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-neutral-700 bg-neutral-950 shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-800 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[.12em] text-emerald-300">Muscle group details</p>
                <h3 id="muscle-details-title" className="mt-1 truncate text-lg font-extrabold text-white">{selectedMuscle}</h3>
                <p className="mt-1 text-[10px] text-neutral-400">{detailRangeDescription} · personal to this muscle</p>
              </div>
              <button
                type="button"
                onClick={closeMuscleDetails}
                aria-label="Close muscle details"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 transition hover:border-neutral-600 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                    {selectedRecoveryStats.recoveryStatus === 'Ready' || selectedRecoveryStats.recoveryStatus === 'Rested'
                      ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      : <AlertCircle className="h-3.5 w-3.5 text-emerald-400" />}
                    <span>Recovery · {selectedRecoveryStats.displayName}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-extrabold text-white">
                    {selectedRecoveryStats.recoveryStatus}
                    <span className="text-[10px] font-medium text-neutral-400"> · {selectedRecoveryStats.lastTrainedDaysAgo !== null
                      ? selectedRecoveryStats.lastTrainedDaysAgo === 0 ? 'trained today' : `last trained ${selectedRecoveryStats.lastTrainedDaysAgo}d ago`
                      : 'no training history'}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-neutral-400">
                    {selectedStats.setsCount} completed sets · {selectedStats.sessionsCount} {selectedStats.sessionsCount === 1 ? 'session' : 'sessions'} · {selectedStats.totalVolume.toLocaleString()} {settings.weightUnit}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-800">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${selectedRecoveryStats.recoveryPercent}%` }} />
                  </div>
                  <p className="mt-1 text-[9px] text-neutral-500">Recovery estimate · {selectedRecoveryStats.recoveryPercent}%</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wide ${HEAT_LEVEL_METRICS[selectedStats.heatLevel].badgeBg}`}>
                  {HEAT_LEVEL_METRICS[selectedStats.heatLevel].shortLabel}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1" role="group" aria-label="Muscle detail date range">
                {([
                  ['latest', 'Latest session'],
                  ['7d', '7 days'],
                  ['1m', '1 month']
                ] as const).map(([range, label]) => (
                  <button
                    key={range}
                    type="button"
                    aria-pressed={detailTimeRange === range}
                    onClick={() => setDetailTimeRange(range)}
                    className={`min-h-9 rounded-lg px-1.5 text-[10px] font-bold transition sm:px-2 ${
                      detailTimeRange === range ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex min-h-[250px] items-center justify-center rounded-2xl border border-neutral-800 bg-[#080b09] px-2 py-3">
                <MuscleMap
                  values={selectedMuscleMapValues}
                  sex="MALE"
                  view={viewOrientation === 'both' ? 'BOTH' : viewOrientation === 'front' ? 'FRONT' : 'BACK'}
                  monochromeColor="#4fbd80"
                  monochromeBaseColor="#515459"
                  glow={false}
                  showLegend={false}
                  tooltipFields={[]}
                  labels={MUSCLE_MAP_LABELS}
                  figureWidth={235}
                  onSelectMuscle={({ group }) => {
                    const muscle = MAP_GROUP_TO_MUSCLE[group];
                    if (muscle) openMuscleDetails(muscle, [group]);
                  }}
                  className={`muscle-map-figures ${viewOrientation === 'both' ? 'paired-view' : 'single-view'}`}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3.5">
                <p className="text-[9px] font-bold uppercase tracking-[.12em] text-emerald-300">Target group</p>
                <h4 className="mt-1 text-sm font-extrabold text-white">{selectedStats.displayName}</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-300">{MUSCLE_DESCRIPTIONS[selectedMuscle]}</p>
              </div>

              <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Contributing exercises</h4>
                {selectedStats.exercisesUsed.length === 0 ? (
                  <p className="mt-2 rounded-xl border border-dashed border-neutral-700 p-3 text-center text-[11px] text-neutral-400">No sets logged for {selectedMuscle} during {detailRangeDescription.toLowerCase()}.</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {selectedStats.exercisesUsed.map((exercise, index) => (
                      <div key={`${exercise.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-neutral-950 px-3 py-2">
                        <span className="min-w-0">
                          <strong className="block truncate text-[11px] text-white">{exercise.name}</strong>
                          <span className="text-[9px] text-neutral-400">{exercise.sets} completed sets</span>
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-neutral-300">{exercise.volume.toLocaleString()} {settings.weightUnit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={closeMuscleDetails} className="mt-3 min-h-10 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-neutral-950 transition hover:bg-emerald-400">Close details</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};


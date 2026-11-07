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
      if (lowerCat.includes('back') || lowerName.includes('deadlift') || lowerName.includes('row') || lowerName.includes('lat') || lowerName.includes('pull-up')) return 'Back';
      if (lowerCat.includes('shoulder') || (lowerName.includes('press') && !lowerName.includes('bench') && !lowerName.includes('leg')) || lowerName.includes('lateral raise') || lowerName.includes('face pull')) return 'Shoulders';
      if (lowerCat.includes('quad') || lowerName.includes('squat') || lowerName.includes('leg press') || lowerName.includes('lunge') || lowerName.includes('leg extension')) return 'Quads';
      if (lowerCat.includes('hamstring') || lowerName.includes('rdl') || lowerName.includes('romanian') || lowerName.includes('leg curl')) return 'Hamstrings';
      if (lowerCat.includes('glute') || lowerName.includes('hip thrust')) return 'Glutes';
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

  // Muscle rendering helper
  const getMuscleProps = (muscleKey: MuscleKey) => {
    const stat = muscleData[muscleKey];
    const isSelected = selectedMuscle === muscleKey;
    const isHovered = hoveredMuscle === muscleKey;
    const metric = HEAT_LEVEL_METRICS[stat.heatLevel];

    return {
      fill: metric.fillGrad,
      stroke: isSelected ? '#38bdf8' : isHovered ? '#67e8f9' : metric.stroke,
      strokeWidth: isSelected ? 2.2 : isHovered ? 1.8 : 1.1,
      filter: isSelected ? 'url(#activeGlow)' : isHovered ? 'url(#hoverGlow)' : undefined,
      className: 'transition-all duration-200 cursor-pointer hover:opacity-95'
    };
  };

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

      {/* Top 3 Diagnostic Cards */}
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
        {/* Modern Interactive Anatomical Silhouette Canvas (7 Cols) */}
        <div className="lg:col-span-7 bg-neutral-950 rounded-2xl border border-neutral-800/90 p-4 flex flex-col gap-3 relative overflow-hidden shadow-inner">
          {/* Subtle cyber background grid decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e2433_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Interactive Live HUD Banner */}
          <div className="relative z-10 flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-neutral-400 animate-pulse" />
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-white">
                  {activeFocusMuscle.displayName}
                </span>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-400">
                  {activeFocusMuscle.setsCount} completed sets
                </span>
                <span className="text-neutral-500">·</span>
                <span className="font-mono text-neutral-300 font-semibold tabular-nums">
                  {activeFocusMuscle.totalVolume.toLocaleString()} {settings.weightUnit}
                </span>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${HEAT_LEVEL_METRICS[activeFocusMuscle.heatLevel].badgeBg}`}>
              {HEAT_LEVEL_METRICS[activeFocusMuscle.heatLevel].shortLabel}
            </span>
          </div>

          {/* Dual/Single SVG Silhouette Render Container */}
          <div className="relative z-10 flex flex-row items-center justify-around py-3 px-1 min-h-[360px]">
            {/* FRONT (ANTERIOR) ATHLETIC SILHOUETTE */}
            {(viewOrientation === 'both' || viewOrientation === 'front') && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                    Anterior (Front)
                  </span>
                </div>

                <svg
                  viewBox="0 0 200 360"
                  className={`${viewOrientation === 'front' ? 'w-56 sm:w-64 h-96 sm:h-[420px]' : 'w-40 sm:w-48 h-80 sm:h-96'} select-none`}
                >
                  <defs>
                    {/* Thermal Heat Level Volumetric Gradients */}
                    <linearGradient id="gradHeat0" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1a1e29" />
                      <stop offset="50%" stopColor="#141720" />
                      <stop offset="100%" stopColor="#0d0f14" />
                    </linearGradient>

                    <linearGradient id="gradHeat1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="60%" stopColor="#0d9488" />
                      <stop offset="100%" stopColor="#042f2e" />
                    </linearGradient>

                    <linearGradient id="gradHeat2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="60%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#172554" />
                    </linearGradient>

                    <linearGradient id="gradHeat3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="60%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#451a03" />
                    </linearGradient>

                    <linearGradient id="gradHeat4" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="60%" stopColor="#e11d48" />
                      <stop offset="100%" stopColor="#4c0519" />
                    </linearGradient>

                    {/* Active & Hover Glow Filters */}
                    <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.8" />
                      <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#0284c7" floodOpacity="0.4" />
                    </filter>
                    <filter id="hoverGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#67e8f9" floodOpacity="0.7" />
                    </filter>
                  </defs>

                  {/* Structural Base Guidelines (Athletic Wireframe Accents) */}
                  <g opacity="0.3">
                    <line x1="100" y1="10" x2="100" y2="355" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 4" />
                    <line x1="40" y1="54" x2="160" y2="54" stroke="#334155" strokeWidth="0.6" strokeDasharray="2 3" />
                    <line x1="60" y1="144" x2="140" y2="144" stroke="#334155" strokeWidth="0.6" strokeDasharray="2 3" />
                    <line x1="65" y1="258" x2="135" y2="258" stroke="#334155" strokeWidth="0.6" strokeDasharray="2 3" />
                  </g>

                  {/* Head & Athletic Jawline */}
                  <g className="cursor-default">
                    <ellipse cx="100" cy="24" rx="12" ry="16" fill="#141822" stroke="#252c3d" strokeWidth="1.2" />
                    <path d="M92,28 Q100,38 108,28" fill="none" stroke="#252c3d" strokeWidth="1" />
                    <path d="M94,37 L106,37 L105,48 L95,48 Z" fill="#141822" stroke="#252c3d" strokeWidth="1" />
                    {/* Clavicle / Collarbones */}
                    <path d="M72,52 Q86,55 96,52" fill="none" stroke="#2a3346" strokeWidth="1.2" />
                    <path d="M128,52 Q114,55 104,52" fill="none" stroke="#2a3346" strokeWidth="1.2" />
                  </g>

                  {/* SHOULDERS (DELTOIDS) */}
                  <g
                    onClick={() => setSelectedMuscle('Shoulders')}
                    onMouseEnter={() => setHoveredMuscle('Shoulders')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Left Deltoid */}
                    <path
                      d="M66,54 C58,54 47,60 44,72 C42,83 46,93 52,98 C57,98 62,88 64,76 C65,68 66,58 66,54 Z"
                      {...getMuscleProps('Shoulders')}
                    />
                    {/* Right Deltoid */}
                    <path
                      d="M134,54 C142,54 153,60 156,72 C158,83 154,93 148,98 C143,98 138,88 136,76 C135,68 134,58 134,54 Z"
                      {...getMuscleProps('Shoulders')}
                    />
                  </g>

                  {/* CHEST (PECTORALS) */}
                  <g
                    onClick={() => setSelectedMuscle('Chest')}
                    onMouseEnter={() => setHoveredMuscle('Chest')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Left Pectoral */}
                    <path
                      d="M68,56 C78,54 94,54 97,56 C98,68 98,84 97,94 C92,98 76,98 68,90 C64,84 65,68 68,56 Z"
                      {...getMuscleProps('Chest')}
                    />
                    {/* Right Pectoral */}
                    <path
                      d="M132,56 C122,54 106,54 103,56 C102,68 102,84 103,94 C108,98 124,98 132,90 C136,84 135,68 132,56 Z"
                      {...getMuscleProps('Chest')}
                    />
                    {/* Inner Sternum Divider Line */}
                    <line x1="100" y1="56" x2="100" y2="94" stroke="#0a0d14" strokeWidth="1.5" opacity="0.6" />
                  </g>

                  {/* BICEPS */}
                  <g
                    onClick={() => setSelectedMuscle('Biceps')}
                    onMouseEnter={() => setHoveredMuscle('Biceps')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Left Bicep */}
                    <path
                      d="M48,98 C42,106 42,120 47,130 C53,128 55,116 54,102 C53,98 50,98 48,98 Z"
                      {...getMuscleProps('Biceps')}
                    />
                    {/* Right Bicep */}
                    <path
                      d="M152,98 C158,106 158,120 153,130 C147,128 145,116 146,102 C147,98 150,98 152,98 Z"
                      {...getMuscleProps('Biceps')}
                    />
                  </g>

                  {/* FOREARMS (Structural Neutral) */}
                  <g className="cursor-default">
                    {/* Left Forearm */}
                    <path
                      d="M46,132 C40,144 39,160 43,176 C47,174 49,162 51,146 C51,136 49,132 46,132 Z"
                      fill="#141822"
                      stroke="#252c3d"
                      strokeWidth="1.1"
                    />
                    {/* Right Forearm */}
                    <path
                      d="M154,132 C160,144 161,160 157,176 C153,174 151,162 149,146 C149,136 151,132 154,132 Z"
                      fill="#141822"
                      stroke="#252c3d"
                      strokeWidth="1.1"
                    />
                    {/* Hands */}
                    <path d="M41,178 C38,184 39,194 43,196 C45,196 46,190 44,180 Z" fill="#141822" stroke="#252c3d" strokeWidth="1" />
                    <path d="M159,178 C162,184 161,194 157,196 C155,196 154,190 156,180 Z" fill="#141822" stroke="#252c3d" strokeWidth="1" />
                  </g>

                  {/* CORE (ABS & EXTERNAL OBLIQUES) */}
                  <g
                    onClick={() => setSelectedMuscle('Core')}
                    onMouseEnter={() => setHoveredMuscle('Core')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Upper Abs Pair */}
                    <rect x="89" y="98" width="9" height="13" rx="2" {...getMuscleProps('Core')} />
                    <rect x="102" y="98" width="9" height="13" rx="2" {...getMuscleProps('Core')} />
                    {/* Mid Abs Pair */}
                    <rect x="89" y="113" width="9" height="13" rx="2" {...getMuscleProps('Core')} />
                    <rect x="102" y="113" width="9" height="13" rx="2" {...getMuscleProps('Core')} />
                    {/* Lower Abs Pair */}
                    <rect x="90" y="128" width="8" height="14" rx="2" {...getMuscleProps('Core')} />
                    <rect x="102" y="128" width="8" height="14" rx="2" {...getMuscleProps('Core')} />
                    {/* External Obliques / Serratus */}
                    <path
                      d="M72,96 C67,108 67,126 73,142 C78,142 84,140 88,138 C84,124 82,108 84,98 C78,96 74,96 72,96 Z"
                      {...getMuscleProps('Core')}
                    />
                    <path
                      d="M128,96 C133,108 133,126 127,142 C122,142 116,140 112,138 C116,124 118,108 116,98 C122,96 126,96 128,96 Z"
                      {...getMuscleProps('Core')}
                    />
                  </g>

                  {/* Pelvis / Inguinal Athletic Crease */}
                  <g className="cursor-default">
                    <path
                      d="M74,144 L92,158 L100,164 L108,158 L126,144 L114,148 L100,166 L86,148 Z"
                      fill="#141822"
                      stroke="#252c3d"
                      strokeWidth="1"
                    />
                  </g>

                  {/* QUADRICEPS */}
                  <g
                    onClick={() => setSelectedMuscle('Quads')}
                    onMouseEnter={() => setHoveredMuscle('Quads')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Left Quad Outer & Rectus Femoris */}
                    <path
                      d="M72,162 C62,176 58,206 64,236 C68,246 74,250 78,252 C81,252 82,246 82,238 C80,224 81,194 85,166 C79,163 74,162 72,162 Z"
                      {...getMuscleProps('Quads')}
                    />
                    {/* Left Quad Teardrop (Vastus Medialis) */}
                    <path
                      d="M86,168 C83,196 82,228 84,242 C85,252 90,252 93,248 C97,236 98,206 98,172 C93,169 89,168 86,168 Z"
                      {...getMuscleProps('Quads')}
                    />
                    {/* Right Quad Outer & Rectus Femoris */}
                    <path
                      d="M128,162 C138,176 142,206 136,236 C132,246 126,250 122,252 C119,252 118,246 118,238 C120,224 119,194 115,166 C121,163 126,162 128,162 Z"
                      {...getMuscleProps('Quads')}
                    />
                    {/* Right Quad Teardrop (Vastus Medialis) */}
                    <path
                      d="M114,168 C117,196 118,228 116,242 C115,252 110,252 107,248 C103,236 102,206 102,172 C107,169 111,168 114,168 Z"
                      {...getMuscleProps('Quads')}
                    />
                  </g>

                  {/* Knees / Patella */}
                  <g className="cursor-default">
                    <circle cx="80" cy="258" r="4.5" fill="#141822" stroke="#252c3d" strokeWidth="1" />
                    <circle cx="120" cy="258" r="4.5" fill="#141822" stroke="#252c3d" strokeWidth="1" />
                  </g>

                  {/* CALVES / SHINS */}
                  <g
                    onClick={() => setSelectedMuscle('Calves')}
                    onMouseEnter={() => setHoveredMuscle('Calves')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Left Calf Outer & Anterior Tibialis */}
                    <path
                      d="M74,268 C66,280 65,302 70,328 C74,342 77,344 79,344 C82,344 83,334 83,318 C83,298 84,280 84,268 C80,267 76,267 74,268 Z"
                      {...getMuscleProps('Calves')}
                    />
                    {/* Left Calf Inner Belly */}
                    <path
                      d="M85,268 C85,284 86,306 87,322 C88,336 91,342 92,342 C94,342 95,330 96,312 C96,290 94,272 90,268 Z"
                      {...getMuscleProps('Calves')}
                    />
                    {/* Right Calf Outer & Anterior Tibialis */}
                    <path
                      d="M126,268 C134,280 135,302 130,328 C126,342 123,344 121,344 C118,344 117,334 117,318 C117,298 116,280 116,268 C120,267 124,267 126,268 Z"
                      {...getMuscleProps('Calves')}
                    />
                    {/* Right Calf Inner Belly */}
                    <path
                      d="M115,268 C115,284 114,306 113,322 C112,336 109,342 108,342 C106,342 105,330 104,312 C104,290 106,272 110,268 Z"
                      {...getMuscleProps('Calves')}
                    />
                  </g>

                  {/* Feet */}
                  <g className="cursor-default">
                    <path d="M72,346 C66,350 64,356 68,358 C74,358 84,358 84,350 Z" fill="#141822" stroke="#252c3d" strokeWidth="1" />
                    <path d="M128,346 C134,350 136,356 132,358 C126,358 116,358 116,350 Z" fill="#141822" stroke="#252c3d" strokeWidth="1" />
                  </g>
                </svg>
              </div>
            )}

            {/* BACK (POSTERIOR) ATHLETIC SILHOUETTE */}
            {(viewOrientation === 'both' || viewOrientation === 'back') && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                    Posterior (Back)
                  </span>
                </div>

                <svg
                  viewBox="0 0 200 360"
                  className={`${viewOrientation === 'back' ? 'w-56 sm:w-64 h-96 sm:h-[420px]' : 'w-40 sm:w-48 h-80 sm:h-96'} select-none`}
                >
                  {/* Subtle guidelines */}
                  <g opacity="0.3">
                    <line x1="100" y1="10" x2="100" y2="355" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 4" />
                    <line x1="40" y1="54" x2="160" y2="54" stroke="#334155" strokeWidth="0.6" strokeDasharray="2 3" />
                    <line x1="60" y1="152" x2="140" y2="152" stroke="#334155" strokeWidth="0.6" strokeDasharray="2 3" />
                  </g>

                  {/* Head & Cervical Neck */}
                  <g className="cursor-default">
                    <ellipse cx="100" cy="24" rx="12" ry="16" fill="#141822" stroke="#252c3d" strokeWidth="1.2" />
                    <path d="M94,36 L106,36 L105,48 L95,48 Z" fill="#141822" stroke="#252c3d" strokeWidth="1" />
                  </g>

                  {/* TRAPEZIUS & UPPER BACK (MAPPED TO BACK) */}
                  <g
                    onClick={() => setSelectedMuscle('Back')}
                    onMouseEnter={() => setHoveredMuscle('Back')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Athletic Diamond Trapezius */}
                    <path
                      d="M93,36 L107,36 L118,52 L128,54 L114,74 L100,102 L86,74 L72,54 L82,52 Z"
                      {...getMuscleProps('Back')}
                    />
                  </g>

                  {/* REAR DELTOIDS (MAPPED TO SHOULDERS) */}
                  <g
                    onClick={() => setSelectedMuscle('Shoulders')}
                    onMouseEnter={() => setHoveredMuscle('Shoulders')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Left Rear Delt */}
                    <path
                      d="M66,54 C58,54 47,60 44,72 C42,83 46,93 52,98 C56,98 62,88 64,74 C65,66 66,58 66,54 Z"
                      {...getMuscleProps('Shoulders')}
                    />
                    {/* Right Rear Delt */}
                    <path
                      d="M134,54 C142,54 153,60 156,72 C158,83 154,93 148,98 C144,98 138,88 136,74 C135,66 134,58 134,54 Z"
                      {...getMuscleProps('Shoulders')}
                    />
                  </g>

                  {/* LATS (LATISSIMUS DORSI) & LOWER BACK ERECTORS (MAPPED TO BACK) */}
                  <g
                    onClick={() => setSelectedMuscle('Back')}
                    onMouseEnter={() => setHoveredMuscle('Back')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Left Lat Wing (V-Taper sweep) */}
                    <path
                      d="M84,76 L98,102 L98,142 C92,142 84,136 78,124 C72,112 70,92 78,78 Z"
                      {...getMuscleProps('Back')}
                    />
                    {/* Right Lat Wing */}
                    <path
                      d="M116,76 L102,102 L102,142 C108,142 116,136 122,124 C128,112 130,92 122,78 Z"
                      {...getMuscleProps('Back')}
                    />
                    {/* Lower Back Spinal Erectors */}
                    <rect x="93" y="106" width="5" height="42" rx="1.5" {...getMuscleProps('Back')} />
                    <rect x="102" y="106" width="5" height="42" rx="1.5" {...getMuscleProps('Back')} />
                  </g>

                  {/* TRICEPS (POSTERIOR ARM VIEW) */}
                  <g
                    onClick={() => setSelectedMuscle('Triceps')}
                    onMouseEnter={() => setHoveredMuscle('Triceps')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Left Triceps */}
                    <path
                      d="M48,98 C42,106 42,122 47,132 C52,130 55,118 55,104 C54,98 50,98 48,98 Z"
                      {...getMuscleProps('Triceps')}
                    />
                    {/* Right Triceps */}
                    <path
                      d="M152,98 C158,106 158,122 153,132 C148,130 145,118 145,104 C146,98 150,98 152,98 Z"
                      {...getMuscleProps('Triceps')}
                    />
                  </g>

                  {/* FOREARMS (POSTERIOR) */}
                  <g className="cursor-default">
                    <path d="M46,134 C40,144 39,160 43,176 C47,174 49,162 50,146 Z" fill="#141822" stroke="#252c3d" strokeWidth="1.1" />
                    <path d="M154,134 C160,144 161,160 157,176 C153,174 151,162 150,146 Z" fill="#141822" stroke="#252c3d" strokeWidth="1.1" />
                  </g>

                  {/* GLUTEUS MAXIMUS (GLUTES) */}
                  <g
                    onClick={() => setSelectedMuscle('Glutes')}
                    onMouseEnter={() => setHoveredMuscle('Glutes')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Left Glute */}
                    <path
                      d="M74,152 C84,150 97,152 98,154 L98,198 C92,204 82,204 74,196 C68,188 66,168 74,152 Z"
                      {...getMuscleProps('Glutes')}
                    />
                    {/* Right Glute */}
                    <path
                      d="M126,152 C116,150 103,152 102,154 L102,198 C108,204 118,204 126,196 C132,188 134,168 126,152 Z"
                      {...getMuscleProps('Glutes')}
                    />
                  </g>

                  {/* HAMSTRINGS */}
                  <g
                    onClick={() => setSelectedMuscle('Hamstrings')}
                    onMouseEnter={() => setHoveredMuscle('Hamstrings')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Left Hamstring Outer (Biceps femoris) */}
                    <path
                      d="M74,198 C68,212 66,236 72,256 C76,256 81,252 82,246 C80,230 81,208 86,198 Z"
                      {...getMuscleProps('Hamstrings')}
                    />
                    {/* Left Hamstring Inner (Semitendinosus) */}
                    <path
                      d="M87,198 C82,216 83,238 86,252 C90,252 94,248 96,236 C98,218 97,204 97,198 Z"
                      {...getMuscleProps('Hamstrings')}
                    />
                    {/* Right Hamstring Outer */}
                    <path
                      d="M126,198 C132,212 134,236 128,256 C124,256 119,252 118,246 C120,230 119,208 114,198 Z"
                      {...getMuscleProps('Hamstrings')}
                    />
                    {/* Right Hamstring Inner */}
                    <path
                      d="M113,198 C118,216 117,238 114,252 C110,252 106,248 104,236 C102,218 103,204 103,198 Z"
                      {...getMuscleProps('Hamstrings')}
                    />
                  </g>

                  {/* Knee Joints (Back/Popliteal fossa) */}
                  <g className="cursor-default">
                    <circle cx="80" cy="258" r="4" fill="#141822" stroke="#252c3d" strokeWidth="1" />
                    <circle cx="120" cy="258" r="4" fill="#141822" stroke="#252c3d" strokeWidth="1" />
                  </g>

                  {/* CALVES (POSTERIOR GASTROCNEMIUS DIAMOND HEADS) */}
                  <g
                    onClick={() => setSelectedMuscle('Calves')}
                    onMouseEnter={() => setHoveredMuscle('Calves')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    {/* Left Calf Lateral Head */}
                    <path
                      d="M72,264 C62,278 62,306 68,332 C72,338 76,338 78,336 C76,316 75,292 78,266 Z"
                      {...getMuscleProps('Calves')}
                    />
                    {/* Left Calf Medial Head */}
                    <path
                      d="M80,266 C80,290 82,316 85,334 C89,334 94,324 94,302 C94,284 90,270 85,266 Z"
                      {...getMuscleProps('Calves')}
                    />
                    {/* Right Calf Lateral Head */}
                    <path
                      d="M128,264 C138,278 138,306 132,332 C128,338 124,338 122,336 C124,316 125,292 122,266 Z"
                      {...getMuscleProps('Calves')}
                    />
                    {/* Right Calf Medial Head */}
                    <path
                      d="M120,266 C120,290 118,316 115,334 C111,334 106,324 106,302 C106,284 110,270 115,266 Z"
                      {...getMuscleProps('Calves')}
                    />
                  </g>

                  {/* Achilles Tendons & Heels */}
                  <g className="cursor-default">
                    <path d="M78,338 L84,338 L84,354 L76,354 Z" fill="#141822" stroke="#252c3d" strokeWidth="1" />
                    <path d="M122,338 L116,338 L116,354 L124,354 Z" fill="#141822" stroke="#252c3d" strokeWidth="1" />
                  </g>
                </svg>
              </div>
            )}
          </div>

          {/* Interactive Heat Intensity Scale Legend */}
          <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              <span>Heat Intensity Scale (Weekly Set Load)</span>
              <span>Click muscle to inspect</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
              {([0, 1, 2, 3, 4] as const).map((level) => {
                const metric = HEAT_LEVEL_METRICS[level];
                return (
                  <div
                    key={level}
                    className="p-1.5 rounded-xl border flex flex-col gap-0.5"
                    style={{
                      background: level === 0 ? '#11131a' : undefined,
                      borderColor: metric.stroke
                    }}
                  >
                    <div className="flex items-center justify-center gap-1 font-bold">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: metric.indicatorColor }}
                      />
                      <span className="truncate text-white">{metric.shortLabel}</span>
                    </div>
                    <span className="text-[9px] text-neutral-400 font-mono">
                      {metric.setsRange}
                    </span>
                  </div>
                );
              })}
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

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
      if (lowerCat.includes('back') || lowerName.includes('deadlift') || lowerName.includes('row') || lowerName.includes('lat') || lowerName.includes('pull-up')) return 'Back';
      if (lowerCat.includes('shoulder') || (lowerName.includes('press') && !lowerName.includes('bench') && !lowerName.includes('leg')) || lowerName.includes('lateral raise') || lowerName.includes('face pull')) return 'Shoulders';
      if (lowerCat.includes('quad') || lowerName.includes('squat') || lowerName.includes('leg press') || lowerName.includes('lunge') || lowerName.includes('leg extension')) return 'Quads';
      if (lowerCat.includes('hamstring') || lowerName.includes('rdl') || lowerName.includes('romanian') || lowerName.includes('leg curl')) return 'Hamstrings';
      if (lowerCat.includes('glute') || lowerName.includes('hip thrust')) return 'Glutes';
      if (lowerCat.includes('forearm') || lowerName.includes('wrist curl') || lowerName.includes('farmer carry')) return 'Forearms';
      if (lowerCat.includes('bicep') || lowerName.includes('curl')) return 'Biceps';
      if (lowerCat.includes('tricep') || lowerName.includ
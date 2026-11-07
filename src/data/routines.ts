import { RoutineTemplate } from '../types/fitness';

export const DEFAULT_ROUTINES: RoutineTemplate[] = [
  {
    id: 'push-hypertrophy',
    title: 'Push Power & Hypertrophy',
    description: 'Target chest, front/side delts, and triceps with heavy compound presses followed by high-tension isolation.',
    category: 'Push / Pull / Legs',
    difficulty: 'Intermediate',
    estimatedMinutes: 55,
    exercises: [
      { exerciseId: 'barbell-bench-press', defaultSets: 4, defaultReps: 8, targetRpe: 8 },
      { exerciseId: 'incline-dumbbell-press', defaultSets: 3, defaultReps: 10, targetRpe: 8 },
      { exerciseId: 'overhead-press', defaultSets: 3, defaultReps: 8, targetRpe: 8 },
      { exerciseId: 'dumbbell-lateral-raise', defaultSets: 4, defaultReps: 12, targetRpe: 9 },
      { exerciseId: 'tricep-rope-pushdown', defaultSets: 3, defaultReps: 12, targetRpe: 9 }
    ]
  },
  {
    id: 'pull-strength',
    title: 'Pull Density & Thickness',
    description: 'Heavy posterior chain loading with deadlifts, lat pulldowns, rows, face pulls and bicep volume.',
    category: 'Push / Pull / Legs',
    difficulty: 'Intermediate',
    estimatedMinutes: 60,
    exercises: [
      { exerciseId: 'barbell-deadlift', defaultSets: 4, defaultReps: 5, targetRpe: 8.5 },
      { exerciseId: 'lat-pulldown', defaultSets: 3, defaultReps: 10, targetRpe: 8 },
      { exerciseId: 'barbell-bent-over-row', defaultSets: 3, defaultReps: 8, targetRpe: 8 },
      { exerciseId: 'face-pull', defaultSets: 3, defaultReps: 15, targetRpe: 9 },
      { exerciseId: 'barbell-bicep-curl', defaultSets: 3, defaultReps: 10, targetRpe: 8.5 }
    ]
  },
  {
    id: 'legs-quad-focus',
    title: 'Legs & Core Builder',
    description: 'Quad and hamstring hypertrophy builder centered around the back squat and Romanian deadlift.',
    category: 'Push / Pull / Legs',
    difficulty: 'Advanced',
    estimatedMinutes: 65,
    exercises: [
      { exerciseId: 'barbell-back-squat', defaultSets: 4, defaultReps: 6, targetRpe: 8.5 },
      { exerciseId: 'romanian-deadlift', defaultSets: 3, defaultReps: 8, targetRpe: 8 },
      { exerciseId: 'leg-press', defaultSets: 3, defaultReps: 12, targetRpe: 8.5 },
      { exerciseId: 'standing-calf-raise', defaultSets: 4, defaultReps: 15, targetRpe: 9 },
      { exerciseId: 'hanging-leg-raise', defaultSets: 3, defaultReps: 12, targetRpe: 8 }
    ]
  },
  {
    id: 'upper-strength',
    title: 'Upper Body Heavy Focus',
    description: 'Balanced agonist-antagonist strength workout hitting all upper body musculature in one session.',
    category: 'Upper / Lower',
    difficulty: 'Intermediate',
    estimatedMinutes: 50,
    exercises: [
      { exerciseId: 'barbell-bench-press', defaultSets: 4, defaultReps: 6, targetRpe: 8.5 },
      { exerciseId: 'pull-ups', defaultSets: 3, defaultReps: 8, targetRpe: 8 },
      { exerciseId: 'overhead-press', defaultSets: 3, defaultReps: 6, targetRpe: 8 },
      { exerciseId: 'seated-cable-row', defaultSets: 3, defaultReps: 10, targetRpe: 8 },
      { exerciseId: 'skull-crushers', defaultSets: 3, defaultReps: 10, targetRpe: 8 }
    ]
  },
  {
    id: 'lower-strength',
    title: 'Lower Body Power & Hypertrophy',
    description: 'Complete lower body development targeting quads, hamstrings, glutes, calves, and deep core stability.',
    category: 'Upper / Lower',
    difficulty: 'Intermediate',
    estimatedMinutes: 55,
    exercises: [
      { exerciseId: 'barbell-back-squat', defaultSets: 4, defaultReps: 6, targetRpe: 8.5 },
      { exerciseId: 'romanian-deadlift', defaultSets: 3, defaultReps: 8, targetRpe: 8 },
      { exerciseId: 'leg-press', defaultSets: 3, defaultReps: 10, targetRpe: 8.5 },
      { exerciseId: 'lying-leg-curl', defaultSets: 3, defaultReps: 12, targetRpe: 9 },
      { exerciseId: 'standing-calf-raise', defaultSets: 4, defaultReps: 15, targetRpe: 8.5 },
      { exerciseId: 'hanging-leg-raise', defaultSets: 3, defaultReps: 12, targetRpe: 8 }
    ]
  },
  {
    id: 'full-body-quick',
    title: 'Full Body Athletic Engine',
    description: 'Time-efficient full body routine prioritizing high compound movement density.',
    category: 'Full Body',
    difficulty: 'Beginner',
    estimatedMinutes: 40,
    exercises: [
      { exerciseId: 'barbell-back-squat', defaultSets: 3, defaultReps: 8, targetRpe: 7.5 },
      { exerciseId: 'barbell-bench-press', defaultSets: 3, defaultReps: 8, targetRpe: 7.5 },
      { exerciseId: 'lat-pulldown', defaultSets: 3, defaultReps: 10, targetRpe: 8 },
      { exerciseId: 'dumbbell-lateral-raise', defaultSets: 3, defaultReps: 12, targetRpe: 8 }
    ]
  }
];


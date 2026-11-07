import { RoutineTemplate, CompletedWorkout, BodyWeightEntry } from '../types/fitness';

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

export const INITIAL_WORKOUT_HISTORY: CompletedWorkout[] = [
  {
    id: 'history-1',
    title: 'Push Power & Hypertrophy',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // Yesterday
    durationMinutes: 54,
    totalVolume: 14850,
    totalSets: 17,
    totalReps: 152,
    prsAchieved: [
      { exerciseName: 'Barbell Bench Press', description: 'Heaviest Weight', value: '225 lbs × 6 reps' },
      { exerciseName: 'Incline Dumbbell Press', description: 'Volume PR', value: '75 lbs × 10 reps' }
    ],
    exercises: [
      {
        id: 'we-1',
        exerciseId: 'barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        category: 'Chest',
        equipment: 'Barbell',
        restSeconds: 120,
        sets: [
          { id: 's-1', setNumber: 1, type: 'warmup', weight: 135, reps: 10, completed: true },
          { id: 's-2', setNumber: 2, type: 'normal', weight: 185, reps: 8, completed: true, rpe: 7.5 },
          { id: 's-3', setNumber: 3, type: 'normal', weight: 215, reps: 6, completed: true, rpe: 8 },
          { id: 's-4', setNumber: 4, type: 'normal', weight: 225, reps: 6, completed: true, rpe: 9 }
        ]
      },
      {
        id: 'we-2',
        exerciseId: 'incline-dumbbell-press',
        exerciseName: 'Incline Dumbbell Press',
        category: 'Chest',
        equipment: 'Dumbbell',
        restSeconds: 90,
        sets: [
          { id: 's-5', setNumber: 1, type: 'normal', weight: 65, reps: 10, completed: true },
          { id: 's-6', setNumber: 2, type: 'normal', weight: 70, reps: 10, completed: true },
          { id: 's-7', setNumber: 3, type: 'normal', weight: 75, reps: 10, completed: true, rpe: 8.5 }
        ]
      },
      {
        id: 'we-3',
        exerciseId: 'overhead-press',
        exerciseName: 'Standing Overhead Barbell Press',
        category: 'Shoulders',
        equipment: 'Barbell',
        restSeconds: 120,
        sets: [
          { id: 's-8', setNumber: 1, type: 'normal', weight: 115, reps: 8, completed: true },
          { id: 's-9', setNumber: 2, type: 'normal', weight: 125, reps: 8, completed: true },
          { id: 's-10', setNumber: 3, type: 'normal', weight: 135, reps: 6, completed: true, rpe: 9 }
        ]
      },
      {
        id: 'we-4',
        exerciseId: 'dumbbell-lateral-raise',
        exerciseName: 'Dumbbell Lateral Raise',
        category: 'Shoulders',
        equipment: 'Dumbbell',
        restSeconds: 60,
        sets: [
          { id: 's-11', setNumber: 1, type: 'normal', weight: 25, reps: 15, completed: true },
          { id: 's-12', setNumber: 2, type: 'normal', weight: 30, reps: 12, completed: true },
          { id: 's-13', setNumber: 3, type: 'normal', weight: 30, reps: 12, completed: true }
        ]
      },
      {
        id: 'we-5',
        exerciseId: 'tricep-rope-pushdown',
        exerciseName: 'Cable Tricep Rope Pushdown',
        category: 'Triceps',
        equipment: 'Cable',
        restSeconds: 60,
        sets: [
          { id: 's-14', setNumber: 1, type: 'normal', weight: 55, reps: 12, completed: true },
          { id: 's-15', setNumber: 2, type: 'normal', weight: 65, reps: 10, completed: true },
          { id: 's-16', setNumber: 3, type: 'drop', weight: 45, reps: 15, completed: true }
        ]
      }
    ]
  },
  {
    id: 'history-2',
    title: 'Pull Density & Thickness',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    durationMinutes: 58,
    totalVolume: 17240,
    totalSets: 16,
    totalReps: 134,
    prsAchieved: [
      { exerciseName: 'Conventional Barbell Deadlift', description: 'Heaviest Weight', value: '315 lbs × 5 reps' }
    ],
    exercises: [
      {
        id: 'we-6',
        exerciseId: 'barbell-deadlift',
        exerciseName: 'Conventional Barbell Deadlift',
        category: 'Back',
        equipment: 'Barbell',
        restSeconds: 180,
        sets: [
          { id: 's-17', setNumber: 1, type: 'warmup', weight: 225, reps: 6, completed: true },
          { id: 's-18', setNumber: 2, type: 'normal', weight: 275, reps: 5, completed: true },
          { id: 's-19', setNumber: 3, type: 'normal', weight: 315, reps: 5, completed: true, rpe: 8.5 }
        ]
      },
      {
        id: 'we-7',
        exerciseId: 'lat-pulldown',
        exerciseName: 'Lat Pulldown',
        category: 'Back',
        equipment: 'Cable',
        restSeconds: 75,
        sets: [
          { id: 's-20', setNumber: 1, type: 'normal', weight: 140, reps: 10, completed: true },
          { id: 's-21', setNumber: 2, type: 'normal', weight: 160, reps: 8, completed: true },
          { id: 's-22', setNumber: 3, type: 'normal', weight: 160, reps: 8, completed: true }
        ]
      },
      {
        id: 'we-8',
        exerciseId: 'barbell-bent-over-row',
        exerciseName: 'Barbell Bent-Over Row',
        category: 'Back',
        equipment: 'Barbell',
        restSeconds: 90,
        sets: [
          { id: 's-23', setNumber: 1, type: 'normal', weight: 155, reps: 8, completed: true },
          { id: 's-24', setNumber: 2, type: 'normal', weight: 165, reps: 8, completed: true },
          { id: 's-25', setNumber: 3, type: 'normal', weight: 175, reps: 6, completed: true }
        ]
      }
    ]
  },
  {
    id: 'history-3',
    title: 'Legs & Core Builder',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    durationMinutes: 62,
    totalVolume: 19400,
    totalSets: 18,
    totalReps: 165,
    prsAchieved: [
      { exerciseName: 'Barbell Back Squat', description: 'Heaviest Weight', value: '275 lbs × 5 reps' }
    ],
    exercises: [
      {
        id: 'we-9',
        exerciseId: 'barbell-back-squat',
        exerciseName: 'Barbell Back Squat',
        category: 'Quads',
        equipment: 'Barbell',
        restSeconds: 150,
        sets: [
          { id: 's-26', setNumber: 1, type: 'warmup', weight: 185, reps: 8, completed: true },
          { id: 's-27', setNumber: 2, type: 'normal', weight: 245, reps: 6, completed: true },
          { id: 's-28', setNumber: 3, type: 'normal', weight: 275, reps: 5, completed: true, rpe: 8.5 }
        ]
      }
    ]
  }
];

export const INITIAL_BODY_MEASUREMENTS: BodyWeightEntry[] = [
  { id: 'bw-1', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0], weight: 182.4, bodyFatPercent: 16.5 },
  { id: 'bw-2', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString().split('T')[0], weight: 181.8, bodyFatPercent: 16.3 },
  { id: 'bw-3', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0], weight: 181.2, bodyFatPercent: 16.1 },
  { id: 'bw-4', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0], weight: 180.5, bodyFatPercent: 15.9 },
  { id: 'bw-5', date: new Date().toISOString().split('T')[0], weight: 180.0, bodyFatPercent: 15.8 }
];

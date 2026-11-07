export type MuscleGroup = 
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Biceps'
  | 'Triceps'
  | 'Core'
  | 'Calves'
  | 'Cardio';

export type EquipmentType = 
  | 'Barbell'
  | 'Dumbbell'
  | 'Cable'
  | 'Machine'
  | 'Bodyweight'
  | 'Kettlebell'
  | 'Other';

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface Exercise {
  id: string;
  name: string;
  category: MuscleGroup;
  equipment: EquipmentType;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  instructions: string[];
  tips?: string;
  defaultRestSeconds: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weight: number;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (6-10)
  completed: boolean;
  previousWeight?: number;
  previousReps?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: MuscleGroup;
  equipment: EquipmentType;
  notes?: string;
  restSeconds: number;
  sets: WorkoutSet[];
}

export interface ActiveWorkout {
  id: string;
  title: string;
  routineId?: string;
  startTime: number;
  durationSeconds: number;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  date: string;
  type: 'weight' | 'reps' | 'volume';
}

export interface CompletedWorkout {
  id: string;
  title: string;
  date: string; // ISO string
  durationMinutes: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  exercises: WorkoutExercise[];
  notes?: string;
  prsAchieved: {
    exerciseName: string;
    description: string;
    value: string;
  }[];
}

export interface RoutineTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Push / Pull / Legs' | 'Upper / Lower' | 'Full Body' | 'Specialized' | 'Custom';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  isCustom?: boolean;
  exercises: {
    exerciseId: string;
    defaultSets: number;
    defaultReps: number;
    targetRpe?: number;
  }[];
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weight: number;
  bodyFatPercent?: number;
  notes?: string;
}

export interface UserSettings {
  weightUnit: 'lbs' | 'kg';
  defaultRestSeconds: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  plateBarWeight: number; // 45 or 20
  autoStartRestTimer: boolean;
  userWeight?: number; // in current weightUnit
  userHeightCm?: number; // in cm
  userExperience?: 'Beginner' | 'Intermediate' | 'Advanced';
  userGender?: 'male' | 'female';
}

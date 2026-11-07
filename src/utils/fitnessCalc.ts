export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  // Epley formula: weight * (1 + reps / 30)
  return Math.round(weight * (1 + reps / 30));
}

export function calculateBrzycki1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  // Brzycki formula: weight / (1.0278 - 0.0278 * reps)
  return Math.round(weight / (1.0278 - 0.0278 * reps));
}

export interface PlateResult {
  barWeight: number;
  weightPerSide: number;
  platesPerSide: { weight: number; count: number; color: string }[];
  remainder: number;
}

export function calculateBarbellPlates(targetWeight: number, unit: 'lbs' | 'kg' = 'lbs'): PlateResult {
  const isLbs = unit === 'lbs';
  const barWeight = isLbs ? 45 : 20;

  if (targetWeight <= barWeight) {
    return {
      barWeight,
      weightPerSide: 0,
      platesPerSide: [],
      remainder: 0
    };
  }

  const availablePlates = isLbs
    ? [
        { weight: 45, color: '#ef4444' }, // Red
        { weight: 35, color: '#3b82f6' }, // Blue
        { weight: 25, color: '#eab308' }, // Yellow
        { weight: 10, color: '#22c55e' }, // Green
        { weight: 5, color: '#ffffff' },  // White
        { weight: 2.5, color: '#94a3b8' } // Silver
      ]
    : [
        { weight: 25, color: '#ef4444' }, // Red
        { weight: 20, color: '#3b82f6' }, // Blue
        { weight: 15, color: '#eab308' }, // Yellow
        { weight: 10, color: '#22c55e' }, // Green
        { weight: 5, color: '#ffffff' },  // White
        { weight: 2.5, color: '#94a3b8' },// Black
        { weight: 1.25, color: '#a855f7' } // Micro
      ];

  let neededPerSide = (targetWeight - barWeight) / 2;
  const initialPerSide = neededPerSide;
  const platesPerSide: { weight: number; count: number; color: string }[] = [];

  for (const plate of availablePlates) {
    if (neededPerSide >= plate.weight) {
      const count = Math.floor(neededPerSide / plate.weight);
      if (count > 0) {
        platesPerSide.push({
          weight: plate.weight,
          count,
          color: plate.color
        });
        neededPerSide = Number((neededPerSide - count * plate.weight).toFixed(2));
      }
    }
  }

  return {
    barWeight,
    weightPerSide: initialPerSide,
    platesPerSide,
    remainder: neededPerSide
  };
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeMMSS(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

import { EquipmentType, Exercise, WorkoutSet } from '../types/fitness';

/**
 * Standard rep options for the reps dropdown (1 - 30 + 35, 40, 50)
 */
export function generateRepOptions(): number[] {
  return [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    22, 24, 25, 28, 30, 35, 40, 50
  ];
}

/**
 * Realistic weight increments differentiating Dumbbells, Barbell, Cable/Machine & Bodyweight
 */
export function generateWeightOptions(equipment: EquipmentType, unit: 'lbs' | 'kg'): { value: number; label: string }[] {
  const isLbs = unit === 'lbs';

  if (equipment === 'Dumbbell') {
    if (isLbs) {
      // Standard commercial gym dumbbell rack in lbs (per dumbbell)
      const weights = [
        5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5,
        40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 130
      ];
      return weights.map((w) => ({ value: w, label: `${w} lbs (ea)` }));
    } else {
      // Standard commercial gym dumbbell rack in kg (per dumbbell)
      const weights = [
        2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22.5, 25, 27.5,
        30, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50, 55, 60
      ];
      return weights.map((w) => ({ value: w, label: `${w} kg (ea)` }));
    }
  }

  if (equipment === 'Barbell') {
    if (isLbs) {
      // Barbell starts at 45 lbs Olympic bar + realistic plate pairs
      const weights = [
        45, 50, 55, 65, 75, 85, 95, 105, 115, 125, 135, 145, 155, 165, 175,
        185, 195, 205, 215, 225, 235, 245, 255, 275, 295, 315, 335, 365,
        385, 405, 425, 455, 495
      ];
      return weights.map((w) => ({
        value: w,
        label: w === 45 ? '45 lbs (Bar)' : `${w} lbs`
      }));
    } else {
      // Barbell starts at 20 kg Olympic bar + standard plates
      const weights = [
        20, 22.5, 25, 27.5, 30, 32.5, 35, 40, 45, 50, 55, 60, 65, 70, 75,
        80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 140, 150, 160,
        170, 180, 190, 200, 210, 220, 240
      ];
      return weights.map((w) => ({
        value: w,
        label: w === 20 ? '20 kg (Bar)' : `${w} kg`
      }));
    }
  }

  if (equipment === 'Kettlebell') {
    if (isLbs) {
      const weights = [9, 13, 18, 26, 35, 44, 53, 62, 70, 80];
      return weights.map((w) => ({ value: w, label: `${w} lbs` }));
    } else {
      const weights = [4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40];
      return weights.map((w) => ({ value: w, label: `${w} kg` }));
    }
  }

  if (equipment === 'Bodyweight') {
    if (isLbs) {
      const weights = [0, 5, 10, 15, 20, 25, 30, 35, 45, 55, 70, 90];
      return weights.map((w) => ({
        value: w,
        label: w === 0 ? 'Bodyweight (0)' : `+${w} lbs`
      }));
    } else {
      const weights = [0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 25, 30, 40];
      return weights.map((w) => ({
        value: w,
        label: w === 0 ? 'Bodyweight (0)' : `+${w} kg`
      }));
    }
  }

  // Cable / Machine / Other default pin stacks
  if (isLbs) {
    const weights = [
      10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 120,
      130, 140, 150, 160, 175, 190, 200, 225, 250
    ];
    return weights.map((w) => ({ value: w, label: `${w} lbs` }));
  } else {
    const weights = [
      5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 35, 40, 45, 50,
      55, 60, 65, 70, 75, 80, 85, 90, 100, 110, 120
    ];
    return weights.map((w) => ({ value: w, label: `${w} kg` }));
  }
}

export interface AdaptiveSuggestion {
  targetWeight: number;
  targetReps: number;
  reason: string;
  badge: 'Match' | 'Overload' | 'Back-off' | 'Recommended';
  isOverload: boolean;
  isBackoff: boolean;
}

/**
 * Adaptive suggestion engine:
 * Evaluates the completed set's weight, reps, and RPE to recommend the target for the next lift.
 */
export function getAdaptiveSuggestion(
  completedSet: WorkoutSet,
  equipment: EquipmentType,
  unit: 'lbs' | 'kg'
): AdaptiveSuggestion {
  const isLbs = unit === 'lbs';
  const currentWeight = completedSet.weight;
  const currentReps = completedSet.reps;
  const rpe = completedSet.rpe;

  // Smallest practical progression step for equipment
  let weightStep = isLbs ? 5 : 2.5;
  if (equipment === 'Dumbbell') {
    weightStep = isLbs ? (currentWeight < 30 ? 2.5 : 5) : (currentWeight < 20 ? 2 : 2.5);
  } else if (equipment === 'Barbell') {
    weightStep = isLbs ? 5 : 2.5;
  }

  // 1. High RPE (Failure or extreme strain: RPE >= 9.5)
  if (rpe !== undefined && rpe >= 9.5) {
    if (currentReps <= 5) {
      // Backoff set to maintain safe hypertrophy volume
      const backoffWeight = Math.max(
        equipment === 'Barbell' ? (isLbs ? 45 : 20) : (isLbs ? 5 : 2),
        Math.round((currentWeight * 0.9) / weightStep) * weightStep
      );
      return {
        targetWeight: backoffWeight,
        targetReps: Math.min(12, currentReps + 2),
        reason: `RPE ${rpe} reached high fatigue. Back-off load to preserve clean form.`,
        badge: 'Back-off',
        isOverload: false,
        isBackoff: true
      };
    }
    // High reps at high RPE: keep weight, target same or 1 less rep
    return {
      targetWeight: currentWeight,
      targetReps: Math.max(4, currentReps - 1),
      reason: `RPE ${rpe} near limit. Hold current weight and aim for clean control.`,
      badge: 'Match',
      isOverload: false,
      isBackoff: false
    };
  }

  // 2. Low RPE (RPE <= 7: set was fast/light, prime for Progressive Overload)
  if (rpe !== undefined && rpe <= 7) {
    const overloadWeight = currentWeight + weightStep;
    return {
      targetWeight: overloadWeight,
      targetReps: currentReps,
      reason: `RPE ${rpe} felt light! Increase by ${weightStep} ${unit} for progressive overload.`,
      badge: 'Overload',
      isOverload: true,
      isBackoff: false
    };
  }

  // 3. Moderate RPE (7.5 - 8.5: Sweet spot working zone)
  if (rpe !== undefined && rpe >= 7.5 && rpe <= 8.5) {
    // If reps exceeded 12, recommend weight increase; otherwise repeat exact load
    if (currentReps >= 12) {
      return {
        targetWeight: currentWeight + weightStep,
        targetReps: 8,
        reason: `High rep target met at manageable RPE ${rpe}. Bump up weight for 8 reps.`,
        badge: 'Overload',
        isOverload: true,
        isBackoff: false
      };
    }
    return {
      targetWeight: currentWeight,
      targetReps: currentReps,
      reason: `Target effort locked in (RPE ${rpe}). Maintain ${currentWeight} ${unit} × ${currentReps}.`,
      badge: 'Match',
      isOverload: false,
      isBackoff: false
    };
  }

  // 4. Default: No RPE recorded or standard completion
  return {
    targetWeight: currentWeight,
    targetReps: currentReps,
    reason: `Matched previous set of ${currentWeight} ${unit} × ${currentReps} reps.`,
    badge: 'Match',
    isOverload: false,
    isBackoff: false
  };
}

export interface UserProfileEstimates {
  userWeight?: number;
  userHeightCm?: number;
  userExperience?: 'Beginner' | 'Intermediate' | 'Advanced';
  userGender?: 'male' | 'female';
  unit: 'lbs' | 'kg';
}

/**
 * Calculates estimated starting weight for an exercise based on user body weight,
 * height, training experience, and movement biomechanics.
 */
export function calculateStartingWeight(
  exercise: Exercise,
  profile: UserProfileEstimates
): number {
  const isLbs = profile.unit === 'lbs';
  // Standard baseline bodyweight if not specified
  const bodyWeightKg = profile.userWeight
    ? (isLbs ? profile.userWeight * 0.453592 : profile.userWeight)
    : 75;

  const experience = profile.userExperience || 'Intermediate';
  const isFemale = profile.userGender === 'female';

  // Experience multiplier
  const expMultiplier = experience === 'Beginner' ? 0.75 : experience === 'Advanced' ? 1.35 : 1.0;
  // Gender upper/lower biomechanics multiplier
  const isLowerBody = ['Quads', 'Hamstrings', 'Glutes', 'Calves'].includes(exercise.category);
  const genderMultiplier = isFemale ? (isLowerBody ? 0.85 : 0.65) : 1.0;

  // Movement ratio relative to body weight (kg)
  let ratio = 0.35;
  const name = exercise.name.toLowerCase();

  if (name.includes('bench press') || name.includes('chest press')) {
    ratio = exercise.equipment === 'Barbell' ? 0.60 : 0.22;
  } else if (name.includes('incline')) {
    ratio = exercise.equipment === 'Barbell' ? 0.50 : 0.18;
  } else if (name.includes('squat')) {
    ratio = exercise.equipment === 'Barbell' ? 0.75 : 0.22;
  } else if (name.includes('leg press')) {
    ratio = 1.10;
  } else if (name.includes('deadlift')) {
    ratio = exercise.equipment === 'Barbell' ? 0.90 : 0.30;
  } else if (name.includes('row')) {
    ratio = exercise.equipment === 'Barbell' ? 0.50 : 0.20;
  } else if (name.includes('pulldown') || name.includes('pull-down')) {
    ratio = 0.45;
  } else if (name.includes('shoulder press') || name.includes('overhead press') || name.includes('military')) {
    ratio = exercise.equipment === 'Barbell' ? 0.35 : 0.14;
  } else if (name.includes('lateral raise')) {
    ratio = 0.06;
  } else if (name.includes('curl')) {
    ratio = exercise.equipment === 'Barbell' ? 0.28 : 0.12;
  } else if (name.includes('triceps') || name.includes('pushdown') || name.includes('skull')) {
    ratio = 0.20;
  } else if (name.includes('calf')) {
    ratio = 0.45;
  } else if (exercise.equipment === 'Bodyweight') {
    return 0; // Pure bodyweight starting point
  } else {
    // Default by category
    switch (exercise.category) {
      case 'Chest': ratio = exercise.equipment === 'Barbell' ? 0.55 : 0.20; break;
      case 'Back': ratio = exercise.equipment === 'Barbell' ? 0.55 : 0.25; break;
      case 'Quads':
      case 'Hamstrings':
      case 'Glutes': ratio = exercise.equipment === 'Barbell' ? 0.70 : 0.24; break;
      case 'Shoulders': ratio = exercise.equipment === 'Barbell' ? 0.35 : 0.14; break;
      case 'Biceps':
      case 'Triceps': ratio = 0.15; break;
      default: ratio = 0.25;
    }
  }

  let calculatedKg = bodyWeightKg * ratio * expMultiplier * genderMultiplier;

  // Minimum thresholds
  if (exercise.equipment === 'Barbell') {
    calculatedKg = Math.max(20, calculatedKg);
  } else if (exercise.equipment === 'Dumbbell') {
    calculatedKg = Math.max(4, calculatedKg);
  } else {
    calculatedKg = Math.max(5, calculatedKg);
  }

  // Convert to target unit and snap to realistic increments
  if (isLbs) {
    const rawLbs = calculatedKg * 2.20462;
    if (exercise.equipment === 'Barbell') {
      // Snap to nearest 5 lbs with minimum 45 lbs
      const snapped = Math.max(45, Math.round(rawLbs / 5) * 5);
      return snapped;
    } else if (exercise.equipment === 'Dumbbell') {
      // Snap to nearest 2.5 or 5 lbs
      const snapped = Math.max(5, Math.round(rawLbs / 2.5) * 2.5);
      return snapped;
    } else {
      return Math.max(10, Math.round(rawLbs / 5) * 5);
    }
  } else {
    if (exercise.equipment === 'Barbell') {
      // Snap to nearest 2.5 kg with minimum 20 kg
      const snapped = Math.max(20, Math.round(calculatedKg / 2.5) * 2.5);
      return snapped;
    } else if (exercise.equipment === 'Dumbbell') {
      // Snap to nearest 2 kg or 2.5 kg
      const snapped = Math.max(2, Math.round(calculatedKg / 2) * 2);
      return snapped;
    } else {
      return Math.max(5, Math.round(calculatedKg / 2.5) * 2.5);
    }
  }
}

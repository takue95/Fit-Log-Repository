import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Home, Dumbbell, PlusCircle, TrendingUp, History, Activity, UserRound, Cloud, RefreshCw } from 'lucide-react';
import { 
  RoutineTemplate,
  CoachStartAction, 
  CompletedWorkout, 
  ActiveWorkout, 
  Exercise, 
  BodyWeightEntry, 
  UserSettings, 
  WorkoutExercise,
  WorkoutSet 
} from './types/fitness';
import { INITIAL_EXERCISES } from './data/exercises';
import { DEFAULT_ROUTINES } from './data/routines';
import { Dashboard } from './components/Dashboard';
import { ActiveWorkoutView } from './components/ActiveWorkout';
import { RoutinesView } from './components/Routines';
import { AnalyticsView } from './components/Analytics';
import { HistoryAndSettingsView } from './components/HistoryAndSettings';
import { PlateCalculatorModal } from './components/modals/PlateCalculatorModal';
import { ExercisePickerModal } from './components/modals/ExercisePickerModal';
import { RestTimerOverlay } from './components/modals/RestTimerOverlay';
import { WorkoutCompletedModal } from './components/modals/WorkoutCompletedModal';
import { OneRMCalculatorModal } from './components/modals/OneRMCalculatorModal';
import { calculate1RM, generateWeightOptions } from './utils/fitnessCalc';
import { FitLogDriveData, GOOGLE_DRIVE_CLIENT_ID, loadDriveBackup, mergeDriveData, requestGoogleDriveToken, sameDriveData, saveDriveBackup } from './utils/googleDriveSync';

const STORAGE_KEYS = {
  EXERCISES: 'fitlog_exercises_v1',
  ROUTINES: 'fitlog_routines_v1',
  HISTORY: 'fitlog_history_v1',
  BODY_WEIGHTS: 'fitlog_body_weights_v1',
  ACTIVE_WORKOUT: 'fitlog_active_workout_v1',
  SETTINGS: 'fitlog_settings_v1',
  DRIVE_LAST_SYNC: 'fitlog_drive_last_sync_v1'
};

const loadExerciseLibrary = (): Exercise[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.EXERCISES);
  if (!saved) return INITIAL_EXERCISES;
  try {
    const savedExercises: Exercise[] = JSON.parse(saved);
    if (!Array.isArray(savedExercises)) return INITIAL_EXERCISES;

    // Add new built-in entries for existing users while preserving edits and custom exercises.
    const merged = new Map(INITIAL_EXERCISES.map((exercise) => [exercise.id, exercise]));
    savedExercises.forEach((exercise) => {
      if (exercise?.id) merged.set(exercise.id, exercise);
    });
    return Array.from(merged.values());
  } catch {
    return INITIAL_EXERCISES;
  }
};

export default function App() {
  const appHeaderRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const header = appHeaderRef.current;
    if (!header) return;

    const updateHeaderHeight = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--fitlog-app-header-height', `${height}px`);
    };

    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
      document.documentElement.style.removeProperty('--fitlog-app-header-height');
    };
  }, []);

  // Navigation: 0 = Dashboard, 1 = Routines, 2 = Active Workout, 3 = Analytics, 4 = History & Settings
  const [currentScreen, setCurrentScreen] = useState<number>(0);
  const [historyInitialTab, setHistoryInitialTab] = useState<'history' | 'exercises' | 'settings'>('history');

  // Persistent States
  const [exercises, setExercises] = useState<Exercise[]>(loadExerciseLibrary);

  const [routines, setRoutines] = useState<RoutineTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROUTINES);
    if (!saved) return DEFAULT_ROUTINES;
    try {
      const parsed: RoutineTemplate[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return DEFAULT_ROUTINES;
      const existingIds = new Set(parsed.map((routine) => routine.id));
      const routinesToAdd = DEFAULT_ROUTINES.filter((routine) =>
        ['lower-strength', 'jefit-3-day-volume-chest-back', 'jefit-3-day-volume-legs', 'jefit-3-day-volume-shoulders-arms'].includes(routine.id)
        && !existingIds.has(routine.id)
      );
      return [...parsed, ...routinesToAdd];
    } catch {
      return DEFAULT_ROUTINES;
    }
  });

  const [history, setHistory] = useState<CompletedWorkout[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Remove only the short IDs used by the original demo. Real workout IDs may also
      // start with "history-" but include a timestamp and must be preserved.
      return parsed.filter((workout) => !/^history-\d{1,2}$/.test(workout?.id ?? ''));
    } catch {
      return [];
    }
  });

  const [bodyWeights, setBodyWeights] = useState<BodyWeightEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BODY_WEIGHTS);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Remove the five sample weigh-ins shipped with the original demo build.
      return parsed.filter((entry) => !/^bw-[1-5]$/.test(entry?.id ?? ''));
    } catch {
      return [];
    }
  });

  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT);
    return saved ? JSON.parse(saved) : null;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const defaultSettings: UserSettings = {
      weightUnit: 'lbs',
      defaultRestSeconds: 90,
      soundEnabled: true,
      vibrationEnabled: true,
      plateBarWeight: 45,
      autoStartRestTimer: true,
      weeklyWorkoutTarget: 3,
      userWeight: 165,
      userHeightCm: 178,
      userExperience: 'Intermediate',
      userGender: 'male'
    };
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!saved) return defaultSettings;
    try {
      return { ...defaultSettings, ...JSON.parse(saved) };
    } catch {
      return defaultSettings;
    }
  });

  // Rest Timer State
  const [activeRestTimer, setActiveRestTimer] = useState<{
    seconds: number;
    exerciseName?: string;
  } | null>(null);

  // Modals
  const [isPlateCalcOpen, setIsPlateCalcOpen] = useState(false);
  const [plateCalcInitialWeight, setPlateCalcInitialWeight] = useState(135);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isOneRMCalcOpen, setIsOneRMCalcOpen] = useState(false);
  const [completedWorkoutSummary, setCompletedWorkoutSummary] = useState<CompletedWorkout | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveSyncStatus, setDriveSyncStatus] = useState<'setup-required' | 'disconnected' | 'connecting' | 'syncing' | 'synced' | 'error'>(
    GOOGLE_DRIVE_CLIENT_ID ? 'disconnected' : 'setup-required'
  );
  const [driveSyncMessage, setDriveSyncMessage] = useState('');
  const [driveLastSyncedAt, setDriveLastSyncedAt] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.DRIVE_LAST_SYNC));
  const [driveSyncPulse, setDriveSyncPulse] = useState(0);
  const driveSyncInProgress = useRef(false);
  const skipNextDriveAutoSync = useRef(false);
  const driveDataRef = useRef<FitLogDriveData>({
    schemaVersion: 1,
    exercises,
    routines,
    history,
    bodyWeights,
    settings,
    activeWorkout
  });
  driveDataRef.current = {
    schemaVersion: 1,
    exercises,
    routines,
    history,
    bodyWeights,
    settings,
    activeWorkout
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
  }, [exercises]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BODY_WEIGHTS, JSON.stringify(bodyWeights));
  }, [bodyWeights]);

  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
    }
  }, [activeWorkout]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  const applyDriveData = useCallback((data: FitLogDriveData) => {
    setExercises(data.exercises);
    setRoutines(data.routines);
    setHistory(data.history);
    setBodyWeights(data.bodyWeights);
    setSettings(data.settings);
    setActiveWorkout(data.activeWorkout ?? null);
  }, []);

  const syncDriveData = useCallback(async (preferCloud: boolean) => {
    if (!driveToken || driveSyncInProgress.current) return;
    driveSyncInProgress.current = true;
    setDriveSyncStatus('syncing');
    setDriveSyncMessage('');

    try {
      const remote = await loadDriveBackup(driveToken);
      const local = driveDataRef.current;
      const merged = remote ? mergeDriveData(remote.data, local, preferCloud) : local;

      if (!remote || !sameDriveData(merged, remote.data)) {
        await saveDriveBackup(driveToken, merged, remote?.file);
      }
      if (!sameDriveData(merged, local)) {
        skipNextDriveAutoSync.current = true;
        applyDriveData(merged);
      }
      driveDataRef.current = merged;
      const syncedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.DRIVE_LAST_SYNC, syncedAt);
      setDriveLastSyncedAt(syncedAt);
      setDriveSyncStatus('synced');
    } catch (error) {
      setDriveToken(null);
      setDriveSyncStatus('error');
      setDriveSyncMessage(error instanceof Error ? error.message : 'Could not sync with Google Drive.');
    } finally {
      driveSyncInProgress.current = false;
    }
  }, [driveToken, applyDriveData]);

  const handleConnectDrive = async () => {
    if (!GOOGLE_DRIVE_CLIENT_ID) {
      setDriveSyncStatus('setup-required');
      setDriveSyncMessage('Google OAuth setup is needed before FitLog can connect.');
      return;
    }

    setDriveSyncStatus('connecting');
    setDriveSyncMessage('');
    try {
      const token = await requestGoogleDriveToken(GOOGLE_DRIVE_CLIENT_ID);
      const remote = await loadDriveBackup(token);
      const local = driveDataRef.current;
      const merged = remote ? mergeDriveData(remote.data, local, true) : local;

      if (!remote || !sameDriveData(merged, remote.data)) {
        await saveDriveBackup(token, merged, remote?.file);
      }
      if (!sameDriveData(merged, local)) {
        skipNextDriveAutoSync.current = true;
        applyDriveData(merged);
      }
      driveDataRef.current = merged;
      setDriveToken(token);
      const syncedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.DRIVE_LAST_SYNC, syncedAt);
      setDriveLastSyncedAt(syncedAt);
      setDriveSyncStatus('synced');
    } catch (error) {
      setDriveSyncStatus('error');
      setDriveSyncMessage(error instanceof Error ? error.message : 'Could not connect to Google Drive.');
    }
  };

  const handleSyncDrive = () => {
    if (driveToken) setDriveSyncPulse((value) => value + 1);
  };

  const handleDisconnectDrive = () => {
    setDriveToken(null);
    setDriveSyncStatus(GOOGLE_DRIVE_CLIENT_ID ? 'disconnected' : 'setup-required');
    setDriveSyncMessage('');
  };

  useEffect(() => {
    if (!driveToken) return;
    if (skipNextDriveAutoSync.current) {
      skipNextDriveAutoSync.current = false;
      return;
    }
    const timeout = window.setTimeout(() => void syncDriveData(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [driveToken, history, routines, exercises, bodyWeights, settings, activeWorkout, syncDriveData]);

  useEffect(() => {
    if (!driveToken || driveSyncPulse === 0) return;
    void syncDriveData(true);
  }, [driveToken, driveSyncPulse, syncDriveData]);

  useEffect(() => {
    if (!driveToken) return;
    const requestSync = () => {
      if (document.visibilityState === 'visible') setDriveSyncPulse((value) => value + 1);
    };
    window.addEventListener('focus', requestSync);
    document.addEventListener('visibilitychange', requestSync);
    const interval = window.setInterval(requestSync, 60_000);
    return () => {
      window.removeEventListener('focus', requestSync);
      document.removeEventListener('visibilitychange', requestSync);
      window.clearInterval(interval);
    };
  }, [driveToken]);

  const getPreviousExerciseSets = (exerciseId: string, exerciseName: string): WorkoutSet[] => {
    const normalize = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
    const targetName = normalize(exerciseName);
    const latestWorkouts = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const workout of latestWorkouts) {
      const previousExercise = workout.exercises.find((entry) =>
        (entry.exerciseId === exerciseId || normalize(entry.exerciseName) === targetName) &&
        entry.sets.some((set) => set.completed && set.type === 'normal')
      );
      const completedSets = previousExercise?.sets
        .filter((set) => set.completed && set.type === 'normal')
        .sort((a, b) => a.setNumber - b.setNumber);
      if (completedSets?.length) return completedSets;
    }
    return [];
  };

  const getPreviousSetForIndex = (sets: WorkoutSet[], index: number): WorkoutSet | undefined =>
    sets[index] ?? sets[sets.length - 1];

  const getRecommendedStartingWeight = (
    equipment: Exercise['equipment'],
    targetReps: number,
    previousSets: WorkoutSet[]
  ): number => {
    const availableWeights = generateWeightOptions(equipment, settings.weightUnit)
      .map((option) => option.value)
      .sort((a, b) => a - b);
    const validSets = previousSets.filter((set) => set.completed && set.type === 'normal' && set.reps > 0 && set.weight >= 0);
    if (!validSets.length) return availableWeights[0] ?? 0;

    const target = Math.max(1, Math.round(targetReps) || 8);
    const exactRepSets = validSets.filter((set) => set.reps === target);
    if (exactRepSets.length) {
      return exactRepSets.reduce((best, set) => set.weight > best.weight ? set : best).weight;
    }

    const weightedSets = validSets.filter((set) => set.weight > 0);
    if (!weightedSets.length) return 0;
    const strongestSet = weightedSets.reduce((best, set) =>
      set.weight * (1 + set.reps / 30) > best.weight * (1 + best.reps / 30) ? set : best
    );
    const estimatedTargetWeight = strongestSet.weight * (1 + strongestSet.reps / 30) / (1 + target / 30);
    const availableAtOrBelow = availableWeights.filter((weight) => weight > 0 && weight <= estimatedTargetWeight);
    return availableAtOrBelow.length
      ? availableAtOrBelow[availableAtOrBelow.length - 1]
      : availableWeights.find((weight) => weight > 0) ?? 0;
  };

  // Workout Creation Handlers
  const handleStartEmptyWorkout = () => {
    const previousSets = getPreviousExerciseSets('barbell-bench-press', 'Barbell Bench Press');
    const previousSet = getPreviousSetForIndex(previousSets, 0);
    const startingWeight = getRecommendedStartingWeight('Barbell', 10, previousSets);
    const newWorkout: ActiveWorkout = {
      id: `workout-${Date.now()}`,
      title: 'Freeform Workout',
      startTime: Date.now(),
      durationSeconds: 0,
      exercises: [
        {
          id: `we-${Date.now()}`,
          exerciseId: 'barbell-bench-press',
          exerciseName: 'Barbell Bench Press',
          category: 'Chest',
          equipment: 'Barbell',
          restSeconds: settings.defaultRestSeconds,
          sets: [
            {
              id: `s-${Date.now()}-1`,
              setNumber: 1,
              type: 'normal',
              weight: startingWeight,
              reps: 10,
              completed: false,
              previousWeight: previousSet?.weight,
              previousReps: previousSet?.reps
            }
          ]
        }
      ]
    };
    setActiveWorkout(newWorkout);
    setCurrentScreen(2); // Go to Active Workout screen
  };

  const handleStartRoutine = (routine: RoutineTemplate, coachAction?: CoachStartAction) => {
    let routineExercises: WorkoutExercise[] = routine.exercises.map((re, rIdx) => {
      const exObj = exercises.find((e) => e.id === re.exerciseId);
      const exerciseName = exObj?.name || re.exerciseId;
      const equipment = exObj?.equipment || 'Barbell';
      const previousSets = getPreviousExerciseSets(re.exerciseId, exerciseName);
      const startingWeight = getRecommendedStartingWeight(equipment, re.defaultReps, previousSets);
      const sets: WorkoutSet[] = Array.from({ length: re.defaultSets }).map((_, sIdx) => {
        const previousSet = getPreviousSetForIndex(previousSets, sIdx);
        return {
          id: `s-${Date.now()}-${rIdx}-${sIdx}`,
          setNumber: sIdx + 1,
          type: 'normal',
          weight: startingWeight,
          reps: re.defaultReps,
          rpe: re.targetRpe,
          completed: false,
          previousWeight: previousSet?.weight,
          previousReps: previousSet?.reps
        };
      });

      return {
        id: `we-${Date.now()}-${rIdx}`,
        exerciseId: re.exerciseId,
        exerciseName: exObj?.name || re.exerciseId,
        category: exObj?.category || 'Chest',
        equipment: exObj?.equipment || 'Barbell',
        restSeconds: exObj?.defaultRestSeconds || settings.defaultRestSeconds,
        sets
      };
    });

    if (coachAction?.kind === 'target') {
      let applied = false;
      routineExercises = routineExercises.map((exercise) => {
        if (exercise.exerciseId !== coachAction.exerciseId || applied) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set) => {
            if (!applied && !set.completed) {
              applied = true;
              return { ...set, weight: coachAction.weight, reps: coachAction.reps };
            }
            return set;
          })
        };
      });
    }

    if (coachAction?.kind === 'add-exercise') {
      const exercise = exercises.find((item) => item.id === coachAction.exerciseId);
      if (exercise) {
        const previousSets = getPreviousExerciseSets(exercise.id, exercise.name);
        const startingWeight = getRecommendedStartingWeight(exercise.equipment, coachAction.reps, previousSets);
        routineExercises = [...routineExercises, {
          id: `we-${Date.now()}-coach`,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          category: exercise.category,
          equipment: exercise.equipment,
          restSeconds: exercise.defaultRestSeconds || settings.defaultRestSeconds,
          sets: Array.from({ length: Math.max(1, coachAction.sets) }, (_, index) => {
            const previousSet = getPreviousSetForIndex(previousSets, index);
            return {
              id: `s-${Date.now()}-coach-${index}`,
              setNumber: index + 1,
              type: 'normal',
              weight: startingWeight,
              reps: coachAction.reps,
              completed: false,
              previousWeight: previousSet?.weight,
              previousReps: previousSet?.reps
            };
          })
        }];
      }
    }
    const newWorkout: ActiveWorkout = {
      id: `workout-${Date.now()}`,
      title: routine.title,
      routineId: routine.id,
      startTime: Date.now(),
      durationSeconds: 0,
      focusCue: coachAction?.kind === 'cue' ? coachAction.text : undefined,
      exercises: routineExercises
    };

    setActiveWorkout(newWorkout);
    setCurrentScreen(2); // Go to Active Workout screen
  };

  const handleCancelWorkout = () => {
    setActiveWorkout(null);
    setCurrentScreen(0);
  };

  const handleFinishWorkout = () => {
    if (!activeWorkout) return;

    // Filter to exercises with at least one completed set
    const completedExercises = activeWorkout.exercises
      .map((ex) => ({
        ...ex,
        sets: ex.sets.filter((s) => s.completed)
      }))
      .filter((ex) => ex.sets.length > 0);

    const totalSets = completedExercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalReps = completedExercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((rSum, s) => rSum + s.reps, 0),
      0
    );
    const totalVolume = completedExercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((vSum, s) => vSum + s.weight * s.reps, 0),
      0
    );
    const durationMinutes = Math.max(1, Math.round(activeWorkout.durationSeconds / 60));

    // Detect PRs
    const prsAchieved: CompletedWorkout['prsAchieved'] = [];
    completedExercises.forEach((ex) => {
      // Find historical max for this exercise
      let previousMaxWeight = 0;
      history.forEach((oldW) => {
        const oldEx = oldW.exercises.find((oe) => oe.exerciseId === ex.exerciseId);
        if (oldEx) {
          oldEx.sets.forEach((os) => {
            if (os.completed && os.weight > previousMaxWeight) {
              previousMaxWeight = os.weight;
            }
          });
        }
      });

      // Check if any set in current workout beat previousMaxWeight
      const currentMaxSet = ex.sets.reduce(
        (max, s) => (s.weight > max.weight ? s : max),
        ex.sets[0]
      );

      if (currentMaxSet && currentMaxSet.weight > previousMaxWeight && previousMaxWeight > 0) {
        prsAchieved.push({
          exerciseName: ex.exerciseName,
          description: 'New Max Weight Record',
          value: `${currentMaxSet.weight} ${settings.weightUnit} × ${currentMaxSet.reps} reps`
        });
      }
    });

    // If no weight PR, grant a volume completion milestone
    if (prsAchieved.length === 0 && totalVolume > 5000) {
      prsAchieved.push({
        exerciseName: activeWorkout.title,
        description: 'Session Volume Milestone',
        value: `${totalVolume.toLocaleString()} ${settings.weightUnit}`
      });
    }

    const completedEntry: CompletedWorkout = {
      id: `workout-log-${Date.now()}`,
      title: activeWorkout.title,
      date: new Date().toISOString(),
      durationMinutes,
      totalVolume,
      totalSets,
      totalReps,
      exercises: completedExercises,
      focusCue: activeWorkout.focusCue,
      prsAchieved
    };

    const nextHistory = [completedEntry, ...history];
    try {
      // Write the log before closing the active workout so iPhone storage errors cannot
      // silently discard the session.
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(nextHistory));
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
    } catch {
      window.alert('FitLog could not save this workout on this device. Your workout is still open; please export a backup or free device storage, then try Finish & Save again.');
      return;
    }
    setHistory(nextHistory);
    setActiveWorkout(null);
    setActiveRestTimer(null);
    setCompletedWorkoutSummary(completedEntry);
    setCurrentScreen(0);
  };

  const handleAddExerciseToActive = (exercise: Exercise, setCount = 1, targetReps = 10, fallbackWeight?: number) => {
    if (!activeWorkout) return;
    const previousSets = getPreviousExerciseSets(exercise.id, exercise.name);
    const startingWeight = previousSets.length
      ? getRecommendedStartingWeight(exercise.equipment, targetReps, previousSets)
      : fallbackWeight ?? getRecommendedStartingWeight(exercise.equipment, targetReps, previousSets);
    const safeSetCount = Math.max(1, Math.min(10, Math.round(setCount)));
    const newEx: WorkoutExercise = {
      id: `we-${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      equipment: exercise.equipment,
      restSeconds: exercise.defaultRestSeconds || settings.defaultRestSeconds,
      sets: Array.from({ length: safeSetCount }, (_, index) => {
        const previousSet = getPreviousSetForIndex(previousSets, index);
        return {
          id: `s-${Date.now()}-${index + 1}`,
          setNumber: index + 1,
          type: 'normal',
          weight: startingWeight,
          reps: targetReps,
          completed: false,
          previousWeight: previousSet?.weight,
          previousReps: previousSet?.reps
        };
      })
    };

    setActiveWorkout((prev) => (prev ? { ...prev, exercises: [...prev.exercises, newEx] } : null));
    setIsExercisePickerOpen(false);
  };

  const handleSaveRoutine = (newRoutine: RoutineTemplate) => {
    setRoutines((prev) => [newRoutine, ...prev]);
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddBodyWeight = (weight: number, date: string) => {
    const newEntry: BodyWeightEntry = {
      id: `bw-${Date.now()}`,
      date,
      weight
    };
    setBodyWeights((prev) => [newEntry, ...prev]);
  };

  const handleUpdateBodyWeight = (id: string, weight: number, date: string) => {
    setBodyWeights((prev) => prev.map((entry) =>
      entry.id === id ? { ...entry, weight, date } : entry
    ));
  };

  const handleUpdateHistoryItem = (updatedWorkout: CompletedWorkout) => {
    const edited = history.map((workout) => workout.id === updatedWorkout.id ? updatedWorkout : workout);
    const chronological = [...edited].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const bestByExercise = new Map<string, number>();
    const recalculated = chronological.map((workout) => {
      const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0);
      const totalReps = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).reduce((setSum, set) => setSum + set.reps, 0), 0);
      const totalVolume = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).reduce((setSum, set) => setSum + set.weight * set.reps, 0), 0);
      const prsAchieved: CompletedWorkout['prsAchieved'] = [];

      workout.exercises.forEach((exercise) => {
        const key = exercise.exerciseId || exercise.exerciseName.trim().toLowerCase();
        const previousBest = bestByExercise.get(key) ?? 0;
        const completedSets = exercise.sets.filter((set) => set.completed);
        const bestSet = completedSets.reduce<WorkoutSet | null>((best, set) => !best || set.weight > best.weight ? set : best, null);
        if (bestSet && previousBest > 0 && bestSet.weight > previousBest) {
          prsAchieved.push({
            exerciseName: exercise.exerciseName,
            description: 'New Max Weight Record',
            value: `${bestSet.weight} ${settings.weightUnit} × ${bestSet.reps} reps`
          });
        }
        if (bestSet) bestByExercise.set(key, Math.max(previousBest, bestSet.weight));
      });

      if (prsAchieved.length === 0 && totalVolume > 5000) {
        prsAchieved.push({
          exerciseName: workout.title,
          description: 'Session Volume Milestone',
          value: `${totalVolume.toLocaleString()} ${settings.weightUnit}`
        });
      }
      return { ...workout, totalSets, totalReps, totalVolume, prsAchieved };
    });

    setHistory(recalculated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  // Data Export & Import
  const handleExportData = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      exercises,
      routines,
      history,
      bodyWeights,
      settings
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitlog-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.history) setHistory(parsed.history);
        if (parsed.routines) setRoutines(parsed.routines);
        if (parsed.exercises) setExercises(parsed.exercises);
        if (parsed.bodyWeights) setBodyWeights(parsed.bodyWeights);
        if (parsed.settings) setSettings(parsed.settings);
        alert('FitLog data imported successfully!');
      } catch {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Navigation Items
  const navItems = [
    { screen: 0, label: 'Home', icon: Home },
    { screen: 1, label: 'Routines', icon: Dumbbell },
    { 
      screen: 2, 
      label: activeWorkout ? 'Active' : 'Start', 
      icon: PlusCircle, 
      isCenter: true,
      hasPulse: !!activeWorkout
    },
    { screen: 3, label: 'Progress', icon: TrendingUp },
    { screen: 4, label: 'Training', icon: History }
  ];

  const driveStatusLabel = driveSyncStatus === 'setup-required'
    ? 'Drive setup needed'
    : driveSyncStatus === 'disconnected'
      ? 'Drive not connected'
      : driveSyncStatus === 'connecting'
        ? 'Connecting to Drive…'
        : driveSyncStatus === 'syncing'
          ? 'Syncing to Drive…'
          : driveSyncStatus === 'synced'
            ? 'Drive synced'
            : 'Drive sync needs attention';
  const driveStatusColor = driveSyncStatus === 'synced'
    ? 'bg-emerald-400'
    : driveSyncStatus === 'syncing' || driveSyncStatus === 'connecting'
      ? 'bg-fitlog-gold'
      : driveSyncStatus === 'error'
        ? 'bg-rose-400'
        : 'bg-neutral-500';
  const driveSyncTime = driveLastSyncedAt
    ? new Date(driveLastSyncedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'No successful sync yet';
  const openDriveSettings = () => {
    setHistoryInitialTab('settings');
    setCurrentScreen(4);
  };

  return (
    <div className="min-h-screen bg-[#0d100e] text-neutral-100 flex flex-col items-center justify-start pb-24">
      <header ref={appHeaderRef} className="sticky top-0 z-40 w-full max-w-[430px] border-b border-neutral-800/80 bg-neutral-950/95 px-4 pb-2.5 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-800/70 bg-emerald-900/50 text-emerald-300">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white">FitLog</h1>
              <p className="text-[9px] text-neutral-400">Training log</p>
            </div>
          </div>
          <button
            onClick={openDriveSettings}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3 text-xs font-semibold text-emerald-300 transition hover:border-emerald-800 hover:bg-neutral-900"
            aria-label="Open profile and settings"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            <span>Profile</span>
          </button>
        </div>
        <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
          <button
            type="button"
            onClick={openDriveSettings}
            className="flex min-w-0 items-center gap-1.5 rounded-lg py-1 text-left"
            aria-label={`${driveStatusLabel}. Last successful sync: ${driveSyncTime}. Open sync settings.`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${driveStatusColor}`} aria-hidden="true" />
            <span className="truncate text-[9px] font-semibold text-neutral-300">{driveStatusLabel}</span>
            <span className="truncate text-[9px] text-neutral-500">· Last sync {driveSyncTime}</span>
          </button>
          {(driveSyncStatus === 'synced' || driveSyncStatus === 'syncing') ? (
            <button
              type="button"
              onClick={handleSyncDrive}
              disabled={driveSyncStatus === 'syncing'}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold text-emerald-300 disabled:opacity-50"
              aria-label="Sync FitLog with Google Drive now"
            >
              <RefreshCw className={`h-3 w-3 ${driveSyncStatus === 'syncing' ? 'animate-spin' : ''}`} aria-hidden="true" />
              Sync
            </button>
          ) : (
            <button type="button" onClick={openDriveSettings} className="shrink-0 px-2 py-1 text-[9px] font-bold text-emerald-300">Manage</button>
          )}
        </div>
      </header>

      <main className="w-full max-w-[430px] flex-1 px-4 pt-4 pb-5">
          {/* Screen 1: Dashboard */}
          {currentScreen === 0 && (
            <Dashboard
              routines={routines}
              exercises={exercises}
              onUpdateSettings={(updates) => setSettings((previous) => ({ ...previous, ...updates }))}
              onUpdateActiveWorkout={(updater) => setActiveWorkout((previous) => previous ? updater(previous) : previous)}
              onAddExerciseToActive={handleAddExerciseToActive}
              history={history}
              bodyWeights={bodyWeights}
              activeWorkout={activeWorkout}
              settings={settings}
              onStartEmptyWorkout={handleStartEmptyWorkout}
              onStartRoutine={handleStartRoutine}
              onResumeActiveWorkout={() => setCurrentScreen(2)}
              onNavigateToAnalytics={() => setCurrentScreen(3)}
              onNavigateToHistory={() => {
                setHistoryInitialTab('history');
                setCurrentScreen(4);
              }}
              onAddBodyWeight={handleAddBodyWeight}
              onOpenPlateCalc={() => {
                setPlateCalcInitialWeight(settings.weightUnit === 'lbs' ? 135 : 60);
                setIsPlateCalcOpen(true);
              }}
              onOpenOneRMCalc={() => setIsOneRMCalcOpen(true)}
            />
          )}

          {/* Screen 2: Active Workout */}
          {currentScreen === 2 && (
            activeWorkout ? (
              <ActiveWorkoutView
                workout={activeWorkout}
                settings={settings}
                routineDescription={routines.find((routine) => routine.id === activeWorkout.routineId)?.description}
                allExercises={exercises}
                history={history}
                onUpdateWorkout={(updater) => setActiveWorkout((prev) => (prev ? updater(prev) : null))}
                onFinishWorkout={handleFinishWorkout}
                onCancelWorkout={handleCancelWorkout}
                onOpenExercisePicker={() => setIsExercisePickerOpen(true)}
                onOpenPlateCalc={(wt) => {
                  setPlateCalcInitialWeight(wt || 135);
                  setIsPlateCalcOpen(true);
                }}
                onStartRestTimer={(sec, name) => setActiveRestTimer({ seconds: sec, exerciseName: name })}
                onMinimize={() => setCurrentScreen(0)}
              />
            ) : (
              <div className="py-20 flex flex-col items-center text-center gap-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400">
                  <Dumbbell className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">No Workout in Progress</h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                    Start a fresh empty session or choose from your saved routines.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleStartEmptyWorkout}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
                  >
                    Start Freestyle Session
                  </button>
                  <button
                    onClick={() => setCurrentScreen(1)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white font-semibold text-xs transition"
                  >
                    View Routines
                  </button>
                </div>
              </div>
            )
          )}

          {/* Screen 3: Routines */}
          {currentScreen === 1 && (
            <RoutinesView
              routines={routines}
              exercises={exercises}
              history={history}
              activeWorkout={activeWorkout}
              onStartRoutine={handleStartRoutine}
              onSaveRoutine={handleSaveRoutine}
              onDeleteRoutine={handleDeleteRoutine}
              onOpenExercisePicker={() => setIsExercisePickerOpen(true)}
            />
          )}

          {/* Screen 4: Analytics */}
          {currentScreen === 3 && (
            <AnalyticsView
              history={history}
              bodyWeights={bodyWeights}
              exercises={exercises}
              settings={settings}
              onAddBodyWeight={handleAddBodyWeight}
              onUpdateBodyWeight={handleUpdateBodyWeight}
              onOpenOneRMCalc={() => setIsOneRMCalcOpen(true)}
            />
          )}

          {/* Screen 5: History & Settings */}
          {currentScreen === 4 && (
            <HistoryAndSettingsView
              history={history}
              exercises={exercises}
              settings={settings}
              initialTab={historyInitialTab}
              onUpdateSettings={(newSt) => setSettings((prev) => ({ ...prev, ...newSt }))}
              onDeleteHistoryItem={handleDeleteHistoryItem}
              onUpdateHistoryItem={handleUpdateHistoryItem}
              onExportData={handleExportData}
              onImportData={handleImportData}
              driveConfigured={Boolean(GOOGLE_DRIVE_CLIENT_ID)}
              driveSyncStatus={driveSyncStatus}
              driveLastSyncedAt={driveLastSyncedAt}
              driveSyncMessage={driveSyncMessage}
              onConnectDrive={handleConnectDrive}
              onSyncDrive={handleSyncDrive}
              onDisconnectDrive={handleDisconnectDrive}
            />
          )}
      </main>

      {/* Floating Rest Timer Pill (if timer running) */}
      {activeRestTimer && (
        <RestTimerOverlay
          initialSeconds={activeRestTimer.seconds}
          exerciseName={activeRestTimer.exerciseName}
          soundEnabled={settings.soundEnabled}
          onFinish={() => setActiveRestTimer(null)}
          onClose={() => setActiveRestTimer(null)}
        />
      )}

      {/* Bottom Navigation Dock */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800/80 bg-neutral-950/95 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-lg flex justify-center">
        <div className="w-full max-w-[430px] flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.screen;

            if (item.isCenter) {
              return (
                <button
                  key={item.screen}
                  onClick={() => {
                    if (activeWorkout) {
                      setCurrentScreen(2);
                    } else {
                      handleStartEmptyWorkout();
                    }
                  }}
                  className="relative -top-5 flex flex-col items-center group focus:outline-none"
                  aria-label={item.label}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition transform active:scale-95 ${
                      activeWorkout
                        ? 'bg-gradient-to-tr from-emerald-500 to-emerald-400 text-neutral-950 shadow-emerald-500/30'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20'
                    }`}
                  >
                    <Icon className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 mt-1">
                    {activeWorkout ? 'Active' : 'Start'}
                  </span>
                  {item.hasPulse && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-neutral-950 animate-ping" />
                  )}
                </button>
              );
            }

            return (
              <button
                key={item.screen}
                onClick={() => {
                  if (item.screen === 4) setHistoryInitialTab('history');
                  setCurrentScreen(item.screen);
                }}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                  isActive
                    ? 'text-emerald-400 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                aria-label={item.label}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                <span className="text-[10px] font-medium tracking-tight">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-emerald-400 -mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals & Dialogs */}
      {isPlateCalcOpen && (
        <PlateCalculatorModal
          initialWeight={plateCalcInitialWeight}
          unit={settings.weightUnit}
          onClose={() => setIsPlateCalcOpen(false)}
          onApplyWeight={(wt) => {
            setPlateCalcInitialWeight(wt);
          }}
        />
      )}

      {isExercisePickerOpen && (
        <ExercisePickerModal
          exercises={exercises}
          onClose={() => setIsExercisePickerOpen(false)}
          onSelectExercise={handleAddExerciseToActive}
          onAddCustomExercise={(newEx) => setExercises((prev) => [newEx, ...prev])}
        />
      )}

      {isOneRMCalcOpen && (
        <OneRMCalculatorModal
          unit={settings.weightUnit}
          onClose={() => setIsOneRMCalcOpen(false)}
        />
      )}

      {completedWorkoutSummary && (
        <WorkoutCompletedModal
          workout={completedWorkoutSummary}
          unit={settings.weightUnit}
          soundEnabled={settings.soundEnabled}
          onClose={() => setCompletedWorkoutSummary(null)}
        />
      )}
    </div>
  );
}


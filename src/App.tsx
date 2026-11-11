import React, { useState, useEffect } from 'react';
import { Home, Dumbbell, PlusCircle, TrendingUp, History, Activity, UserRound } from 'lucide-react';
import { 
  RoutineTemplate, 
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
import { calculate1RM } from './utils/fitnessCalc';

const STORAGE_KEYS = {
  EXERCISES: 'fitlog_exercises_v1',
  ROUTINES: 'fitlog_routines_v1',
  HISTORY: 'fitlog_history_v1',
  BODY_WEIGHTS: 'fitlog_body_weights_v1',
  ACTIVE_WORKOUT: 'fitlog_active_workout_v1',
  SETTINGS: 'fitlog_settings_v1'
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

  // Workout Creation Handlers
  const handleStartEmptyWorkout = () => {
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
              weight: settings.weightUnit === 'lbs' ? 135 : 60,
              reps: 10,
              completed: false,
              previousWeight: 135,
              previousReps: 10
            }
          ]
        }
      ]
    };
    setActiveWorkout(newWorkout);
    setCurrentScreen(2); // Go to Active Workout screen
  };

  const handleStartRoutine = (routine: RoutineTemplate) => {
    const routineExercises: WorkoutExercise[] = routine.exercises.map((re, rIdx) => {
      const exObj = exercises.find((e) => e.id === re.exerciseId);
      const sets: WorkoutSet[] = Array.from({ length: re.defaultSets }).map((_, sIdx) => ({
        id: `s-${Date.now()}-${rIdx}-${sIdx}`,
        setNumber: sIdx + 1,
        type: 'normal',
        weight: settings.weightUnit === 'lbs' ? 135 : 60,
        reps: re.defaultReps,
        rpe: re.targetRpe,
        completed: false,
        previousWeight: 135,
        previousReps: re.defaultReps
      }));

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

    const newWorkout: ActiveWorkout = {
      id: `workout-${Date.now()}`,
      title: routine.title,
      routineId: routine.id,
      startTime: Date.now(),
      durationSeconds: 0,
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

  const handleAddExerciseToActive = (exercise: Exercise) => {
    if (!activeWorkout) return;
    const newEx: WorkoutExercise = {
      id: `we-${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      equipment: exercise.equipment,
      restSeconds: exercise.defaultRestSeconds || settings.defaultRestSeconds,
      sets: [
        {
          id: `s-${Date.now()}-1`,
          setNumber: 1,
          type: 'normal',
          weight: settings.weightUnit === 'lbs' ? 135 : 60,
          reps: 10,
          completed: false,
          previousWeight: 135,
          previousReps: 10
        }
      ]
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
    { screen: 4, label: 'History', icon: History }
  ];

  return (
    <div className="min-h-screen bg-[#0d100e] text-neutral-100 flex flex-col items-center justify-start pb-24">
      <header className="w-full max-w-[430px] px-4 py-3 border-b border-neutral-800/80 bg-neutral-950/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-900/50 border border-emerald-800/70 flex items-center justify-center text-emerald-300">
              <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white">FitLog</h1>
            <p className="text-[9px] text-neutral-400">Training log</p>
          </div>
        </div>
        <button
          onClick={() => {
            setHistoryInitialTab('settings');
            setCurrentScreen(4);
          }}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3 text-xs font-semibold text-emerald-300 transition hover:border-emerald-800 hover:bg-neutral-900"
          aria-label="Open profile and settings"
        >
          <UserRound className="h-4 w-4" aria-hidden="true" />
          <span>Profile</span>
        </button>
      </header>

      <main className="w-full max-w-[430px] flex-1 px-4 pt-4 pb-5">
          {/* Screen 1: Dashboard */}
          {currentScreen === 0 && (
            <Dashboard
              routines={routines}
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
              onExportData={handleExportData}
              onImportData={handleImportData}
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


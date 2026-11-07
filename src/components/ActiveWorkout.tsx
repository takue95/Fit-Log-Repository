import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Check, 
  Plus, 
  Trash2, 
  Dumbbell, 
  Timer, 
  ChevronDown, 
  X, 
  Layers, 
  Calculator, 
  MoreVertical,
  AlertCircle,
  FileText,
  ArrowLeftRight,
  Sparkles,
  Edit3,
  ListFilter,
  CheckCircle2
} from 'lucide-react';
import { 
  ActiveWorkout, 
  WorkoutExercise, 
  WorkoutSet, 
  SetType, 
  UserSettings, 
  Exercise,
  CompletedWorkout
} from '../types/fitness';
import { 
  formatTimeMMSS, 
  generateRepOptions, 
  generateWeightOptions, 
  getAdaptiveSuggestion, 
  calculateStartingWeight,
  AdaptiveSuggestion 
} from '../utils/fitnessCalc';
import { ExerciseSwapModal } from './modals/ExerciseSwapModal';
import { NumericInput } from './NumericInput';

interface ActiveWorkoutProps {
  workout: ActiveWorkout;
  settings: UserSettings;
  allExercises?: Exercise[];
  history?: CompletedWorkout[];
  onUpdateWorkout: (updater: (prev: ActiveWorkout) => ActiveWorkout) => void;
  onFinishWorkout: () => void;
  onCancelWorkout: () => void;
  onOpenExercisePicker: () => void;
  onOpenPlateCalc: (currentWeight?: number) => void;
  onStartRestTimer: (seconds: number, exerciseName: string) => void;
  onMinimize: () => void;
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutProps> = ({
  workout,
  settings,
  allExercises = [],
  history = [],
  onUpdateWorkout,
  onFinishWorkout,
  onCancelWorkout,
  onOpenExercisePicker,
  onOpenPlateCalc,
  onStartRestTimer,
  onMinimize
}) => {
  const [elapsed, setElapsed] = useState<number>(workout.durationSeconds || 0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [activeMenuExerciseId, setActiveMenuExerciseId] = useState<string | null>(null);
  
  // Mid-workout exercise swapping
  const [exerciseToSwap, setExerciseToSwap] = useState<WorkoutExercise | null>(null);

  // Per-set manual keypad input toggles (if user wants to type arbitrary numbers)
  const [manualInputSets, setManualInputSets] = useState<Record<string, { weight?: boolean; reps?: boolean }>>({});

  // Adaptive suggestions per exercise
  const [adaptiveHints, setAdaptiveHints] = useState<Record<string, AdaptiveSuggestion>>({});

  // Rep options constant
  const standardRepOptions = useMemo(() => generateRepOptions(), []);

  // Live timer tick
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        onUpdateWorkout((w) => ({ ...w, durationSeconds: next }));
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, onUpdateWorkout]);

  // Check if an exercise has ever been recorded in history
  const hasHistoryForExercise = (exerciseId: string, exerciseName: string): boolean => {
    return history.some((h) =>
      h.exercises.some(
        (ex) =>
          ex.exerciseId === exerciseId ||
          ex.exerciseName.toLowerCase() === exerciseName.toLowerCase()
      )
    );
  };

  // Get estimated starting weight for an exercise
  const getStartingWeightForExercise = (exercise: WorkoutExercise): number => {
    const fullEx = allExercises.find((e) => e.id === exercise.exerciseId) || {
      id: exercise.exerciseId,
      name: exercise.exerciseName,
      category: exercise.category,
      equipment: exercise.equipment,
      primaryMuscles: [exercise.category],
      instructions: [],
      defaultRestSeconds: exercise.restSeconds
    };

    return calculateStartingWeight(fullEx, {
      userWeight: settings.userWeight,
      userHeightCm: settings.userHeightCm,
      userExperience: settings.userExperience,
      userGender: settings.userGender,
      unit: settings.weightUnit
    });
  };

  // Apply estimated starting weight to uncompleted sets of an exercise
  const handleApplyStartingWeight = (exerciseId: string, estWeight: number) => {
    onUpdateWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.completed) return s;
            return { ...s, weight: estWeight };
          })
        };
      })
    }));
  };

  // Handle set completion check & trigger adaptive next set
  const toggleSetComplete = (exerciseId: string, setId: string) => {
    let completedNow = false;
    let completedSetObj: WorkoutSet | null = null;
    let exObj: WorkoutExercise | null = null;
    let restSecs = settings.defaultRestSeconds;

    onUpdateWorkout((prev) => {
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          exObj = ex;
          restSecs = ex.restSeconds || settings.defaultRestSeconds;

          // Find the set being toggled
          const currentSet = ex.sets.find((s) => s.id === setId);
          const willComplete = currentSet ? !currentSet.completed : false;
          if (willComplete && currentSet) {
            completedNow = true;
            completedSetObj = { ...currentSet, completed: true };
          }

          // If completing, calculate adaptive next set
          let nextSets = ex.sets.map((s) => {
            if (s.id !== setId) return s;
            return { ...s, completed: willComplete };
          });

          // If user just completed this set, automatically adjust the next uncompleted set!
          if (willComplete && completedSetObj) {
            const suggestion = getAdaptiveSuggestion(
              completedSetObj,
              ex.equipment,
              settings.weightUnit
            );
            
            // Auto-adjust the immediate next uncompleted set
            const nextUncompletedIdx = nextSets.findIndex(
              (s) => s.id !== setId && !s.completed && s.setNumber > currentSet!.setNumber
            );

            if (nextUncompletedIdx !== -1) {
              nextSets = nextSets.map((s, idx) => {
                if (idx === nextUncompletedIdx) {
                  return {
                    ...s,
                    weight: suggestion.targetWeight,
                    reps: suggestion.targetReps,
                    previousWeight: completedSetObj?.weight,
                    previousReps: completedSetObj?.reps
                  };
                }
                return s;
              });
            }
          }

          return {
            ...ex,
            sets: nextSets
          };
        })
      };
    });

    // Save adaptive suggestion hint for UI display
    if (completedNow && completedSetObj && exObj) {
      const suggestion = getAdaptiveSuggestion(
        completedSetObj,
        (exObj as WorkoutExercise).equipment,
        settings.weightUnit
      );
      setAdaptiveHints((prev) => ({
        ...prev,
        [exerciseId]: suggestion
      }));
    }

    if (completedNow && settings.autoStartRestTimer && exObj) {
      onStartRestTimer(restSecs, (exObj as WorkoutExercise).exerciseName);
    }
  };

  const updateSetValue = (
    exerciseId: string, 
    setId: string, 
    field: 'weight' | 'reps' | 'rpe' | 'type', 
    val: unknown
  ) => {
    onUpdateWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            return { ...s, [field]: val };
          })
        };
      })
    }));
  };

  // Apply adaptive suggestion manually to all remaining uncompleted sets
  const handleApplyAdaptiveSuggestion = (exerciseId: string, suggestion: AdaptiveSuggestion) => {
    onUpdateWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.completed) return s;
            return {
              ...s,
              weight: suggestion.targetWeight,
              reps: suggestion.targetReps
            };
          })
        };
      })
    }));
  };

  // Swap exercise mid-workout
  const handleExecuteSwap = (newExercise: Exercise) => {
    if (!exerciseToSwap) return;

    const estStarting = calculateStartingWeight(newExercise, {
      userWeight: settings.userWeight,
      userHeightCm: settings.userHeightCm,
      userExperience: settings.userExperience,
      userGender: settings.userGender,
      unit: settings.weightUnit
    });

    onUpdateWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseToSwap.id) return ex;
        return {
          ...ex,
          exerciseId: newExercise.id,
          exerciseName: newExercise.name,
          category: newExercise.category,
          equipment: newExercise.equipment,
          restSeconds: newExercise.defaultRestSeconds || ex.restSeconds,
          // Update uncompleted sets to new exercise's starting weight if equipment changed
          sets: ex.sets.map((s) => {
            if (s.completed) return s;
            return {
              ...s,
              weight: estStarting
            };
          })
        };
      })
    }));

    setExerciseToSwap(null);
    setActiveMenuExerciseId(null);
  };

  const addSet = (exerciseId: string) => {
    onUpdateWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        
        let initialWeight = lastSet ? lastSet.weight : (settings.weightUnit === 'lbs' ? 135 : 60);
        let initialReps = lastSet ? lastSet.reps : 10;

        // If adaptive hint exists, follow it
        const hint = adaptiveHints[exerciseId];
        if (hint) {
          initialWeight = hint.targetWeight;
          initialReps = hint.targetReps;
        }

        const newSet: WorkoutSet = {
          id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          setNumber: ex.sets.length + 1,
          type: 'normal',
          weight: initialWeight,
          reps: initialReps,
          completed: false,
          previousWeight: lastSet?.weight,
          previousReps: lastSet?.reps
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet]
        };
      })
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    onUpdateWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const remaining = ex.sets.filter((s) => s.id !== setId);
        return {
          ...ex,
          sets: remaining.map((s, idx) => ({ ...s, setNumber: idx + 1 }))
        };
      })
    }));
  };

  const removeExercise = (exerciseId: string) => {
    onUpdateWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.id !== exerciseId)
    }));
    setActiveMenuExerciseId(null);
  };

  const toggleManualInput = (setId: string, type: 'weight' | 'reps') => {
    setManualInputSets((prev) => ({
      ...prev,
      [setId]: {
        ...prev[setId],
        [type]: !prev[setId]?.[type]
      }
    }));
  };

  const totalCompletedSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  const totalVolume = workout.exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets
        .filter((s) => s.completed)
        .reduce((sSum, s) => sSum + s.weight * s.reps, 0),
    0
  );

  return (
    <div className="flex flex-col gap-4 pb-12 animate-in fade-in duration-200">
      {/* Top Floating Control Bar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700/80 hover:bg-neutral-800 transition"
          >
            {isTimerRunning ? (
              <Pause className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
            )}
            <span className="font-mono font-bold text-sm text-emerald-400">
              {formatTimeMMSS(elapsed)}
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
            <span>•</span>
            <span>{totalCompletedSets} sets</span>
            <span>•</span>
            <span className="font-mono font-medium text-neutral-200">
              {totalVolume.toLocaleString()} {settings.weightUnit}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMinimize}
            className="px-2.5 py-1.5 rounded-xl text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 text-xs font-semibold transition"
          >
            Minimize
          </button>

          <button
            onClick={() => setShowCancelConfirm(true)}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-red-400 bg-neutral-900 border border-neutral-800 transition"
            title="Cancel Workout"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={onFinishWorkout}
            disabled={totalCompletedSets === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
          >
            <Check className="w-4 h-4" />
            Finish
          </button>
        </div>
      </div>

      {/* Workout Title Banner */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col gap-1.5 shadow-md">
        <input
          type="text"
          value={workout.title}
          onChange={(e) =>
            onUpdateWorkout((prev) => ({ ...prev, title: e.target.value }))
          }
          className="text-lg font-extrabold bg-transparent text-white border-b border-transparent hover:border-neutral-700 focus:border-emerald-500 focus:outline-none transition py-0.5"
          placeholder="Workout Title..."
        />
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Started {new Date(workout.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-emerald-400 font-medium">
            {workout.exercises.length} exercises configured
          </span>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {workout.exercises.map((exercise, exIndex) => {
          const isNewExercise = !hasHistoryForExercise(exercise.exerciseId, exercise.exerciseName);
          const estStartingWeight = getStartingWeightForExercise(exercise);
          const adaptiveHint = adaptiveHints[exercise.id];
          const weightOptions = generateWeightOptions(exercise.equipment, settings.weightUnit);

          return (
            <div
              key={exercise.id}
              className="rounded-2xl bg-neutral-900 border border-neutral-800/90 shadow-md overflow-hidden"
            >
              {/* Exercise Header */}
              <div className="p-4 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="w-6 h-6 rounded-lg bg-neutral-800 flex items-center justify-center text-[11px] font-bold text-emerald-400 shrink-0">
                    {exIndex + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {exercise.exerciseName}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                      <span className="text-emerald-400 font-medium">{exercise.category}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px]">
                        {exercise.equipment}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Exercise Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Swap Exercise Button (In-workout exchange) */}
                  <button
                    type="button"
                    onClick={() => setExerciseToSwap(exercise)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition border border-neutral-700/60"
                    title="Swap exercise for another in the same movement line"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Swap</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const firstWeight = exercise.sets[0]?.weight || 135;
                      onOpenPlateCalc(firstWeight);
                    }}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                    title="Plate Calculator"
                  >
                    <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onStartRestTimer(exercise.restSeconds || settings.defaultRestSeconds, exercise.exerciseName)
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                    title="Start Rest Timer"
                  >
                    <Timer className="w-3.5 h-3.5 text-neutral-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveMenuExerciseId(
                        activeMenuExerciseId === exercise.id ? null : exercise.id
                      )
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Starting Weight Estimator Banner for New Exercises */}
              {isNewExercise && (
                <div className="px-4 py-2.5 bg-gradient-to-r from-neutral-950/40 via-neutral-900 to-neutral-950/20 border-b border-neutral-800/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="text-neutral-300 text-[11px] truncate">
                      <strong className="text-neutral-300 font-semibold">New Exercise:</strong> Est. starting weight is{' '}
                      <span className="font-mono font-bold text-white">
                        {estStartingWeight} {settings.weightUnit}
                      </span>{' '}
                      ({settings.userExperience || 'Intermediate'} level)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyStartingWeight(exercise.id, estStartingWeight)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-500/20 hover:bg-neutral-500/30 text-neutral-300 border border-neutral-500/40 font-bold text-[11px] shrink-0 transition"
                  >
                    Apply Est.
                  </button>
                </div>
              )}

              {/* Adaptive Next Set Suggestion Pill */}
              {adaptiveHint && (
                <div className="px-4 py-2 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-emerald-950/20 border-b border-emerald-800/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                          adaptiveHint.badge === 'Overload'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : adaptiveHint.badge === 'Back-off'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-neutral-500/20 text-neutral-400 border border-neutral-500/40'
                        }`}>
                          {adaptiveHint.badge}
                        </span>
                        <span className="text-neutral-200 font-bold text-[11px]">
                          Target: {adaptiveHint.targetWeight} {settings.weightUnit} × {adaptiveHint.targetReps} reps
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                        {adaptiveHint.reason}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyAdaptiveSuggestion(exercise.id, adaptiveHint)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] shrink-0 transition"
                  >
                    Apply Target
                  </button>
                </div>
              )}

              {/* Exercise dropdown actions */}
              {activeMenuExerciseId === exercise.id && (
                <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">Rest Timer:</span>
                    <select
                      value={exercise.restSeconds}
                      onChange={(e) => {
                        const newRest = parseInt(e.target.value);
                        onUpdateWorkout((prev) => ({
                          ...prev,
                          exercises: prev.exercises.map((ex) =>
                            ex.id === exercise.id ? { ...ex, restSeconds: newRest } : ex
                          )
                        }));
                      }}
                      className="bg-neutral-900 border border-neutral-700 text-white rounded px-2 py-1 text-xs"
                    >
                      <option value="60">60s (1m)</option>
                      <option value="90">90s (1.5m)</option>
                      <option value="120">120s (2m)</option>
                      <option value="180">180s (3m)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setExerciseToSwap(exercise);
                        setActiveMenuExerciseId(null);
                      }}
                      className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      Swap Movement
                    </button>

                    <button
                      type="button"
                      onClick={() => removeExercise(exercise.id)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Compact one-line set logger */}
              <div className="px-2 pb-2 pt-1">
                <div className="grid grid-cols-[1.5rem_2.2rem_repeat(3,minmax(0,1fr))_1.75rem] items-center gap-1 border-b border-neutral-800/70 px-1 pb-1.5 text-center text-[8px] font-bold uppercase tracking-wide text-neutral-500">
                  <span>Set</span><span>Prev</span>
                  <span>{exercise.equipment === 'Dumbbell' ? 'Wt/ea' : `Wt (${settings.weightUnit})`}</span>
                  <span>Reps</span><span>RPE</span><span>✓</span>
                </div>
                <div className="divide-y divide-neutral-800/50">
                  {exercise.sets.map((set, sIdx) => {
                    const isWarmup = set.type === 'warmup';
                    const isDrop = set.type === 'drop';
                    const isManualWeight = !!manualInputSets[set.id]?.weight;
                    const isManualReps = !!manualInputSets[set.id]?.reps;
                    const hasCurrentWeightInOptions = weightOptions.some((option) => option.value === set.weight);
                    const setControlClass = 'h-full min-w-0 w-full border-0 bg-transparent px-1 pr-3 text-center font-mono text-base font-bold text-white outline-none appearance-none';

                    return (
                      <div
                        key={set.id}
                        className={`grid grid-cols-[1.5rem_2.2rem_repeat(3,minmax(0,1fr))_1.75rem] items-center gap-1 px-1 py-1.5 ${set.completed ? 'bg-emerald-950/20' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const nextType: SetType = set.type === 'normal' ? 'warmup' : set.type === 'warmup' ? 'drop' : 'normal';
                            updateSetValue(exercise.id, set.id, 'type', nextType);
                          }}
                          className={`grid h-6 w-6 place-items-center rounded-md font-mono text-[10px] font-bold ${isWarmup ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : isDrop ? 'border border-neutral-500/40 bg-neutral-500/20 text-neutral-300' : 'bg-neutral-800 text-neutral-200'}`}
                          aria-label={`Set ${sIdx + 1}, ${isWarmup ? 'warmup' : isDrop ? 'drop set' : 'normal set'}; tap to change type`}
                        >{isWarmup ? 'W' : isDrop ? 'D' : sIdx + 1}</button>

                        <span className="truncate text-center font-mono text-[9px] text-neutral-500" title={set.previousWeight && set.previousWeight > 0 ? `Previous: ${set.previousWeight} × ${set.previousReps || 8}` : 'New set'}>
                          {set.previousWeight !== undefined && set.previousWeight > 0 ? `${set.previousWeight}×${set.previousReps || 8}` : '—'}
                        </span>

                        <div className="relative h-7 w-[3.75rem] min-w-0 max-w-full justify-self-center overflow-hidden rounded-lg border border-neutral-700/80 bg-neutral-950 focus-within:border-emerald-500">
                          {isManualWeight ? (
                            <NumericInput value={set.weight} onValueChange={(value) => updateSetValue(exercise.id, set.id, 'weight', value)} min={0} step={exercise.equipment === 'Dumbbell' ? 1 : 2.5} aria-label={`Set ${sIdx + 1} weight`} className={setControlClass} />
                          ) : (
                            <select value={set.weight} onChange={(event) => { const value = event.target.value; if (value === '__custom__') toggleManualInput(set.id, 'weight'); else updateSetValue(exercise.id, set.id, 'weight', parseFloat(value) || 0); }} aria-label={`Set ${sIdx + 1} weight`} className={setControlClass}>
                              {!hasCurrentWeightInOptions && set.weight > 0 && <option value={set.weight}>{set.weight}</option>}
                              {weightOptions.map((option) => <option key={option.value} value={option.value}>{String(option.value)}</option>)}
                              <option value="__custom__">Custom</option>
                            </select>
                          )}
                          <button type="button" onClick={() => toggleManualInput(set.id, 'weight')} className="absolute inset-y-0 right-0 grid w-3 place-items-center bg-neutral-950 text-neutral-500 hover:text-neutral-200" aria-label={isManualWeight ? 'Choose weight from list' : 'Enter custom weight'}><Edit3 className="h-2.5 w-2.5" /></button>
                        </div>

                        <div className="relative h-7 w-[3.75rem] min-w-0 max-w-full justify-self-center overflow-hidden rounded-lg border border-neutral-700/80 bg-neutral-950 focus-within:border-emerald-500">
                          {isManualReps ? (
                            <NumericInput value={set.reps} onValueChange={(value) => updateSetValue(exercise.id, set.id, 'reps', Math.round(value))} min={1} step={1} aria-label={`Set ${sIdx + 1} reps`} className={setControlClass} />
                          ) : (
                            <select value={set.reps} onChange={(event) => { const value = event.target.value; if (value === '__custom__') toggleManualInput(set.id, 'reps'); else updateSetValue(exercise.id, set.id, 'reps', parseInt(value) || 0); }} aria-label={`Set ${sIdx + 1} reps`} className={setControlClass}>
                              {!standardRepOptions.includes(set.reps) && set.reps > 0 && <option value={set.reps}>{set.reps}</option>}
                              {standardRepOptions.map((rep) => <option key={rep} value={rep}>{rep}</option>)}
                              <option value="__custom__">Custom</option>
                            </select>
                          )}
                          <button type="button" onClick={() => toggleManualInput(set.id, 'reps')} className="absolute inset-y-0 right-0 grid w-3 place-items-center bg-neutral-950 text-neutral-500 hover:text-neutral-200" aria-label={isManualReps ? 'Choose reps from list' : 'Enter custom reps'}><Edit3 className="h-2.5 w-2.5" /></button>
                        </div>

                        <div className="relative h-7 w-[3.75rem] min-w-0 max-w-full justify-self-center overflow-hidden rounded-lg border border-neutral-700/80 bg-neutral-950 focus-within:border-emerald-500">
                          <select value={set.rpe || ''} onChange={(event) => updateSetValue(exercise.id, set.id, 'rpe', event.target.value ? parseFloat(event.target.value) : undefined)} aria-label={`Set ${sIdx + 1} RPE`} className={`${setControlClass} text-neutral-200`}>
                            <option value="">—</option><option value="6">6</option><option value="7">7</option><option value="7.5">7.5</option><option value="8">8</option><option value="8.5">8.5</option><option value="9">9</option><option value="9.5">9.5</option><option value="10">10</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-neutral-500" />
                        </div>

                        <button type="button" onClick={() => toggleSetComplete(exercise.id, set.id)} className={`grid h-7 w-7 place-items-center rounded-lg transition ${set.completed ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-500 hover:text-neutral-200'}`} aria-label={set.completed ? `Mark set ${sIdx + 1} incomplete` : `Mark set ${sIdx + 1} complete`}>
                          <Check className="h-4 w-4 stroke-[3]" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Add Set Footer */}
              <div className="p-3 bg-neutral-950/40 border-t border-neutral-800/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => addSet(exercise.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition px-2 py-1 rounded hover:bg-neutral-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Set
                </button>

                {exercise.sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      removeSet(
                        exercise.id,
                        exercise.sets[exercise.sets.length - 1].id
                      )
                    }
                    className="text-[11px] text-neutral-500 hover:text-red-400 transition"
                  >
                    Delete Last Set
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Exercise CTA */}
      <button
        type="button"
        onClick={onOpenExercisePicker}
        className="w-full py-4 rounded-2xl bg-neutral-900 border-2 border-dashed border-neutral-700 hover:border-emerald-500/60 hover:bg-neutral-800/40 transition flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm shadow-md"
      >
        <Plus className="w-4 h-4" />
        Add Exercise to Workout
      </button>

      {/* Exercise Swap Modal */}
      {exerciseToSwap && (
        <ExerciseSwapModal
          currentExercise={exerciseToSwap}
          allExercises={allExercises}
          onSelectSwap={handleExecuteSwap}
          onClose={() => setExerciseToSwap(null)}
        />
      )}

      {/* Cancel Workout Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Discard Workout?</h4>
                <p className="text-xs text-neutral-400">All uncompleted sets will be lost.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Keep Lifting
              </button>
              <button
                onClick={onCancelWorkout}
                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl shadow"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

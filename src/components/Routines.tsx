import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Play, 
  Clock, 
  Dumbbell, 
  Trash2, 
  Layers, 
  Sparkles, 
  Check, 
  ChevronRight, 
  X,
  Target
} from 'lucide-react';
import { RoutineTemplate, Exercise, CompletedWorkout, ActiveWorkout } from '../types/fitness';
import { NumericInput } from './NumericInput';
import { MuscleMap } from '@musclemap/react';
import type { MuscleGroup as MapMuscleGroup, MuscleMapRegion, MuscleMapValues } from '@musclemap/core';
import maleFront from '@musclemap/assets/bodies/male-front.webp';
import maleBack from '@musclemap/assets/bodies/male-back.webp';

const CATEGORY_MUSCLES: Partial<Record<Exercise['category'], MapMuscleGroup>> = {
  Chest: 'CHEST',
  Back: 'LATS',
  Shoulders: 'SHOULDERS_SIDE',
  Quads: 'QUADS',
  Hamstrings: 'HAMSTRINGS',
  Glutes: 'GLUTES',
  Biceps: 'BICEPS',
  Forearms: 'FOREARMS',
  Triceps: 'TRICEPS',
  Core: 'CORE',
  Calves: 'CALVES'
};

function mapAnatomyToMuscles(name: string): MapMuscleGroup[] {
  const value = name.toLowerCase();
  if (value.includes('pectoral') || value.includes('chest')) return ['CHEST'];
  if (value.includes('trapez') || value.includes('trap')) return ['TRAPEZIUS'];
  if (value.includes('rhomboid') || value.includes('mid back') || value.includes('upper back')) return ['RHOMBOIDS'];
  if (value.includes('rear delt') || value.includes('posterior delt') || value.includes('rear deltoid')) return ['SHOULDERS_REAR'];
  if (value.includes('front delt') || value.includes('anterior delt') || value.includes('front deltoid')) return ['SHOULDERS_FRONT'];
  if (value.includes('side delt') || value.includes('lateral delt') || value.includes('side deltoid')) return ['SHOULDERS_SIDE'];
  if (value.includes('tricep')) return ['TRICEPS'];
  if (value.includes('bicep') || value.includes('brachialis')) return ['BICEPS'];
  if (value.includes('forearm') || value.includes('grip')) return ['FOREARMS'];
  if (value.includes('shoulder') || value.includes('deltoid') || value.includes('delt')) return ['SHOULDERS_SIDE'];
  if (value.includes('latissimus') || value.includes('lats')) return ['LATS'];
  if (value.includes('lower back') || value.includes('erector')) return ['BACK_LOWER'];
  if (value.includes('oblique')) return ['OBLIQUES'];
  if (value.includes('abdominal') || value.includes('abs') || value.includes('core')) return ['CORE'];
  if (value.includes('glute')) return ['GLUTES'];
  if (value.includes('quad')) return ['QUADS'];
  if (value.includes('hamstring')) return ['HAMSTRINGS'];
  if (value.includes('calf') || value.includes('gastrocnemius') || value.includes('soleus')) return ['CALVES'];
  if (value.includes('adductor')) return ['ADDUCTORS'];
  if (value.includes('abductor')) return ['ABDUCTORS'];
  return [];
}

function getRoutineMuscleMap(routine: RoutineTemplate, exercises: Exercise[]) {
  const scores = new Map<MapMuscleGroup, number>();
  const add = (group: MapMuscleGroup, points: number) => scores.set(group, (scores.get(group) || 0) + points);

  routine.exercises.forEach((routineExercise) => {
    const exercise = exercises.find((item) => item.id === routineExercise.exerciseId);
    if (!exercise) return;
    const primaryGroups = exercise.primaryMuscles.flatMap(mapAnatomyToMuscles);
    const fallbackGroups = primaryGroups.length ? primaryGroups : [CATEGORY_MUSCLES[exercise.category]].filter(Boolean) as MapMuscleGroup[];
    fallbackGroups.forEach((group) => add(group, 60));
  });

  const maximum = Math.max(1, ...scores.values());
  const values = Object.fromEntries(
    [...scores.entries()].map(([group, score]) => [group, { score: Math.max(28, Math.round((score / maximum) * 100)) }])
  ) as MuscleMapValues;
  return { values, view: 'BOTH' as const };
}

const RoutineMuscleThumbnail: React.FC<{ routine: RoutineTemplate; exercises: Exercise[] }> = ({ routine, exercises }) => {
  const { values, view } = getRoutineMuscleMap(routine, exercises);
  return (
    <div
      className="w-[128px] h-[104px] shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950"
      role="img"
      aria-label={`Muscle focus for ${routine.title}`}
    >
      <MuscleMap
        values={values}
        sex="MALE"
        view={view}
        monochromeColor="#39d98a"
        monochromeBaseColor="#465148"
        glow={false}
        showLegend={false}
        tooltipFields={[]}
        figureWidth={64}
        className="routine-muscle-map muscle-focus-map muscle-map-figures paired-view"
        style={{ width: '100%', height: '100%', justifyContent: 'center' }}
      />
    </div>
  );
};

interface RoutinesProps {
  routines: RoutineTemplate[];
  exercises: Exercise[];
  history: CompletedWorkout[];
  activeWorkout: ActiveWorkout | null;
  onStartRoutine: (routine: RoutineTemplate) => void;
  onSaveRoutine: (routine: RoutineTemplate) => void;
  onDeleteRoutine: (routineId: string) => void;
  onOpenExercisePicker: () => void;
}

const SPLIT_PREFERENCE_KEY = 'fitlog_current_split_v1';

const splitNameForRoutine = (routine: RoutineTemplate) => {
  if (routine.title.toLowerCase().includes('arnold split')) return 'Arnold Split';
  if (routine.isCustom || routine.category === 'Custom') return 'Custom';
  return routine.category;
};

const inferCurrentSplit = (
  routines: RoutineTemplate[],
  history: CompletedWorkout[],
  activeWorkout: ActiveWorkout | null
) => {
  const activeRoutine = activeWorkout?.routineId
    ? routines.find((routine) => routine.id === activeWorkout.routineId)
    : undefined;
  if (activeRoutine) return splitNameForRoutine(activeRoutine);

  const recentWorkouts = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const workout of recentWorkouts) {
    const routine = routines.find((item) =>
      (workout as CompletedWorkout & { routineId?: string }).routineId === item.id ||
      workout.title.toLowerCase() === item.title.toLowerCase()
    );
    if (routine) return splitNameForRoutine(routine);
  }

  const available = Array.from(new Set(routines.map(splitNameForRoutine)));
  return available.includes('Arnold Split')
    ? 'Arnold Split'
    : available.includes('Push / Pull / Legs')
      ? 'Push / Pull / Legs'
      : available[0] || 'All';
};

export const RoutinesView: React.FC<RoutinesProps> = ({
  routines,
  exercises,
  history,
  activeWorkout,
  onStartRoutine,
  onSaveRoutine,
  onDeleteRoutine
}) => {
  const [selectedSplit, setSelectedSplit] = useState<string>(() => {
    const inferred = inferCurrentSplit(routines, history, activeWorkout);
    try {
      const saved = localStorage.getItem(SPLIT_PREFERENCE_KEY);
      return saved && routines.some((routine) => splitNameForRoutine(routine) === saved) ? saved : inferred;
    } catch {
      return inferred;
    }
  });
  const [splitView, setSplitView] = useState<'current' | 'browse'>('current');
  const [browsedSplit, setBrowsedSplit] = useState<string>(() => {
    const inferred = inferCurrentSplit(routines, history, activeWorkout);
    try {
      const saved = localStorage.getItem(SPLIT_PREFERENCE_KEY);
      return saved && routines.some((routine) => splitNameForRoutine(routine) === saved) ? saved : inferred;
    } catch {
      return inferred;
    }
  });
  const [isCreatingRoutine, setIsCreatingRoutine] = useState<boolean>(false);
  const [viewingRoutine, setViewingRoutine] = useState<RoutineTemplate | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SPLIT_PREFERENCE_KEY, selectedSplit);
    } catch {
      // Keep the selection available for this session if browser storage is disabled.
    }
    window.dispatchEvent(new CustomEvent('fitlog-split-change', { detail: selectedSplit }));
  }, [selectedSplit]);

  // New routine builder form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RoutineTemplate['category']>('Custom');
  const [difficulty, setDifficulty] = useState<RoutineTemplate['difficulty']>('Intermediate');
  const [selectedExIds, setSelectedExIds] = useState<{ exerciseId: string; defaultSets: number; defaultReps: number }[]>([
    { exerciseId: 'barbell-bench-press', defaultSets: 3, defaultReps: 8 }
  ]);

  const splitOptions = Array.from(new Set(routines.map(splitNameForRoutine)));
  const currentSplitRoutines = routines
    .filter((routine) => splitNameForRoutine(routine) === selectedSplit)
    .sort((a, b) => {
      const order = (title: string) =>
        title.toLowerCase().includes('chest & back') ? 0 :
        title.toLowerCase().includes('legs') ? 1 :
        title.toLowerCase().includes('shoulders & arms') ? 2 : 3;
      return order(a.title) - order(b.title);
    });
  const visibleRoutines = splitView === 'current'
    ? currentSplitRoutines
    : routines.filter((routine) => splitNameForRoutine(routine) === browsedSplit);

  const handleAddExerciseToRoutine = (exId: string) => {
    setSelectedExIds((prev) => [
      ...prev,
      { exerciseId: exId, defaultSets: 3, defaultReps: 10 }
    ]);
  };

  const handleRemoveExerciseFromRoutine = (index: number) => {
    setSelectedExIds((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveNewRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedExIds.length === 0) return;

    const newRoutine: RoutineTemplate = {
      id: `custom-routine-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Custom created workout routine.',
      category: 'Custom',
      difficulty,
      estimatedMinutes: Math.max(30, selectedExIds.length * 12),
      isCustom: true,
      exercises: selectedExIds
    };

    onSaveRoutine(newRoutine);
    setIsCreatingRoutine(false);
    setTitle('');
    setDescription('');
    setSelectedExIds([{ exerciseId: 'barbell-bench-press', defaultSets: 3, defaultReps: 8 }]);
  };

  return (
    <div className="flex flex-col gap-5 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Workout Routines</h2>
          <p className="text-xs text-neutral-400">Structured programs & custom templates</p>
        </div>

        <button
          onClick={() => setIsCreatingRoutine(true)}
          className="flex shrink-0 self-start items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          Create Routine
        </button>
      </div>

      <div className="flex rounded-xl border border-neutral-800 bg-neutral-950 p-1">
        <button
          onClick={() => setSplitView('current')}
          className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold transition ${
            splitView === 'current' ? 'bg-emerald-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Current Split
        </button>
        <button
          onClick={() => {
            setBrowsedSplit(selectedSplit);
            setSplitView('browse');
          }}
          className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold transition ${
            splitView === 'browse' ? 'bg-emerald-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Browse Splits
        </button>
      </div>

      {splitView === 'current' ? (
        <section className="rounded-2xl border border-emerald-800/50 bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-900 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.14em] text-emerald-300">Your current split</p>
              <h3 className="mt-1 text-lg font-extrabold text-white">{selectedSplit}</h3>
              <p className="mt-1 text-[11px] text-neutral-400">{currentSplitRoutines.length} workout{currentSplitRoutines.length === 1 ? '' : 's'} in this plan</p>
            </div>
            <button
              onClick={() => {
                setBrowsedSplit(selectedSplit);
                setSplitView('browse');
              }}
              className="shrink-0 rounded-xl border border-emerald-800/70 bg-emerald-950/40 px-3 py-2 text-[11px] font-bold text-emerald-300 hover:bg-emerald-950/70"
            >
              Browse splits
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-neutral-300">Browse splits · preview only</p>
              <p className="mt-1 px-1 text-[10px] text-neutral-500">Your current split stays {selectedSplit} until you choose to change it.</p>
            </div>
            {browsedSplit !== selectedSplit ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedSplit(browsedSplit);
                  setSplitView('current');
                }}
                className="shrink-0 rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-bold text-neutral-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400"
              >
                Change to this split
              </button>
            ) : (
              <span className="shrink-0 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-3 py-2 text-[10px] font-bold text-emerald-300">Current split</span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {splitOptions.map((split) => (
              <button
                key={split}
                type="button"
                aria-pressed={browsedSplit === split}
                onClick={() => setBrowsedSplit(split)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  browsedSplit === split
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                {split}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {visibleRoutines.map((routine) => (
          <div
            key={routine.id}
            className="group rounded-2xl bg-neutral-900 border border-neutral-800/90 hover:border-emerald-800/60 p-5 shadow-lg flex flex-col justify-between gap-4 transition"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => setViewingRoutine(routine)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setViewingRoutine(routine);
                }
              }}
              className="cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <div className="flex items-start gap-3">
                <RoutineMuscleThumbnail routine={routine} exercises={exercises} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-neutral-800 text-emerald-400 border border-neutral-700/80">
                      {routine.category}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        ~{routine.estimatedMinutes}m
                      </span>
                      {routine.isCustom && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteRoutine(routine.id);
                          }}
                          className="p-1 text-neutral-500 hover:text-red-400 rounded transition"
                          title="Delete routine"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
                    {routine.title}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                    {routine.description}
                  </p>
                </div>
              </div>

              {/* Exercises tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {routine.exercises.slice(0, 4).map((re, idx) => {
                  const ex = exercises.find((e) => e.id === re.exerciseId);
                  return (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 bg-neutral-950 text-neutral-300 rounded-md border border-neutral-800"
                    >
                      {ex?.name || re.exerciseId} ({re.defaultSets}×{re.defaultReps})
                    </span>
                  );
                })}
                {routine.exercises.length > 4 && (
                  <span className="text-[11px] px-2 py-0.5 bg-neutral-950 text-neutral-400 rounded-md border border-neutral-800">
                    +{routine.exercises.length - 4} more
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setViewingRoutine(routine)}
              className="flex items-center justify-between border-t border-neutral-800/80 pt-3 text-left text-xs font-semibold text-neutral-300 transition hover:text-emerald-300"
            >
              <span>Open workout plan</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Routine Detail Modal */}
      {viewingRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-neutral-100 overflow-y-auto">
            <div className="sticky -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 top-0 z-10 flex flex-col gap-3 border-b border-neutral-800 bg-neutral-900/95 px-5 pt-5 pb-3 backdrop-blur sm:px-6 sm:pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    {viewingRoutine.category} • {viewingRoutine.difficulty}
                  </span>
                  <h3 className="mt-1.5 text-lg font-bold text-white">{viewingRoutine.title}</h3>
                </div>
                <button
                  onClick={() => setViewingRoutine(null)}
                  className="shrink-0 rounded-lg p-1.5 text-neutral-400 hover:text-white"
                  aria-label="Close workout preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => {
                  onStartRoutine(viewingRoutine);
                  setViewingRoutine(null);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-neutral-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
              >
                <Play className="h-4 w-4 fill-current" />
                Start Workout
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-3.5">
              <RoutineMuscleThumbnail routine={viewingRoutine} exercises={exercises} />
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">Workout focus</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-300">{viewingRoutine.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Exercise Schedule ({viewingRoutine.exercises.length})
              </h4>
              <div className="divide-y divide-neutral-800/80 bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden">
                {viewingRoutine.exercises.map((re, idx) => {
                  const ex = exercises.find((e) => e.id === re.exerciseId);
                  return (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold text-emerald-400 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-white block">
                            {ex?.name || re.exerciseId}
                          </span>
                          <span className="text-[11px] text-neutral-400">
                            {ex?.category} • {ex?.equipment}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-emerald-400 font-bold">
                          {re.defaultSets} sets × {re.defaultReps} reps
                        </span>
                        {re.targetRpe && (
                          <span className="text-[10px] text-neutral-400 block">
                            RPE {re.targetRpe}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>


          </div>
        </div>
      )}

      {/* Routine Creator Modal */}
      {isCreatingRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveNewRoutine}
            className="w-full max-w-xl max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-neutral-100 overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base sm:text-lg font-bold">Build Custom Routine</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingRoutine(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-400 block mb-1">
                  Routine Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arms & Shoulder Blast"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-400 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Focus points, intensity, goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as RoutineTemplate['difficulty'])}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-1">
                    Split Type
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RoutineTemplate['category'])}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none"
                  >
                    <option value="Custom">Custom</option>
                    <option value="Push / Pull / Legs">Push / Pull / Legs</option>
                    <option value="Upper / Lower">Upper / Lower</option>
                    <option value="Full Body">Full Body</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Exercise Builder List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Exercises ({selectedExIds.length})
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddExerciseToRoutine(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
                >
                  <option value="">+ Add Exercise...</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedExIds.map((item, idx) => {
                  const ex = exercises.find((e) => e.id === item.exerciseId);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-white block truncate">
                          {ex?.name || item.exerciseId}
                        </span>
                        <span className="text-[10px] text-neutral-400">{ex?.category}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-neutral-400">Sets:</span>
                          <NumericInput
                            value={item.defaultSets}
                            min={1}
                            max={10}
                            step={1}
                            onValueChange={(value) => {
                              setSelectedExIds((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, defaultSets: Math.round(value) } : it))
                              );
                            }}
                            aria-label={`${ex?.name || 'Exercise'} sets`}
                            className="w-10 rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-center font-mono font-bold text-white"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-neutral-400">Reps:</span>
                          <NumericInput
                            value={item.defaultReps}
                            min={1}
                            max={50}
                            step={1}
                            onValueChange={(value) => {
                              setSelectedExIds((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, defaultReps: Math.round(value) } : it))
                              );
                            }}
                            aria-label={`${ex?.name || 'Exercise'} reps`}
                            className="w-12 rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-center font-mono font-bold text-white"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveExerciseFromRoutine(idx)}
                          className="p-1 text-neutral-500 hover:text-red-400 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsCreatingRoutine(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || selectedExIds.length === 0}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
              >
                Save Routine
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};


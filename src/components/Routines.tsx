import React, { useState } from 'react';
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
import { RoutineTemplate, Exercise } from '../types/fitness';
import { NumericInput } from './NumericInput';

interface RoutinesProps {
  routines: RoutineTemplate[];
  exercises: Exercise[];
  onStartRoutine: (routine: RoutineTemplate) => void;
  onSaveRoutine: (routine: RoutineTemplate) => void;
  onDeleteRoutine: (routineId: string) => void;
  onOpenExercisePicker: () => void;
}

export const RoutinesView: React.FC<RoutinesProps> = ({
  routines,
  exercises,
  onStartRoutine,
  onSaveRoutine,
  onDeleteRoutine
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCreatingRoutine, setIsCreatingRoutine] = useState<boolean>(false);
  const [viewingRoutine, setViewingRoutine] = useState<RoutineTemplate | null>(null);

  // New routine builder form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RoutineTemplate['category']>('Custom');
  const [difficulty, setDifficulty] = useState<RoutineTemplate['difficulty']>('Intermediate');
  const [selectedExIds, setSelectedExIds] = useState<{ exerciseId: string; defaultSets: number; defaultReps: number }[]>([
    { exerciseId: 'barbell-bench-press', defaultSets: 3, defaultReps: 8 }
  ]);

  const categories = ['All', 'Push / Pull / Legs', 'Upper / Lower', 'Full Body', 'Custom'];

  const filteredRoutines = routines.filter(
    (r) => selectedCategory === 'All' || r.category === selectedCategory
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Workout Routines</h2>
          <p className="text-xs text-neutral-400">Structured programs & custom templates</p>
        </div>

        <button
          onClick={() => setIsCreatingRoutine(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          Create Routine
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredRoutines.map((routine) => (
          <div
            key={routine.id}
            className="group rounded-2xl bg-neutral-900 border border-neutral-800/90 hover:border-neutral-700 p-5 shadow-lg flex flex-col justify-between gap-4 transition"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-neutral-800 text-emerald-400 border border-neutral-700/80">
                  {routine.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    ~{routine.estimatedMinutes}m
                  </span>
                  {routine.isCustom && (
                    <button
                      onClick={() => onDeleteRoutine(routine.id)}
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

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80">
              <button
                onClick={() => setViewingRoutine(routine)}
                className="text-xs text-neutral-400 hover:text-white font-medium flex items-center gap-1"
              >
                View Workout
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onStartRoutine(routine)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Routine
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Routine Detail Modal */}
      {viewingRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-neutral-100 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                  {viewingRoutine.category} • {viewingRoutine.difficulty}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{viewingRoutine.title}</h3>
              </div>
              <button
                onClick={() => setViewingRoutine(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {viewingRoutine.description}
            </p>

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

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setViewingRoutine(null)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onStartRoutine(viewingRoutine);
                  setViewingRoutine(null);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                Start This Workout
              </button>
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

import React, { useState, useMemo } from 'react';
import { X, Search, ArrowLeftRight, Check, Dumbbell, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { Exercise, WorkoutExercise, EquipmentType } from '../../types/fitness';

interface ExerciseSwapModalProps {
  currentExercise: WorkoutExercise;
  allExercises: Exercise[];
  onSelectSwap: (newExercise: Exercise) => void;
  onClose: () => void;
}

export const ExerciseSwapModal: React.FC<ExerciseSwapModalProps> = ({
  currentExercise,
  allExercises,
  onSelectSwap,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'same-category' | 'all'>('same-category');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');

  const equipmentOptions = ['All', 'Dumbbell', 'Barbell', 'Cable', 'Machine', 'Bodyweight'];

  // Alternative exercises in the same line/muscle group or all
  const filteredAlternatives = useMemo(() => {
    return allExercises.filter((ex) => {
      // Exclude the currently loaded exercise itself
      if (ex.id === currentExercise.exerciseId || ex.name.toLowerCase() === currentExercise.exerciseName.toLowerCase()) {
        return false;
      }

      const matchesSearch =
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.primaryMuscles.some((m) => m.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        filterMode === 'all' || ex.category === currentExercise.category;

      const matchesEquipment =
        selectedEquipment === 'All' || ex.equipment === selectedEquipment;

      return matchesSearch && matchesCategory && matchesEquipment;
    });
  }, [allExercises, currentExercise, search, filterMode, selectedEquipment]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Swap Exercise</h3>
              <p className="text-xs text-neutral-400">
                Replace current movement with an in-line alternative
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Exercise Banner */}
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Replacing:
            </span>
            <div className="text-sm font-bold text-white truncate">
              {currentExercise.exerciseName}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="text-emerald-400 font-medium">{currentExercise.category}</span>
              <span>•</span>
              <span>{currentExercise.equipment}</span>
              <span>•</span>
              <span>{currentExercise.sets.length} configured sets</span>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shrink-0">
            Current
          </div>
        </div>

        {/* Search & Mode Toggles */}
        <div className="p-4 space-y-3 border-b border-neutral-800/60 bg-neutral-900/50">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder={`Search alternative ${currentExercise.category} exercises...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex bg-neutral-950 p-0.5 rounded-xl border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('same-category')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filterMode === 'same-category'
                    ? 'bg-emerald-500 text-neutral-950'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Same Line ({currentExercise.category})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filterMode === 'all'
                    ? 'bg-emerald-500 text-neutral-950'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Categories
              </button>
            </div>

            {/* Equipment Filter */}
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
            >
              {equipmentOptions.map((eq) => (
                <option key={eq} value={eq}>
                  {eq === 'All' ? 'All Equipment' : eq}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exercises List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {filteredAlternatives.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <p className="text-sm font-medium">No alternative exercises match filters.</p>
              <p className="text-xs mt-1 text-neutral-600">
                Try switching to "All Categories" or clearing the search query.
              </p>
            </div>
          ) : (
            filteredAlternatives.map((alt) => (
              <div
                key={alt.id}
                onClick={() => onSelectSwap(alt)}
                className="group p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-emerald-500/50 transition cursor-pointer flex items-center justify-between shadow-sm"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition truncate">
                      {alt.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                    <span className="text-emerald-400 font-medium">{alt.category}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px]">
                      {alt.equipment}
                    </span>
                    <span>•</span>
                    <span className="truncate">{alt.primaryMuscles.join(', ')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm transition"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Swap
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <span>{filteredAlternatives.length} alternative exercises available</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

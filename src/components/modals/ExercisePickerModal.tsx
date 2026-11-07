import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Check, Info, Sparkles } from 'lucide-react';
import { Exercise, MuscleGroup, EquipmentType } from '../../types/fitness';

interface ExercisePickerModalProps {
  exercises: Exercise[];
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  onAddCustomExercise: (newExercise: Exercise) => void;
}

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
  exercises,
  onClose,
  onSelectExercise,
  onAddCustomExercise
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
  const [viewingDetails, setViewingDetails] = useState<Exercise | null>(null);

  // Custom exercise creation state
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<MuscleGroup>('Chest');
  const [customEquipment, setCustomEquipment] = useState<EquipmentType>('Barbell');

  const categories = ['All', 'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Biceps', 'Triceps', 'Core', 'Calves'];
  const equipmentOptions = ['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'];

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.primaryMuscles.some(m => m.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
      const matchesEquipment = selectedEquipment === 'All' || ex.equipment === selectedEquipment;
      return matchesSearch && matchesCategory && matchesEquipment;
    });
  }, [exercises, search, selectedCategory, selectedEquipment]);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newEx: Exercise = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      equipment: customEquipment,
      primaryMuscles: [customCategory],
      instructions: ['Perform with controlled form and full range of motion.'],
      defaultRestSeconds: 90
    };

    onAddCustomExercise(newEx);
    onSelectExercise(newEx);
    setIsCreatingCustom(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col text-neutral-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">Select Exercise</h3>
            <span className="text-xs bg-neutral-800 px-2.5 py-0.5 rounded-full text-neutral-400 font-mono">
              {filteredExercises.length} found
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingCustom(!isCreatingCustom)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold border border-emerald-500/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Custom
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Custom creation banner */}
        {isCreatingCustom && (
          <form onSubmit={handleCreateCustom} className="p-4 bg-neutral-950/90 border-b border-emerald-500/30 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Sparkles className="w-4 h-4" />
              Create Custom Exercise
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Exercise name (e.g. Incline Smith Press)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="col-span-1 sm:col-span-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as MuscleGroup)}
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={customEquipment}
                onChange={(e) => setCustomEquipment(e.target.value as EquipmentType)}
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none"
              >
                {equipmentOptions.filter(e => e !== 'All').map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!customName.trim()}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-lg disabled:opacity-50 transition"
              >
                Save & Add
              </button>
            </div>
          </form>
        )}

        {/* Search & Category Filters */}
        <div className="p-3 sm:p-4 bg-neutral-950/40 border-b border-neutral-800/80 flex flex-col gap-2.5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search exercise by name or muscle (e.g. Bench, Lats)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Muscle tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Equipment pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold pr-1">Equipment:</span>
            {equipmentOptions.map((eq) => (
              <button
                key={eq}
                onClick={() => setSelectedEquipment(eq)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition ${
                  selectedEquipment === eq
                    ? 'bg-neutral-700 text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-900/60 text-neutral-400 hover:text-neutral-300'
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-neutral-800/60 max-h-[50vh]">
          {filteredExercises.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 flex flex-col items-center gap-3">
              <Search className="w-8 h-8 text-neutral-600" />
              <p className="text-sm">No exercises matched "{search}"</p>
              <button
                onClick={() => {
                  setCustomName(search);
                  setIsCreatingCustom(true);
                }}
                className="text-xs text-emerald-400 hover:underline font-semibold"
              >
                Create custom exercise "{search}"
              </button>
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="py-3 px-2 flex items-center justify-between rounded-xl hover:bg-neutral-800/60 transition group cursor-pointer"
                onClick={() => onSelectExercise(exercise)}
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                    {exercise.category.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-neutral-100 group-hover:text-emerald-400 transition truncate">
                      {exercise.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 pt-0.5">
                      <span className="text-emerald-400/90 font-medium">{exercise.category}</span>
                      <span>•</span>
                      <span>{exercise.equipment}</span>
                      {exercise.primaryMuscles[0] && (
                        <>
                          <span>•</span>
                          <span className="text-neutral-400 truncate hidden sm:inline">
                            {exercise.primaryMuscles[0]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingDetails(exercise);
                    }}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700/60 rounded-lg transition"
                    title="View cues and instructions"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Modal Overlay if user taps (i) info */}
        {viewingDetails && (
          <div className="absolute inset-0 bg-neutral-950/95 p-5 z-20 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div>
                  <h4 className="text-lg font-bold text-emerald-400">{viewingDetails.name}</h4>
                  <p className="text-xs text-neutral-400">{viewingDetails.category} • {viewingDetails.equipment}</p>
                </div>
                <button
                  onClick={() => setViewingDetails(null)}
                  className="p-2 text-neutral-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-4">
                <div>
                  <h5 className="text-xs uppercase font-bold text-neutral-400 tracking-wider mb-1.5">Primary Muscles</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingDetails.primaryMuscles.map(m => (
                      <span key={m} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs rounded-md">
                        {m}
                      </span>
                    ))}
                    {viewingDetails.secondaryMuscles?.map(m => (
                      <span key={m} className="px-2.5 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-md">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs uppercase font-bold text-neutral-400 tracking-wider mb-1.5">Form Execution</h5>
                  <ol className="space-y-1.5 list-decimal list-inside text-xs text-neutral-300">
                    {viewingDetails.instructions.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">{step}</li>
                    ))}
                  </ol>
                </div>

                {viewingDetails.tips && (
                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-300">
                    <span className="font-bold text-emerald-400">Coach Cue: </span>
                    {viewingDetails.tips}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
              <button
                onClick={() => setViewingDetails(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => {
                  onSelectExercise(viewingDetails);
                  setViewingDetails(null);
                }}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl shadow"
              >
                Select {viewingDetails.name}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

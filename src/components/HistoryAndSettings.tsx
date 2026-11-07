import React, { useEffect, useState } from 'react';
import { 
  History, 
  Settings as SettingsIcon, 
  BookOpen, 
  Calendar, 
  ChevronLeft,
  ChevronRight,
  Clock, 
  Dumbbell, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Download, 
  Upload, 
  Search,
  CheckCircle2,
  ExternalLink,
  User
} from 'lucide-react';
import { CompletedWorkout, Exercise, UserSettings } from '../types/fitness';

type HistoryTab = 'history' | 'exercises' | 'settings';

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const workoutDateKey = (date: string) => toDateKey(new Date(date));

interface HistoryAndSettingsProps {
  history: CompletedWorkout[];
  exercises: Exercise[];
  settings: UserSettings;
  initialTab?: HistoryTab;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onDeleteHistoryItem: (workoutId: string) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const HistoryAndSettingsView: React.FC<HistoryAndSettingsProps> = ({
  history,
  exercises,
  settings,
  initialTab = 'history',
  onUpdateSettings,
  onDeleteHistoryItem,
  onExportData,
  onImportData
}) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>(initialTab);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(history[0]?.id || null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const latestDate = history.reduce<Date | null>((latest, workout) => {
      const date = new Date(workout.date);
      return !latest || date > latest ? date : latest;
    }, null) ?? new Date();
    return new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('All');
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<Exercise | null>(null);

  useEffect(() => setActiveTab(initialTab), [initialTab]);

  const categories = ['All', 'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Biceps', 'Triceps', 'Core'];

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchesMuscle = selectedMuscleFilter === 'All' || ex.category === selectedMuscleFilter;
    return matchesSearch && matchesMuscle;
  });

  const workoutsByDate = new Map<string, CompletedWorkout[]>();
  history.forEach((workout) => {
    const dateKey = workoutDateKey(workout.date);
    workoutsByDate.set(dateKey, [...(workoutsByDate.get(dateKey) ?? []), workout]);
  });

  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarCells = Array.from({ length: monthStart.getDay() + daysInMonth }, (_, index) => {
    if (index < monthStart.getDay()) return null;
    return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - monthStart.getDay() + 1);
  });
  const visibleHistory = selectedDate
    ? history.filter((workout) => workoutDateKey(workout.date) === selectedDate)
    : history;

  return (
    <div className="flex flex-col gap-5 pb-12 animate-in fade-in duration-200">
      {/* Top Navigation Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Training log</h2>
          <p className="text-xs text-neutral-400">Workouts, exercise guides, and preferences</p>
        </div>

      </div>

      <div className="flex bg-neutral-900 p-1 rounded-2xl border border-neutral-800">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-neutral-950 shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Workout History ({history.length})
        </button>

        <button
          onClick={() => setActiveTab('exercises')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'exercises'
              ? 'bg-emerald-500 text-neutral-950 shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Exercise Guide
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-emerald-500 text-neutral-950 shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          Settings
        </button>
      </div>

      {/* TAB 1: HISTORY LOG */}
      {activeTab === 'history' && (
        <div className="space-y-3.5">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-300" />
                <h3 className="text-sm font-bold text-white">Workout calendar</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[108px] text-center text-xs font-semibold text-neutral-200">
                  {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
                <span key={weekday} className="pb-1.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-500">{weekday}</span>
              ))}
              {calendarCells.map((date, index) => {
                if (!date) return <span key={`blank-${index}`} aria-hidden="true" />;
                const dateKey = toDateKey(date);
                const workoutCount = workoutsByDate.get(dateKey)?.length ?? 0;
                const isSelected = selectedDate === dateKey;
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate((current) => current === dateKey ? null : dateKey)}
                    aria-label={`${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}${workoutCount ? `, ${workoutCount} workout${workoutCount === 1 ? '' : 's'}` : ', no workouts'}${isSelected ? ', selected' : ''}`}
                    aria-pressed={isSelected}
                    className={`relative mx-auto my-0.5 grid h-9 w-9 place-items-center rounded-xl text-xs transition ${isSelected ? 'bg-emerald-500 font-bold text-neutral-950' : workoutCount ? 'bg-emerald-950/60 font-semibold text-emerald-200 hover:bg-emerald-900/70' : 'text-neutral-300 hover:bg-neutral-800'}`}
                  >
                    {date.getDate()}
                    {workoutCount > 0 && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? 'bg-neutral-950' : 'bg-emerald-300'}`} />}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-neutral-800 pt-2">
              <span className="flex items-center gap-1.5 text-[10px] text-neutral-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Workout logged</span>
              {selectedDate ? (
                <button type="button" onClick={() => setSelectedDate(null)} className="text-[10px] font-semibold text-emerald-300">Show all workouts</button>
              ) : (
                <span className="text-[10px] text-neutral-500">Tap a day to filter</span>
              )}
            </div>
          </section>

          {selectedDate && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-neutral-300">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <span className="text-[10px] text-neutral-500">{visibleHistory.length} workout{visibleHistory.length === 1 ? '' : 's'}</span>
            </div>
          )}

          {visibleHistory.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 flex flex-col items-center gap-3">
              <History className="w-10 h-10 text-neutral-700" />
              <p className="text-sm">{selectedDate ? 'No workout logged on this day.' : 'No workouts logged yet. Finish your first workout to see it here!'}</p>
            </div>
          ) : (
            visibleHistory.map((workout) => {
              const isExpanded = expandedWorkoutId === workout.id;
              const dateObj = new Date(workout.date);

              return (
                <div
                  key={workout.id}
                  className="rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl overflow-hidden transition"
                >
                  {/* Workout Header Bar */}
                  <div
                    onClick={() => setExpandedWorkoutId(isExpanded ? null : workout.id)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-800/40 transition"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] uppercase font-bold text-emerald-400">
                          {dateObj.toLocaleDateString(undefined, { month: 'short' })}
                        </span>
                        <span className="text-base font-extrabold text-white font-mono leading-none">
                          {dateObj.getDate()}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white truncate">
                          {workout.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-neutral-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            {workout.durationMinutes}m
                          </span>
                          <span>•</span>
                          <span className="font-mono text-emerald-400 font-medium">
                            {workout.totalVolume.toLocaleString()} {settings.weightUnit}
                          </span>
                          <span>•</span>
                          <span>{workout.totalSets} sets</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {workout.prsAchieved.length > 0 && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">
                          <Trophy className="w-3.5 h-3.5" />
                          <span>+{workout.prsAchieved.length} PR</span>
                        </div>
                      )}
                      <div className="p-1 text-neutral-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-neutral-950/60 border-t border-neutral-800 space-y-4 animate-in fade-in">
                      {/* PR tags */}
                      {workout.prsAchieved.length > 0 && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col gap-1.5">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5" />
                            Milestones Achieved
                          </span>
                          {workout.prsAchieved.map((pr, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-neutral-300">{pr.exerciseName} ({pr.description})</span>
                              <span className="font-mono font-bold text-emerald-400">{pr.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Exercises detailed */}
                      <div className="space-y-3">
                        {workout.exercises.map((ex, eIdx) => (
                          <div
                            key={ex.id || eIdx}
                            className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800/80"
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
                              <span className="text-xs font-bold text-white">{ex.exerciseName}</span>
                              <span className="text-[11px] text-neutral-400">{ex.category} • {ex.equipment}</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {ex.sets.map((s, sIdx) => (
                                <div
                                  key={s.id || sIdx}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${
                                    s.completed
                                      ? 'bg-neutral-950 text-neutral-200 border-neutral-700'
                                      : 'bg-neutral-950/50 text-neutral-500 border-neutral-800'
                                  }`}
                                >
                                  <span className="text-neutral-400 text-[10px] mr-1">#{s.setNumber}:</span>
                                  <span className="font-bold text-emerald-400">{s.weight}</span>
                                  <span className="text-neutral-400 text-[11px] ml-0.5">×</span>
                                  <span className="text-white ml-0.5">{s.reps}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => onDeleteHistoryItem(workout.id)}
                          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold px-3 py-1.5 rounded-lg hover:bg-neutral-900 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Log Entry
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: EXERCISE DIRECTORY */}
      {activeTab === 'exercises' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search exercise library..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedMuscleFilter(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
                  selectedMuscleFilter === cat
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredExercises.map((ex) => (
              <div
                key={ex.id}
                onClick={() => setSelectedExerciseForModal(ex)}
                className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition flex flex-col justify-between gap-2.5 cursor-pointer group shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      {ex.category}
                    </span>
                    <span className="text-[11px] text-neutral-400">{ex.equipment}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                    {ex.name}
                  </h4>
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                    {ex.instructions[0] || 'High tension movement targeting ' + ex.primaryMuscles.join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400">
                  <span>Target: {ex.primaryMuscles[0]}</span>
                  <span className="text-emerald-400 font-semibold group-hover:underline">
                    View Form Guide →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Exercise Form Detail Modal */}
          {selectedExerciseForModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-neutral-100 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      {selectedExerciseForModal.category} • {selectedExerciseForModal.equipment}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {selectedExerciseForModal.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedExerciseForModal(null)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <h5 className="text-xs uppercase font-bold text-neutral-400 mb-1.5">Muscles Worked</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedExerciseForModal.primaryMuscles.map((m) => (
                      <span key={m} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs rounded-lg">
                        {m}
                      </span>
                    ))}
                    {selectedExerciseForModal.secondaryMuscles?.map((m) => (
                      <span key={m} className="px-2.5 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-lg">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs uppercase font-bold text-neutral-400 mb-1.5">Execution Steps</h5>
                  <ol className="space-y-2 list-decimal list-inside text-xs text-neutral-300">
                    {selectedExerciseForModal.instructions.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">{step}</li>
                    ))}
                  </ol>
                </div>

                {selectedExerciseForModal.tips && (
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300">
                    <span className="font-bold text-emerald-400">Pro Cue: </span>
                    {selectedExerciseForModal.tips}
                  </div>
                )}

                <button
                  onClick={() => setSelectedExerciseForModal(null)}
                  className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl transition mt-2"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SETTINGS & BACKUP */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Athlete Profile (Starting Weight & Adaptive Baseline) */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-neutral-800/80">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Athlete Baseline Profile</h4>
                <p className="text-xs text-neutral-400">
                  Calibrates estimated starting weights and adaptive progression suggestions
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {/* Body Weight */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-neutral-400">
                  Body Weight ({settings.weightUnit.toUpperCase()})
                </label>
                <input
                  type="number"
                  min="30"
                  max="500"
                  value={settings.userWeight || (settings.weightUnit === 'lbs' ? 165 : 75)}
                  onChange={(e) =>
                    onUpdateSettings({ userWeight: parseFloat(e.target.value) || 0 })
                  }
                  className="bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Height */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-neutral-400">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={settings.userHeightCm || 178}
                  onChange={(e) =>
                    onUpdateSettings({ userHeightCm: parseInt(e.target.value) || 0 })
                  }
                  className="bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Training Experience */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-neutral-400">
                  Training Experience
                </label>
                <select
                  value={settings.userExperience || 'Intermediate'}
                  onChange={(e) =>
                    onUpdateSettings({
                      userExperience: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced'
                    })
                  }
                  className="bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Beginner">Beginner (&lt; 1 yr)</option>
                  <option value="Intermediate">Intermediate (1-3 yrs)</option>
                  <option value="Advanced">Advanced (3+ yrs)</option>
                </select>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-neutral-400">
                  Physiology Baseline
                </label>
                <select
                  value={settings.userGender || 'male'}
                  onChange={(e) =>
                    onUpdateSettings({
                      userGender: e.target.value as 'male' | 'female'
                    })
                  }
                  className="bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="male">Male (Standard ratios)</option>
                  <option value="female">Female (Adjusted ratios)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Unit Switcher */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Weight Units</h4>
              <p className="text-xs text-neutral-400">Preferred measurement unit for barbell, dumbbells & plates</p>
            </div>

            <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                onClick={() => onUpdateSettings({ weightUnit: 'lbs' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  settings.weightUnit === 'lbs'
                    ? 'bg-emerald-500 text-neutral-950 shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                LBS
              </button>
              <button
                onClick={() => onUpdateSettings({ weightUnit: 'kg' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  settings.weightUnit === 'kg'
                    ? 'bg-emerald-500 text-neutral-950 shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                KG
              </button>
            </div>
          </div>

          {/* Rest Timer Defaults */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Default Rest Duration</h4>
              <p className="text-xs text-neutral-400">Base countdown when logging a set</p>
            </div>

            <select
              value={settings.defaultRestSeconds}
              onChange={(e) => onUpdateSettings({ defaultRestSeconds: parseInt(e.target.value) })}
              className="bg-neutral-950 border border-neutral-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
            >
              <option value="60">60 seconds</option>
              <option value="90">90 seconds</option>
              <option value="120">120 seconds (2m)</option>
              <option value="180">180 seconds (3m)</option>
            </select>
          </div>

          {/* Sound Audio Cues Toggle */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Audio Countdown Cues</h4>
              <p className="text-xs text-neutral-400">Beeps at 3, 2, 1 and end of rest interval</p>
            </div>

            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`p-2.5 rounded-xl border transition ${
                settings.soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-neutral-800 text-neutral-500 border-neutral-700'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          {/* Auto-start rest timer toggle */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Auto-Start Rest Timer</h4>
              <p className="text-xs text-neutral-400">Launch timer automatically when checking off a set</p>
            </div>

            <button
              onClick={() => onUpdateSettings({ autoStartRestTimer: !settings.autoStartRestTimer })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.autoStartRestTimer ? 'bg-emerald-500' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.autoStartRestTimer ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Data Export / Import */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl flex flex-col gap-3">
            <div>
              <h4 className="text-sm font-bold text-white">Data Backup & Restore</h4>
              <p className="text-xs text-neutral-400">Safely backup all workouts, custom routines & logs to JSON</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={onExportData}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-950 border border-neutral-700 hover:border-emerald-500/50 text-white font-bold text-xs transition"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Export JSON
              </button>

              <label className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-950 border border-neutral-700 hover:border-neutral-500/50 text-white font-bold text-xs transition cursor-pointer">
                <Upload className="w-4 h-4 text-neutral-400" />
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

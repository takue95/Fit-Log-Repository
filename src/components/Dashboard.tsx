import React from 'react';
import { 
  Flame, 
  Play, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Award, 
  Clock, 
  Dumbbell, 
  ChevronRight, 
  Calculator, 
  Layers,
  Sparkles,
  Zap,
  Trophy
} from 'lucide-react';
import { RoutineTemplate, CompletedWorkout, ActiveWorkout, UserSettings } from '../types/fitness';

interface DashboardProps {
  routines: RoutineTemplate[];
  history: CompletedWorkout[];
  activeWorkout: ActiveWorkout | null;
  settings: UserSettings;
  onStartEmptyWorkout: () => void;
  onStartRoutine: (routine: RoutineTemplate) => void;
  onResumeActiveWorkout: () => void;
  onNavigateToRoutines: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToHistory: () => void;
  onOpenPlateCalc: () => void;
  onOpenOneRMCalc: () => void;
  onOpenStitchModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  routines,
  history,
  activeWorkout,
  settings,
  onStartEmptyWorkout,
  onStartRoutine,
  onResumeActiveWorkout,
  onNavigateToRoutines,
  onNavigateToAnalytics,
  onNavigateToHistory,
  onOpenPlateCalc,
  onOpenOneRMCalc,
  onOpenStitchModal
}) => {
  // Compute weekly stats
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekWorkouts = history.filter(w => new Date(w.date) >= oneWeekAgo);

  const weeklyVolume = thisWeekWorkouts.reduce((sum, w) => sum + w.totalVolume, 0);
  const weeklyMinutes = thisWeekWorkouts.reduce((sum, w) => sum + w.durationMinutes, 0);
  const weeklyPRs = thisWeekWorkouts.reduce((sum, w) => sum + w.prsAchieved.length, 0);
  const weeklyCount = thisWeekWorkouts.length;
  const weeklyGoal = 5;
  const sortedWorkoutDates = [...new Set(history.map((workout) => new Date(workout.date).toDateString()))]
    .map((date) => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime());
  const currentStreak = sortedWorkoutDates.reduce((streak, date, index) => {
    const expected = new Date();
    expected.setHours(0, 0, 0, 0);
    expected.setDate(expected.getDate() - index);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === expected.getTime() ? streak + 1 : streak;
  }, 0);

  return (
    <div className="flex flex-col gap-5 pb-8 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 p-5 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/25">
                <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                  <Flame className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    className="text-xl font-extrabold text-white tracking-tight"
                  >
                    {currentStreak}-Day Streak
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    On Fire
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-medium">Keep the momentum going today</p>
              </div>
            </div>

            <button
              onClick={onOpenStitchModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
              title="Inspect Stitch Screen Slots"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Stitch ID</span>
            </button>
          </div>

          {/* Weekly goal progress bar */}
          <div className="bg-neutral-950/70 p-3.5 rounded-2xl border border-neutral-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Weekly Target ({weeklyCount}/{weeklyGoal} Workouts)
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {Math.round((weeklyCount / weeklyGoal) * 100)}%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (weeklyCount / weeklyGoal) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Workout Banner (if currently in session) */}
      {activeWorkout && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-teal-950/80 border border-emerald-500/50 p-4 shadow-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="text-sm font-bold text-white">Workout In Progress</h4>
              </div>
              <p className="text-xs text-emerald-300 font-medium">
                {activeWorkout.title} • {activeWorkout.exercises.length} exercises
              </p>
            </div>
          </div>

          <button
            onClick={onResumeActiveWorkout}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition"
          >
            Resume
          </button>
        </div>
      )}

      {/* Quick Start Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onStartEmptyWorkout}
          className="group relative overflow-hidden p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 transition-all shadow-lg flex flex-col justify-between h-28 text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <Zap className="w-5 h-5 fill-amber-400/20" />
            </div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Freestyle</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
              Quick Freestyle Workout
            </h4>
            <p className="text-[11px] text-neutral-400">Log ad-hoc exercises</p>
          </div>
        </button>

        <button
          onClick={onNavigateToRoutines}
          className="group relative overflow-hidden p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 transition-all shadow-lg flex flex-col justify-between h-28 text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Programs</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition">
              Quick Start Routines
            </h4>
            <p className="text-[11px] text-neutral-400">{routines.length} templates available</p>
          </div>
        </button>
      </div>

      {/* Weekly Stats Summary */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            7-Day Performance
          </h3>
          <button
            onClick={onNavigateToAnalytics}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            Analytics
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-2xl flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Total Volume</span>
            <span className="text-base font-extrabold font-mono text-white">
              {(weeklyVolume / 1000).toFixed(1)}k
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">{settings.weightUnit} lifted</span>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-2xl flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Time Trained</span>
            <span className="text-base font-extrabold font-mono text-white">
              {Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m
            </span>
            <span className="text-[10px] text-cyan-400 font-medium">{weeklyCount} sessions</span>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-2xl flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">PRs Achieved</span>
            <span className="text-base font-extrabold font-mono text-amber-400 flex items-center gap-1">
              <Award className="w-4 h-4" />
              {weeklyPRs}
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">New records</span>
          </div>
        </div>
      </div>


      {/* Workout Tools Utilities Row */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Quick Utilities
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onOpenPlateCalc}
            className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:bg-neutral-800/60 transition text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Plate Calculator</span>
              <span className="text-[10px] text-neutral-400">Barbell breakdown</span>
            </div>
          </button>

          <button
            onClick={onOpenOneRMCalc}
            className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:bg-neutral-800/60 transition text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">1RM Estimator</span>
              <span className="text-[10px] text-neutral-400">Max & % zones</span>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Recent Workouts
          </h3>
          <button
            onClick={onNavigateToHistory}
            className="text-xs font-semibold text-neutral-400 hover:text-white transition"
          >
            Full Log
          </button>
        </div>

        <div className="space-y-2.5">
          {history.slice(0, 3).map((w) => (
            <div
              key={w.id}
              onClick={onNavigateToHistory}
              className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 hover:bg-neutral-800/60 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                  {new Date(w.date).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{w.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 pt-0.5">
                    <span>{new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <span>{w.durationMinutes}m</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-mono font-medium">
                      {w.totalVolume.toLocaleString()} {settings.weightUnit}
                    </span>
                  </div>
                </div>
              </div>

              {w.prsAchieved.length > 0 ? (
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-lg text-xs font-bold shrink-0">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>+{w.prsAchieved.length} PR</span>
                </div>
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

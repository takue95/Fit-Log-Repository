import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Flame, Clock, Dumbbell, Award, Share2, Check, ArrowRight } from 'lucide-react';
import { CompletedWorkout } from '../../types/fitness';
import { playCelebrationChime } from '../../utils/audio';

interface WorkoutCompletedModalProps {
  workout: CompletedWorkout;
  unit: 'lbs' | 'kg';
  soundEnabled: boolean;
  onClose: () => void;
}

export const WorkoutCompletedModal: React.FC<WorkoutCompletedModalProps> = ({
  workout,
  unit,
  soundEnabled,
  onClose
}) => {
  useEffect(() => {
    if (soundEnabled) {
      playCelebrationChime();
    }

    // Launch confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#3b82f6', '#ec4899']
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 300);

      return () => clearTimeout(timer);
    } catch {
      // Ignore if confetti canvas not available
    }
  }, [soundEnabled]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 text-neutral-100 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Trophy Banner */}
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20">
            <div className="w-full h-full bg-neutral-900 rounded-[14px] flex items-center justify-center text-emerald-400">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Workout Crushed!
          </h3>
          <p className="text-xs text-neutral-400 font-medium">
            {workout.title} • {new Date(workout.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-neutral-950/80 border border-neutral-800 p-3.5 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Duration</span>
            </div>
            <span className="text-xl font-bold font-mono text-white">
              {workout.durationMinutes} min
            </span>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800 p-3.5 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Volume</span>
            </div>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {workout.totalVolume.toLocaleString()} <span className="text-xs font-normal text-neutral-400">{unit}</span>
            </span>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800 p-3.5 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Sets</span>
            </div>
            <span className="text-xl font-bold font-mono text-white">
              {workout.totalSets} <span className="text-xs font-normal text-neutral-400">sets</span>
            </span>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800 p-3.5 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span>Total Reps</span>
            </div>
            <span className="text-xl font-bold font-mono text-white">
              {workout.totalReps} <span className="text-xs font-normal text-neutral-400">reps</span>
            </span>
          </div>
        </div>

        {/* PRs Achieved Badge List */}
        {workout.prsAchieved.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-amber-400" />
              Personal Records Broken!
            </div>
            <div className="space-y-1.5 pt-1">
              {workout.prsAchieved.map((pr, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-200">{pr.exerciseName}</span>
                  <span className="font-bold text-emerald-400 bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-700">
                    {pr.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exercises summarized */}
        <div className="bg-neutral-950/40 p-3.5 rounded-2xl border border-neutral-800/80 max-h-32 overflow-y-auto space-y-1 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Exercises Logged ({workout.exercises.length})
          </span>
          {workout.exercises.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between py-0.5 text-neutral-300">
              <span className="truncate pr-2">{ex.exerciseName}</span>
              <span className="text-neutral-400 font-mono text-[11px]">
                {ex.sets.filter(s => s.completed).length} sets
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'FitLog Workout',
                  text: `Just logged ${workout.title}! Lifted ${workout.totalVolume.toLocaleString()} ${unit} across ${workout.totalSets} sets in ${workout.durationMinutes} mins! 💪`
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(
                  `Just logged ${workout.title} on FitLog! Lifted ${workout.totalVolume.toLocaleString()} ${unit} across ${workout.totalSets} sets in ${workout.durationMinutes} mins!`
                );
                alert('Workout summary copied to clipboard!');
              }
            }}
            className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition flex items-center justify-center"
            title="Share workout"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
          >
            <Check className="w-4 h-4" />
            Done & Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

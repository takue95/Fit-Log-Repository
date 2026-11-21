import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Flame, Clock, Dumbbell, Award, Share2, Check, ArrowRight, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { CompletedWorkout } from '../../types/fitness';
import { playCelebrationChime } from '../../utils/audio';

interface WorkoutCompletedModalProps {
  workout: CompletedWorkout;
  unit: 'lbs' | 'kg';
  soundEnabled: boolean;
  driveConnected: boolean;
  driveSyncStatus: 'setup-required' | 'disconnected' | 'connecting' | 'syncing' | 'synced' | 'error';
  driveSyncMessage: string;
  onSyncDrive: () => void;
  onClose: () => void;
}

export const WorkoutCompletedModal: React.FC<WorkoutCompletedModalProps> = ({
  workout,
  unit,
  soundEnabled,
  driveConnected,
  driveSyncStatus,
  driveSyncMessage,
  onSyncDrive,
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
        colors: ['#78b48f', '#629d79', '#a4ccb2', '#47805d', '#c3dfce']
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
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Trophy Banner */}
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 p-0.5 shadow-xl shadow-emerald-500/20">
            <div className="w-full h-full bg-neutral-900 rounded-[14px] flex items-center justify-center text-emerald-400">
              <Trophy className="w-8 h-8 text-emerald-400" />
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
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Duration</span>
            </div>
            <span className="text-xl font-bold font-mono text-white">
              {workout.durationMinutes} min
            </span>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800 p-3.5 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
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
              <Award className="w-3.5 h-3.5 text-neutral-400" />
              <span>Total Reps</span>
            </div>
            <span className="text-xl font-bold font-mono text-white">
              {workout.totalReps} <span className="text-xs font-normal text-neutral-400">reps</span>
            </span>
          </div>
        </div>

        {/* PRs Achieved Badge List */}
        {workout.prsAchieved.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-emerald-400" />
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

        <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${
          driveSyncStatus === 'error'
            ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
            : driveSyncStatus === 'synced'
              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
              : 'border-neutral-700 bg-neutral-950/60 text-neutral-300'
        }`}>
          {driveSyncStatus === 'syncing' || driveSyncStatus === 'connecting'
            ? <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
            : driveConnected
              ? <Cloud className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              : <CloudOff className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <div>
            <p className="font-semibold">
              {driveSyncStatus === 'syncing' || driveSyncStatus === 'connecting'
                ? 'Workout saved here · syncing to Google Drive…'
                : driveSyncStatus === 'synced'
                  ? 'Workout saved and synced to Google Drive'
                  : driveSyncStatus === 'error'
                    ? 'Workout saved on this device · Drive sync needs attention'
                    : 'Workout saved on this device · Google Drive is not connected'}
            </p>
            {driveSyncStatus === 'error' && driveSyncMessage && (
              <p className="mt-0.5 break-words text-rose-200/80">{driveSyncMessage}</p>
            )}
          </div>
        </div>

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
            className="h-11 w-10 shrink-0 rounded-xl bg-neutral-800 text-neutral-300 transition hover:bg-neutral-700 flex items-center justify-center"
            title="Share workout"
            aria-label="Share workout summary"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onSyncDrive}
            disabled={driveSyncStatus === 'syncing' || driveSyncStatus === 'connecting' || driveSyncStatus === 'synced'}
            className={`flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition disabled:cursor-default ${
              driveSyncStatus === 'synced'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-neutral-700 bg-neutral-800 text-neutral-100 hover:border-emerald-600 hover:bg-neutral-700 disabled:opacity-80'
            }`}
            aria-label={
              driveSyncStatus === 'synced'
                ? 'Workout saved online to Google Drive'
                : 'Sync workout to Google Drive now'
            }
          >
            {driveSyncStatus === 'syncing' || driveSyncStatus === 'connecting'
              ? <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
              : driveSyncStatus === 'synced'
                ? <Cloud className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                : <Cloud className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
            <span className="truncate">
              {driveSyncStatus === 'syncing' || driveSyncStatus === 'connecting'
                ? 'Syncing…'
                : driveSyncStatus === 'synced'
                  ? 'Saved online'
                  : driveSyncStatus === 'error'
                    ? 'Retry sync'
                    : driveConnected
                      ? 'Sync now'
                      : 'Connect & sync'}
            </span>
          </button>

          <button
            onClick={onClose}
            className="flex h-11 min-w-0 flex-[1.25] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-emerald-500 px-2 text-xs font-bold text-neutral-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
          >
            <Check className="h-4 w-4 shrink-0" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

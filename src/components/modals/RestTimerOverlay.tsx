import React, { useEffect, useState } from 'react';
import { Timer, Plus, Minus, X, Play, Pause, Bell } from 'lucide-react';
import { formatTimeMMSS } from '../../utils/fitnessCalc';
import { playCountdownBeep } from '../../utils/audio';

interface RestTimerOverlayProps {
  initialSeconds: number;
  exerciseName?: string;
  soundEnabled: boolean;
  onFinish: () => void;
  onClose: () => void;
}

export const RestTimerOverlay: React.FC<RestTimerOverlayProps> = ({
  initialSeconds,
  exerciseName,
  soundEnabled,
  onFinish,
  onClose
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    setTotalSeconds(initialSeconds);
    setRemainingSeconds(initialSeconds);
    setIsPaused(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused) return;

    if (remainingSeconds <= 0) {
      if (soundEnabled) {
        playCountdownBeep(true);
      }
      onFinish();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1;
        if (soundEnabled && next <= 3 && next > 0) {
          playCountdownBeep(false);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, isPaused, soundEnabled, onFinish]);

  const addTime = (secs: number) => {
    setRemainingSeconds((prev) => Math.max(0, prev + secs));
    setTotalSeconds((prev) => Math.max(prev, remainingSeconds + secs));
  };

  const progressPercent = totalSeconds > 0
    ? Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100))
    : 100;

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-24 right-4 z-40 bg-neutral-900 border border-emerald-500/40 shadow-xl rounded-full px-4 py-2.5 flex items-center gap-2.5 cursor-pointer hover:scale-105 transition animate-pulse"
      >
        <Timer className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-bold font-mono text-emerald-400">
          {formatTimeMMSS(remainingSeconds)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-neutral-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md bg-neutral-900/95 backdrop-blur-md border border-neutral-700 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-6 duration-200">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-neutral-200">Rest Timer</h5>
            {exerciseName && (
              <p className="text-[10px] text-neutral-400 truncate max-w-[200px]">{exerciseName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {soundEnabled && (
            <span title="Sound is enabled" className="p-1 text-emerald-400">
              <Bell className="w-3.5 h-3.5" />
            </span>
          )}
          <button
            onClick={() => setIsMinimized(true)}
            className="text-[11px] font-semibold text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800"
          >
            Minimize
          </button>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Countdown & Progress */}
      <div className="flex items-center justify-between gap-4 py-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
            {formatTimeMMSS(remainingSeconds)}
          </span>
          <span className="text-xs text-neutral-400 font-medium">remaining</span>
        </div>

        {/* Quick adjustments */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => addTime(-15)}
            className="flex items-center gap-0.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-lg transition"
          >
            <Minus className="w-3 h-3" />
            15s
          </button>
          <button
            type="button"
            onClick={() => addTime(30)}
            className="flex items-center gap-0.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-lg transition"
          >
            <Plus className="w-3 h-3" />
            30s
          </button>
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg transition"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

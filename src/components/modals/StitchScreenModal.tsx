import React, { useState } from 'react';
import { X, ExternalLink, Code, Layers, FileCode, CheckCircle, Info, Copy, Check } from 'lucide-react';

interface StitchScreenModalProps {
  onClose: () => void;
  onNavigateScreen: (screenIndex: number) => void;
}

export const StitchScreenModal: React.FC<StitchScreenModalProps> = ({
  onClose,
  onNavigateScreen
}) => {
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [pastedCode, setPastedCode] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stitchScreens = [
    {
      index: 0,
      id: 'f0110573139c484c9b914d65e7c8ec26',
      title: 'Screen 1: Dashboard & Activity Hub',
      description: 'Daily streak, weekly workout completion targets, recent logs, quick start routine launcher, and volume lift widgets.',
      appScreen: 'Dashboard'
    },
    {
      index: 1,
      id: '233b3f48f95348e8ab35c0e49d4165c9',
      title: 'Screen 2: Live Active Workout Logger',
      description: 'Real-time elapsed stopwatch, set-by-set weight/reps tracking with previous PR reference, countdown rest timer, and barbell plate calculator.',
      appScreen: 'Active Workout'
    },
    {
      index: 2,
      id: '13c7243c8f4240f2bcbc24fbd31b7d58',
      title: 'Screen 3: Routine Builder & Exercise Catalog',
      description: 'Pre-made Push/Pull/Legs and Upper/Lower routine cards, custom routine builder with reordering, and searchable anatomical exercise catalog.',
      appScreen: 'Routines'
    },
    {
      index: 3,
      id: 'f6ff3f3b5ad14c96987a43a89ee3c330',
      title: 'Screen 4: Strength Analytics & PR Wall',
      description: '1RM Progression line curves (Bench, Squat, Deadlift, OHP), 7-day muscle engagement heat map, weekly volume bar charts, consistency frequency heatmap, and trophy medals.',
      appScreen: 'Analytics'
    },
    {
      index: 4,
      id: '33d5261e84424fa1b06f7982c5c118b6',
      title: 'Screen 5: History Log & Preferences',
      description: 'Expandable historical workout logs, detailed set summaries, body weight tracker, unit toggles (lbs/kg), and data export/import tools.',
      appScreen: 'History & Settings'
    }
  ];

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-neutral-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Stitch Project Screens</h3>
              <p className="text-xs text-neutral-400">Project ID: 9972486579607895358 • FitLog Workout Tracker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Info Box */}
        <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-start gap-3 text-xs text-neutral-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <p className="leading-relaxed">
              We mapped the 5 Stitch screen generation slots from your prompt directly into five interactive, pixel-perfect screens in this application.
            </p>
          </div>
        </div>

        {/* Slot selector cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {stitchScreens.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setSelectedSlot(idx)}
              className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedSlot === idx
                  ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-md'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-mono font-bold">#{idx + 1}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs font-bold truncate block">{s.appScreen}</span>
            </button>
          ))}
        </div>

        {/* Selected Slot Details */}
        {stitchScreens[selectedSlot] && (
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  {stitchScreens[selectedSlot].title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-neutral-400">
                    ID: {stitchScreens[selectedSlot].id}
                  </span>
                  <button
                    onClick={() => handleCopy(stitchScreens[selectedSlot].id)}
                    className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
                    title="Copy Screen ID"
                  >
                    {copiedId === stitchScreens[selectedSlot].id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  onNavigateScreen(selectedSlot);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition"
              >
                Go to Screen
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {stitchScreens[selectedSlot].description}
            </p>

            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                Screen active & fully rendered
              </span>
              <span>Built with React + Tailwind CSS</span>
            </div>
          </div>
        )}

        {/* Optional code/URL inspector */}
        <div className="bg-neutral-950/40 p-3.5 rounded-xl border border-neutral-800/80 flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-neutral-400" />
            Paste raw Stitch HTML / Export (Optional)
          </label>
          <textarea
            rows={2}
            value={pastedCode}
            onChange={(e) => setPastedCode(e.target.value)}
            placeholder="If you export raw HTML or CSS from Stitch later, you can paste it here..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500"
          />
          {pastedCode && (
            <p className="text-[11px] text-emerald-400 font-medium">
              ✓ {pastedCode.length} characters loaded in buffer
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
};

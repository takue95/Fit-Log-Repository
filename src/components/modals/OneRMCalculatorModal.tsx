import React, { useState } from 'react';
import { X, Calculator, Target, Zap } from 'lucide-react';
import { calculate1RM, calculateBrzycki1RM } from '../../utils/fitnessCalc';

interface OneRMCalculatorModalProps {
  unit: 'lbs' | 'kg';
  onClose: () => void;
}

export const OneRMCalculatorModal: React.FC<OneRMCalculatorModalProps> = ({
  unit,
  onClose
}) => {
  const [weight, setWeight] = useState<number>(185);
  const [reps, setReps] = useState<number>(5);

  const epley1RM = calculate1RM(weight, reps);
  const brzycki1RM = calculateBrzycki1RM(weight, reps);
  const avg1RM = Math.round((epley1RM + brzycki1RM) / 2);

  const percentages = [
    { pct: 100, label: '1 Rep Max (100%)', reps: '1' },
    { pct: 95, label: 'Heavy Singles (95%)', reps: '1-2' },
    { pct: 90, label: 'Strength Doubles (90%)', reps: '2-3' },
    { pct: 85, label: 'Power Triples (85%)', reps: '4-5' },
    { pct: 80, label: 'Hypertrophy Heavy (80%)', reps: '6-8' },
    { pct: 75, label: 'Standard Hypertrophy (75%)', reps: '8-10' },
    { pct: 70, label: 'Volume Sets (70%)', reps: '10-12' },
    { pct: 65, label: 'Muscular Endurance (65%)', reps: '12-15' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-neutral-100 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-neutral-500/10 border border-neutral-500/20 flex items-center justify-center text-neutral-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">1RM (One Rep Max) Calculator</h3>
              <p className="text-xs text-neutral-400">Scientifically estimated maximal lift capacity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Inputs */}
        <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
              Weight Lifted ({unit})
            </label>
            <input
              type="number"
              value={weight || ''}
              onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xl font-bold text-white focus:outline-none focus:border-neutral-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
              Reps Performed
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={reps || ''}
                onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xl font-bold text-neutral-400 focus:outline-none focus:border-neutral-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Estimated 1RM Banner */}
        <div className="bg-gradient-to-r from-neutral-950/60 to-emerald-950/60 border border-neutral-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Estimated 1RM</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-extrabold text-white font-mono">{avg1RM}</span>
              <span className="text-sm font-semibold text-neutral-400">{unit}</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Epley: {epley1RM} {unit} • Brzycki: {brzycki1RM} {unit}
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-neutral-500/20 border border-neutral-500/40 flex items-center justify-center text-neutral-300">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        {/* Percentage Table for Training */}
        <div>
          <h4 className="text-xs uppercase font-bold text-neutral-400 tracking-wider mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            Training Weight Programming Table
          </h4>
          <div className="divide-y divide-neutral-800 bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden text-xs">
            {percentages.map((p) => {
              const targetWeight = Math.round((avg1RM * p.pct) / 100);
              return (
                <div key={p.pct} className="flex items-center justify-between px-3.5 py-2 hover:bg-neutral-900 transition">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-400 w-9">{p.pct}%</span>
                    <span className="text-neutral-300">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500 text-[11px]">{p.reps} reps</span>
                    <span className="font-mono font-bold text-white text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-700/80">
                      {targetWeight} {unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition"
        >
          Close Calculator
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Dumbbell, ArrowRight } from 'lucide-react';
import { calculateBarbellPlates } from '../../utils/fitnessCalc';

interface PlateCalculatorModalProps {
  initialWeight?: number;
  unit: 'lbs' | 'kg';
  onClose: () => void;
  onApplyWeight?: (weight: number) => void;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  initialWeight = 135,
  unit,
  onClose,
  onApplyWeight
}) => {
  const [weight, setWeight] = useState<number>(initialWeight);
  const result = calculateBarbellPlates(weight, unit);

  const presets = unit === 'lbs'
    ? [95, 135, 185, 225, 275, 315, 365, 405]
    : [40, 60, 80, 100, 120, 140, 160, 180];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Barbell Plate Calculator</h3>
              <p className="text-xs text-neutral-400">Plates needed per side ({result.barWeight} {unit} bar)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input & Target Weight */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col gap-3">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Target Total Weight ({unit})
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step={unit === 'lbs' ? '5' : '2.5'}
              value={weight || ''}
              onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-2xl font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setWeight((prev) => prev + (unit === 'lbs' ? 5 : 2.5))}
                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold rounded"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setWeight((prev) => Math.max(result.barWeight, prev - (unit === 'lbs' ? 5 : 2.5)))}
                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold rounded"
              >
                -
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setWeight(p)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                  weight === p
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Barbell */}
        <div className="bg-neutral-950/70 p-5 rounded-xl border border-neutral-800 flex flex-col items-center gap-4">
          <div className="text-xs text-neutral-400">
            Per Side: <span className="font-bold text-white">{result.weightPerSide} {unit}</span>
            {result.remainder > 0 && (
              <span className="text-emerald-400 ml-2">({result.remainder} {unit} remaining)</span>
            )}
          </div>

          {/* Graphical sleeve */}
          <div className="w-full flex items-center justify-center py-4 overflow-x-auto">
            <div className="flex items-center">
              {/* Collar/Bar Shaft */}
              <div className="w-16 h-4 bg-neutral-600 rounded-l-md border border-neutral-500 relative flex items-center justify-center">
                <span className="text-[9px] text-neutral-300 font-mono">BAR</span>
              </div>
              {/* Inner Collar Ring */}
              <div className="w-3 h-14 bg-neutral-500 rounded-sm shadow-md" />

              {/* Plates stack */}
              <div className="flex items-center gap-1 px-1 bg-neutral-900/60 py-2 rounded-r-lg border-y border-r border-neutral-700 min-h-[90px]">
                {result.platesPerSide.length === 0 ? (
                  <span className="text-xs text-neutral-500 italic px-4">Empty Bar ({result.barWeight} {unit})</span>
                ) : (
                  result.platesPerSide.map((plateGroup, idx) =>
                    Array.from({ length: plateGroup.count }).map((_, pIdx) => {
                      const heightClass =
                        plateGroup.weight >= 45 || plateGroup.weight >= 20
                          ? 'h-24'
                          : plateGroup.weight >= 25 || plateGroup.weight >= 15
                          ? 'h-20'
                          : plateGroup.weight >= 10
                          ? 'h-16'
                          : 'h-12';

                      return (
                        <div
                          key={`${idx}-${pIdx}`}
                          className={`w-4 ${heightClass} rounded-sm flex items-center justify-center shadow-lg transition-all transform hover:scale-105`}
                          style={{ backgroundColor: plateGroup.color }}
                          title={`${plateGroup.weight} ${unit}`}
                        >
                          <span
                            className="text-[9px] font-bold text-neutral-950 -rotate-90 select-none whitespace-nowrap"
                          >
                            {plateGroup.weight}
                          </span>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>
          </div>

          {/* Breakdown summary */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2">
            {result.platesPerSide.map((item) => (
              <div
                key={item.weight}
                className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold">{item.weight} {unit}</span>
                </div>
                <span className="text-xs font-bold text-emerald-400">× {item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white transition"
          >
            Cancel
          </button>
          {onApplyWeight && (
            <button
              onClick={() => {
                onApplyWeight(weight);
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition"
            >
              Use {weight} {unit}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

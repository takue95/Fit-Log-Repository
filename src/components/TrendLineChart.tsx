import React, { useId } from 'react';

export interface TrendPoint {
  date: string;
  value: number;
}

interface TrendLineChartProps {
  points: TrendPoint[];
  unit: string;
  label: string;
  className?: string;
}

const toLocalDate = (value: string) => {
  const datePart = value.slice(0, 10);
  return new Date(`${datePart}T12:00:00`);
};

export const TrendLineChart: React.FC<TrendLineChartProps> = ({ points, unit, label, className = '' }) => {
  const gradientId = `trend-fill-${useId().replace(/:/g, '')}`;
  const width = 360;
  const height = 154;
  const left = 46;
  const right = 346;
  const top = 20;
  const bottom = 122;
  const values = points.map((point) => point.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const padding = Math.max((high - low) * 0.18, Math.abs(high) * 0.004, 0.5);
  const minValue = low - padding;
  const maxValue = high + padding;
  const valueRange = maxValue - minValue || 1;
  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? (left + right) / 2 : left + (index / (points.length - 1)) * (right - left);
    const y = bottom - ((point.value - minValue) / valueRange) * (bottom - top);
    return { ...point, x, y };
  });
  const line = coordinates.map(({ x, y }) => `${x},${y}`).join(' ');
  const area = coordinates.length > 1 ? `${left},${bottom} ${line} ${right},${bottom}` : '';
  const formatDate = (date: string) => toLocalDate(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  if (!points.length) {
    return (
      <div className={`flex min-h-32 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950/50 px-4 text-center text-xs text-neutral-500 ${className}`}>
        Log a weigh-in to start your trend.
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-950/60 px-2 pt-2 ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full" role="img" aria-label={`${label} trend chart`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#71b593" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#71b593" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((fraction) => {
          const y = bottom - fraction * (bottom - top);
          const value = minValue + fraction * valueRange;
          return (
            <g key={fraction}>
              <line x1={left} y1={y} x2={right} y2={y} stroke="#262626" strokeDasharray="4 5" />
              <text x={left - 8} y={y + 3} textAnchor="end" fill="#737373" fontSize="9" fontFamily="monospace">
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}
        {coordinates.length > 1 && <polygon points={area} fill={`url(#${gradientId})`} />}
        {coordinates.length > 1 && <polyline points={line} fill="none" stroke="#71b593" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {coordinates.map((point, index) => (
          <circle
            key={`${point.date}-${index}`}
            cx={point.x}
            cy={point.y}
            r={index === coordinates.length - 1 ? 5 : 3.5}
            fill={index === coordinates.length - 1 ? '#d8b36a' : '#71b593'}
            stroke="#0a0a0a"
            strokeWidth="2"
          >
            <title>{`${formatDate(point.date)}: ${point.value} ${unit}`}</title>
          </circle>
        ))}
        <text x={left} y={height - 7} textAnchor="start" fill="#737373" fontSize="9">{formatDate(points[0].date)}</text>
        {points.length > 1 && <text x={right} y={height - 7} textAnchor="end" fill="#737373" fontSize="9">{formatDate(points[points.length - 1].date)}</text>}
        <text x={right} y={12} textAnchor="end" fill="#737373" fontSize="9">{unit}</text>
      </svg>
    </div>
  );
};


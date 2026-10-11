import React, { useState } from 'react';
import { Flag, TrendingDown, Gauge } from 'lucide-react';
import { formatINR } from '@/utils/formatters';

interface DynoTelemetryCurveProps {
  originalPrice: number;
  currentResalePrice: number;
  vehicleAge: number;
  fuel: string;
  segment?: string;
  className?: string;
}

export const DynoTelemetryCurve: React.FC<DynoTelemetryCurveProps> = ({
  originalPrice,
  currentResalePrice,
  vehicleAge,
  fuel,
  segment = 'Standard',
  className = '',
}) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Generate 10-year depreciation trajectory
  // Retention factors matching our empirical segment decay curves
  const isSuv = segment.toLowerCase().includes('suv');
  const isEv = fuel.toLowerCase() === 'electric';

  const basePoints = [
    { year: 0, ret: 1.0 },
    { year: 1, ret: 0.92 },
    { year: 2, ret: 0.84 },
    { year: 3, ret: 0.76 }, // APEX RESALE EXIT
    { year: 4, ret: 0.69 },
    { year: 5, ret: 0.63 },
    { year: 6, ret: 0.56 },
    { year: 7, ret: 0.49 },
    { year: 8, ret: 0.43 },
    { year: 10, ret: 0.35 },
  ];

  const dynoPoints = basePoints.map((pt) => {
    let ret = pt.ret;
    if (isSuv) ret = Math.min(0.98, ret + 0.05);
    if (isEv) ret = ret * 0.88;
    const estimatedValue = originalPrice * ret;
    const lossRate = pt.year === 0 ? 0 : (originalPrice - estimatedValue) / pt.year;
    return {
      year: pt.year,
      retentionPct: Math.round(ret * 100),
      value: Math.round(estimatedValue),
      annualLoss: Math.round(lossRate),
    };
  });

  // SVG coordinates mapping (Width 500, Height 200, padding 40)
  const width = 500;
  const height = 180;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 20;
  const padBottom = 30;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getX = (year: number) => padLeft + (year / 10) * chartW;
  const getY = (retPct: number) => padTop + (1 - retPct / 100) * chartH;

  // Build SVG path string for the retention dyno trace
  const pathD = dynoPoints.reduce((acc, pt, idx) => {
    const x = getX(pt.year);
    const y = getY(pt.retentionPct);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Fill area under path
  const areaD = `${pathD} L ${getX(10)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`;

  const apexYear = 3;
  const apexPt = dynoPoints.find((p) => p.year === apexYear) || dynoPoints[3];
  const activePoint = hoveredYear !== null
    ? dynoPoints.find((p) => p.year === hoveredYear) || apexPt
    : apexPt;

  return (
    <div
      className={`p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5 font-mono ${className}`}
    >
      {/* Header with motorsport dyno badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-xs">
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                DYNO POWER & RESALE RETENTION TELEMETRY
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                MoTeC CHRONAX TRACE
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Chassis depreciation decay trajectory vs. annualized capital loss rate
            </p>
          </div>
        </div>

        {/* Apex Selling Window Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-black text-white font-semibold flex items-center gap-1.5 shadow-2xs">
            <Flag className="w-3 h-3 text-amber-400" />
            <span>RESALE APEX: Y3–Y4</span>
          </span>
        </div>
      </div>

      {/* SVG Dyno Plot Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-950 rounded-xl p-3 border border-slate-800 shadow-inner">
        {/* CRT Scanline overlay effect */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 2px, transparent 2px, transparent 4px)',
          }}
        />

        <svg className="w-full h-auto overflow-visible" viewBox={`0 0 ${width} ${height}`}>
          {/* Background Telemetry Grid Lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <g key={pct}>
              <line
                x1={padLeft}
                y1={getY(pct)}
                x2={width - padRight}
                y2={getY(pct)}
                stroke="#334155"
                strokeDasharray="2 3"
                strokeWidth="1"
              />
              <text
                x={padLeft - 6}
                y={getY(pct) + 3}
                fill="#94a3b8"
                fontSize="8"
                textAnchor="end"
                fontFamily="monospace"
              >
                {pct}%
              </text>
            </g>
          ))}

          {/* Vertical Year Markers */}
          {[0, 2, 4, 6, 8, 10].map((yr) => (
            <g key={yr}>
              <line
                x1={getX(yr)}
                y1={padTop}
                x2={getX(yr)}
                y2={height - padBottom}
                stroke="#1e293b"
                strokeWidth="1"
              />
              <text
                x={getX(yr)}
                y={height - padBottom + 14}
                fill="#94a3b8"
                fontSize="8"
                textAnchor="middle"
                fontFamily="monospace"
              >
                Y{yr}
              </text>
            </g>
          ))}

          {/* Area Fill Under Dyno Curve */}
          <path d={areaD} fill="url(#dyno-gradient)" opacity="0.25" />

          {/* Dyno Gradient Definition */}
          <defs>
            <linearGradient id="dyno-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Main Dyno Retention Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow-[0_0_6px_#10b981]"
          />

          {/* Current Vehicle Position Marker */}
          {vehicleAge <= 10 && (
            <g>
              <line
                x1={getX(vehicleAge)}
                y1={padTop}
                x2={getX(vehicleAge)}
                y2={height - padBottom}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(vehicleAge)}
                cy={getY(Math.round((currentResalePrice / originalPrice) * 100))}
                r="5"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth="2"
                className="animate-ping opacity-75"
              />
              <circle
                cx={getX(vehicleAge)}
                cy={getY(Math.round((currentResalePrice / originalPrice) * 100))}
                r="4"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Checkered Flag Apex Window Marker (Year 3) */}
          <g>
            <circle
              cx={getX(apexYear)}
              cy={getY(apexPt.retentionPct)}
              r="4.5"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="1.5"
              className="filter drop-shadow-[0_0_8px_#f59e0b]"
            />
          </g>

          {/* Interactive Plot Nodes */}
          {dynoPoints.map((pt) => (
            <circle
              key={pt.year}
              cx={getX(pt.year)}
              cy={getY(pt.retentionPct)}
              r={hoveredYear === pt.year ? '6' : '3'}
              fill={hoveredYear === pt.year ? '#ffffff' : '#10b981'}
              stroke="#065f46"
              strokeWidth="1"
              onMouseEnter={() => setHoveredYear(pt.year)}
              className="cursor-pointer transition-all duration-150"
            />
          ))}
        </svg>

        {/* Legend Overlay Bar inside canvas */}
        <div className="flex items-center justify-between pt-2 px-1 text-[10px] text-slate-400 border-t border-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-emerald-400 rounded-full" />
              <span>Retention Power Curve</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Current ({vehicleAge}y)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Apex Sweet-Spot</span>
            </span>
          </div>
          <span className="text-slate-500 font-semibold">ECU SAMPLING: 1000Hz</span>
        </div>
      </div>

      {/* Interactive Telemetry Data Tile */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-slate-500 block uppercase">INSPECTED POINT: YEAR {activePoint.year}</span>
          <span className="text-sm font-bold text-slate-900">
            {formatINR(activePoint.value)} ({activePoint.retentionPct}% Retention)
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block uppercase">ANNUALIZED LOSS DECAY</span>
          <span className="text-sm font-bold text-rose-600 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            ~{formatINR(activePoint.annualLoss)} / yr
          </span>
        </div>
        <div className="text-[11px] text-slate-600 max-w-xs leading-relaxed border-l border-slate-200 pl-3">
          <strong>Apex Strategy:</strong> Selling between <strong>Years 3 and 4</strong> preserves maximum residual capital before post-warranty depreciation steepens.
        </div>
      </div>
    </div>
  );
};

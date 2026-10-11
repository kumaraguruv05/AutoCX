import React, { useEffect, useState } from 'react';
import { F1ShiftLights } from './F1ShiftLights';
import { formatINR, formatIndianDenomination } from '@/utils/formatters';

interface CockpitGaugesProps {
  retentionPercent: number; // e.g. 68.5%
  estimatedPrice: number;   // e.g. 985000
  fuel: string;
  vehicleAge: number;
  className?: string;
}

export const CockpitGauges: React.FC<CockpitGaugesProps> = ({
  retentionPercent,
  estimatedPrice,
  fuel,
  vehicleAge,
  className = '',
}) => {
  const [hasSwept, setHasSwept] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasSwept(true);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  // Convert retention percentage (0 - 100%) to tachometer angle (-130deg to +120deg = 250deg span)
  const clampedRetention = Math.min(100, Math.max(0, retentionPercent));
  const targetTachAngle = -130 + (clampedRetention / 100) * 245;

  // Speedometer angle (0 - 30L / 100 span)
  const priceInLakhs = estimatedPrice / 100000;
  const clampedSpeed = Math.min(30, Math.max(0, priceInLakhs));
  const targetSpeedAngle = -130 + (clampedSpeed / 30) * 245;

  return (
    <div
      className={`relative p-6 sm:p-8 rounded-3xl bg-neutral-950 border border-neutral-800 text-white shadow-2xl overflow-hidden ${className}`}
    >
      {/* Carbon fiber subtle weave texture background */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#383838 1px, transparent 1px), radial-gradient(#222 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 8px 8px',
        }}
      />

      {/* Top Cockpit Header: F1 Shift Lights & Cockpit Status */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div className="text-left font-mono">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 block font-semibold">
              SPORT INSTRUMENT CLUSTER • CHRONAX v2.6
            </span>
            <div className="text-xs font-bold text-neutral-200 flex items-center gap-2">
              <span className="text-cyan-400">STAGE 2 TELEMETRY</span>
              <span className="text-neutral-600">|</span>
              <span className="text-neutral-400">{fuel} POWERTRAIN</span>
            </div>
          </div>
        </div>

        {/* Steering Wheel F1 Shift Light Bank */}
        <F1ShiftLights intensity={Math.round(clampedRetention / 10)} showLabels />
      </div>

      {/* Main Dual-Gauge Instrument Binnacle */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        {/* ================= GAUGE 1: TACHOMETER (RETENTION RPM) ================= */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-inner">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            {/* Outer Gauge Bezel with Billet Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-neutral-700/60 shadow-[0_0_20px_rgba(0,0,0,0.8)_inset]" />
            <div className="absolute inset-2 rounded-full border border-neutral-800" />

            {/* SVG Dial Markings */}
            <svg className="w-full h-full" viewBox="0 0 200 200">
              {/* Dial Arc Background */}
              <circle
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke="#262626"
                strokeWidth="6"
                strokeDasharray="360 120"
                transform="rotate(135 100 100)"
              />
              {/* Redline Arc (8.0k to 10.0k / 80% to 100%) */}
              <circle
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke="#ef4444"
                strokeWidth="6"
                strokeDasharray="75 400"
                strokeDashoffset="-285"
                transform="rotate(135 100 100)"
              />

              {/* Dial Graduation Marks (0 to 10) */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const angle = -130 + num * 24.5;
                const rad = (angle * Math.PI) / 180;
                const x1 = 100 + 72 * Math.cos(rad);
                const y1 = 100 + 72 * Math.sin(rad);
                const x2 = 100 + 64 * Math.cos(rad);
                const y2 = 100 + 64 * Math.sin(rad);
                const textX = 100 + 52 * Math.cos(rad);
                const textY = 100 + 52 * Math.sin(rad);

                const isRedzone = num >= 8;

                return (
                  <g key={num}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isRedzone ? '#ef4444' : '#a3a3a3'}
                      strokeWidth={num % 2 === 0 ? '2.5' : '1.5'}
                    />
                    <text
                      x={textX}
                      y={textY + 3.5}
                      fill={isRedzone ? '#f87171' : '#e5e5e5'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {num}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Needle Pivot with Billet Center */}
            <div className="absolute w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-600 shadow-md flex items-center justify-center z-20">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            </div>

            {/* Sweeping Needle */}
            <div
              className={`absolute w-full h-full pointer-events-none z-10 ${
                hasSwept ? 'transition-transform duration-700 ease-out' : 'animate-needle-sweep'
              }`}
              style={
                {
                  '--target-angle': `${targetTachAngle}deg`,
                  transform: hasSwept ? `rotate(${targetTachAngle}deg)` : undefined,
                } as React.CSSProperties
              }
            >
              <div
                className="absolute top-1/2 left-1/2 w-1 h-20 -ml-0.5 rounded-full shadow-[0_0_10px_#f43f5e]"
                style={{
                  background: 'linear-gradient(to top, #f43f5e 40%, #fb7185 100%)',
                  transform: 'translateY(-100%)',
                }}
              />
            </div>

            {/* Bottom Digital Center Display */}
            <div className="absolute bottom-5 text-center font-mono z-20">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white block">
                {retentionPercent.toFixed(1)}%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">
                RESIDUAL RETENTION
              </span>
            </div>
          </div>

          <div className="w-full mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>TACHOMETER x10</span>
            <span className="text-emerald-400 font-bold">
              {retentionPercent >= 70 ? '🟢 OPTIMAL' : retentionPercent >= 50 ? '🟡 MODERATE' : '🔴 DEGRADED'}
            </span>
          </div>
        </div>

        {/* ================= GAUGE 2: SPEEDOMETER (VALUATION VELOCITY) ================= */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-inner">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            {/* Outer Gauge Bezel with Billet Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-neutral-700/60 shadow-[0_0_20px_rgba(0,0,0,0.8)_inset]" />
            <div className="absolute inset-2 rounded-full border border-neutral-800" />

            {/* SVG Speed Markings */}
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke="#262626"
                strokeWidth="6"
                strokeDasharray="360 120"
                transform="rotate(135 100 100)"
              />

              {[0, 5, 10, 15, 20, 25, 30].map((val, idx) => {
                const angle = -130 + idx * 40.8;
                const rad = (angle * Math.PI) / 180;
                const x1 = 100 + 72 * Math.cos(rad);
                const y1 = 100 + 72 * Math.sin(rad);
                const x2 = 100 + 64 * Math.cos(rad);
                const y2 = 100 + 64 * Math.sin(rad);
                const textX = 100 + 52 * Math.cos(rad);
                const textY = 100 + 52 * Math.sin(rad);

                return (
                  <g key={val}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38bdf8" strokeWidth="2" />
                    <text
                      x={textX}
                      y={textY + 3.5}
                      fill="#bae6fd"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {val}L
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Needle Pivot with Cyan Core */}
            <div className="absolute w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-600 shadow-md flex items-center justify-center z-20">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            </div>

            {/* Sweeping Speed Needle */}
            <div
              className={`absolute w-full h-full pointer-events-none z-10 ${
                hasSwept ? 'transition-transform duration-700 ease-out' : 'animate-needle-sweep'
              }`}
              style={
                {
                  '--target-angle': `${targetSpeedAngle}deg`,
                  transform: hasSwept ? `rotate(${targetSpeedAngle}deg)` : undefined,
                } as React.CSSProperties
              }
            >
              <div
                className="absolute top-1/2 left-1/2 w-1 h-20 -ml-0.5 rounded-full shadow-[0_0_10px_#38bdf8]"
                style={{
                  background: 'linear-gradient(to top, #0284c7 40%, #38bdf8 100%)',
                  transform: 'translateY(-100%)',
                }}
              />
            </div>

            {/* Bottom Digital Center Display */}
            <div className="absolute bottom-5 text-center font-mono z-20">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white block">
                {formatINR(estimatedPrice)}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold block">
                MARKET RESALE VELOCITY
              </span>
            </div>
          </div>

          <div className="w-full mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span>GEAR:</span>
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-white font-bold border border-neutral-700">
                [ D ]
              </span>
            </span>
            <span className="text-neutral-300 font-bold">
              {formatIndianDenomination(estimatedPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Cockpit Status Bar Footer */}
      <div className="relative z-10 mt-6 pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>STARTUP NEEDLE SWEEP CALIBRATED</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>CALENDAR REF: 2026</span>
          <span>•</span>
          <span>CHRONAX ECU: ONLINE</span>
        </div>
      </div>
    </div>
  );
};

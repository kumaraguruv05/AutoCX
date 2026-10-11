import React, { useEffect, useState } from 'react';
import { F1ShiftLights } from './F1ShiftLights';
import { formatINR, formatIndianDenomination } from '@/utils/formatters';
import { OdometerRollingNumber } from './OdometerRollingNumber';

interface CockpitGaugesProps {
  retentionPercent: number; // e.g. 68.5%
  estimatedPrice: number;   // e.g. 985000
  fuel: string;
  vehicleAge: number;
  brand?: string;
  model?: string;
  kmDriven?: number;
  originalPrice?: number | null;
  depreciationAmount?: number | null;
  isAppreciation?: boolean;
  batterySoh?: number | null;
  batteryAdjustmentInr?: number | null;
  className?: string;
}

export const CockpitGauges: React.FC<CockpitGaugesProps> = ({
  retentionPercent,
  estimatedPrice,
  fuel,
  vehicleAge,
  brand,
  model,
  kmDriven,
  originalPrice,
  depreciationAmount,
  isAppreciation,
  batterySoh,
  batteryAdjustmentInr,
  className = '',
}) => {
  const [hasSwept, setHasSwept] = useState(false);
  const [isManualRevving, setIsManualRevving] = useState(false);
  const [tachAngleOverride, setTachAngleOverride] = useState<number | null>(null);
  const [speedAngleOverride, setSpeedAngleOverride] = useState<number | null>(null);

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

  // Interactive throttle blip & needle rev to redline
  const triggerRev = () => {
    if (isManualRevving) return;

    setIsManualRevving(true);
    setHasSwept(true);

    // Dynamic rev curve:
    // 0ms: rapid surge to 10k RPM (+118 deg) and subtle torque blip on speedometer
    setTachAngleOverride(118);
    setSpeedAngleOverride(Math.min(115, targetSpeedAngle + 18));

    // 320ms: bounce off rev limiter (+122 deg)
    setTimeout(() => {
      setTachAngleOverride(122);
    }, 320);

    // 520ms: secondary harmonic bounce (+114 deg)
    setTimeout(() => {
      setTachAngleOverride(114);
    }, 520);

    // 780ms: glide smoothly back to actual retention & speed
    setTimeout(() => {
      setTachAngleOverride(targetTachAngle);
      setSpeedAngleOverride(targetSpeedAngle);
    }, 780);

    // 1250ms: reset revving state
    setTimeout(() => {
      setTachAngleOverride(null);
      setSpeedAngleOverride(null);
      setIsManualRevving(false);
    }, 1250);
  };

  const activeTachAngle = tachAngleOverride !== null ? tachAngleOverride : targetTachAngle;
  const activeSpeedAngle = speedAngleOverride !== null ? speedAngleOverride : targetSpeedAngle;

  return (
    <div
      id="gauge-dashboard"
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

      {/* Top Cockpit Header: F1 Shift Lights, Throttle Rev Button & Cockpit Status */}
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

        {/* Interactive Steering Wheel F1 Shift Light Bank & Throttle Rev Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={triggerRev}
            disabled={isManualRevving}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              isManualRevving
                ? 'bg-rose-950 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-95'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 hover:border-rose-500/80 text-white hover:scale-105 active:scale-95'
            }`}
            title="Throttle Blip / Rev Engine"
          >
            <span className={`w-2 h-2 rounded-full ${isManualRevving ? 'bg-rose-400 animate-ping' : 'bg-rose-500'}`} />
            <span>{isManualRevving ? 'REV LIMITER 🏁' : 'REV ENGINE'}</span>
            <span className="text-xs">🏎️</span>
          </button>

          <F1ShiftLights
            isRevving={isManualRevving}
            intensity={Math.round(clampedRetention / 10)}
            showLabels
            onRev={triggerRev}
          />
        </div>
      </div>

      {/* ================= HIGH-VISIBILITY RESULTS BLACK BOX (OVER GAUGE CLUSTERS) ================= */}
      <div className="relative z-20 my-6 p-5 sm:p-6 rounded-2xl bg-black border-2 border-neutral-700/90 shadow-[0_10px_35px_rgba(0,0,0,0.95)]">
        {/* Top telemetry line */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-neutral-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
            <span className="font-bold text-neutral-100 tracking-wider">
              {brand && model ? `${brand} ${model}` : 'VEHICLE RESALE TELEMETRY'}
            </span>
            <span className="text-neutral-500">•</span>
            <span className="text-neutral-300 font-semibold">{fuel}</span>
            {kmDriven !== undefined && (
              <>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300 font-semibold">{kmDriven.toLocaleString()} km</span>
              </>
            )}
            <span className="text-neutral-500">•</span>
            <span className="text-neutral-300 font-semibold">{vehicleAge} yrs old</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 text-neutral-200 font-bold text-[11px] tracking-wide">
              CHRONAX ECU: ONLINE
            </span>
            <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 text-cyan-400 font-bold text-[11px] tracking-wide">
              GEAR [ D ]
            </span>
          </div>
        </div>

        {/* Big High-Contrast Result Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
          {/* Main Number 1: Estimated Resale Value */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>ESTIMATED RESALE VALUE</span>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-white tracking-tight drop-shadow-[0_2px_12px_rgba(255,255,255,0.3)]">
              <OdometerRollingNumber value={estimatedPrice} />
            </div>
            <div className="text-xs font-mono font-bold flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-700 font-extrabold">
                {formatIndianDenomination(estimatedPrice)}
              </span>
              <span className="text-neutral-400 font-normal">Market Valuation Target</span>
            </div>
          </div>

          {/* Main Number 2: Residual Retention % */}
          <div className="space-y-1.5 md:border-l md:border-neutral-800 md:pl-6">
            <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>RESIDUAL RETENTION</span>
            </div>
            <div className={`text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight ${
              clampedRetention >= 70
                ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                : clampedRetention >= 50
                ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                : 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]'
            }`}>
              {clampedRetention.toFixed(1)}%
            </div>
            <div className="text-xs font-mono flex items-center gap-2">
              {depreciationAmount != null ? (
                <span className={`font-bold ${isAppreciation ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isAppreciation ? '+' : '-'}{formatINR(Math.abs(depreciationAmount))} ({isAppreciation ? 'Appreciated' : 'Depreciated'})
                </span>
              ) : (
                <span className="text-neutral-300 font-semibold">
                  {clampedRetention >= 70 ? '🟢 Optimal Residual Retention' : clampedRetention >= 50 ? '🟡 Moderate Retention' : '🔴 Accelerated Decay'}
                </span>
              )}
            </div>
          </div>

          {/* Main Number 3: Original Invoice / EV Battery SOH */}
          <div className="space-y-1.5 lg:border-l lg:border-neutral-800 lg:pl-6 col-span-1 md:col-span-2 lg:col-span-1">
            {originalPrice ? (
              <>
                <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>ORIGINAL INVOICE PRICE</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-100">
                  {formatINR(originalPrice)}
                </div>
                <div className="text-xs font-mono text-neutral-400">
                  {formatIndianDenomination(originalPrice)} • Original Purchase Sticker
                </div>
              </>
            ) : batterySoh != null ? (
              <>
                <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>TRACTION BATTERY SOH</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]">
                  {batterySoh.toFixed(1)}% SOH
                </div>
                <div className="text-xs font-mono text-neutral-300">
                  Resale Impact: {batteryAdjustmentInr != null && batteryAdjustmentInr >= 0 ? '+' : ''}{batteryAdjustmentInr != null ? formatINR(batteryAdjustmentInr) : 'Evaluated'}
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>EST. ANNUAL DEPRECIATION</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-100">
                  ~{formatINR(Math.round((estimatedPrice * (100 - clampedRetention)) / Math.max(1, vehicleAge * clampedRetention)))} / yr
                </div>
                <div className="text-xs font-mono text-neutral-400">
                  Amortized Resale Decay Rate
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Dual-Gauge Instrument Binnacle */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* ================= GAUGE 1: TACHOMETER (RETENTION RPM & INTERACTIVE REV TARGET) ================= */}
        <div
          onClick={triggerRev}
          title="Click to rev engine! 🏎️"
          className="relative flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-inner cursor-pointer group hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.25)] active:scale-[0.99] transition-all"
        >
          {/* Tap to rev badge in corner */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[9px] font-mono font-bold text-neutral-400 group-hover:text-rose-400 transition-colors">
            <span className="w-2 h-2 rounded-full bg-rose-500 group-hover:animate-ping" />
            <span>CLICK TO REV 🏁</span>
          </div>

          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center mt-2">
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
              <span className={`w-2.5 h-2.5 rounded-full ${isManualRevving ? 'bg-rose-400 animate-ping' : 'bg-rose-500'} shadow-[0_0_8px_#f43f5e]`} />
            </div>

            {/* Sweeping Needle */}
            <div
              className={`absolute w-full h-full pointer-events-none z-10 ${
                hasSwept
                  ? isManualRevving
                    ? 'transition-transform duration-150 ease-out'
                    : 'transition-transform duration-700 ease-out'
                  : 'animate-needle-sweep'
              }`}
              style={
                {
                  '--target-angle': `${activeTachAngle}deg`,
                  transform: hasSwept ? `rotate(${activeTachAngle}deg)` : undefined,
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

            {/* Bottom Digital Center Display - High-Contrast Black Box Pod */}
            <div className={`absolute bottom-3 text-center font-mono z-20 px-3.5 py-1.5 rounded-xl bg-black border-2 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.95)] ${
              isManualRevving
                ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.7)] animate-pulse'
                : 'border-neutral-700'
            }`}>
              {isManualRevving ? (
                <>
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-rose-400 block drop-shadow-[0_0_8px_#f43f5e]">
                    10,000 RPM
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-rose-300 font-bold block">
                    REDLINE LIMITER 🏁
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-white block">
                    {retentionPercent.toFixed(1)}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold block">
                    RESIDUAL RETENTION
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="w-full mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>TACHOMETER x1000 RPM</span>
            <span className={isManualRevving ? 'text-rose-400 font-bold animate-pulse' : 'text-emerald-400 font-bold'}>
              {isManualRevving ? '🔴 REDLINE' : retentionPercent >= 70 ? '🟢 OPTIMAL' : retentionPercent >= 50 ? '🟡 MODERATE' : '🔴 DEGRADED'}
            </span>
          </div>
        </div>

        {/* ================= GAUGE 2: SPEEDOMETER (VALUATION VELOCITY) ================= */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-inner">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center mt-2">
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
                hasSwept
                  ? isManualRevving
                    ? 'transition-transform duration-200 ease-out'
                    : 'transition-transform duration-700 ease-out'
                  : 'animate-needle-sweep'
              }`}
              style={
                {
                  '--target-angle': `${activeSpeedAngle}deg`,
                  transform: hasSwept ? `rotate(${activeSpeedAngle}deg)` : undefined,
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

            {/* Bottom Digital Center Display - High-Contrast Black Box Pod */}
            <div className="absolute bottom-3 text-center font-mono z-20 px-3.5 py-1.5 rounded-xl bg-black border-2 border-neutral-700 shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white block">
                <OdometerRollingNumber value={estimatedPrice} />
              </span>
              <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold block">
                MARKET VALUE
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

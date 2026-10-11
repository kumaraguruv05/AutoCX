import React, { useEffect, useState } from 'react';
import { Gauge, Sparkles } from 'lucide-react';

interface DrivingLoadingModalProps {
  isOpen: boolean;
  brand: string;
  model: string;
  fuel: string;
  segment?: string;
  onComplete: () => void;
}

type CarCategory = 'hatchback' | 'suv' | 'luxury_suv' | 'sport_sedan';

export const DrivingLoadingModal: React.FC<DrivingLoadingModalProps> = ({
  isOpen,
  brand,
  model,
  fuel,
  segment,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);

  // Determine car category
  const detectCategory = (): {
    category: CarCategory;
    title: string;
    environment: string;
    sceneLabel: string;
    ambientColor: string;
  } => {
    const combined = `${brand} ${model} ${segment || ''}`.toLowerCase();

    // 1. Luxury SUV
    if (
      combined.includes('land rover') ||
      combined.includes('endeavour') ||
      combined.includes('fortuner') ||
      combined.includes('discovery') ||
      combined.includes('defender') ||
      (combined.includes('bmw') && combined.includes('x')) ||
      (combined.includes('audi') && combined.includes('q')) ||
      (combined.includes('mercedes') && (combined.includes('gl') || combined.includes('g-class')))
    ) {
      return {
        category: 'luxury_suv',
        title: 'Full-Size Luxury SUV',
        environment: 'Metropolitan Boulevard',
        sceneLabel: 'CITY EXPRESSWAY • METROPOLIS',
        ambientColor: 'from-amber-500/20 via-neutral-950 to-neutral-950',
      };
    }

    // 2. Luxury Sport Sedan
    if (
      combined.includes('sedan') ||
      combined.includes('series') ||
      combined.includes('octavia') ||
      combined.includes('superb') ||
      combined.includes('c-class') ||
      combined.includes('e-class') ||
      combined.includes('a4') ||
      combined.includes('a6') ||
      combined.includes('seal') ||
      combined.includes('model 3')
    ) {
      return {
        category: 'sport_sedan',
        title: 'Aerodynamic Sport Sedan',
        environment: 'Grand Prix Race Track',
        sceneLabel: 'RACE CIRCUIT • APEX CURBING',
        ambientColor: 'from-rose-500/20 via-neutral-950 to-neutral-950',
      };
    }

    // 3. Standard / Compact SUV
    if (
      combined.includes('suv') ||
      combined.includes('nexon') ||
      combined.includes('duster') ||
      combined.includes('creta') ||
      combined.includes('brezza') ||
      combined.includes('harrier') ||
      combined.includes('safari') ||
      combined.includes('seltos') ||
      combined.includes('thar') ||
      combined.includes('scorpio') ||
      combined.includes('punch') ||
      combined.includes('kushaq') ||
      combined.includes('taigun')
    ) {
      return {
        category: 'suv',
        title: 'Crossover / Trail SUV',
        environment: 'Forest Mountain Trail',
        sceneLabel: 'ALPINE FOREST • MOUNTAIN RUN',
        ambientColor: 'from-emerald-500/20 via-neutral-950 to-neutral-950',
      };
    }

    // 4. Hatchback / Compact (Default)
    return {
      category: 'hatchback',
      title: 'Urban Compact Hatchback',
      environment: 'City Skyline',
      sceneLabel: 'DOWNTOWN SECTOR • CITY STREETS',
      ambientColor: 'from-cyan-500/20 via-neutral-950 to-neutral-950',
    };
  };

  const carInfo = detectCategory();

  // Progress animation (2.4 seconds total duration)
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const duration = 2400; // 2.4s

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 150);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  // Status ticker text based on progress
  let statusMessage = 'INITIALIZING CHRONAX DUAL REGRESSION ENGINE...';
  if (progress > 30 && progress <= 65) {
    statusMessage = 'EVALUATING DEPRECIATION DYNAMICS & SEGMENT GUARDRAILS...';
  } else if (progress > 65 && progress <= 88) {
    statusMessage = fuel.toLowerCase() === 'electric'
      ? 'CALIBRATING NASA AMES LI-ION CELL SOH KINETICS...'
      : 'INDEXING HISTORICAL AUCTION RESALE RETENTION CURVES...';
  } else if (progress > 88) {
    statusMessage = 'ENGAGING DIGITAL COCKPIT INSTRUMENT CLUSTER...';
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="relative w-full max-w-xl rounded-3xl bg-neutral-950 border-2 border-neutral-800 shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden text-white flex flex-col">
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${carInfo.ambientColor} pointer-events-none`} />

        {/* Header HUD Bar */}
        <div className="relative z-10 px-6 pt-5 pb-3 flex items-center justify-between border-b border-neutral-800/80">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div className="font-mono">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 block font-semibold">
                STAGE CALIBRATION IN PROGRESS
              </span>
              <div className="text-xs font-black text-neutral-100 flex items-center gap-2">
                <span>{brand} {model}</span>
                <span className="text-neutral-600">•</span>
                <span className="text-cyan-400">{fuel}</span>
              </div>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[9px] uppercase tracking-widest text-neutral-400 block font-bold">
              SCENARIO
            </span>
            <span className="text-[10px] font-bold text-neutral-200 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700">
              {carInfo.sceneLabel}
            </span>
          </div>
        </div>

        {/* ================= 2D DRIVING ANIMATION VIEWPORT ================= */}
        <div className="relative w-full h-48 bg-neutral-950 overflow-hidden flex flex-col justify-end">
          {/* Parallax Layer 1: Sky / Far Stars & Mountains / Distant Skyline */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            {carInfo.category === 'hatchback' && (
              // Distant city silhouette
              <div className="absolute bottom-12 inset-x-0 flex gap-4 animate-scenery-far">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-16 bg-neutral-800/60 rounded-t shrink-0"
                    style={{ height: `${30 + (i % 5) * 15}px` }}
                  />
                ))}
              </div>
            )}

            {carInfo.category === 'suv' && (
              // Distant mountain ridges
              <div className="absolute bottom-12 inset-x-0 flex items-end animate-scenery-far">
                <svg className="w-[1200px] h-20 text-emerald-950/60 shrink-0" viewBox="0 0 1200 80" fill="currentColor">
                  <path d="M0,80 L80,20 L160,50 L280,10 L380,45 L500,15 L620,55 L740,25 L860,60 L980,15 L1100,50 L1200,80 Z" />
                </svg>
              </div>
            )}

            {carInfo.category === 'luxury_suv' && (
              // Metropolitan glass towers
              <div className="absolute bottom-12 inset-x-0 flex gap-6 animate-scenery-far">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-20 bg-neutral-800/80 border-t border-amber-500/20 rounded-t shrink-0 flex flex-col gap-1 p-1"
                    style={{ height: `${45 + (i % 4) * 20}px` }}
                  >
                    <div className="w-full h-1 bg-amber-400/20 rounded-full" />
                    <div className="w-full h-1 bg-cyan-400/20 rounded-full" />
                  </div>
                ))}
              </div>
            )}

            {carInfo.category === 'sport_sedan' && (
              // Race track grandstand & floodlights
              <div className="absolute bottom-12 inset-x-0 flex items-end gap-12 animate-scenery-far">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center shrink-0">
                    <div className="w-6 h-1.5 bg-rose-400/60 shadow-[0_0_8px_#f43f5e] rounded-full mb-1" />
                    <div className="w-1 h-16 bg-neutral-700" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Parallax Layer 2: Mid-ground Elements (Trees / Streetlights / Floodlights) */}
          <div className="absolute bottom-8 inset-x-0 h-24 overflow-hidden pointer-events-none">
            {carInfo.category === 'hatchback' && (
              // City streetlamps passing by
              <div className="absolute inset-0 flex items-end gap-24 animate-scenery-mid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center shrink-0">
                    <div className="w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_12px_#38bdf8] mb-0.5" />
                    <div className="w-1 h-14 bg-neutral-600 rounded-t" />
                  </div>
                ))}
              </div>
            )}

            {carInfo.category === 'suv' && (
              // Pine tree silhouettes
              <div className="absolute inset-0 flex items-end gap-16 animate-scenery-mid">
                {Array.from({ length: 10 }).map((_, i) => (
                  <svg key={i} className="w-8 h-16 text-emerald-900 shrink-0" viewBox="0 0 32 64" fill="currentColor">
                    <polygon points="16,0 4,20 12,20 2,38 10,38 0,56 32,56 22,38 30,38 20,20 28,20" />
                    <rect x="14" y="56" width="4" height="8" fill="#442a15" />
                  </svg>
                ))}
              </div>
            )}

            {carInfo.category === 'luxury_suv' && (
              // Modern architectural avenue lights
              <div className="absolute inset-0 flex items-end gap-28 animate-scenery-mid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center shrink-0">
                    <div className="w-4 h-1.5 bg-amber-300 shadow-[0_0_12px_#fbbf24] rounded-full mb-0.5" />
                    <div className="w-1 h-14 bg-neutral-700" />
                  </div>
                ))}
              </div>
            )}

            {carInfo.category === 'sport_sedan' && (
              // Pit wall & racetrack sponsor boards
              <div className="absolute inset-0 flex items-end gap-20 animate-scenery-mid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-7 px-3 rounded bg-neutral-800 border-t-2 border-rose-500 text-[8px] font-mono font-bold text-neutral-300 flex items-center shrink-0"
                  >
                    AUTOCX APEX
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Speed blur lines rushing past */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 w-24 h-0.5 bg-white/40 rounded-full animate-speedline" style={{ animationDelay: '0.1s' }} />
            <div className="absolute top-20 w-36 h-0.5 bg-cyan-400/50 rounded-full animate-speedline" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-14 w-28 h-0.5 bg-white/30 rounded-full animate-speedline" style={{ animationDelay: '0.45s' }} />
          </div>

          {/* ================= 2D CAR SILHOUETTE ================= */}
          <div className="relative z-20 mx-auto mb-2 animate-chassis-float flex items-end justify-center">
            {/* 1. HATCHBACK SILHOUETTE */}
            {carInfo.category === 'hatchback' && (
              <div className="relative w-44 h-18">
                {/* Headlight beam */}
                <div
                  className="absolute top-6 left-full w-28 h-10 -mt-2 pointer-events-none opacity-60"
                  style={{
                    background: 'radial-gradient(ellipse at left, rgba(56, 189, 248, 0.45), transparent 75%)',
                    clipPath: 'polygon(0% 20%, 100% 0%, 100% 100%, 0% 80%)',
                  }}
                />

                {/* Car Body Vector */}
                <svg className="w-full h-full text-slate-200 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" viewBox="0 0 160 65" fill="none">
                  {/* Body Shell */}
                  <path
                    d="M10,48 L145,48 L155,42 L150,32 L130,30 L105,14 L45,14 L20,30 L6,34 L4,44 Z"
                    fill="#1e293b"
                    stroke="#0ea5e9"
                    strokeWidth="1.5"
                  />
                  {/* Roof & Windows */}
                  <path
                    d="M48,17 L102,17 L124,30 L40,30 Z"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="1"
                  />
                  <line x1="78" y1="17" x2="78" y2="30" stroke="#38bdf8" strokeWidth="1.5" />
                  {/* Headlight & Taillight */}
                  <polygon points="148,34 154,35 152,40 146,39" fill="#38bdf8" />
                  <polygon points="5,36 9,36 8,42 4,42" fill="#f43f5e" />
                </svg>

                {/* Rear Wheel */}
                <div className="absolute bottom-0 left-6 w-8 h-8 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-wheel-spin shadow-md">
                  <div className="w-5 h-5 rounded-full border border-cyan-400/80 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                  </div>
                </div>

                {/* Front Wheel */}
                <div className="absolute bottom-0 right-7 w-8 h-8 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-wheel-spin shadow-md">
                  <div className="w-5 h-5 rounded-full border border-cyan-400/80 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                  </div>
                </div>
              </div>
            )}

            {/* 2. STANDARD SUV SILHOUETTE */}
            {carInfo.category === 'suv' && (
              <div className="relative w-48 h-20">
                {/* Headlight beam */}
                <div
                  className="absolute top-8 left-full w-32 h-12 -mt-2 pointer-events-none opacity-60"
                  style={{
                    background: 'radial-gradient(ellipse at left, rgba(52, 211, 153, 0.45), transparent 75%)',
                    clipPath: 'polygon(0% 15%, 100% 0%, 100% 100%, 0% 85%)',
                  }}
                />

                {/* Car Body Vector */}
                <svg className="w-full h-full text-slate-200 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" viewBox="0 0 170 70" fill="none">
                  {/* Roof Rails */}
                  <line x1="45" y1="10" x2="115" y2="10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                  <line x1="55" y1="10" x2="55" y2="14" stroke="#10b981" strokeWidth="1.5" />
                  <line x1="105" y1="10" x2="105" y2="14" stroke="#10b981" strokeWidth="1.5" />
                  {/* Body Shell */}
                  <path
                    d="M12,52 L158,52 L166,45 L162,32 L138,30 L115,14 L42,14 L18,30 L8,36 L6,46 Z"
                    fill="#132a22"
                    stroke="#10b981"
                    strokeWidth="1.5"
                  />
                  {/* Cabin Windows */}
                  <path
                    d="M45,17 L112,17 L132,30 L38,30 Z"
                    fill="#061a14"
                    stroke="#34d399"
                    strokeWidth="1"
                  />
                  <line x1="82" y1="17" x2="82" y2="30" stroke="#34d399" strokeWidth="1.5" />
                  {/* Headlight & Taillight */}
                  <polygon points="158,34 165,35 163,42 156,41" fill="#34d399" />
                  <polygon points="8,38 12,38 11,45 7,45" fill="#f43f5e" />
                </svg>

                {/* Rear Off-Road Wheel */}
                <div className="absolute bottom-0 left-7 w-9 h-9 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-wheel-spin shadow-md">
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-400 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-300" />
                  </div>
                </div>

                {/* Front Off-Road Wheel */}
                <div className="absolute bottom-0 right-7 w-9 h-9 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-wheel-spin shadow-md">
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-400 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-300" />
                  </div>
                </div>
              </div>
            )}

            {/* 3. LUXURY SUV SILHOUETTE */}
            {carInfo.category === 'luxury_suv' && (
              <div className="relative w-52 h-22">
                {/* Headlight beam */}
                <div
                  className="absolute top-9 left-full w-36 h-12 -mt-2 pointer-events-none opacity-60"
                  style={{
                    background: 'radial-gradient(ellipse at left, rgba(251, 191, 36, 0.45), transparent 75%)',
                    clipPath: 'polygon(0% 15%, 100% 0%, 100% 100%, 0% 85%)',
                  }}
                />

                {/* Car Body Vector */}
                <svg className="w-full h-full text-slate-200 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" viewBox="0 0 180 75" fill="none">
                  {/* Body Shell */}
                  <path
                    d="M14,56 L168,56 L176,46 L172,32 L145,28 L120,12 L38,12 L18,28 L8,36 L6,50 Z"
                    fill="#1f1c16"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  {/* Chrome Beltline */}
                  <line x1="20" y1="30" x2="168" y2="30" stroke="#fbbf24" strokeWidth="1" />
                  {/* Cabin Windows */}
                  <path
                    d="M42,15 L118,15 L140,28 L34,28 Z"
                    fill="#110e08"
                    stroke="#fbbf24"
                    strokeWidth="1"
                  />
                  <line x1="86" y1="15" x2="86" y2="28" stroke="#fbbf24" strokeWidth="1.5" />
                  {/* Dual Headlights */}
                  <polygon points="168,34 175,35 173,42 166,41" fill="#fef08a" />
                  <polygon points="8,38 12,38 11,46 7,46" fill="#f43f5e" />
                </svg>

                {/* Luxury Alloy Rear Wheel */}
                <div className="absolute bottom-0 left-8 w-10 h-10 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-wheel-spin shadow-md">
                  <div className="w-7 h-7 rounded-full border-2 border-amber-400 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  </div>
                </div>

                {/* Luxury Alloy Front Wheel */}
                <div className="absolute bottom-0 right-8 w-10 h-10 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-wheel-spin shadow-md">
                  <div className="w-7 h-7 rounded-full border-2 border-amber-400 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  </div>
                </div>
              </div>
            )}

            {/* 4. LUXURY SPORT SEDAN SILHOUETTE */}
            {carInfo.category === 'sport_sedan' && (
              <div className="relative w-50 h-18">
                {/* Headlight beam */}
                <div
                  className="absolute top-6 left-full w-36 h-10 -mt-2 pointer-events-none opacity-60"
                  style={{
                    background: 'radial-gradient(ellipse at left, rgba(244, 63, 94, 0.45), transparent 75%)',
                    clipPath: 'polygon(0% 15%, 100% 0%, 100% 100%, 0% 85%)',
                  }}
                />

                {/* Car Body Vector */}
                <svg className="w-full h-full text-slate-200 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" viewBox="0 0 175 62" fill="none">
                  {/* Rear Aero Spoiler */}
                  <line x1="8" y1="20" x2="22" y2="20" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="12" y1="20" x2="16" y2="26" stroke="#f43f5e" strokeWidth="1.5" />
                  {/* Low-slung Body Shell */}
                  <path
                    d="M12,46 L164,46 L172,40 L168,30 L140,28 L110,12 L48,12 L24,26 L8,32 L6,42 Z"
                    fill="#231217"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                  />
                  {/* Sleek Cockpit Greenhouse */}
                  <path
                    d="M52,15 L108,15 L135,27 L38,27 Z"
                    fill="#12070a"
                    stroke="#fb7185"
                    strokeWidth="1"
                  />
                  <line x1="82" y1="15" x2="82" y2="27" stroke="#fb7185" strokeWidth="1.5" />
                  {/* Headlight & Taillight */}
                  <polygon points="166,32 172,33 170,38 164,37" fill="#fb7185" />
                  <polygon points="8,32 12,32 11,38 7,38" fill="#e11d48" />
                </svg>

                {/* Racing Multi-Spoke Rear Wheel */}
                <div className="absolute bottom-0 left-7 w-8 h-8 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-wheel-spin shadow-md">
                  <div className="w-5 h-5 rounded-full border border-rose-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-300" />
                  </div>
                </div>

                {/* Racing Multi-Spoke Front Wheel */}
                <div className="absolute bottom-0 right-7 w-8 h-8 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-wheel-spin shadow-md">
                  <div className="w-5 h-5 rounded-full border border-rose-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-300" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Road Surface & Scrolling Dashes */}
          <div className="relative w-full h-8 bg-neutral-900 border-t-2 border-neutral-700 flex items-center overflow-hidden">
            {carInfo.category === 'sport_sedan' ? (
              // Racetrack apex curbing (Red and white alternating stripes)
              <div className="w-[800px] h-full flex animate-road-scroll">
                {Array.from({ length: 40 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-10 h-full ${idx % 2 === 0 ? 'bg-rose-600' : 'bg-white'}`}
                  />
                ))}
              </div>
            ) : (
              // Classic dashed road centerline
              <div className="w-[800px] flex items-center gap-6 animate-road-scroll">
                {Array.from({ length: 24 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 w-10 rounded-full shrink-0 ${
                      carInfo.category === 'suv'
                        ? 'bg-amber-600/70'
                        : carInfo.category === 'luxury_suv'
                        ? 'bg-amber-400/90'
                        : 'bg-cyan-400/90'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= TELEMETRY PROGRESS & STATUS BAR ================= */}
        <div className="p-6 bg-neutral-950 border-t border-neutral-800 space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="font-semibold text-neutral-200">{statusMessage}</span>
            </span>
            <span className="text-cyan-400 font-black text-sm tracking-widest">{progress}%</span>
          </div>

          {/* Precision Motorsport Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-neutral-900 border border-neutral-700 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-300 transition-all duration-75 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1">
            <span>ENGINE: CHRONAX v2.6 ML</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>TRANSITIONING TO COCKPIT GAUGE SUITE</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

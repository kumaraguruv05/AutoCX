import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DrivingLoadingModalProps {
  isOpen: boolean;
  brand: string;
  model: string;
  fuel: string;
  segment?: string;
  year?: string;
  kmDriven?: string;
  onComplete: () => void;
}

export const DrivingLoadingModal: React.FC<DrivingLoadingModalProps> = ({
  isOpen,
  brand,
  model,
  fuel,
  segment,
  year,
  kmDriven,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);

  // Lock body scroll while loading screen is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // 3.0 seconds total duration for full calibration
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const duration = 3000; // Exactly 3.0s duration

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 120);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  // Background smooth color transition from pitch black (0%) to pure white (100%)
  const bgChannel = Math.min(255, Math.max(0, Math.round((progress / 100) * 255)));
  const isLight = progress >= 50;

  // Real engineering status messages across the 4 stages
  let stageLabel = 'STAGE 1 / 4';
  let stageDescription = 'Loading vehicle specification vectors & catalog price anchors...';
  if (progress > 25 && progress <= 50) {
    stageLabel = 'STAGE 2 / 4';
    stageDescription = 'Evaluating regularized depreciation regression model...';
  } else if (progress > 50 && progress <= 75) {
    stageLabel = 'STAGE 3 / 4';
    stageDescription = 'Applying Indian automotive brand provenance & retention safeguards...';
  } else if (progress > 75) {
    stageLabel = 'STAGE 4 / 4';
    stageDescription = 'Generating authoritative valuation & financial retention audit...';
  }

  const modalContent = (
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999999] w-screen h-screen min-h-screen overflow-hidden flex flex-col justify-between p-6 sm:p-10 md:p-14 select-none transition-colors duration-100 m-0"
      style={{
        backgroundColor: `rgb(${bgChannel}, ${bgChannel}, ${bgChannel})`,
      }}
    >
      {/* Ambient micro-grid background (fades smoothly as screen transitions to white) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isLight ? 0.03 : 0.06,
          backgroundImage: `linear-gradient(${isLight ? '#000' : '#fff'} 1px, transparent 1px), linear-gradient(90deg, ${isLight ? '#000' : '#fff'} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* TOP BAR: Clean Minimalist Header (Positioned at absolute top) */}
      <div className="relative z-10 flex items-center justify-between w-full pt-2 sm:pt-4 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs tracking-wider transition-colors duration-300 shadow-xs ${
              isLight ? 'bg-black text-white' : 'bg-white text-black'
            }`}
          >
            CX
          </div>
          <div className="font-mono">
            <span
              className={`text-xs font-bold tracking-widest block transition-colors duration-300 ${
                isLight ? 'text-black' : 'text-white'
              }`}
            >
              AUTOCX VALUATION LABS
            </span>
            <span
              className={`text-[10px] tracking-wider block transition-colors duration-300 ${
                isLight ? 'text-slate-500' : 'text-neutral-400'
              }`}
            >
              DETERMINISTIC INFERENCE ENGINE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <div
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-300 ${
              isLight
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-neutral-900 text-neutral-200 border-neutral-700'
            }`}
          >
            {brand} {model} {year ? `• ${year}` : ''} • {fuel}
          </div>
        </div>
      </div>

      {/* CENTERPIECE: Editorial Bold Typographic Counter & Linear Calibration Bar */}
      <div className="relative z-10 max-w-2xl mx-auto w-full text-center space-y-8 transition-colors duration-300 my-auto">
        {/* Stage indicator pill */}
        <div className="inline-flex items-center gap-2">
          <span
            className={`text-[11px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border font-bold transition-colors duration-300 ${
              isLight
                ? 'bg-slate-200/90 text-slate-900 border-slate-300'
                : 'bg-neutral-900 text-neutral-200 border-neutral-700'
            }`}
          >
            {stageLabel}
          </span>
          {segment && (
            <span
              className={`text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded transition-colors duration-300 ${
                isLight ? 'text-slate-600' : 'text-neutral-400'
              }`}
            >
              {segment}
            </span>
          )}
        </div>

        {/* Large Architectural Number Counter */}
        <div className="flex items-baseline justify-center font-mono">
          <span
            className={`text-8xl sm:text-9xl md:text-[10rem] font-black tracking-tighter tabular-nums transition-colors duration-300 ${
              isLight ? 'text-black' : 'text-white'
            }`}
          >
            {String(progress).padStart(2, '0')}
          </span>
          <span
            className={`text-4xl sm:text-5xl md:text-6xl font-light ml-2 transition-colors duration-300 ${
              isLight ? 'text-slate-400' : 'text-neutral-500'
            }`}
          >
            %
          </span>
        </div>

        {/* Precision Progress Bar */}
        <div className="space-y-2 max-w-xl mx-auto">
          <div
            className={`w-full h-2 rounded-full overflow-hidden transition-colors duration-300 ${
              isLight ? 'bg-slate-200' : 'bg-neutral-800'
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-75 ease-out ${
                isLight ? 'bg-black' : 'bg-white'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Micro calibration notches */}
          <div
            className={`flex justify-between text-[10px] font-mono transition-colors duration-300 px-1 ${
              isLight ? 'text-slate-400' : 'text-neutral-500'
            }`}
          >
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Dynamic status text */}
        <p
          className={`text-xs sm:text-sm font-mono tracking-wide transition-colors duration-300 max-w-lg mx-auto ${
            isLight ? 'text-slate-700' : 'text-neutral-300'
          }`}
        >
          {stageDescription}
        </p>
      </div>

      {/* BOTTOM BAR: Minimalist Metadata Footer */}
      <div
        className={`relative z-10 flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono border-t pt-4 transition-colors duration-300 ${
          isLight ? 'border-slate-200 text-slate-500' : 'border-neutral-800 text-neutral-500'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isLight ? 'bg-black' : 'bg-white'
            }`}
          />
          <span>CHRONAX v2.6 • RIDGE REGRESSION + RANDOM FOREST SOH</span>
        </div>

        <div className="flex items-center gap-4">
          <span>CALIBRATION: 3.0s</span>
          <span>•</span>
          <span>CALENDAR: 2026</span>
          {kmDriven && (
            <>
              <span>•</span>
              <span>{Number(kmDriven).toLocaleString()} KM USAGE</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

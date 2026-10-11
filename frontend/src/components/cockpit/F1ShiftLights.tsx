import React, { useEffect, useState } from 'react';
import { playRevSound } from '@/utils/engineAudio';

interface F1ShiftLightsProps {
  isRevving?: boolean;
  intensity?: number; // 0 to 10
  className?: string;
  showLabels?: boolean;
  isInteractive?: boolean;
  onRev?: () => void;
}

export const F1ShiftLights: React.FC<F1ShiftLightsProps> = ({
  isRevving = false,
  intensity = 6,
  className = '',
  showLabels = false,
  isInteractive = true,
  onRev,
}) => {
  const [revCounter, setRevCounter] = useState(0);
  const [manualRevActive, setManualRevActive] = useState(false);
  const [manualLevel, setManualLevel] = useState(0);

  // When continuous revving (e.g. inference running), cycle sequential shift lights rapidly
  useEffect(() => {
    if (!isRevving) return;
    const interval = setInterval(() => {
      setRevCounter((prev) => (prev + 1) % 11);
    }, 75);
    return () => clearInterval(interval);
  }, [isRevving]);

  // Handle interactive click-to-rev
  const handleRevClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (manualRevActive || isRevving) return;

    playRevSound();
    onRev?.();
    setManualRevActive(true);

    // Rapid acceleration up to 10 LEDs, hold redline, then decelerate
    const steps = [2, 4, 6, 8, 9, 10, 10, 9, 7, 4, 1, 0];
    steps.forEach((lvl, idx) => {
      setTimeout(() => {
        setManualLevel(lvl);
        if (idx === steps.length - 1) {
          setManualRevActive(false);
        }
      }, idx * 90);
    });
  };

  const currentLevel = isRevving
    ? revCounter
    : manualRevActive
    ? manualLevel
    : Math.min(10, Math.max(0, intensity));

  const isRedline = (isRevving && revCounter >= 9) || (manualRevActive && manualLevel >= 9);

  // 10 LEDs: 4 Green, 4 Red, 2 Blue/Purple
  const leds = [
    { id: 1, type: 'green', on: currentLevel >= 1 },
    { id: 2, type: 'green', on: currentLevel >= 2 },
    { id: 3, type: 'green', on: currentLevel >= 3 },
    { id: 4, type: 'green', on: currentLevel >= 4 },
    { id: 5, type: 'red', on: currentLevel >= 5 },
    { id: 6, type: 'red', on: currentLevel >= 6 },
    { id: 7, type: 'red', on: currentLevel >= 7 },
    { id: 8, type: 'red', on: currentLevel >= 8 },
    { id: 9, type: 'purple', on: currentLevel >= 9 },
    { id: 10, type: 'purple', on: currentLevel >= 10 },
  ];

  return (
    <div
      onClick={isInteractive ? handleRevClick : undefined}
      title={isInteractive ? 'Click to rev engine! 🏎️' : undefined}
      className={`inline-flex flex-col items-center gap-1.5 select-none ${
        isInteractive ? 'cursor-pointer group hover:scale-[1.04] active:scale-[0.96] transition-transform duration-200' : ''
      } ${className}`}
    >
      {/* Top telemetry label */}
      {showLabels && (
        <div className="flex items-center justify-between w-full px-1 text-[9px] font-mono uppercase tracking-widest text-neutral-400">
          <span className="flex items-center gap-1">
            <span>REV STAGE</span>
            {isInteractive && (
              <span className="text-[8px] px-1 py-0.2 rounded bg-neutral-800 text-cyan-400 group-hover:bg-cyan-900 group-hover:text-white transition-colors">
                TAP TO REV
              </span>
            )}
          </span>
          <span className={isRedline ? 'text-purple-400 font-bold animate-pulse' : 'text-neutral-500'}>
            {isRedline ? 'REDLINE SHIFT' : `${currentLevel * 10}% PEAK`}
          </span>
        </div>
      )}

      {/* Cockpit bezel casing */}
      <div className={`px-3 py-1.5 rounded-full bg-neutral-950 border border-neutral-700/80 shadow-inner flex items-center gap-1.5 sm:gap-2 ${
        isInteractive ? 'group-hover:border-cyan-500/70 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all' : ''
      }`}>
        {/* Left bezel bolt */}
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-700 border border-neutral-500/50 shrink-0" />

        <div className="flex items-center gap-1 sm:gap-1.5">
          {leds.map((led) => {
            const isLit = led.on;
            let activeClass = '';
            let glowShadow = '';

            if (led.type === 'green') {
              activeClass = isLit
                ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_#34d399]'
                : 'bg-emerald-950/60 border-emerald-900/60 opacity-30';
            } else if (led.type === 'red') {
              activeClass = isLit
                ? 'bg-rose-500 border-rose-300 shadow-[0_0_8px_#f43f5e]'
                : 'bg-rose-950/60 border-rose-900/60 opacity-30';
            } else {
              activeClass = isLit
                ? 'bg-purple-400 border-purple-200 shadow-[0_0_10px_#c084fc] animate-f1-redline'
                : 'bg-purple-950/60 border-purple-900/60 opacity-30';
            }

            return (
              <span
                key={led.id}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border transition-all duration-75 shrink-0 ${activeClass} ${glowShadow}`}
              />
            );
          })}
        </div>

        {/* Right bezel bolt */}
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-700 border border-neutral-500/50 shrink-0" />
      </div>
    </div>
  );
};

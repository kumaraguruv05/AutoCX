import React from 'react';
import { Cpu } from 'lucide-react';

interface ChassisBuildPlateProps {
  brand: string;
  model: string;
  year: number | string;
  fuel: string;
  transmission: string;
  owner: string;
  kmDriven: number;
  vehicleAge: number;
  segment?: string;
  algorithm?: string;
  className?: string;
}

export const ChassisBuildPlate: React.FC<ChassisBuildPlateProps> = ({
  brand,
  model,
  year,
  fuel,
  transmission,
  owner,
  kmDriven,
  vehicleAge,
  segment = 'Standard Passenger',
  algorithm = 'AutoCX Hybrid Regressor',
  className = '',
}) => {
  // Enthusiast provenance classification
  const getProvenanceGrade = () => {
    const isEnthusiastVehicle =
      segment.toLowerCase().includes('suv') ||
      brand.toLowerCase().includes('ford') ||
      brand.toLowerCase().includes('bmw') ||
      transmission.toLowerCase() === 'manual';

    if (kmDriven <= 35000 && owner.toLowerCase().includes('first')) {
      return {
        subtitle: 'Pristine Low-Mileage Provenance',
      };
    }
    if (isEnthusiastVehicle) {
      return {
        subtitle: 'Driver-Focused Mechanical Provenance',
      };
    }
    if (kmDriven >= 95000) {
      return {
        subtitle: 'High-Kilometre Stress Tested',
      };
    }
    return {
      subtitle: 'Standard Consumer Provenance',
    };
  };

  const provenance = getProvenanceGrade();

  return (
    <div
      className={`relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-neutral-700/90 text-white shadow-2xl overflow-hidden ${className}`}
    >
      {/* Brushed metallic horizontal grain texture */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* 4 Corner Precision Billet Hex Bolts */}
      <div className="absolute top-3.5 left-3.5 flex items-center justify-center w-4 h-4 rounded-full bg-neutral-700 border border-neutral-500 shadow-inner">
        <div className="w-2 h-0.5 bg-neutral-950 transform rotate-45" />
      </div>
      <div className="absolute top-3.5 right-3.5 flex items-center justify-center w-4 h-4 rounded-full bg-neutral-700 border border-neutral-500 shadow-inner">
        <div className="w-2 h-0.5 bg-neutral-950 transform -rotate-45" />
      </div>
      <div className="absolute bottom-3.5 left-3.5 flex items-center justify-center w-4 h-4 rounded-full bg-neutral-700 border border-neutral-500 shadow-inner">
        <div className="w-2 h-0.5 bg-neutral-950 transform -rotate-30" />
      </div>
      <div className="absolute bottom-3.5 right-3.5 flex items-center justify-center w-4 h-4 rounded-full bg-neutral-700 border border-neutral-500 shadow-inner">
        <div className="w-2 h-0.5 bg-neutral-950 transform rotate-60" />
      </div>

      {/* Primary Vehicle Build Data */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
        {/* Col 1: Vehicle Title & Identity */}
        <div className="md:col-span-2 space-y-3 font-mono">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 block font-semibold">
              OFFICIAL NOMENCLATURE & PROFILE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {brand} {model}
            </h2>
            <div className="text-xs text-neutral-400 flex items-center gap-2">
              <span className="text-cyan-400 font-bold">{segment}</span>
              <span className="text-neutral-600">•</span>
              <span>{provenance.subtitle}</span>
            </div>
          </div>

          {/* Stamped Specification Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 font-bold flex items-center gap-1.5">
              <span>⛽ {fuel}</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 font-bold flex items-center gap-1.5">
              <span>⚙️ {transmission}</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 font-bold flex items-center gap-1.5">
              <span>📅 MODEL YEAR: {year}</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 font-bold flex items-center gap-1.5">
              <span>👤 {owner}</span>
            </span>
          </div>
        </div>

        {/* Col 2: Engineering Telemetry Counters */}
        <div className="space-y-3 font-mono border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 block font-bold">
                TOTAL RUNNING SERVICE
              </span>
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {kmDriven.toLocaleString()} <span className="text-xs text-neutral-400 font-normal">KM</span>
              </div>
              <span className="text-[11px] text-neutral-400">
                Logged Life: {vehicleAge} years on road
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-800/80">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 block font-bold">
                CALIBRATED ML CORE
              </span>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{algorithm}</span>
              </div>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                R² 0.9676 • Certified Zero Leakage
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

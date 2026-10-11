import React from 'react';
import { Award, ShieldCheck, Cpu, Wrench } from 'lucide-react';

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
  // Generate deterministic chassis serial number based on car specs
  const strHash = Math.abs(
    `${brand}${model}${year}${kmDriven}`.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
  ).toString(16).toUpperCase().padStart(6, '0').slice(0, 6);

  const chassisSerial = `ACX-IND-${year}-${strHash}`;

  // Enthusiast provenance grade badge
  const getProvenanceGrade = () => {
    const isEnthusiastVehicle =
      segment.toLowerCase().includes('suv') ||
      brand.toLowerCase().includes('ford') ||
      brand.toLowerCase().includes('bmw') ||
      transmission.toLowerCase() === 'manual';

    if (kmDriven <= 35000 && owner.toLowerCase().includes('first')) {
      return {
        badge: 'CLASS-A SURVIVOR SPEC',
        subtitle: 'Pristine Low-Mileage Provenance',
        color: 'text-emerald-400 border-emerald-500/80 bg-emerald-950/40',
      };
    }
    if (isEnthusiastVehicle) {
      return {
        badge: 'ENTHUSIAST ROAD & TRAIL SPEC',
        subtitle: 'Driver-Focused Mechanical Provenance',
        color: 'text-cyan-400 border-cyan-500/80 bg-cyan-950/40',
      };
    }
    if (kmDriven >= 95000) {
      return {
        badge: 'ENDURANCE VETERAN SPEC',
        subtitle: 'High-Kilometre Stress Tested',
        color: 'text-amber-400 border-amber-500/80 bg-amber-950/40',
      };
    }
    return {
      badge: 'TOURING COMMUTE SPEC',
      subtitle: 'Standard Consumer Provenance',
      color: 'text-neutral-300 border-neutral-600 bg-neutral-900',
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

      {/* Plaque Header: Stamped Metadata */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-amber-400" />
          <div className="font-mono">
            <span className="text-[10px] tracking-widest uppercase text-neutral-400 block font-bold">
              AUTOCX CERTIFIED CHASSIS BUILD SPECIFICATION
            </span>
            <span className="text-xs font-black tracking-wider text-amber-300">
              SERIAL NO: {chassisSerial}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className={`px-2.5 py-1 rounded-md border font-bold uppercase tracking-wider text-[10px] ${provenance.color}`}>
            {provenance.badge}
          </span>
        </div>
      </div>

      {/* Primary Vehicle Build Data */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
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
              <span>{provenance.subtitle}</span>
              <span className="text-neutral-600">•</span>
              <span className="text-cyan-400 font-bold">{segment}</span>
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

      {/* Bottom Plaque Seal */}
      <div className="relative z-10 mt-6 pt-4 border-t border-neutral-800/90 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-neutral-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-neutral-300 font-semibold">
            CHRONAX MONOCOQUE PLAQUE CERTIFIED • INDIAN AUTOMOTIVE DATASET TESTED
          </span>
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <Wrench className="w-3.5 h-3.5" />
          <span>SPEC NO: {chassisSerial.slice(-8)}</span>
        </div>
      </div>
    </div>
  );
};

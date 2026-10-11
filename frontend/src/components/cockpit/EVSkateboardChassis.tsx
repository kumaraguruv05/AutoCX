import React, { useState } from 'react';
import { Zap, ShieldAlert, Cpu, Activity, Thermometer } from 'lucide-react';

interface EVSkateboardChassisProps {
  sohPercent: number;
  cycleCount: number;
  internalResistance?: number;
  voltageSpread?: number;
  tempPeak?: number;
  ambientTemp?: number;
  className?: string;
}

export const EVSkateboardChassis: React.FC<EVSkateboardChassisProps> = ({
  sohPercent,
  cycleCount,
  internalResistance = 0.082,
  voltageSpread = 1.69,
  tempPeak = 36.5,
  ambientTemp = 24.0,
  className = '',
}) => {
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  // Generate 16 cell modules with slight realistic thermal and impedance variances
  const modules = Array.from({ length: 16 }, (_, i) => {
    const modId = i + 1;
    // Outer edge modules run cooler, inner core modules run slightly hotter
    const isCoreModule = [6, 7, 10, 11].includes(modId);
    const modSoh = Math.max(
      15,
      Math.min(100, sohPercent + (isCoreModule ? -1.2 : 0.8) + ((i % 3) - 1) * 0.5)
    );
    const modTemp = tempPeak + (isCoreModule ? 1.5 : -1.0) + (i % 2) * 0.4;
    const modRes = internalResistance + (isCoreModule ? 0.008 : -0.004);

    let statusTheme = {
      fill: 'from-emerald-400 to-cyan-500',
      border: 'border-cyan-400/80',
      text: 'text-cyan-300',
      status: 'OPTIMAL',
    };

    if (modSoh < 70) {
      statusTheme = {
        fill: 'from-rose-600 to-amber-600',
        border: 'border-rose-400',
        text: 'text-rose-300',
        status: 'EOL CRITICAL',
      };
    } else if (modSoh < 80) {
      statusTheme = {
        fill: 'from-amber-500 to-yellow-600',
        border: 'border-amber-400',
        text: 'text-amber-300',
        status: 'DEGRADED',
      };
    } else if (modSoh < 90) {
      statusTheme = {
        fill: 'from-sky-500 to-emerald-500',
        border: 'border-sky-400',
        text: 'text-sky-300',
        status: 'NOMINAL',
      };
    }

    return {
      id: modId,
      name: `M${modId.toString().padStart(2, '0')}`,
      soh: modSoh,
      temp: modTemp,
      resistance: modRes,
      theme: statusTheme,
    };
  });

  const activeModData = selectedModule
    ? modules.find((m) => m.id === selectedModule)
    : modules[5]; // Default to core module

  return (
    <div
      className={`relative p-6 sm:p-8 rounded-3xl bg-neutral-950 border border-neutral-800 text-white shadow-2xl overflow-hidden ${className}`}
    >
      {/* Blueprint grid pattern background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Blueprint Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-sm">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div className="font-mono text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                EV SKATEBOARD CHASSIS BLUEPRINT
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold uppercase">
                MoTeC PCoE LINK
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              NASA Ames Electrochemical Cell Module Thermal & Impedance Array
            </p>
          </div>
        </div>

        {/* Global SOH Badge */}
        <div className="flex items-center gap-3 font-mono self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-right">
            <span className="text-[9px] text-neutral-400 block uppercase">PACK HEALTH</span>
            <span
              className={`text-sm font-bold ${
                sohPercent >= 90
                  ? 'text-cyan-400'
                  : sohPercent >= 80
                  ? 'text-emerald-400'
                  : sohPercent >= 70
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {sohPercent.toFixed(1)}% SOH
            </span>
          </div>
        </div>
      </div>

      {/* Skateboard Chassis Cutaway Visualizer */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center">
        {/* Vector Chassis Cutaway (8 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-[340px] sm:max-w-[420px] aspect-[9/16] p-4 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 shadow-inner flex flex-col items-center justify-between">
            {/* Front Axle & PMSM Drive Unit */}
            <div className="w-full flex items-center justify-between px-6 pt-2">
              {/* Left front wheel */}
              <div className="w-6 h-12 rounded-lg bg-neutral-800 border-2 border-neutral-600 shadow-md" />
              {/* Front Electric Motor & Inverter */}
              <div className="px-4 py-2 rounded-xl bg-neutral-950 border border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)] text-center font-mono">
                <span className="text-[9px] text-cyan-400 font-bold block uppercase tracking-wider">
                  FRONT PMSM MOTOR
                </span>
                <span className="text-[10px] text-neutral-300">Permanent Magnet Inverter</span>
              </div>
              {/* Right front wheel */}
              <div className="w-6 h-12 rounded-lg bg-neutral-800 border-2 border-neutral-600 shadow-md" />
            </div>

            {/* High-Voltage Orange Busbar connecting front motor to battery */}
            <div className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-amber-600 shadow-[0_0_8px_#f59e0b] rounded-full" />

            {/* Central High-Voltage Battery Skateboard Tray */}
            <div className="w-full p-3.5 rounded-2xl bg-neutral-950 border-2 border-neutral-700/80 shadow-[0_0_25px_rgba(0,0,0,0.9)_inset] space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 border-b border-neutral-800 pb-1 px-1">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>HV TRACTION PACK (16 MODULES)</span>
                </span>
                <span>400V SKATEBOARD</span>
              </div>

              {/* 4x4 Grid of individual battery modules */}
              <div className="grid grid-cols-4 gap-2">
                {modules.map((mod) => {
                  const isSelected = selectedModule === mod.id;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => setSelectedModule(mod.id)}
                      className={`relative p-2 rounded-xl border transition-all duration-300 text-left font-mono cursor-pointer flex flex-col justify-between aspect-square group ${
                        isSelected
                          ? 'border-white bg-neutral-800 scale-105 shadow-[0_0_12px_rgba(255,255,255,0.4)] z-10'
                          : `${mod.theme.border} bg-neutral-900/90 hover:scale-102 hover:border-neutral-400`
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="font-bold text-neutral-300">{mod.name}</span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            mod.soh >= 80 ? 'bg-emerald-400 shadow-[0_0_4px_#34d399]' : 'bg-rose-500 shadow-[0_0_4px_#f43f5e]'
                          }`}
                        />
                      </div>

                      {/* Micro thermal level bar */}
                      <div className="space-y-0.5">
                        <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${mod.theme.fill}`}
                            style={{ width: `${Math.min(100, Math.max(10, mod.soh))}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-neutral-400 block font-semibold">
                          {mod.soh.toFixed(0)}% SOH
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* High-Voltage Orange Busbar connecting battery to rear axle */}
            <div className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-amber-600 shadow-[0_0_8px_#f59e0b] rounded-full" />

            {/* Rear Axle & Subframe */}
            <div className="w-full flex items-center justify-between px-6 pb-2">
              {/* Left rear wheel */}
              <div className="w-6 h-12 rounded-lg bg-neutral-800 border-2 border-neutral-600 shadow-md" />
              {/* Rear Differential / Subframe */}
              <div className="px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-center font-mono">
                <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">
                  REAR REGEN SUBFRAME
                </span>
                <span className="text-[10px] text-neutral-400">Independent Multi-link</span>
              </div>
              {/* Right rear wheel */}
              <div className="w-6 h-12 rounded-lg bg-neutral-800 border-2 border-neutral-600 shadow-md" />
            </div>
          </div>
        </div>

        {/* Live Module Diagnostic Inspector (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-md space-y-4 text-left font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  MODULE INSPECTOR: {activeModData?.name}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-cyan-300 border border-neutral-700 font-bold">
                {activeModData?.theme.status}
              </span>
            </div>

            {/* Module Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase block">State of Health</span>
                <span className={`text-xl font-extrabold ${activeModData?.theme.text}`}>
                  {activeModData?.soh.toFixed(1)}%
                </span>
                <span className="text-[9px] text-neutral-500 block">NASA Ames Curve</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase block">Internal Impedance</span>
                <span className="text-xl font-extrabold text-white">
                  {activeModData?.resistance.toFixed(3)} Ω
                </span>
                <span className="text-[9px] text-neutral-500 block">Cell Ohmic Resistance</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase block flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-rose-400" />
                  <span>Module Temp</span>
                </span>
                <span className="text-xl font-extrabold text-rose-400">
                  {activeModData?.temp.toFixed(1)} °C
                </span>
                <span className="text-[9px] text-neutral-500 block">Core Thermal Gradient</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase block">NASA Cycle Life</span>
                <span className="text-xl font-extrabold text-cyan-400">
                  {cycleCount} cyc
                </span>
                <span className="text-[9px] text-neutral-500 block">Electrochemical Charge</span>
              </div>
            </div>

            {/* Pack Health Analysis Note */}
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-[11px] text-neutral-300 leading-relaxed flex items-start gap-2.5">
              <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Click any individual cell module (<strong>M01–M16</strong>) to inspect its localized
                electrochemical degradation. Inner core modules experience higher thermal load gradients.
              </span>
            </div>
          </div>

          {/* Quick Telemetry Footnote */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/50 border border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>PACK VOLTAGE SPREAD: {voltageSpread.toFixed(2)}V</span>
            <span className="text-cyan-400 font-bold">AMBIENT: {ambientTemp.toFixed(1)}°C</span>
          </div>
        </div>
      </div>
    </div>
  );
};

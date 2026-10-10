import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Car,
  BatteryCharging,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Gauge,
  Activity,
  Layers,
  Share2,
  History
} from 'lucide-react';
import {
  CarPredictionRequest,
  CarPredictionResponse,
  BatteryPredictionRequest,
  BatteryPredictionResponse
} from '@/types/api';
import { formatINR, formatIndianDenomination, formatPercent } from '@/utils/formatters';
import { storageService } from '@/services/storage';

interface LocationState {
  analysisId?: string;
  carInput: CarPredictionRequest;
  carResult: CarPredictionResponse;
  batteryInput?: BatteryPredictionRequest | null;
  batteryResult?: BatteryPredictionResponse | null;
}

export const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | undefined;

  // If no state passed (e.g. direct URL), try to load the latest saved analysis from storage
  let currentAnalysis: LocationState | null = state || null;
  if (!currentAnalysis) {
    const history = storageService.getHistory();
    if (history.length > 0) {
      const latest = history[0];
      currentAnalysis = {
        analysisId: latest.id,
        carInput: latest.carInput,
        carResult: latest.carResult,
        batteryInput: latest.batteryInput,
        batteryResult: latest.batteryResult,
      };
    }
  }

  if (!currentAnalysis) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Car className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">No Analysis Active</h2>
        <p className="text-slate-400 text-sm">
          Please input your vehicle specifications first to generate machine learning valuations.
        </p>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all"
        >
          <Gauge className="w-4 h-4" />
          <span>Launch Vehicle Valuation</span>
        </Link>
      </div>
    );
  }

  const { carInput, carResult, batteryResult } = currentAnalysis;
  const isElectric = carInput.fuel === 'Electric';
  const hasDepreciation = carResult.depreciation !== null;
  const dep = carResult.depreciation;

  // Condition category color mapping
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Excellent':
        return {
          bg: 'bg-emerald-950/40',
          border: 'border-emerald-500/50',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'Good':
        return {
          bg: 'bg-cyan-950/40',
          border: 'border-cyan-500/50',
          text: 'text-cyan-400',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        };
      case 'Fair':
        return {
          bg: 'bg-amber-950/40',
          border: 'border-amber-500/50',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'Degraded':
      default:
        return {
          bg: 'bg-rose-950/40',
          border: 'border-rose-500/50',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Navigation & Vehicle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <button
          onClick={() => navigate('/analyze', { state: { editAnalysis: currentAnalysis } })}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Analysis Form</span>
        </button>

        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-all"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Saved Analyses</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Vehicle Summary Bar */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              {carInput.fuel}
            </span>
            <span className="text-xs font-mono text-slate-400">{carInput.year}</span>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">{carInput.transmission}</span>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">{carInput.owner}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {carInput.brand} {carInput.model}
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Odometer: {carInput.km_driven.toLocaleString()} km ({carResult.vehicle_summary.vehicle_age} yrs old)
          </p>
        </div>

        <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">
            Estimated Resale Value
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 font-mono">
            {formatINR(carResult.estimated_resale_price)}
          </div>
          <div className="text-xs font-mono text-cyan-400/90 mt-0.5">
            ({formatIndianDenomination(carResult.estimated_resale_price)})
          </div>
        </div>
      </div>

      {/* Core Results Grid: Car Valuation + EV Battery SOH (if applicable) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CARD 1: Valuation & Capital Depreciation Dynamics */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white">Value Retention & Depreciation</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">ChronAx Metrics</span>
          </div>

          {hasDepreciation && dep ? (
            <div className="space-y-6">
              {/* Stat tiles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="text-xs text-slate-400 font-mono">Original Invoice</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {formatINR(dep.original_price)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {formatIndianDenomination(dep.original_price)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="text-xs text-slate-400 font-mono">Value Lost</div>
                  <div
                    className={`text-xl font-bold font-mono mt-1 ${
                      dep.is_appreciation ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {dep.is_appreciation ? '+' : '-'}
                    {formatINR(Math.abs(dep.depreciation_amount))}
                  </div>
                  <div className="text-[11px] font-mono mt-0.5 flex items-center gap-1">
                    {dep.is_appreciation ? (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> Appreciated {formatPercent(Math.abs(dep.depreciation_percentage))}
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" /> Depreciation: {formatPercent(dep.depreciation_percentage)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Residual Value Retention Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Residual Value Retention:</span>
                  <span className="text-cyan-400 font-bold">
                    {Math.max(0, 100 - dep.depreciation_percentage).toFixed(1)}% of original
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3.5 border border-slate-800 overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, Math.max(5, 100 - dep.depreciation_percentage))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Depreciation Velocity */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Annualized Loss Rate:</span>
                  <span className="text-white font-semibold">
                    ~{formatINR(dep.depreciation_amount / Math.max(1, carResult.vehicle_summary.vehicle_age))} / yr
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Per-Kilometre Value Cost:</span>
                  <span className="text-white font-semibold">
                    ~₹{(dep.depreciation_amount / Math.max(1, carInput.km_driven)).toFixed(2)} / km
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
              <TrendingDown className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                No original purchase price was supplied. AutoCX successfully predicted the current resale market price (
                {formatINR(carResult.estimated_resale_price)}). To view exact capital depreciation percentages, enter the historical invoice value in the form.
              </p>
            </div>
          )}

          {/* Model confidence note */}
          <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1 font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span>Model Pipeline:</span>
              <span className="text-slate-300">{carResult.algorithm}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span>Test Benchmark R²:</span>
              <span className="text-emerald-400">{carResult.metrics.r2} (MAE: ₹{carResult.metrics.mae?.toLocaleString()})</span>
            </div>
          </div>
        </div>

        {/* CARD 2: EV Battery Health Diagnostics (rendered ONLY for Electric vehicles with diagnostics) */}
        {isElectric && batteryResult ? (
          (() => {
            const theme = getCategoryTheme(batteryResult.condition_category);
            return (
              <div className={`p-6 sm:p-8 rounded-2xl ${theme.bg} border ${theme.border} space-y-6 shadow-xl relative overflow-hidden`}>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <BatteryCharging className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        EV Traction Battery SOH
                      </h2>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border ${theme.badge}`}>
                    {batteryResult.condition_category}
                  </span>
                </div>

                {/* SOH Radial / Large Metric */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  {/* Circular visual indicator */}
                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={theme.text}
                        strokeDasharray={`${Math.min(100, Math.max(0, batteryResult.predicted_soh_percent))}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className={`text-2xl font-bold font-mono ${theme.text}`}>
                        {batteryResult.predicted_soh_percent.toFixed(1)}%
                      </span>
                      <span className="text-[9px] text-slate-500 block font-mono">SOH</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="text-sm font-semibold text-white">
                      Status: {batteryResult.condition_category}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {batteryResult.condition_description}
                    </p>
                    <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Evaluated via {batteryResult.algorithm}</span>
                    </div>
                  </div>
                </div>

                {/* Supporting Measurements Grid */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                    Diagnostic Measurements Logged
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Cycles Recorded</span>
                      <span className="text-white font-semibold">
                        {batteryResult.supporting_measurements.cycle_count} cycles
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Voltage Spread</span>
                      <span className="text-white font-semibold">
                        {batteryResult.supporting_measurements.voltage_spread_v} V
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Peak Cell Temp</span>
                      <span className="text-white font-semibold">
                        {batteryResult.supporting_measurements.peak_temperature_c} °C
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Discharge Time</span>
                      <span className="text-white font-semibold">
                        {batteryResult.supporting_measurements.discharge_duration_minutes} min
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Current Draw</span>
                      <span className="text-white font-semibold">
                        {batteryResult.supporting_measurements.discharge_current_a} A
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Ambient Temp</span>
                      <span className="text-white font-semibold">
                        {batteryResult.supporting_measurements.ambient_temp_c} °C
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Validation Strategy: Zero-Leakage Cell-Holdout. Test MAE = 2.69% on unseen physical NASA battery cells.
                  </span>
                </div>
              </div>
            );
          })()
        ) : isElectric ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4 shadow-xl flex flex-col justify-center items-center text-center">
            <BatteryCharging className="w-10 h-10 text-slate-600" />
            <h3 className="text-base font-bold text-white">EV Diagnostic Telemetry Not Supplied</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Resale prediction was performed successfully based on odometer, year, and model attributes. If you obtain battery diagnostic measurements (cycle count, voltage drops, temperature), re-run analysis to compute estimated battery SOH.
            </p>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4 shadow-xl flex flex-col justify-center items-center text-center">
            <Car className="w-10 h-10 text-slate-600" />
            <h3 className="text-base font-bold text-white">Internal Combustion Vehicle</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Battery health diagnostics are restricted to pure Electric vehicles (BEVs). This vehicle is powered by {carInput.fuel}, so traction battery SOH modeling was omitted to preserve analytical integrity.
            </p>
          </div>
        )}
      </div>

      {/* Disclaimers & Explanatory Notice */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/60 space-y-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Automotive Analytics Disclaimer & Limitations</span>
        </h3>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
          {carResult.limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
          {isElectric && batteryResult && (
            <li>
              EV battery State of Health estimations are based on cell degradation kinetics from NASA Ames PCoE experiments and do not replace OEM multi-pack BMS active telemetry.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

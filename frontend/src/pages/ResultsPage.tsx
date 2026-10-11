import React, { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Car,
  BatteryCharging,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Gauge,
  Activity,
  Share2,
  History,
  Zap
} from 'lucide-react';
import {
  CarPredictionRequest,
  CarPredictionResponse,
  BatteryPredictionRequest,
  BatteryPredictionResponse
} from '@/types/api';
import { formatINR, formatIndianDenomination, formatPercent } from '@/utils/formatters';
import { storageService } from '@/services/storage';
import { CockpitGauges } from '@/components/cockpit/CockpitGauges';
import { DynoTelemetryCurve } from '@/components/cockpit/DynoTelemetryCurve';
import { EVSkateboardChassis } from '@/components/cockpit/EVSkateboardChassis';

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

  useEffect(() => {
    // Instantly scroll to top so gauge cluster and startup needle sweep are directly front and center
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

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
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto text-slate-700">
          <Car className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">No Active Analysis Found</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          Please input your vehicle specifications first to generate machine learning resale and depreciation valuations.
        </p>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-sm shadow-lg shadow-black/20 hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group cursor-pointer"
        >
          <Gauge className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          <span>Launch Vehicle Valuation</span>
        </Link>
      </div>
    );
  }

  const { carInput, carResult, batteryResult } = currentAnalysis;
  const isElectric = carInput.fuel === 'Electric';
  const showBatteryDashboard = isElectric && Boolean(batteryResult);
  const hasDepreciation = carResult.depreciation !== null;
  const dep = carResult.depreciation;

  // Condition category color mapping (light theme)
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Excellent':
        return {
          bg: 'bg-emerald-50/60',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          ring: 'text-emerald-500',
        };
      case 'Good':
        return {
          bg: 'bg-sky-50/60',
          border: 'border-sky-200',
          text: 'text-sky-700',
          badge: 'bg-sky-100 text-sky-800 border-sky-300',
          ring: 'text-sky-500',
        };
      case 'Fair':
        return {
          bg: 'bg-amber-50/60',
          border: 'border-amber-200',
          text: 'text-amber-700',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          ring: 'text-amber-500',
        };
      case 'Degraded':
      default:
        return {
          bg: 'bg-rose-50/60',
          border: 'border-rose-200',
          text: 'text-rose-700',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          ring: 'text-rose-500',
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <button
          onClick={() => navigate('/analyze', { state: { editAnalysis: currentAnalysis } })}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 hover:text-black transition-all hover:-translate-x-0.5 cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Analysis Form</span>
        </button>

        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-mono transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-sm hover:shadow-lg cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-neutral-300" />
            <span>Saved Analyses</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 hover:text-black border border-slate-300 hover:border-black text-xs font-mono transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Concept 1: Digital Cockpit Instrument Cluster & Dynamic Tachometer Sweeps with Results Black Box */}
      <CockpitGauges
        retentionPercent={
          dep
            ? Math.max(0, 100 - dep.depreciation_percentage)
            : Math.max(25, Math.min(95, 100 - carResult.vehicle_summary.vehicle_age * 7.5))
        }
        estimatedPrice={carResult.estimated_resale_price}
        fuel={carInput.fuel}
        vehicleAge={carResult.vehicle_summary.vehicle_age}
        brand={carInput.brand}
        model={carInput.model}
        kmDriven={carInput.km_driven}
        originalPrice={dep?.original_price}
        depreciationAmount={dep?.depreciation_amount}
        isAppreciation={dep?.is_appreciation}
        batterySoh={carResult.battery_valuation_impact?.battery_soh}
        batteryAdjustmentInr={carResult.battery_valuation_impact?.adjustment_inr}
      />

      {/* Vehicle Summary Bar */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-black text-white font-semibold">
              {carInput.fuel}
            </span>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {carInput.year}
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {carInput.transmission}
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {carInput.owner}
            </span>
            {carResult.vehicle_summary.segment && (
              <>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-mono text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md font-semibold border border-slate-300">
                  {carResult.vehicle_summary.segment}
                </span>
              </>
            )}
            {carResult.battery_valuation_impact && (
              <>
                <span className="text-xs text-slate-300">•</span>
                <span className={`text-xs font-mono px-2.5 py-0.5 rounded-md font-semibold border flex items-center gap-1 ${
                  carResult.battery_valuation_impact.is_eol_override
                    ? 'bg-rose-50 text-rose-900 border-rose-300'
                    : carResult.battery_valuation_impact.adjustment_inr >= 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  <Zap className="w-3 h-3" />
                  <span>
                    {carResult.battery_valuation_impact.battery_soh.toFixed(1)}% SOH (
                    {carResult.battery_valuation_impact.is_eol_override
                      ? `EOL Override: ${formatINR(carResult.battery_valuation_impact.adjustment_inr)}`
                      : `${carResult.battery_valuation_impact.adjustment_inr >= 0 ? '+' : ''}${formatINR(carResult.battery_valuation_impact.adjustment_inr)}`}
                    )
                  </span>
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {carInput.brand} {carInput.model}
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Odometer: {carInput.km_driven.toLocaleString()} km ({carResult.vehicle_summary.vehicle_age} yrs old)
          </p>
        </div>

        <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-200">
          <div className="text-xs text-slate-500 font-mono uppercase tracking-wider font-semibold">
            Estimated Resale Value
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono mt-0.5">
            {formatINR(carResult.estimated_resale_price)}
          </div>
          <div className="text-xs font-mono text-slate-600 mt-1 font-semibold">
            ({formatIndianDenomination(carResult.estimated_resale_price)})
          </div>
        </div>
      </div>

      {/* Domain Guardrail Notice (if post-processing rules were triggered) */}
      {carResult.vehicle_summary.guardrails_applied && carResult.vehicle_summary.guardrails_applied.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-slate-900 block font-mono">
              AutoCX Domain Guardrails Applied
            </span>
            <ul className="text-slate-600 list-disc list-inside space-y-0.5 font-mono">
              {carResult.vehicle_summary.guardrails_applied.map((g, idx) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Core Results: Render 2-column grid when EV battery health is present, otherwise full single-column */}
      <div className={showBatteryDashboard ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : 'max-w-3xl mx-auto'}>
        {/* CARD 1: Valuation & Capital Depreciation Dynamics */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Value Retention & Depreciation</h2>
            </div>
            <span className="text-xs font-mono text-slate-500 font-semibold">ChronAx Valuation</span>
          </div>

          {hasDepreciation && dep ? (
            <div className="space-y-6">
              {/* Stat tiles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-mono">Original Invoice</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {formatINR(dep.original_price)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {formatIndianDenomination(dep.original_price)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-mono">Value Lost</div>
                  <div
                    className={`text-xl font-bold font-mono mt-1 ${
                      dep.is_appreciation ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {dep.is_appreciation ? '+' : '-'}
                    {formatINR(Math.abs(dep.depreciation_amount))}
                  </div>
                  <div className="text-[11px] font-mono mt-0.5 flex items-center gap-1 font-semibold">
                    {dep.is_appreciation ? (
                      <span className="text-emerald-700 flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> Appreciated {formatPercent(Math.abs(dep.depreciation_percentage))}
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" /> Depreciation: {formatPercent(dep.depreciation_percentage)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Residual Value Retention Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-600">Residual Value Retention:</span>
                  <span className="text-slate-900 font-bold">
                    {Math.max(0, 100 - dep.depreciation_percentage).toFixed(1)}% of original
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3.5 border border-slate-200 overflow-hidden p-0.5">
                  <div
                    className="bg-black h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, Math.max(5, 100 - dep.depreciation_percentage))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Depreciation Velocity */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Annualized Loss Rate:</span>
                  <span className="text-slate-900 font-bold">
                    ~{formatINR(dep.depreciation_amount / Math.max(1, carResult.vehicle_summary.vehicle_age))} / yr
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Per-Kilometre Value Cost:</span>
                  <span className="text-slate-900 font-bold">
                    ~₹{(dep.depreciation_amount / Math.max(1, carInput.km_driven)).toFixed(2)} / km
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <TrendingDown className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                No original purchase price was supplied. AutoCX predicted current resale market value (
                {formatINR(carResult.estimated_resale_price)}). To view exact capital depreciation percentages, enter the original invoice value in the form.
              </p>
            </div>
          )}

          {/* Concept 2: MoTeC Chassis Dyno Telemetry Retention Curve */}
          <DynoTelemetryCurve
            originalPrice={dep?.original_price || (carResult.estimated_resale_price * 1.45)}
            currentResalePrice={carResult.estimated_resale_price}
            vehicleAge={carResult.vehicle_summary.vehicle_age}
            fuel={carInput.fuel}
            segment={carResult.vehicle_summary.segment}
          />

          {/* Battery Health Valuation Impact Callout */}
          {carResult.battery_valuation_impact && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              carResult.battery_valuation_impact.is_eol_override
                ? 'bg-rose-50/70 border-rose-200'
                : carResult.battery_valuation_impact.adjustment_inr >= 0
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-amber-50/70 border-amber-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold font-mono text-slate-900 flex items-center gap-1.5">
                  <BatteryCharging className="w-4 h-4 text-slate-900" />
                  <span>Battery Health Resale Impact</span>
                </span>
                <div className="flex items-center gap-2">
                  {carResult.battery_valuation_impact.rule_precedence && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                      carResult.battery_valuation_impact.is_eol_override
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                    }`}>
                      {carResult.battery_valuation_impact.rule_precedence}
                    </span>
                  )}
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                    carResult.battery_valuation_impact.adjustment_inr >= 0
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}>
                    {carResult.battery_valuation_impact.adjustment_percent >= 0 ? '+' : ''}
                    {carResult.battery_valuation_impact.adjustment_percent}% ({formatINR(carResult.battery_valuation_impact.adjustment_inr)})
                  </span>
                </div>
              </div>

              {/* Component-level breakdown when EOL Override is triggered */}
              {carResult.battery_valuation_impact.is_eol_override && carResult.battery_valuation_impact.baseline_market_value && (
                <div className="p-3 rounded-lg bg-white/95 border border-rose-200 shadow-2xs space-y-2 font-mono">
                  <div className="font-bold text-slate-900 flex items-center justify-between text-[11px] pb-1 border-b border-slate-100">
                    <span className="flex items-center gap-1 text-rose-900">
                      <Zap className="w-3 h-3 text-rose-600" />
                      <span>Component-Level Override Breakdown (Double-Counting Protected)</span>
                    </span>
                    <span className="text-emerald-700 font-semibold text-[10px]">De-stacked Formula</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Baseline Value</span>
                      <span className="font-bold text-slate-900">
                        {formatINR(carResult.battery_valuation_impact.baseline_market_value)}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Net Battery Deduction</span>
                      <span className="font-bold text-rose-700">
                        -{formatINR(carResult.battery_valuation_impact.replacement_pack_cost_estimate || 0)}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Chassis Floor</span>
                      <span className="font-bold text-slate-900">
                        {formatINR(carResult.battery_valuation_impact.chassis_floor_inr || 0)}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] text-emerald-800 block">Net Valuation</span>
                      <span className="font-bold text-emerald-900">
                        {formatINR(carResult.estimated_resale_price)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-700 font-mono leading-relaxed">
                {carResult.battery_valuation_impact.explanation}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono text-slate-600 pt-1.5 border-t border-slate-200/80">
                <span>Replacement Risk: <strong className="text-slate-900">{carResult.battery_valuation_impact.pack_replacement_risk}</strong></span>
                <span>Condition: <strong className="text-slate-900">{carResult.battery_valuation_impact.condition_category}</strong></span>
              </div>
            </div>
          )}

          {/* Model confidence note */}
          <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1 font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span>Model Pipeline:</span>
              <span className="text-slate-800 font-semibold">{carResult.algorithm}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span>Test Benchmark R²:</span>
              <span className="text-emerald-700 font-bold">{carResult.metrics.r2} (MAE: ₹{carResult.metrics.mae?.toLocaleString()})</span>
            </div>
          </div>
        </div>

        {/* CARD 2: EV Battery Health Diagnostics (rendered ONLY for Electric vehicles with diagnostics) */}
        {showBatteryDashboard && batteryResult && (
          (() => {
            const theme = getCategoryTheme(batteryResult.condition_category);
            return (
              <div className={`p-6 sm:p-8 rounded-2xl ${theme.bg} border ${theme.border} space-y-6 shadow-xs relative overflow-hidden`}>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
                      <BatteryCharging className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        EV Traction Battery SOH
                      </h2>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border ${theme.badge}`}>
                    {batteryResult.condition_category}
                  </span>
                </div>

                {/* SOH Radial / Large Metric */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  {/* Circular visual indicator */}
                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={theme.ring}
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
                      <span className="text-[9px] text-slate-500 block font-mono font-semibold">SOH</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="text-sm font-bold text-slate-900">
                      Status: {batteryResult.condition_category}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {batteryResult.condition_description}
                    </p>
                    <div className="text-[11px] font-mono text-slate-700 flex items-center gap-1.5 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Evaluated via {batteryResult.algorithm}</span>
                    </div>
                  </div>
                </div>

                {/* Supporting Measurements Grid */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 font-mono">
                    Diagnostic Measurements Logged
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Cycles Recorded</span>
                      <span className="text-slate-900 font-bold">
                        {batteryResult.supporting_measurements.cycle_count} cycles
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Voltage Spread</span>
                      <span className="text-slate-900 font-bold">
                        {batteryResult.supporting_measurements.voltage_spread_v} V
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Peak Cell Temp</span>
                      <span className="text-slate-900 font-bold">
                        {batteryResult.supporting_measurements.peak_temperature_c} °C
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Discharge Time</span>
                      <span className="text-slate-900 font-bold">
                        {batteryResult.supporting_measurements.discharge_duration_minutes} min
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Current Draw</span>
                      <span className="text-slate-900 font-bold">
                        {batteryResult.supporting_measurements.discharge_current_a} A
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Ambient Temp</span>
                      <span className="text-slate-900 font-bold">
                        {batteryResult.supporting_measurements.ambient_temp_c} °C
                      </span>
                    </div>
                  </div>
                </div>

                {/* Concept 2: EV Skateboard Chassis Wireframe Blueprint & 16-Module Thermal Heatmap */}
                <EVSkateboardChassis
                  sohPercent={batteryResult.predicted_soh_percent}
                  cycleCount={batteryResult.supporting_measurements.cycle_count}
                  voltageSpread={batteryResult.supporting_measurements.voltage_spread_v}
                  tempPeak={batteryResult.supporting_measurements.peak_temperature_c}
                  ambientTemp={batteryResult.supporting_measurements.ambient_temp_c}
                />

                {/* Battery Health Valuation Financial Delta */}
                {carResult.battery_valuation_impact && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-800 font-bold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-slate-900" />
                        <span>Resale Valuation Financial Delta:</span>
                      </span>
                      <span className={`text-sm font-bold ${
                        carResult.battery_valuation_impact.adjustment_inr >= 0
                          ? 'text-emerald-700'
                          : carResult.battery_valuation_impact.adjustment_percent <= -20
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}>
                        {carResult.battery_valuation_impact.adjustment_inr >= 0 ? '+' : ''}
                        {formatINR(carResult.battery_valuation_impact.adjustment_inr)} ({carResult.battery_valuation_impact.adjustment_percent >= 0 ? '+' : ''}{carResult.battery_valuation_impact.adjustment_percent}%)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 pt-1.5">
                      <span>Pricing Rule Precedence:</span>
                      <span className={`font-semibold ${carResult.battery_valuation_impact.is_eol_override ? 'text-rose-900 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-900'}`}>
                        {carResult.battery_valuation_impact.rule_precedence || 'Market Baseline'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span>Replacement Risk Grade:</span>
                      <span className="font-semibold text-slate-900">{carResult.battery_valuation_impact.pack_replacement_risk}</span>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <span>
                    Validation Strategy: Zero-Leakage Cell-Holdout. Test MAE = 2.69% on unseen physical NASA battery cells.
                  </span>
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Disclaimers & Explanatory Notice */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-slate-900" />
          <span>Automotive Analytics Disclaimer & Limitations</span>
        </h3>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
          {carResult.limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
          {showBatteryDashboard && (
            <li>
              EV battery State of Health estimations are based on cell degradation kinetics from NASA Ames PCoE experiments and do not replace OEM multi-pack BMS active telemetry.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

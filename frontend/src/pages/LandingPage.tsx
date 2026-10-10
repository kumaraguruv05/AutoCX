import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BatteryCharging,
  TrendingDown,
  Gauge,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Cpu,
  BarChart3,
  Clock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 py-8 bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-800 font-mono shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
            <span>AutoCX — Auto ChronAx Intelligence Platform</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 leading-tight">
              Time Changes Cars.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-cyan-700 to-blue-700">
                AutoCX Measures Value.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
              Combining <strong className="text-slate-900">Chronos</strong> (the flow of time) and{' '}
              <strong className="text-slate-900">Axia</strong> (intrinsic worth). AutoCX estimates
              pre-owned vehicle resale prices and models electric vehicle battery health using
              rigorously trained machine learning pipelines.
            </p>
          </div>

          {/* Action CTAs with Black Buttons and Hover Animations */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/analyze"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-base shadow-lg shadow-black/15 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group"
            >
              <Gauge className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              <span>Analyze a Vehicle</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>

            <Link
              to="/insights"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-base border-2 border-black hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm hover:shadow-md group"
            >
              <BarChart3 className="w-5 h-5 text-slate-900 group-hover:scale-110 transition-transform duration-300" />
              <span>Explore Model Insights</span>
            </Link>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 max-w-4xl mx-auto border-t border-slate-200">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="text-2xl font-bold font-mono text-slate-950">8,900+</div>
              <div className="text-xs text-slate-500 mt-1">Vehicle Transactions</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="text-2xl font-bold font-mono text-emerald-600">0.9386</div>
              <div className="text-xs text-slate-500 mt-1">Resale Model R²</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="text-2xl font-bold font-mono text-sky-600">34 Cells</div>
              <div className="text-xs text-slate-500 mt-1">NASA Battery Aging</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="text-2xl font-bold font-mono text-blue-600">2.69%</div>
              <div className="text-xs text-slate-500 mt-1">Battery SOH Test MAE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Analytical Capabilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">
            Automotive Value & Battery Diagnostics
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm">
            Two distinct regression engines engineered to eliminate guesswork in pre-owned vehicle purchases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Resale Valuation */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <TrendingDown className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-950">Used Car Resale Valuation</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Predicts current fair resale value in Indian Rupees (INR) across Petrol, Diesel, CNG, LPG, Hybrid, and Electric cars based on odometer mileage, age, specifications, and ownership history.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Log-target transformation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Depreciation delta against reference price</span>
              </li>
            </ul>
          </div>

          {/* Card 2: EV Battery SOH */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <BatteryCharging className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-950">EV Battery State of Health (SOH)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Available conditionally when an Electric vehicle is selected. Leverages operational cycle dynamics, terminal voltage curves, operating temperatures, and internal resistance.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero-leakage cell-holdout test validation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Four configurable health categories</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Depreciation Analysis */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-950">ChronAx Depreciation Dynamics</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Calculates cumulative capital depreciation and residual value retention. Visualizes value decay velocity per year to identify whether a prospective car is at the steep or flat end of its depreciation curve.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Transparent delta vs purchase invoice</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Saved valuation timeline tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Engineering Integrity Pledge */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-950">Engineering Transparency & Scientific Baseline</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Unlike superficial dealership calculators that apply fixed linear depreciation multipliers (e.g. &ldquo;15% every year&rdquo;), AutoCX executes real statistical inference trained on genuine transaction histories and laboratory degradation benchmarks.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-slate-700">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">No Fabricated Metrics:</strong>
                All reported R² (0.9386 for cars, 0.9227 for batteries) and MAE figures come from true test evaluations on out-of-sample data.
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">Strict EV Boundary Protection:</strong>
                Selecting Petrol or Diesel never triggers battery estimation, and missing battery telemetry never fabricates a fake SOH percentage.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

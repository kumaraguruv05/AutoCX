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
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-mono shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AutoCX — Auto ChronAx Intelligence Platform</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Time Changes Cars.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                AutoCX Measures Value.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed">
              Combining <strong className="text-slate-200">Chronos</strong> (the flow of time) and{' '}
              <strong className="text-slate-200">Axia</strong> (intrinsic worth). AutoCX estimates
              pre-owned vehicle resale prices and models electric vehicle battery health using
              rigorously trained machine learning pipelines.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/analyze"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
            >
              <Gauge className="w-5 h-5" />
              <span>Analyze a Vehicle</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/insights"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 font-semibold text-base border border-slate-800 hover:border-slate-700 transition-all"
            >
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span>Explore Model Insights</span>
            </Link>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 max-w-4xl mx-auto border-t border-slate-900">
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/60">
              <div className="text-2xl font-bold font-mono text-cyan-400">8,900+</div>
              <div className="text-xs text-slate-400 mt-1">Vehicle Transactions</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/60">
              <div className="text-2xl font-bold font-mono text-emerald-400">0.9386</div>
              <div className="text-xs text-slate-400 mt-1">Resale Model R²</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/60">
              <div className="text-2xl font-bold font-mono text-sky-400">34 Cells</div>
              <div className="text-xs text-slate-400 mt-1">NASA Battery Aging</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/60">
              <div className="text-2xl font-bold font-mono text-blue-400">2.69%</div>
              <div className="text-xs text-slate-400 mt-1">Battery SOH Test MAE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Analytical Capabilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Automotive Value & Battery Diagnostics
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm">
            Two distinct regression engines engineered to eliminate guesswork in pre-owned vehicle purchases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Resale Valuation */}
          <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TrendingDown className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Used Car Resale Valuation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Predicts current fair resale value in Indian Rupees (INR) across Petrol, Diesel, CNG, LPG, Hybrid, and Electric cars based on odometer mileage, age, specifications, and ownership history.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800/60 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Log-target transformation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Depreciation delta against reference price</span>
              </li>
            </ul>
          </div>

          {/* Card 2: EV Battery SOH */}
          <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <BatteryCharging className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">EV Battery State of Health (SOH)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Available conditionally when an Electric vehicle is selected. Leverages operational cycle dynamics, terminal voltage curves, operating temperatures, and internal resistance.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800/60 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero-leakage cell-holdout test validation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Four configurable health categories</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Depreciation Analysis */}
          <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">ChronAx Depreciation Dynamics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Calculates cumulative capital depreciation and residual value retention. Visualizes value decay velocity per year to identify whether a prospective car is at the steep or flat end of its depreciation curve.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800/60 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Transparent delta vs purchase invoice</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Saved valuation timeline tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Engineering Integrity Pledge */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">Engineering Transparency & Scientific Baseline</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Unlike superficial dealership calculators that apply fixed linear depreciation multipliers (e.g. &ldquo;15% every year&rdquo;), AutoCX executes real statistical inference trained on genuine transaction histories and laboratory degradation benchmarks.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">No Fabricated Metrics:</strong>
                All reported R² (0.9386 for cars, 0.9227 for batteries) and MAE figures come from true test evaluations on out-of-sample data.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
              <Cpu className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Strict EV Boundary Protection:</strong>
                Selecting Petrol or Diesel never triggers battery estimation, and missing battery telemetry never fabricates a fake SOH percentage.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

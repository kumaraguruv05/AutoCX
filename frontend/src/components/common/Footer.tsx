import React from 'react';
import { Gauge, ShieldCheck, Cpu, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand section */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-slate-950 font-bold" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">AutoCX</span>
              <span className="text-xs text-slate-400 font-mono">Auto ChronAx</span>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              &ldquo;Time Changes Cars. AutoCX Measures Value.&rdquo;
              Rooted in <span className="text-cyan-400 font-medium">Chronos</span> (Time) and{' '}
              <span className="text-cyan-400 font-medium">Axia</span> (Value), AutoCX delivers
              rigorous machine learning insights for used vehicle resale values and electric vehicle battery health.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-cyan-400" /> 8,900+ Vehicle Records
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-blue-400" /> 34 NASA Battery Cells
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Leakage-Free Validation
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/analyze" className="hover:text-cyan-400 transition-colors">
                  Vehicle Valuation & SOH
                </Link>
              </li>
              <li>
                <Link to="/insights" className="hover:text-cyan-400 transition-colors">
                  Model Architecture & Metrics
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-cyan-400 transition-colors">
                  Saved Valuations History
                </Link>
              </li>
            </ul>
          </div>

          {/* Diagnostics notice */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">Disclaimer</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              AutoCX predictions are statistical regression estimations derived from historical marketplace transactions and laboratory cell cycling. They do not constitute OEM mechanical warranty guarantees or physical battery pack certifications.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AutoCX — Auto ChronAx Platform. Built with Google Antigravity.</p>
          <p className="font-mono text-[11px] text-slate-600">Dual ML: Ridge Regressor (R²=0.9386) & XGBoost (R²=0.9227)</p>
        </div>
      </div>
    </footer>
  );
};

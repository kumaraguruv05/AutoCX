import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gauge, Activity, History, Layers } from 'lucide-react';
import { apiClient } from '@/services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .getHealth()
      .then((res) => {
        if (isMounted) setApiHealthy(res.status === 'healthy');
      })
      .catch(() => {
        if (isMounted) setApiHealthy(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const navLinks = [
    { to: '/analyze', label: 'Valuation & SOH', icon: Gauge },
    { to: '/insights', label: 'Model Insights', icon: Layers },
    { to: '/history', label: 'Saved Analyses', icon: History },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Wordmark */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <Gauge className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                AutoCX
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-slate-800 text-cyan-300 border border-slate-700">
                Auto ChronAx
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
              Time Changes Cars. AutoCX Measures Value.
            </p>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Backend health status badge */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800">
          <Activity
            className={`w-3.5 h-3.5 ${
              apiHealthy === true
                ? 'text-emerald-400 animate-pulse'
                : apiHealthy === false
                ? 'text-rose-400'
                : 'text-amber-400 animate-spin'
            }`}
          />
          <span>API:</span>
          <span
            className={
              apiHealthy === true
                ? 'text-emerald-400 font-semibold'
                : apiHealthy === false
                ? 'text-rose-400 font-semibold'
                : 'text-amber-400'
            }
          >
            {apiHealthy === true ? 'ONLINE' : apiHealthy === false ? 'OFFLINE' : 'CHECKING'}
          </span>
        </div>
      </div>
    </header>
  );
};

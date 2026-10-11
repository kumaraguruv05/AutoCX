import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  History,
  Trash2,
  ExternalLink,
  Gauge,
  Car,
  Zap,
  Flame,
  Fuel,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { storageService } from '@/services/storage';
import { SavedAnalysis } from '@/types/api';
import { formatINR, formatIndianDenomination } from '@/utils/formatters';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<SavedAnalysis[]>([]);

  useEffect(() => {
    setHistory(storageService.getHistory());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.deleteAnalysis(id);
    setHistory(storageService.getHistory());
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all saved analyses in the garage ledger?')) {
      storageService.clearHistory();
      setHistory([]);
    }
  };

  const handleOpen = (item: SavedAnalysis) => {
    navigate('/results', {
      state: {
        analysisId: item.id,
        carInput: item.carInput,
        carResult: item.carResult,
        batteryInput: item.batteryInput,
        batteryResult: item.batteryResult,
      },
    });
  };

  // Fleet summary computations
  const totalPortfolioValuation = history.reduce(
    (acc, item) => acc + (item.carResult.estimated_resale_price || 0),
    0
  );
  const evCount = history.filter((item) => item.carInput.fuel === 'Electric').length;
  const iceCount = history.length - evCount;

  const getPowertrainBadge = (fuel: string) => {
    switch (fuel) {
      case 'Electric':
        return {
          icon: Zap,
          label: 'ZERO EMISSION BEV',
          badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-600/70',
          accentBorder: 'border-l-4 border-l-emerald-500',
        };
      case 'Diesel':
        return {
          icon: Fuel,
          label: 'TURBO DIESEL',
          badgeClass: 'bg-amber-950 text-amber-300 border-amber-600/70',
          accentBorder: 'border-l-4 border-l-amber-500',
        };
      case 'Hybrid':
        return {
          icon: Layers,
          label: 'DUAL HYBRID HEV',
          badgeClass: 'bg-cyan-950 text-cyan-300 border-cyan-600/70',
          accentBorder: 'border-l-4 border-l-cyan-500',
        };
      case 'Petrol':
      default:
        return {
          icon: Flame,
          label: 'HIGH-REV PETROL',
          badgeClass: 'bg-rose-950 text-rose-300 border-rose-600/70',
          accentBorder: 'border-l-4 border-l-rose-500',
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-800 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs font-semibold">
            <History className="w-3.5 h-3.5 text-slate-950" />
            <span>Official Pit Garage Logbook</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
            Saved Vehicle Valuations & Service Dossiers
          </h1>
          <p className="text-slate-600 text-sm">
            Review past vehicle resale evaluations, depreciation records, and EV battery health telemetry saved locally.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 hover:border-rose-300 text-xs font-mono transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Garage Ledger</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Your Garage Is Currently Empty</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            You haven&apos;t run any vehicle valuations yet. Use our 1-click presets or enter your vehicle specifications to begin.
          </p>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs font-mono transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-black/20 hover:shadow-2xl group cursor-pointer"
          >
            <Gauge className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
            <span>Launch New Valuation Pipeline</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Garage Fleet Telemetry Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1 font-mono">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                Garage Dossiers Stored
              </span>
              <div className="text-2xl font-black text-slate-900">
                {history.length} <span className="text-xs font-normal text-slate-500">Vehicles</span>
              </div>
              <div className="text-[11px] text-slate-600 pt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Local Session Encrypted</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1 font-mono">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                Portfolio Valuation Sum
              </span>
              <div className="text-2xl font-black text-slate-900">
                {formatINR(totalPortfolioValuation)}
              </div>
              <div className="text-[11px] text-slate-600 pt-1">
                {formatIndianDenomination(totalPortfolioValuation)}
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1 font-mono">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                Powertrain Fleet Mix
              </span>
              <div className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="text-emerald-700">{evCount} EV</span>
                <span className="text-slate-400 font-light">/</span>
                <span className="text-slate-900">{iceCount} ICE</span>
              </div>
              <div className="text-[11px] text-slate-600 pt-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-700" />
                <span>Chronax Dual Regressor</span>
              </div>
            </div>
          </div>

          {/* Stamped Service Logbook Dossier Cards */}
          <div className="space-y-4">
            {history.map((item) => {
              const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const isEV = item.carInput.fuel === 'Electric';
              const hasBattery = item.batteryResult !== null && item.batteryResult !== undefined;
              const ptInfo = getPowertrainBadge(item.carInput.fuel);
              const PtIcon = ptInfo.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpen(item)}
                  className={`relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-black/50 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between p-5 sm:p-6 gap-6 ${ptInfo.accentBorder}`}
                >
                  {/* Left Column: Vehicle Dossier & Badges */}
                  <div className="space-y-3">
                    {/* Header line with stamped record number & fuel tag */}
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border font-bold tracking-wider text-[10px] uppercase ${ptInfo.badgeClass}`}>
                        <PtIcon className="w-3 h-3" />
                        <span>{ptInfo.label}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-300 text-[11px]">
                        {item.carInput.year} MODEL
                      </span>

                      <span className="text-slate-400">•</span>

                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{dateStr}</span>
                      </span>

                      <span className="text-slate-400">•</span>

                      <span className="text-slate-500 text-[10px]">
                        DOSSIER #{item.id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    {/* Big Vehicle Title */}
                    <div>
                      <h3 className="text-xl font-black text-slate-950 group-hover:text-black tracking-tight flex items-center gap-2">
                        <span>{item.carInput.brand} {item.carInput.model}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-black group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                      </h3>

                      {/* Monocoque Spec Tags */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-600 mt-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                          ODOMETER: {item.carInput.km_driven.toLocaleString()} KM
                        </span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                          {item.carInput.transmission}
                        </span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                          {item.carInput.owner}
                        </span>
                        {item.carInput.original_price && Number(item.carInput.original_price) > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">
                              Original MSRP: {formatINR(Number(item.carInput.original_price))}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Stamped Black Box Valuation & SOH */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 lg:gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-200">
                    {/* Valuation Stamped Box */}
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono shadow-md min-w-[170px]">
                      <span className="text-[10px] text-neutral-400 block font-bold tracking-wider uppercase">
                        PREDICTED RESALE WORTH
                      </span>
                      <div className="text-xl font-black text-cyan-400 tracking-tight mt-0.5">
                        {formatINR(item.carResult.estimated_resale_price)}
                      </div>
                      <span className="text-[11px] text-neutral-300 block font-medium">
                        {formatIndianDenomination(item.carResult.estimated_resale_price)}
                      </span>
                    </div>

                    {/* EV Battery SOH Chip if present */}
                    {isEV && hasBattery && item.batteryResult && (
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-neutral-700 text-white font-mono shadow-md min-w-[150px]">
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                          <Zap className="w-3 h-3" />
                          <span>BATTERY SOH</span>
                        </div>
                        <div className="text-xl font-black text-emerald-400 mt-0.5">
                          {item.batteryResult.predicted_soh_percent.toFixed(1)}%
                        </div>
                        <span className="text-[10px] text-neutral-300 block uppercase font-semibold">
                          {item.batteryResult.condition_category}
                        </span>
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 pl-2">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Delete vehicle record"
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer border border-slate-200 hover:border-rose-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="p-2.5 rounded-xl bg-neutral-900 text-white group-hover:bg-cyan-500 group-hover:text-black transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

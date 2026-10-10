import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  History,
  Trash2,
  ExternalLink,
  Car,
  BatteryCharging,
  TrendingDown,
  Gauge,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { storageService } from '@/services/storage';
import { SavedAnalysis } from '@/types/api';
import { formatINR, formatIndianDenomination, formatPercent } from '@/utils/formatters';

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
    if (window.confirm('Are you sure you want to clear all saved analyses?')) {
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-800/40">
            <History className="w-3.5 h-3.5" />
            <span>Local Analysis Ledger</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Saved Vehicle Valuations</h1>
          <p className="text-slate-400 text-sm">
            Review past vehicle resale evaluations and EV battery diagnostic records saved on this machine.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/60 text-xs font-mono transition-all self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Ledger</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
          <History className="w-12 h-12 text-slate-700 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Saved Analyses Found</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            You haven&apos;t run any vehicle valuations yet. Fill out the vehicle specifications form to begin.
          </p>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all"
          >
            <Gauge className="w-4 h-4" />
            <span>Launch New Valuation</span>
          </Link>
        </div>
      ) : (
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

            return (
              <div
                key={item.id}
                onClick={() => handleOpen(item)}
                className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Vehicle Details */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                      {item.carInput.fuel}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{item.carInput.year}</span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs font-mono text-slate-500">{dateStr}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {item.carInput.brand} {item.carInput.model}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>{item.carInput.km_driven.toLocaleString()} km</span>
                    <span>•</span>
                    <span>{item.carInput.transmission}</span>
                    <span>•</span>
                    <span>{item.carInput.owner}</span>
                  </div>
                </div>

                {/* Valuations & SOH metrics */}
                <div className="flex items-center gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-500 font-mono block">Resale Value</span>
                    <span className="text-lg font-bold font-mono text-white">
                      {formatINR(item.carResult.estimated_resale_price)}
                    </span>
                    <span className="text-[11px] text-cyan-400 block font-mono">
                      {formatIndianDenomination(item.carResult.estimated_resale_price)}
                    </span>
                  </div>

                  {/* EV Battery SOH badge if available */}
                  {isEV && hasBattery && item.batteryResult && (
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-left md:text-right">
                      <span className="text-[10px] text-slate-500 font-mono block">Battery SOH</span>
                      <span className="text-sm font-bold font-mono text-emerald-400 block">
                        {item.batteryResult.predicted_soh_percent.toFixed(1)}%
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.batteryResult.condition_category}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pl-2">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete record"
                      className="p-2 rounded-lg hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-2 rounded-lg text-slate-600 group-hover:text-cyan-400 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

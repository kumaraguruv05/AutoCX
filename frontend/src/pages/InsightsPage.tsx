import React, { useEffect, useState } from 'react';
import {
  Layers,
  AlertTriangle,
  Table
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { ModelsInfoResponse } from '@/types/api';

export const InsightsPage: React.FC = () => {
  const [modelsInfo, setModelsInfo] = useState<ModelsInfoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getModelsInfo()
      .then((data) => {
        setModelsInfo(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load models info:', err);
        setError(err.message || 'Could not fetch model metadata.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm font-mono">Loading model evaluation records...</p>
      </div>
    );
  }

  const carModel = modelsInfo?.car_resale_model;
  const batteryModel = modelsInfo?.battery_soh_model;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-300 font-semibold">
          <Layers className="w-3.5 h-3.5" />
          <span>Machine Learning Transparency & Benchmarks</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Model Insights & Empirical Evaluations
        </h1>
        <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
          AutoCX evaluates multiple candidate machine learning architectures against holdout benchmarks. Below are the verified metrics, validation strategies, and dataset schemas driving the platform.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Model 1: Car Resale Value Module */}
      {carModel && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">Module A</span>
              <h2 className="text-xl font-bold text-slate-900">{carModel.model_name}</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Selected Algorithm:{' '}
                <strong className="text-slate-900 font-mono">{carModel.algorithm}</strong> (Version {carModel.version})
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto font-semibold">
              ✓ Active in Production
            </span>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block font-sans">R² Score (Holdout)</span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                {carModel.metrics.r2}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">High variance explained</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block font-sans">Test MAE</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                ₹{carModel.metrics.mae?.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Mean Absolute Error</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block font-sans">Training Records</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {carModel.training_samples.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Out of 8,900 unified</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block font-sans">Test Samples</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {carModel.test_samples.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">20% Holdout split</span>
            </div>
          </div>

          {/* Candidate comparison table */}
          {carModel.all_candidate_metrics && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700 font-mono">
                <Table className="w-3.5 h-3.5 text-slate-900" />
                <span>Candidate Algorithm Comparison (Test Set)</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Candidate Model</th>
                      <th className="p-3">Test MAE (₹)</th>
                      <th className="p-3">Test RMSE (₹)</th>
                      <th className="p-3">Test R² Score</th>
                      <th className="p-3">Selected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {Object.entries(carModel.all_candidate_metrics).map(([algName, met]) => {
                      const isSelected = algName === carModel.algorithm || (algName === 'LinearRegression' && carModel.algorithm.includes('Linear'));
                      return (
                        <tr key={algName} className={isSelected ? 'bg-slate-50/80 font-semibold' : ''}>
                          <td className="p-3 text-slate-900 font-bold">{algName}</td>
                          <td className="p-3 text-slate-900">₹{met.mae.toLocaleString()}</td>
                          <td className="p-3 text-slate-600">₹{met.rmse.toLocaleString()}</td>
                          <td className="p-3 text-emerald-700 font-bold">{met.r2}</td>
                          <td className="p-3">
                            {isSelected ? (
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-black text-white font-semibold">
                                Best Model
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Validation & Limitations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-slate-900 font-bold block font-sans">Validation Strategy</span>
              <p className="text-slate-600 leading-relaxed font-sans text-xs">
                {carModel.validation_strategy}. Preprocessing uses robust numerical scaling and categorical one-hot encoding across vehicle brand, model series, fuel, transmission, and ownership tiers.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-slate-900 font-bold block font-sans">Dataset Provenance</span>
              <p className="text-slate-600 leading-relaxed font-sans text-xs">
                Source: {carModel.training_dataset}. Synthesizes multi-source used car listings spanning Indian major automotive hubs (Delhi, Mumbai, Bengaluru, Pune, etc.).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Model 2: EV Battery State of Health Module */}
      {batteryModel && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">Module B</span>
              <h2 className="text-xl font-bold text-slate-900">{batteryModel.model_name}</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Selected Algorithm:{' '}
                <strong className="text-slate-900 font-mono">{batteryModel.algorithm}</strong> (Version {batteryModel.version})
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto font-semibold">
              ✓ Active in Production
            </span>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block font-sans">R² on Unseen Cells</span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                {batteryModel.metrics.r2}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Zero-leakage cell holdout</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block font-sans">Holdout MAE</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {batteryModel.metrics.mae}%
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Absolute SOH Error</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block font-sans">Training Cycles</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {batteryModel.training_samples.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Across 28 training cells</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block font-sans">Unseen Test Cycles</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {batteryModel.test_samples.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Across 6 test cells</span>
            </div>
          </div>

          {/* Candidate comparison table */}
          {batteryModel.all_candidate_metrics && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700 font-mono">
                <Table className="w-3.5 h-3.5 text-slate-900" />
                <span>Candidate Algorithm Comparison (Unseen Battery Cells)</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Candidate Model</th>
                      <th className="p-3">Unseen Test MAE</th>
                      <th className="p-3">Unseen Test RMSE</th>
                      <th className="p-3">Test R² Score</th>
                      <th className="p-3">Selected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {Object.entries(batteryModel.all_candidate_metrics).map(([algName, met]) => {
                      const isSelected = algName === batteryModel.algorithm;
                      return (
                        <tr key={algName} className={isSelected ? 'bg-slate-50/80 font-semibold' : ''}>
                          <td className="p-3 text-slate-900 font-bold">{algName}</td>
                          <td className="p-3 text-slate-900">{met.mae}%</td>
                          <td className="p-3 text-slate-600">{met.rmse}%</td>
                          <td className="p-3 text-emerald-700 font-bold">{met.r2}</td>
                          <td className="p-3">
                            {isSelected ? (
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-black text-white font-semibold">
                                Best Model
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Zero Leakage Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-slate-900 font-bold block font-sans">Zero-Leakage Cell-Holdout Validation</span>
              <p className="text-slate-600 leading-relaxed font-sans text-xs">
                Cycles from the same battery cell are heavily auto-correlated. Random row-splitting creates severe data leakage. AutoCX held out 6 complete physical battery cells (B0029, B0038, B0042, B0047, B0049, B0050) completely from training to verify real out-of-sample generalization.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-slate-900 font-bold block font-sans">Dataset Provenance</span>
              <p className="text-slate-600 leading-relaxed font-sans text-xs">
                Source: {batteryModel.training_dataset}. Commercial 18650 Li-ion cells subjected to accelerated thermal and operational aging cycles under electrochemical impedance spectroscopy.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

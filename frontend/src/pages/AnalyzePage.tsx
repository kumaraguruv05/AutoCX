import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Car,
  BatteryCharging,
  Info,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Sliders,
  DollarSign,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { storageService } from '@/services/storage';
import {
  CarPredictionRequest,
  BatteryPredictionRequest,
  CarPredictionResponse,
  BatteryPredictionResponse
} from '@/types/api';

// Intelligent presets for EV diagnostic testing
const EV_PRESETS = [
  {
    name: 'Optimal / Near-New Battery (~25 cycles)',
    data: {
      cycle: 25,
      ambient_temperature_c: 24.0,
      voltage_max_v: 4.20,
      voltage_min_v: 2.70,
      voltage_mean_v: 3.52,
      voltage_std_v: 0.36,
      current_mean_a: 2.0,
      temp_max_c: 32.5,
      temp_mean_c: 28.0,
      discharge_duration_sec: 3450.0,
      internal_resistance_ohm: 0.055,
    },
  },
  {
    name: 'Normal Fleet Degradation (~85 cycles)',
    data: {
      cycle: 85,
      ambient_temperature_c: 24.0,
      voltage_max_v: 4.18,
      voltage_min_v: 2.50,
      voltage_mean_v: 3.42,
      voltage_std_v: 0.38,
      current_mean_a: 2.0,
      temp_max_c: 36.8,
      temp_mean_c: 31.5,
      discharge_duration_sec: 3100.0,
      internal_resistance_ohm: 0.082,
    },
  },
  {
    name: 'Aged / Severe Wear Pack (~150 cycles)',
    data: {
      cycle: 150,
      ambient_temperature_c: 24.0,
      voltage_max_v: 4.16,
      voltage_min_v: 2.30,
      voltage_mean_v: 3.31,
      voltage_std_v: 0.42,
      current_mean_a: 2.0,
      temp_max_c: 41.2,
      temp_mean_c: 35.8,
      discharge_duration_sec: 2650.0,
      internal_resistance_ohm: 0.125,
    },
  },
];

const DEFAULT_BRANDS = [
  'Maruti', 'Hyundai', 'Mahindra', 'Tata', 'Honda', 'Toyota', 'Ford',
  'Renault', 'Volkswagen', 'Chevrolet', 'Nissan', 'Skoda', 'BMW', 'Mercedes-Benz', 'MG', 'Audi'
];

export const AnalyzePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve incoming edit state if returning from Results page
  const stateData = location.state as {
    editAnalysis?: {
      carInput: CarPredictionRequest;
      batteryInput?: BatteryPredictionRequest | null;
    };
  } | undefined;
  const initialCar = stateData?.editAnalysis?.carInput;
  const initialBattery = stateData?.editAnalysis?.batteryInput;

  // Schema state
  const [brands, setBrands] = useState<string[]>(DEFAULT_BRANDS);
  const [brandModelsMap, setBrandModelsMap] = useState<Record<string, string[]>>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Car form fields
  const [brand, setBrand] = useState<string>(initialCar?.brand || 'Maruti');
  const [model, setModel] = useState<string>(initialCar?.model || 'Swift Dzire');
  const [year, setYear] = useState<number>(initialCar?.year || 2018);
  const [kmDriven, setKmDriven] = useState<number>(initialCar?.km_driven || 45000);
  const [fuel, setFuel] = useState<string>(initialCar?.fuel || 'Petrol');
  const [transmission, setTransmission] = useState<string>(initialCar?.transmission || 'Manual');
  const [sellerType, setSellerType] = useState<string>(initialCar?.seller_type || 'Individual');
  const [owner, setOwner] = useState<string>(initialCar?.owner || 'First Owner');
  const [seats, setSeats] = useState<number>(initialCar?.seats || 5);

  // Optional technical specifications
  const [showAdvancedSpecs, setShowAdvancedSpecs] = useState<boolean>(false);
  const [engineCc, setEngineCc] = useState<string>(
    initialCar?.engine_cc !== undefined && initialCar?.engine_cc !== null
      ? String(initialCar.engine_cc)
      : '1197'
  );
  const [maxPowerBhp, setMaxPowerBhp] = useState<string>(
    initialCar?.max_power_bhp !== undefined && initialCar?.max_power_bhp !== null
      ? String(initialCar.max_power_bhp)
      : '82'
  );
  const [mileageKmpl, setMileageKmpl] = useState<string>(
    initialCar?.mileage_kmpl !== undefined && initialCar?.mileage_kmpl !== null
      ? String(initialCar.mileage_kmpl)
      : '21.5'
  );
  // Original purchase price is strictly optional and starts blank unless user previously provided it
  const [originalPrice, setOriginalPrice] = useState<string>(
    initialCar?.original_price !== undefined && initialCar?.original_price !== null
      ? String(initialCar.original_price)
      : ''
  );

  // EV Battery form fields
  const [includeBatteryDiagnostic, setIncludeBatteryDiagnostic] = useState<boolean>(
    initialBattery ? true : initialCar ? initialCar.fuel === 'Electric' : true
  );
  const [cycle, setCycle] = useState<number>(initialBattery?.cycle || 65);
  const [ambientTemp, setAmbientTemp] = useState<number>(initialBattery?.ambient_temperature_c || 24.0);
  const [voltageMax, setVoltageMax] = useState<number>(initialBattery?.voltage_max_v || 4.19);
  const [voltageMin, setVoltageMin] = useState<number>(initialBattery?.voltage_min_v || 2.50);
  const [voltageMean, setVoltageMean] = useState<number>(initialBattery?.voltage_mean_v || 3.45);
  const [voltageStd, setVoltageStd] = useState<number>(initialBattery?.voltage_std_v || 0.38);
  const [currentMean, setCurrentMean] = useState<number>(initialBattery?.current_mean_a || 2.0);
  const [tempMax, setTempMax] = useState<number>(initialBattery?.temp_max_c || 36.0);
  const [tempMean, setTempMean] = useState<number>(initialBattery?.temp_mean_c || 30.5);
  const [dischargeSec, setDischargeSec] = useState<number>(initialBattery?.discharge_duration_sec || 3150.0);
  const [internalResistance, setInternalResistance] = useState<number>(initialBattery?.internal_resistance_ohm || 0.078);

  // Submission / Loading / Error state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load schema from backend
  useEffect(() => {
    apiClient
      .getCarSchema()
      .then((schema) => {
        if (schema && schema.brands && schema.brands.length > 0) {
          setBrands(schema.brands);
          if (schema.brand_models_map) {
            setBrandModelsMap(schema.brand_models_map);
            const models = schema.brand_models_map[brand] || [];
            setAvailableModels(models);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic car schema, using defaults:', err);
      });
  }, []);

  // Update models list when brand changes
  useEffect(() => {
    if (brandModelsMap[brand] && brandModelsMap[brand].length > 0) {
      const models = brandModelsMap[brand];
      setAvailableModels(models);
      if (!models.includes(model)) {
        setModel(models[0]);
      }
    } else {
      setAvailableModels([]);
    }
  }, [brand, brandModelsMap]);

  // Handle Fuel change side-effects (CONDITIONAL EV BEHAVIOR)
  const handleFuelChange = (newFuel: string) => {
    setFuel(newFuel);
    setError(null);
    if (newFuel === 'Electric') {
      setIncludeBatteryDiagnostic(true);
      setEngineCc('0'); // Pure EV has 0cc combustion displacement
    } else if (newFuel !== 'Electric') {
      // Clear battery diagnostic intent for non-EV
      setIncludeBatteryDiagnostic(false);
      if (engineCc === '0') setEngineCc('1197');
    }
  };

  const applyEvPreset = (presetData: any) => {
    setCycle(presetData.cycle);
    setAmbientTemp(presetData.ambient_temperature_c);
    setVoltageMax(presetData.voltage_max_v);
    setVoltageMin(presetData.voltage_min_v);
    setVoltageMean(presetData.voltage_mean_v);
    setVoltageStd(presetData.voltage_std_v);
    setCurrentMean(presetData.current_mean_a);
    setTempMax(presetData.temp_max_c);
    setTempMean(presetData.temp_mean_c);
    setDischargeSec(presetData.discharge_duration_sec);
    setInternalResistance(presetData.internal_resistance_ohm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Prepare Car Resale Payload
      const carPayload: CarPredictionRequest = {
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year),
        km_driven: Number(kmDriven),
        fuel: fuel.trim(),
        seller_type: sellerType,
        transmission: transmission,
        owner: owner,
        seats: Number(seats),
        mileage_kmpl: mileageKmpl ? parseFloat(mileageKmpl) : null,
        engine_cc: fuel === 'Electric' ? 0 : engineCc ? parseFloat(engineCc) : null,
        max_power_bhp: maxPowerBhp ? parseFloat(maxPowerBhp) : null,
        original_price: originalPrice ? parseFloat(originalPrice) : null,
      };

      // Execute Car Resale Prediction
      const carResult: CarPredictionResponse = await apiClient.predictCarValue(carPayload);

      // 2. Conditionally execute Battery Health prediction ONLY for Electric vehicles
      let batteryResult: BatteryPredictionResponse | null = null;
      let batteryPayload: BatteryPredictionRequest | null = null;

      if (fuel === 'Electric' && includeBatteryDiagnostic) {
        batteryPayload = {
          cycle: Number(cycle),
          ambient_temperature_c: Number(ambientTemp),
          voltage_max_v: Number(voltageMax),
          voltage_min_v: Number(voltageMin),
          voltage_mean_v: Number(voltageMean),
          voltage_std_v: Number(voltageStd),
          current_mean_a: Number(currentMean),
          temp_max_c: Number(tempMax),
          temp_mean_c: Number(tempMean),
          discharge_duration_sec: Number(dischargeSec),
          internal_resistance_ohm: Number(internalResistance),
        };

        batteryResult = await apiClient.predictBatteryHealth(batteryPayload);
      }

      // Save to localStorage history
      const saved = storageService.saveAnalysis({
        carInput: carPayload,
        carResult,
        batteryInput: batteryPayload,
        batteryResult,
      });

      // Navigate to results page with analysis in state
      navigate('/results', {
        state: {
          analysisId: saved.id,
          carInput: carPayload,
          carResult,
          batteryInput: batteryPayload,
          batteryResult,
        },
      });
    } catch (err: any) {
      console.error('Prediction failed:', err);
      setError(err.message || 'An unexpected error occurred while predicting vehicle value.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-800/40">
          <Car className="w-3.5 h-3.5" />
          <span>Vehicle Valuation & Diagnostics</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Vehicle Valuation & Battery Health Analysis
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Provide your vehicle details to compute market resale worth and depreciation. If analyzing a fully electric vehicle, battery State of Health (SOH) diagnostic inputs will activate below.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Evaluation Error:</strong>
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-8">
        {/* SECTION 1: General Vehicle Information */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold">
                1
              </div>
              <h2 className="text-lg font-bold text-white">Vehicle Specifications</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">Required inputs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Brand */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Brand / Manufacturer
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Model Series
              </label>
              {availableModels.length > 0 ? (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Swift, Creta, Nexon EV"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                />
              )}
            </div>

            {/* Manufacturing Year */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Manufacturing Year
              </label>
              <input
                type="number"
                min="1990"
                max={new Date().getFullYear()}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                required
              />
              <p className="text-[11px] text-slate-500 font-mono">
                Computed Vehicle Age: {Math.max(0, 2024 - year)} years
              </p>
            </div>

            {/* Kilometers Driven */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Kilometres Driven (Odometer)
              </label>
              <input
                type="number"
                min="0"
                max="1000000"
                step="500"
                value={kmDriven}
                onChange={(e) => setKmDriven(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                required
              />
              <p className="text-[11px] text-slate-500 font-mono">
                {kmDriven.toLocaleString()} km
              </p>
            </div>

            {/* Fuel Type */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Fuel Type</span>
                {fuel === 'Electric' && (
                  <span className="text-[10px] text-cyan-400 font-mono font-medium animate-pulse">
                    ⚡ EV Mode Active
                  </span>
                )}
              </label>
              <select
                value={fuel}
                onChange={(e) => handleFuelChange(e.target.value)}
                className={`w-full bg-slate-950 border rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none transition-all ${
                  fuel === 'Electric'
                    ? 'border-cyan-500 ring-1 ring-cyan-500'
                    : 'border-slate-700 focus:border-cyan-500'
                }`}
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="LPG">LPG</option>
                <option value="Electric">Electric (BEV)</option>
                <option value="Hybrid">Hybrid (HEV)</option>
              </select>
            </div>

            {/* Transmission */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Transmission
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              >
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
            </div>

            {/* Ownership */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Ownership History
              </label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              >
                <option value="First Owner">First Owner</option>
                <option value="Second Owner">Second Owner</option>
                <option value="Third Owner">Third Owner</option>
                <option value="Fourth & Above Owner">Fourth & Above Owner</option>
              </select>
            </div>

            {/* Seller Type */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Seller Type
              </label>
              <select
                value={sellerType}
                onChange={(e) => setSellerType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              >
                <option value="Individual">Individual</option>
                <option value="Dealer">Dealer</option>
                <option value="Trustmark Dealer">Trustmark Dealer</option>
              </select>
            </div>
          </div>

          {/* Reference Price */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                <span>Original Invoice / Reference Price (INR ₹)</span>
                <span className="text-slate-500 font-normal lowercase">(optional)</span>
              </label>
              {originalPrice && (
                <button
                  type="button"
                  onClick={() => setOriginalPrice('')}
                  className="text-[11px] text-slate-400 hover:text-rose-400 font-mono transition-colors"
                >
                  Clear Price
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono text-sm">₹</span>
              <input
                type="number"
                id="originalPrice"
                name="originalPrice"
                autoComplete="off"
                min="0"
                step="10000"
                placeholder="e.g. 850000 (leave blank to predict resale value only)"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400/90 leading-relaxed">
              <strong className="text-slate-300">Why provide this?</strong> When an original purchase price is supplied, AutoCX computes the exact rupee depreciation amount and cumulative value retention percentage. If left blank, AutoCX will estimate the fair market resale value without depreciation.
            </p>
          </div>

          {/* Optional Advanced Technical Specs toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvancedSpecs(!showAdvancedSpecs)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvancedSpecs ? 'Hide' : 'Customize'} Technical Specifications (Engine, Power, Mileage, Seats)</span>
            </button>

            {showAdvancedSpecs && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800/60">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-mono">
                    {fuel === 'Electric' ? 'Displacement (EV)' : 'Engine (CC)'}
                  </label>
                  <input
                    type="number"
                    disabled={fuel === 'Electric'}
                    value={fuel === 'Electric' ? '0' : engineCc}
                    onChange={(e) => setEngineCc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-mono">Max Power (bhp)</label>
                  <input
                    type="number"
                    value={maxPowerBhp}
                    onChange={(e) => setMaxPowerBhp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-mono">Mileage (kmpl)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mileageKmpl}
                    onChange={(e) => setMileageKmpl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-mono">Seats</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: CONDITIONAL EV BATTERY HEALTH SECTION */}
        {fuel === 'Electric' ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-500/40 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cyan-800/40 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 font-bold flex items-center justify-center">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <BatteryCharging className="w-5 h-5 text-cyan-400" />
                      EV Battery Diagnostic Telemetry
                    </h2>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      EV-Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Trained on NASA Ames Li-ion experimental cell aging degradation profiles
                  </p>
                </div>
              </div>

              {/* Opt-out toggle */}
              <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer self-start sm:self-auto bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={includeBatteryDiagnostic}
                  onChange={(e) => setIncludeBatteryDiagnostic(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-cyan-400"
                />
                <span>Enable SOH Diagnostic</span>
              </label>
            </div>

            {includeBatteryDiagnostic ? (
              <div className="space-y-6">
                {/* Preset bar */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Quick Diagnostic Benchmark Presets
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">1-click test fill</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {EV_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyEvPreset(preset.data)}
                        className="text-left px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-xs text-slate-300 hover:text-white transition-all font-mono"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Battery Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Cycles */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>Cycle Count</span>
                      <span className="text-[10px] text-slate-500 font-mono">cycles</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={cycle}
                      onChange={(e) => setCycle(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:border-cyan-500"
                      required
                    />
                  </div>

                  {/* Ambient Temperature */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>Ambient Temp</span>
                      <span className="text-[10px] text-slate-500 font-mono">°C</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={ambientTemp}
                      onChange={(e) => setAmbientTemp(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:border-cyan-500"
                      required
                    />
                  </div>

                  {/* Peak Voltage */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>Peak Initial Voltage</span>
                      <span className="text-[10px] text-slate-500 font-mono">V</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="3.0"
                      max="4.5"
                      value={voltageMax}
                      onChange={(e) => setVoltageMax(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:border-cyan-500"
                      required
                    />
                  </div>

                  {/* Cutoff Voltage */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>Cutoff Voltage</span>
                      <span className="text-[10px] text-slate-500 font-mono">V</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.8"
                      max="3.2"
                      value={voltageMin}
                      onChange={(e) => setVoltageMin(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:border-cyan-500"
                      required
                    />
                  </div>

                  {/* Mean Voltage */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>Mean Discharge Voltage</span>
                      <span className="text-[10px] text-slate-500 font-mono">V</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="2.5"
                      max="4.0"
                      value={voltageMean}
                      onChange={(e) => setVoltageMean(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:border-cyan-500"
                      required
                    />
                  </div>

                  {/* Discharge Current */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>Mean Discharge Current</span>
                      <span className="text-[10px] text-slate-500 font-mono">A</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="10.0"
                      value={currentMean}
                      onChange={(e) => setCurrentMean(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:border-cyan-500"
                      required
                    />
                  </div>

                  {/* Max Temperature */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>Peak Operating Temp</span>
                      <span className="text-[10px] text-slate-500 font-mono">°C</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={tempMax}
                      onChange={(e) => setTempMax(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:border-cyan-500"
                      required
                    />
                  </div>

                  {/* Discharge Duration */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>Discharge Duration</span>
                      <span className="text-[10px] text-slate-500 font-mono">seconds</span>
                    </label>
                    <input
                      type="number"
                      min="500"
                      max="10000"
                      value={dischargeSec}
                      onChange={(e) => setDischargeSec(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:border-cyan-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono">
                      ~{(dischargeSec / 60).toFixed(1)} minutes
                    </span>
                  </div>

                  {/* Internal Resistance */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>Internal Resistance</span>
                      <span className="text-[10px] text-slate-500 font-mono">Ohms (Ω)</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.01"
                      max="0.5"
                      value={internalResistance}
                      onChange={(e) => setInternalResistance(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-cyan-900/40 text-xs text-slate-400 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    AutoCX estimates battery SOH based on cycle kinetics and terminal resistance. If diagnostic sensor logs are unavailable, uncheck the box above to evaluate vehicle resale value independently.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Battery SOH diagnostic is toggled off. You will receive an EV market resale valuation based on vehicle age, mileage, and brand specifications alone.
                </span>
              </div>
            )}
          </div>
        ) : fuel === 'Hybrid' ? (
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold mb-1">
                Hybrid Powertrain Note:
              </strong>
              Hybrid vehicles utilize dual combustion-electric powertrains with smaller buffer battery packs. The dedicated NASA SOH cell diagnostic is calibrated specifically for pure Electric (BEV) traction batteries. Resale valuation will run normally for this hybrid.
            </div>
          </div>
        ) : null}

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              setBrand('Maruti');
              setModel('Swift Dzire');
              setYear(2018);
              setKmDriven(45000);
              setFuel('Petrol');
              setTransmission('Manual');
              setSellerType('Individual');
              setOwner('First Owner');
              setSeats(5);
              setOriginalPrice('');
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-mono transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Running Inference Pipelines...</span>
              </>
            ) : (
              <>
                <span>Compute Valuation & SOH</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

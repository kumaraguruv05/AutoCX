import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Car,
  CarFront,
  BatteryCharging,
  Info,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Sliders,
  DollarSign,
  ArrowRight,
  RotateCcw,
  Gauge,
  Fuel,
  Cog,
  KeyRound,
  Disc3,
  Calendar,
  Zap,
  Activity,
  Cpu,
  Power
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { storageService } from '@/services/storage';
import { formatIndianDenomination, formatINR } from '@/utils/formatters';
import {
  CarPredictionRequest,
  BatteryPredictionRequest,
  CarPredictionResponse,
  BatteryPredictionResponse,
  VehicleProfile
} from '@/types/api';
import { F1ShiftLights } from '@/components/cockpit/F1ShiftLights';
import { EVSkateboardChassis } from '@/components/cockpit/EVSkateboardChassis';
import { DrivingLoadingModal } from '@/components/cockpit/DrivingLoadingModal';

// Typical real-world single-charge ranges for EV models (in km)
const EV_DEFAULT_RANGES: Record<string, number> = {
  'nexon': 260,
  'tiago': 200,
  'tigor': 210,
  'punch': 270,
  'curvv': 400,
  'zs': 340,
  'comet': 180,
  'windsor': 280,
  'kona': 350,
  'ioniq': 460,
  'ev6': 480,
  'xuv400': 280,
  'atto': 410,
  'seal': 510,
  'model 3': 440,
  'model y': 450,
  'ix': 400,
  'eq': 420,
};

const getModelEvRange = (modelName: string): number => {
  const lower = modelName.toLowerCase();
  for (const [k, v] of Object.entries(EV_DEFAULT_RANGES)) {
    if (lower.includes(k)) {
      return v;
    }
  }
  return 260;
};

// Physics-calibrated electrochemical battery parameter derivation from Odometer & EV Range
export const deriveBatteryTelemetry = (km: number, rangeKm: number) => {
  const safeRange = Math.max(80, rangeKm * 0.90);
  const safeKm = Math.max(100, km);
  const computedCycles = Math.max(10, Math.min(1200, Math.round(safeKm / safeRange)));
  
  // Internal resistance in Ohms (rises exponentially as cell ages)
  const rInt = parseFloat((0.050 + 0.00022 * computedCycles + 0.00000042 * Math.pow(computedCycles, 2)).toFixed(4));
  // Terminal voltage decay
  const vMax = parseFloat(Math.max(4.05, 4.20 - 0.00028 * computedCycles).toFixed(2));
  const vMin = parseFloat(Math.max(2.10, 2.50 - 0.00070 * computedCycles).toFixed(2));
  const vMean = parseFloat(Math.max(3.15, 3.55 - 0.00075 * computedCycles).toFixed(2));
  const vStd = parseFloat(Math.min(0.55, 0.35 + 0.00032 * computedCycles).toFixed(2));
  // Surface temperature rises with Joule heating (I^2 * R)
  const tMax = parseFloat((28.0 + rInt * 130.0).toFixed(1));
  const tMean = parseFloat((tMax - 5.2).toFixed(1));
  const dischargeDuration = Math.max(1600, Math.round(3500 - 3.4 * computedCycles));
  // Estimated preliminary SOH percentage
  const estimatedSoh = Math.max(45.0, Math.min(100.0, 100.0 - 0.048 * computedCycles - (rInt - 0.050) * 80.0));

  return {
    cycle: computedCycles,
    ambient_temperature_c: 24.0,
    voltage_max_v: vMax,
    voltage_min_v: vMin,
    voltage_mean_v: vMean,
    voltage_std_v: vStd,
    current_mean_a: 2.0,
    temp_max_c: tMax,
    temp_mean_c: tMean,
    discharge_duration_sec: dischargeDuration,
    internal_resistance_ohm: rInt,
    estimated_soh: parseFloat(estimatedSoh.toFixed(1))
  };
};

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

  // Schema and Catalog state
  const [brands, setBrands] = useState<string[]>(DEFAULT_BRANDS);
  const [brandModelsMap, setBrandModelsMap] = useState<Record<string, string[]>>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [carCatalog, setCarCatalog] = useState<Record<string, VehicleProfile>>({});

  // Car form fields
  const [brand, setBrand] = useState<string>(initialCar?.brand || 'Maruti');
  const [model, setModel] = useState<string>(initialCar?.model || 'Swift Dzire');
  const [year, setYear] = useState<string>(
    initialCar?.year ? String(initialCar.year) : '2018'
  );
  const [kmDriven, setKmDriven] = useState<string>(
    initialCar?.km_driven !== undefined && initialCar?.km_driven !== null
      ? String(initialCar.km_driven)
      : '45000'
  );
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
  // Original purchase price starts blank unless explicitly entered or previously saved with positive amount
  const [originalPrice, setOriginalPrice] = useState<string>(
    initialCar?.original_price !== undefined && initialCar?.original_price !== null && Number(initialCar.original_price) > 0
      ? String(initialCar.original_price)
      : ''
  );

  // EV Battery form fields
  const [includeBatteryDiagnostic, setIncludeBatteryDiagnostic] = useState<boolean>(
    initialBattery ? true : initialCar ? initialCar.fuel === 'Electric' : true
  );
  // EV range state & auto-derivation mode
  const [evRangeKm, setEvRangeKm] = useState<string>(
    initialCar ? String(getModelEvRange(initialCar.model)) : '260'
  );
  const [useAutoBatteryTelemetry, setUseAutoBatteryTelemetry] = useState<boolean>(true);
  const [showManualBatterySensors, setShowManualBatterySensors] = useState<boolean>(false);

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

  // Automatically derive NASA battery parameters from Odometer & EV Range
  useEffect(() => {
    if (fuel === 'Electric' && useAutoBatteryTelemetry) {
      const km = kmDriven ? parseFloat(kmDriven) : 45000;
      const range = evRangeKm ? parseFloat(evRangeKm) : 260;
      const telemetry = deriveBatteryTelemetry(km, range);
      setCycle(telemetry.cycle);
      setAmbientTemp(telemetry.ambient_temperature_c);
      setVoltageMax(telemetry.voltage_max_v);
      setVoltageMin(telemetry.voltage_min_v);
      setVoltageMean(telemetry.voltage_mean_v);
      setVoltageStd(telemetry.voltage_std_v);
      setCurrentMean(telemetry.current_mean_a);
      setTempMax(telemetry.temp_max_c);
      setTempMean(telemetry.temp_mean_c);
      setDischargeSec(telemetry.discharge_duration_sec);
      setInternalResistance(telemetry.internal_resistance_ohm);
    }
  }, [kmDriven, evRangeKm, fuel, useAutoBatteryTelemetry]);

  // Submission / Loading / Error state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDrivingModal, setShowDrivingModal] = useState<boolean>(false);
  const [pendingAnalysisState, setPendingAnalysisState] = useState<any>(null);

  const handleDrivingComplete = () => {
    setShowDrivingModal(false);
    setIsLoading(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (pendingAnalysisState) {
      navigate('/results', { state: pendingAnalysisState });
    }
  };

  // Load schema and vehicle catalog from backend
  useEffect(() => {
    Promise.all([
      apiClient.getCarSchema(),
      apiClient.getCarCatalog()
    ])
      .then(([schema, catalog]) => {
        if (schema && schema.brands && schema.brands.length > 0) {
          setBrands(schema.brands);
          if (schema.brand_models_map) {
            setBrandModelsMap(schema.brand_models_map);
            const models = schema.brand_models_map[brand] || [];
            setAvailableModels(models);
          }
        }
        if (catalog) {
          setCarCatalog(catalog);
          // If fresh form without initial edit state, auto-populate model's launch year
          if (!initialCar) {
            const activeProfile = catalog[`${brand}::${model}`];
            if (activeProfile?.year_min) {
              setYear(String(activeProfile.year_min));
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic car schema or catalog, using defaults:', err);
      });
  }, []);

  // Update models list when brand changes
  useEffect(() => {
    if (brandModelsMap[brand] && brandModelsMap[brand].length > 0) {
      const models = brandModelsMap[brand];
      setAvailableModels(models);
      if (!models.includes(model)) {
        const nextModel = models[0];
        setModel(nextModel);
        const profile = carCatalog[`${brand}::${nextModel}`];
        if (profile?.year_min) {
          setYear(String(profile.year_min));
        }
        const defaultRange = getModelEvRange(nextModel);
        setEvRangeKm(String(defaultRange));
      }
    } else {
      setAvailableModels([]);
    }
  }, [brand, brandModelsMap]);

  // Model change handler: updates model, launch year, and EV range
  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    const profile = carCatalog[`${brand}::${newModel}`];
    if (profile?.year_min) {
      setYear(String(profile.year_min));
    }
    const defaultRange = getModelEvRange(newModel);
    setEvRangeKm(String(defaultRange));
  };

  // Current active vehicle profile from catalog
  const CURRENT_CALENDAR_YEAR = 2026;
  const currentProfile = carCatalog[`${brand}::${model}`];
  const yearMin = currentProfile?.year_min || 1990;
  const yearMax = currentProfile?.year_max || CURRENT_CALENDAR_YEAR;
  const parsedYear = year ? parseInt(year, 10) : 0;
  const computedVehicleAge = parsedYear > 0 ? Math.max(0, CURRENT_CALENDAR_YEAR - parsedYear) : 0;
  const validFuels = currentProfile?.valid_fuels && currentProfile.valid_fuels.length > 0
    ? currentProfile.valid_fuels
    : ['Petrol', 'Diesel', 'CNG', 'LPG', 'Electric', 'Hybrid'];
  const validTransmissions = currentProfile?.valid_transmissions && currentProfile.valid_transmissions.length > 0
    ? currentProfile.valid_transmissions
    : ['Manual', 'Automatic'];

  // Handle Fuel change side-effects (CONDITIONAL EV BEHAVIOR)
  const handleFuelChange = (newFuel: string) => {
    setFuel(newFuel);
    setError(null);
    if (newFuel === 'Electric') {
      setIncludeBatteryDiagnostic(true);
      setEngineCc('0');
    } else {
      setIncludeBatteryDiagnostic(false);
      if (engineCc === '0') {
        setEngineCc(currentProfile ? String(currentProfile.engine_cc) : '1197');
      }
    }
  };

  // Sync profile specs and constraints when model changes
  useEffect(() => {
    if (currentProfile) {
      // 1. Constrain year if out of bounds (only when year is non-empty)
      const numYear = year ? parseInt(year, 10) : 0;
      if (numYear > currentProfile.year_max) {
        setYear(String(currentProfile.year_max));
      } else if (numYear > 0 && numYear < currentProfile.year_min) {
        setYear(String(currentProfile.year_min));
      }
      // 2. Constrain fuel
      if (currentProfile.valid_fuels && currentProfile.valid_fuels.length > 0) {
        if (!currentProfile.valid_fuels.includes(fuel)) {
          handleFuelChange(currentProfile.valid_fuels[0]);
        }
      }
      // 3. Constrain transmission
      if (currentProfile.valid_transmissions && currentProfile.valid_transmissions.length > 0) {
        if (!currentProfile.valid_transmissions.includes(transmission)) {
          setTransmission(currentProfile.valid_transmissions[0]);
        }
      }
      // 4. Auto pre-fill technical specifications
      setEngineCc(String(currentProfile.engine_cc));
      setMaxPowerBhp(String(currentProfile.max_power_bhp));
      setMileageKmpl(String(currentProfile.mileage_kmpl));
      setSeats(currentProfile.seats);
    }
  }, [brand, model, carCatalog]);

  const applyEvPreset = (presetData: any) => {
    setUseAutoBatteryTelemetry(false);
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
      // 1. Conditionally execute Battery Health prediction FIRST for Electric vehicles
      let batteryResult: BatteryPredictionResponse | null = null;
      let batteryPayload: BatteryPredictionRequest | null = null;
      let evaluatedBatterySoh: number | null = null;

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
        evaluatedBatterySoh = batteryResult.predicted_soh_percent;
      }

      // 2. Prepare Car Resale Payload with battery_soh coupling
      const carPayload: CarPredictionRequest = {
        brand: brand.trim(),
        model: model.trim(),
        year: year ? parseInt(year, 10) : (currentProfile?.year_min || 2018),
        km_driven: kmDriven ? parseFloat(kmDriven) : 45000,
        fuel: fuel.trim(),
        seller_type: sellerType,
        transmission: transmission,
        owner: owner,
        seats: Number(seats),
        mileage_kmpl: mileageKmpl ? parseFloat(mileageKmpl) : null,
        engine_cc: fuel === 'Electric' ? 0 : engineCc ? parseFloat(engineCc) : null,
        max_power_bhp: maxPowerBhp ? parseFloat(maxPowerBhp) : null,
        original_price: originalPrice && parseFloat(originalPrice) > 0 ? parseFloat(originalPrice) : null,
        battery_soh: fuel === 'Electric' ? evaluatedBatterySoh : null,
      };

      // 3. Execute Car Resale Prediction with empirical Battery SOH financial adjustment
      const carResult: CarPredictionResponse = await apiClient.predictCarValue(carPayload);

      // Save to localStorage history
      const saved = storageService.saveAnalysis({
        carInput: carPayload,
        carResult,
        batteryInput: batteryPayload,
        batteryResult,
      });

      // Prepare results payload and launch 2D parallax driving loading screen
      const navState = {
        analysisId: saved.id,
        carInput: carPayload,
        carResult,
        batteryInput: batteryPayload,
        batteryResult,
      };
      setPendingAnalysisState(navState);
      setShowDrivingModal(true);
    } catch (err: any) {
      console.error('Prediction failed:', err);
      setError(err.message || 'An unexpected error occurred while predicting vehicle value.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50">
      {/* Title */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-800 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
          <Car className="w-3.5 h-3.5 text-slate-950" />
          <span>Vehicle Valuation & Diagnostics</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
          Vehicle Valuation & Battery Health Analysis
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
          Provide your vehicle details to compute market resale worth and depreciation. If analyzing a fully electric vehicle, battery State of Health (SOH) diagnostic inputs will activate below.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Evaluation Error:</strong>
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-8">
        {/* SECTION 1: General Vehicle Information */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-sm">
                <CarFront className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-950">Vehicle Specifications</h2>
                  {currentProfile?.segment && (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-semibold tracking-wide uppercase">
                      {currentProfile.segment}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  AUTOCX POWERTRAIN & CHASSIS TELEMETRICS
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Catalog Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Brand */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Brand / Manufacturer
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Model Series
              </label>
              {availableModels.length > 0 ? (
                <select
                  value={model}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all"
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
                  onChange={(e) => handleModelChange(e.target.value)}
                  placeholder="e.g. Swift, Creta, Nexon EV"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all"
                  required
                />
              )}
            </div>

            {/* Cockpit Telemetry Chip Strip */}
            <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Engine Spec</span>
                <span className="text-slate-900 font-semibold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-600" />
                  {fuel === 'Electric' ? 'EV Traction Motor' : `${engineCc || '—'} cc`}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Peak Power</span>
                <span className="text-slate-900 font-semibold flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-slate-600" />
                  {maxPowerBhp ? `${maxPowerBhp} bhp` : '—'}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Rated Efficiency</span>
                <span className="text-slate-900 font-semibold flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-slate-600" />
                  {mileageKmpl ? `${mileageKmpl} km/l` : '—'}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Cabin Seating</span>
                <span className="text-slate-900 font-semibold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                  {seats} Seater
                </span>
              </div>
            </div>

            {/* Manufacturing Year with Production Span Banner DIRECTLY ABOVE */}
            <div className="space-y-2">
              {/* Production Run Display Card - DIRECTLY ABOVE THE YEAR INPUT */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    <span>Production Lifecycle</span>
                  </span>
                  {currentProfile && currentProfile.year_max < CURRENT_CALENDAR_YEAR ? (
                    <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Discontinued ({currentProfile.year_max})
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active Generation
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600">
                    Produced from <strong className="text-slate-950 font-bold">{yearMin}</strong> to{' '}
                    <strong className="text-slate-950 font-bold">{yearMax >= 2024 ? 'Present' : yearMax}</strong>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    First Launch: <strong className="text-black font-semibold">{yearMin}</strong>
                  </span>
                </div>
              </div>

              {/* Manufacturing Year Input Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-900" />
                    <span>Manufacturing Year</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    Computed Age: <strong className="text-slate-900">{computedVehicleAge} {computedVehicleAge === 1 ? 'year' : 'years'} old</strong> (2026)
                  </span>
                </div>
                <input
                  type="number"
                  min={yearMin}
                  max={yearMax}
                  value={year}
                  onChange={(e) => {
                    const val = e.target.value;
                    const cleaned = val === '' ? '' : val.replace(/^0+(?=\d)/, '');
                    setYear(cleaned);
                  }}
                  placeholder={String(yearMin)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all font-mono font-semibold"
                  required
                />
                <p className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                  <span>Factory build year ({yearMin} – {yearMax})</span>
                  {parsedYear > 0 && (parsedYear < yearMin || parsedYear > yearMax) && (
                    <span className="text-rose-600 font-semibold">⚠️ Out of catalog production range</span>
                  )}
                </p>
              </div>
            </div>

            {/* Kilometers Driven (Odometer) with Cockpit Bezel */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-slate-900" />
                  <span>Kilometres Driven</span>
                </label>
                {/* LCD Odometer Readout */}
                <div className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 text-emerald-400 font-mono text-xs font-bold tracking-widest shadow-inner flex items-center gap-1">
                  <span className="text-[9px] text-neutral-400 uppercase tracking-tight">ODO</span>
                  <span>{kmDriven ? Number(kmDriven).toLocaleString() : '—'}</span>
                  <span className="text-[9px] text-neutral-400">KM</span>
                </div>
              </div>
              <input
                type="number"
                min="0"
                max="1000000"
                step="500"
                value={kmDriven}
                onChange={(e) => {
                  const val = e.target.value;
                  const cleaned = val === '' ? '' : val.replace(/^0+(?=\d)/, '');
                  setKmDriven(cleaned);
                }}
                placeholder="45000"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all font-mono font-semibold"
                required
              />
              <p className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                <span>Total odometer accumulation</span>
                <span className="text-slate-600 font-semibold">
                  {kmDriven && parsedYear > 0 ? `~${Math.round(Number(kmDriven) / Math.max(1, computedVehicleAge)).toLocaleString()} km / yr` : ''}
                </span>
              </p>
            </div>

            {/* Fuel Type */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-slate-900" />
                  <span>Fuel Powertrain</span>
                </span>
                {fuel === 'Electric' && (
                  <span className="text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded font-mono font-medium animate-pulse flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-600" />
                    <span>EV Mode Active</span>
                  </span>
                )}
              </label>
              <select
                value={fuel}
                onChange={(e) => handleFuelChange(e.target.value)}
                className={`w-full bg-slate-50 border rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white transition-all ${
                  fuel === 'Electric'
                    ? 'border-cyan-500 ring-1 ring-cyan-500'
                    : 'border-slate-300 focus:border-black focus:ring-1 focus:ring-black'
                }`}
              >
                {validFuels.map((f) => (
                  <option key={f} value={f}>
                    {f === 'Electric' ? 'Electric (BEV)' : f === 'Hybrid' ? 'Hybrid (HEV)' : f}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>
                  {fuel === 'Petrol' && '⛽ Unleaded 91/95 RON • Spark Ignition'}
                  {fuel === 'Diesel' && '⛽ Ultra-Low Sulfur Diesel • BS-VI'}
                  {fuel === 'Electric' && '⚡ High-Voltage DC Battery Pack'}
                  {fuel === 'CNG' && '🌿 200 Bar Compressed Natural Gas'}
                  {fuel === 'LPG' && '🔥 Auto-LPG Dual Fuel'}
                  {fuel === 'Hybrid' && '🔋 Self-Charging HEV Powertrain'}
                </span>
              </div>
            </div>

            {/* Transmission */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Cog className="w-3.5 h-3.5 text-slate-900" />
                  <span>Transmission</span>
                </label>
                {/* Automotive Shift Pattern Badge */}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold tracking-wider">
                  {transmission === 'Automatic' ? '[ P R N D S ]' : '[ 1 3 5 / 2 4 R ]'}
                </span>
              </div>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all"
              >
                {validTransmissions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 font-mono">
                {transmission === 'Automatic' ? 'Hydraulic Torque-Converter / DCT / CVT' : 'Synchromesh Manual Gearbox'}
              </p>
            </div>

            {/* Ownership */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-900" />
                <span>Ownership History</span>
              </label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all"
              >
                <option value="First Owner">First Owner</option>
                <option value="Second Owner">Second Owner</option>
                <option value="Third Owner">Third Owner</option>
                <option value="Fourth & Above Owner">Fourth & Above Owner</option>
              </select>
            </div>

            {/* Seller Type */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Disc3 className="w-3.5 h-3.5 text-slate-900" />
                <span>Seller Type</span>
              </label>
              <select
                value={sellerType}
                onChange={(e) => setSellerType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all"
              >
                <option value="Individual">Individual</option>
                <option value="Dealer">Dealer</option>
                <option value="Trustmark Dealer">Trustmark Dealer</option>
              </select>
            </div>
          </div>

          {/* Reference Price */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-900" />
                <span>Original Invoice / Reference Price (INR ₹)</span>
                <span className="text-slate-500 font-normal lowercase">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                {currentProfile?.typical_original_price && !originalPrice && (
                  <button
                    type="button"
                    onClick={() => setOriginalPrice(String(Math.round(currentProfile.typical_original_price)))}
                    className="text-[11px] text-slate-700 hover:text-black bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-md font-mono transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Auto-Fill Benchmark: {formatIndianDenomination(currentProfile.typical_original_price)}</span>
                  </button>
                )}
                {originalPrice && (
                  <button
                    type="button"
                    onClick={() => setOriginalPrice('')}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-mono transition-colors underline cursor-pointer"
                  >
                    Clear Price
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm">₹</span>
              <input
                type="number"
                id="originalPrice"
                name="originalPrice"
                autoComplete="off"
                min="0"
                step="10000"
                placeholder={
                  currentProfile
                    ? `e.g. ${currentProfile.typical_original_price.toLocaleString()} (AutoCX catalog benchmark for ${model})`
                    : "e.g. 850000 (leave blank for automatic catalog lookup)"
                }
                value={originalPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  const cleaned = val === '' ? '' : val.replace(/^0+(?=\d)/, '');
                  setOriginalPrice(cleaned);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
              <strong className="text-slate-700">Automated Benchmark Active:</strong> When left blank, AutoCX automatically cross-references the official catalog launch invoice {currentProfile?.typical_original_price ? `(${formatIndianDenomination(currentProfile.typical_original_price)})` : ''} to anchor depreciation curves.
            </p>
          </div>

          {/* Optional Advanced Technical Specs toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvancedSpecs(!showAdvancedSpecs)}
              className="text-xs text-slate-800 hover:text-black font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvancedSpecs ? 'Hide' : 'Customize'} Technical Specifications ({engineCc} cc • {maxPowerBhp} bhp • {seats} seats)</span>
            </button>

            {showAdvancedSpecs && (
              <div className="space-y-3 mt-4 pt-4 border-t border-slate-200">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-900 shrink-0" />
                  <span>
                    Specifications auto-populated from AutoCX vehicle catalog for <strong>{brand} {model}</strong> ({currentProfile?.segment || 'Standard'}). You can adjust these if your specific variant differs.
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 font-mono">
                    {fuel === 'Electric' ? 'Displacement (EV)' : 'Engine (CC)'}
                  </label>
                  <input
                    type="number"
                    disabled={fuel === 'Electric'}
                    value={fuel === 'Electric' ? '0' : engineCc}
                    onChange={(e) => setEngineCc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono disabled:opacity-50 focus:bg-white focus:border-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 font-mono">Max Power (bhp)</label>
                  <input
                    type="number"
                    value={maxPowerBhp}
                    onChange={(e) => setMaxPowerBhp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 font-mono">Mileage (kmpl)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mileageKmpl}
                    onChange={(e) => setMileageKmpl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 font-mono">Seats</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-black"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* SECTION 2: CONDITIONAL EV BATTERY HEALTH SECTION */}
        {fuel === 'Electric' ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-cyan-50/70 via-white to-sky-50/60 border border-cyan-300/90 space-y-6 shadow-sm relative overflow-hidden">
            {/* Ambient HUD scanning bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-75 animate-pulse" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cyan-200 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-black text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                      <BatteryCharging className="w-5 h-5 text-cyan-600" />
                      EV Traction Battery Telemetry & SOH
                    </h2>
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300 font-semibold tracking-wider">
                      NASA PCoE Model
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-mono">
                    Electrochemical cell degradation & State of Health prediction
                  </p>
                </div>
              </div>

              {/* Opt-out toggle */}
              <label className="flex items-center gap-2 text-xs font-mono text-slate-700 cursor-pointer self-start sm:self-auto bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:border-black transition-colors">
                <input
                  type="checkbox"
                  checked={includeBatteryDiagnostic}
                  onChange={(e) => setIncludeBatteryDiagnostic(e.target.checked)}
                  className="rounded text-black focus:ring-black"
                />
                <span className="font-semibold">Enable SOH Diagnostic</span>
              </label>
            </div>

            {includeBatteryDiagnostic ? (
              <div className="space-y-6">
                {/* Active EV Resale Coupling Callout */}
                <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-300 text-xs text-slate-800 flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 font-mono">
                    <span className="font-bold text-slate-950 block">Active EV Battery Resale Valuation Coupling</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Battery State of Health directly modulates vehicle resale value. Pristine packs (&gt;90% SOH) secure a market retention bonus, while degraded packs (&lt;70% SOH) incur realistic pack-replacement deductions.
                    </p>
                  </div>
                </div>

                {/* AI Odometer & Range Telemetry Derivation Cockpit */}
                <div className="p-5 rounded-2xl bg-white border border-cyan-200 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                        <Cpu className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <span>Autonomous Battery Telemetry Generator</span>
                          <span className="text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded font-mono font-semibold">
                            AI Dynamic Derivation
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Auto-calibrated from Odometer Accumulation ({kmDriven || '0'} km) & Single-Charge Range
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setUseAutoBatteryTelemetry(!useAutoBatteryTelemetry)}
                        className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                          useAutoBatteryTelemetry
                            ? 'bg-cyan-50 border-cyan-300 text-cyan-800 font-semibold'
                            : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-600" />
                        <span>{useAutoBatteryTelemetry ? '⚡ Auto-Pilot Active' : '🛠️ Manual Sensor Mode'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Range & Odometer Pairing Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Odometer readout */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                        <span>Odometer Reading</span>
                        <span className="text-emerald-600 font-semibold">From Form</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold font-mono text-slate-900">
                          {kmDriven ? Number(kmDriven).toLocaleString() : '0'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">KM run</span>
                      </div>
                    </div>

                    {/* EV Single-Charge Range Input */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                        <span>EV Single-Charge Range</span>
                        <span className="text-cyan-700 font-semibold font-mono">
                          ~{Math.round((Number(evRangeKm) || 260) * 0.9)} km real-world DOD
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="80"
                          max="800"
                          step="10"
                          value={evRangeKm}
                          onChange={(e) => {
                            const val = e.target.value.replace(/^0+(?=\d)/, '');
                            setEvRangeKm(val);
                          }}
                          placeholder="260"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 text-sm font-mono font-bold focus:border-black focus:ring-1 focus:ring-black outline-none"
                        />
                        <span className="text-xs font-mono text-slate-600 font-semibold">KM</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick EV Range Preset Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mr-1">
                      Popular EV Ranges:
                    </span>
                    {[
                      { label: 'Nexon EV', range: 260 },
                      { label: 'Tiago EV', range: 200 },
                      { label: 'Tigor EV', range: 210 },
                      { label: 'ZS EV', range: 340 },
                      { label: 'XUV400', range: 280 },
                      { label: 'Ioniq 5', range: 460 },
                      { label: 'Atto 3', range: 410 },
                    ].map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => {
                          setEvRangeKm(String(m.range));
                          setUseAutoBatteryTelemetry(true);
                        }}
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                          evRangeKm === String(m.range)
                            ? 'bg-black text-white border-black font-semibold shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {m.label} ({m.range}km)
                      </button>
                    ))}
                  </div>

                  {/* Animated High-Voltage Battery Pack Display */}
                  <div className="p-5 rounded-2xl bg-neutral-950 text-white font-mono space-y-4 shadow-inner relative overflow-hidden border border-neutral-800">
                    {/* Shimmering electron stream beam animation */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 animate-battery-flow" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-neutral-300 font-bold uppercase tracking-widest flex items-center gap-2">
                          <BatteryCharging className="w-4 h-4 text-cyan-400" />
                          <span>HIGH-VOLTAGE TRACTION PACK SIMULATION</span>
                        </span>
                      </div>
                      <span className="text-xs font-bold text-cyan-400 tracking-wider">
                        {cycle} EQUIVALENT CHARGE CYCLES
                      </span>
                    </div>

                    {/* State of Health Bar with Animated Gradient */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">Estimated State of Health (SOH)</span>
                        <span className={`font-bold tracking-wider ${
                          (100 - cycle * 0.048) >= 85
                            ? 'text-emerald-400'
                            : (100 - cycle * 0.048) >= 75
                            ? 'text-cyan-400'
                            : 'text-amber-400'
                        }`}>
                          {Math.max(45, Math.min(100, Math.round((100 - cycle * 0.048 - (internalResistance - 0.050) * 80) * 10) / 10))}% SOH
                        </span>
                      </div>
                      <div className="h-3.5 w-full bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700 relative">
                        <div
                          className={`h-full rounded-full transition-all duration-700 relative ${
                            (100 - cycle * 0.048) >= 85
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : (100 - cycle * 0.048) >= 75
                              ? 'bg-gradient-to-r from-cyan-500 to-sky-400'
                              : 'bg-gradient-to-r from-amber-500 to-orange-400'
                          }`}
                          style={{
                            width: `${Math.max(15, Math.min(100, 100 - cycle * 0.048 - (internalResistance - 0.050) * 80))}%`,
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Derived Physics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-400 uppercase block tracking-wider">Internal Resistance</span>
                        <span className="text-neutral-200 font-bold flex items-center gap-1">
                          <Activity className="w-3 h-3 text-cyan-400" />
                          {internalResistance} Ω
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-400 uppercase block tracking-wider">Terminal Spread</span>
                        <span className="text-neutral-200 font-bold">
                          {voltageMin}V – {voltageMax}V
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-400 uppercase block tracking-wider">Peak Discharge Temp</span>
                        <span className="text-neutral-200 font-bold">
                          {tempMax} °C
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-400 uppercase block tracking-wider">Discharge Time</span>
                        <span className="text-neutral-200 font-bold">
                          ~{(dischargeSec / 60).toFixed(0)} min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Expandable NASA Lab Sensor Inputs */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowManualBatterySensors(!showManualBatterySensors)}
                    className="text-xs text-slate-600 hover:text-black font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>
                      {showManualBatterySensors ? 'Hide' : 'Inspect or Override'} Raw NASA Ames Test-Bench Parameters ({cycle} cycles • {voltageMean}V mean)
                    </span>
                  </button>

                  {showManualBatterySensors && (
                    <div className="space-y-4 mt-3 pt-4 border-t border-cyan-200/80">
                      {/* Preset bar */}
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                            <span>NASA Experimental Benchmark Profiles</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Overrides auto calculations</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {EV_PRESETS.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => applyEvPreset(preset.data)}
                              className="text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-black text-slate-800 hover:text-white border border-slate-200 hover:border-black text-xs transition-all duration-200 font-mono cursor-pointer"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Manual input fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-700 font-mono font-semibold block">Cycle Count</label>
                          <input
                            type="number"
                            min="1"
                            max="1200"
                            value={cycle}
                            onChange={(e) => {
                              setUseAutoBatteryTelemetry(false);
                              setCycle(Number(e.target.value));
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-700 font-mono font-semibold block">Peak Initial Voltage (V)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="3.0"
                            max="4.5"
                            value={voltageMax}
                            onChange={(e) => {
                              setUseAutoBatteryTelemetry(false);
                              setVoltageMax(Number(e.target.value));
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-700 font-mono font-semibold block">Cutoff Voltage (V)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="1.8"
                            max="3.2"
                            value={voltageMin}
                            onChange={(e) => {
                              setUseAutoBatteryTelemetry(false);
                              setVoltageMin(Number(e.target.value));
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-700 font-mono font-semibold block">Internal Resistance (Ω)</label>
                          <input
                            type="number"
                            step="0.001"
                            min="0.01"
                            max="0.5"
                            value={internalResistance}
                            onChange={(e) => {
                              setUseAutoBatteryTelemetry(false);
                              setInternalResistance(Number(e.target.value));
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-700 font-mono font-semibold block">Peak Operating Temp (°C)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={tempMax}
                            onChange={(e) => {
                              setUseAutoBatteryTelemetry(false);
                              setTempMax(Number(e.target.value));
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-700 font-mono font-semibold block">Discharge Time (sec)</label>
                          <input
                            type="number"
                            min="500"
                            max="10000"
                            value={dischargeSec}
                            onChange={(e) => {
                              setUseAutoBatteryTelemetry(false);
                              setDischargeSec(Number(e.target.value));
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-black"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interactive Motorsport EV Skateboard Chassis Blueprint */}
                <EVSkateboardChassis
                  sohPercent={Math.max(45, Math.min(100, Math.round((100 - cycle * 0.048 - (internalResistance - 0.050) * 80) * 10) / 10))}
                  cycleCount={cycle}
                  voltageSpread={Math.round((voltageMax - voltageMin) * 100) / 100}
                  tempPeak={tempMax}
                  ambientTemp={ambientTemp}
                  internalResistance={internalResistance}
                />

                <div className="p-3.5 rounded-xl bg-cyan-50/70 border border-cyan-200 text-xs text-slate-700 flex items-start gap-2.5 font-mono">
                  <Info className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                  <span>
                    AutoCX estimates battery SOH using Li-ion cell aging kinetics from NASA Ames PCoE research. Parameters update automatically as you adjust vehicle mileage and EV single-charge range.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-3 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Battery SOH diagnostic is toggled off. You will receive an EV market resale valuation based on vehicle age, mileage, and brand specifications alone.
                </span>
              </div>
            )}
          </div>
        ) : fuel === 'Hybrid' ? (
          <div className="p-5 rounded-xl bg-amber-50/70 border border-amber-200 text-slate-700 text-xs flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-semibold mb-1">
                Hybrid Powertrain Note:
              </strong>
              Hybrid vehicles utilize dual combustion-electric powertrains with smaller buffer battery packs. The dedicated NASA SOH cell diagnostic is calibrated specifically for pure Electric (BEV) traction batteries. Resale valuation will run normally for this hybrid.
            </div>
          </div>
        ) : null}

        {/* Cockpit Action Console: F1 Shift Lights & Refined Ignition Button */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 pt-6 border-t border-slate-200">
          <F1ShiftLights isRevving={isLoading} intensity={isLoading ? 10 : 5} showLabels />

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setBrand('Maruti');
                setModel('Swift Dzire');
                setYear('2018');
                setKmDriven('45000');
                setFuel('Petrol');
                setTransmission('Manual');
                setSellerType('Individual');
                setOwner('First Owner');
                setSeats(5);
                setOriginalPrice('');
                setEvRangeKm('260');
                setUseAutoBatteryTelemetry(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-black border border-slate-300 hover:border-black text-xs font-mono transition-all duration-200 shadow-2xs group cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform duration-300" />
              <span>Reset Defaults</span>
            </button>

            {/* Refined Motorsport Ignition Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative group overflow-hidden w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-neutral-950 hover:bg-black text-white font-mono text-xs font-bold tracking-wider uppercase border border-neutral-800 hover:border-cyan-500/50 shadow-xl shadow-black/20 hover:shadow-cyan-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {/* Subtle top chamfer highlight line */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-cyan-300 tracking-wider">CRANKING ENGINE...</span>
                </>
              ) : (
                <>
                  {/* Discreet ignition status indicator ring */}
                  <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-inner group-hover:border-cyan-400 transition-colors">
                    <Power className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <span className="tracking-wider text-neutral-100 group-hover:text-white">
                    START VALUATION & SOH PIPELINE
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-200" />
                </>
              )}
            </button>
          </div>
        </div>
    </form>

    {/* 2D Parallax Driving Loading Modal */}
    <DrivingLoadingModal
      isOpen={showDrivingModal}
      brand={brand}
      model={model}
      fuel={fuel}
      segment={currentProfile?.segment}
      onComplete={handleDrivingComplete}
    />
  </div>
  );
};

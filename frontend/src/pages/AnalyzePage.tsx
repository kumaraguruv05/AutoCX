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
  BatteryPredictionResponse,
  VehicleProfile
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

  // Schema and Catalog state
  const [brands, setBrands] = useState<string[]>(DEFAULT_BRANDS);
  const [brandModelsMap, setBrandModelsMap] = useState<Record<string, string[]>>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [carCatalog, setCarCatalog] = useState<Record<string, VehicleProfile>>({});

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
        setModel(models[0]);
      }
    } else {
      setAvailableModels([]);
    }
  }, [brand, brandModelsMap]);

  // Current active vehicle profile from catalog
  const currentProfile = carCatalog[`${brand}::${model}`];
  const yearMin = currentProfile?.year_min || 1990;
  const yearMax = currentProfile?.year_max || new Date().getFullYear();
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
      // 1. Constrain year
      if (year > currentProfile.year_max) {
        setYear(currentProfile.year_max);
      } else if (year < currentProfile.year_min) {
        setYear(currentProfile.year_min);
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
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-950">Vehicle Specifications</h2>
                {currentProfile?.segment && (
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-semibold">
                    {currentProfile.segment}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500">Required inputs</span>
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
                  onChange={(e) => setModel(e.target.value)}
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
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Swift, Creta, Nexon EV"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all"
                  required
                />
              )}
            </div>

            {/* Manufacturing Year */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Manufacturing Year
                </label>
                {currentProfile && currentProfile.year_max < 2024 && (
                  <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono font-semibold">
                    Discontinued in {currentProfile.year_max}
                  </span>
                )}
              </div>
              <input
                type="number"
                min={yearMin}
                max={yearMax}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all font-mono"
                required
              />
              <p className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                <span>Production span: {yearMin} – {yearMax}</span>
                <span>Computed Age: {Math.max(0, 2024 - year)} years</span>
              </p>
            </div>

            {/* Kilometers Driven */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Kilometres Driven (Odometer)
              </label>
              <input
                type="number"
                min="0"
                max="1000000"
                step="500"
                value={kmDriven}
                onChange={(e) => setKmDriven(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all font-mono"
                required
              />
              <p className="text-[11px] text-slate-500 font-mono">
                {kmDriven.toLocaleString()} km
              </p>
            </div>

            {/* Fuel Type */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Fuel Type</span>
                {fuel === 'Electric' && (
                  <span className="text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded font-mono font-medium animate-pulse">
                    ⚡ EV Mode Active
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
            </div>

            {/* Transmission */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Transmission
              </label>
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
            </div>

            {/* Ownership */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Ownership History
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Seller Type
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-900" />
                <span>Original Invoice / Reference Price (INR ₹)</span>
                <span className="text-slate-500 font-normal lowercase">(optional)</span>
              </label>
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
                    ? `e.g. ${currentProfile.typical_original_price.toLocaleString()} (Estimated sticker price for ${model})`
                    : "e.g. 850000 (leave blank to predict resale value only)"
                }
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong className="text-slate-700">Why provide this?</strong> When an original purchase price is supplied, AutoCX anchors depreciation to real vehicle retention curves. If left blank, AutoCX estimates the fair market resale value directly from model segment kinematics.
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
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-cyan-50/60 via-white to-sky-50/50 border border-cyan-300/80 space-y-6 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cyan-200 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black text-white font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                      <BatteryCharging className="w-5 h-5 text-cyan-600" />
                      EV Battery Diagnostic Telemetry
                    </h2>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-300">
                      EV-Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Trained on NASA Ames Li-ion experimental cell aging degradation profiles
                  </p>
                </div>
              </div>

              {/* Opt-out toggle */}
              <label className="flex items-center gap-2 text-xs font-mono text-slate-700 cursor-pointer self-start sm:self-auto bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <input
                  type="checkbox"
                  checked={includeBatteryDiagnostic}
                  onChange={(e) => setIncludeBatteryDiagnostic(e.target.checked)}
                  className="rounded text-black focus:ring-black"
                />
                <span>Enable SOH Diagnostic</span>
              </label>
            </div>

            {includeBatteryDiagnostic ? (
              <div className="space-y-6">
                {/* Preset bar */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-800 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
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
                        className="text-left px-3.5 py-2.5 rounded-lg bg-slate-50 hover:bg-black text-slate-800 hover:text-white border border-slate-200 hover:border-black text-xs transition-all duration-200 font-mono hover:scale-[1.02] active:scale-[0.98] shadow-2xs cursor-pointer"
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>Cycle Count</span>
                      <span className="text-[10px] text-slate-500 font-mono">cycles</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={cycle}
                      onChange={(e) => setCycle(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-sm font-mono focus:border-black focus:ring-1 focus:ring-black outline-none"
                      required
                    />
                  </div>

                  {/* Ambient Temperature */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>Ambient Temp</span>
                      <span className="text-[10px] text-slate-500 font-mono">°C</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={ambientTemp}
                      onChange={(e) => setAmbientTemp(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-sm font-mono focus:border-black focus:ring-1 focus:ring-black outline-none"
                      required
                    />
                  </div>

                  {/* Peak Voltage */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
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
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-sm font-mono focus:border-black focus:ring-1 focus:ring-black outline-none"
                      required
                    />
                  </div>

                  {/* Cutoff Voltage */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
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
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-sm font-mono focus:border-black focus:ring-1 focus:ring-black outline-none"
                      required
                    />
                  </div>

                  {/* Mean Voltage */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
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
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-sm font-mono focus:border-black focus:ring-1 focus:ring-black outline-none"
                      required
                    />
                  </div>

                  {/* Discharge Current */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
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
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-sm font-mono focus:border-black focus:ring-1 focus:ring-black outline-none"
                      required
                    />
                  </div>

                  {/* Max Temperature */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>Peak Operating Temp</span>
                      <span className="text-[10px] text-slate-500 font-mono">°C</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={tempMax}
                      onChange={(e) => setTempMax(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-sm font-mono focus:border-black focus:ring-1 focus:ring-black outline-none"
                      required
                    />
                  </div>

                  {/* Discharge Duration */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>Discharge Duration</span>
                      <span className="text-[10px] text-slate-500 font-mono">seconds</span>
                    </label>
                    <input
                      type="number"
                      min="500"
                      max="10000"
                      value={dischargeSec}
                      onChange={(e) => setDischargeSec(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-sm font-mono focus:border-black focus:ring-1 focus:ring-black outline-none"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono">
                      ~{(dischargeSec / 60).toFixed(1)} minutes
                    </span>
                  </div>

                  {/* Internal Resistance */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
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
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-sm font-mono focus:border-black focus:ring-1 focus:ring-black outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-cyan-50/70 border border-cyan-200 text-xs text-slate-700 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                  <span>
                    AutoCX estimates battery SOH based on cycle kinetics and terminal resistance. If diagnostic sensor logs are unavailable, uncheck the box above to evaluate vehicle resale value independently.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
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

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-slate-200">
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-black border border-slate-300 hover:border-black text-xs font-mono transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-2xs group cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform duration-300" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-sm shadow-lg shadow-black/20 hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Inference Pipelines...</span>
              </>
            ) : (
              <>
                <span>Compute Valuation & SOH</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

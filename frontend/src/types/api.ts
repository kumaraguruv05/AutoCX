export interface CarPredictionRequest {
  brand: string;
  model: string;
  year: number;
  km_driven: number;
  fuel: string;
  seller_type: string;
  transmission: string;
  owner: string;
  mileage_kmpl?: number | null;
  engine_cc?: number | null;
  max_power_bhp?: number | null;
  seats?: number | null;
  original_price?: number | null;
  battery_soh?: number | null;
}

export interface DepreciationInfo {
  original_price: number;
  depreciation_amount: number;
  depreciation_percentage: number;
  is_appreciation: boolean;
}

export interface BatteryValuationImpact {
  battery_soh: number;
  condition_category: string;
  adjustment_inr: number;
  adjustment_percent: number;
  pack_replacement_risk: string;
  explanation: string;
}

export interface CarPredictionResponse {
  estimated_resale_price: number;
  currency: string;
  depreciation: DepreciationInfo | null;
  battery_valuation_impact?: BatteryValuationImpact | null;
  vehicle_summary: {
    brand: string;
    model: string;
    segment?: string;
    year: number;
    vehicle_age: number;
    km_driven: number;
    fuel: string;
    transmission: string;
    owner: string;
    engine_cc?: number;
    max_power_bhp?: number;
    battery_soh?: number | null;
    guardrails_applied?: string[];
  };
  model_version: string;
  algorithm: string;
  metrics: {
    mae?: number;
    rmse?: number;
    r2?: number;
  };
  limitations: string[];
}

export interface VehicleProfile {
  brand: string;
  model: string;
  segment: string;
  year_min: number;
  year_max: number;
  valid_fuels: string[];
  valid_transmissions: string[];
  engine_cc: number;
  max_power_bhp: number;
  mileage_kmpl: number;
  seats: number;
  typical_original_price: number;
  model_price_anchor: number;
}

export interface BatteryPredictionRequest {
  cycle: number;
  ambient_temperature_c: number;
  voltage_max_v: number;
  voltage_min_v: number;
  voltage_mean_v: number;
  voltage_std_v?: number;
  current_mean_a: number;
  temp_max_c: number;
  temp_mean_c: number;
  discharge_duration_sec: number;
  internal_resistance_ohm?: number;
}

export interface BatteryPredictionResponse {
  predicted_soh_percent: number;
  condition_category: string;
  condition_description: string;
  supporting_measurements: {
    cycle_count: number;
    ambient_temp_c: number;
    voltage_spread_v: number;
    discharge_duration_minutes: number;
    discharge_current_a: number;
    peak_temperature_c: number;
  };
  model_version: string;
  algorithm: string;
  metrics: {
    mae?: number;
    rmse?: number;
    r2?: number;
  };
  validation_strategy: string;
  limitations: string[];
}

export interface ModelDetail {
  available: boolean;
  model_name: string;
  algorithm: string;
  version: string;
  training_dataset: string;
  training_samples: number;
  test_samples: number;
  validation_strategy: string;
  metrics: {
    mae?: number;
    rmse?: number;
    r2?: number;
  };
  all_candidate_metrics: Record<string, { mae: number; rmse: number; r2: number }>;
  feature_schema: any;
  limitations: string[];
}

export interface ModelsInfoResponse {
  car_resale_model: ModelDetail;
  battery_soh_model: ModelDetail;
  environment: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  models_loaded: {
    car_resale: boolean;
    battery_soh: boolean;
  };
}

export interface SavedAnalysis {
  id: string;
  timestamp: string;
  carInput: CarPredictionRequest;
  carResult: CarPredictionResponse;
  batteryInput?: BatteryPredictionRequest | null;
  batteryResult?: BatteryPredictionResponse | null;
}

import {
  CarPredictionRequest,
  CarPredictionResponse,
  BatteryPredictionRequest,
  BatteryPredictionResponse,
  ModelsInfoResponse,
  HealthResponse,
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.detail) {
        if (typeof data.detail === 'string') {
          errorDetail = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorDetail = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        }
      }
    } catch {
      // Use fallback errorDetail
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return handleResponse<HealthResponse>(res);
  },

  async getModelsInfo(): Promise<ModelsInfoResponse> {
    const res = await fetch(`${API_BASE_URL}/api/models/info`);
    return handleResponse<ModelsInfoResponse>(res);
  },

  async getCarSchema(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/models/schema/car`);
    return handleResponse<any>(res);
  },

  async getBatterySchema(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/models/schema/battery`);
    return handleResponse<any>(res);
  },

  async predictCarValue(data: CarPredictionRequest): Promise<CarPredictionResponse> {
    const res = await fetch(`${API_BASE_URL}/api/predict/car-value`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<CarPredictionResponse>(res);
  },

  async predictBatteryHealth(data: BatteryPredictionRequest): Promise<BatteryPredictionResponse> {
    const res = await fetch(`${API_BASE_URL}/api/predict/battery-health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<BatteryPredictionResponse>(res);
  },
};

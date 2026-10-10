from typing import Optional
from pydantic import BaseModel, Field

class BatteryPredictionRequest(BaseModel):
    cycle: int = Field(..., ge=1, le=5000, description="Sequential charge/discharge cycle number")
    ambient_temperature_c: float = Field(default=24.0, ge=-20.0, le=70.0, description="Operating ambient temperature in °C")
    voltage_max_v: float = Field(..., ge=3.0, le=4.5, description="Initial full-charge open-circuit terminal voltage (V)")
    voltage_min_v: float = Field(..., ge=1.5, le=3.5, description="End-of-discharge cutoff terminal voltage (V)")
    voltage_mean_v: float = Field(..., ge=2.0, le=4.2, description="Mean operational voltage during discharge (V)")
    voltage_std_v: Optional[float] = Field(default=0.35, ge=0.0, le=2.0, description="Voltage standard deviation across discharge (V)")
    current_mean_a: float = Field(..., ge=0.1, le=50.0, description="Average discharge current draw (A)")
    temp_max_c: float = Field(..., ge=-10.0, le=90.0, description="Maximum battery temperature during discharge (°C)")
    temp_mean_c: float = Field(..., ge=-10.0, le=80.0, description="Average battery temperature during discharge (°C)")
    discharge_duration_sec: float = Field(..., ge=100.0, le=25000.0, description="Discharge duration in seconds")
    internal_resistance_ohm: Optional[float] = Field(default=0.08, ge=0.001, le=5.0, description="Internal resistance (Ohms)")

class BatteryPredictionResponse(BaseModel):
    predicted_soh_percent: float
    condition_category: str
    condition_description: str
    supporting_measurements: dict
    model_version: str
    algorithm: str
    metrics: dict
    validation_strategy: str
    limitations: list[str]

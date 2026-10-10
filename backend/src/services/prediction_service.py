import numpy as np
import pandas as pd
from fastapi import HTTPException
from src.schemas.car import CarPredictionRequest, CarPredictionResponse, DepreciationInfo
from src.schemas.battery import BatteryPredictionRequest, BatteryPredictionResponse
from src.services.model_loader import registry

def get_condition_category(soh: float) -> tuple[str, str]:
    if soh >= 90.0:
        return "Excellent", "Near-original battery health. Minimal chemical degradation observed."
    elif soh >= 80.0:
        return "Good", "Normal operational degradation. Expected range retention for fleet driving."
    elif soh >= 70.0:
        return "Fair", "Noticeable capacity degradation. Modest reduction in vehicle operational range."
    else:
        return "Degraded", "End-of-life threshold reached (<70% capacity). Module reconditioning or replacement recommended."

class PredictionService:
    @staticmethod
    def predict_car_resale(request: CarPredictionRequest) -> CarPredictionResponse:
        if registry.car_model is None:
            raise HTTPException(
                status_code=503,
                detail="Car Resale Model artifact is not available. Ensure models have been trained."
            )
            
        # Current reference calculation year is 2024
        vehicle_age = max(0, 2024 - request.year)
        
        # Handle EV engine displacement (0.0 for pure electric)
        engine_cc = request.engine_cc
        if request.fuel.lower() == "electric" and (engine_cc is None or engine_cc == 0):
            engine_cc = 0.0
        elif engine_cc is None:
            engine_cc = 1248.0 # Default median combustion displacement
            
        mileage_kmpl = request.mileage_kmpl if request.mileage_kmpl is not None else 19.5
        max_power_bhp = request.max_power_bhp if request.max_power_bhp is not None else 84.0
        seats = request.seats if request.seats is not None else 5
        
        input_data = pd.DataFrame([{
            "brand": request.brand.strip().title(),
            "model": request.model.strip(),
            "year": request.year,
            "vehicle_age": vehicle_age,
            "km_driven": request.km_driven,
            "fuel": request.fuel.strip().title(),
            "seller_type": request.seller_type.strip().title(),
            "transmission": request.transmission.strip().title(),
            "owner": request.owner.strip().title(),
            "mileage_kmpl": mileage_kmpl,
            "engine_cc": engine_cc,
            "max_power_bhp": max_power_bhp,
            "seats": seats
        }])
        
        try:
            raw_pred = float(registry.car_model.predict(input_data)[0])
            predicted_price = float(round(max(raw_pred, 15000.0), 2))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Inference execution failed on car resale pipeline: {str(e)}"
            )
            
        # Calculate depreciation if original price is supplied
        depreciation_info = None
        if request.original_price and request.original_price > 0:
            diff = request.original_price - predicted_price
            pct = (diff / request.original_price) * 100.0
            depreciation_info = DepreciationInfo(
                original_price=float(request.original_price),
                depreciation_amount=float(round(diff, 2)),
                depreciation_percentage=float(round(pct, 2)),
                is_appreciation=diff < 0
            )
            
        metadata = registry.car_metadata or {}
        
        return CarPredictionResponse(
            estimated_resale_price=predicted_price,
            currency="INR",
            depreciation=depreciation_info,
            vehicle_summary={
                "brand": request.brand,
                "model": request.model,
                "year": request.year,
                "vehicle_age": vehicle_age,
                "km_driven": request.km_driven,
                "fuel": request.fuel,
                "transmission": request.transmission,
                "owner": request.owner
            },
            model_version=metadata.get("version", "1.0.0"),
            algorithm=metadata.get("algorithm", "Ridge Linear Regression (Log-Target)"),
            metrics=metadata.get("metrics", {}),
            limitations=metadata.get("limitations", [
                "Estimate derived from historical marketplace listings in Indian Rupees (INR).",
                "Actual transaction price depends on physical inspection and maintenance records."
            ])
        )

    @staticmethod
    def predict_battery_soh(request: BatteryPredictionRequest) -> BatteryPredictionResponse:
        if registry.battery_model is None:
            raise HTTPException(
                status_code=503,
                detail="EV Battery SOH Model artifact is not available. Ensure models have been trained."
            )
            
        input_data = pd.DataFrame([{
            "cycle": request.cycle,
            "ambient_temperature_c": request.ambient_temperature_c,
            "voltage_max_v": request.voltage_max_v,
            "voltage_min_v": request.voltage_min_v,
            "voltage_mean_v": request.voltage_mean_v,
            "voltage_std_v": request.voltage_std_v or 0.35,
            "current_mean_a": request.current_mean_a,
            "temp_max_c": request.temp_max_c,
            "temp_mean_c": request.temp_mean_c,
            "discharge_duration_sec": request.discharge_duration_sec,
            "internal_resistance_ohm": request.internal_resistance_ohm or 0.08
        }])
        
        try:
            raw_soh = float(registry.battery_model.predict(input_data)[0])
            predicted_soh = float(round(np.clip(raw_soh, 0.0, 100.0), 2))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Inference execution failed on battery SOH pipeline: {str(e)}"
            )
            
        category, desc = get_condition_category(predicted_soh)
        metadata = registry.battery_metadata or {}
        
        return BatteryPredictionResponse(
            predicted_soh_percent=predicted_soh,
            condition_category=category,
            condition_description=desc,
            supporting_measurements={
                "cycle_count": request.cycle,
                "ambient_temp_c": request.ambient_temperature_c,
                "voltage_spread_v": round(request.voltage_max_v - request.voltage_min_v, 3),
                "discharge_duration_minutes": round(request.discharge_duration_sec / 60.0, 2),
                "discharge_current_a": request.current_mean_a,
                "peak_temperature_c": request.temp_max_c
            },
            model_version=metadata.get("version", "1.0.0"),
            algorithm=metadata.get("algorithm", "XGBoost Regressor"),
            metrics=metadata.get("metrics", {}),
            validation_strategy=metadata.get("validation_strategy", "Zero-Leakage Cell Holdout"),
            limitations=metadata.get("limitations", [
                "Trained on NASA Ames 18650 Li-ion cell experimental aging profiles.",
                "Predictions reflect cell State of Health and should not replace OEM battery pack diagnostics."
            ])
        )

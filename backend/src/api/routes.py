from datetime import datetime, timezone
from fastapi import APIRouter
from src.schemas.car import CarPredictionRequest, CarPredictionResponse
from src.schemas.battery import BatteryPredictionRequest, BatteryPredictionResponse
from src.schemas.models_info import ModelsInfoResponse, ModelDetail
from src.services.prediction_service import PredictionService
from src.services.model_loader import registry

router = APIRouter()

@router.get("/health", tags=["System"])
def get_health():
    return {
        "status": "healthy",
        "service": "AutoCX Automotive Analytics API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "models_loaded": {
            "car_resale": registry.car_model is not None,
            "battery_soh": registry.battery_model is not None
        }
    }

@router.get("/models/info", response_model=ModelsInfoResponse, tags=["Models"])
def get_models_info():
    car_meta = registry.car_metadata or {}
    car_schema = registry.car_schema or {}
    
    bat_meta = registry.battery_metadata or {}
    bat_schema = registry.battery_schema or {}
    
    car_detail = ModelDetail(
        available=registry.car_model is not None,
        model_name=car_meta.get("model_name", "AutoCX Car Resale Regressor"),
        algorithm=car_meta.get("algorithm", "Ridge Linear Regression (Log-Target)"),
        version=car_meta.get("version", "1.0.0"),
        training_dataset=car_meta.get("training_dataset", "car_resale_processed.csv"),
        training_samples=car_meta.get("training_samples", 7120),
        test_samples=car_meta.get("test_samples", 1780),
        validation_strategy=car_meta.get("validation_strategy", "80/20 train/test split with log-target transformation"),
        metrics=car_meta.get("metrics", {}),
        all_candidate_metrics=car_meta.get("all_candidate_metrics", {}),
        feature_schema=car_schema,
        limitations=car_meta.get("limitations", [])
    )
    
    bat_detail = ModelDetail(
        available=registry.battery_model is not None,
        model_name=bat_meta.get("model_name", "AutoCX EV Battery SOH Estimator"),
        algorithm=bat_meta.get("algorithm", "XGBoost Regressor"),
        version=bat_meta.get("version", "1.0.0"),
        training_dataset=bat_meta.get("training_dataset", "battery_soh_processed.csv (NASA PCoE)"),
        training_samples=bat_meta.get("training_samples", 2189),
        test_samples=bat_meta.get("test_samples", 245),
        validation_strategy=bat_meta.get("validation_strategy", "Zero-Leakage Cell-Holdout Validation"),
        metrics=bat_meta.get("metrics", {}),
        all_candidate_metrics=bat_meta.get("all_candidate_metrics", {}),
        feature_schema=bat_schema,
        limitations=bat_meta.get("limitations", [])
    )
    
    return ModelsInfoResponse(
        car_resale_model=car_detail,
        battery_soh_model=bat_detail,
        environment="production"
    )

@router.get("/models/schema/car", tags=["Models"])
def get_car_schema():
    return registry.car_schema or {}

@router.get("/models/catalog/car", tags=["Models"])
def get_car_catalog():
    return registry.car_catalog or {}

@router.get("/models/schema/battery", tags=["Models"])
def get_battery_schema():
    return registry.battery_schema or {}

@router.post("/predict/car-value", response_model=CarPredictionResponse, tags=["Inference"])
def predict_car_value(request: CarPredictionRequest):
    return PredictionService.predict_car_resale(request)

@router.post("/predict/battery-health", response_model=BatteryPredictionResponse, tags=["Inference"])
def predict_battery_health(request: BatteryPredictionRequest):
    return PredictionService.predict_battery_soh(request)

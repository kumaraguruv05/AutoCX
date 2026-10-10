import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "AutoCX — Auto ChronAx API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Base paths
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    MODELS_DIR: str = os.path.join(BASE_DIR, "models")
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    
    # Model Artifact Paths
    CAR_MODEL_PATH: str = os.path.join(MODELS_DIR, "car_resale_model.joblib")
    CAR_SCHEMA_PATH: str = os.path.join(MODELS_DIR, "car_resale_schema.json")
    CAR_METADATA_PATH: str = os.path.join(MODELS_DIR, "car_resale_metadata.json")
    
    BATTERY_MODEL_PATH: str = os.path.join(MODELS_DIR, "battery_soh_model.joblib")
    BATTERY_SCHEMA_PATH: str = os.path.join(MODELS_DIR, "battery_soh_schema.json")
    BATTERY_METADATA_PATH: str = os.path.join(MODELS_DIR, "battery_soh_metadata.json")
    
    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

settings = Settings()

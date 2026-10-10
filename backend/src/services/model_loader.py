import json
import os
import joblib
from src.config.settings import settings

class ModelRegistry:
    def __init__(self):
        self.car_model = None
        self.car_schema = None
        self.car_metadata = None
        
        self.battery_model = None
        self.battery_schema = None
        self.battery_metadata = None
        
        self.is_loaded = False

    def load_models(self):
        print("Loading AutoCX Machine Learning models and schemas...")
        
        # 1. Car Resale Model
        if os.path.exists(settings.CAR_MODEL_PATH):
            self.car_model = joblib.load(settings.CAR_MODEL_PATH)
            print(f"  Loaded Car Model from {settings.CAR_MODEL_PATH}")
        else:
            print(f"  WARNING: Car model artifact not found at {settings.CAR_MODEL_PATH}")
            
        if os.path.exists(settings.CAR_SCHEMA_PATH):
            with open(settings.CAR_SCHEMA_PATH, "r", encoding="utf-8") as f:
                self.car_schema = json.load(f)
                
        if os.path.exists(settings.CAR_METADATA_PATH):
            with open(settings.CAR_METADATA_PATH, "r", encoding="utf-8") as f:
                self.car_metadata = json.load(f)
                
        # 2. Battery SOH Model
        if os.path.exists(settings.BATTERY_MODEL_PATH):
            self.battery_model = joblib.load(settings.BATTERY_MODEL_PATH)
            print(f"  Loaded Battery Model from {settings.BATTERY_MODEL_PATH}")
        else:
            print(f"  WARNING: Battery model artifact not found at {settings.BATTERY_MODEL_PATH}")
            
        if os.path.exists(settings.BATTERY_SCHEMA_PATH):
            with open(settings.BATTERY_SCHEMA_PATH, "r", encoding="utf-8") as f:
                self.battery_schema = json.load(f)
                
        if os.path.exists(settings.BATTERY_METADATA_PATH):
            with open(settings.BATTERY_METADATA_PATH, "r", encoding="utf-8") as f:
                self.battery_metadata = json.load(f)
                
        self.is_loaded = True
        print("Model loading complete.")

registry = ModelRegistry()

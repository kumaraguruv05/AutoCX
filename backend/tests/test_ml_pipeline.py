import os
import joblib
import numpy as np
import pandas as pd
from src.config.settings import settings

def test_raw_archives_preserved():
    root_dir = os.path.abspath(os.path.join(settings.BASE_DIR, ".."))
    car_zip = os.path.join(root_dir, "Car Data.zip")
    battery_zip = os.path.join(root_dir, "5.+Battery+Data+Set.zip")
    assert os.path.exists(car_zip), "Car Data.zip archive must be preserved"
    assert os.path.exists(battery_zip), "5.+Battery+Data+Set.zip archive must be preserved"
    assert os.path.getsize(car_zip) > 100000
    assert os.path.getsize(battery_zip) > 100000000

def test_processed_car_dataset():
    path = os.path.join(settings.DATA_DIR, "processed", "car_resale_processed.csv")
    assert os.path.exists(path), "Processed car resale dataset must exist"
    df = pd.read_csv(path)
    assert len(df) > 8000
    required_cols = ["brand", "model", "year", "km_driven", "fuel", "selling_price"]
    for col in required_cols:
        assert col in df.columns
    assert (df["selling_price"] > 0).all()
    assert (df["km_driven"] > 0).all()

def test_processed_battery_dataset():
    path = os.path.join(settings.DATA_DIR, "processed", "battery_soh_processed.csv")
    assert os.path.exists(path), "Processed battery SOH dataset must exist"
    df = pd.read_csv(path)
    assert len(df) > 2000
    assert df["cell_id"].nunique() >= 30
    assert (df["soh_percent"] >= 30.0).all()
    assert (df["soh_percent"] <= 110.0).all()

def test_car_model_inference():
    assert os.path.exists(settings.CAR_MODEL_PATH)
    pipeline = joblib.load(settings.CAR_MODEL_PATH)
    sample = pd.DataFrame([{
        "brand": "Hyundai",
        "model": "Creta",
        "year": 2018,
        "vehicle_age": 6,
        "km_driven": 50000,
        "fuel": "Diesel",
        "seller_type": "Individual",
        "transmission": "Manual",
        "owner": "First Owner",
        "mileage_kmpl": 19.6,
        "engine_cc": 1582.0,
        "max_power_bhp": 126.0,
        "seats": 5
    }])
    pred = pipeline.predict(sample)[0]
    assert np.isfinite(pred)
    assert pred > 50000.0

def test_battery_model_inference():
    assert os.path.exists(settings.BATTERY_MODEL_PATH)
    pipeline = joblib.load(settings.BATTERY_MODEL_PATH)
    sample = pd.DataFrame([{
        "cycle": 80,
        "ambient_temperature_c": 24.0,
        "voltage_max_v": 4.18,
        "voltage_min_v": 2.48,
        "voltage_mean_v": 3.40,
        "voltage_std_v": 0.36,
        "current_mean_a": 2.0,
        "temp_max_c": 37.0,
        "temp_mean_c": 32.0,
        "discharge_duration_sec": 3050.0,
        "internal_resistance_ohm": 0.085
    }])
    pred = pipeline.predict(sample)[0]
    assert np.isfinite(pred)
    assert 0.0 <= pred <= 100.0

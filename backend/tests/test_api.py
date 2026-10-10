import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.services.model_loader import registry

@pytest.fixture(scope="module")
def client():
    # Trigger model loading
    registry.load_models()
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "AutoCX Automotive Analytics API"
    assert "models_loaded" in data
    assert data["models_loaded"]["car_resale"] is True
    assert data["models_loaded"]["battery_soh"] is True

def test_models_info_endpoint(client):
    response = client.get("/api/models/info")
    assert response.status_code == 200
    data = response.json()
    assert "car_resale_model" in data
    assert "battery_soh_model" in data
    
    car = data["car_resale_model"]
    assert car["available"] is True
    assert car["training_samples"] > 5000
    assert "metrics" in car
    assert car["metrics"]["r2"] > 0.80
    
    battery = data["battery_soh_model"]
    assert battery["available"] is True
    assert battery["training_samples"] > 1000
    assert "metrics" in battery
    assert battery["metrics"]["r2"] > 0.80

def test_predict_car_value_petrol(client):
    payload = {
        "brand": "Maruti",
        "model": "Swift Dzire",
        "year": 2017,
        "km_driven": 45000,
        "fuel": "Petrol",
        "seller_type": "Individual",
        "transmission": "Manual",
        "owner": "First Owner",
        "mileage_kmpl": 22.0,
        "engine_cc": 1197.0,
        "max_power_bhp": 82.0,
        "seats": 5,
        "original_price": 750000.0
    }
    response = client.post("/api/predict/car-value", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["currency"] == "INR"
    assert data["estimated_resale_price"] > 50000.0
    assert data["depreciation"] is not None
    assert data["depreciation"]["original_price"] == 750000.0
    assert data["depreciation"]["depreciation_amount"] > 0
    assert 0 < data["depreciation"]["depreciation_percentage"] < 100

def test_predict_car_value_electric(client):
    payload = {
        "brand": "Tata",
        "model": "Nexon EV",
        "year": 2021,
        "km_driven": 25000,
        "fuel": "Electric",
        "seller_type": "Individual",
        "transmission": "Automatic",
        "owner": "First Owner",
        "seats": 5,
        "original_price": 1600000.0
    }
    response = client.post("/api/predict/car-value", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["estimated_resale_price"] > 200000.0
    assert data["depreciation"]["depreciation_percentage"] > 0

def test_predict_car_value_invalid_input(client):
    # Year before 1980
    payload = {
        "brand": "Maruti",
        "model": "800",
        "year": 1950,
        "km_driven": 50000,
        "fuel": "Petrol",
        "transmission": "Manual"
    }
    response = client.post("/api/predict/car-value", json=payload)
    assert response.status_code == 422

def test_predict_battery_soh_valid(client):
    payload = {
        "cycle": 50,
        "ambient_temperature_c": 24.0,
        "voltage_max_v": 4.19,
        "voltage_min_v": 2.50,
        "voltage_mean_v": 3.45,
        "voltage_std_v": 0.38,
        "current_mean_a": 2.0,
        "temp_max_c": 36.5,
        "temp_mean_c": 31.2,
        "discharge_duration_sec": 3200.0,
        "internal_resistance_ohm": 0.082
    }
    response = client.post("/api/predict/battery-health", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_soh_percent" in data
    assert 40.0 <= data["predicted_soh_percent"] <= 100.0
    assert data["condition_category"] in ["Excellent", "Good", "Fair", "Degraded"]
    assert "condition_description" in data
    assert "supporting_measurements" in data

def test_predict_battery_soh_invalid_cycle(client):
    # Negative/zero cycle number
    payload = {
        "cycle": 0,
        "voltage_max_v": 4.2,
        "voltage_min_v": 2.5,
        "voltage_mean_v": 3.4,
        "current_mean_a": 2.0,
        "temp_max_c": 35.0,
        "temp_mean_c": 30.0,
        "discharge_duration_sec": 3000.0
    }
    response = client.post("/api/predict/battery-health", json=payload)
    assert response.status_code == 422

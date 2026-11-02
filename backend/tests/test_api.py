import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.services.model_loader import registry

@pytest.fixture(scope="module")
def client():
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
    assert car["metrics"]["r2"] > 0.70
    
    battery = data["battery_soh_model"]
    assert battery["available"] is True
    assert battery["training_samples"] > 1000
    assert "metrics" in battery
    assert battery["metrics"]["r2"] > 0.50

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
    # Strict sum conservation
    dep = data["depreciation"]
    assert abs((dep["residual_retention_percentage"] + dep["depreciation_percentage"]) - 100.0) < 0.01

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
    assert data["condition_category"] in ["Excellent", "Good", "Degraded — Inspection Recommended", "Critical — Professional Inspection Required"]
    assert "condition_description" in data
    assert "supporting_measurements" in data

def test_predict_battery_soh_invalid_cycle(client):
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

def test_predict_maruti_800_microcar_overvaluation_fixed(client):
    payload = {
        "brand": "Maruti",
        "model": "800 AC",
        "year": 2014,
        "km_driven": 100000,
        "fuel": "Petrol",
        "transmission": "Manual",
        "owner": "First Owner",
        "original_price": 235000.0
    }
    response = client.post("/api/predict/car-value", json=payload)
    assert response.status_code == 200
    data = response.json()
    price = data["estimated_resale_price"]
    assert 30000.0 <= price <= 75000.0
    assert data["vehicle_summary"]["segment"] == "Micro / Entry Hatchback"
    assert len(data["vehicle_summary"]["guardrails_applied"]) > 0

def test_predict_ford_endeavour_suv_undervaluation_fixed(client):
    payload = {
        "brand": "Ford",
        "model": "Endeavour 3.2",
        "year": 2018,
        "km_driven": 80000,
        "fuel": "Diesel",
        "transmission": "Automatic",
        "owner": "First Owner",
        "original_price": 4100000.0
    }
    response = client.post("/api/predict/car-value", json=payload)
    assert response.status_code == 200
    data = response.json()
    price = data["estimated_resale_price"]
    assert price >= 1850000.0
    assert price <= 2800000.0
    assert data["vehicle_summary"]["segment"] == "Full-Size / Premium SUV"

def test_car_catalog_endpoint(client):
    response = client.get("/api/models/catalog/car")
    assert response.status_code == 200
    catalog = response.json()
    assert len(catalog) > 1000
    assert "Maruti::800 AC" in catalog
    m800 = catalog["Maruti::800 AC"]
    assert m800["year_max"] <= 2014
    assert m800["segment"] == "Micro / Entry Hatchback"
    assert "Ford::Endeavour 3.2" in catalog

def test_ev_valuation_battery_soh_diagnostics(client):
    base_payload = {
        "brand": "Tata",
        "model": "Nexon EV",
        "year": 2021,
        "km_driven": 35000,
        "fuel": "Electric",
        "transmission": "Automatic",
        "owner": "First Owner",
        "seats": 5,
        "original_price": 1600000.0
    }
    
    # 1. Healthy Battery (94% SOH)
    payload_healthy = {**base_payload, "battery_soh": 94.0}
    res_healthy = client.post("/api/predict/car-value", json=payload_healthy)
    assert res_healthy.status_code == 200
    data_healthy = res_healthy.json()
    
    impact_healthy = data_healthy["battery_valuation_impact"]
    assert impact_healthy is not None
    assert impact_healthy["battery_soh"] == 94.0
    assert impact_healthy["condition_category"] == "Excellent"
    assert impact_healthy["replacement_risk"] == "Normal"
    
    # 2. Degraded Battery (72% SOH)
    payload_degraded = {**base_payload, "battery_soh": 72.0}
    res_degraded = client.post("/api/predict/car-value", json=payload_degraded)
    assert res_degraded.status_code == 200
    data_degraded = res_degraded.json()
    
    impact_degraded = data_degraded["battery_valuation_impact"]
    assert impact_degraded is not None
    assert impact_degraded["battery_soh"] == 72.0
    assert impact_degraded["replacement_risk"] == "Degraded — inspection recommended"
    
    # Vehicle price calculated like rest of cars (zero penalty from battery SOH)
    assert data_healthy["estimated_resale_price"] == data_degraded["estimated_resale_price"]

def test_ice_vehicle_unaffected_by_battery_soh(client):
    payload = {
        "brand": "Maruti",
        "model": "Swift",
        "year": 2019,
        "km_driven": 40000,
        "fuel": "Petrol",
        "transmission": "Manual",
        "battery_soh": 95.0
    }
    res = client.post("/api/predict/car-value", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["battery_valuation_impact"] is None
    assert data["vehicle_summary"]["battery_soh"] is None

# ==============================================================================
# SECTION 7: SPECIFIED REGRESSION CASES
# ==============================================================================

def test_case_a_moderate_degradation(client):
    """
    Case A — moderate degradation
    Tata Nexon EV XZ+, Year 2020, 75,000 km, Second owner, Electric,
    Original invoice: Rs 17,40,000, Experimental SOH: 78.9%
    """
    payload = {
        "brand": "Tata",
        "model": "Nexon EV",
        "year": 2020,
        "km_driven": 75000,
        "fuel": "Electric",
        "seller_type": "Individual",
        "transmission": "Automatic",
        "owner": "Second Owner",
        "original_price": 1740000.0,
        "battery_soh": 78.9
    }
    res = client.post("/api/predict/car-value", json=payload)
    assert res.status_code == 200
    data = res.json()
    
    # Authoritative calculation flow:
    assert "base_vehicle_value" in data
    assert "battery_adjustment" in data
    assert "estimated_resale_price" in data
    
    base_val = data["base_vehicle_value"]
    battery_adj = data["battery_adjustment"]
    final_val = data["estimated_resale_price"]
    
    # Decoupled EV pricing: battery_adjustment is 0.0, final_resale_value derived from automotive market parameters
    assert battery_adj == 0.0
    assert final_val == base_val
    
    # Diagnostic battery health evaluation (without price penalty)
    impact = data["battery_valuation_impact"]
    assert impact["battery_soh"] == 78.9
    assert impact["replacement_risk"] == "Degraded — inspection recommended"
    assert impact["adjustment_inr"] == 0.0
    
    # Financial arithmetic consistency
    dep = data["depreciation"]
    assert dep["original_price"] == 1740000.0
    assert abs(dep["depreciation_amount"] - (1740000.0 - final_val)) <= 1.0
    assert abs((dep["residual_retention_percentage"] + dep["depreciation_percentage"]) - 100.0) < 0.01
    
    # Loss velocity consistency
    age = 2026 - 2020
    assert abs(dep["annualized_loss"] - round(dep["depreciation_amount"] / age, 2)) <= 1.0
    assert abs(dep["value_cost_per_km"] - round(dep["depreciation_amount"] / 75000.0, 2)) <= 0.05

def test_brand_provenance_maruti_vs_german_luxury(client):
    """Maruti/Toyota retain higher residual percentage compared to German luxury out-of-warranty"""
    maruti_payload = {
        "brand": "Maruti",
        "model": "Swift",
        "year": 2018,
        "km_driven": 60000,
        "fuel": "Petrol",
        "transmission": "Manual",
        "owner": "First Owner",
        "original_price": 700000.0
    }
    bmw_payload = {
        "brand": "Bmw",
        "model": "3 Series",
        "year": 2018,
        "km_driven": 60000,
        "fuel": "Petrol",
        "transmission": "Automatic",
        "owner": "First Owner",
        "original_price": 4500000.0
    }
    res_maruti = client.post("/api/predict/car-value", json=maruti_payload).json()
    res_bmw = client.post("/api/predict/car-value", json=bmw_payload).json()
    
    maruti_retention = res_maruti["depreciation"]["residual_retention_percentage"]
    bmw_retention = res_bmw["depreciation"]["residual_retention_percentage"]
    
    # High-retention brand retains higher % of its original invoice than steep-depreciation luxury brand
    assert maruti_retention > bmw_retention
    # Check guardrail messages
    assert any("strong secondary value retention" in g for g in res_maruti["vehicle_summary"]["guardrails_applied"])
    assert any("steep out-of-warranty market depreciation" in g for g in res_bmw["vehicle_summary"]["guardrails_applied"])

def test_case_b_severe_degradation(client):
    """
    Case B — severe degradation
    Tata Nexon EV XZ+, Year 2020, 120,000 km, First owner, Electric,
    Original invoice: Rs 17,40,000, Experimental SOH: 46.7%
    """
    payload = {
        "brand": "Tata",
        "model": "Nexon EV",
        "year": 2020,
        "km_driven": 120000,
        "fuel": "Electric",
        "seller_type": "Individual",
        "transmission": "Automatic",
        "owner": "First Owner",
        "original_price": 1740000.0,
        "battery_soh": 46.7
    }
    res = client.post("/api/predict/car-value", json=payload)
    assert res.status_code == 200
    data = res.json()
    
    impact = data["battery_valuation_impact"]
    assert impact is not None
    assert impact["battery_soh"] == 46.7
    
    # Risk classification: Critical — professional inspection required
    # MUST NOT automatically declare "Replacement required" merely from an SOH estimate
    assert impact["replacement_risk"] == "Critical — professional inspection required"
    assert impact["replacement_risk"] != "Replacement required"
    
    # Repair cost tiers must be informational, NOT deducted automatically
    assert impact["repair_cost_tiers"] is not None
    assert len(impact["repair_cost_tiers"]) == 3
    for tier in impact["repair_cost_tiers"]:
        assert tier["is_deducted_from_resale"] is False
        
    # Prevent quadruple stacked penalty (car price must not be crushed below reasonable market bounds)
    final_val = data["estimated_resale_price"]
    assert final_val >= 550000.0, f"Expected final price >= 5.5L without double counting, got {final_val}"
    
    # Financial conservation
    dep = data["depreciation"]
    assert abs((dep["residual_retention_percentage"] + dep["depreciation_percentage"]) - 100.0) < 0.01
    assert abs(dep["depreciation_amount"] - (1740000.0 - final_val)) <= 1.0

# ==============================================================================
# GENERAL AUTOMATED TESTS
# ==============================================================================

def test_missing_battery_data_no_fabrication(client):
    """Missing battery data never generates fabricated SOH or inspection readings"""
    payload = {
        "brand": "Tata",
        "model": "Nexon EV",
        "year": 2022,
        "km_driven": 20000,
        "fuel": "Electric",
        "transmission": "Automatic"
        # No battery_soh provided
    }
    res = client.post("/api/predict/car-value", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["vehicle_summary"]["battery_soh"] is None
    # No fabricated battery impact when SOH is omitted
    assert data["battery_valuation_impact"] is None

def test_idempotent_predictions(client):
    """Identical inputs and model versions produce identical results"""
    payload = {
        "brand": "Hyundai",
        "model": "Creta",
        "year": 2019,
        "km_driven": 50000,
        "fuel": "Diesel",
        "transmission": "Manual",
        "owner": "First Owner",
        "original_price": 1400000.0
    }
    res1 = client.post("/api/predict/car-value", json=payload).json()
    res2 = client.post("/api/predict/car-value", json=payload).json()
    assert res1["estimated_resale_price"] == res2["estimated_resale_price"]
    assert res1["depreciation"]["depreciation_amount"] == res2["depreciation"]["depreciation_amount"]

def test_monotonic_mileage_behavior(client):
    """Higher mileage on the same vehicle produces lower or equal resale price"""
    base = {
        "brand": "Honda",
        "model": "City",
        "year": 2018,
        "fuel": "Petrol",
        "transmission": "Manual",
        "owner": "First Owner"
    }
    res_low = client.post("/api/predict/car-value", json={**base, "km_driven": 30000}).json()
    res_high = client.post("/api/predict/car-value", json={**base, "km_driven": 90000}).json()
    assert res_low["estimated_resale_price"] >= res_high["estimated_resale_price"]

def test_battery_adjustment_continuity_monotonicity(client):
    """Battery adjustments do not cause unexplained discontinuities around arbitrary thresholds"""
    base = {
        "brand": "Tata",
        "model": "Nexon EV",
        "year": 2021,
        "km_driven": 40000,
        "fuel": "Electric",
        "transmission": "Automatic",
        "original_price": 1600000.0
    }
    prices = []
    soh_levels = [95.0, 85.0, 75.0, 65.0, 50.0]
    for soh in soh_levels:
        res = client.post("/api/predict/car-value", json={**base, "battery_soh": soh}).json()
        prices.append(res["estimated_resale_price"])
        
    # Prices must decline monotonically as SOH degrades
    for i in range(len(prices) - 1):
        assert prices[i] >= prices[i+1], f"Expected price at {soh_levels[i]}% >= {soh_levels[i+1]}%, got {prices[i]} vs {prices[i+1]}"

def test_chassis_floor_safeguard(client):
    """Deepest battery degradation (e.g. 10% SOH) is protected by the rolling chassis floor safeguard"""
    payload = {
        "brand": "Tata",
        "model": "Nexon EV",
        "year": 2020,
        "km_driven": 150000,
        "fuel": "Electric",
        "transmission": "Automatic",
        "original_price": 1740000.0,
        "battery_soh": 10.0
    }
    res = client.post("/api/predict/car-value", json=payload)
    assert res.status_code == 200
    data = res.json()
    impact = data["battery_valuation_impact"]
    chassis_floor = impact["chassis_floor_inr"]
    assert chassis_floor >= 300000.0
    assert data["estimated_resale_price"] >= chassis_floor

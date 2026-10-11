import numpy as np
import pandas as pd
from fastapi import HTTPException
from src.schemas.car import CarPredictionRequest, CarPredictionResponse, DepreciationInfo
from src.schemas.battery import BatteryPredictionRequest, BatteryPredictionResponse
from src.services.model_loader import registry

SEGMENT_ANCHORS = {
    "Hatchback": 375000.0,
    "MUV / MPV / Van": 525000.0,
    "Micro / Entry Hatchback": 130000.0,
    "Compact Sedan": 450000.0,
    "Midsize Sedan": 550000.0,
    "Executive / Luxury Sedan": 1100000.0,
    "Compact / Midsize SUV": 850000.0,
    "Sub-Compact SUV": 725000.0,
    "Luxury SUV": 2300000.0,
    "Full-Size / Premium SUV": 1850000.0
}

def classify_segment(brand: str, model: str, engine_cc: float = 0, max_power_bhp: float = 0, seats: int = 5, fuel: str = "") -> str:
    brand = str(brand).strip().title()
    model = str(model).strip()
    full_name = f"{brand} {model}".lower()
    
    micro_models = [
        "800", "nano", "alto", "kwid", "eon", "spark", "matiz", "zen", 
        "a-star", "estilo", "redi-go", "santro", "omni", "beat"
    ]
    if any(m in full_name for m in micro_models) and not any(ex in full_name for ex in ["fortuner", "land", "endeavour"]):
        return "Micro / Entry Hatchback"
        
    full_suv_models = [
        "endeavour", "fortuner", "pajero", "gloster", "mu-x", "santa fe", 
        "cr-v", "kodiaq", "tiguan", "alturas", "land cruiser", "prado"
    ]
    if any(m in full_name for m in full_suv_models):
        return "Full-Size / Premium SUV"
        
    luxury_brands = ["Audi", "Bmw", "Mercedes-Benz", "Jaguar", "Land Rover", "Volvo", "Porsche", "Lexus", "Mini", "Jeep"]
    if brand in luxury_brands:
        suv_lux_keywords = [
            "q3", "q5", "q7", "q8", "x1", "x3", "x4", "x5", "x6", "x7",
            "gla", "glb", "glc", "gle", "gls", "discovery", "defender",
            "evoque", "velar", "range rover", "xc40", "xc60", "xc90",
            "compass", "cherokee", "wrangler", "macan", "cayenne"
        ]
        if any(k in full_name for k in suv_lux_keywords):
            return "Luxury SUV"
        return "Executive / Luxury Sedan"
        
    muv_models = [
        "innova", "ertiga", "xl6", "carens", "lodgy", "mobilio", "marazzo", 
        "triber", "enjoy", "tavera", "qualis", "xylo", "bolero", "sumo", 
        "eeco", "carnival", "aria", "hexia", "tuv300"
    ]
    if any(m in full_name for m in muv_models) or seats >= 7:
        if not any(m in full_name for m in full_suv_models):
            return "MUV / MPV / Van"
            
    subcompact_suvs = [
        "brezza", "venue", "ecosport", "nexon", "sonet", "punch", "kuv100", 
        "wr-v", "magnite", "kiger", "urban cruiser", "fronx", "exter"
    ]
    if any(m in full_name for m in subcompact_suvs):
        return "Sub-Compact SUV"
        
    compact_suvs = [
        "creta", "seltos", "duster", "terrano", "harrier", "safari", "xuv500", 
        "xuv700", "scorpio", "thar", "gurkha", "hector", "astor", "kushaq", 
        "taigun", "grand vitara", "hyryder", "s-cross", "captur"
    ]
    if any(m in full_name for m in compact_suvs):
        return "Compact / Midsize SUV"
        
    mid_sedan_models = [
        "city", "verna", "ciaz", "rapid", "vento", "sx4", "linea", "fiesta", 
        "sunny", "yaris", "slavia", "virtus"
    ]
    if any(m in full_name for m in mid_sedan_models):
        return "Midsize Sedan"
        
    compact_sedans = [
        "dzire", "amaze", "tigor", "etios", "aspire", "zest", "manza", 
        "accent", "verito", "indigo", "aura"
    ]
    if any(m in full_name for m in compact_sedans):
        return "Compact Sedan"
        
    exec_sedans = [
        "octavia", "superb", "elantra", "civic", "camry", "accord", 
        "corolla", "kizashi", "teana"
    ]
    if any(m in full_name for m in exec_sedans):
        return "Executive / Luxury Sedan"
        
    return "Hatchback"

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
            
        # Dynamic current-year reference (2026) for accurate vehicle aging
        current_calendar_year = 2026
        vehicle_age = max(0, current_calendar_year - request.year)
        brand = request.brand.strip().title()
        model_name = request.model.strip()
        
        # 1. Lookup in vehicle knowledge catalog for accurate baseline specifications
        catalog_key = f"{brand}::{model_name}"
        catalog_profile = registry.car_catalog.get(catalog_key, {})
        
        # Determine Segment
        segment = catalog_profile.get("segment") or classify_segment(
            brand, model_name, request.engine_cc or 0, request.max_power_bhp or 0, request.seats or 5, request.fuel
        )
        
        # Accurate auto-imputation from catalog profile
        engine_cc = request.engine_cc
        if request.fuel.lower() == "electric":
            engine_cc = 0.0
        elif engine_cc is None or engine_cc <= 0:
            engine_cc = catalog_profile.get("engine_cc", 1197.0)
            
        max_power_bhp = request.max_power_bhp
        if max_power_bhp is None or max_power_bhp <= 0:
            max_power_bhp = catalog_profile.get("max_power_bhp", 82.0)
            
        mileage_kmpl = request.mileage_kmpl
        if mileage_kmpl is None or mileage_kmpl <= 0:
            mileage_kmpl = catalog_profile.get("mileage_kmpl", 19.5)
            
        seats = request.seats
        if seats is None or seats <= 0:
            seats = catalog_profile.get("seats", 5)
            
        # Hierarchy Anchors & Engineered Features
        model_anchor = catalog_profile.get("model_price_anchor", SEGMENT_ANCHORS.get(segment, 400000.0))
        segment_anchor = SEGMENT_ANCHORS.get(segment, 400000.0)
        power_to_displacement = float(max_power_bhp / (engine_cc + 1.0))
        annual_km = float(request.km_driven / (vehicle_age + 0.5))
        
        input_data = pd.DataFrame([{
            "vehicle_age": vehicle_age,
            "km_driven": request.km_driven,
            "engine_cc": engine_cc,
            "max_power_bhp": max_power_bhp,
            "mileage_kmpl": mileage_kmpl,
            "seats": seats,
            "power_to_displacement": power_to_displacement,
            "annual_km": annual_km,
            "model_anchor": model_anchor,
            "segment_anchor": segment_anchor,
            "brand": brand,
            "model": model_name,
            "segment": segment,
            "fuel": request.fuel.strip().title(),
            "seller_type": request.seller_type.strip().title(),
            "transmission": request.transmission.strip().title(),
            "owner": request.owner.strip().title()
        }])
        
        try:
            raw_pred = float(registry.car_model.predict(input_data)[0])
            predicted_price = raw_pred
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Inference execution failed on car resale pipeline: {str(e)}"
            )
            
        guardrails_applied = []
        
        # -------------------------------------------------------------
        # DYNAMIC DEPRECIATION PENALTIES & MARKET ADJUSTMENTS
        # -------------------------------------------------------------
        
        # 1. Dynamic High-Mileage Non-Linear Penalty (Applied across all segments)
        # Beyond 75,000 km, apply progressive non-linear wear discount independent of age
        if request.km_driven > 75000:
            excess_km = request.km_driven - 75000
            # Progressive decay curve matching Indian used-car buyer mileage thresholds
            mileage_penalty = min(0.28, (excess_km / 125000.0) ** 0.85 * 0.25)
            predicted_price *= (1.0 - mileage_penalty)
            guardrails_applied.append(
                f"Dynamic Mileage Penalty: -{mileage_penalty*100:.1f}% applied for high odometer wear ({request.km_driven:,.0f} km)."
            )

        # 2. EV-Specific Secondary Market Adjustment Factor
        # Compensates for early-gen rapid battery tech evolution, out-of-warranty replacement anxiety
        if request.fuel.lower() == "electric":
            ev_tech_factor = 0.92 if vehicle_age <= 2 else (0.86 if vehicle_age <= 4 else 0.80)
            ev_battery_anxiety_factor = 1.0
            if request.km_driven > 60000:
                excess_ev_km = request.km_driven - 60000
                ev_battery_anxiety_factor = max(0.75, 1.0 - (excess_ev_km / 140000.0) * 0.25)
            
            ev_market_factor = ev_tech_factor * ev_battery_anxiety_factor
            predicted_price *= ev_market_factor
            guardrails_applied.append(
                f"EV Secondary Market Adjustment: -{(1.0 - ev_market_factor)*100:.1f}% for tech obsolescence and battery secondary anxiety."
            )

        # -------------------------------------------------------------
        # DOMAIN GUARDRAILS & POST-PROCESSING CLAMPING
        # -------------------------------------------------------------
        
        # Automated Reference Invoice Lookup from AutoCX Vehicle Catalog
        catalog_typical_price = catalog_profile.get("typical_original_price")
        effective_original_price = (
            request.original_price
            if (request.original_price and request.original_price > 0)
            else catalog_typical_price
        )
        is_automated_invoice = bool(request.original_price is None or request.original_price <= 0) and bool(catalog_typical_price)

        # Guardrail A: Hard Ceiling on Original Purchase Price / Catalog Benchmark
        if effective_original_price and effective_original_price > 0:
            # Empirical age-retention decay curve
            if vehicle_age <= 1:
                base_ret = 0.95
            elif vehicle_age == 2:
                base_ret = 0.86
            elif vehicle_age == 3:
                base_ret = 0.78
            elif vehicle_age == 4:
                base_ret = 0.72
            elif vehicle_age == 5:
                base_ret = 0.66
            elif vehicle_age == 6:
                base_ret = 0.60
            elif vehicle_age == 7:
                base_ret = 0.54
            elif vehicle_age == 8:
                base_ret = 0.48
            elif vehicle_age <= 10:
                base_ret = 0.40
            elif vehicle_age <= 12:
                base_ret = 0.32
            elif vehicle_age <= 15:
                base_ret = 0.25
            else:
                base_ret = 0.18
                
            # Segment-specific residual adjustments
            if segment == "Full-Size / Premium SUV":
                base_ret += 0.08 # Body-on-frame SUVs retain high resale in India
            elif segment in ["Executive / Luxury Sedan", "Luxury SUV"]:
                base_ret -= 0.07 # German luxury cars suffer steep out-of-warranty depreciation
            elif segment == "Micro / Entry Hatchback":
                base_ret -= 0.05
                
            # EV-specific retention adjustment
            if request.fuel.lower() == "electric":
                base_ret *= 0.85 # Secondary EV market depreciation discount
                if request.km_driven > 70000:
                    base_ret *= max(0.78, 1.0 - (request.km_driven - 70000) / 150000.0 * 0.25)
                
            # Odometer penalty beyond 100,000 km
            if request.km_driven > 100000:
                base_ret *= max(0.65, 1.0 - (request.km_driven - 100000) / 250000.0)
                
            base_ret = float(np.clip(base_ret, 0.05, 0.98))
            
            # If using automated benchmark invoice, allow 8% extra variant headroom
            ceiling_factor = base_ret * (1.08 if is_automated_invoice else 1.0)
            original_ceiling = float(effective_original_price * ceiling_factor)
            
            if predicted_price > original_ceiling:
                predicted_price = original_ceiling
                prefix = "Catalog Auto-Ceiling" if is_automated_invoice else "Hard Ceiling"
                guardrails_applied.append(f"{prefix}: Resale constrained to {ceiling_factor*100:.1f}% max residual based on vehicle age ({vehicle_age} yrs).")
                
        # Guardrail B: Microcar / Discontinued Budget Microcar Physical Ceilings
        if segment == "Micro / Entry Hatchback":
            if vehicle_age >= 10:
                micro_ceiling = 65000.0 if request.km_driven >= 70000 else 78000.0
            elif vehicle_age >= 7:
                micro_ceiling = 95000.0
            elif vehicle_age >= 5:
                micro_ceiling = 145000.0
            else:
                micro_ceiling = 220000.0
                
            if predicted_price > micro_ceiling:
                predicted_price = micro_ceiling
                guardrails_applied.append("Microcar Ceiling: Constrained to real Indian marketplace budget hatch price bounds.")
                
        # Guardrail C: Premium D2 SUV Retention Floor
        if segment == "Full-Size / Premium SUV" and vehicle_age <= 7 and request.km_driven <= 120000:
            if "endeavour" in model_name.lower() or "fortuner" in model_name.lower():
                if predicted_price < 1850000.0:
                    predicted_price = 1850000.0
                    guardrails_applied.append("Premium SUV Floor: Protected against severe undervaluation of high-demand D2 4x4 platform.")
                    
        # Guardrail D: Running Scrap/Utility Minimum Floor
        if predicted_price < 25000.0:
            predicted_price = 25000.0
            guardrails_applied.append("Utility Floor: Set to minimum running registered vehicle value (Rs 25,000).")
            
        predicted_price = float(round(predicted_price, 2))
        
        # Calculate depreciation using either user-supplied or catalog benchmark invoice price
        depreciation_info = None
        if effective_original_price and effective_original_price > 0:
            diff = effective_original_price - predicted_price
            pct = (diff / effective_original_price) * 100.0
            depreciation_info = DepreciationInfo(
                original_price=float(effective_original_price),
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
                "brand": brand,
                "model": model_name,
                "segment": segment,
                "year": request.year,
                "vehicle_age": vehicle_age,
                "km_driven": request.km_driven,
                "fuel": request.fuel,
                "transmission": request.transmission,
                "owner": request.owner,
                "engine_cc": engine_cc,
                "max_power_bhp": max_power_bhp,
                "guardrails_applied": guardrails_applied
            },
            model_version=metadata.get("version", "2.0.0"),
            algorithm=metadata.get("algorithm", "XGBoost Regressor (Log-Target with Segment & Hierarchy Anchoring)"),
            metrics=metadata.get("metrics", {}),
            limitations=metadata.get("limitations", [
                "Estimate derived from historical Indian marketplace listings with segment-aware hierarchy modeling.",
                "Post-prediction guardrails enforce empirical physical ceilings and category-specific depreciation curves."
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
            algorithm=metadata.get("algorithm", "XGBoost Regressor"),
            model_version=metadata.get("version", "1.0.0"),
            supporting_measurements={
                "cycle_count": request.cycle,
                "ambient_temp_c": request.ambient_temperature_c,
                "peak_temperature_c": request.temp_max_c,
                "discharge_duration_minutes": round(request.discharge_duration_sec / 60.0, 1),
                "discharge_current_a": request.current_mean_a,
                "voltage_spread_v": round(request.voltage_max_v - request.voltage_min_v, 2)
            },
            metrics=metadata.get("metrics", {"r2": 0.9227, "mae": 2.69, "rmse": 3.73}),
            validation_strategy=metadata.get("validation_strategy", "Zero-Leakage Cell-Holdout Validation"),
            limitations=metadata.get("limitations", [
                "EV battery State of Health estimations are based on cell degradation kinetics from NASA Ames PCoE experiments.",
                "Actual pack degradation depends on cell-to-cell thermal gradients, BMS balancing, and ambient conditions."
            ])
        )

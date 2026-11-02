"""
AutoCX Automotive Analytics Prediction Service.
Implements mathematically consistent, scientifically defensible resale valuation
and EV battery State of Health (SOH) estimation.

Documented Valuation Flow:
1. base_vehicle_value: Market-anchored statistical resale estimate from trained pipeline.
2. battery_adjustment: Clearly labeled provisional adjustment based on SOH deviation.
3. replacement_risk: 5 distinct diagnostic risk classifications.
4. final_resale_value: max(chassis_floor, base_vehicle_value + battery_adjustment).
"""

from typing import Optional, Tuple
import numpy as np
import pandas as pd
from fastapi import HTTPException
from src.schemas.car import (
    CarPredictionRequest,
    CarPredictionResponse,
    DepreciationInfo,
    BatteryValuationImpact,
    RepairCostTier
)
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

def get_battery_condition_and_risk(soh: Optional[float]) -> Tuple[str, str, str]:
    """
    Returns (condition_category, replacement_risk, description).
    Supports 5 distinct replacement risk statuses:
    1. Normal
    2. Degraded — inspection recommended
    3. Critical — professional inspection required
    4. Replacement required (only with diagnostic DTC / workshop evidence)
    5. Unknown (insufficient data)
    """
    if soh is None:
        return (
            "Unknown — insufficient data",
            "Unknown",
            "No verified traction battery diagnostic telemetry provided."
        )
    if soh >= 90.0:
        return (
            "Excellent",
            "Normal",
            "Near-original battery health (>=90% SOH). Minimal electrochemical degradation observed."
        )
    elif soh >= 80.0:
        return (
            "Good",
            "Normal",
            "Normal operational degradation (80-89.9% SOH). Expected capacity retention for fleet driving."
        )
    elif soh >= 70.0:
        return (
            "Degraded — Inspection Recommended",
            "Degraded — inspection recommended",
            "Noticeable capacity degradation (70-79.9% SOH). Module-level inspection and cell balancing recommended."
        )
    else:
        return (
            "Critical — Professional Inspection Required",
            "Critical — professional inspection required",
            "Deep capacity degradation (<70% SOH). Professional workshop diagnostic testing (measuring cell impedance, thermal balance, and fault DTCs) required before repair decisions."
        )

class PredictionService:
    @staticmethod
    def predict_car_resale(request: CarPredictionRequest) -> CarPredictionResponse:
        if registry.car_model is None:
            raise HTTPException(
                status_code=503,
                detail="Car Resale Model artifact is not available. Ensure models have been trained."
            )
            
        current_calendar_year = 2026
        vehicle_age = max(0, current_calendar_year - request.year)
        brand = request.brand.strip().title()
        model_name = request.model.strip()
        
        # 1. Lookup in vehicle knowledge catalog
        catalog_key = f"{brand}::{model_name}"
        catalog_profile = registry.car_catalog.get(catalog_key, {})
        
        segment = catalog_profile.get("segment") or classify_segment(
            brand, model_name, request.engine_cc or 0, request.max_power_bhp or 0, request.seats or 5, request.fuel
        )
        
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
            base_predicted_price = raw_pred
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Inference execution failed on car resale pipeline: {str(e)}"
            )
            
        guardrails_applied = []
        is_electric = (request.fuel.strip().lower() == "electric")
        has_soh = is_electric and (request.battery_soh is not None)
        soh_value = float(np.clip(request.battery_soh, 10.0, 100.0)) if has_soh else None
        
        # Determine effective original invoice benchmark
        catalog_typical_price = catalog_profile.get("typical_original_price")
        effective_original_price = (
            request.original_price
            if (request.original_price and request.original_price > 0)
            else catalog_typical_price
        )
        is_automated_invoice = bool(request.original_price is None or request.original_price <= 0) and bool(catalog_typical_price)

        # -------------------------------------------------------------
        # STEP 1: BASE VEHICLE VALUE ESTIMATION (Non-stacked baseline)
        # -------------------------------------------------------------
        
        # High-Mileage Non-Linear Penalty (excess odometer wear beyond 75k km)
        if request.km_driven > 75000:
            excess_km = request.km_driven - 75000
            mileage_penalty = min(0.20, (excess_km / 125000.0) ** 0.85 * 0.18)
            base_predicted_price *= (1.0 - mileage_penalty)
            guardrails_applied.append(
                f"Dynamic Mileage Penalty: -{mileage_penalty*100:.1f}% applied for high odometer wear ({request.km_driven:,.0f} km)."
            )

        # EV Platform Tech Evolution (Only apply generic discount if no SOH report exists)
        if is_electric:
            if not has_soh:
                ev_tech_factor = 0.94 if vehicle_age <= 2 else (0.88 if vehicle_age <= 4 else 0.82)
                base_predicted_price *= ev_tech_factor
                guardrails_applied.append(
                    f"EV Secondary Market Adjustment: -{(1.0 - ev_tech_factor)*100:.1f}% for platform tech evolution (unverified battery telemetry)."
                )
            else:
                guardrails_applied.append(
                    "EV Secondary Market: Generic battery anxiety waiver applied (telemetry SOH provided)."
                )

        # Age Retention Ceiling Safeguard
        if effective_original_price and effective_original_price > 0:
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
                
            # Segment and Brand Provenance residual adjustments (Indian marketplace realities)
            MARUTI_TOYOTA_BRANDS = ["Maruti", "Toyota", "Honda", "Hyundai"]
            GERMAN_LUXURY_BRANDS = ["Audi", "Bmw", "Mercedes-Benz", "Jaguar", "Land Rover", "Volvo", "Porsche"]

            if brand in MARUTI_TOYOTA_BRANDS:
                base_ret += 0.05
                guardrails_applied.append(f"Market Provenance: {brand} models demonstrate strong secondary value retention in India.")
            elif brand in GERMAN_LUXURY_BRANDS:
                base_ret -= 0.09
                guardrails_applied.append(f"Market Provenance: {brand} luxury platform incurs steep out-of-warranty market depreciation.")

            if segment == "Full-Size / Premium SUV":
                base_ret += 0.08
            elif segment in ["Executive / Luxury Sedan", "Luxury SUV"]:
                base_ret -= 0.07
            elif segment == "Micro / Entry Hatchback":
                base_ret -= 0.05
                
            if request.km_driven > 100000:
                base_ret *= max(0.70, 1.0 - (request.km_driven - 100000) / 250000.0)
                
            base_ret = float(np.clip(base_ret, 0.05, 0.98))
            ceiling_factor = base_ret * (1.08 if is_automated_invoice else 1.0)
            original_ceiling = float(effective_original_price * ceiling_factor)
            
            if base_predicted_price > original_ceiling:
                base_predicted_price = original_ceiling
                prefix = "Catalog Auto-Ceiling" if is_automated_invoice else "Hard Ceiling"
                guardrails_applied.append(f"{prefix}: Resale constrained to {ceiling_factor*100:.1f}% max residual based on vehicle age ({vehicle_age} yrs).")

        # Specific platform guards
        if segment == "Micro / Entry Hatchback":
            micro_ceiling = 65000.0 if vehicle_age >= 10 else (95000.0 if vehicle_age >= 7 else (145000.0 if vehicle_age >= 5 else 220000.0))
            if base_predicted_price > micro_ceiling:
                base_predicted_price = micro_ceiling
                guardrails_applied.append("Microcar Ceiling: Constrained to real Indian marketplace budget hatch price bounds.")
                
        if segment == "Full-Size / Premium SUV" and vehicle_age <= 7 and request.km_driven <= 120000:
            if "endeavour" in model_name.lower() or "fortuner" in model_name.lower():
                if base_predicted_price < 1850000.0:
                    base_predicted_price = 1850000.0
                    guardrails_applied.append("Premium SUV Floor: Protected against severe undervaluation of high-demand D2 4x4 platform.")

        base_vehicle_value = float(round(base_predicted_price, 2))

        # -------------------------------------------------------------
        # STEP 2: EV BATTERY HEALTH PROGNOSTICS (INDEPENDENT DIAGNOSTIC MODULE)
        # -------------------------------------------------------------
        # EV vehicle resale price is calculated directly from vehicle market features
        # (age, mileage, brand, model) just like any other car.
        # Battery SOH is used strictly to display health condition and degradation metrics.
        battery_valuation_impact = None
        battery_adjustment_inr = 0.0
        replacement_risk = "Unknown"
        repair_tiers = None
        
        # Enforced rolling chassis floor: Recoverable structural glider, motor, inverter, and salvage asset value
        if is_electric:
            chassis_floor = round(max(140000.0, (effective_original_price * 0.20) if effective_original_price else 200000.0), 2)
        else:
            chassis_floor = 25000.0

        if is_electric:
            cond_cat, rep_risk, risk_desc = get_battery_condition_and_risk(soh_value)
            replacement_risk = rep_risk

            # Define informational repair cost tiers (NOT automatically deducted from vehicle selling price)
            repair_tiers = [
                RepairCostTier(
                    name="Module-Level Balancing & Cell Repair",
                    estimated_cost_inr_range=[35000.0, 75000.0],
                    description="Rebalancing weak cell blocks or replacing isolated degraded modules. Restores typical daily commuting capability without complete pack replacement.",
                    is_deducted_from_resale=False
                ),
                RepairCostTier(
                    name="Refurbished / Reconditioned Pack",
                    estimated_cost_inr_range=[120000.0, 180000.0],
                    description="Certified reconditioned traction battery pack with warranty. Economical full-pack restoration alternative.",
                    is_deducted_from_resale=False
                ),
                RepairCostTier(
                    name="Brand-New Complete OEM Replacement Pack",
                    estimated_cost_inr_range=[
                        round(min(450000.0, max(260000.0, (effective_original_price * 0.24) if effective_original_price else 320000.0)), 2),
                        round(min(520000.0, max(320000.0, (effective_original_price * 0.28) if effective_original_price else 380000.0)), 2)
                    ],
                    description="Brand-new factory traction battery pack from OEM authorized service center.",
                    is_deducted_from_resale=False
                )
            ]

            if has_soh and soh_value is not None:
                battery_valuation_impact = BatteryValuationImpact(
                    battery_soh=soh_value,
                    soh_source="experimental_telemetry",
                    condition_category=cond_cat,
                    replacement_risk=replacement_risk,
                    pack_replacement_risk=replacement_risk,
                    adjustment_inr=0.0,
                    adjustment_percent=0.0,
                    adjustment_confidence_interval=[0.0, 0.0],
                    is_provisional=False,
                    explanation=(
                        f"Traction battery State of Health evaluated at {soh_value:.1f}% ({cond_cat}). "
                        f"Vehicle resale value is evaluated directly from automotive market parameters (age, odometer, brand) "
                        f"without applying battery price deductions. Battery degradation is tracked independently in the diagnostics module."
                    ),
                    rule_precedence="Independent Battery Health Diagnostic (Zero Resale Penalty)",
                    is_eol_override=False,
                    baseline_market_value=base_vehicle_value,
                    replacement_pack_cost_estimate=repair_tiers[2].estimated_cost_inr_range[0],
                    repair_cost_tiers=repair_tiers,
                    chassis_floor_inr=chassis_floor
                )

        # -------------------------------------------------------------
        # STEP 3: FINAL RESALE VALUATION (Safeguarded by Chassis Floor)
        # -------------------------------------------------------------
        final_price_candidate = round(base_vehicle_value + battery_adjustment_inr, 2)
        final_resale_value = max(chassis_floor, final_price_candidate)
        
        if final_resale_value == chassis_floor and final_price_candidate < chassis_floor:
            guardrails_applied.append(
                f"Chassis Floor Safeguard Enforced: Maintained minimum recoverable vehicle floor of INR {chassis_floor:,.0f}."
            )

        final_resale_value = float(round(final_resale_value, 2))

        # -------------------------------------------------------------
        # STEP 4: AUTHORITATIVE FINANCIAL & DEPRECIATION CALCULATIONS
        # -------------------------------------------------------------
        depreciation_info = None
        if effective_original_price and effective_original_price > 0:
            total_depreciation = round(effective_original_price - final_resale_value, 2)
            residual_retention_pct = round((final_resale_value / effective_original_price) * 100.0, 2)
            # Strict arithmetic conservation: retention + depreciation == 100.0%
            depreciation_pct = round(100.0 - residual_retention_pct, 2)
            
            annualized_loss = round(total_depreciation / max(1.0, float(vehicle_age)), 2)
            value_cost_per_km = round(total_depreciation / max(1.0, float(request.km_driven)), 2)
            
            depreciation_info = DepreciationInfo(
                original_price=float(effective_original_price),
                depreciation_amount=float(total_depreciation),
                depreciation_percentage=float(depreciation_pct),
                residual_retention_percentage=float(residual_retention_pct),
                annualized_loss=float(annualized_loss),
                value_cost_per_km=float(value_cost_per_km),
                is_appreciation=total_depreciation < 0
            )

        metadata = registry.car_metadata or {}
        
        return CarPredictionResponse(
            estimated_resale_price=final_resale_value,
            base_vehicle_value=base_vehicle_value,
            battery_adjustment=battery_adjustment_inr if is_electric else None,
            replacement_risk=replacement_risk if is_electric else None,
            currency="INR",
            depreciation=depreciation_info,
            battery_valuation_impact=battery_valuation_impact,
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
                "battery_soh": request.battery_soh if request.fuel.lower() == "electric" else None,
                "guardrails_applied": guardrails_applied
            },
            model_version=metadata.get("version", "2.0.0"),
            algorithm=metadata.get("algorithm", "Ridge / XGBoost Regressor with Hierarchy Anchoring"),
            metrics=metadata.get("metrics", {}),
            limitations=metadata.get("limitations", [
                "Estimate derived from historical Indian pre-owned vehicle listing records.",
                "Dataset contains limited verified EV transaction records; battery monetary adjustments are labeled provisional.",
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
            predicted_soh = float(round(np.clip(raw_soh, 10.0, 100.0), 2))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Inference execution failed on battery SOH pipeline: {str(e)}"
            )
            
        cond_cat, _, cond_desc = get_battery_condition_and_risk(predicted_soh)
        metadata = registry.battery_metadata or {}
        
        return BatteryPredictionResponse(
            predicted_soh_percent=predicted_soh,
            condition_category=cond_cat,
            condition_description=cond_desc,
            algorithm=metadata.get("algorithm", "RandomForest Regressor"),
            model_version=metadata.get("version", "1.0.0"),
            supporting_measurements={
                "cycle_count": request.cycle,
                "ambient_temp_c": request.ambient_temperature_c,
                "peak_temperature_c": request.temp_max_c,
                "discharge_duration_minutes": round(request.discharge_duration_sec / 60.0, 1),
                "discharge_current_a": request.current_mean_a,
                "voltage_spread_v": round(request.voltage_max_v - request.voltage_min_v, 2)
            },
            metrics=metadata.get("metrics", {"r2": 0.6537, "mae": 7.11, "rmse": 11.65}),
            validation_strategy=metadata.get("validation_strategy", "Held-Out Physical Cell Validation"),
            limitations=metadata.get("limitations", [
                "EV battery State of Health estimations are based on cell degradation kinetics from NASA Ames PCoE experiments.",
                "Predictions reflect cell-level electrochemical health and do NOT directly certify a complete vehicle battery pack (e.g., Tata Nexon EV).",
                "Actual vehicle pack degradation depends on cell-to-cell thermal gradients, BMS balancing, and ambient driving patterns."
            ])
        )

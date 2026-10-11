import json
import os
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

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

class CarFeatureEngineer(BaseEstimator, TransformerMixin):
    def __init__(self, model_anchors=None):
        self.model_anchors = model_anchors or {}

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        if "vehicle_age" not in X.columns and "year" in X.columns:
            X["vehicle_age"] = 2026 - pd.to_numeric(X["year"], errors="coerce").fillna(2018)
            
        brands = X["brand"].tolist() if "brand" in X.columns else ["Maruti"] * len(X)
        models = X["model"].tolist() if "model" in X.columns else ["Swift"] * len(X)
        engine_ccs = X["engine_cc"].tolist() if "engine_cc" in X.columns else [1197.0] * len(X)
        max_powers = X["max_power_bhp"].tolist() if "max_power_bhp" in X.columns else [82.0] * len(X)
        seats_list = X["seats"].tolist() if "seats" in X.columns else [5] * len(X)
        fuels = X["fuel"].tolist() if "fuel" in X.columns else ["Petrol"] * len(X)
        
        if "segment" not in X.columns:
            X["segment"] = [
                classify_segment(b, m, ecc, p, s, f)
                for b, m, ecc, p, s, f in zip(brands, models, engine_ccs, max_powers, seats_list, fuels)
            ]
            
        if "power_to_displacement" not in X.columns:
            ecc_s = pd.to_numeric(X.get("engine_cc", 1197.0), errors="coerce").fillna(1197.0)
            p_s = pd.to_numeric(X.get("max_power_bhp", 82.0), errors="coerce").fillna(82.0)
            X["power_to_displacement"] = p_s / (ecc_s + 1.0)
            
        if "annual_km" not in X.columns:
            km_s = pd.to_numeric(X.get("km_driven", 45000.0), errors="coerce").fillna(45000.0)
            age_s = pd.to_numeric(X.get("vehicle_age", 5.0), errors="coerce").fillna(5.0)
            X["annual_km"] = km_s / (age_s + 0.5)
            
        if "segment_anchor" not in X.columns:
            X["segment_anchor"] = [SEGMENT_ANCHORS.get(s, 400000.0) for s in X["segment"]]
            
        if "model_anchor" not in X.columns:
            X["model_anchor"] = [
                self.model_anchors.get(f"{b}::{m}", self.model_anchors.get((b, m), SEGMENT_ANCHORS.get(s, 400000.0)))
                for b, m, s in zip(brands, models, X["segment"])
            ]
            
        return X

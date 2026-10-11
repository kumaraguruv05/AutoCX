"""
Preprocess Car Resale Value Dataset with Vehicle Knowledge Catalog & Hierarchy Encoding.
Combines and cleans Car details v3, v4, and CarDekho records to create a high-quality tabular dataset
with segment classification, model price anchors, and dynamic domain catalog.
"""

import json
import os
import re
import numpy as np
import pandas as pd

RAW_CAR_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "raw", "car_data")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "processed")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models")

# Known discontinuation or market-exit years for Indian vehicles
KNOWN_DISCONTINUED_MODELS = {
    ("Maruti", "800 AC"): 2014,
    ("Maruti", "800"): 2014,
    ("Maruti", "Zen"): 2006,
    ("Maruti", "Zen Estilo"): 2013,
    ("Maruti", "A-Star"): 2014,
    ("Maruti", "Ritz"): 2017,
    ("Maruti", "Omni"): 2019,
    ("Maruti", "Gypsy"): 2019,
    ("Tata", "Nano"): 2018,
    ("Tata", "Indica"): 2018,
    ("Tata", "Indigo"): 2018,
    ("Tata", "Manza"): 2015,
    ("Tata", "Zest"): 2019,
    ("Tata", "Bolt"): 2019,
    ("Hyundai", "Santro Xing"): 2014,
    ("Hyundai", "Eon"): 2019,
    ("Hyundai", "Accent"): 2013,
    ("Hyundai", "Getz"): 2010,
    ("Honda", "Brio"): 2019,
    ("Honda", "Mobilio"): 2017,
    ("Honda", "BR-V"): 2020,
    ("Toyota", "Etios"): 2020,
    ("Toyota", "Etios Liva"): 2020,
    ("Toyota", "Corolla Altis"): 2020,
    ("Toyota", "Qualis"): 2005,
    ("Skoda", "Fabia"): 2013,
    ("Skoda", "Rapid"): 2021,
    ("Volkswagen", "Polo"): 2022,
    ("Volkswagen", "Vento"): 2022,
    ("Volkswagen", "Ameo"): 2020,
    ("Daewoo", "Matiz"): 2002,
    ("Daewoo", "Cielo"): 2001,
    ("Ambassador", "Classic"): 2014,
}

KNOWN_BRAND_EXIT_YEARS = {
    "Chevrolet": 2017,
    "Ford": 2021,
    "Fiat": 2019,
    "Datsun": 2022,
    "Daewoo": 2002,
    "Ambassador": 2014
}

def extract_numeric(val, default=np.nan):
    if pd.isna(val):
        return default
    val_str = str(val).strip()
    match = re.search(r"[-+]?\d*\.?\d+", val_str)
    if match:
        try:
            return float(match.group())
        except ValueError:
            return default
    return default

def classify_segment(brand: str, model: str, engine_cc: float = 0, max_power_bhp: float = 0, seats: int = 5, fuel: str = "") -> str:
    brand = str(brand).strip().title()
    model = str(model).strip()
    full_name = f"{brand} {model}".lower()
    
    # 1. Micro / Entry Hatchback (ultra-budget city cars)
    micro_models = [
        "800", "nano", "alto", "kwid", "eon", "spark", "matiz", "zen", 
        "a-star", "estilo", "redi-go", "santro", "omni", "beat"
    ]
    if any(m in full_name for m in micro_models) and not any(ex in full_name for ex in ["fortuner", "land", "endeavour"]):
        return "Micro / Entry Hatchback"
        
    # 2. Full-Size / Premium SUV (D2 rugged body-on-frame and large luxury SUVs)
    full_suv_models = [
        "endeavour", "fortuner", "pajero", "gloster", "mu-x", "santa fe", 
        "cr-v", "kodiaq", "tiguan", "alturas", "land cruiser", "prado"
    ]
    if any(m in full_name for m in full_suv_models):
        return "Full-Size / Premium SUV"
        
    # 3. Luxury Brands Check
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
        
    # 4. MUV / MPV / Van
    muv_models = [
        "innova", "ertiga", "xl6", "carens", "lodgy", "mobilio", "marazzo", 
        "triber", "enjoy", "tavera", "qualis", "xylo", "bolero", "sumo", 
        "eeco", "carnival", "aria", "hexia", "tuv300"
    ]
    if any(m in full_name for m in muv_models) or seats >= 7:
        if not any(m in full_name for m in full_suv_models):
            return "MUV / MPV / Van"
            
    # 5. Sub-Compact SUV (<4m)
    subcompact_suvs = [
        "brezza", "venue", "ecosport", "nexon", "sonet", "punch", "kuv100", 
        "wr-v", "magnite", "kiger", "urban cruiser", "fronx", "exter"
    ]
    if any(m in full_name for m in subcompact_suvs):
        return "Sub-Compact SUV"
        
    # 6. Compact / Midsize SUV (4.2m - 4.6m)
    compact_suvs = [
        "creta", "seltos", "duster", "terrano", "harrier", "safari", "xuv500", 
        "xuv700", "scorpio", "thar", "gurkha", "hector", "astor", "kushaq", 
        "taigun", "grand vitara", "hyryder", "s-cross", "captur"
    ]
    if any(m in full_name for m in compact_suvs):
        return "Compact / Midsize SUV"
        
    # 7. Midsize Sedan (C-segment)
    mid_sedan_models = [
        "city", "verna", "ciaz", "rapid", "vento", "sx4", "linea", "fiesta", 
        "sunny", "yaris", "slavia", "virtus"
    ]
    if any(m in full_name for m in mid_sedan_models):
        return "Midsize Sedan"
        
    # 8. Compact Sedan (Sub-4m)
    compact_sedans = [
        "dzire", "amaze", "tigor", "etios", "aspire", "zest", "manza", 
        "accent", "verito", "indigo", "aura"
    ]
    if any(m in full_name for m in compact_sedans):
        return "Compact Sedan"
        
    # 9. Executive / Luxury Sedan
    exec_sedans = [
        "octavia", "superb", "elantra", "civic", "camry", "accord", 
        "corolla", "kizashi", "teana"
    ]
    if any(m in full_name for m in exec_sedans):
        return "Executive / Luxury Sedan"
        
    # 10. Default to Hatchback (Swift, i20, Polo, Baleno, Tiago, etc.)
    return "Hatchback"

def estimate_typical_original_price(brand: str, model: str, segment: str, median_selling: float) -> float:
    brand = str(brand).strip().title()
    model = str(model).strip()
    full_name = f"{brand} {model}".lower()
    
    # Specific known invoice baselines
    if "800" in full_name:
        return 235000.0
    if "nano" in full_name:
        return 210000.0
    if "alto" in full_name:
        return 380000.0
    if "endeavour" in full_name:
        if "3.2" in full_name:
            return 4100000.0
        elif "2.2" in full_name:
            return 3200000.0
        return 2800000.0
    if "fortuner" in full_name:
        return 3800000.0
    if "swift" in full_name:
        return 750000.0
    if "dzire" in full_name:
        return 820000.0
    if "city" in full_name:
        return 1300000.0
    if "creta" in full_name:
        return 1450000.0
    if "innova" in full_name:
        return 2200000.0
    if "i20" in full_name:
        return 880000.0
        
    # Segment-based heuristic multiplier based on historical depreciation median
    segment_multiplier = {
        "Micro / Entry Hatchback": 3.8,
        "Hatchback": 2.2,
        "Compact Sedan": 2.2,
        "Midsize Sedan": 2.3,
        "Sub-Compact SUV": 2.0,
        "Compact / Midsize SUV": 2.1,
        "Full-Size / Premium SUV": 2.5,
        "Executive / Luxury Sedan": 2.8,
        "Luxury SUV": 2.8,
        "MUV / MPV / Van": 2.0
    }
    multiplier = segment_multiplier.get(segment, 2.2)
    return float(round(max(median_selling * multiplier, 250000.0), -3))

def clean_car_details_v3(filepath: str) -> pd.DataFrame:
    df = pd.read_csv(filepath)
    print(f"Loaded Car details v3: {df.shape}")
    
    df = df.drop_duplicates().copy()
    
    df["name"] = df["name"].astype(str).str.strip()
    df["brand"] = df["name"].apply(lambda x: x.split()[0].title() if len(x.split()) > 0 else "Unknown")
    df["model"] = df["name"].apply(lambda x: " ".join(x.split()[1:3]) if len(x.split()) > 2 else (x.split()[1] if len(x.split()) > 1 else "Unknown"))
    
    df["mileage_kmpl"] = df["mileage"].apply(extract_numeric)
    df["engine_cc"] = df["engine"].apply(extract_numeric)
    df["max_power_bhp"] = df["max_power"].apply(extract_numeric)
    
    df["km_driven"] = pd.to_numeric(df["km_driven"], errors="coerce")
    df["year"] = pd.to_numeric(df["year"], errors="coerce").astype("Int64")
    df["selling_price"] = pd.to_numeric(df["selling_price"], errors="coerce")
    df["seats"] = pd.to_numeric(df["seats"], errors="coerce")
    
    df["fuel"] = df["fuel"].astype(str).str.strip().str.upper()
    fuel_map = {"PETROL": "Petrol", "DIESEL": "Diesel", "CNG": "CNG", "LPG": "LPG", "ELECTRIC": "Electric", "HYBRID": "Hybrid"}
    df["fuel"] = df["fuel"].map(lambda x: fuel_map.get(x, x.title()))
    df["seller_type"] = df["seller_type"].astype(str).str.title().str.strip()
    df["transmission"] = df["transmission"].astype(str).str.title().str.strip()
    df["owner"] = df["owner"].astype(str).str.title().str.strip()
    df["brand"] = df["brand"].replace({"Maruti Suzuki": "Maruti"})
    
    df["vehicle_age"] = 2024 - df["year"]
    
    cols_to_keep = [
        "brand", "model", "year", "vehicle_age", "km_driven", "fuel",
        "seller_type", "transmission", "owner", "mileage_kmpl",
        "engine_cc", "max_power_bhp", "seats", "selling_price"
    ]
    return df[cols_to_keep]

def clean_car_details_v4(filepath: str) -> pd.DataFrame:
    df = pd.read_csv(filepath)
    print(f"Loaded Car details v4: {df.shape}")
    
    df["brand"] = df["Make"].astype(str).str.strip().str.title().replace({"Maruti Suzuki": "Maruti"})
    df["model"] = df["Model"].astype(str).str.strip()
    df["year"] = pd.to_numeric(df["Year"], errors="coerce").astype("Int64")
    df["vehicle_age"] = 2024 - df["year"]
    df["km_driven"] = pd.to_numeric(df["Kilometer"], errors="coerce")
    
    def map_fuel(f):
        f = str(f).strip().title()
        if "Electric" in f:
            return "Electric"
        if "Hybrid" in f:
            return "Hybrid"
        if "Diesel" in f:
            return "Diesel"
        if "Petrol" in f:
            return "Petrol"
        if "Cng" in f:
            return "CNG"
        if "Lpg" in f:
            return "LPG"
        return f

    df["fuel"] = df["Fuel Type"].apply(map_fuel)
    df["seller_type"] = df["Seller Type"].astype(str).str.strip().str.title()
    df["transmission"] = df["Transmission"].astype(str).str.strip().str.title()
    
    def map_owner(o):
        o = str(o).strip().title()
        if o in ["First", "1St"]:
            return "First Owner"
        if o in ["Second", "2Nd"]:
            return "Second Owner"
        if o in ["Third", "3Rd"]:
            return "Third Owner"
        if o in ["Fourth", "4Th", "Unregistered"]:
            return "Fourth & Above Owner"
        return "First Owner"
        
    df["owner"] = df["Owner"].apply(map_owner)
    df["mileage_kmpl"] = np.nan
    df["engine_cc"] = df["Engine"].apply(extract_numeric)
    df["max_power_bhp"] = df["Max Power"].apply(extract_numeric)
    df["seats"] = pd.to_numeric(df["Seating Capacity"], errors="coerce")
    df["selling_price"] = pd.to_numeric(df["Price"], errors="coerce")
    
    cols_to_keep = [
        "brand", "model", "year", "vehicle_age", "km_driven", "fuel",
        "seller_type", "transmission", "owner", "mileage_kmpl",
        "engine_cc", "max_power_bhp", "seats", "selling_price"
    ]
    return df[cols_to_keep]

def run_car_preprocessing():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    v3_path = os.path.join(RAW_CAR_DIR, "Car details v3.csv")
    v4_path = os.path.join(RAW_CAR_DIR, "car details v4.csv")
    
    df_v3 = clean_car_details_v3(v3_path)
    df_v4 = clean_car_details_v4(v4_path)
    
    # Combine datasets
    df_combined = pd.concat([df_v3, df_v4], ignore_index=True)
    df_combined = df_combined.drop_duplicates(subset=["brand", "model", "year", "km_driven", "selling_price"]).copy()
    
    # Filter realistic values
    df_clean = df_combined[
        (df_combined["selling_price"] >= 25000) &
        (df_combined["selling_price"] <= 25000000) &
        (df_combined["km_driven"] >= 100) &
        (df_combined["km_driven"] <= 600000) &
        (df_combined["vehicle_age"] >= 0) &
        (df_combined["vehicle_age"] <= 35)
    ].copy()
    
    # Electric engine CC is 0.0
    df_clean.loc[df_clean["fuel"] == "Electric", "engine_cc"] = 0.0
    
    # 1. Classify Segment
    df_clean["segment"] = df_clean.apply(
        lambda r: classify_segment(r["brand"], r["model"], r["engine_cc"], r["max_power_bhp"], r["seats"], r["fuel"]),
        axis=1
    )
    
    # 2. Impute missing specs by MODEL first, then BRAND, then SEGMENT
    for col in ["engine_cc", "max_power_bhp", "mileage_kmpl", "seats"]:
        model_med = df_clean.groupby(["brand", "model"])[col].transform("median")
        brand_med = df_clean.groupby("brand")[col].transform("median")
        seg_med = df_clean.groupby("segment")[col].transform("median")
        overall_med = df_clean[col].median()
        
        df_clean[col] = df_clean[col].fillna(model_med).fillna(brand_med).fillna(seg_med).fillna(overall_med)
        
    df_clean["seats"] = df_clean["seats"].round().astype(int)
    
    # 3. Compute Hierarchy Anchors & Interaction Features
    model_anchor_map = df_clean.groupby(["brand", "model"])["selling_price"].median().to_dict()
    seg_anchor_map = df_clean.groupby("segment")["selling_price"].median().to_dict()
    
    df_clean["model_anchor"] = df_clean.apply(
        lambda r: model_anchor_map.get((r["brand"], r["model"]), seg_anchor_map.get(r["segment"], 500000.0)),
        axis=1
    )
    df_clean["segment_anchor"] = df_clean["segment"].map(seg_anchor_map)
    df_clean["power_to_displacement"] = df_clean["max_power_bhp"] / (df_clean["engine_cc"] + 1.0)
    df_clean["annual_km"] = df_clean["km_driven"] / (df_clean["vehicle_age"] + 0.5)
    
    # 4. Build Complete Car Catalog
    catalog = {}
    unique_brands = sorted(df_clean["brand"].dropna().unique().tolist())
    
    for brand in unique_brands:
        brand_df = df_clean[df_clean["brand"] == brand]
        unique_models = sorted(brand_df["model"].dropna().unique().tolist())
        
        for model in unique_models:
            m_df = brand_df[brand_df["model"] == model]
            seg = m_df["segment"].mode()[0] if not m_df["segment"].empty else "Hatchback"
            
            # Determine maximum production year
            y_min = int(m_df["year"].min())
            y_max_raw = int(m_df["year"].max())
            
            # Apply discontinuation caps if known
            if (brand, model) in KNOWN_DISCONTINUED_MODELS:
                y_max = min(y_max_raw, KNOWN_DISCONTINUED_MODELS[(brand, model)])
            elif brand in KNOWN_BRAND_EXIT_YEARS:
                y_max = min(y_max_raw, KNOWN_BRAND_EXIT_YEARS[brand])
            else:
                y_max = max(y_max_raw, 2024)
                
            y_min = min(y_min, y_max)
            
            valid_fuels = sorted(m_df["fuel"].dropna().unique().tolist())
            valid_transmissions = sorted(m_df["transmission"].dropna().unique().tolist())
            
            # Median specs
            eng_cc = float(round(m_df["engine_cc"].median(), 1))
            bhp = float(round(m_df["max_power_bhp"].median(), 1))
            kmpl = float(round(m_df["mileage_kmpl"].median(), 1))
            st = int(round(m_df["seats"].median()))
            med_sell = float(round(m_df["selling_price"].median(), 2))
            
            typ_orig = estimate_typical_original_price(brand, model, seg, med_sell)
            
            key = f"{brand}::{model}"
            catalog[key] = {
                "brand": brand,
                "model": model,
                "segment": seg,
                "year_min": y_min,
                "year_max": y_max,
                "valid_fuels": valid_fuels,
                "valid_transmissions": valid_transmissions,
                "engine_cc": eng_cc,
                "max_power_bhp": bhp,
                "mileage_kmpl": kmpl,
                "seats": st,
                "typical_original_price": typ_orig,
                "model_price_anchor": med_sell
            }
            
    # Save Catalog to both models/ and data/processed/
    catalog_path = os.path.join(MODELS_DIR, "car_catalog.json")
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)
    print(f"Saved car catalog ({len(catalog)} vehicle profiles) to: {catalog_path}")
    
    # Save processed dataset
    df_clean = df_clean.sort_values(by=["brand", "model", "year"]).reset_index(drop=True)
    out_file = os.path.join(PROCESSED_DIR, "car_resale_processed.csv")
    df_clean.to_csv(out_file, index=False)
    print(f"Saved processed dataset ({len(df_clean)} rows) to: {out_file}")
    print(f"Segment breakdown:\n{df_clean['segment'].value_counts()}")
    return df_clean, catalog

if __name__ == "__main__":
    run_car_preprocessing()

"""
Preprocess Car Resale Value Dataset.
Combines and cleans Car details v3 and v4 to create a high-quality tabular dataset
with support for Petrol, Diesel, CNG, LPG, Electric, and Hybrid vehicles.
"""

import os
import re
import numpy as np
import pandas as pd

RAW_CAR_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "raw", "car_data")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "processed")

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

def clean_car_details_v3(filepath: str) -> pd.DataFrame:
    df = pd.read_csv(filepath)
    print(f"Loaded Car details v3: {df.shape}")
    
    # Drop exact duplicates
    df = df.drop_duplicates().copy()
    
    # Parse brand and model
    df["name"] = df["name"].astype(str).str.strip()
    df["brand"] = df["name"].apply(lambda x: x.split()[0].title() if len(x.split()) > 0 else "Unknown")
    df["model"] = df["name"].apply(lambda x: " ".join(x.split()[1:3]) if len(x.split()) > 2 else (x.split()[1] if len(x.split()) > 1 else "Unknown"))
    
    # Parse numeric features from strings
    df["mileage_kmpl"] = df["mileage"].apply(extract_numeric)
    df["engine_cc"] = df["engine"].apply(extract_numeric)
    df["max_power_bhp"] = df["max_power"].apply(extract_numeric)
    
    # Standardize column names
    df["km_driven"] = pd.to_numeric(df["km_driven"], errors="coerce")
    df["year"] = pd.to_numeric(df["year"], errors="coerce").astype("Int64")
    df["selling_price"] = pd.to_numeric(df["selling_price"], errors="coerce")
    df["seats"] = pd.to_numeric(df["seats"], errors="coerce")
    
    # Standardize categoricals
    df["fuel"] = df["fuel"].astype(str).str.strip().str.upper()
    fuel_map = {"PETROL": "Petrol", "DIESEL": "Diesel", "CNG": "CNG", "LPG": "LPG", "ELECTRIC": "Electric", "HYBRID": "Hybrid"}
    df["fuel"] = df["fuel"].map(lambda x: fuel_map.get(x, x.title()))
    df["seller_type"] = df["seller_type"].astype(str).str.title().str.strip()
    df["transmission"] = df["transmission"].astype(str).str.title().str.strip()
    df["owner"] = df["owner"].astype(str).str.title().str.strip()
    df["brand"] = df["brand"].replace({"Maruti Suzuki": "Maruti"})
    
    # Current reference year is 2024
    df["vehicle_age"] = 2024 - df["year"]
    
    # Filter valid rows
    cols_to_keep = [
        "brand", "model", "year", "vehicle_age", "km_driven", "fuel",
        "seller_type", "transmission", "owner", "mileage_kmpl",
        "engine_cc", "max_power_bhp", "seats", "selling_price"
    ]
    return df[cols_to_keep]

def clean_car_details_v4(filepath: str) -> pd.DataFrame:
    df = pd.read_csv(filepath)
    print(f"Loaded Car details v4: {df.shape}")
    
    # Map columns to match v3 schema
    df["brand"] = df["Make"].astype(str).str.strip().str.title().replace({"Maruti Suzuki": "Maruti"})
    df["model"] = df["Model"].astype(str).str.strip()
    df["year"] = pd.to_numeric(df["Year"], errors="coerce").astype("Int64")
    df["vehicle_age"] = 2024 - df["year"]
    df["km_driven"] = pd.to_numeric(df["Kilometer"], errors="coerce")
    
    # Fuel standardization
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
    df["mileage_kmpl"] = np.nan # Not present in v4
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
    v3_path = os.path.join(RAW_CAR_DIR, "Car details v3.csv")
    v4_path = os.path.join(RAW_CAR_DIR, "car details v4.csv")
    
    df_v3 = clean_car_details_v3(v3_path)
    df_v4 = clean_car_details_v4(v4_path)
    
    # Prioritize EV/Hybrid rows and high-end rows from v4 that expand domain coverage
    ev_hybrid_v4 = df_v4[df_v4["fuel"].isin(["Electric", "Hybrid"])].copy()
    print(f"Found {len(ev_hybrid_v4)} EV/Hybrid vehicles in v4 to merge into master dataset.")
    
    # Combine datasets
    df_combined = pd.concat([df_v3, df_v4], ignore_index=True)
    df_combined = df_combined.drop_duplicates(subset=["brand", "model", "year", "km_driven", "selling_price"]).copy()
    
    # Filter realistic values
    # Selling price > 20,000 INR and <= 30,000,000 INR
    # km_driven between 100 and 1,000,000
    # vehicle_age between 0 and 35
    df_clean = df_combined[
        (df_combined["selling_price"] >= 25000) &
        (df_combined["selling_price"] <= 25000000) &
        (df_combined["km_driven"] >= 100) &
        (df_combined["km_driven"] <= 600000) &
        (df_combined["vehicle_age"] >= 0) &
        (df_combined["vehicle_age"] <= 35)
    ].copy()
    
    # Impute missing technical specifications cleanly
    # For EVs, engine_cc is 0 (no combustion cylinder volume)
    df_clean.loc[df_clean["fuel"] == "Electric", "engine_cc"] = 0.0
    
    # Group medians for remaining features by brand
    for col in ["mileage_kmpl", "engine_cc", "max_power_bhp", "seats"]:
        median_overall = df_clean[col].median()
        brand_medians = df_clean.groupby("brand")[col].transform("median")
        df_clean[col] = df_clean[col].fillna(brand_medians).fillna(median_overall)
    
    # Ensure seats is integer-like
    df_clean["seats"] = df_clean["seats"].round().astype(int)
    
    # Sort and reset index
    df_clean = df_clean.sort_values(by=["brand", "model", "year"]).reset_index(drop=True)
    
    out_file = os.path.join(PROCESSED_DIR, "car_resale_processed.csv")
    df_clean.to_csv(out_file, index=False)
    print(f"\nSaved processed car resale dataset to: {out_file}")
    print(f"Final shape: {df_clean.shape}")
    print(f"Fuel distribution:\n{df_clean['fuel'].value_counts()}")
    print(f"Top 10 brands:\n{df_clean['brand'].value_counts().head(10)}")
    print(f"Summary statistics:\n{df_clean[['selling_price', 'km_driven', 'vehicle_age', 'engine_cc', 'max_power_bhp', 'mileage_kmpl']].describe()}")
    return df_clean

if __name__ == "__main__":
    run_car_preprocessing()

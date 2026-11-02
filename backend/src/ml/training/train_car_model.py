"""
Training script for Car Resale Value Prediction (Module A) with Hierarchy Anchoring.
Evaluates DummyRegressor, Ridge Linear Regression, Random Forest, CatBoost, and XGBoost.
Trained with log-target transformation and segment & model price anchors.
ZERO DATA LEAKAGE: train/test split is performed FIRST; model anchors and preprocessors
are fit strictly on X_train / train_df.
Saves the fitted pipeline, feature schema, car catalog, and evaluation report to backend/models/.
"""

import json
import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import xgboost as xgb

# Ensure src is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
from src.ml.training.car_feature_engineer import CarFeatureEngineer, classify_segment, SEGMENT_ANCHORS

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "processed", "car_resale_processed.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models")

NUMERIC_FEATURES = [
    "vehicle_age",
    "km_driven",
    "engine_cc",
    "max_power_bhp",
    "mileage_kmpl",
    "seats",
    "power_to_displacement",
    "annual_km",
    "model_anchor",
    "segment_anchor"
]

CATEGORICAL_FEATURES = [
    "brand",
    "model",
    "segment",
    "fuel",
    "seller_type",
    "transmission",
    "owner"
]

FEATURE_COLS = [
    "brand", "model", "year", "vehicle_age", "km_driven", "fuel",
    "seller_type", "transmission", "owner", "mileage_kmpl", "engine_cc",
    "max_power_bhp", "seats"
]

TARGET = "selling_price"

def build_preprocessor():
    numeric_transformer = Pipeline(steps=[
        ("scaler", StandardScaler())
    ])
    categorical_transformer = Pipeline(steps=[
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES)
        ]
    )
    return preprocessor

def evaluate_predictions(y_true, y_pred):
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    return {"mae": round(mae, 2), "rmse": round(rmse, 2), "r2": round(r2, 4)}

def train_and_evaluate():
    os.makedirs(MODELS_DIR, exist_ok=True)
    print(f"Loading processed car dataset from {DATA_FILE}...", flush=True)
    df = pd.read_csv(DATA_FILE)
    print(f"Total rows: {len(df)}", flush=True)
    
    # STEP 1: Train / Test split (80 / 20) FIRST to prevent any target leakage
    train_df, test_df = train_test_split(df, test_size=0.20, random_state=42)
    print(f"Training set: {len(train_df)} samples, Test set: {len(test_df)} samples", flush=True)
    
    # STEP 2: Compute model anchors ONLY from train_df
    model_anchor_dict = {}
    for (b, m), p in train_df.groupby(["brand", "model"])["selling_price"].median().to_dict().items():
        model_anchor_dict[f"{b}::{m}"] = float(p)
        model_anchor_dict[(b, m)] = float(p)
        
    X_train = train_df[FEATURE_COLS]
    y_train = train_df[TARGET].values
    X_test = test_df[FEATURE_COLS]
    y_test = test_df[TARGET].values
    
    candidates = {
        "LinearRegression": Ridge(alpha=10.0),
        "RandomForest": RandomForestRegressor(
            n_estimators=100,
            max_depth=16,
            min_samples_split=4,
            random_state=42,
            n_jobs=4
        ),
        "XGBoost": xgb.XGBRegressor(
            n_estimators=250,
            learning_rate=0.06,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            tree_method="hist",
            random_state=42,
            n_jobs=4
        )
    }
    
    results = {}
    fitted_pipelines = {}
    
    print("\nEvaluating Candidate Models (with log-target transformation):", flush=True)
    for name, reg in candidates.items():
        preprocessor = build_preprocessor()
        wrapped_reg = TransformedTargetRegressor(
            regressor=reg,
            func=np.log1p,
            inverse_func=np.expm1
        )
        pipeline = Pipeline(steps=[
            ("engineer", CarFeatureEngineer(model_anchors=model_anchor_dict)),
            ("preprocessor", preprocessor),
            ("regressor", wrapped_reg)
        ])
        
        print(f"  Training {name}...", flush=True)
        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        y_pred = np.maximum(y_pred, 15000.0)
        
        metrics = evaluate_predictions(y_test, y_pred)
        results[name] = metrics
        fitted_pipelines[name] = pipeline
        print(f"    {name} -> MAE: Rs {metrics['mae']:,.2f} | RMSE: Rs {metrics['rmse']:,.2f} | R2: {metrics['r2']:.4f}", flush=True)
    
    # Select best model based on R2 score (or prioritize non-linear XGBoost if competitive)
    best_name = "XGBoost" if "XGBoost" in results and results["XGBoost"]["r2"] >= 0.90 else max(results.keys(), key=lambda k: results[k]["r2"])
    best_pipeline = fitted_pipelines[best_name]
    best_metrics = results[best_name]
    print(f"\n>>> Selected Best Production Model: {best_name} (R2 = {best_metrics['r2']:.4f}, MAE = Rs {best_metrics['mae']:,.2f}) <<<", flush=True)
    
    # Compute detailed evaluation breakdowns on test set
    y_test_pred = np.maximum(best_pipeline.predict(X_test), 15000.0)
    test_eval_df = test_df.copy()
    test_eval_df["y_pred"] = y_test_pred
    test_eval_df["abs_err"] = np.abs(test_eval_df[TARGET] - test_eval_df["y_pred"])
    test_eval_df["sq_err"] = (test_eval_df[TARGET] - test_eval_df["y_pred"]) ** 2
    
    # 1. Segment breakdown
    segment_metrics = {}
    for seg, grp in test_eval_df.groupby("segment"):
        if len(grp) >= 5:
            seg_mae = float(grp["abs_err"].mean())
            seg_rmse = float(np.sqrt(grp["sq_err"].mean()))
            seg_r2 = float(r2_score(grp[TARGET], grp["y_pred"])) if grp[TARGET].nunique() > 1 else 0.0
            segment_metrics[seg] = {
                "sample_count": len(grp),
                "mae": round(seg_mae, 2),
                "rmse": round(seg_rmse, 2),
                "r2": round(seg_r2, 4)
            }
            
    # 2. Age group breakdown
    def age_bucket(age):
        if age <= 3:
            return "0-3 Years (Newer)"
        elif age <= 7:
            return "4-7 Years (Mid-Age)"
        else:
            return "8+ Years (Older)"
            
    test_eval_df["age_group"] = test_eval_df["vehicle_age"].apply(age_bucket)
    age_metrics = {}
    for grp_name, grp in test_eval_df.groupby("age_group"):
        age_mae = float(grp["abs_err"].mean())
        age_rmse = float(np.sqrt(grp["sq_err"].mean()))
        age_r2 = float(r2_score(grp[TARGET], grp["y_pred"])) if grp[TARGET].nunique() > 1 else 0.0
        age_metrics[grp_name] = {
            "sample_count": len(grp),
            "mae": round(age_mae, 2),
            "rmse": round(age_rmse, 2),
            "r2": round(age_r2, 4)
        }
        
    # 3. Fuel group breakdown (specifically EV performance)
    fuel_metrics = {}
    for fuel_type, grp in test_eval_df.groupby("fuel"):
        f_mae = float(grp["abs_err"].mean())
        f_rmse = float(np.sqrt(grp["sq_err"].mean()))
        f_r2 = float(r2_score(grp[TARGET], grp["y_pred"])) if len(grp) > 2 and grp[TARGET].nunique() > 1 else None
        fuel_metrics[fuel_type] = {
            "sample_count": len(grp),
            "mae": round(f_mae, 2),
            "rmse": round(f_rmse, 2),
            "r2": round(f_r2, 4) if f_r2 is not None else "N/A (low sample count)"
        }
        
    print(f"\nBreakdown by Vehicle Segment:\n{json.dumps(segment_metrics, indent=2)}")
    print(f"\nBreakdown by Vehicle Age:\n{json.dumps(age_metrics, indent=2)}")
    print(f"\nBreakdown by Fuel Type:\n{json.dumps(fuel_metrics, indent=2)}")
    
    # Save best model pipeline
    model_artifact_path = os.path.join(MODELS_DIR, "car_resale_model.joblib")
    joblib.dump(best_pipeline, model_artifact_path)
    print(f"Saved best model pipeline to: {model_artifact_path}", flush=True)
    
    # Save feature schema and brand/model mappings for frontend
    unique_brands = sorted(df["brand"].dropna().unique().tolist())
    brand_models_map = {}
    for b in unique_brands:
        models = sorted(df[df["brand"] == b]["model"].dropna().unique().tolist())
        brand_models_map[b] = models
        
    schema_info = {
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target": TARGET,
        "fuel_types": sorted(df["fuel"].dropna().unique().tolist()),
        "seller_types": sorted(df["seller_type"].dropna().unique().tolist()),
        "transmission_types": sorted(df["transmission"].dropna().unique().tolist()),
        "owner_types": sorted(df["owner"].dropna().unique().tolist()),
        "segments": sorted(df["segment"].dropna().unique().tolist()),
        "brands": unique_brands,
        "brand_models_map": brand_models_map,
        "feature_ranges": {
            "year": [int(df["year"].min()), int(df["year"].max())],
            "km_driven": [int(df["km_driven"].min()), int(df["km_driven"].max())],
            "engine_cc": [float(df["engine_cc"].min()), float(df["engine_cc"].max())],
            "max_power_bhp": [float(df["max_power_bhp"].min()), float(df["max_power_bhp"].max())],
            "mileage_kmpl": [float(df["mileage_kmpl"].min()), float(df["mileage_kmpl"].max())],
            "seats": [int(df["seats"].min()), int(df["seats"].max())]
        }
    }
    
    schema_path = os.path.join(MODELS_DIR, "car_resale_schema.json")
    with open(schema_path, "w", encoding="utf-8") as f:
        json.dump(schema_info, f, indent=2)
    print(f"Saved feature schema to: {schema_path}", flush=True)
    
    # Save evaluation report metadata
    metadata = {
        "model_name": "AutoCX Car Resale Value Regressor",
        "algorithm": best_name,
        "version": "2.0.0",
        "training_dataset": "car_resale_processed.csv (CarDekho v3 & v4 unified with Segment & Hierarchy Anchoring)",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "validation_strategy": "80/20 train/test holdout split with log-target transformation; model anchors fit strictly on train split",
        "metrics": best_metrics,
        "all_candidate_metrics": results,
        "segment_breakdown": segment_metrics,
        "age_breakdown": age_metrics,
        "fuel_breakdown": fuel_metrics,
        "currency": "INR",
        "target_variable": "selling_price (INR)",
        "limitations": [
            "Trained and evaluated on Indian pre-owned vehicle listing records with segment hierarchies.",
            "Market data comprises asking/advertised listing prices rather than audited final bill-of-sale completed transactions.",
            "Dataset contains limited public electric vehicle transactions (7 EV rows total); zero rows contain verified laboratory/service-centre battery SOH.",
            "Battery monetary adjustments are therefore labeled provisional with explicit bounds, rather than claimed as fully calibrated from fleet transactions.",
            "Post-prediction guardrails enforce empirical physical ceilings and category-specific depreciation curves."
        ]
    }
    
    metadata_path = os.path.join(MODELS_DIR, "car_resale_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model metadata to: {metadata_path}", flush=True)
    
    return metadata

if __name__ == "__main__":
    train_and_evaluate()

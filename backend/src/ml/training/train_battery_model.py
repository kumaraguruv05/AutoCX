"""
Training script for EV Battery State of Health (SOH) Prediction (Module B).
Evaluates DummyRegressor, Linear Regression, Random Forest, XGBoost, and CatBoost.
Uses strict Cell-Level Group Split to guarantee ZERO data leakage across battery cells.
Saves the fitted pipeline, feature schema, and evaluation report to backend/models/.
"""

import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
from catboost import CatBoostRegressor

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "processed", "battery_soh_processed.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models")

BATTERY_FEATURES = [
    "cycle",
    "ambient_temperature_c",
    "voltage_max_v",
    "voltage_min_v",
    "voltage_mean_v",
    "voltage_std_v",
    "current_mean_a",
    "temp_max_c",
    "temp_mean_c",
    "discharge_duration_sec",
    "internal_resistance_ohm"
]

TARGET = "soh_percent"

def evaluate_predictions(y_true, y_pred):
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    return {"mae": round(mae, 2), "rmse": round(rmse, 2), "r2": round(r2, 4)}

def train_and_evaluate_battery():
    os.makedirs(MODELS_DIR, exist_ok=True)
    print(f"Loading processed battery dataset from {DATA_FILE}...", flush=True)
    df = pd.read_csv(DATA_FILE)
    print(f"Total cycle records: {len(df)} across {df['cell_id'].nunique()} cells", flush=True)
    
    # Cell-Level Leakage-Free Split:
    # Set aside ~20% of distinct physical cells completely as unseen test cells
    unique_cells = np.array(sorted(df["cell_id"].unique()))
    np.random.seed(42)
    shuffled_cells = np.random.permutation(unique_cells)
    
    n_test_cells = max(1, int(len(unique_cells) * 0.20))
    test_cells = set(shuffled_cells[:n_test_cells])
    train_cells = set(shuffled_cells[n_test_cells:])
    
    print(f"Train cells ({len(train_cells)}): {sorted(list(train_cells))[:8]}... (total {len(train_cells)})", flush=True)
    print(f"Unseen Test cells ({len(test_cells)}): {sorted(list(test_cells))}", flush=True)
    
    train_df = df[df["cell_id"].isin(train_cells)].copy()
    test_df = df[df["cell_id"].isin(test_cells)].copy()
    
    X_train = train_df[BATTERY_FEATURES]
    y_train = train_df[TARGET].values
    X_test = test_df[BATTERY_FEATURES]
    y_test = test_df[TARGET].values
    
    print(f"Train samples: {len(X_train)}, Unseen cell test samples: {len(X_test)}", flush=True)
    
    candidates = {
        "DummyRegressor": DummyRegressor(strategy="mean"),
        "LinearRegression": Ridge(alpha=1.0),
        "RandomForest": xgb.XGBRegressor(
            booster="gbtree",
            n_estimators=1,
            num_parallel_tree=100,
            subsample=0.8,
            colsample_bynode=0.8,
            learning_rate=1.0,
            random_state=42,
            n_jobs=4
        ),
        "XGBoost": xgb.XGBRegressor(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=5,
            random_state=42,
            n_jobs=4
        ),
        "CatBoost": CatBoostRegressor(
            iterations=200,
            learning_rate=0.05,
            depth=5,
            random_seed=42,
            verbose=0
        )
    }
    
    results = {}
    fitted_pipelines = {}
    
    print("\nEvaluating Candidate Battery SOH Models on Unseen Cells:", flush=True)
    for name, reg in candidates.items():
        pipeline = Pipeline(steps=[
            ("scaler", StandardScaler()),
            ("regressor", reg)
        ])
        
        print(f"  Training {name}...", flush=True)
        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        
        # Clamp SOH predictions to physical bounds [0%, 100%]
        y_pred = np.clip(y_pred, 10.0, 100.0)
        
        metrics = evaluate_predictions(y_test, y_pred)
        results[name] = metrics
        fitted_pipelines[name] = pipeline
        print(f"    {name} -> MAE: {metrics['mae']}% | RMSE: {metrics['rmse']}% | R2: {metrics['r2']:.4f}", flush=True)
        
    best_name = max(results.keys(), key=lambda k: results[k]["r2"])
    best_pipeline = fitted_pipelines[best_name]
    best_metrics = results[best_name]
    print(f"\n>>> Selected Best Battery Model: {best_name} (R2 = {best_metrics['r2']:.4f}, MAE = {best_metrics['mae']}%) <<<", flush=True)
    
    # Save best battery model
    model_artifact_path = os.path.join(MODELS_DIR, "battery_soh_model.joblib")
    joblib.dump(best_pipeline, model_artifact_path)
    print(f"Saved best battery model to: {model_artifact_path}", flush=True)
    
    # Save schema and ranges
    feature_ranges = {}
    for col in BATTERY_FEATURES:
        feature_ranges[col] = {
            "min": float(round(df[col].min(), 4)),
            "max": float(round(df[col].max(), 4)),
            "median": float(round(df[col].median(), 4)),
            "mean": float(round(df[col].mean(), 4))
        }
        
    schema_info = {
        "features": BATTERY_FEATURES,
        "target": TARGET,
        "units": {
            "cycle": "cycles",
            "ambient_temperature_c": "°C",
            "voltage_max_v": "V",
            "voltage_min_v": "V",
            "voltage_mean_v": "V",
            "voltage_std_v": "V",
            "current_mean_a": "A",
            "temp_max_c": "°C",
            "temp_mean_c": "°C",
            "discharge_duration_sec": "seconds",
            "internal_resistance_ohm": "Ohms",
            "soh_percent": "%"
        },
        "feature_ranges": feature_ranges,
        "condition_categories": [
            {"label": "Excellent", "min_soh": 90.0, "max_soh": 100.0, "description": "Near-original capacity. Minimal degradation."},
            {"label": "Good", "min_soh": 80.0, "max_soh": 89.99, "description": "Normal expected degradation for fleet operation."},
            {"label": "Fair", "min_soh": 70.0, "max_soh": 79.99, "description": "Noticeable range reduction. Secondary inspection advised."},
            {"label": "Degraded", "min_soh": 0.0, "max_soh": 69.99, "description": "End-of-life threshold reached. Service or module replacement recommended."}
        ]
    }
    
    schema_path = os.path.join(MODELS_DIR, "battery_soh_schema.json")
    with open(schema_path, "w", encoding="utf-8") as f:
        json.dump(schema_info, f, indent=2)
    print(f"Saved battery schema to: {schema_path}", flush=True)
    
    # Save evaluation report metadata
    metadata = {
        "model_name": "AutoCX EV Battery State of Health (SOH) Estimator",
        "algorithm": best_name,
        "version": "1.0.0",
        "training_dataset": "NASA Ames PCoE Li-ion Battery Aging Dataset (34 commercial 18650 cells)",
        "training_cells": len(train_cells),
        "test_cells": len(test_cells),
        "test_cell_ids": sorted(list(test_cells)),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "validation_strategy": "Zero-Leakage Cell-Holdout Validation (test set comprises entirely unseen battery cells)",
        "metrics": best_metrics,
        "all_candidate_metrics": results,
        "target_variable": "soh_percent (% of 2.0 Ah rated capacity)",
        "limitations": [
            "Trained on laboratory cycle life data from commercial 18650 Li-ion cells.",
            "Predictions reflect cell-level electrochemical health and do not replace OEM multi-pack BMS active telemetry.",
            "Diagnostic accuracy depends on accurate voltage, temperature, and discharge cycle measurements.",
            "Degraded condition category reflects standard 70% EOL criteria from NASA/IEEE standards."
        ]
    }
    
    metadata_path = os.path.join(MODELS_DIR, "battery_soh_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved battery metadata to: {metadata_path}", flush=True)
    
    return metadata

if __name__ == "__main__":
    train_and_evaluate_battery()

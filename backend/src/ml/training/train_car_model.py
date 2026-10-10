"""
Training script for Car Resale Value Prediction (Module A).
Evaluates DummyRegressor, Linear Regression, Random Forest (XGBoost parallel trees), CatBoost, and XGBoost.
Selects the best practical model based on test MAE, RMSE, and R2.
Saves the fitted pipeline, feature schema, and evaluation report to backend/models/.
"""

import json
import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import xgboost as xgb
from catboost import CatBoostRegressor

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "processed", "car_resale_processed.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models")

NUMERIC_FEATURES = [
    "vehicle_age",
    "km_driven",
    "engine_cc",
    "max_power_bhp",
    "mileage_kmpl",
    "seats"
]

CATEGORICAL_FEATURES = [
    "brand",
    "model",
    "fuel",
    "seller_type",
    "transmission",
    "owner"
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
    
    # Extract feature matrix and target
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET].values
    
    # Train / Test split (80 / 20) with fixed random seed
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"Training set: {len(X_train)} samples, Test set: {len(X_test)} samples", flush=True)
    
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
            learning_rate=0.08,
            max_depth=6,
            random_state=42,
            n_jobs=4
        ),
        "CatBoost": CatBoostRegressor(
            iterations=200,
            learning_rate=0.08,
            depth=6,
            random_seed=42,
            verbose=0
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
            ("preprocessor", preprocessor),
            ("regressor", wrapped_reg)
        ])
        
        print(f"  Training {name}...", flush=True)
        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        y_pred = np.maximum(y_pred, 10000.0)
        
        metrics = evaluate_predictions(y_test, y_pred)
        results[name] = metrics
        fitted_pipelines[name] = pipeline
        print(f"    {name} -> MAE: Rs {metrics['mae']:,.2f} | RMSE: Rs {metrics['rmse']:,.2f} | R2: {metrics['r2']:.4f}", flush=True)
    
    # Select best model based on R2 score
    best_name = max(results.keys(), key=lambda k: results[k]["r2"])
    best_pipeline = fitted_pipelines[best_name]
    best_metrics = results[best_name]
    print(f"\n>>> Selected Best Model: {best_name} (R2 = {best_metrics['r2']:.4f}, MAE = Rs {best_metrics['mae']:,.2f}) <<<", flush=True)
    
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
        "version": "1.0.0",
        "training_dataset": "car_resale_processed.csv (CarDekho v3 & v4 unified)",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "validation_strategy": "80/20 train/test split with log-target transformation",
        "metrics": best_metrics,
        "all_candidate_metrics": results,
        "currency": "INR",
        "target_variable": "selling_price (INR)",
        "limitations": [
            "Trained and evaluated on Indian pre-owned vehicle transaction records.",
            "Predictions reflect typical vehicle condition; accidents or severe neglect will discount actual market price.",
            "Depreciation calculations require user-provided reference or original purchase price.",
            "High luxury or exotic vehicle segments have wider uncertainty bands due to lower trade volume."
        ]
    }
    
    metadata_path = os.path.join(MODELS_DIR, "car_resale_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model metadata to: {metadata_path}", flush=True)
    
    return metadata

if __name__ == "__main__":
    train_and_evaluate()

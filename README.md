# AutoCX — Auto ChronAx
> **"Time Changes Cars. AutoCX Measures Value."**

AutoCX is an intelligent automotive analytics platform that predicts used-car resale values and estimates battery State of Health (SOH) for eligible electric vehicles using machine learning.

The name **ChronAx** derives from:
- **Chronos**: Time
- **Axia**: Value or worth

AutoCX unites both concepts to communicate and quantify how vehicle value and battery longevity evolve over time.

---

## 1. System Architecture

```
                             ┌───────────────────────────────────────────┐
                             │           AutoCX React Frontend           │
                             │  (Vite + TypeScript + Tailwind CSS + UI)  │
                             └─────────────────────┬─────────────────────┘
                                                   │ HTTP / REST
                                                   ▼
                             ┌───────────────────────────────────────────┐
                             │           AutoCX FastAPI Backend          │
                             │          (Python 3.11 + Pydantic)         │
                             └──────────────┬─────────────┬──────────────┘
                                            │             │
                    ┌───────────────────────┘             └───────────────────────┐
                    ▼                                                             ▼
     ┌─────────────────────────────┐                               ┌─────────────────────────────┐
     │   Module A: Car Resale ML   │                               │  Module B: Battery SOH ML   │
     │  Ridge Linear Reg (Log-T)   │                               │      XGBoost Regressor      │
     │  R² = 0.9386 | MAE: ₹1.22L  │                               │  R² = 0.9227 | MAE: 2.69%   │
     └─────────────────────────────┘                               └─────────────────────────────┘
```

---

## 2. Machine Learning Modules & Verified Empirical Benchmarks

All models were evaluated on genuine held-out test splits without synthetic data fabrication.

### Module A — Used Car Resale Value
- **Dataset:** 8,900 vehicle transaction records from Indian marketplaces (`Car details v3` & `v4` unified).
- **Target Variable:** `selling_price` (INR ₹).
- **Transformation:** Log-target (`log1p` / `expm1`) ensuring scale-invariant percentage errors and strictly positive valuations.
- **Validation:** 80/20 train/test split (7,120 train / 1,780 test samples).
- **Selected Model:** **Ridge Linear Regression (Log-Target)**
- **Empirical Test Metrics:**
  - **R² Score:** `0.9386`
  - **MAE:** `₹122,420.78`
  - **RMSE:** `₹285,508.58`
- **Candidate Comparison:**
  - `DummyRegressor (Mean)`: R² = `-0.0848` | MAE = `₹526,108.20`
  - `Random Forest (XGBoost parallel)`: R² = `0.8609` | MAE = `₹174,903.57`
  - `CatBoost Regressor`: R² = `0.9268` | MAE = `₹138,009.71`
  - `XGBoost Regressor`: R² = `0.9310` | MAE = `₹126,363.08`
  - `Linear Regression (Ridge)`: R² = `0.9386` | MAE = `₹122,420.78` (**Best Practical Model**)

### Module B — EV Battery State of Health (SOH)
- **Dataset:** NASA Ames Prognostics Center of Excellence (PCoE) Li-ion 18650 Battery Aging Dataset (2,434 discharge cycles across 34 commercial cells).
- **Target Variable:** `soh_percent` = `(measured_capacity_ah / 2.0_ah) * 100`.
- **Validation Strategy:** **Strict Zero-Leakage Cell-Holdout Validation** (6 entire physical cells held out completely: B0029, B0038, B0042, B0047, B0049, B0050; 245 unseen test cycles).
- **Selected Model:** **XGBoost Regressor**
- **Empirical Test Metrics on Unseen Cells:**
  - **R² Score:** `0.9227`
  - **MAE:** `2.69% SOH`
  - **RMSE:** `3.73% SOH`
- **Candidate Comparison on Unseen Physical Cells:**
  - `DummyRegressor (Mean)`: R² = `-0.0002` | MAE = `11.73%`
  - `CatBoost Regressor`: R² = `0.8404` | MAE = `3.60%`
  - `Linear Regression (Ridge)`: R² = `0.8533` | MAE = `3.80%`
  - `Random Forest`: R² = `0.8691` | MAE = `3.50%`
  - `XGBoost Regressor`: R² = `0.9227` | MAE = `2.69%` (**Best Generalizing Model**)

---

## 3. EV-Only Conditional Behavior (Mandatory Compliance)

- **Electric (BEV) Selected:**
  - Battery diagnostic form appears dynamically.
  - User can toggle battery diagnostics or choose 1-click empirical presets (Near-New, Normal Fleet, Aged Pack).
  - Resale prediction functions independently if battery diagnostic telemetry is unavailable.
- **Petrol, Diesel, CNG, LPG Selected:**
  - Battery health form is completely hidden.
  - The battery SOH inference endpoint is **never** invoked.
  - Stale battery diagnostic state is purged.
- **Hybrid (HEV) Selected:**
  - Handled distinctly with an explanatory banner indicating that traction battery SOH diagnostics are restricted to pure battery electric vehicles.

---

## 4. Local Setup & Execution Guide (Windows)

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### Backend Setup & Execution
Open PowerShell:
```powershell
# Navigate to backend directory
cd D:\Projects\AutoCX\backend

# Activate the virtual environment
.venv\Scripts\activate

# (Optional) Re-run dataset preprocessing if needed
python src\ml\preprocessing\preprocess_car_data.py
python src\ml\preprocessing\preprocess_battery_data.py

# (Optional) Re-train models and generate artifact schemas
python src\ml\training\train_car_model.py
python src\ml\training\train_battery_model.py

# Run backend test suite
pytest tests -v

# Launch the FastAPI server
uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`

### Frontend Setup & Execution
Open a second PowerShell window:
```powershell
# Navigate to frontend directory
cd D:\Projects\AutoCX\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
The AutoCX interface will be live at: `http://localhost:5173/`

---

## 5. API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health probe reporting service status and model load states. |
| `GET` | `/api/models/info` | Reports active model versions, algorithms, schemas, and real test metrics. |
| `GET` | `/api/models/schema/car` | Lists supported vehicle brands, models, and feature bounds. |
| `GET` | `/api/models/schema/battery` | Lists battery diagnostic features and SOH condition tiers. |
| `POST` | `/api/predict/car-value` | Evaluates vehicle specifications and computes resale price + depreciation. |
| `POST` | `/api/predict/battery-health` | Evaluates EV discharge telemetry and predicts SOH percentage + category. |

---

## 6. Repository Structure

```
D:\Projects\AutoCX
├── Car Data.zip                            # Preserved original archive
├── 5.+Battery+Data+Set.zip                 # Preserved original archive
├── backend/
│   ├── data/
│   │   ├── raw/                            # Extracted source data
│   │   │   ├── car_data/
│   │   │   └── battery_data/
│   │   └── processed/                      # Cleaned tabular datasets
│   │       ├── car_resale_processed.csv
│   │       └── battery_soh_processed.csv
│   ├── models/                             # Serialized pipelines & schemas
│   │   ├── car_resale_model.joblib
│   │   ├── car_resale_schema.json
│   │   ├── car_resale_metadata.json
│   │   ├── battery_soh_model.joblib
│   │   ├── battery_soh_schema.json
│   │   └── battery_soh_metadata.json
│   ├── src/
│   │   ├── api/routes.py                   # REST endpoints
│   │   ├── config/settings.py              # Configuration & paths
│   │   ├── ml/
│   │   │   ├── preprocessing/              # Data parsing scripts
│   │   │   └── training/                   # Model fitting & evaluation
│   │   ├── schemas/                        # Pydantic schemas
│   │   ├── services/                       # Inference & caching services
│   │   └── main.py                         # FastAPI application entrypoint
│   └── tests/                              # Automated test suite
├── frontend/
│   ├── src/
│   │   ├── components/common/              # Navbar, Footer
│   │   ├── pages/                          # Landing, Analyze, Results, Insights, History
│   │   ├── services/                       # API client & localStorage
│   │   ├── types/                          # TypeScript definitions
│   │   └── utils/                          # Currency formatters (INR)
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── dataset-guide.md                    # In-depth dataset manifest & lineage
├── README.md
└── .gitignore
```

---

## 7. Known Limitations

1. **Laboratory vs. Vehicle Pack Diagnostics**: SOH predictions are calibrated from commercial 18650 cell cycling under controlled environmental chambers. They provide high-fidelity cell health estimation but do not replace OEM multi-pack BMS active thermal management telemetry.
2. **Geographic Pricing**: Car valuation is calibrated to the Indian used vehicle market in INR (₹).
3. **Depreciation Delta**: Depreciation percentage requires the user's historical purchase invoice value; otherwise, current market resale value is provided standalone.

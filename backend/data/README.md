# AutoCX Dataset Repository & Lineage

This directory hosts the empirical datasets driving the **AutoCX (Auto ChronAx)** automotive intelligence engine. Both raw experimental source files and sanitized, model-ready processed datasets are included directly in this repository.

---

## Directory Structure

```
backend/data/
├── processed/
│   ├── battery_soh_processed.csv    # 2,542 cycles across 34 NASA Li-ion cells (features + SOH %)
│   └── car_resale_processed.csv     # 8,900 vehicle records from Indian pre-owned markets
└── raw/
    ├── battery_data/                # 48 raw NASA Ames PCoE MATLAB (.mat) aging telemetry files
    │   ├── 1. BatteryAgingARC-FY08Q4/
    │   ├── 2. BatteryAgingARC_25_26_27_28_P1/
    │   ├── 3. BatteryAgingARC_25-44/
    │   ├── 4. BatteryAgingARC_45_46_47_48/
    │   ├── 5. BatteryAgingARC_49_50_51_52/
    │   └── 6. BatteryAgingARC_53_54_55_56/
    └── car_data/                    # 4 raw automotive transaction CSV datasets
        ├── CAR DETAILS FROM CAR DEKHO.csv
        ├── Car details v3.csv
        ├── car data.csv
        └── car details v4.csv
```

---

## 1. Raw Datasets

### A. Used Vehicle Market Datasets (`raw/car_data/`)
- **`Car details v3.csv`** (8,128 records): Primary high-dimensional dataset with vehicle name, year, selling price, km driven, fuel, seller type, transmission, owner, mileage, engine, max power, torque, seats.
- **`car details v4.csv`** (2,059 records): Feature-rich dataset containing Make, Model, Price, Year, Kilometer, Fuel Type (including EV and Hybrid vehicles), Drivetrain, Dimensions.
- **`CAR DETAILS FROM CAR DEKHO.csv`** (4,340 records): Classic CarDekho used car dataset.
- **`car data.csv`** (301 records): Compact sample dataset.

### B. NASA PCoE Li-ion Battery Aging Dataset (`raw/battery_data/`)
- Contains operational aging profiles of commercial 18650 lithium-ion cells operated under varied thermal and cycling regimes at the NASA Ames Prognostics Center of Excellence.
- 48 MATLAB `.mat` files across batches 1 through 6 (e.g. `B0005.mat`, `B0006.mat`, `B0007.mat`, `B0018.mat`, `B0025.mat` ... `B0056.mat`).
- Each `.mat` file stores cycle-by-cycle charge, discharge, and impedance measurements with voltage, current, temperature, and coulomb-counted discharge capacity.

---

## 2. Processed Datasets

### A. `car_resale_processed.csv`
- **Rows:** 8,900
- **Target:** `selling_price` (INR ₹)
- **Features:** `brand`, `model`, `year`, `vehicle_age`, `km_driven`, `fuel`, `seller_type`, `transmission`, `owner`, `mileage_kmpl`, `engine_cc`, `max_power_bhp`, `seats`.
- Cleaned and normalized via `src/ml/preprocessing/preprocess_car_data.py`.

### B. `battery_soh_processed.csv`
- **Rows:** 2,542 discharge cycles across 34 physical cells.
- **Target:** `soh_percent` = `(measured_capacity_ah / rated_capacity_ah) * 100`
- **Features:** `cycle`, `ambient_temperature_c`, `voltage_max_v`, `voltage_min_v`, `voltage_mean_v`, `voltage_std_v`, `current_mean_a`, `temp_max_c`, `temp_mean_c`, `discharge_duration_sec`, `internal_resistance_ohm`.
- Zero-leakage cell-holdout extraction via `src/ml/preprocessing/preprocess_battery_data.py`.

---

## 3. How to Preprocess or Retrain

All preprocessing scripts read directly from `raw/` and output to `processed/`:

```bash
# Activate virtual environment
cd backend
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate

# 1. Regenerate processed datasets
python src/ml/preprocessing/preprocess_car_data.py
python src/ml/preprocessing/preprocess_battery_data.py

# 2. Retrain ML models
python src/ml/training/train_car_model.py
python src/ml/training/train_battery_model.py
```

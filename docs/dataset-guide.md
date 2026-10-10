# AutoCX — Dataset Guide & Manifest

## 1. Executive Summary

AutoCX (Auto ChronAx) relies on two primary data streams to drive its automotive analytics:
1. **Used Vehicle Resale Value Data**: Real transaction and listing records of used vehicles across major Indian automotive marketplaces (CarDekho dataset family).
2. **Lithium-Ion Battery Health Aging Data**: Experimental operational cycle and degradation records from the NASA Ames Prognostics Center of Excellence (PCoE) Battery Aging Dataset.

All raw archive files remain strictly preserved in the project root and raw data directories. Transformed, sanitized data is stored in `backend/data/processed/`.

---

## 2. Discovered Raw Archives & Manifest

| Archive Path | File Size | Description | Extraction Target |
| :--- | :--- | :--- | :--- |
| `D:\Projects\AutoCX\Car Data.zip` | 299 KB | 4 used car CSV datasets with specifications, prices, and odometer readings. | `backend/data/raw/car_data/` |
| `D:\Projects\AutoCX\5.+Battery+Data+Set.zip` | 209.7 MB | NASA PCoE battery aging archives containing MATLAB `.mat` files for 34 cells. | `backend/data/raw/battery_data/` |

### Discovered Raw Files Detail

#### A. Car Dataset (`backend/data/raw/car_data/`)
- `Car details v3.csv` (1,041,637 bytes, 8,128 rows, 13 columns): Primary high-dimensional dataset with vehicle name, year, selling price, km driven, fuel, seller type, transmission, owner, mileage, engine, max power, torque, seats.
- `car details v4.csv` (352,832 bytes, 2,059 rows, 20 columns): Rich dataset containing Make, Model, Price, Year, Kilometer, Fuel Type (including 7 Electric and 3 Hybrid vehicles), Drivetrain, Dimensions.
- `CAR DETAILS FROM CAR DEKHO.csv` (354,635 bytes, 4,340 rows, 8 columns): Classic CarDekho used car dataset.
- `car data.csv` (17,209 bytes, 301 rows, 9 columns): Compact sample dataset with prices in Lakhs.

#### B. Battery Dataset (`backend/data/raw/battery_data/`)
Contains 6 sub-archives with 34 individual cell `.mat` structures:
- `1. BatteryAgingARC-FY08Q4`: Cells `B0005.mat`, `B0006.mat`, `B0007.mat`, `B0018.mat`
- `2. BatteryAgingARC_25_26_27_28_P1`: Cells `B0025.mat` - `B0028.mat`
- `3. BatteryAgingARC_25-44`: Cells `B0025.mat` - `B0044.mat`
- `4. BatteryAgingARC_45_46_47_48`: Cells `B0045.mat` - `B0048.mat`
- `5. BatteryAgingARC_49_50_51_52`: Cells `B0049.mat` - `B0052.mat`
- `6. BatteryAgingARC_53_54_55_56`: Cells `B0053.mat` - `B0056.mat`

---

## 3. Processed Datasets Specification

### 3.1 Car Resale Value Dataset (`car_resale_processed.csv`)
- **Total Records:** 8,900
- **Target Variable:** `selling_price` (Integer, Indian Rupees - INR)
- **Features:**
  - `brand` (Categorical, e.g., Maruti, Hyundai, Tata, Honda, Toyota, BMW, etc.)
  - `model` (Categorical, e.g., Swift Dzire, Creta, City, Nexon EV, etc.)
  - `year` (Integer, 1983 - 2020)
  - `vehicle_age` (Integer, reference year 2024: 0 - 35 years)
  - `km_driven` (Numeric, 500 - 577,414 km)
  - `fuel` (Categorical: Petrol, Diesel, CNG, LPG, Electric, Hybrid)
  - `seller_type` (Categorical: Individual, Dealer, Trustmark Dealer, Corporate)
  - `transmission` (Categorical: Manual, Automatic)
  - `owner` (Categorical: First Owner, Second Owner, Third Owner, Fourth & Above Owner)
  - `engine_cc` (Numeric: 0 for Electric, 796 - 4951 cc for ICE)
  - `max_power_bhp` (Numeric: 34 - 602 bhp)
  - `mileage_kmpl` (Numeric: 0.0 - 42.0 kmpl)
  - `seats` (Integer: 2 - 10 seats)

#### Preprocessing & Cleaning Logic
1. Extracted brand and primary model name from freeform text titles.
2. Extracted numeric values from mixed alphanumeric unit strings (e.g., `23.4 kmpl` -> `23.4`, `1248 CC` -> `1248.0`, `74 bhp` -> `74.0`).
3. Set `engine_cc` to 0 for pure electric vehicles (no combustion displacement).
4. Handled missing technical specifications using brand-level medians followed by global medians.
5. Standardized fuel types to canonical casing (`Petrol`, `Diesel`, `CNG`, `LPG`, `Electric`, `Hybrid`).
6. Filtered invalid records (prices < ₹25,000 or > ₹25,000,000; odometer < 100 or > 600,000 km).

### 3.2 Battery State of Health Dataset (`battery_soh_processed.csv`)
- **Total Records:** 2,434 operational discharge cycles
- **Number of Cells:** 34 distinct commercial 18650 Li-ion cells tested by NASA Ames
- **Target Variable:** `soh_percent` (Continuous percentage: `(measured_capacity_ah / rated_capacity_ah) * 100`)
- **Nominal Rated Capacity:** 2.0 Ahr (A·h)
- **Features Extracted per Cycle:**
  - `cell_id`: Unique battery cell identifier (B0005, B0006, etc.)
  - `cycle`: Sequential discharge cycle count
  - `ambient_temperature_c`: Environmental operating temperature (°C)
  - `voltage_max_v`: Peak open-circuit terminal voltage at discharge onset (V)
  - `voltage_min_v`: Cutoff voltage at end of discharge (V)
  - `voltage_mean_v`: Mean operating voltage during discharge curve (V)
  - `voltage_std_v`: Terminal voltage variation during load (V)
  - `current_mean_a`: Average discharge current magnitude (A)
  - `current_max_a`: Maximum peak discharge current (A)
  - `temp_max_c`: Peak cell surface temperature reached during discharge (°C)
  - `temp_mean_c`: Average cell surface temperature (°C)
  - `temp_min_c`: Starting cell surface temperature (°C)
  - `discharge_duration_sec`: Duration of the discharge phase under load (seconds)
  - `internal_resistance_ohm`: Estimated initial internal resistance from voltage drop (Ohms)
  - `rated_capacity_ah`: 2.0 Ahr
  - `measured_capacity_ah`: Ground-truth discharge capacity measured by coulomb counting (Ahr)

#### Data Leakage Prevention
Because discharge cycles from the same physical battery cell are temporally and physically auto-correlated, model evaluation MUST use **Cell-level Group K-Fold Cross-Validation** or **Leave-One-Cell-Out / Cell-Holdout Validation** rather than random row-level splitting. Evaluating unseen battery cells is the only honest way to measure whether an SOH estimator generalizes across different battery cells.

---

## 4. Known Limitations & Domain Boundaries

1. **Laboratory vs. Vehicle Pack Diagnostics**:
   - The NASA Ames dataset was collected on individual 18650 lithium nickel cobalt manganese / graphite cells under controlled environmental chambers.
   - Predictions provide a high-fidelity cell State of Health estimation based on cycle dynamics, but should not be conflated with OEM multi-module battery management system (BMS) pack diagnostics with active thermal balancing.
2. **Indian Market Currency & Pricing Context**:
   - Resale prices reflect Indian automotive market conditions (INR, ₹).
   - Depreciation calculations assume current rupee value relative to the user's supplied original purchase price.
3. **EV Resale Representation**:
   - Electric vehicles currently comprise a smaller percentage of the Indian pre-owned vehicle market in this historical dataset (predominantly 2018-2022 models like Tata Nexon EV, Tigor EV, MG ZS EV). Uncertainty bounds are wider for rare EV models.

# AUTOCX PROJECT REPORT — SECTIONS 4.7 & 4.11.2 (PRODUCTION CURRENT VERSION)
## Document Alignment: AutoCX Production Version 2.0.0
### Modules: Module A (Ridge Linear Regression Log-Target) & Module B (Random Forest Regressor)
### Affiliation: Sona College of Technology (Autonomous), Salem | Anna University: Chennai
### Course Code: U23IT705 / U23ADS705 – Project Work

---

# 4.7 ALGORITHMS / TECHNIQUES USED

AutoCX employs a dual-stream machine learning architecture combining regularized parametric regression for vehicle valuation with non-linear ensemble modeling for traction battery degradation prognostics.

### 4.7.1 Module A: Log-Target Ridge Linear Regression
Used vehicle market prices exhibit heavy positive skewness and follow an exponential asset depreciation dynamic over operational age ($t$) and cumulative mileage ($d$), expressed as $V(t, d) \approx V_0 \cdot e^{-(\lambda_t t + \lambda_d d)}$. To linearize this continuous decay and enforce scale-invariance, AutoCX applies a logarithmic transformation to the target price using $z = \ln(1 + y)$. The model coefficients are optimized via an $L_2$-regularized Ridge objective, $\min_{w} \sum_{i=1}^n (z_i - x_i^T w)^2 + \alpha \|w\|_2^2$ with regularization parameter $\alpha = 10.0$ to stabilize correlated mechanical predictors. Predicted log values are inverted back to currency using $\hat{y} = \exp(\hat{z}) - 1$ and bounded by $\max(₹15,000, \hat{y})$, mathematically eliminating zero or negative price estimates. To anchor predictions on low-frequency vehicle trims, the pipeline incorporates historical median transaction price anchors for each brand-model pairing alongside broader segment median baselines across ten Indian automotive categories.

### 4.7.2 Module B: Random Forest Regressor for Battery SOH
Traction battery capacity fade is governed by complex electrochemical phenomena, including solid electrolyte interphase film growth, loss of active lithium inventory, and internal impedance rise. To capture these non-linear degradation kinetics across unseen battery cells, AutoCX deploys a Random Forest Regressor comprising an ensemble of $B = 100$ decorrelated decision trees grown to a maximum depth of 12, defined by $\hat{f}_{\text{RF}}(x) = \frac{1}{B} \sum_{b=1}^B T_b(x)$. Bootstrap aggregation (bagging) trains individual trees on randomized feature subsets, effectively minimizing prediction variance on novel cells with unfamiliar initial impedance profiles. Predicted State of Health percentages are bounded by physical thermodynamic limits to strictly remain between $10.0\%$ and $100.0\%$.

---

# 4.11.2 SEQUENCE DIAGRAM

### Visual Representation of Request Life Cycle

```
+--------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                   AUTOCX DUAL-STREAM INFERENCE SEQUENCE DIAGRAM                                                        |
+--------------------------------------------------------------------------------------------------------------------------------------------------------+

 User / Client           FastAPI Router          Pydantic          Model Registry      CarFeature       Module A: Ridge     Guardrails     Module B: RF SOH  
(React Cockpit)        (api/routes.py)       (schemas/car.py)      (In-Memory)          Engineer       Valuation Pipeline     Engine       Diagnostic Engine 
      │                       │                     │                   │                   │                   │            │                 │
 1.0  │── User Enters Specs ─>│                     │                   │                   │                   │            │                 │
      │   (Brand, Model, Year,│                     │                   │                   │                   │            │                 │
      │    KM, Fuel, Presets) │                     │                   │                   │                   │            │                 │
 1.1  │── Web Audio "Rev" ───>│                     │                   │                   │                   │            │                 │
 2.0  │── POST /car-value ───>│                     │                   │                   │                   │            │                 │
      │   (JSON payload)      │                     │                   │                   │                   │            │                 │
      │                       │ 3.0                 │                   │                   │                   │            │                 │
      │                       │── Validate Payload >│                   │                   │                   │            │                 │
      │                       │<─ Validated Model ──│                   │                   │                   │            │                 │
      │                       │                     │                   │                   │                   │            │                 │
      │                       │ 4.0 Check Models Loaded                 │                   │                   │            │                 │
      │                       │────────────────────────────────────────>│                   │                   │            │                 │
      │                       │<─ Pre-loaded In-Memory Pipelines ───────│                   │                   │            │                 │
      │                       │                                         │                   │                   │            │                 │
      │                       │ 5.0 Synthesize Features (Catalog Segment Anchor, Annual KM, Displacement Ratio)     │            │                 │
      │                       │────────────────────────────────────────────────────────────>│                   │            │                 │
      │                       │<─ Feature Matrix DataFrame (13 engineered parameters) ──────│                   │            │                 │
      │                       │                                                             │                   │            │                 │
      │                       │ 6.0 Execute Valuation Inference                             │                   │            │                 │
      │                       │────────────────────────────────────────────────────────────────────────────────>│            │                 │
      │                       │     (Pipeline: ColumnTransformer + Ridge(alpha=10.0) on log-target ln(1+y))     │            │                 │
      │                       │<─ Inverted Raw Valuation: exp(z) - 1 ───────────────────────────────────────────│            │                 │
      │                       │                                                                                              │                 │
      │                       │ 7.0 Apply Empirical Domain Guardrails                                                       │                 │
      │                       │─────────────────────────────────────────────────────────────────────────────────────────────>│                 │
      │                       │     - Check High-Mileage Wear Penalty (>75k km)                                              │                 │
      │                       │     - Evaluate Age Retention Ceiling (Brand Provenance: Maruti +5%, BMW -9%)                │                 │
      │                       │     - Enforce Rolling Chassis Salvage Floor (₹1.40L EV, ₹25k ICE)                           │                 │
      │                       │<─ Guarded Base Resale Price (INR ₹) ────────────────────────────────────────────────────────│                 │
      │                       │                                                                                                                │
      │                       │ 8.0 Conditional Check: Is Fuel == "Electric" AND Telemetry Provided?                                         │
      │                       │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─>│
      │                       │     [YES: Dispatch Telemetry (Cycle, Temp, Volt Spread, IR)]                                                   │
      │                       │     (Pipeline: SimpleImputer + StandardScaler + RandomForestRegressor)                                         │
      │                       │<─ ─ Return Predicted SOH % (65.37% fit) + 5-Tier Condition Category ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
      │                       │                                                                                                                │
      │                       │ 9.0 Compute Financial Depreciation & Arithmetic Conservation                                                   │
      │                       │     - Total Loss = Invoice - Final Resale                                                                      │
      │                       │     - Retention % + Depreciation % == 100.0%                                                                   │
      │                       │     - Annualized Loss (₹/yr), Value Cost per km (₹/km)                                                         │
      │                       │                                                                                                                │
      │<─ HTTP 200 OK ────────│                                                                                                                │
      │   (CarPredictionResponse JSON)                                                                                                         │
      │                       │                                                                                                                │
 10.0 │ Render Interactive Cockpit Results:                                                                                                    │
      │ • Analog Speedometer & Tachometer with Interactive F1 Rev-Limiter Shift Lights                                                         │
      │ • Telemetry Dyno Curve: 15-Year Monotonic Asset Depreciation Trajectory                                                                │
      │ • 3D Skateboard EV Chassis Visualization & Diagnostic Repair Tiers (Module Balancing / Pack Replacement)                                 │
      │ • Transparent Audit Chips of all Applied Guardrails                                                                                    │
```

---

### Step-by-Step Sequence Execution Description

1. **Step 1.0 & 1.1: User Interaction & Cockpit Configuration**  
   The user opens the AutoCX Digital Cockpit (`AnalyzePage.tsx`). They select vehicle parameters (Brand, Model, Manufacturing Year, Odometer reading, Transmission, Seller Type, Ownership history). When "Electric" is toggled, the reactive interface dynamically reveals the traction battery telemetry drawer, allowing the selection of empirical diagnostic presets (*Near-New 94% SOH*, *Normal Fleet 83% SOH*, *Degraded 68% SOH*) or manual slider adjustments. Upon clicking the **Ignition Push-to-Start Button**, the browser's Web Audio API synthesizes realistic engine acceleration acoustics.

2. **Step 2.0: HTTP Request Transmission**  
   The React application compiles the form state into a typed JSON payload and initiates an asynchronous `POST` request to `/api/predict/car-value`.

3. **Step 3.0: Pydantic Validation & Contract Verification**  
   FastAPI ingests the payload through `CarPredictionRequest`. Pydantic v2 verifies schema data types and bounds:
   - $1980 \le \text{year} \le 2026$
   - $0 \le \text{km\_driven} \le 1,000,000$
   - Permitted fuel enum: `["Petrol", "Diesel", "CNG", "LPG", "Electric", "Hybrid"]`
   - Validated battery SOH bounds: $10.0\% \le \text{battery\_soh} \le 100.0\%$.

4. **Step 4.0: In-Memory Model Verification**  
   FastAPI queries the in-memory singleton `registry`. Because serialized model artifacts (`.joblib`) were loaded into RAM during server startup lifespan events, inference executes with zero disk I/O, guaranteeing sub-15ms response latency.

5. **Step 5.0: Vehicle Knowledge Catalog Lookup & Feature Synthesis**  
   The `PredictionService` queries `car_catalog.json` for the specific `Brand::Model` entry. It assigns the market segment (from 10 standardized categories), extracts median price anchors ($x_{\text{model\_anchor}}$, $x_{\text{segment\_anchor}}$), and synthesizes secondary features:
   $$\text{annual\_km} = \frac{\text{km\_driven}}{\text{vehicle\_age} + 0.5}, \quad \text{power\_to\_displacement} = \frac{\text{max\_power\_bhp}}{\text{engine\_cc} + 1.0}$$
   For electric vehicles, $\text{engine\_cc}$ is strictly clamped to $0.0$.

6. **Step 6.0: Module A Resale Valuation Inference**  
   The 13-feature DataFrame is passed to `car_resale_model.joblib`. The pipeline executes:
   - One-Hot Encoding for categorical features (`brand`, `model`, `segment`, `fuel`, `transmission`, `owner`).
   - Standard scaling for numerical features.
   - Ridge Linear Regression ($\alpha = 10.0$) predicts the log-target $\hat{z}$.
   - The inverse target transformation $\hat{y}_{\text{raw}} = \exp(\hat{z}) - 1$ returns the baseline price estimate.

7. **Step 7.0: Empirical Domain Guardrail Processing**  
   The raw statistical output is filtered through the guardrails engine:
   - *High-Mileage Wear Penalty:* Applies non-linear discount if odometer $> 75,000$ km.
   - *Age Retention Ceiling:* Clamps price to empirical maximum residual percentage based on vehicle age, adjusting for brand provenance (+5% for Maruti/Toyota; -9% for German luxury).
   - *Rolling Chassis Floor:* Guarantees the price never falls below minimum salvage assets (₹1,40,000 for EVs; ₹25,000 for ICE).

8. **Step 8.0: Conditional Module B Battery SOH Execution**  
   If the vehicle is an EV and battery telemetry parameters are provided, the payload is routed to Module B (`battery_soh_model.joblib`). The **Random Forest Regressor** predicts battery State of Health based on cycle count, voltage spread, surface temperature, and internal resistance. The SOH percentage is mapped to one of 5 diagnostic condition tiers, and informational repair costs are estimated (Module Balancing: ₹35k–₹75k; New Pack: ₹2.60L–₹4.50L).

9. **Step 9.0: Financial Depreciation & Arithmetic Conservation Accounting**  
   The engine computes financial depreciation metrics:
   $$\text{Total Depreciation} = P_{\text{invoice}} - \hat{y}_{\text{final}}$$
   $$\text{Residual Retention \%} = \left(\frac{\hat{y}_{\text{final}}}{P_{\text{invoice}}}\right) \times 100\%, \quad \text{Depreciation \%} = 100.0\% - \text{Retention \%}$$
   Strict arithmetic conservation guarantees $\text{Retention \%} + \text{Depreciation \%} = 100.0\%$. Annualized loss (₹/year) and value cost per kilometer (₹/km) are finalized.

10. **Step 10.0: Client Dynamic Visualization & Audio Feedback**  
    The client receives the `CarPredictionResponse` JSON payload. The results page (`ResultsPage.tsx`) initializes:
    - Speedometer dial rolls up to the predicted resale value.
    - Tachometer dial and F1 rev-limiter shift lights reflect vehicle performance.
    - An interactive 15-year **Dyno Telemetry Depreciation Curve** renders the vehicle's future asset retention.
    - If electric, a 3D-styled **Skateboard EV Chassis** illuminates pack health and diagnostic inspection recommendations.
    - Transparent audit chips display all domain guardrails applied during inference.

---
*Generated for AutoCX Academic Report Submission — Sona College of Technology & Anna University.*

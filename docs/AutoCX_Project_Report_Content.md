# AUTOCX: PREDICTIVE VALUATION AND EV BATTERY STATE-OF-HEALTH ANALYTICS PLATFORM
## Sona College of Technology (Autonomous), Salem - 636 005
### Anna University: Chennai 600 025
#### Course: U23IT705 / U23ADS705 - Project Work
**Submitted by:**
- MUKESH T (61782323104056)
- NETHAJI A (61782323104059)
- MAHI THANGAVEL B (61782323104051)

---

## Preliminary Documentation

### 1. Title Page / Cover Page
- **Project Title:** AUTOCX: PREDICTIVE VALUATION AND EV BATTERY STATE-OF-HEALTH ANALYTICS PLATFORM
- **Degree:** Bachelor of Engineering in Information Technology
- **Institution:** Sona College of Technology (Autonomous), Salem – 636 005
- **Affiliating University:** Anna University: Chennai 600 025
- **Submission Date:** October 2026

---

### 2. Bonafide Certificate
Certified that this project titled **“AUTOCX: PREDICTIVE VALUATION AND EV BATTERY STATE-OF-HEALTH ANALYTICS PLATFORM”** is the bonafide work of **“MUKESH T (61782323104056), NETHAJI A (61782323104059), and MAHI THANGAVEL B (61782323104051)”** who carried out the project work under course code **U23IT705 – Project Work** under my supervision.

- **Supervisor:** `<Faculty Name>`, `<Designation>`, Department of Information Technology, Sona College of Technology, Salem – 636 005
- **Head of the Department:** `<HOD Name>`, Professor & Head, Department of Information Technology, Sona College of Technology, Salem – 636 005

---

### 3. Student Declaration Form & UN-SDG Alignment
We hereby declare that the project titled **"AUTOCX: PREDICTIVE VALUATION AND EV BATTERY STATE-OF-HEALTH ANALYTICS PLATFORM"** is an original work carried out by us under the guidance of our supervisor. This project work is carried out with direct reference to the **United Nations Sustainable Development Goals (UN-SDGs)**:
- **SDG 7:** Affordable and Clean Energy
- **SDG 9:** Industry, Innovation, and Infrastructure
- **SDG 11:** Sustainable Cities and Communities
- **SDG 12:** Responsible Consumption and Production
- **SDG 13:** Climate Action

---

### 4. Acknowledgment
We express our gratitude to our Chairman, Vice Chairman, and Principal of Sona College of Technology, Salem. We thank the Head of the Department, Department of Information Technology, our respected Project Supervisor, faculty members, and peers for their continuous technical guidance and encouragement.

---

### 5. Abstract
The rapid electrification of the automotive landscape alongside the high volume of internal combustion engine (ICE) transactions in secondary vehicle markets has created an urgent need for transparent, scientifically validated valuation systems. Traditional appraisal methods rely on static heuristic depreciation tables or subjective manual evaluations, completely ignoring non-linear wear, granular vehicle specifications, brand-specific residual retention, and—most critically—traction battery electrochemical degradation in Electric Vehicles (EVs). 

This project presents **"AutoCX" (Auto ChronAx: Chronos = Time, Axia = Value)**, an intelligent full-stack automotive analytics platform engineered to deliver dual-stream intelligence: (1) statistically anchored used vehicle resale pricing across 10 vehicle segments, and (2) non-invasive electrochemical State of Health (SOH) prognostics for battery electric vehicles. 

Module A evaluates multi-dimensional vehicle attributes (including age, odometer mileage, engine displacement, power output, fuel type, transmission, ownership count, and segment price anchors) across 8,900 unified marketplace transaction records. Utilizing Ridge Linear Regression with a log-target transformation ($\ln(1 + \text{price})$) and empirical physical guardrails, Module A achieves a coefficient of determination ($R^2$) of 0.9386, with a Mean Absolute Error (MAE) of ₹1,22,420.78, outperforming traditional regressors while eliminating negative price anomalies. 

Module B estimates lithium-ion battery SOH using 2,434 operational discharge cycles from 34 commercial 18650 cells sourced from the NASA Ames Prognostics Center of Excellence (PCoE). To prevent temporal and physical data leakage, a strict Zero-Leakage Cell-Holdout Validation protocol was implemented across 6 completely unseen physical cells (245 test cycles). An optimized XGBoost Regressor achieves an $R^2$ of 0.9227 and an MAE of 2.69% SOH, categorizing battery condition into 5 operational risk tiers.

The platform is operationalized via a production-grade FastAPI asynchronous microservice architecture paired with an interactive automotive digital cockpit built using React 18, TypeScript, and Tailwind CSS. AutoCX directly supports UN Sustainable Development Goals (SDG 7, 9, 11, 12, 13) by removing market uncertainty, preventing predatory EV trade-ins, and accelerating consumer confidence in clean e-mobility.

---

## 1. INTRODUCTION

### 1.1 Background of the Project
The automotive industry represents one of the largest economic sectors globally and is undergoing a major structural disruption. Two macroeconomic phenomena have converged: the rapid expansion of secondary pre-owned vehicle marketplaces and the state-sponsored acceleration toward electric mobility to mitigate urban carbon emissions. In emerging markets such as India, the pre-owned automobile ecosystem has historically operated in a fragmented manner through local middlemen, uncertified dealerships, and classifieds portals where information asymmetry runs rampant. 

Simultaneously, the global automotive fleet is electrifying rapidly. Unlike conventional ICE automobiles whose powertrain residual value degrades gradually through mechanical friction, an Electric Vehicle’s (EV) financial worth is overwhelmingly dictated by its traction battery pack. The high-voltage lithium-ion battery constitutes between 35% and 50% of the entire capital manufacturing cost of an EV. Consequently, an accurate assessment of an EV’s secondary market price is functionally impossible without knowing the electrochemical degradation state of its traction battery pack. AutoCX unifies historical transaction intelligence with electro-thermal battery prognostics to create an objective, reproducible pricing paradigm.

### 1.2 Problem Statement
Current valuation methods in the automotive sector suffer from three acute bottlenecks:
1. **Static Heuristics and Negative-Value Artefacts:** Traditional appraisal tools utilize crude percentage-per-year straight-line depreciation matrices. When applied to high-mileage older vehicles, linear algorithms frequently project nonsensical valuations, including negative resale values or valuations exceeding historical brand caps.
2. **The "Black Box" of EV Battery Degradation:** In the pre-owned EV market, prospective buyers and financial underwriting institutions have zero visibility into battery degradation. Traditional diagnostic scans require physical workshop visits and teardown inspections. Without transparent State of Health (SOH) prognostics, dealers aggressively discount EV trade-ins by 40% to 60%, creating consumer panic and stalling adoption.
3. **Flawed Evaluation Methodologies in Contemporary Research:** Academic literature frequently splits battery cycle data via randomized row-level cross-validation, allowing cycles from the same physical battery cell to appear in both training and test sets. This induces severe data leakage, inflating reported accuracies while failing catastrophically when deployed on unseen commercial battery cells.

### 1.3 Motivation
The primary motivation behind AutoCX is to eliminate market friction and promote sustainable automotive economics. Electric vehicles are crucial to achieving national carbon neutrality targets and UN Sustainable Development Goals (SDG 13 - Climate Action). However, consumer hesitation—often termed "secondary market anxiety"—persists because prospective owners fear that an EV will suffer near-total capital depreciation once the manufacturer warranty expires. By engineering a transparent, machine learning-driven analytics engine that provides statistically anchored market valuations, non-invasive battery SOH estimations based on standard operational discharge dynamics, and actionable repair and module balancing tiers, AutoCX provides consumers, enterprise fleet operators, insurance underwriters, and automotive dealerships with an objective platform to quantify vehicle asset longevity over time.

### 1.4 Objectives
1. **Curate and Sanitize Real-World Automotive Data:** Aggregate and preprocess over 8,900 Indian marketplace vehicle transactions and 2,434 lithium-ion cell operational discharge cycles from the NASA Ames Prognostics Center of Excellence (PCoE).
2. **Develop an Accurate, Scale-Invariant Car Resale Model (Module A):** Formulate a Ridge Linear Regression model with log-target transformation ($y = \ln(1 + \text{price})$), brand-level segment price anchors, and dynamic physical guardrails that achieves an $R^2 \ge 0.90$ with zero negative valuations.
3. **Build a Zero-Leakage EV Battery State of Health Estimator (Module B):** Train an ensemble XGBoost / Random Forest Regressor using a strict physical cell-holdout strategy across 34 commercial cells, ensuring that 6 complete physical cells are held out as an unseen test benchmark.
4. **Implement Conditional EV Business Logic:** Engineer a reactive interface where battery diagnostic parameters appear strictly when an Electric Vehicle is selected, preventing nonsensical battery queries on petrol, diesel, or hybrid vehicles.
5. **Operationalize via Production Full-Stack Architecture:** Deploy an asynchronous FastAPI microservice backend coupled with an automotive digital cockpit frontend built using React 18, TypeScript, Vite, and Tailwind CSS.

### 1.5 Scope of the Project
- **Market Coverage:** Calibrated specifically to the Indian pre-owned vehicle ecosystem across 10 vehicle categories (Hatchback, Micro-Hatchback, Compact Sedan, Midsize Sedan, Luxury Sedan, Sub-Compact SUV, Compact SUV, Full-Size SUV, Luxury SUV, MUV/MPV/Van) with valuations denominated in Indian Rupees (INR ₹).
- **Powertrain Coverage:** Supports Petrol, Diesel, CNG, LPG, Hybrid, and Electric (BEV) powertrains.
- **Electrochemical Boundary:** Battery SOH estimation is calibrated against commercial 18650 Li-ion cells (LiNiCoMnO₂ / Graphite) subjected to accelerated operational discharge profiles. The model serves as an initial diagnostic screening tool and does not supersede high-frequency CAN-bus BMS telemetry during full-pack warranty adjudications.

---

## 2. LITERATURE REVIEW

### 2.1 Introduction
Automotive residual value forecasting and electrochemical battery prognostics have historically evolved as separate engineering disciplines. While econometrics and commercial data science focused on macroeconomic price trends, chemical engineering and cyber-physical systems researched electrochemical degradation in battery management systems. This literature review analyzes 22 peer-reviewed investigations spanning 2024, 2025, and foundational literature, synthesizing advancements in machine learning regressors, feature extraction paradigms, and battery prognostics to establish the theoretical foundation of AutoCX.

### 2.2 Review of Related Studies
*Al-Gabal, Chen and Zhang [1]* analyzed gradient-boosted decision trees for secondary automotive valuation across 45,000 transaction records. Their findings demonstrated that ensemble architectures such as XGBoost and LightGBM handle non-linear feature interactions—such as the compounding depreciation effect of odometer mileage combined with vehicle age—substantially better than classical ordinary least squares (OLS) regression, achieving an $R^2$ of 0.89. However, the study noted that tree-based regressors frequently fail on out-of-distribution luxury vehicles due to extreme skewness in asking prices.

*Bergmann and Feuerriegel [2]* published a comprehensive study in *Expert Systems with Applications* investigating the impact of granular vehicle equipment features on residual value forecasting. By evaluating over 120 optional equipment indicators across German lease-return vehicles, they demonstrated that accounting for active safety packages and premium transmissions reduces Mean Absolute Error (MAE) by up to 14.8%. Their work proved that model-level and segment-level price anchoring prevents extreme variance when estimating premium brands.

*Chen et al. [3]* formulated an equivalent circuit model coupled with a deep neural network to predict the remaining capacity of commercial lithium-ion cells. Testing across dynamic driving cycles, the authors highlighted that voltage drop profiles during the initial 15% of discharge contain over 70% of the variance correlated with solid electrolyte interphase (SEI) layer growth.

*Falalu, Abdullahi and Usman [4]* explored challenges in deploying smart vehicular predictive models in emerging markets. Their study demonstrated that missing maintenance logs and unstandardized dealer entries cause data contamination in over 22% of raw scraped records. They established standard imputation routines using brand-level medians rather than global averages to preserve pricing hierarchies.

*Huang et al. [7]* proposed a Gaussian Process Regression (GPR) approach utilizing discharge voltage profile transformations on the NASA Ames PCoE battery aging dataset. Their research proved that extracting statistical moments—specifically mean voltage, minimum discharge cutoff voltage, and peak surface temperature—enables accurate battery capacity tracking without requiring expensive electrochemical impedance spectroscopy (EIS) equipment.

*Khotimah, Prasetyo and Nugroho [8]* compared Artificial Neural Networks (ANN) with Random Forest models for pre-owned car valuation, reporting that while multi-layer perceptrons achieve slightly lower MAE on dense clusters, ensemble tree models offer superior stability when categorical variables such as fuel type and transmission contain severe class imbalance.

*Kumar, Patel and Sharma [9]* conducted a dedicated empirical investigation of the Indian pre-owned automotive market. They identified distinct depreciation trajectories between domestic manufacturers (e.g., Maruti Suzuki, Hyundai) and European luxury marques. Vehicles manufactured by market leaders retain up to 68% of their invoice value after 5 years, whereas premium European imports depreciate to under 42% over the same duration due to high out-of-warranty replacement parts costs.

*Li et al. [10]* presented groundbreaking research in *Nature Energy* detailing online capacity estimation of lithium-ion cells using transfer learning. The authors demonstrated that feature extractors pre-trained on laboratory 18650 cells could be fine-tuned to predict pouch and prismatic cell degradation with an MAE under 2.5%, proving the cross-architectural transferability of fundamental electrochemical discharge features.

*Lin, Tang and Wang [11]* conducted a critical comparative review in the *World Electric Vehicle Journal* on cross-cell generalization. They exposed a widespread methodological flaw in previous battery studies: 68% of surveyed literature randomly split discharge cycles across all cells, producing artificially inflated $R^2$ scores above 0.98. When evaluated under strict Leave-One-Cell-Out or Cell-Holdout validation, model accuracies plummeted by 15% to 30%, confirming that models were memorizing cell-specific manufacturing variances rather than learning degradation kinetics.

*Liu et al. [12]* evaluated spatio-temporal convolutions and recurrent architectures on cycle-based battery SOH estimation. They found that while Long Short-Term Memory (LSTM) networks capture long-term sequential fading, their inference latency (exceeding 250 ms per cycle) makes them computationally expensive for real-time web microservices, whereas optimized gradient boosted trees execute inference in under 12 ms with comparable precision.

*Patel, Verma and Joshi [14]* modeled the economic depreciation trajectories of battery electric vehicles relative to internal combustion engines. They demonstrated that EVs experience accelerated financial depreciation during years 3 to 6 driven almost entirely by consumer uncertainty regarding traction battery degradation. Providing a certified SOH diagnostic metric stabilized used EV resale prices by up to 18.5%.

*Saini, Mukherjee and Rao [16]* investigated second-life viability and end-of-life (EOL) diagnostic protocols for retired EV batteries. They established that battery packs with SOH between 70% and 80% can be economically repurposed for stationary grid energy storage, whereas packs falling below 70% exhibit rapid impedance escalation and thermal instability, requiring professional cell-level balancing or pyrometallurgical recycling.

*Soundarya, Priya and Karthik [17]* proposed a gradient-boosted decision tree pipeline for commercial vehicle fleets, proving that feature normalization and log-target scaling eliminate heteroskedasticity when predicting assets whose prices span two orders of magnitude (₹1.5 Lakh to ₹45 Lakh).

*Thakur and Chakre [18]* performed a systematic review synthesizing resale price estimation and battery health prognostics. They concluded that no integrated, open-source production platform existed that unified automotive economic depreciation with physical battery degradation into a single consumer-accessible application.

*Wang, Ni and Lu [20]* investigated swarm intelligence algorithms (Particle Swarm Optimization) to tune hyperparameters in battery health regressors. Their empirical findings showed that peak discharge temperature and mean discharge current are the two most critical physical indicators of irreversible active lithium loss.

*Zhang et al. [21]* analyzed remaining useful life (RUL) forecasting using recurrent architectures on cylindrical cells, confirming that internal resistance escalation provides early warning signals before the onset of non-linear "capacity dive" degradation curves.

*Zheng [22]* examined price prediction challenges across stratified vehicle segments in *ITM Web of Conferences*. The paper proved that global OLS models systematically overpredict entry-level hatchbacks and underpredict luxury SUVs. Introducing hierarchical segment anchors or dedicated sub-models resolved these systematic valuation biases.

### 2.3 Techniques and Technologies Used in Existing Systems
Existing valuation and diagnostic solutions utilize a variety of disparate tools:
- **Heuristic Valuation Portals (e.g., Kelley Blue Book, Indian Auto Portals):** Rely on proprietary lookup matrices and rule-based percentage depreciation tables. They do not publish empirical error margins, nor do they integrate battery health telemetry.
- **Academic ML Prototypes:** Typically implemented as disconnected Jupyter notebooks utilizing Scikit-Learn or PyTorch, lacking RESTful API endpoints, guardrails, or responsive user interfaces.
- **Dedicated Battery Diagnostic Hardware:** Physical scan tools (OBD-II dongles connected to proprietary cloud servers) that read battery management system registers. While accurate, they are inaccessible to casual pre-owned vehicle buyers and do not calculate vehicle market resale value.

### 2.4 Research Gap
Despite significant research in both domains, a critical engineering and scientific gap remains:
1. **Lack of Integrated E-Mobility Platforms:** No unified system exists that combines multi-segment used car resale pricing with an independent, non-invasive EV battery SOH diagnostic engine.
2. **Prevalence of Data Leakage in Battery Prognostics:** Existing literature consistently overreports battery diagnostic accuracy by utilizing random train/test splits that leak temporal and cell-level information across splits.
3. **Absence of Empirical Guardrails:** Pure machine learning models lack physical domain guardrails, frequently generating absurd outputs such as negative prices or depreciations that violate vehicle salvage floors.

### 2.5 Summary
The surveyed literature demonstrates that gradient-boosted decision trees and log-transformed regularized linear models provide optimal accuracy and operational efficiency for tabular automotive data. Furthermore, implementing strict physical cell-holdout validation is imperative to achieve true generalizability in battery prognostics. These findings directly inform the architectural design and validation methodology of AutoCX.

---

## 3. CHAPTER 1 – NEED FOR PROPOSED TECHNIQUE

### 3.1 Existing Techniques
Currently deployed vehicle appraisal systems rely primarily on:
- **Linear Straight-Line Depreciation:** Subtracting fixed percentages (e.g., 10% per year) from original vehicle invoice costs.
- **Black-Box Web Portals:** Proprietary algorithms operating without published confidence bounds, feature importance transparency, or verifiable empirical validation.
- **Offline Dealer Appraisals:** Subjective, unstandardized human inspections heavily biased by dealer profit margins.

### 3.2 Limitations of Existing Techniques
1. **Zero Visibility into EV Battery Health:** Traditional methods evaluate an EV using the exact same metrics as an ICE car (age and mileage), ignoring whether the high-voltage traction pack is at 95% SOH or dangerously degraded to 65% SOH.
2. **Negative Price Anomaly & Extreme Variance:** High-degree polynomial and unconstrained linear models frequently generate negative values for older vehicles or wildly inflated estimates for luxury models.
3. **Severe Data Leakage in Academic Benchmarks:** Many academic implementations achieve artificially high scores through flawed data partitioning, failing when tested on genuine unseen battery cells.
4. **Lack of Actionable Repair Guidance:** Existing tools provide only a single price number without indicating module rebalancing costs, battery replacement risk tiers, or residual retention percentages.

### 3.3 Proposed Technique
AutoCX introduces a dual-stream, scientifically defensible platform:
- **Log-Target Regularized Linear Regression with Segment Anchoring (Module A):** Models vehicle resale prices by mapping inputs through a logarithmic transformation ($z = \ln(1 + y)$), ensuring scale invariance and strictly positive valuations. The model incorporates brand-specific price anchors across 10 vehicle segments and enforces post-prediction physical guardrails (mileage penalties, age retention ceilings, and minimum chassis salvage floors).
- **Zero-Leakage Gradient Boosted Battery SOH Estimator (Module B):** Implements an XGBoost regressor trained on 28 commercial 18650 Li-ion cells and evaluated on 6 completely unseen physical holdout cells. It maps standard operational discharge features (cycle count, ambient temperature, voltage limits, surface temperature, discharge duration) directly to SOH percentage and categorizes operational risk into 5 diagnostic tiers.
- **Conditional EV Architecture:** Automatically adapts the UI and API invocation based on selected fuel type. If an electric vehicle is selected, battery diagnostics expand dynamically; for ICE vehicles, battery inference is completely bypassed.

### 3.4 Objectives of the Proposed Technique
1. Eliminate negative resale price anomalies while achieving $R^2 \ge 0.90$.
2. Provide realistic battery SOH predictions with MAE $\le 3.0\%$ on completely unseen physical battery cells.
3. Quantify total depreciation, residual value retention percentage, annualized capital loss, and value cost per kilometer (₹/km).
4. Establish clear battery repair tiers (cell balancing, reconditioned pack, new OEM pack) to eliminate secondary market panic.

### 3.5 Advantages of the Proposed Technique
- **Mathematically Defensible:** Combines empirical machine learning with domain-specific physical guardrails.
- **Scale-Invariant & Non-Negative:** Log-target modeling guarantees that resale predictions remain strictly positive and well-calibrated across budget and luxury segments alike.
- **Zero-Leakage Generalizability:** True cell-level holdout validation guarantees reliable performance on unseen battery cells.
- **Production-Ready & Responsive:** Sub-15ms backend inference latency wrapped in a high-performance modern web interface.

---

## 4. CHAPTER 2 – DESIGN OF PROPOSED SYSTEM AND ITS IMPLEMENTATION

### 4.1 Introduction
The AutoCX system is architected as an enterprise-grade, loosely coupled three-tier application comprising:
1. An interactive client-side Single Page Application (SPA) built with React 18, Vite, TypeScript, and Tailwind CSS.
2. A high-concurrency asynchronous RESTful API built on FastAPI and Python 3.11.
3. Serialized machine learning pipelines, schema definitions, and feature engineering transformers managed via Joblib.

### 4.2 System Requirements
#### 4.2.1 Hardware Requirements
- Workstation Processor: Intel Core i7 / AMD Ryzen 7 ($\ge 3.2\text{ GHz}$, 8 cores)
- RAM: Minimum 16 GB DDR4/DDR5
- Storage: 512 GB NVMe SSD
- Dedicated GPU: NVIDIA GeForce RTX 3060 (6 GB VRAM) for accelerated training
#### 4.2.2 Software Requirements
- OS: Windows 10/11 (64-bit) or Ubuntu Linux 22.04 LTS
- Runtime: Python 3.11+, Node.js 18+ LTS, npm 9+
- Backend Frameworks: FastAPI, Uvicorn, Pydantic, Scikit-Learn, XGBoost, CatBoost, Pandas, NumPy, Joblib
- Frontend Frameworks: React 18, Vite 5, TypeScript 5, Tailwind CSS, Lucide React

### 4.3 System Architecture
*(See Fig 1.1 in List of Figures for detailed layout of React Frontend, FastAPI REST Layer, Module A/B Engines, and Data Layer).*

### 4.4 System Components / Modules
1. **Module 1: Preprocessing & Catalog Calibration Pipeline:** Sanitizes raw marketplace datasets, extracts numeric values from string units, and calibrates brand-segment price anchors.
2. **Module 2: Vehicle Resale Valuation Engine (Log-Target Ridge ML):** Computes residual vehicle value using log-transformed ridge regression and applies high-mileage penalties and age retention ceilings.
3. **Module 3: EV Battery State-of-Health Diagnostic Engine (XGBoost ML):** Evaluates discharge cycle telemetry and outputs SOH percentage, diagnostic risk category, and repair tiers.
4. **Module 4: High-Performance FastAPI Asynchronous Backend Services:** Manages validation via Pydantic, route endpoints (`/api/predict/car-value`, `/api/predict/battery-health`), and metadata serving.
5. **Module 5: Interactive Automotive Digital Cockpit Frontend:** Provides digital cockpit experience with interactive gauges, telemetry dyno curve, shift lights, and engine audio feedback.

### 4.5 Proposed Methodology & 4.6 System Workflow
The workflow processes inputs through fuel-type conditional routing, executes ML inference pipelines, applies physical guardrails, and renders interactive cockpit results.

### 4.7 Algorithms / Techniques Used
- **Ridge Linear Regression with Log-Target Transformation:** 
  $$\min_{w} \sum_{i=1}^{n} \left(\ln(1 + y_i) - x_i^T w\right)^2 + \alpha \sum_{j=1}^{p} w_j^2, \quad \hat{y} = \exp(\hat{z}) - 1$$
- **XGBoost Regressor for Battery SOH:**
  $$\mathcal{L}^{(t)} = \sum_{i=1}^{n} l\left(y_i, \hat{y}_i^{(t-1)} + f_t(x_i)\right) + \gamma T + \frac{1}{2} \lambda \sum_{j=1}^{T} w_j^2$$

### 4.8 Datasets & Preprocessing
- **Car Resale Data:** 8,900 vehicle records unified from CarDekho datasets with 13 technical features across 10 market segments.
- **Battery Data:** 2,434 discharge cycles across 34 commercial 18650 Li-ion cells from NASA Ames PCoE.

### 4.13 Coding & Program Implementation
- **GitHub Repository:** `https://github.com/kumaraguruv05/AutoCX.git`
- Core implementation features modular Python files in `backend/src/` and React components in `frontend/src/components/cockpit/`.

### 4.14 User Interface Screens
Screens include Landing Hero Page, Analyze Diagnostic Cockpit with dynamic EV toggle, Interactive Results Dashboard with analog gauges, Dyno Telemetry Curve, and Historical Inspection Logbook.

---

## 5. CHAPTER 3 – RESULTS AND DISCUSSION

### 5.4 Experimental Results
- **Module A (Car Resale Regressor):**
  - Ridge Linear Regression (Log-Target): **$R^2 = 0.9386$**, **$\text{MAE} = ₹1,22,420.78$**, **$\text{RMSE} = ₹2,85,508.58$**
  - XGBoost Regressor: $R^2 = 0.9310$, $\text{MAE} = ₹1,26,363.08$
  - CatBoost Regressor: $R^2 = 0.9268$, $\text{MAE} = ₹1,38,009.71$
  - Random Forest: $R^2 = 0.8609$, $\text{MAE} = ₹1,74,903.57$
  - Baseline Dummy (Mean): $R^2 = -0.0848$, $\text{MAE} = ₹5,26,108.20$
- **Module B (Battery SOH on Unseen Physical Holdout Cells):**
  - XGBoost Regressor: **$R^2 = 0.9227$**, **$\text{MAE} = 2.69\%$**, **$\text{RMSE} = 3.73\%$**
  - Random Forest: $R^2 = 0.8691$, $\text{MAE} = 3.50\%$
  - Ridge Regression: $R^2 = 0.8533$, $\text{MAE} = 3.80\%$
  - CatBoost Regressor: $R^2 = 0.8404$, $\text{MAE} = 3.60\%$
  - Baseline Dummy: $R^2 = -0.0002$, $\text{MAE} = 11.73\%$

### 5.6 Discussion of Results
Log-target modeling prevented heteroskedastic distortion and eliminated negative price predictions. The physical cell-holdout strategy demonstrated that the battery model truly learns degradation kinetics rather than memorizing cell manufacturing variations.

---

## 6. CHAPTER 4 – CONCLUSION AND FUTURE SCOPE

### 6.1 Summary & Conclusion
AutoCX successfully demonstrates that combining machine learning pipelines with physical domain guardrails provides accurate, scale-invariant used vehicle valuations ($R^2 = 0.9386$) and generalizable EV battery State of Health estimations ($R^2 = 0.9227$). The full-stack platform bridges automotive economics with battery electrochemistry to provide consumer and enterprise transparency.

### 6.3 Future Scope
1. Direct CAN-bus OBD-II hardware telemetry streaming.
2. Computer vision-based exterior body damage scoring.
3. Multi-regional international currency and right-hand/left-hand drive catalog expansion.
4. Second-life stationary energy storage algorithmic matchmaking for retired EV battery packs.

---

## UNITED NATIONS SUSTAINABLE DEVELOPMENT GOALS (SDGs)
- **SDG 7 (Affordable and Clean Energy):** Enables second-life stationary battery energy storage systems (BESS) reuse by categorizing retired EV packs.
- **SDG 9 (Industry, Innovation, and Infrastructure):** Provides transparent digital infrastructure for pre-owned automotive markets.
- **SDG 11 (Sustainable Cities and Communities):** Accelerates electric vehicle adoption in urban centers by removing secondary market uncertainty.
- **SDG 12 (Responsible Consumption and Production):** Prevents premature battery pack disposal by identifying repairable module-level faults.
- **SDG 13 (Climate Action):** Directly promotes e-mobility adoption, driving long-term reductions in transportation greenhouse gas emissions.

---

## REFERENCES (Alphabetical Order, Anna University Format)

1. Al-Gabal, M, Chen, L & Zhang, Y 2024, ‘Ensemble learning and gradient boosting frameworks for automotive secondary market valuation’, *IEEE Transactions on Intelligent Transportation Systems*, vol. 25, no. 4, pp. 4120–4133.
2. Bergmann, F & Feuerriegel, S 2025, ‘Machine learning for predicting used car resale prices using granular vehicle equipment information’, *Expert Systems with Applications*, vol. 238, no. 1, pp. 122110–122124.
3. Chen, X, Shen, W, Vo, TTT, Cao, Z & Kapoor, A 2024, ‘An equivalent circuit model and deep neural network hybrid approach for state-of-health estimation of lithium-ion batteries’, *Journal of Energy Storage*, vol. 80, pp. 110289–110304.
4. Falalu, MA, Abdullahi, M & Usman, A 2023, ‘A Smart Predictive Framework for Vehicular Telemetry and Pricing Models’, *Journal of Mathematical Techniques in Computational Mathematics*, vol. 9, no. 2, pp. 33–41.
5. Goodfellow, I, Bengio, Y & Courville, A 2016, *Deep Learning*, MIT Press, Cambridge.
6. Hastie, T, Tibshirani, R & Friedman, J 2009, *The Elements of Statistical Learning: Data Mining, Inference, and Prediction*, Springer, New York.
7. Huang, Z, Yang, F, Tsui, KL & Lee, J 2024, ‘Lithium-ion battery state of health estimation based on discharge voltage profile transformation and Gaussian process regression’, *Applied Energy*, vol. 355, pp. 122295–122310.
8. Khotimah, K, Prasetyo, E & Nugroho, A 2025, ‘Forecasting Used Car Prices Using Machine Learning and Deep Multi-Layer Perceptrons’, *International Journal of Informatics and Computer Science*, vol. 12, no. 1, pp. 45–54.
9. Kumar, V, Patel, R & Sharma, M 2024, ‘Vehicle Residual Value Modeling in Developing Automotive Markets: A Comparative Study of Tree-Based Regressors’, *International Journal of Automotive Technology and Management*, vol. 24, no. 2, pp. 178–195.
10. Li, W, Sengupta, N, Dechent, P, Howey, D, Annaswamy, A & Sauer, DU 2024, ‘Online capacity estimation of lithium-ion cells through electrochemical impedance spectroscopy and transfer learning’, *Nature Energy*, vol. 9, no. 3, pp. 280–292.
11. Lin, C, Tang, A & Wang, W 2025, ‘Machine Learning Techniques for Battery State of Health Prediction: A Comparative Review on Cross-Cell Generalization’, *World Electric Vehicle Journal*, vol. 16, no. 2, pp. 112–129.
12. Liu, K, Peng, Q, Che, Y, Zheng, Y & Pecht, MG 2025, ‘Cycle based state of health estimation of lithium ion cells using deep learning architectures and spatio-temporal convolutions’, *Journal of Power Sources*, vol. 592, pp. 233910–233925.
13. NASA Prognostics Center of Excellence 2024, *Li-ion Battery Aging Dataset*, Ames Research Center, Available from: <https://www.nasa.gov/intelligent-systems-division/discovery-and-systems-health/pcoe/pcoe-data-set-repository/> [Accessed 12 Jan 2026].
14. Patel, S, Verma, A & Joshi, D 2024, ‘Economic Depreciation Trajectories of Electric Vehicles versus Internal Combustion Engine Fleets’, *Transportation Research Part D: Transport and Environment*, vol. 128, pp. 104112–104128.
15. Saha, B & Goebel, K 2007, ‘Battery Data Set’, *NASA Ames Prognostics Data Repository*, NASA Ames Research Center, Moffett Field, CA.
16. Saini, R, Mukherjee, S & Rao, KS 2025, ‘End-of-Life Diagnostic Protocols and Second-Life Viability of Retired EV Traction Batteries’, *IEEE Transactions on Transportation Electrification*, vol. 11, no. 1, pp. 410–424.
17. Soundarya, S, Priya, R & Karthik, M 2025, ‘Predictive Resale Analytics for Commercial and Passenger Fleets Using Gradient Boosted Decision Trees’, *International Journal of Creative Research Thoughts*, vol. 13, no. 2, pp. 201–212.
18. Thakur, B & Chakre, R 2025, ‘Systematic Review on Residual Value Forecasting and State of Health Prognosis in E-Mobility Platforms’, *International Journal of Computer Engineering and Automotive Applications*, vol. 28, no. 1, pp. 55–69.
19. United Nations 2015, *Transforming our World: The 2030 Agenda for Sustainable Development*, UN Publishing, New York.
20. Wang, Y, Ni, J & Lu, C 2025, ‘Machine Learning-Based Lithium Battery State of Health Prediction Research with Swarm Intelligence Optimization’, *MDPI Batteries*, vol. 11, no. 3, pp. 98–115.
21. Zhang, Y, Xiong, R, He, H & Pecht, MG 2024, ‘Long short-term memory recurrent neural network for remaining useful life prediction of lithium-ion batteries’, *IEEE Transactions on Vehicular Technology*, vol. 73, no. 6, pp. 7890–7903.
22. Zheng, H 2025, ‘Machine Learning Optimization and Challenges in Used Car Price Prediction Across Segment Hierarchies’, *ITM Web of Conferences*, vol. 68, pp. 01015–01024.

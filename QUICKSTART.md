# AutoCX — Quickstart Guide for GitHub Users

> **"AutoCX — Every Mile Has a Meaning."**  
> Complete setup guide to clone, run, and explore the AutoCX automotive intelligence platform, machine learning pipelines, and datasets from GitHub.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:
* **Git**: [git-scm.com](https://git-scm.com/)
* **Python 3.11+**: [python.org](https://www.python.org/)
* **Node.js 18+ & npm**: [nodejs.org](https://nodejs.org/)

---

## 1. Clone the Repository

Open your terminal (PowerShell, Command Prompt, or Bash) and clone the repository:

```bash
git clone https://github.com/kumaraguruv05/AutoCX.git
cd AutoCX
```

---

## 2. Backend Setup (FastAPI & Machine Learning)

The backend provides the REST API, pre-trained ML models, and dataset preprocessing pipelines.

### On Windows (PowerShell):
```powershell
# Navigate into the backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv .venv
.\.venv\Scripts\activate

# Upgrade pip and install all required dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run the automated test suite (25 test cases)
python -m pytest

# Launch the FastAPI backend server
uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```

### On Linux / macOS (Bash):
```bash
# Navigate into the backend directory
cd backend

# Create and activate a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Upgrade pip and install all required dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run the automated test suite (25 test cases)
python -m pytest

# Launch the FastAPI backend server
uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```

Once running:
* **API Root Health Check:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
* **Interactive Swagger Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc Documentation:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 3. Frontend Setup (Interactive Cockpit UI)

Open a **new terminal window or tab** in the project root:

```bash
# Navigate into the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

Once started, open your browser:
* **AutoCX Cockpit Interface:** [http://localhost:5173/](http://localhost:5173/)

---

## 4. Working with the Datasets

All raw and processed datasets are included directly in the repository under `backend/data/`:

### Raw Datasets:
* **Used Car Market Data:** `backend/data/raw/car_data/`
  * `Car details v3.csv` (8,128 records)
  * `car details v4.csv` (2,059 records including EV and Hybrid specifications)
  * `CAR DETAILS FROM CAR DEKHO.csv` (4,340 records)
  * `car data.csv` (301 records)
* **NASA Li-ion Battery Aging Data:** `backend/data/raw/battery_data/`
  * 48 experimental MATLAB `.mat` files across 6 aging batches (`B0005` through `B0056`) from the NASA Ames Prognostics Center of Excellence (PCoE).

### Processed Datasets:
* **Car Resale Processed:** `backend/data/processed/car_resale_processed.csv` (8,900 vehicle records)
* **Battery SOH Processed:** `backend/data/processed/battery_soh_processed.csv` (2,542 discharge cycles across 34 physical cells)

### (Optional) Rebuilding Datasets & Retraining Models:
If you modify preprocessing rules or wish to retrain the ML models from scratch:

```bash
# Make sure your backend virtual environment is active
cd backend

# Re-run data cleaning and feature engineering
python src/ml/preprocessing/preprocess_car_data.py
python src/ml/preprocessing/preprocess_battery_data.py

# Re-train models and update serialization artifacts
python src/ml/training/train_car_model.py
python src/ml/training/train_battery_model.py
```

---

## 5. Jupyter Analysis Notebooks

To explore the benchmark comparisons, parity charts, and degradation curves:

```bash
# In the backend environment
pip install jupyter
jupyter notebook notebooks/AutoCX_Report_Graphs.ipynb
```

---

## 6. Troubleshooting

* **Port 8000 Already in Use:**  
  Run uvicorn on another port:
  ```bash
  uvicorn src.main:app --host 127.0.0.1 --port 8080 --reload
  ```
  Then update `VITE_API_URL` or frontend proxy accordingly.

* **Missing Module 'src' when running pytest:**  
  Ensure you run pytest from inside the `backend` folder:
  ```bash
  cd backend
  python -m pytest
  ```

* **Node.js Version Warning:**  
  AutoCX requires Node.js 18 or newer. Check your version with:
  ```bash
  node -v
  ```

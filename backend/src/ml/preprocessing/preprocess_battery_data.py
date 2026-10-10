"""
Preprocess NASA Ames Li-ion Battery Aging Datasets.
Extracts cycle-level operational measurements and ground-truth capacity/SOH
from MATLAB .mat files across all extracted battery cells.
"""

import os
import glob
import numpy as np
import pandas as pd
import scipy.io as sio

RAW_BATTERY_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "raw", "battery_data")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "processed")

def extract_battery_cycles() -> pd.DataFrame:
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    mat_files = glob.glob(os.path.join(RAW_BATTERY_DIR, "**", "*.mat"), recursive=True)
    print(f"Discovered {len(mat_files)} MATLAB .mat files in {RAW_BATTERY_DIR}")
    
    records = []
    processed_cells = set()
    
    for f in sorted(mat_files):
        cell_id = os.path.splitext(os.path.basename(f))[0]
        if cell_id in processed_cells:
            continue
        processed_cells.add(cell_id)
        
        try:
            mat = sio.loadmat(f)
            keys = [k for k in mat.keys() if not k.startswith("__")]
            if not keys:
                print(f"Skipping {cell_id}: No valid struct key found")
                continue
            key = keys[0]
            struct = mat[key]
            
            if "cycle" not in struct.dtype.names:
                print(f"Skipping {cell_id}: 'cycle' field not found")
                continue
                
            cycles = struct["cycle"][0, 0]
            num_cycles = cycles.shape[1]
            discharge_idx = 0
            
            for i in range(num_cycles):
                ctype = str(cycles["type"][0, i][0])
                if ctype != "discharge":
                    continue
                
                discharge_idx += 1
                
                # Ambient temperature (°C)
                amb_temp = 24.0
                if "ambient_temperature" in cycles.dtype.names:
                    temp_val = cycles["ambient_temperature"][0, i]
                    if temp_val.size > 0:
                        amb_temp = float(temp_val[0, 0])
                
                data = cycles["data"][0, i]
                
                # Ground truth capacity (Ahr)
                if "Capacity" not in data.dtype.names or data["Capacity"][0, 0].size == 0:
                    continue
                cap = float(data["Capacity"][0, 0][0, 0])
                if cap <= 0:
                    continue
                    
                # Time-series vectors
                V = data["Voltage_measured"][0, 0].flatten() if "Voltage_measured" in data.dtype.names and data["Voltage_measured"][0, 0].size > 0 else np.array([])
                I = data["Current_measured"][0, 0].flatten() if "Current_measured" in data.dtype.names and data["Current_measured"][0, 0].size > 0 else np.array([])
                T = data["Temperature_measured"][0, 0].flatten() if "Temperature_measured" in data.dtype.names and data["Temperature_measured"][0, 0].size > 0 else np.array([])
                t = data["Time"][0, 0].flatten() if "Time" in data.dtype.names and data["Time"][0, 0].size > 0 else np.array([])
                
                if len(V) < 10 or len(t) < 10:
                    continue
                
                v_max = float(np.max(V))
                v_min = float(np.min(V))
                v_mean = float(np.mean(V))
                v_std = float(np.std(V))
                
                i_mean = float(np.abs(np.mean(I))) if len(I) > 0 else 2.0
                i_max = float(np.abs(np.max(np.abs(I)))) if len(I) > 0 else 2.0
                
                t_max = float(np.max(T)) if len(T) > 0 else amb_temp
                t_mean = float(np.mean(T)) if len(T) > 0 else amb_temp
                t_min = float(np.min(T)) if len(T) > 0 else amb_temp
                
                discharge_duration = float(t[-1] - t[0]) if len(t) > 1 else 0.0
                
                # Rated nominal capacity for NASA 18650 Li-ion cells is 2.0 Ahr
                rated_capacity_ah = 2.0
                soh_percent = (cap / rated_capacity_ah) * 100.0
                
                # Estimated internal resistance at discharge step (Delta V / Delta I)
                # Using initial voltage drop during first seconds
                internal_resistance_ohm = np.nan
                if len(V) >= 5 and len(I) >= 5:
                    delta_v = abs(V[0] - V[min(4, len(V)-1)])
                    delta_i = abs(I[min(4, len(I)-1)])
                    if delta_i > 0.1:
                        internal_resistance_ohm = float(delta_v / delta_i)
                
                records.append({
                    "cell_id": cell_id,
                    "cycle": discharge_idx,
                    "ambient_temperature_c": amb_temp,
                    "voltage_max_v": v_max,
                    "voltage_min_v": v_min,
                    "voltage_mean_v": v_mean,
                    "voltage_std_v": v_std,
                    "current_mean_a": i_mean,
                    "current_max_a": i_max,
                    "temp_max_c": t_max,
                    "temp_mean_c": t_mean,
                    "temp_min_c": t_min,
                    "discharge_duration_sec": discharge_duration,
                    "internal_resistance_ohm": internal_resistance_ohm,
                    "rated_capacity_ah": rated_capacity_ah,
                    "measured_capacity_ah": cap,
                    "soh_percent": soh_percent
                })
        except Exception as e:
            print(f"Error extracting {cell_id}: {e}")
            
    df = pd.DataFrame(records)
    print(f"Raw extracted records: {len(df)} across {df['cell_id'].nunique()} cells")
    
    # Impute internal resistance with group median if missing
    overall_ir_median = df["internal_resistance_ohm"].median()
    df["internal_resistance_ohm"] = df["internal_resistance_ohm"].fillna(overall_ir_median)
    
    # Filter valid SOH range (NASA cells degrade from ~100% down to ~50% at EOL)
    df_clean = df[(df["soh_percent"] >= 40.0) & (df["soh_percent"] <= 110.0)].copy()
    
    # Sort by cell and cycle order
    df_clean = df_clean.sort_values(by=["cell_id", "cycle"]).reset_index(drop=True)
    
    out_file = os.path.join(PROCESSED_DIR, "battery_soh_processed.csv")
    df_clean.to_csv(out_file, index=False)
    print(f"Saved processed battery SOH dataset to: {out_file}")
    print(f"Clean records: {len(df_clean)}, Cells: {df_clean['cell_id'].nunique()}")
    print(f"SOH summary:\n{df_clean['soh_percent'].describe()}")
    print(f"Cells included:\n{df_clean['cell_id'].value_counts()}")
    return df_clean

if __name__ == "__main__":
    extract_battery_cycles()

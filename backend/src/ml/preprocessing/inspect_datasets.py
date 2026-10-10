import os
import glob
import pandas as pd
import scipy.io as sio
import numpy as np

CAR_DIR = r"D:\Projects\AutoCX\backend\data\raw\car_data"
BATTERY_DIR = r"D:\Projects\AutoCX\backend\data\raw\battery_data"

def inspect_car_data():
    print("=" * 60)
    print("INSPECTING CAR DATASETS")
    print("=" * 60)
    csv_files = glob.glob(os.path.join(CAR_DIR, "*.csv"))
    for f in csv_files:
        name = os.path.basename(f)
        try:
            df = pd.read_csv(f)
            print(f"\n--- File: {name} ---")
            print(f"Shape: {df.shape}")
            print(f"Columns: {list(df.columns)}")
            print(f"Missing values:\n{df.isnull().sum()[df.isnull().sum() > 0]}")
            if 'fuel' in df.columns:
                print(f"Fuel unique values: {df['fuel'].value_counts().to_dict()}")
            elif 'Fuel_Type' in df.columns:
                print(f"Fuel_Type unique values: {df['Fuel_Type'].value_counts().to_dict()}")
            elif 'Fuel Type' in df.columns:
                print(f"Fuel Type unique values: {df['Fuel Type'].value_counts().to_dict()}")
            print(f"Sample row:\n{df.head(1).to_dict(orient='records')}")
        except Exception as e:
            print(f"Error reading {name}: {e}")

def inspect_battery_data():
    print("\n" + "=" * 60)
    print("INSPECTING BATTERY DATASETS")
    print("=" * 60)
    mat_files = glob.glob(os.path.join(BATTERY_DIR, "**", "*.mat"), recursive=True)
    print(f"Found {len(mat_files)} .mat files")
    for f in sorted(mat_files)[:4]:
        name = os.path.basename(f)
        print(f"\n--- File: {name} ({os.path.getsize(f)} bytes) ---")
        try:
            mat = sio.loadmat(f)
            print(f"Top-level keys: {[k for k in mat.keys() if not k.startswith('__')]}")
            cell_key = [k for k in mat.keys() if not k.startswith('__')][0]
            struct = mat[cell_key]
            print(f"Struct shape: {struct.shape}, dtype: {struct.dtype}")
            cycle_data = struct['cycle'][0, 0]
            print(f"Cycle shape: {cycle_data.shape}, dtype names: {cycle_data.dtype.names}")
            
            # Inspect first few cycles
            num_cycles = cycle_data.shape[1]
            print(f"Total cycles in {cell_key}: {num_cycles}")
            types = set()
            discharge_count = 0
            capacities = []
            for i in range(num_cycles):
                c_type = cycle_data['type'][0, i][0]
                types.add(c_type)
                if c_type == 'discharge':
                    discharge_count += 1
                    data_obj = cycle_data['data'][0, i]
                    if 'Capacity' in data_obj.dtype.names:
                        cap = data_obj['Capacity'][0, 0]
                        if cap.size > 0:
                            capacities.append(float(cap[0, 0]))
            print(f"Cycle types present: {types}")
            print(f"Discharge cycles: {discharge_count}")
            if capacities:
                print(f"Capacity records: {len(capacities)}, min: {min(capacities):.4f}, max: {max(capacities):.4f}, first: {capacities[0]:.4f}, last: {capacities[-1]:.4f}")
            
            # Inspect fields inside a discharge cycle data object
            for i in range(num_cycles):
                if cycle_data['type'][0, i][0] == 'discharge':
                    d_fields = cycle_data['data'][0, i].dtype.names
                    print(f"Discharge data fields: {d_fields}")
                    break
        except Exception as e:
            print(f"Error inspecting {name}: {e}")

if __name__ == '__main__':
    inspect_car_data()
    inspect_battery_data()

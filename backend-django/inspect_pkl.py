import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

for region in ['Gujarat', 'Maharashtra', 'UttarPradesh']:
    csv_path = os.path.join(BASE_DIR, 'energy_sentinel', f'{region}_PowerGrid_Neurocity.csv')
    try:
        df = pd.read_csv(csv_path)
        print(f"\n--- Region: {region} ---")
        print(df['Usage'].describe())
    except Exception as e:
        print(f"Error loading {region}:", e)

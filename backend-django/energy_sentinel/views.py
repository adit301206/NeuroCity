import os
import joblib
import pandas as pd
import numpy as np
import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Grid threshold configurations based on regional statistics
REGIONS = {
    'gujarat': {
        'pkl': os.path.join(BASE_DIR, 'gujarat_energy_sentinel.pkl'),
        'csv': os.path.join(BASE_DIR, 'Gujarat_PowerGrid_Neurocity.csv'),
        'threshold': 330.8
    },
    'maharashtra': {
        'pkl': os.path.join(BASE_DIR, 'maharashtra_energy_sentinel.pkl'),
        'csv': os.path.join(BASE_DIR, 'Maharashtra_PowerGrid_Neurocity.csv'),
        'threshold': 441.9
    },
    'uttarpradesh': {
        'pkl': os.path.join(BASE_DIR, 'uttarpradesh_energy_sentinel.pkl'),
        'csv': os.path.join(BASE_DIR, 'UttarPradesh_PowerGrid_Neurocity.csv'),
        'threshold': 367.1
    }
}

# Pre-load ML models and CSV datasets to avoid slow I/O bottlenecks during live predictions
models = {}
datasets = {}

for r_name, config in REGIONS.items():
    # Load scikit-learn random forest models
    try:
        if os.path.exists(config['pkl']):
            models[r_name] = joblib.load(config['pkl'])
            print(f"[Django Energy Sentinel] Model loaded successfully for: {r_name}")
        else:
            print(f"[Django Energy Sentinel Warning] Model weights missing: {config['pkl']}")
            models[r_name] = None
    except Exception as e:
        print(f"[Django Energy Sentinel Error] Failed to load model weights for {r_name}: {e}")
        models[r_name] = None

    # Load corresponding CSV datasets
    try:
        if os.path.exists(config['csv']):
            datasets[r_name] = pd.read_csv(config['csv'])
            print(f"[Django Energy Sentinel] Dataset loaded successfully for: {r_name}")
        else:
            print(f"[Django Energy Sentinel Warning] CSV dataset missing: {config['csv']}")
            datasets[r_name] = None
    except Exception as e:
        print(f"[Django Energy Sentinel Error] Failed to load CSV for {r_name}: {e}")
        datasets[r_name] = None

@api_view(['POST'])
def predict_energy(request):
    """
    Predict electricity usage in MW and evaluate grid status: NORMAL, STRESSED, or CRITICAL.
    Expected JSON payload: { "regionZone": "Gujarat", "temperature": 32.5, "humidity": 65.0 }
    """
    try:
        data = request.data
        region_zone_raw = data.get('region_zone') or data.get('regionZone', '')
        temperature_raw = data.get('temp') if data.get('temp') is not None else data.get('temperature')
        humidity_raw = data.get('humid') if data.get('humid') is not None else data.get('humidity')

        # Request parameters validation
        if not region_zone_raw or temperature_raw is None or humidity_raw is None:
            return Response({
                "status": "error",
                "message": "Missing required parameters (regionZone, temperature, humidity)."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Normalize region zone format
        region_zone = region_zone_raw.lower().strip().replace(' ', '').replace('_', '')
        if region_zone not in REGIONS:
            return Response({
                "status": "error",
                "message": f"Unknown regionZone '{region_zone_raw}'. Valid zones: Gujarat, Maharashtra, UttarPradesh."
            }, status=status.HTTP_400_BAD_REQUEST)

        model_payload = models[region_zone]
        df = datasets[region_zone]

        if not model_payload or df is None:
            return Response({
                "status": "error",
                "message": f"ML model weights or dataset for region '{region_zone_raw}' are not initialized on server."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        model = model_payload['model']
        features = model_payload['features']

        # Parse numeric weather parameters
        try:
            temperature = float(temperature_raw)
            humidity = float(humidity_raw)
        except ValueError:
            return Response({
                "status": "error",
                "message": "Temperature and humidity values must be numeric."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Perform nearest-neighbor lookup via Euclidean distance on (Avg_Temp_C, Avg_Humidity_Percent)
        # to approximate MAX, MIN, AW, RF, and Usage_Lag_1Day features from historical regional records.
        distances = (df['Avg_Temp_C'] - temperature)**2 + (df['Avg_Humidity_Percent'] - humidity)**2
        closest_idx = distances.idxmin()
        closest_row = df.loc[closest_idx]

        max_temp = closest_row['MAX']
        min_temp = closest_row['MIN']
        aw = closest_row['AW']
        rf = closest_row['RF']
        usage_lag_1day = closest_row['Usage_Lag_1Day']

        # Construct current datetime features
        now = datetime.datetime.now()
        month = now.month
        day_of_week = now.weekday()

        month_sin = np.sin(2 * np.pi * month / 12.0)
        month_cos = np.cos(2 * np.pi * month / 12.0)
        day_sin = np.sin(2 * np.pi * day_of_week / 7.0)
        day_cos = np.cos(2 * np.pi * day_of_week / 7.0)

        # Assemble features into pandas DataFrame matching the pickled RF columns structure
        input_data = pd.DataFrame([{
            'Avg_Temp_C': temperature,
            'Avg_Humidity_Percent': humidity,
            'MAX': max_temp,
            'MIN': min_temp,
            'AW': aw,
            'RF': rf,
            'Usage_Lag_1Day': usage_lag_1day,
            'Month': month,
            'DayOfWeek': day_of_week,
            'month_sin': month_sin,
            'month_cos': month_cos,
            'day_sin': day_sin,
            'day_cos': day_cos
        }], columns=features)

        # Run Random Forest inference
        predicted_usage = float(model.predict(input_data)[0])

        # Evaluate the status of grid stress
        threshold_stressed = REGIONS[region_zone]['threshold']
        threshold_critical = threshold_stressed * 1.1  # 10% above standard stress threshold is Critical

        if predicted_usage > threshold_critical:
            grid_status = 'CRITICAL'
        elif predicted_usage > threshold_stressed:
            grid_status = 'STRESSED'
        else:
            grid_status = 'NORMAL'

        return Response({
            "status": "success",
            "regionZone": region_zone_raw,
            "predicted_usage": round(predicted_usage, 2),
            "grid_status": grid_status,
            "closest_reference_date": str(closest_row.get('DATE', 'Unknown'))
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            "status": "error",
            "message": f"Energy Sentinel prediction breakdown: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

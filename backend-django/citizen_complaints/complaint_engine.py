# complaints_engine.py
import os
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VECTORIZER_PATH = os.path.join(BASE_DIR, 'tfidf_vectorizer.pkl')
MODEL_PATH = os.path.join(BASE_DIR, 'triage_rf_model.pkl')

# Dict keys match the exact strings in your CSV file
BASE_SEVERITY_MAP = {
    "water_sanitation": 4.5,
    "road_repair": 2.5,
    "public_safety": 4.0,
    "waste_management": 2.0,
    "traffic_encroachment": 2.0,
    "electrical_hazard": 5.0,
    "power_outage": 3.0,
    "air_pollution_violation": 3.0,
    "water_logging": 4.5,
    "stray_animal_hazard": 2.0,
    "structural_damage_risk": 4.5
}

EMERGENCY_KEYWORDS = ["hospital", "accident", "school", "blocked", "flooded", "spark", "bleeding", "children", "crashing", "collapsed", "ambulance"]

def run_live_triage(raw_complaint_text, is_near_critical_node=False):
    if not os.path.exists(VECTORIZER_PATH) or not os.path.exists(MODEL_PATH):
        return "Unclassified", 3.0

    vectorizer = joblib.load(VECTORIZER_PATH)
    classifier = joblib.load(MODEL_PATH)

    # Calculate model predictions
    transformed_input = vectorizer.transform([raw_complaint_text])
    predicted_category = classifier.predict(transformed_input)[0]

    # Normalize prediction to match severity lookup dictionary cleanly
    lookup_key = str(predicted_category).strip()
    
    # Try finding exact or lowercase variants
    base_score = BASE_SEVERITY_MAP.get(lookup_key, BASE_SEVERITY_MAP.get(lookup_key.lower(), 2.5))
    
    # Keywords scan
    text_processed = raw_complaint_text.lower()
    matched_flags = sum(1 for keyword in EMERGENCY_KEYWORDS if keyword in text_processed)
    keyword_bonus = min(matched_flags * 1.5, 3.5)

    # Proximity scan
    spatial_bonus = 2.0 if is_near_critical_node else 0.0

    final_priority_score = min(base_score + keyword_bonus + spatial_bonus, 10.0)

    return predicted_category, round(final_priority_score, 2)
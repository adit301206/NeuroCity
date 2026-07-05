# triage_engine.py
import os
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VECTORIZER_PATH = os.path.join(BASE_DIR, 'tfidf_vectorizer.pkl')
MODEL_PATH = os.path.join(BASE_DIR, 'triage_rf_model.pkl')

# Static baseline severity maps matched to your 11 custom categories
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

# Critical local landmark and structural trigger words
EMERGENCY_KEYWORDS = ["hospital", "accident", "school", "blocked", "flooded", "spark", "bleeding", "children", "crashing", "collapsed"]

def run_live_triage(raw_complaint_text, is_near_critical_node=False):
    """
    Data Fusion Engine: Integrates NLP textual parsing vectors 
    with spatial node metrics to output a calculated composite priority standing.
    """
    if not os.path.exists(VECTORIZER_PATH) or not os.path.exists(MODEL_PATH):
        return "Unclassified", 3.0

    # 1. Load active serialized memory pipes
    vectorizer = joblib.load(VECTORIZER_PATH)
    classifier = joblib.load(MODEL_PATH)

    # 2. Extract Category Prediction via TF-IDF matrix paths
    transformed_input = vectorizer.transform([raw_complaint_text])
    predicted_category = classifier.predict(transformed_input)[0]

    # 3. Apply Multi-Factor Priority Core Equations
    # Factor A: Extract static operational weight
    base_score = BASE_SEVERITY_MAP.get(predicted_category, 2.5)
    
    # Factor B: Run NLP String Keyword Modifier Loops
    text_processed = raw_complaint_text.lower()
    matched_flags = sum(1 for keyword in EMERGENCY_KEYWORDS if keyword in text_processed)
    keyword_bonus = min(matched_flags * 1.5, 3.5) # Dynamic modifier bump capped at 3.5 points max

    # Factor C: Apply Spatial Network Proximity Weight (Shared from your NetworkX GIS mapping system)
    spatial_bonus = 2.0 if is_near_critical_node else 0.0

    # Calculate final scaled metric parameter bounds (Capped at absolute ceiling of 10.0)
    final_priority_score = min(base_score + keyword_bonus + spatial_bonus, 10.0)

    return predicted_category, round(final_priority_score, 2)
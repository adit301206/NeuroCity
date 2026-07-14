# test_brain.py
from complaint_engine import run_live_triage

def execute_indian_localized_test_suite():
    test_matrix = [
        {
            "id": "IND-CASE-1 (Hinglish Mixing)",
            "text": "Mera area me road ka condition is very kharab. Huge potholes are there outside colony wall.",
            "expected": "Road_Repair", "spatial": False
        },
        {
            "id": "IND-CASE-2 (Landmark Bound Overlap)",
            "text": "Massive garbage dump and bad smell coming near the school gate, kids are falling sick. Corporator not listening.",
            "expected": "Waste_Management", "spatial": True
        },
        {
            "id": "IND-CASE-3 (Stray Animal Issue)",
            "text": "Gali dogs are biting small children near the market square. Stray dog pack menace is too high, ladies are scared to walk.",
            "expected": "Stray_Animal_Hazard", "spatial": False
        },
        {
            "id": "IND-CASE-4 (Grid Short-Circuit Phrasing)",
            "text": "Sidewalk open transformer me kal se sparking ho raha hai, open wire lines are touching trees. Very dangerous scene.",
            "expected": "Electrical_Hazard", "spatial": True
        },
        {
            "id": "IND-CASE-5 (Monsoon Waterlogging Syntax)",
            "text": "Rain water has flooded our whole lane. Deep waterlogging under underpass, cars are completely jammed.",
            "expected": "Water_Logging", "spatial": False
        },
        {
            "id": "IND-CASE-6 (Indian English Request Style)",
            "text": "All streetlights are completely dead from last one week near sector metro pillar 45. Area is very dark and unsafe. Please do the needful urgently.",
            "expected": "Public_Safety", "spatial": False
        },
        {
            "id": "IND-CASE-7 (Contaminated Pipeline Phrasing)",
            "text": "Drinking water is coming dirty and smelling like drainage since morning. Tap water supply completely useless.",
            "expected": "Water_Sanitation", "spatial": False
        }
    ]

    total_cases = len(test_matrix)
    correct_predictions = 0

    print("🛰️ NeuroCity AI Engine: Indian Phrasing & Context Evaluation Dashboard\n" + "="*85)
    print(f"{'ID':<15} | {'Expected Tag':<22} | {'AI Predicted Label':<22} | {'Status'}")
    print("-"*85)

    for case in test_matrix:
        ai_cat, priority_score = run_live_triage(case["text"], is_near_critical_node=case["spatial"])
        
        # Strip string bounds to handle case matching variables
        is_correct = (ai_cat.lower().strip() == case["expected"].lower().strip())
        status_label = "✅ PASS" if is_correct else "❌ FAIL"
        
        if is_correct:
            correct_predictions += 1

        print(f"{case['id']:<15} | {case['expected']:<22} | {ai_cat:<22} | {status_label} (Score: {priority_score}/10)")

    accuracy = (correct_predictions / total_cases) * 100
    print("="*85)
    print(f"📊 INDIAN LOCALIZED CORPUS ACCURACY SCORE: {accuracy:.2f}%")
    print("="*85)

if __name__ == "__main__":
    execute_indian_localized_test_suite()
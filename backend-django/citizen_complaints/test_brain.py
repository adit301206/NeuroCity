# test_brain.py
from complaint_engine import run_live_triage

def execute_test_suite():
    test_cases = [
        {
            "id": "CASE 1 (Public Safety)",
            "text": "All streetlights are broken on the sector 4 main avenue. The dark road feels unsafe for walking.",
            "spatial": False
        },
        {
            "id": "CASE 2 (Disaster / Water Logging)",
            "text": "Monsoon rains have caused extreme flooding and water logging under the railway bridge, trapping cars.",
            "spatial": False
        },
        {
            "id": "CASE 3 (Electrical Hazard - High Urgency Near Critical Node)",
            "text": "There is a sparking transformer leaking oil right next to the school boundary gate. Danger of electrocution.",
            "spatial": True  # Simulating proximity to a school node
        },
        {
            "id": "CASE 4 (Waste Management - Low Urgency)",
            "text": "Garbage piles are rotting behind the sector market complex. The municipal dump truck hasn't visited in days.",
            "spatial": False
        },
        {
            "id": "CASE 5 (Traffic / Encroachment)",
            "text": "Commercial trucks are parking illegally inside our narrow residential lane, completely blocking emergency vehicle turning circles.",
            "spatial": True  # Simulating intersection node constraint
        }
    ]

    print("🛰️ NeuroCity AI Triage Engine Stress-Testing Sequence Active\n" + "="*70)
    
    for case in test_cases:
        category, score = run_live_triage(case["text"], is_near_critical_node=case["spatial"])
        print(f"📌 ID:      {case['id']}")
        print(f"📝 Text:    \"{case['text']}\"")
        print(f"🗺️ Spatial: Near Critical Node = {case['spatial']}")
        print(f"🏷️ AI Category: {category}")
        print(f"🚨 Priority Score: {score}/10")
        print("-"*70)

if __name__ == "__main__":
    execute_test_suite()
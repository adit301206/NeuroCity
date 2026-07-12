# test_brain.py
from complaint_engine import run_live_triage

def execute_comprehensive_evaluation():
    test_matrix = [
        # --- Water_Sanitation ---
        {
            "text": "Drinking water supply is muddy and smells like rust in sector 2 blocks.",
            "expected": "Water_Sanitation", "spatial": False
        },
        {
            "text": "The main sewer line has ruptured under linking road causing dirty drainage water backup.",
            "expected": "Water_Sanitation", "spatial": False
        },
        {
            "text": "Extremely low water pressure in our residential colony tap pipelines.",
            "expected": "Water_Sanitation", "spatial": False
        },

        # --- Road_Repair ---
        {
            "text": "Deep potholes on the flyover curve are forcing cars to swerve dangerously.",
            "expected": "Road_Repair", "spatial": False
        },
        {
            "text": "The asphalt on the avenue has completely cracked and deteriorated after monsoons.",
            "expected": "Road_Repair", "spatial": False
        },
        {
            "text": "An uneven speed breaker without any reflective paint markers is causing bike accidents.",
            "expected": "Road_Repair", "spatial": True
        },

        # --- Public_Safety ---
        {
            "text": "Stray dog packs are roaming near the children park gate, acting highly aggressive.",
            "expected": "Public_Safety", "spatial": False
        },
        {
            "text": "Vandals have smashed the open gym equipment and broken public park benches.",
            "expected": "Public_Safety", "spatial": False
        },
        {
            "text": "A massive old dead tree structure looks unstable and might fall onto pedestrians on the sidewalk.",
            "expected": "Public_Safety", "spatial": True
        },

        # --- Waste_Management ---
        {
            "text": "Garbage piles are decomposing outside the temple complex, scattering plastic everywhere.",
            "expected": "Waste_Management", "spatial": False
        },
        {
            "text": "The neighborhood garbage collection van hasn't arrived for more than 5 days.",
            "expected": "Waste_Management", "spatial": False
        },
        {
            "text": "Commercial market waste and organic garbage are being dumped illegally in the public park corner.",
            "expected": "Waste_Management", "spatial": False
        },

        # --- Traffic_Encroachment ---
        {
            "text": "Illegal parking of massive supply trucks is taking up two full lanes on the narrow avenue.",
            "expected": "Traffic_Encroachment", "spatial": True
        },
        {
            "text": "Local street vendors have encroached upon the pedestrian footpath, forcing citizens to walk on the main road.",
            "expected": "Traffic_Encroachment", "spatial": False
        },
        {
            "text": "The intersection crossroad signal lights are completely broken and flashing dead yellow.",
            "expected": "Traffic_Encroachment", "spatial": True
        },

        # --- Electrical_Hazard ---
        {
            "text": "High voltage overhead power cables are dangling low, touching wet tree branches.",
            "expected": "Electrical_Hazard", "spatial": True
        },
        {
            "text": "There are dangerous electric sparks shooting out from an open feeder box pillar on the sidewalk.",
            "expected": "Electrical_Hazard", "spatial": True
        },

        # --- Power_Outage ---
        {
            "text": "Complete power blackout across sector 5 phase 2 residential blocks since 4 hours.",
            "expected": "Power_Outage", "spatial": False
        },
        {
            "text": "The sector substation distribution transformer blew up, leaving the whole lane without electricity grid supply.",
            "expected": "Power_Outage", "spatial": True
        },

        # --- Air_Pollution_Violation ---
        {
            "text": "Nearby factory chimney exhausts are blowing dense, dark chemical smoke directly into our colony air.",
            "expected": "Air_Pollution_Violation", "spatial": False
        },
        {
            "text": "Construction sites near the station are creating heavy dust clouds without using green mesh net covers.",
            "expected": "Air_Pollution_Violation", "spatial": False
        },

        # --- Water_Logging ---
        {
            "text": "Heavy downpour has caused absolute water logging under the highway underpass metro path.",
            "expected": "Water_Logging", "spatial": True
        }
    ]

    total_cases = len(test_matrix)
    correct_predictions = 0

    print(f"🛰️ Running NeuroCity AI Evaluation Suite [{total_cases} Text Cases Loaded]")
    print("=" * 85)
    print(f"{'ID':<4} | {'Expected Category':<25} | {'AI Category':<25} | {'Status':<7} | {'Priority Score'}")
    print("-" * 85)

    for idx, case in enumerate(test_matrix, 1):
        ai_cat, priority_score = run_live_triage(case["text"], is_near_critical_node=case["spatial"])
        
        # Validation evaluation match check
        is_correct = (ai_cat.lower() == case["expected"].lower())
        status_label = "✅ PASS" if is_correct else "❌ FAIL"
        
        if is_correct:
            correct_predictions += 1

        print(f"#{idx:<2} | {case['expected']:<25} | {ai_cat:<25} | {status_label:<7} | {priority_score:>4}/10")

    # Math engine calculation layer
    accuracy_percentage = (correct_predictions / total_cases) * 100

    print("=" * 85)
    print(f"📊 FINAL INFERENCE METRICS:")
    print(f"   - Total Verified Items: {total_cases}")
    print(f"   - Successful Matches:   {correct_predictions}")
    print(f"   - Failed Matches:       {total_cases - correct_predictions}")
    print(f"🔥 TOTAL ECOSYSTEM CLASSIFICATION ACCURACY: {accuracy_percentage:.2f}%")
    print("=" * 85)

if __name__ == "__main__":
    execute_comprehensive_evaluation()
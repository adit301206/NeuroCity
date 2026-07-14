# test_brain1.py
from complaint_engine import run_live_triage

def execute_comprehensive_indian_test_suite():
    test_matrix = [
        # --- Water_Sanitation (4 Cases) ---
        {"id": "IND-01", "expected": "Water_Sanitation", "spatial": False, "text": "Mera colony lane 3 me dirty water supply aa raha hai. It smells like drainage water and yellow color."},
        {"id": "IND-02", "expected": "Water_Sanitation", "spatial": False, "text": "The main sewer pipe has ruptured under the market square, garbage and sewage mixing on road."},
        {"id": "IND-03", "expected": "Water_Sanitation", "spatial": False, "text": "Public tap pipeline leak near the temple corner from last 4 days. So much clean drinking water wasting."},
        {"id": "IND-04", "expected": "Water_Sanitation", "spatial": False, "text": "Low water pressure in municipal pipeline lines, apartments are not getting enough water for daily work."},

        # --- Road_Repair (4 Cases) ---
        {"id": "IND-05", "expected": "Road_Repair", "spatial": False, "text": "Mera house front main road has huge potholes. Active bike accidents are happening at night due to deep cracks."},
        {"id": "IND-06", "expected": "Road_Repair", "spatial": False, "text": "The asphalt layer on the new flyover has completely broken and split open after the heavy monsoon downpour."},
        {"id": "IND-07", "expected": "Road_Repair", "spatial": True, "text": "Uneven speed breaker constructed near the crossroad without any reflective white paint lines or sign board."},
        {"id": "IND-08", "expected": "Road_Repair", "spatial": False, "text": "Road ka condition is extremely poor near the sector market entry, dust and gravel scattered everywhere."},

        # --- Public_Safety (4 Cases) ---
        {"id": "IND-09", "expected": "Public_Safety", "spatial": False, "text": "All streetlights are dead on the main avenue. Complete dark lane feels highly unsafe for walking after 8 PM."},
        {"id": "IND-10", "expected": "Public_Safety", "spatial": True, "text": "A massive old banyan tree branch has cracked and is hanging low over the sidewalk, might fall on school kids."},
        {"id": "IND-11", "expected": "Public_Safety", "spatial": False, "text": "Local anti-social elements have vandalized the open park benches and smashed the lighting lamps inside the garden."},
        {"id": "IND-12", "expected": "Public_Safety", "spatial": False, "text": "Footpath paving blocks are missing, leaving open holes on the walking track, senior citizens are tripping down."},

        # --- Waste_Management (3 Cases) ---
        {"id": "IND-13", "expected": "Waste_Management", "spatial": False, "text": "Neighborhood garbage collection van hasn't visited our residential block from past 6 days. Waste rotting."},
        {"id": "IND-14", "expected": "Waste_Management", "spatial": False, "text": "Commercial market vendors are dumping vegetable rot and plastic waste behind the complex, creating a huge garbage pile."},
        {"id": "IND-15", "expected": "Waste_Management", "spatial": False, "text": "Open dustbins are overflowing on the road, street dogs are scattering the garbage piles everywhere, huge stench."},

        # --- Traffic_Encroachment (3 Cases) ---
        {"id": "IND-16", "expected": "Traffic_Encroachment", "spatial": False, "text": "Local shopkeepers and street vendors have fully encroached the walking space, customers forced to step on main road."},
        {"id": "IND-17", "expected": "Traffic_Encroachment", "spatial": True, "text": "Commercial supply trucks are double parking illegally in our narrow cross lane, completely blocking vehicle movement."},
        {"id": "IND-18", "expected": "Traffic_Encroachment", "spatial": True, "text": "The main square crossroads traffic signal lights are dead and blinking only yellow, causing absolute traffic jam chaos."},

        # --- Electrical_Hazard (3 Cases) ---
        {"id": "IND-19", "expected": "Electrical_Hazard", "spatial": True, "text": "High voltage overhead electric wire is hanging down very low, touching the metal roof of the local shop."},
        {"id": "IND-20", "expected": "Electrical_Hazard", "spatial": True, "text": "Sidewalk open transformer unit is sparking heavily and making loud buzzing sound after the rain shower."},
        {"id": "IND-21", "expected": "Electrical_Hazard", "spatial": True, "text": "The metal door of the roadside electric box pillar is broken wide open, live bare wire lines exposed on walking track."},

        # --- Power_Outage (3 Cases) ---
        {"id": "IND-22", "expected": "Power_Outage", "spatial": False, "text": "Unscheduled power cut and load shedding going on in sector 4 phase 2 block for the last 5 hours."},
        {"id": "IND-23", "expected": "Power_Outage", "spatial": True, "text": "The sub-station distribution grid transformer blew up with a loud bang, leaving our entire street without any power."},
        {"id": "IND-24", "expected": "Power_Outage", "spatial": False, "text": "Frequent voltage fluctuations and random blackout intervals damaging our home electronic appliances."},

        # --- Air_Pollution_Violation (2 Cases) ---
        {"id": "IND-25", "expected": "Air_Pollution_Violation", "spatial": False, "text": "Nearby illegal chemical unit chimney is emitting thick black toxic smoke directly into our residential colony air."},
        {"id": "IND-26", "expected": "Air_Pollution_Violation", "spatial": False, "text": "A construction site near the railway station is creating massive dust clouds without using any green protective sheets."},

        # --- Water_Logging (2 Cases) ---
        {"id": "IND-27", "expected": "Water_Logging", "spatial": True, "text": "Monsoon rains have caused extreme water logging inside the highway underpass. Cars and auto-rickshaws are submerged."},
        {"id": "IND-28", "expected": "Water_Logging", "spatial": False, "text": "The roadside nullah stormwater drain is choked with plastic, leading to absolute road flooding after every brief shower."},

        # --- Stray_Animal_Hazard (3 Cases) ---
        {"id": "IND-29", "expected": "Stray_Animal_Hazard", "spatial": False, "text": "A violent pack of gali dogs is chasing two-wheelers and bitting pedestrians near the sector entrance park gate."},
        {"id": "IND-30", "expected": "Stray_Animal_Hazard", "spatial": False, "text": "Severe monkey menace in our apartment block, they are entering kitchens, tearing window mesh, and biting kids."}
    ]

    total_cases = len(test_matrix)
    passed_cases = 0

    print("🛰️ NeuroCity Core Engine: 30-Case Indian Phrasing Performance Benchmark")
    print("=" * 105)
    print(f"{'ID':<7} | {'Expected Department':<25} | {'AI Predicted Tag':<25} | {'Priority'} | {'Status'}")
    print("-" * 105)

    for case in test_matrix:
        predicted, priority_score = run_live_triage(case["text"], is_near_critical_node=case["spatial"])
        
        # Match evaluations ignoring boundary edge padding spaces
        is_match = (predicted.lower().strip() == case["expected"].lower().strip())
        status_flag = "✅ PASS" if is_match else "❌ FAIL"
        
        if is_match:
            passed_cases += 1
            
        print(f"{case['id']:<7} | {case['expected']:<25} | {predicted:<25} | {priority_score:>4}/10 | {status_flag}")

    final_accuracy = (passed_cases / total_cases) * 100
    print("=" * 105)
    print(f"📊 SYSTEM DATA SCIENCE INFERENCE METRICS:")
    print(f"   - Total Scenarios Checked: {total_cases}")
    print(f"   - Successful Detections:  {passed_cases}")
    print(f"   - Misclassified Records:   {total_cases - passed_cases}")
    print(f"🔥 FINAL MACHINE LEARNING CORE ACCURACY: {final_accuracy:.2f}%")
    print("=" * 105)

if __name__ == "__main__":
    execute_comprehensive_indian_test_suite()
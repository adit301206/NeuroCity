# test_brain.py
from complaint_engine import run_live_triage

# Mock case A: Standard entry
text_1 = "The streetlights are dead near sector 4 entry gate making the area dark."
cat_1, score_1 = run_live_triage(text_1, is_near_critical_node=False)
print(f"Test 1 -> Category: {cat_1} | Priority Score: {score_1}/10")

# Mock case B: Emergency keyword + near a critical facility infrastructure node (Data Fusion check)
text_2 = "Massive water logging and flooding on the road blocking ambulance access outside the city hospital."
cat_2, score_2 = run_live_triage(text_2, is_near_critical_node=True)
print(f"Test 2 -> Category: {cat_2} | Priority Score: {score_2}/10")
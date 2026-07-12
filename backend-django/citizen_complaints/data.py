import pandas as pd
import json
import time
from google import genai 
import os
from dotenv import load_dotenv

# Resolve the path to the .env file in the backend-django root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(BASE_DIR, '.env')
load_dotenv(dotenv_path=dotenv_path)

client = genai.Client(api_key=os.environ.get("GCP_API_KEY"))

categories = [
    "Water_Sanitation", 
    "Road_Repair", 
    "Public_Safety", 
    "Waste_Management", 
    "Traffic_Encroachment", 
    "Electrical_Hazard", 
    "Power_Outage", 
    "Air_Pollution_Violation", 
    "Water_Logging", 
    "Stray_Animal_Hazard", 
    "Structural_Damage_Risk"
]
synthetic_data = []

# Loop to generate variants
for category in categories:
    print(f"Generating data for {category}...")
    
    prompt = f"""
    You are an AI generating data for a Smart City Digital Twin project in India.
    Generate 200 distinct, realistic civic complaints written by local citizens in English regarding the category and try to use different words so that complaints can look more realistic: '{category}'.
    
    Guidelines:
    1. Make some descriptions short and blunt, and others descriptive and detailed.
    2. Use local Indian contexts, phrasing, or landmarks naturally (e.g., 'near metro station', 'outside sector 3 gate', 'monsoon rains', 'waterlogging').
    3. Return the output STRICTLY as a valid JSON array of objects with the keys "complaint_text" and "base_severity" (on a scale of 1 to 5).
    """

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config={'response_mime_type': 'application/json'}
    )
    
    # Parse out the JSON from the AI response
    batch = json.loads(response.text)
    for item in batch:
        item["category"] = category
        synthetic_data.append(item)
        
    time.sleep(1) # Polite delay between API calls

# Convert the expanded list into your final dataset file
df = pd.DataFrame(synthetic_data)
df.to_csv('complaints_dataset.csv', index=False)
print(f"Done! Your dataset now has {len(df)} AI-generated training samples.")
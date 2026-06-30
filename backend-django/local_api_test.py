# local_api_test.py
import requests

url = "http://127.0.0.1:8000/api/v1/traffic/analyze/"
# Place any traffic/car picture named 'test.jpg' in this folder to test it
image_path = "./traffic_eye_api/assets/fb2.jpg" 

with open(image_path, 'rb') as f:
    files = {'image': f}
    print("📡 Sending image frame to your live Django AI microservice...")
    response = requests.post(url, files=files)
    
print("\n🔥 Response from Hugging Face Transformer Engine:")
print(response.json())
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import joblib
import os



# Create your views here.
# Securely locate your ML weight folders relative to this file's position
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'triage_rf_model.pkl')
VECTORIZER_PATH = os.path.join(BASE_DIR, 'tfidf_vectorizer.pkl')

# Attempt to load ML models into Django memory upon startup
try:
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("[Django AI Brain] Complaint Prioritization Models loaded successfully!")
except Exception as e:
    print(f"[Django AI Brain Error] Model loading failure: {e}")
    model = None
    vectorizer = None

@api_view(['POST'])
def triage_complaint(request):
    """
    Exposes an internal microservice route to process raw natural language.
    Accepts: { "description": "There is an open manhole on Main Rd..." }
    """
    if model is None or vectorizer is None:
        return Response(
            {"error": "Machine learning weights are not available on this server."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    try:
        # 1. Grab text sent by Node.js API Gateway
        data = request.data
        complaint_text = data.get('description', '')
        
        if not complaint_text.strip():
            return Response(
                {"error": "Please provide a valid complaint description string."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 2. Convert text to features using the loaded TF-IDF Vectorizer
        text_features = vectorizer.transform([complaint_text])
        
        # 3. Predict category class using the trained model
        predicted_class = model.predict(text_features)[0]  # returns class string (e.g. 'Public_Safety')
        predicted_category = str(predicted_class)
        
        # Map category to priority levels: 1 (Low), 2 (Medium), 3 (High)
        priority_map = {
            'Electrical_Hazard': 3,
            'Structural_Damage_Risk': 3,
            'Public_Safety': 3,
            'Water_Logging': 2,
            'Road_Repair': 2,
            'Power_Outage': 2,
            'Water_Sanitation': 1,
            'Air_Pollution_Violation': 1,
            'Stray_Animal_Hazard': 1,
            'Waste_Management': 1,
            'Traffic_Encroachment': 1
        }
        predicted_priority = priority_map.get(predicted_category, 1)
        
        # 4. Return clean, structured JSON inference response
        return Response({
            "status": "success",
            "predicted_category": predicted_category,
            "predicted_priority": predicted_priority,
            "suggested_department": predicted_category.replace('_', ' ')
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Prediction failed: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
def complaints_health(request):
    """
    Validates DRF server state and checks whether machine learning models
    are successfully initialized in-memory.
    """
    model_loaded = model is not None
    vectorizer_loaded = vectorizer is not None
    
    is_healthy = model_loaded and vectorizer_loaded
    
    response_data = {
        "status": "online",
        "ml_models": {
            "triage_rf_model_loaded": model_loaded,
            "tfidf_vectorizer_loaded": vectorizer_loaded
        }
    }
    
    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response(response_data, status=status_code)
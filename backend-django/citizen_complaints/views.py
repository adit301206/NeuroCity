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
        
        # 3. Predict severity / priority class using the Random Forest Model
        predicted_class = model.predict(text_features)[0]  # returns class integer or string
        
        # 4. Return clean, structured JSON inference response
        return Response({
            "status": "success",
            "predicted_priority": int(predicted_class),  # E.g., 1 (Low) to 3 (High)
            "suggested_department": "Infrastructure" if "road" in complaint_text.lower() or "manhole" in complaint_text.lower() else "Sanitation"
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Prediction failed: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
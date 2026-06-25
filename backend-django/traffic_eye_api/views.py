from django.shortcuts import render


# traffic_eye_api/views.py
import os
import cv2
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .services.hf_transformer_engine import HFTrafficEyeService

traffic_analyzer = HFTrafficEyeService()

class TrafficFrameAnalysisView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, format=None):
        uploaded_frame = request.FILES.get('image')
        if not uploaded_frame:
            return Response({"status": "error", "message": "Missing image frame."}, status=status.HTTP_400_BAD_REQUEST)
            
        temp_filename = "temp_incoming_feed.jpg"
        with open(temp_filename, 'wb+') as destination:
            for chunk in uploaded_frame.chunks():
                destination.write(chunk)
                
        try:
            # 1. Run the YOLO inference pipeline
            telemetry_payload = traffic_analyzer.analyze_live_frame(temp_filename)
            
            if "error" not in telemetry_payload:
                # 2. Extract the raw results array mapping
                raw_results = telemetry_payload.pop("raw_results_object")
                
                # 3. Use YOLO's plotting renderer to draw the neon boxes and labels
                annotated_image = raw_results.plot()
                
                # 4. Save the verified bounding box image to disk
                output_dir = "test_outputs"
                os.makedirs(output_dir, exist_ok=True)
                output_path = os.path.join(output_dir, "latest_api_prediction.jpg")
                
                cv2.imwrite(output_path, annotated_image)
                print(f"💾 Visual check canvas saved cleanly to: {output_path}")
            
            response_status = status.HTTP_200_OK
        except Exception as e:
            telemetry_payload = {"status": "error", "message": f"Inference breakdown: {str(e)}"}
            response_status = status.HTTP_500_INTERNAL_SERVER_ERROR
        finally:
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
                
        return Response(telemetry_payload, status=response_status)
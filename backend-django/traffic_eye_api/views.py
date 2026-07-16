from django.shortcuts import render

# traffic_eye_api/views.py
import os
import cv2
import numpy as np
import collections
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes
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

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def predict_traffic(request):
    """
    In-memory image classification pipeline utilizing YOLOv8.
    Decodes file stream to OpenCV color matrix and runs object detection.
    """
    uploaded_frame = request.FILES.get('image')
    if not uploaded_frame:
        return Response({"status": "error", "message": "Missing image frame."}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        # Read the file stream dynamically and decode into an OpenCV BGR matrix
        file_bytes = np.frombuffer(uploaded_frame.read(), np.uint8)
        cv_image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        if cv_image is None:
            return Response({"status": "error", "message": "Failed to decode image."}, status=status.HTTP_400_BAD_REQUEST)
            
        img_h, img_w, _ = cv_image.shape
        
        # Access the loaded YOLO model
        model = traffic_analyzer.model
        results = model(cv_image, conf=0.20, iou=0.40, verbose=False)
        
        traffic_registry = collections.defaultdict(int)
        parsed_detections = []
        emergency_override_triggered = False
        valid_class_ids = [1, 2, 3, 5, 7] # bicycle, car, motorcycle, bus, truck
        
        detected_boxes = results[0].boxes
        for box in detected_boxes:
            class_id = int(box.cls[0])
            if class_id in valid_class_ids:
                class_name = model.names[class_id]
                score = float(box.conf[0])
                coords = box.xyxy[0].tolist()
                
                final_label = class_name
                xmin, ymin, xmax, ymax = map(int, [max(0, coords[0]), max(0, coords[1]), min(img_w, coords[2]), min(img_h, coords[3])])
                
                if (xmax - xmin) > 10 and (ymax - ymin) > 10:
                    cropped_box = cv_image[ymin:ymax, xmin:xmax]
                    
                    # Heuristics: Auto Rickshaw
                    if class_name in ['bus', 'truck'] and score < 0.60:
                        if traffic_analyzer._is_rickshaw_color_profile(cropped_box):
                            final_label = 'auto_rickshaw'
                            
                    # Heuristics: Emergency Red Profile
                    if final_label in ['car', 'truck', 'bus']:
                        if traffic_analyzer._is_emergency_red_profile(cropped_box):
                            final_label = 'emergency_vehicle'
                            emergency_override_triggered = True
                
                traffic_registry[final_label] += 1
                parsed_detections.append({
                    "class": final_label,
                    "confidence": round(score, 4),
                    "bbox_xyxy": [round(coord, 2) for coord in coords]
                })
                
        total_tracked = len(parsed_detections)
        congestion_index = "LOW" if total_tracked <= 5 else "MEDIUM" if total_tracked <= 15 else "HEAVY"
        
        # Save verification bounding box visual check representation to disk
        try:
            annotated_image = results[0].plot()
            output_dir = "test_outputs"
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, "latest_api_prediction.jpg")
            cv2.imwrite(output_path, annotated_image)
            print(f"💾 Visual check canvas saved cleanly to: {output_path}")
        except Exception as img_err:
            print(f"Failed to save annotated image: {img_err}")
            
        return Response({
            "status": "success",
            "engine": "Improved_YOLOv8_InMemory",
            "total_vehicles_detected": total_tracked,
            "congestion_index": congestion_index,
            "emergency_override_triggered": emergency_override_triggered,
            "vehicle_breakdown": dict(traffic_registry),
            "detections_metadata": parsed_detections
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "status": "error",
            "message": f"Inference breakdown: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# traffic_eye_api/views.py
import os
import cv2
import numpy as np
import collections
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes
from .services.hf_transformer_engine import HFTrafficEyeService

# Initialize global traffic analyzer service
traffic_analyzer = HFTrafficEyeService()

class TrafficFrameAnalysisView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, format=None):
        # Support both 'traffic_image' and 'image' keys
        uploaded_frame = request.FILES.get('traffic_image') or request.FILES.get('image')
        if not uploaded_frame:
            return Response(
                {"status": "error", "message": "Missing image frame under key 'traffic_image' or 'image'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        temp_filename = f"temp_{uploaded_frame.name}"
        with open(temp_filename, 'wb+') as destination:
            for chunk in uploaded_frame.chunks():
                destination.write(chunk)
                
        try:
            # 1. Run inference pipeline
            telemetry_payload = traffic_analyzer.analyze_live_frame(temp_filename)
            
            if "error" not in telemetry_payload:
                # 2. Render and save annotated bounding box image
                raw_results = telemetry_payload.pop("raw_results_object", None)
                processed_dir = os.path.join(settings.BASE_DIR, 'media', 'processed')
                os.makedirs(processed_dir, exist_ok=True)
                
                processed_filename = f"processed_{uploaded_frame.name}"
                processed_path = os.path.join(processed_dir, processed_filename)
                
                if raw_results is not None:
                    annotated_frame = raw_results.plot()
                    cv2.imwrite(processed_path, annotated_frame)

                raw_breakdown = telemetry_payload.get("vehicle_breakdown", {})
                
                vehicle_breakdown = {
                    "car": raw_breakdown.get("car", 0),
                    "bike": raw_breakdown.get("bike", 0) + raw_breakdown.get("bicycle", 0) + raw_breakdown.get("motorcycle", 0),
                    "truck": raw_breakdown.get("truck", 0),
                    "bus": raw_breakdown.get("bus", 0),
                    "auto_rickshaw": raw_breakdown.get("auto_rickshaw", 0),
                    "ambulance": raw_breakdown.get("ambulance", 0) + raw_breakdown.get("emergency_vehicle", 0)
                }

                total_vehicles = sum(vehicle_breakdown.values())
                congestion_index = telemetry_payload.get("congestion_index", "LOW")
                emergency_override = telemetry_payload.get("emergency_override_triggered", False)

                response_data = {
                    "status": "success",
                    "total_vehicles_detected": total_vehicles,
                    "congestion_index": congestion_index,
                    "emergency_override_triggered": emergency_override,
                    "vehicle_breakdown": vehicle_breakdown,
                    "processed_image_url": f"/media/processed/{processed_filename}"
                }
                response_status = status.HTTP_200_OK
            else:
                response_data = {"status": "error", "message": telemetry_payload.get("error")}
                response_status = status.HTTP_500_INTERNAL_SERVER_ERROR
        except Exception as e:
            response_data = {"status": "error", "message": f"Inference breakdown: {str(e)}"}
            response_status = status.HTTP_500_INTERNAL_SERVER_ERROR
        finally:
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
                
        return Response(response_data, status=response_status)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def predict_traffic(request):
    """
    In-memory image classification pipeline utilizing YOLOv8.
    Decodes file stream directly into OpenCV color matrix and runs object detection.
    """
    uploaded_frame = request.FILES.get('image')
    if not uploaded_frame:
        return Response(
            {"status": "error", "message": "Missing image frame under key 'image'."}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    try:
        # Read the file stream dynamically and decode into an OpenCV BGR matrix
        file_bytes = np.frombuffer(uploaded_frame.read(), np.uint8)
        cv_image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        if cv_image is None:
            return Response(
                {"status": "error", "message": "Failed to decode image."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        img_h, img_w, _ = cv_image.shape
        img_area = img_h * img_w
        
        # Access the loaded YOLO model
        model = traffic_analyzer.model
        
        # Consistent production parameters: conf=0.45, iou=0.45
        results = model(cv_image, conf=0.45, iou=0.45, verbose=False)
        
        traffic_registry = collections.defaultdict(int)
        parsed_detections = []
        emergency_override_triggered = False
        
        detected_boxes = results[0].boxes
        filtered_indices = []
        
        for idx, box in enumerate(detected_boxes):
            class_id = int(box.cls[0])
            if class_id in traffic_analyzer.valid_class_ids:
                class_name = model.names[class_id]
                score = float(box.conf[0])
                coords = box.xyxy[0].tolist()
                
                # Bounding Box Area Filter: ignore boxes < 0.2% (0.002) of total image size
                box_w = coords[2] - coords[0]
                box_h = coords[3] - coords[1]
                box_area = box_w * box_h
                if (box_area / img_area) < 0.002:
                    continue
                
                # Standardized Class Mapping: bicycle and motorcycle mapped to 'bike'
                if class_name in ['bicycle', 'motorcycle']:
                    final_label = 'bike'
                else:
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
                            final_label = 'ambulance'
                            # Require confidence >= 0.65 for emergency override
                            if score >= 0.65:
                                emergency_override_triggered = True
                
                traffic_registry[final_label] += 1
                parsed_detections.append({
                    "class": final_label,
                    "confidence": round(score, 4),
                    "bbox_xyxy": [round(coord, 2) for coord in coords]
                })
                filtered_indices.append(idx)
                
        total_tracked = len(parsed_detections)
        congestion_index = "LOW" if total_tracked <= 5 else "MEDIUM" if total_tracked <= 15 else "HEAVY"
        
        # Save verification bounding box visual check representation to /media/processed/
        filename = uploaded_frame.name if uploaded_frame.name else "predict_feed.jpg"
        processed_dir = os.path.join(settings.BASE_DIR, "media", "processed")
        os.makedirs(processed_dir, exist_ok=True)
        output_path = os.path.join(processed_dir, filename)
        
        if len(detected_boxes) > 0:
            results[0].boxes = detected_boxes[filtered_indices]
        
        try:
            annotated_image = results[0].plot()
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
            "detections_metadata": parsed_detections,
            "processed_image_url": f"/media/processed/{filename}",
            "processed_image_path": output_path
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "status": "error",
            "message": f"Inference breakdown: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TrafficAnalyzerView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, format=None):
        uploaded_frame = request.FILES.get('traffic_image') or request.FILES.get('image')
        if not uploaded_frame:
            return Response(
                {"status": "error", "message": "Missing image frame under key 'traffic_image' or 'image'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        import uuid
        temp_filename = f"temp_traffic_{uuid.uuid4().hex}.jpg"
        with open(temp_filename, 'wb+') as destination:
            for chunk in uploaded_frame.chunks():
                destination.write(chunk)
                
        try:
            # 1. Run the YOLO inference pipeline
            telemetry_payload = traffic_analyzer.analyze_live_frame(temp_filename)
            
            if "error" not in telemetry_payload:
                # 2. Extract the raw results object to plot bounding boxes
                raw_result = telemetry_payload.pop("raw_results_object", None)
                
                # 3. Use YOLO's built-in plotting utility to draw classes and boxes
                if raw_result is not None:
                    annotated_image = raw_result.plot()
                else:
                    annotated_image = cv2.imread(temp_filename)
                
                # 4. Save the verified bounding box image to /media/processed/
                processed_dir = os.path.join(settings.BASE_DIR, "media", "processed")
                os.makedirs(processed_dir, exist_ok=True)
                
                # Maintain the original file name or use a default
                filename = uploaded_frame.name if uploaded_frame.name else "annotated_feed.jpg"
                processed_filename = f"processed_{filename}"
                output_path = os.path.join(processed_dir, processed_filename)
                
                cv2.imwrite(output_path, annotated_image)
                print(f"💾 Visual check canvas saved cleanly to: {output_path}")
                
                # Map vehicle breakdown to the requested schema
                raw_breakdown = telemetry_payload.get("vehicle_breakdown", {})
                vehicle_breakdown = {
                    "car": raw_breakdown.get("car", 0),
                    "bike": raw_breakdown.get("bicycle", 0) + raw_breakdown.get("motorcycle", 0) + raw_breakdown.get("bike", 0),
                    "truck": raw_breakdown.get("truck", 0),
                    "bus": raw_breakdown.get("bus", 0),
                    "auto_rickshaw": raw_breakdown.get("auto_rickshaw", 0),
                    "ambulance": raw_breakdown.get("ambulance", 0) + raw_breakdown.get("emergency_vehicle", 0)
                }

                total_vehicles = sum(vehicle_breakdown.values())
                congestion_index = telemetry_payload.get("congestion_index", "LOW")
                emergency_override = telemetry_payload.get("emergency_override_triggered", False)

                response_data = {
                    "status": "success",
                    "total_vehicles_detected": total_vehicles,
                    "congestion_index": congestion_index,
                    "emergency_override_triggered": emergency_override,
                    "vehicle_breakdown": vehicle_breakdown,
                    "processed_image_url": f"/media/processed/{processed_filename}"
                }
                response_status = status.HTTP_200_OK
            else:
                response_data = {"status": "error", "message": telemetry_payload.get("error")}
                response_status = status.HTTP_500_INTERNAL_SERVER_ERROR
        except Exception as e:
            response_data = {"status": "error", "message": f"Inference breakdown: {str(e)}"}
            response_status = status.HTTP_500_INTERNAL_SERVER_ERROR
        finally:
            # Cleanup temporary file
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
                
        return Response(response_data, status=response_status)
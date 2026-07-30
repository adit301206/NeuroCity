# traffic_eye_api/services/hf_transformer_engine.py
import os
import time
import cv2
import numpy as np
from django.conf import settings
from ultralytics import YOLO

class HFTrafficEyeService:
    def __init__(self):
        print("🚦 Initializing NeuroCity Traffic Eye YOLOv8 Engine...")
        
        # Safe fallback for BASE_DIR
        try:
            from django.conf import settings
            base_dir = getattr(settings, 'BASE_DIR', '.')
        except Exception:
            base_dir = '.'

        model_path = os.path.join(base_dir, 'yolov8s.pt')
        if not os.path.exists(model_path):
            model_path = 'yolov8s.pt'  # Will auto-download if not found locally
            
        self.model = YOLO(model_path)

    def analyze_live_frame(self, image_path):
        if not os.path.exists(image_path):
            return {"status": "error", "message": f"Target image not found at {image_path}"}

        start_time = time.time()

        # Run inference: conf=0.25 detects smaller/distant vehicles, iou=0.45 purges duplicates
        results = self.model.predict(
            source=image_path,
            conf=0.25,
            iou=0.45,
            save=False
        )
        result = results[0]

        counts = {
            'car': 0,
            'bike': 0,
            'truck': 0,
            'bus': 0,
            'auto_rickshaw': 0,
            'ambulance': 0
        }

        parsed_detections = []
        emergency_override_triggered = False

        for box in result.boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            bbox = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
            
            raw_class = result.names[cls_id].lower()

            box_w = bbox[2] - bbox[0]
            box_h = bbox[3] - bbox[1]

            # --- Class Mapping & Spatial Heuristics for Indian Traffic ---
            if raw_class == 'car':
                detected_class = 'car'
            elif raw_class in ['motorcycle', 'bicycle']:
                detected_class = 'bike'
            elif raw_class == 'truck':
                detected_class = 'truck'
            elif raw_class == 'bus':
                # Bounding box heuristic: Compact 'bus' bounding boxes in Indian traffic are Auto-Rickshaws
                if box_w < 120 and box_h < 120:
                    detected_class = 'auto_rickshaw'
                else:
                    detected_class = 'bus'
            elif raw_class == 'ambulance':
                detected_class = 'ambulance'
            else:
                # Ignore non-vehicle COCO classes (person, traffic light, dog, etc.)
                continue

            # Priority Emergency Trigger Rule
            if detected_class == 'ambulance' and conf >= 0.50:
                emergency_override_triggered = True

            counts[detected_class] += 1

            parsed_detections.append({
                'class': detected_class,
                'confidence': round(conf, 4),
                'bbox_xyxy': [round(v, 2) for v in bbox]
            })

        total_vehicles = sum(counts.values())

        # Determine Congestion Level
        if total_vehicles <= 6:
            congestion_index = "LOW"
        elif total_vehicles <= 15:
            congestion_index = "MEDIUM"
        else:
            congestion_index = "HEAVY"

        latency = round(time.time() - start_time, 4)

        return {
            "status": "success",
            "engine": "NeuroCity_YOLOv8_Optimized",
            "compute_latency_seconds": latency,
            "total_vehicles_detected": total_vehicles,
            "congestion_index": congestion_index,
            "emergency_override_triggered": emergency_override_triggered,
            "vehicle_breakdown": counts,
            "detections_metadata": parsed_detections,
            "raw_results_object": result
        }
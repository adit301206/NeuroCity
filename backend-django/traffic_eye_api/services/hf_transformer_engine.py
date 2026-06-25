# traffic_eye_api/services/hf_transformer_engine.py
import os
import collections
import time
from ultralytics import YOLO

class HFTrafficEyeService:
    def __init__(self):
        print("🚦 Initializing Improved Multi-Scale YOLOv8 Engine...")
        # Using yolov8s.pt (Small) to get better pyramid scaling layers for dense streets
        self.model = YOLO('yolov8s.pt') 
        self.valid_class_ids = [1, 2, 3, 5, 7] # bicycle, car, motorcycle, bus, truck

    def analyze_live_frame(self, image_path):
        if not os.path.exists(image_path):
            return {"error": "Target image not discovered."}
            
        start_time = time.time()
        
        # Lowering conf to 0.20 to aggressively try and look through shadows/glare in your father's photos
        results = self.model(image_path, conf=0.20, iou=0.40, verbose=False)
        
        latency = time.time() - start_time
        traffic_registry = collections.defaultdict(int)
        parsed_detections = []
        emergency_override_triggered = False
        
        detected_boxes = results[0].boxes
        for box in detected_boxes:
            class_id = int(box.cls[0])
            
            if class_id in self.valid_class_ids:
                class_name = self.model.names[class_id]
                score = float(box.conf[0])
                coords = box.xyxy[0].tolist()
                
                traffic_registry[class_name] += 1
                parsed_detections.append({
                    "class": class_name,
                    "confidence": round(score, 4),
                    "bbox_xyxy": [round(coord, 2) for coord in coords]
                })
                
                if class_name in ['bus', 'truck']:
                    emergency_override_triggered = True

        total_tracked = len(parsed_detections)
        congestion_index = "LOW" if total_tracked <= 5 else "MEDIUM" if total_tracked <= 15 else "HEAVY"

        return {
            "status": "success",
            "engine": "Improved_YOLOv8_MultiScale",
            "compute_latency_seconds": round(latency, 4),
            "total_vehicles_detected": total_tracked,
            "congestion_index": congestion_index,
            "emergency_override_triggered": emergency_override_triggered,
            "vehicle_breakdown": dict(traffic_registry),
            "detections_metadata": parsed_detections,
            "raw_results_object": results[0] # CRITICAL: Passing this out to let Django draw the boxes
        }
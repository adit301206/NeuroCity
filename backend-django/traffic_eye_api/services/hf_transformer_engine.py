# traffic_eye_api/services/hf_transformer_engine.py
import os
import collections
import time
import numpy as np
import cv2
from ultralytics import YOLO

class HFTrafficEyeService:
    def __init__(self):
        print("🚦 Initializing Windshield-Optimized YOLOv8 NeuroCity Engine...")
        # Using yolov8s.pt (Small) to get better pyramid scaling layers for dense streets
        self.model = YOLO('yolov8s.pt') 
        self.valid_class_ids = [1, 2, 3, 5, 7] # bicycle, car, motorcycle, bus, truck

    def _is_rickshaw_color_profile(self, cropped_vehicle_bgr):
        """
        Applies a localized color mask to check if the cropped vehicle box contains 
        significant concentrations of green and yellow hues typical of Indian auto-rickshaws.
        """
        try:
            if cropped_vehicle_bgr is None or cropped_vehicle_bgr.size == 0:
                return False
                
            hsv = cv2.cvtColor(cropped_vehicle_bgr, cv2.COLOR_BGR2HSV)
            
            # 🟢 Green Mask (Typical commercial body paint)
            lower_green = np.array([35, 40, 40])
            upper_green = np.array([85, 255, 255])
            green_mask = cv2.inRange(hsv, lower_green, upper_green)
            
            # 🟡 Yellow Mask (Typical roof/hood colors)
            lower_yellow = np.array([11, 40, 40])
            upper_yellow = np.array([34, 255, 255])
            yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
            
            combined_rickshaw_mask = green_mask + yellow_mask
            
            total_pixels = cropped_vehicle_bgr.shape[0] * cropped_vehicle_bgr.shape[1]
            rickshaw_ratio = np.sum(combined_rickshaw_mask > 0) / total_pixels
            
            return rickshaw_ratio > 0.05  # More than 5% matches auto signatures
        except Exception:
            return False

    def _is_emergency_red_profile(self, cropped_vehicle_bgr):
        """
        Applies an HSV color mask tracking intense emergency reds. 
        Identifies both ambulances (sirens/decals) and fire brigades (solid red body paint).
        """
        try:
            if cropped_vehicle_bgr is None or cropped_vehicle_bgr.size == 0:
                return False
                
            hsv = cv2.cvtColor(cropped_vehicle_bgr, cv2.COLOR_BGR2HSV)
            
            # 🔴 Red wraps around the HSV 0-180 degree line, so we combine upper and lower bounds
            lower_red1 = np.array([0, 120, 120])
            upper_red1 = np.array([10, 255, 255])
            lower_red2 = np.array([170, 120, 120])
            upper_red2 = np.array([180, 255, 255])
            
            mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
            mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
            red_mask = mask1 + mask2
            
            total_pixels = cropped_vehicle_bgr.shape[0] * cropped_vehicle_bgr.shape[1]
            red_ratio = np.sum(red_mask > 0) / total_pixels
            
            # Since fire trucks are fully red, they will easily clear this threshold (>35%).
            # Ambulances with emergency stripes and red sirens will clear a basic 4% floor threshold.
            return red_ratio > 0.04
        except Exception:
            return False

    def analyze_live_frame(self, image_path):
        if not os.path.exists(image_path):
            return {"error": "Target image not discovered."}
            
        start_time = time.time()
        
        # Lowering conf to 0.20 to aggressively find objects through shadows/glare
        results = self.model(image_path, conf=0.20, iou=0.40, verbose=False)
        
        raw_bgr_img = cv2.imread(image_path)
        img_h, img_w, _ = raw_bgr_img.shape
        
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
                
                final_label = class_name
                
                # Setup safe integer crop coordinates
                xmin, ymin, xmax, ymax = map(int, [max(0, coords[0]), max(0, coords[1]), min(img_w, coords[2]), min(img_h, coords[3])])
                
                if (xmax - xmin) > 10 and (ymax - ymin) > 10:
                    cropped_box = raw_bgr_img[ymin:ymax, xmin:xmax]
                    
                    # 🛺 1. MENTOR AUTO-RICKSHAW LOGIC
                    # If it's guessed as a bus/truck under 60% confidence, check for Rickshaw yellow/green profiles
                    if class_name in ['bus', 'truck'] and score < 0.60:
                        if self._is_rickshaw_color_profile(cropped_box):
                            final_label = 'auto_rickshaw'
                    
                    # 🚑🔥 2. MENTOR EMERGENCY VEHICLE LOGIC (Ambulance + Fire Brigade)
                    # If it's a car, truck, or bus, run our red profile check to capture emergency vectors
                    if final_label in ['car', 'truck', 'bus']:
                        if self._is_emergency_red_profile(cropped_box):
                            final_label = 'emergency_vehicle'
                            emergency_override_triggered = True  # Instantly fire the Green Wave Signal Override!

                # Count final processed labels safely
                traffic_registry[final_label] += 1
                parsed_detections.append({
                    "class": final_label,
                    "confidence": round(score, 4),
                    "bbox_xyxy": [round(coord, 2) for coord in coords]
                })
                
                # Keep track of un-intercepted heavy commercial baseline vehicles
                if final_label in ['bus', 'truck']:
                    pass 

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
            "raw_results_object": results[0]
        }
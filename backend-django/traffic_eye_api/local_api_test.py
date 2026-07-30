import os
import sys
import pprint

# --- 1. Locate Directories Relative to File ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DJANGO_ROOT = os.path.dirname(BASE_DIR)  # C:\NeuroCity\backend-django

# Add Django root to Python Path
if DJANGO_ROOT not in sys.path:
    sys.path.append(DJANGO_ROOT)

# --- 2. Bootstrap Django Environment ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'traffic_eye_api.settings')
try:
    import django
    django.setup()
    print("⚡ Django environment bootstrapped successfully.")
except Exception as e:
    print(f"⚠️ Django setup notice: {e}")

# --- 3. Configure Target Image Path ---
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
IMAGE_NAME = 'd3.jpg'
image_path = os.path.join(ASSETS_DIR, IMAGE_NAME)

print("=" * 60)
print("🧪 NEUROCITY TRAFFIC EYE - STANDALONE MODEL TEST")
print("=" * 60)
print(f"📂 Image Path: {image_path}")

if not os.path.exists(image_path):
    print(f"\n❌ Image not found at {image_path}")
    sys.exit(1)

print("✅ Image found! Running YOLOv8 Inference...\n")

# --- 4. Import & Run HFTrafficEyeService ---
try:
    from traffic_eye_api.services.hf_transformer_engine import HFTrafficEyeService

    service = HFTrafficEyeService()
    result = service.analyze_live_frame(image_path)

    # Pop raw ultralytics tensor result for clean console output
    result.pop('raw_results_object', None)

    print("🔥 MODEL INFERENCE OUTPUT:")
    pprint.pprint(result)

except Exception as e:
    print(f"❌ Inference execution failed: {e}")

print("=" * 60)
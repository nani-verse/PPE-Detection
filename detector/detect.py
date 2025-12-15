from flask import Flask, Response, request
from flask_cors import CORS
import threading
import cv2
import numpy as np
from ultralytics import YOLO
import base64
import requests
from datetime import datetime
import time
from pymongo import MongoClient


app = Flask(__name__)
CORS(app)

# Global variables
camera_active = False
frame_thread = None
frame_lock = threading.Lock()
output_frame = None
cap = None

# Load YOLOv8 model
model = YOLO("model.pt")
client = MongoClient("mongodb://localhost:27017/")
db = client["ppe-detection"]
collection = db["screenshots"]
expected_ppe = {"helmet", "vest", "gloves"}
cooldown = 5  # seconds between uploads
last_sent_time = 0
API_ENDPOINT = "http://localhost:5000/upload"

def encode_image_to_base64(image):
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')

def camera_loop():
    global output_frame, camera_active, last_sent_time, cap

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    while camera_active:
        ret, frame = cap.read()
        if not ret:
            print("Error reading frame")
            break

        # Run YOLOv8 inference
        results = model.predict(source=frame, conf=0.3, verbose=False)
        annotated = results[0].plot()

        # Extract class labels
        names = model.names
        detected_labels = [names[int(cls)] for cls in results[0].boxes.cls]
        label_counts = {label: detected_labels.count(label) for label in set(detected_labels)}

        # Check PPE violations if a person is present
        if label_counts.get("person", 0) > 0:
            missing = [item for item in expected_ppe if label_counts.get(item, 0) == 0]

            if missing and (time.time() - last_sent_time > cooldown):
                last_sent_time = time.time()
                encoded_image = encode_image_to_base64(annotated)
                payload = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "image": f"data:image/jpeg;base64,{encoded_image}",
                    "location": "Live Feed",
                    "source": "live",
                    "detections": [{"item": m, "confidence": 0.0} for m in missing]
                }
                try:
                    response = requests.post(API_ENDPOINT, json=payload)
                    print("Uploaded missing items:", missing, "| Status:", response.status_code)
                except Exception as e:
                    print("Upload error:", e)

        # Store current annotated frame for video feed
        with frame_lock:
            _, buffer = cv2.imencode('.jpg', annotated)
            output_frame = buffer.tobytes()

    if cap is not None:
        cap.release()
    print("Camera loop ended")

@app.route('/start', methods=['GET'])
def start_camera():
    global camera_active, frame_thread

    if not camera_active:
        camera_active = True
        frame_thread = threading.Thread(target=camera_loop)
        frame_thread.daemon = True
        frame_thread.start()
        return {"status": "success", "message": "Camera started"}, 200
    return {"status": "info", "message": "Camera already running"}, 200

@app.route('/stop', methods=['GET'])
def stop_camera():
    global camera_active, cap

    if camera_active:
        camera_active = False
        if frame_thread is not None:
            frame_thread.join(timeout=1)
        if cap is not None:
            cap.release()
            cap = None
        return {"status": "success", "message": "Camera stopped"}, 200
    return {"status": "info", "message": "Camera already stopped"}, 200

@app.route('/video_feed')
def video_feed():
    def generate():
        while True:
            with frame_lock:
                if output_frame is not None and camera_active:
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + output_frame + b'\r\n')
                else:
                    black_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                    _, buffer = cv2.imencode('.jpg', black_frame)
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(0.05)

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/test_connection')
def test_connection():
    return {"status": "success", "message": "Server is running"}, 200

@app.route('/summary')
def get_summary():
    daily = {}
    missing_counts = {}

    try:
        for doc in collection.find():
            ts = doc.get("timestamp")

            # ✅ Handle both string and datetime formats
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts.replace("Z", ""))
                except Exception:
                    continue
            elif not isinstance(ts, datetime):
                continue  # Skip if timestamp is invalid

            date_str = ts.strftime("%Y-%m-%d")
            daily[date_str] = daily.get(date_str, 0) + 1

            for detection in doc.get('detections', []):
                item = detection.get('item')
                if item:
                    missing_counts[item] = missing_counts.get(item, 0) + 1

        return {
            "daily": daily,
            "missingPPE": missing_counts
        }

    except Exception as e:
        print("Summary generation failed:", e)
        return {"daily": {}, "missingPPE": {}}, 500



# ✅ app.run must be LAST
if __name__ == '__main__':
    app.run(host='localhost', port=5001, debug=True)

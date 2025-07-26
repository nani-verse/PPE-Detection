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

app = Flask(__name__)
CORS(app)  # Enable CORS

# Global variables
camera_active = False
frame_thread = None
frame_lock = threading.Lock()
output_frame = None
cap = None

# Load your custom model
model = YOLO("model.pt")  # Keep your original model path
expected_ppe = {"helmet", "vest", "gloves"}  # Keep your original PPE items
cooldown = 5  # Keep your original cooldown
last_sent_time = 0
API_ENDPOINT = "http://localhost:5000/upload"  # Keep your original endpoint

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

        # Perform detection
        results = model.predict(source=frame, conf=0.3, verbose=False)
        annotated = results[0].plot()
        
        # Get detected classes
        names = model.names
        detected = set(names[int(cls)] for cls in results[0].boxes.cls)

        # Check for PPE violations
        if "person" in detected:
            missing = list(expected_ppe - detected)
            if missing and (time.time() - last_sent_time > cooldown):
                last_sent_time = time.time()
                encoded = encode_image_to_base64(annotated)
                payload = {
                    "timestamp": datetime.now().isoformat(),
                    "missing": missing,
                    "image": encoded
                }
                try:
                    requests.post(API_ENDPOINT, json=payload)
                except Exception as e:
                    print("Upload error:", e)

        # Update output frame
        with frame_lock:
            _, buffer = cv2.imencode('.jpg', annotated)
            output_frame = buffer.tobytes()

    # Release camera when done
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
                    # Send black frame when inactive
                    black_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                    _, buffer = cv2.imencode('.jpg', black_frame)
                    yield (b'--frame\r\n'
                          b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(0.05)  # ~20 FPS
            
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/test_connection')
def test_connection():
    return {"status": "success", "message": "Server is running"}, 200

if __name__ == '__main__':
    app.run(host='localhost', port=5001, debug=True)






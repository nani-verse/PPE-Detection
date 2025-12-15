🦺 Real-Time AI-Based PPE Compliance Monitoring System
📌 Overview

This project is a real-time AI-powered PPE (Personal Protective Equipment) compliance monitoring system designed to improve workplace safety in industrial environments. 
It uses computer vision and deep learning to automatically detect whether personnel are wearing mandatory safety equipment such as helmets, safety vests, and gloves from live video streams. 
Detected violations are captured, stored, and displayed through a monitoring dashboard.


🚀 Key Features

1. Real-time PPE detection using YOLOv8
2. Live camera video streaming with annotations
3. Automatic detection and capture of PPE violations
4. Visual evidence storage with timestamps
5. Dashboard to view, manage, and delete violations
5. Daily and item-wise compliance summary
6. Scalable microservices-based backend architecture


🏗 System Architecture

The system follows a microservices architecture with two independent backend services:

- Flask (Python) Backend:
Handles live camera input, AI inference, PPE violation detection, and video streaming.
- Node.js (Express) Backend:
Manages data storage, REST APIs, and communication with the frontend using MongoDB.

The frontend is built using React.js for real-time monitoring


🧰 Tech Stack

1. Frontend

- React.js
-  HTML, CSS, JavaScript

2. Backend

- Flask (Python) – AI inference & video streaming
- Node.js & Express – REST APIs & data management

3. AI & Computer Vision

- YOLOv8 (Ultralytics) – PPE and person detection
-  OpenCV – Camera and video processing

4. Database

- MongoDB – Violation image and metadata storage


Backend 1: Flask (AI Server)
- pip install -r requirements.txt
- python detect.py

Runs on:
http://localhost:5001


Backend 2: Node.js (Data Server)
- npm install
- node index.js

Runs on:
http://localhost:5000

Frontend
- npm install
- npm start

Runs on:
http://localhost:3000

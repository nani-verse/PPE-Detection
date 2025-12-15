import React, { useEffect, useState } from 'react';
import './DetectPage.css';

function DetectPage() {
  const [cameraOn, setCameraOn] = useState(false);

  const handleStartCamera = async () => {
    try {
      const res = await fetch('http://localhost:5001/start');
      if (res.ok) setCameraOn(true);
    } catch (err) {
      console.error('Start error:', err);
    }
  };

  const handleStopCamera = async () => {
    try {
      const res = await fetch('http://localhost:5001/stop');
      if (res.ok) setCameraOn(false);
    } catch (err) {
      console.error('Stop error:', err);
    }
  };

  return (
    <div className="detect-page">
      <h1 className="detect-title">Live Detection</h1>
      <h2 className={`status-text ${cameraOn ? 'active' : 'inactive'}`}>
        {cameraOn ? '🟢 Detecting PPE...' : '🔴 Detection Stopped'}
      </h2>

      <div className="video-wrapper">
        {!cameraOn ? (
          <div className="placeholder">Camera feed will appear here</div>
        ) : (
          <img
            src="http://localhost:5001/video_feed"
            alt="Live Feed"
            className="video-feed"
          />
        )}
      </div>

      <div className="controls">
        <button onClick={handleStartCamera}>Start Camera</button>
        <button onClick={handleStopCamera}>Stop Camera</button>
      </div>
    </div>
  );
}

export default DetectPage;

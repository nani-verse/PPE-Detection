import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaDatabase } from 'react-icons/fa';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="overlay">
        <div className="home-content">
          <img src="/logo.png" alt="Logo" className="home-logo" />
          <h1 className="home-title">
            PPE Detection Using Machine Learning
          </h1>
          <p className="home-subtitle">
            Real-time safety monitoring system for steel plant operations
          </p>
          <div className="button-group">
            <button className="home-btn" onClick={() => navigate('/detect')}>
              <FaPlay style={{ marginRight: '8px' }} />
              Start Detecting
            </button>
            <button className="home-btn" onClick={() => navigate('/login')}>
                <FaDatabase style={{ marginRight: '8px' }} />
                View Database
            </button>

          </div>
        </div>
      </div>
      <footer className="home-footer">
        © 2025 PPE Detection | Developed by Kalluri Narasimham
      </footer>
    </div>
  );
}

export default HomePage;




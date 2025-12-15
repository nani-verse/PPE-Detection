import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DetectPage from './pages/DetectPage';
import DatabasePage from './pages/DatabasePage';
import LoginPage from './pages/LoginPage';


function App() {
  return (
    
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/detect" element={<DetectPage />} />
          <Route path="/database" element={<DatabasePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
   
  );
}

export default App;


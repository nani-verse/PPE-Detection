import { Link } from 'react-router-dom';
import './Navbar.css'; // Add this line for custom styles

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-title">🦺 PPE Detection</div>
      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/detect" className="nav-link">Detection</Link>
        <Link to="/database" className="nav-link">Database</Link>
      </div>
    </nav>
  );
}

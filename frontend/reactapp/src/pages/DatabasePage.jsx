import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import "./DatabasePage.css";
import { useNavigate } from "react-router-dom";


function DatabasePage() {
  const [screenshots, setScreenshots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMissingItem, setSelectedMissingItem] = useState("");
  const [zoomedImage, setZoomedImage] = useState(null);
  const [page, setPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [screenshotToDelete, setScreenshotToDelete] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // 🔹 Summary state
  const [summary, setSummary] = useState({ daily: {}, missingPPE: {} });

  const screenshotsPerPage = 12;
  const navigate = useNavigate();


  useEffect(() => {
    fetch("http://localhost:5000/screenshots")
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setScreenshots(sorted);
      })
      .catch(err => console.error("Error fetching screenshots:", err));

    // Fetch summary
    fetch("http://localhost:5001/summary")
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error("Error fetching summary:", err));
  }, []);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const filteredScreenshots = screenshots.filter(s => {
    const dateMatch = selectedDate ? isSameDay(new Date(s.timestamp), selectedDate) : true;
    const itemMatch = selectedMissingItem
      ? (s.detections || []).some(d => d.item === selectedMissingItem)
      : true;
    return dateMatch && itemMatch;
  });

  const totalPages = Math.ceil(filteredScreenshots.length / screenshotsPerPage);
  const currentShots = filteredScreenshots.slice(
    (page - 1) * screenshotsPerPage,
    page * screenshotsPerPage
  );

  const getValidImageSrc = (base64Str) => {
    if (base64Str.startsWith("data:image")) return base64Str;
    return `data:image/jpeg;base64,${base64Str}`;
  };

  const handleDelete = () => {
    if (!screenshotToDelete) return;

    fetch(`http://localhost:5000/screenshots/${screenshotToDelete}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          setScreenshots(prev => prev.filter(item => item._id !== screenshotToDelete));
          setShowSuccess(true);
          setConfirmModalOpen(false);
          setScreenshotToDelete(null);
          setTimeout(() => setShowSuccess(false), 3000);
        } else {
          alert("Failed to delete screenshot.");
        }
      })
      .catch(err => console.error("Delete error:", err));
  };

  // 🔹 Prepare summary chart data
  const dailyData = Object.entries(summary.daily || {}).map(([date, count]) => ({
    date, count
  }));

  const ppeData = Object.entries(summary.missingPPE || {}).map(([item, count]) => ({
    name: item, value: count
  }));

  const COLORS = ["#ff7675", "#74b9ff", "#ffeaa7"];
  


  return (

    <div className="database-page">
      <div style={{ position: "absolute", top: 30, left: 30 }}>
        <button className="home-btn" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
      <h1 className="title">Detected PPE Violations</h1>
        
      {/* 🔹 Charts Section */}
      <div className="charts-container">
        <div className="chart-box">
          <h2>📅 Violations per Day</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#00cec9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>🧰 Most Frequently Missing PPE</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ppeData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {ppeData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* OPTIONS DROPDOWN */}
      <div className="options-wrapper">
  <button onClick={() => setDropdownOpen(!dropdownOpen)} className="home-btn">
    Options ⏷
  </button>

  {dropdownOpen && (
    <div className="dropdown-box">
      <div style={{ marginBottom: "10px" }}>
        <label style={{ marginRight: "10px", fontSize: "14px" }}>📅 Filter by Date:</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => {
            setSelectedDate(date);
            setPage(1);
          }}
          placeholderText="Select Date"
          isClearable
          dateFormat="yyyy-MM-dd"
        />
      </div>
      <div>
        <label style={{ marginRight: "10px", fontSize: "14px" }}>🧰 Missing Equipment:</label>
        <select
          value={selectedMissingItem}
          onChange={(e) => {
            setSelectedMissingItem(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="Helmet">Helmet</option>
          <option value="Gloves">Gloves</option>
          <option value="Vest">Vest</option>
        </select>
      </div>
    </div>
  )}
</div>



      {/* IMAGE GRID */}
      <div className="screenshots-grid">
        {currentShots.map((s, i) => (
          <div key={i} className="screenshot-card">
            <img
              src={getValidImageSrc(s.image)}
              alt="Screenshot"
              onClick={() => setZoomedImage(getValidImageSrc(s.image))}
            />
            <p><strong>Time:</strong> {new Date(s.timestamp).toLocaleString()}</p>
            <p><strong>Missing:</strong> {(s.detections || []).map(d => d.item).join(", ") || "None"}</p>

            <button
              className="delete-btn"
              onClick={() => {
                setScreenshotToDelete(s._id);
                setConfirmModalOpen(true);
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {filteredScreenshots.length > screenshotsPerPage && (
        <div className="pagination-controls">
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>Next</button>
        </div>
      )}

      {/* ZOOM MODAL */}
      {zoomedImage && (
        <div className="zoom-modal" onClick={() => setZoomedImage(null)}>
          <span className="close-button">✕</span>
          <img src={zoomedImage} alt="Zoomed Screenshot" />
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmModalOpen && (
        <div className="delete-modal">
          <div className="delete-box">
            <p>Are you sure you want to delete this screenshot?</p>
            <div className="delete-actions">
              <button className="cancel-btn" onClick={() => setConfirmModalOpen(false)}>Cancel</button>
              <button className="confirm-delete-btn" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="success-toast">
          Deleted record successfully ✅
        </div>
      )}
    </div>
  );
}

export default DatabasePage;

// App.js - Fixed with last updated time display
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./App.css";

// Import all page components
import HomePage from "./HomePage";
import Dashboard from "./Dashboard";
import LiveMap from "./LiveMap";
import AnalyzeLocation from "./AnalyzeLocation";
import AnomalyReports from "./AnomalyReports";
import DataInsights from "./DataInsights";
import DataSources from "./DataSources";
import About from "./About";

// Icons
const Icons = {
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Dashboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  Map: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Analyze: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="1"/></svg>,
  Reports: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Insights: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Data: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  About: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="1"/></svg>,
};

// Navigation Items
const navItems = [
  { path: "/", label: "Home", icon: Icons.Home },
  { path: "/dashboard", label: "Dashboard", icon: Icons.Dashboard },
  { path: "/map", label: "Live Map", icon: Icons.Map },
  { path: "/analyze", label: "Analyze", icon: Icons.Analyze },
  { path: "/reports", label: "Reports", icon: Icons.Reports },
  { path: "/insights", label: "Insights", icon: Icons.Insights },
  { path: "/data", label: "Data", icon: Icons.Data },
  { path: "/about", label: "About", icon: Icons.About },
];

// Helper function to format time ago
const timeAgo = (timestamp) => {
  if (!timestamp) return "Never";
  
  const now = new Date();
  const updated = new Date(timestamp);
  const diffMs = now - updated;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// Navigation Component
const Navigation = ({ theme, toggleTheme, globalDW, lastUpdated }) => {
  const location = useLocation();

  return (
    <nav className="top-nav">
      {/* LEFT - LOGO */}
      <div className="nav-left">
        <div className="nav-brand">
          <span className="brand-icon">🌍</span>
          <div className="brand-text">
            <h1>ARAVALLI WATCH</h1>
            <span>Environmental Intelligence Platform</span>
          </div>
        </div>
      </div>

      {/* CENTER - NAVIGATION */}
      <div className="nav-center">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
          >
            <span className="nav-icon"><item.icon /></span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* RIGHT - DATE + LAST UPDATED + THEME */}
      <div className="nav-right">
        {lastUpdated && (
          <div className="update-chip" title={`Last updated: ${new Date(lastUpdated).toLocaleString()}`}>
            🔄 {timeAgo(lastUpdated)}
          </div>
        )}

        {globalDW && (
          <div className="date-chip">
            📅 {globalDW.latest_start} → {globalDW.latest_end}
          </div>
        )}

        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
};

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalDW, setGlobalDW] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 600000); // 10 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://aravalli-intelligence.onrender.com/analyze");
      console.log("API Response:", res.data);
  
      const anomalies = res?.data?.data?.data || [];
      console.log("Anomalies:", anomalies.length);
      
      setData(anomalies);
      
      if (res?.data?.data?.date_windows) {
        setGlobalDW(res.data.data.date_windows);
      }

      // Get last updated timestamp from API response
      if (res?.data?.last_updated) {
        setLastUpdated(res.data.last_updated);
      }
      
    } catch (e) {
      console.error("Fetch error:", e);
      setError("Could not reach analysis API");
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`app ${theme}`}>
      <Navigation 
        theme={theme} 
        toggleTheme={toggleTheme} 
        globalDW={globalDW}
        lastUpdated={lastUpdated}
      />
      
      <main className="main-content">
        {error && (
          <div className="error-banner">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<HomePage data={data} loading={loading} globalDW={globalDW} />} />
          <Route path="/dashboard" element={<Dashboard data={data} loading={loading} globalDW={globalDW} />} />
          <Route path="/map" element={<LiveMap data={data} loading={loading} globalDW={globalDW} />} />
          <Route path="/analyze" element={<AnalyzeLocation />} />
          <Route path="/reports" element={<AnomalyReports data={data} loading={loading} />} />
          <Route path="/insights" element={<DataInsights data={data} loading={loading} />} />
          <Route path="/data" element={<DataSources />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}

// Wrap with Router
export default function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}
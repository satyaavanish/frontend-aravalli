import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

import {
  FiMap,
  FiAlertTriangle,
  FiFeather, 
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiLayers,
  FiChevronDown,
  FiChevronUp,
  FiChevronRight,
  FiBarChart2,
  FiActivity,
  FiCpu
} from "react-icons/fi";

import { WiNightAltCloudy } from "react-icons/wi";
import { FaCity, FaLeaf, FaIndustry, FaMapMarkedAlt, FaChartLine, FaMountain, FaTree, FaHardHat } from "react-icons/fa";
import { GiTreeBranch, GiFactory, GiMining, GiFarmTractor, GiMountains } from "react-icons/gi";
import { MdOutlineAgriculture, MdOutlineConstruction } from "react-icons/md";

// Activity Type Detection Function
const detectActivityType = (item) => {
  const ndviChange = item.delta_ndvi || 0;
  const nightlightChange = item.delta_nightlight || 0;
  
  // Natural vs Man-made classification
  if (ndviChange < -0.1 && Math.abs(nightlightChange) < 0.1) {
    return {
      primary: "NATURAL",
      specific: "Vegetation Decline",
      icon: <GiTreeBranch />,
      color: "#10b981",
      description: "Natural vegetation decrease likely due to seasonal or climate factors"
    };
  } else if (ndviChange > 0.1 && Math.abs(nightlightChange) < 0.1) {
    return {
      primary: "NATURAL",
      specific: "Vegetation Growth",
      icon: <FaLeaf />,
      color: "#10b981",
      description: "Natural vegetation increase, possibly due to rainfall or regeneration"
    };
  } else if (Math.abs(nightlightChange) > 0.3 && ndviChange < -0.05) {
    return {
      primary: "MAN_MADE",
      specific: "Urban Expansion",
      icon: <FaCity />,
      color: "#f59e0b",
      description: "Increasing nightlight with vegetation loss indicates urban development"
    };
  } else if (Math.abs(nightlightChange) > 0.3 && Math.abs(ndviChange) < 0.05) {
    return {
      primary: "MAN_MADE",
      specific: "Infrastructure Development",
      icon: <MdOutlineConstruction />,
      color: "#f59e0b",
      description: "Nightlight increase without vegetation change suggests infrastructure"
    };
  } else if (nightlightChange < -0.2 && ndviChange < -0.1) {
    return {
      primary: "MAN_MADE",
      specific: "Industrial Activity",
      icon: <GiFactory />,
      color: "#ef4444",
      description: "Decrease in both vegetation and nightlight suggests industrial activity"
    };
  } else if (nightlightChange < -0.2 && ndviChange > 0.1) {
    return {
      primary: "NATURAL",
      specific: "Agricultural Shift",
      icon: <MdOutlineAgriculture />,
      color: "#10b981",
      description: "Vegetation increase with nightlight decrease suggests agricultural use"
    };
  } else if (Math.abs(nightlightChange) > 0.5) {
    return {
      primary: "MAN_MADE",
      specific: "Major Development",
      icon: <GiMining />,
      color: "#ef4444",
      description: "Significant nightlight change indicates major human activity"
    };
  } else {
    return {
      primary: "MIXED",
      specific: "Mixed Activity",
      icon: <FiActivity />,
      color: "#8b5cf6",
      description: "Combination of natural and anthropogenic factors"
    };
  }
};

// Comparison Bar Component
const ComparisonBar = ({ label, latest, previous, color, unit, type }) => {
  const maxValue = Math.max(latest, previous, 1);
  const latestPercent = (latest / maxValue) * 100;
  const previousPercent = (previous / maxValue) * 100;
  const change = ((latest - previous) / previous * 100).toFixed(1);
  
  return (
    <div className="comparison-card">
      <div className="comparison-header">
        <span className="comparison-title">{label}</span>
        <span className={`change-badge ${latest > previous ? 'positive' : 'negative'}`}>
          {latest > previous ? <FiTrendingUp /> : <FiTrendingDown />}
          {change}%
        </span>
      </div>
      
      <div className="comparison-values-compact">
        <div className="value-item">
          <span className="value-label">Latest</span>
          <span className="value-number" style={{ color }}>{latest?.toFixed(4)}</span>
        </div>
        <div className="value-item">
          <span className="value-label">Previous</span>
          <span className="value-number">{previous?.toFixed(4)}</span>
        </div>
      </div>

      <div className="bar-container-compact">
        <div className="bar-wrapper">
          <div className="bar-fill latest" style={{ width: `${latestPercent}%`, backgroundColor: color }} />
        </div>
        <div className="bar-wrapper">
          <div className="bar-fill previous" style={{ width: `${previousPercent}%` }} />
        </div>
      </div>
    </div>
  );
};

// Activity Card Component
const ActivityCard = ({ activity }) => (
  <div className={`activity-card ${activity.primary.toLowerCase()}`} style={{ borderLeftColor: activity.color }}>
    <div className="activity-header">
      <div className="activity-icon" style={{ color: activity.color }}>
        {activity.icon}
      </div>
      <div className="activity-type">
        <span className="activity-primary">{activity.primary}</span>
        <span className="activity-specific">{activity.specific}</span>
      </div>
    </div>
    <p className="activity-description">{activity.description}</p>
  </div>
);

function App() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);

  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [anomalyData, setAnomalyData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    natural: 0,
    manmade: 0,
    mixed: 0
  });

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: [28.6139, 77.209],
      zoom: 7,
      zoomControl: true,
      zoomControlPosition: 'bottomright'
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> &copy; CARTO',
        maxZoom: 19
      }
    ).addTo(mapInstance.current);

    markersLayer.current = L.layerGroup().addTo(mapInstance.current);
    loadAnomalies();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);
useEffect(() => {
  loadAnomalies();

  const interval = setInterval(() => {
    loadAnomalies();
  }, 600000); // every 10 min

  return () => clearInterval(interval);
}, []);
  // Filter effect
  useEffect(() => {
    if (!anomalyData.length) return;
    
    let filtered = [...anomalyData];
    
    if (selectedFilter !== 'all') {
      filtered = anomalyData.filter(item => {
        const activity = detectActivityType(item);
        return activity.primary === selectedFilter.toUpperCase();
      });
    }
    
    setFilteredData(filtered);
    updateMapMarkers(filtered);
    updateStats(filtered);
  }, [selectedFilter, anomalyData]);

  const loadAnomalies = async () => {
    setLoading(true);
    setSelected(null);

    try {
      const response = await axios.get("http://127.0.0.1:8000/analyze");
      const anomalies = response?.data?.data || [];
      setAnomalyData(anomalies);
      setFilteredData(anomalies);
      updateStats(anomalies);
      updateMapMarkers(anomalies);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data) => {
    let natural = 0, manmade = 0, mixed = 0;
    
    data.forEach(item => {
      const activity = detectActivityType(item);
      if (activity.primary === 'NATURAL') natural++;
      else if (activity.primary === 'MAN_MADE') manmade++;
      else mixed++;
    });

    setStats({
      total: data.length,
      natural,
      manmade,
      mixed
    });
  };

  const updateMapMarkers = (data) => {
    if (markersLayer.current) {
      markersLayer.current.clearLayers();
    }

    data.forEach((item) => {
      if (!item?.lat || !item?.lon) return;

      const activity = detectActivityType(item);
      const color = activity.color;
      
      // Calculate radius based on change intensity
      const intensity = Math.abs(item.delta_ndvi || 0) + Math.abs(item.delta_nightlight || 0);
      const radius = 12 + (intensity * 25);

      // Create outer circle
      const circle = L.circleMarker([item.lat, item.lon], {
        radius: radius,
        color: color,
        weight: 2,
        opacity: 0.8,
        fillColor: color,
        fillOpacity: 0.15,
        className: `anomaly-circle ${activity.primary.toLowerCase()}`
      }).addTo(markersLayer.current);

      // Create inner dot
      const innerDot = L.circleMarker([item.lat, item.lon], {
        radius: 5,
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 1,
        className: 'anomaly-dot'
      }).addTo(markersLayer.current);

      const handleClick = () => {
        setSelected(item);
        mapInstance.current.flyTo([item.lat, item.lon], 11, { duration: 1.2 });
      };

      circle.on("click", handleClick);
      innerDot.on("click", handleClick);

      circle.bindPopup(createPopupContent(item, activity));
    });
  };

  const createPopupContent = (item, activity) => {
    return `
      <div class="custom-popup">
        <div class="popup-header" style="border-left: 4px solid ${activity.color}">
          <h3>${activity.specific}</h3>
          <span class="popup-badge" style="background: ${activity.color}20; color: ${activity.color}">
            ${activity.primary}
          </span>
        </div>
        <div class="popup-content">
          <div class="popup-coord">📍 ${item.lat?.toFixed(4)}°, ${item.lon?.toFixed(4)}°</div>
          <div class="popup-metrics">
            <div class="metric-row">
              <span>🌿 NDVI:</span>
              <span class="${item.delta_ndvi > 0 ? 'pos' : 'neg'}">${item.delta_ndvi?.toFixed(4)}</span>
            </div>
            <div class="metric-row">
              <span>💡 Nightlight:</span>
              <span class="${item.delta_nightlight > 0 ? 'pos' : 'neg'}">${item.delta_nightlight?.toFixed(4)}</span>
            </div>
          </div>
          <div class="popup-footer">${item.comparison_days} day analysis</div>
        </div>
      </div>
    `;
  };

  const getActivityIcon = (activity) => {
    switch(activity.primary) {
      case 'NATURAL': return <FaLeaf className="icon natural" />;
      case 'MAN_MADE': return <GiFactory className="icon manmade" />;
      default: return <FiActivity className="icon mixed" />;
    }
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <FiMap className="logo-icon" />
            <div className="logo-text">
              <h1>Aravali Intelligence</h1>
              <span>Statistical Analysis v2.0</span>
            </div>
          </div>
        </div>

        <div className="sidebar-content">
          {/* Live Status */}
          <div className="live-status">
            <div className="live-indicator">
              <span className="pulse-dot"></span>
              <span>Live Monitoring</span>
            </div>
            <span className="update-time">Updated just now</span>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon"><FiMap /></div>
              <div className="stat-info">
                <span className="stat-label">Total</span>
                <span className="stat-value">{loading ? '...' : stats.total}</span>
              </div>
            </div>

            <div className="stat-card natural">
              <div className="stat-icon"><FaLeaf /></div>
              <div className="stat-info">
                <span className="stat-label">Natural</span>
                <span className="stat-value">{loading ? '...' : stats.natural}</span>
              </div>
            </div>

            <div className="stat-card manmade">
              <div className="stat-icon"><GiFactory /></div>
              <div className="stat-info">
                <span className="stat-label">Man Made</span>
                <span className="stat-value">{loading ? '...' : stats.manmade}</span>
              </div>
            </div>

            <div className="stat-card mixed">
              <div className="stat-icon"><FiActivity /></div>
              <div className="stat-info">
                <span className="stat-label">Mixed</span>
                <span className="stat-value">{loading ? '...' : stats.mixed}</span>
              </div>
            </div>
          </div>

          {/* Filters - FIXED */}
          <div className="filters-section">
            <button 
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiLayers />
              <span>Filter by Activity</span>
              {showFilters ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            {showFilters && (
              <div className="filter-options">
                <button 
                  className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('all')}
                >
                  All Activities
                </button>
                <button 
                  className={`filter-btn ${selectedFilter === 'natural' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('natural')}
                >
                  <FaLeaf /> Natural
                </button>
                <button 
                  className={`filter-btn ${selectedFilter === 'man_made' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('man_made')}
                >
                  <GiFactory /> Man Made
                </button>
                <button 
                  className={`filter-btn ${selectedFilter === 'mixed' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('mixed')}
                >
                  <FiActivity /> Mixed
                </button>
              </div>
            )}
          </div>

          {/* Recent Detections */}
          <div className="recent-alerts">
            <h3><FiAlertTriangle /> RECENT DETECTIONS</h3>
            <div className="alert-list">
              {filteredData.slice(0, 5).map((alert, idx) => {
                const activity = detectActivityType(alert);
                return (
                  <div key={idx} className="alert-item" onClick={() => setSelected(alert)}>
                    <div className="alert-icon" style={{ color: activity.color }}>
                      {activity.icon}
                    </div>
                    <div className="alert-content">
                      <span className="alert-title">{activity.specific}</span>
                      <span className="alert-coord">
                        {alert.lat?.toFixed(2)}°, {alert.lon?.toFixed(2)}°
                      </span>
                    </div>
                    <div className={`alert-change ${alert.delta_ndvi > 0 ? 'positive' : 'negative'}`}>
                      {alert.delta_ndvi > 0 ? '+' : ''}{alert.delta_ndvi?.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="footer-btn" onClick={loadAnomalies}>
            <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="location-breadcrumb">
            <span>Aravali Range</span>
            <FiChevronRight />
            <span>Activity Analysis</span>
          </div>

          <div className="active-filter">
            {selectedFilter !== 'all' && (
              <span className="filter-chip">
                Showing: {selectedFilter.replace('_', ' ')}
                <button onClick={() => setSelectedFilter('all')}>×</button>
              </span>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="map-fixed-container">
          <div ref={mapRef} className="map-fixed" />
          
          {/* Map Legend */}
          <div className="map-legend">
            <h4>Activity Types</h4>
            <div className="legend-item">
              <span className="legend-dot natural"></span>
              <span>Natural</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot manmade"></span>
              <span>Man Made</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot mixed"></span>
              <span>Mixed</span>
            </div>
          </div>
        </div>

        {/* Details Panel */}
        {selected && (
          <div className="details-panel">
            <div className="details-header">
              <h3>
                <FiBarChart2 />
                Activity Analysis
              </h3>
              <button className="close-btn" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="details-content">
              {(() => {
                const activity = detectActivityType(selected);
                return (
                  <>
                    {/* Activity Type Card */}
                    <ActivityCard activity={activity} />

                    {/* Location */}
                    <div className="info-card">
                      <h4><FaMapMarkedAlt /> Location</h4>
                      <div className="location-details">
                        <div className="coord-row">
                          <span>Latitude:</span>
                          <span className="coord-value">{selected.lat?.toFixed(6)}°</span>
                        </div>
                        <div className="coord-row">
                          <span>Longitude:</span>
                          <span className="coord-value">{selected.lon?.toFixed(6)}°</span>
                        </div>
                      </div>
                    </div>

                    {/* Analysis Periods */}
                    <div className="info-card">
                      <h4><FiCalendar /> Analysis Periods</h4>
                      <div className="period-details">
                        <div className="period-row">
                          <span>Latest:</span>
                          <span>{selected.latest_start} → {selected.latest_end}</span>
                        </div>
                        <div className="period-row">
                          <span>Previous:</span>
                          <span>{selected.previous_start} → {selected.previous_end}</span>
                        </div>
                        <div className="duration-badge">
                          {selected.comparison_days} Days Comparison
                        </div>
                      </div>
                    </div>

                    {/* NDVI Comparison */}
                    <ComparisonBar
                      label="NDVI (Vegetation Index)"
                      latest={selected.ndvi_latest}
                      previous={selected.ndvi_previous}
                      color={activity.color}
                      type="ndvi"
                    />

                    {/* Nightlight Comparison */}
                    <ComparisonBar
                      label="Nightlight Intensity"
                      latest={selected.nightlight_latest}
                      previous={selected.nightlight_previous}
                      color="#f59e0b"
                      type="nightlight"
                    />

                    {/* Change Timeline */}
                    <div className="info-card">
                      <h4><FaChartLine /> Change Timeline</h4>
                      <div className="timeline-compact">
                        <div className="timeline-point">
                          <span className="point-label">Previous</span>
                          <span className="point-value">NDVI: {selected.ndvi_previous?.toFixed(3)}</span>
                        </div>
                        <div className="timeline-arrow">→</div>
                        <div className="timeline-point highlight">
                          <span className="point-label">Latest</span>
                          <span className="point-value">NDVI: {selected.ndvi_latest?.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Raw Values */}
                    <div className="info-card raw">
                      <h4>Raw Values</h4>
                      <div className="raw-grid-compact">
                        <div className="raw-item">
                          <span>NDVI Latest:</span>
                          <span>{selected.ndvi_latest?.toFixed(4)}</span>
                        </div>
                        <div className="raw-item">
                          <span>NDVI Previous:</span>
                          <span>{selected.ndvi_previous?.toFixed(4)}</span>
                        </div>
                        <div className="raw-item">
                          <span>Night Latest:</span>
                          <span>{selected.nightlight_latest?.toFixed(4)}</span>
                        </div>
                        <div className="raw-item">
                          <span>Night Previous:</span>
                          <span>{selected.nightlight_previous?.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Analyzing activity patterns...</p>
        </div>
      )}
    </div>
  );
}

export default App;
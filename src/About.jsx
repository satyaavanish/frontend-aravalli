// About.jsx - Clean and simple version
import React from 'react';

const About = () => {
  return (
    <div className="about-page">
      {/* Header */}
      <div className="about-header">
        <h1>Aravalli Intelligence Platform</h1>
        <p>Environmental Change Detection & Analysis</p>
      </div>

      {/* Content */}
      <div className="about-content">
        
        {/* Problem */}
        <div className="about-card">
          <h2>🎯 Problem</h2>
          <p>
            The Aravalli Range faces illegal mining, urban expansion, and vegetation loss. 
            Traditional monitoring is too slow.
          </p>
        </div>

        {/* Solution */}
        <div className="about-card">
          <h2>⚡ Solution</h2>
          <p>
            Real-time satellite analysis + ML to detect environmental changes instantly.
          </p>
        </div>

        {/* How it works */}
        <div className="about-card">
          <h2>🔍 How it Works</h2>
          <ul className="simple-list">
            <li>🌿 NDVI → Vegetation health</li>
            <li>💡 Nightlights → Urban activity</li>
            <li>🗺️ Land cover → Land use changes</li>
            <li>📈 Time series → Change detection</li>
          </ul>
        </div>

        {/* Data Sources */}
        <div className="about-card">
          <h2>📊 Data Sources</h2>
          <ul className="simple-list">
            <li>🛰️ Sentinel-2 (10m imagery)</li>
            <li>🌙 VIIRS (Nightlights)</li>
            <li>🗺️ ESA WorldCover (Land cover)</li>
            <li>⛰️ Copernicus DEM (Elevation)</li>
          </ul>
        </div>

        {/* Impact */}
        <div className="about-card">
          <h2>✨ Impact</h2>
          <ul className="simple-list">
            <li>🚫 Detect illegal mining early</li>
            <li>🏙️ Monitor urban expansion</li>
            <li>🌱 Track vegetation loss/growth</li>
            <li>📋 Data for policy decisions</li>
          </ul>
        </div>

        {/* Team */}
        <div className="about-card team-card">
          <h2>👥 Team</h2>
          <p>Built for the Aravalli Conservation Initiative</p>
        </div>

      </div>
    </div>
  );
};

export default About;
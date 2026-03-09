// DataSources.jsx - Clean and professional version
import React from 'react';

const DataSources = () => {
  const dataSources = [
    {
      icon: '🛰️',
      name: 'Sentinel-2',
      agency: 'European Space Agency',
      description: 'Provides 10m resolution optical imagery for NDVI calculations and vegetation analysis.',
      metrics: [
        { label: 'Resolution', value: '10m' },
        { label: 'Frequency', value: '5 days' }
      ],
      color: '#3b82f6'
    },
    {
      icon: '🌙',
      name: 'VIIRS',
      agency: 'NASA/NOAA',
      description: 'Nighttime lights data for detecting human activity and urban development patterns.',
      metrics: [
        { label: 'Resolution', value: '750m' },
        { label: 'Frequency', value: 'Daily' }
      ],
      color: '#f59e0b'
    },
    {
      icon: '🗺️',
      name: 'ESA WorldCover',
      agency: 'European Space Agency',
      description: 'Land cover classification at 10m resolution for detecting land use changes.',
      metrics: [
        { label: 'Resolution', value: '10m' },
        { label: 'Frequency', value: 'Yearly' }
      ],
      color: '#10b981'
    },
    {
      icon: '⛰️',
      name: 'Copernicus DEM',
      agency: 'European Space Agency',
      description: 'Digital Elevation Model for topographic analysis and terrain context.',
      metrics: [
        { label: 'Resolution', value: '30m' },
        { label: 'Coverage', value: 'Global' }
      ],
      color: '#a855f7'
    }
  ];

  return (
    <div className="data-sources-page">
      {/* Header */}
      <div className="data-sources-header">
        <h2>Data Sources</h2>
        <p className="data-sources-subtitle">
          Satellite and Earth observation datasets used for analysis
        </p>
      </div>

      {/* Sources Grid */}
      <div className="sources-grid">
        {dataSources.map((source, index) => (
          <div key={index} className="source-card" style={{ borderTopColor: source.color }}>
            <div className="source-icon" style={{ background: `${source.color}15`, color: source.color }}>
              {source.icon}
            </div>
            <div className="source-content">
              <h3>{source.name}</h3>
              <p className="source-agency">{source.agency}</p>
              <p className="source-description">{source.description}</p>
              <div className="source-metrics">
                {source.metrics.map((metric, i) => (
                  <div key={i} className="metric">
                    <span className="metric-label">{metric.label}</span>
                    <span className="metric-value">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Update Schedule */}
      <div className="update-section">
        <h3>Update Schedule</h3>
        <div className="schedule-grid">
          <div className="schedule-item">
            <div className="schedule-icon">📅</div>
            <div className="schedule-content">
              <h4>Sentinel-2 NDVI</h4>
              <div className="schedule-dates">
                <span>Last: 2026-03-09</span>
                <span>Next: 2026-03-14</span>
              </div>
            </div>
          </div>
          
          <div className="schedule-item">
            <div className="schedule-icon">🌙</div>
            <div className="schedule-content">
              <h4>VIIRS Nightlights</h4>
              <div className="schedule-dates">
                <span>Last: 2026-03-08</span>
                <span>Next: 2026-03-09</span>
              </div>
            </div>
          </div>
          
          <div className="schedule-item">
            <div className="schedule-icon">🗺️</div>
            <div className="schedule-content">
              <h4>ESA WorldCover</h4>
              <div className="schedule-dates">
                <span>Last: 2025-12-31</span>
                <span>Next: 2026-12-31</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Usage Note */}
      <div className="data-note">
        <span className="note-icon">ℹ️</span>
        <p>
          All datasets are processed in real-time using Google Earth Engine. 
          Updates occur automatically when new satellite data becomes available.
        </p>
      </div>
    </div>
  );
};

export default DataSources;
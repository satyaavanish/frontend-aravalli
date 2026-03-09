// AnalyzeLocation.jsx - Fixed with better error handling
import React, { useState } from 'react';
import axios from 'axios';

const AnalyzeLocation = () => {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Helper functions
  const fmt = (v, d = 4) => v == null || isNaN(v) ? '—' : Number(v).toFixed(d);
  const pct = (v) => v == null || isNaN(v) ? '—' : `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(1)}%`;

  const classifyActivity = (item) => {
    if (!item || !item.indicators) return "Environmental Change";
    
    const dNdvi = item.indicators?.delta_ndvi ?? 0;
    const ndviMean = item.indicators?.ndvi_mean ?? 0;
    const nlGrow = item.indicators?.nightlight_growth_pct ?? 0;
    const lulc = item.indicators?.lulc_change;

    if (lulc && lulc.includes('Built-up')) return "Urban Conversion";
    if (lulc && lulc.includes('Bare')) return "Mining / Quarrying";
    if (nlGrow > 30) return "Human Activity Increase";
    if (dNdvi < -0.07) return "Vegetation Loss";
    if (ndviMean < 0.25) return "Land Degradation";
    if (Math.abs(dNdvi) > 0.03) return "Vegetation Change";
    
    return item.type || "Environmental Change";
  };

  const analyzeLocation = async () => {
    if (!lat || !lon) {
      setError('Please enter both latitude and longitude');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Sending request with:', { lat: parseFloat(lat), lon: parseFloat(lon) });
      
      const response = await axios.post('https://aravalli-intelligence.onrender.com/analyze-point', {
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log("Analysis result:", response.data);
      setResult(response.data);
    } catch (err) {
      console.error("Analysis error:", err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again.');
      } else if (err.response) {
        // The request was made and the server responded with a status code
        setError(`Server error: ${err.response.data?.detail || err.response.statusText}`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please check if backend is running.');
      } else {
        // Something happened in setting up the request
        setError(err.message || 'Failed to analyze location');
      }
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill with sample coordinates from your data
  const fillSample = () => {
    setLat('29.428908');
    setLon('74.531250');
  };

  // Pre-fill with another sample
  const fillSample2 = () => {
    setLat('28.57858');
    setLon('77.1875');
  };

  return (
    <div className="analyze-page">
      <div className="analyze-header">
        <h2>Location Analysis</h2>
        <p>Enter coordinates to analyze environmental changes</p>
      </div>

      <div className="analyze-container">
        <div className="input-section">
          <div className="coordinate-inputs">
            <div className="input-group">
              <label>Latitude (°N)</label>
              <input
                type="number"
                step="0.000001"
                placeholder="e.g., 28.57858"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Longitude (°E)</label>
              <input
                type="number"
                step="0.000001"
                placeholder="e.g., 77.1875"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
              />
            </div>
          </div>
          
          <div className="button-group">
            <button 
              className="analyze-btn" 
              onClick={analyzeLocation}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : '🔍 Analyze Location'}
            </button>
            
            <button 
              className="sample-btn" 
              onClick={fillSample}
              type="button"
            >
              Sample 1
            </button>
            
            <button 
              className="sample-btn" 
              onClick={fillSample2}
              type="button"
            >
              Sample 2
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        {result && (
          <div className="results-section">
            <h3>Analysis Results</h3>
            
            <div className="result-card">
              <div className="result-header" style={{ 
                borderLeftColor: result.confidence >= 0.7 ? '#ef4444' : 
                                result.confidence >= 0.4 ? '#fbbf24' : '#64748b'
              }}>
                <div className="result-title">
                  <span className="result-type">{result.type || classifyActivity(result)}</span>
                  {result.confidence > 0 && (
                    <span className={`confidence-badge conf-${
                      result.confidence >= 0.7 ? 'high' : 
                      result.confidence >= 0.4 ? 'medium' : 'low'
                    }`}>
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <span className={`priority-badge pri-${result.priority?.toLowerCase() || 'low'}`}>
                  {result.priority || 'LOW'}
                </span>
              </div>

              <div className="result-coords">
                📍 {fmt(result.lat, 6)}°N · {fmt(result.lon, 6)}°E
              </div>

              {result.indicators && Object.keys(result.indicators).length > 0 && (
                <div className="result-metrics">
                  {(result.indicators.ndvi_mean !== null || result.indicators.delta_ndvi !== null) && (
                    <div className="metric-group">
                      <h4>🌿 Vegetation (NDVI)</h4>
                      {result.indicators.ndvi_mean !== null && (
                        <div className="metric-item">
                          <span>Mean NDVI</span>
                          <strong>{fmt(result.indicators.ndvi_mean, 4)}</strong>
                        </div>
                      )}
                      {result.indicators.delta_ndvi !== null && (
                        <div className="metric-item">
                          <span>Change</span>
                          <strong className={result.indicators.delta_ndvi < 0 ? 'negative' : 'positive'}>
                            {fmt(result.indicators.delta_ndvi, 4)}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}

                  {(result.indicators.nightlight_mean !== null || result.indicators.nightlight_growth_pct !== null) && (
                    <div className="metric-group">
                      <h4>💡 Nightlight</h4>
                      {result.indicators.nightlight_mean !== null && (
                        <div className="metric-item">
                          <span>Mean Radiance</span>
                          <strong>{fmt(result.indicators.nightlight_mean, 2)} nW</strong>
                        </div>
                      )}
                      {result.indicators.nightlight_growth_pct !== null && (
                        <div className="metric-item">
                          <span>Growth</span>
                          <strong className={result.indicators.nightlight_growth_pct > 0 ? 'positive' : 'negative'}>
                            {pct(result.indicators.nightlight_growth_pct)}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {result.explanation && result.explanation.length > 0 && (
                <div className="explanation-section">
                  <h4>📋 Analysis</h4>
                  <ul>
                    {result.explanation.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.spatial_cluster && (
                <div className="cluster-badge">⬡ Part of Spatial Cluster</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyzeLocation;
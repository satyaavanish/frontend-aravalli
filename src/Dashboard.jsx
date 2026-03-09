// Dashboard.js - Complete with all splitting options
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Helper function to classify anomalies into detailed categories
const classifyActivity = (item) => {
  if (!item || !item.indicators) return "Environmental Change";
  
  const dNdvi = item.indicators.delta_ndvi ?? 0;
  const ndviMean = item.indicators.ndvi_mean ?? 0;
  const nlGrow = item.indicators.nightlight_growth_pct ?? 0;
  const lulc = item.indicators.lulc_change;

  // Man-made signals
  if (lulc && lulc.includes('Built-up'))
    return "Urban Conversion";
  
  if (lulc && lulc.includes('Bare'))
    return "Mining / Quarrying";
  
  if (nlGrow > 30)
    return "Human Activity Increase";
  
  // Natural signals
  if (dNdvi < -0.07)
    return "Vegetation Loss";
  
  if (ndviMean < 0.25)
    return "Land Degradation";
  
  if (Math.abs(dNdvi) > 0.03)
    return "Vegetation Change";
  
  // Mixed / uncertain
  return item.type || "Environmental Change";
};

// Get group classification (MAN_MADE, NATURAL, MIXED)
const getGroup = (item) => {
  if (!item || !item.indicators) return "MIXED";
  
  const dNdvi = item.indicators.delta_ndvi ?? 0;
  const nlGrow = item.indicators.nightlight_growth_pct ?? 0;
  const ndviMean = item.indicators.ndvi_mean ?? 0;
  const lulc = item.indicators.lulc_change;

  if (lulc && (lulc.includes('Built-up') || lulc.includes('Bare'))) return "MAN_MADE";
  if (nlGrow > 30) return "MAN_MADE";
  if (dNdvi < -0.07) return "NATURAL";
  if (ndviMean < 0.25) return "NATURAL";
  if (Math.abs(dNdvi) > 0.03) return "NATURAL";
  
  return "MIXED";
};

const Dashboard = ({ data, loading }) => {
  // Ensure data is an array
  const anomalies = Array.isArray(data) ? data : [];
  
  console.log("Total anomalies:", anomalies.length);

  // Calculate all possible stats
  const stats = {
    // Basic counts
    total: anomalies.length,
    
    // Priority distribution
    highPri: anomalies.filter(d => d?.priority === 'HIGH').length,
    mediumPri: anomalies.filter(d => d?.priority === 'MEDIUM').length,
    lowPri: anomalies.filter(d => d?.priority === 'LOW').length,
    
    // Group distribution (MAN_MADE, NATURAL, MIXED)
    manMade: anomalies.filter(d => getGroup(d) === "MAN_MADE").length,
    natural: anomalies.filter(d => getGroup(d) === "NATURAL").length,
    mixed: anomalies.filter(d => getGroup(d) === "MIXED").length,
    
    // Detailed activity types
    urbanConversion: anomalies.filter(d => classifyActivity(d) === "Urban Conversion").length,
    miningQuarrying: anomalies.filter(d => classifyActivity(d) === "Mining / Quarrying").length,
    humanActivity: anomalies.filter(d => classifyActivity(d) === "Human Activity Increase").length,
    vegetationLoss: anomalies.filter(d => classifyActivity(d) === "Vegetation Loss").length,
    landDegradation: anomalies.filter(d => classifyActivity(d) === "Land Degradation").length,
    vegetationChange: anomalies.filter(d => classifyActivity(d) === "Vegetation Change").length,
    environmental: anomalies.filter(d => classifyActivity(d) === "Environmental Change").length,
    
    // Specific indicators
    highConfidence: anomalies.filter(d => (d?.confidence || 0) >= 0.7).length,
    mediumConfidence: anomalies.filter(d => (d?.confidence || 0) >= 0.4 && (d?.confidence || 0) < 0.7).length,
    lowConfidence: anomalies.filter(d => (d?.confidence || 0) < 0.4).length,
    
    spatialClusters: anomalies.filter(d => d?.spatial_cluster === true).length,
    
    // Indicator-based
    ndviDecrease: anomalies.filter(d => (d?.indicators?.delta_ndvi || 0) < 0).length,
    ndviIncrease: anomalies.filter(d => (d?.indicators?.delta_ndvi || 0) > 0).length,
    nightlightIncrease: anomalies.filter(d => (d?.indicators?.nightlight_growth_pct || 0) > 0).length,
    nightlightDecrease: anomalies.filter(d => (d?.indicators?.nightlight_growth_pct || 0) < 0).length,
    
    // Land cover changes
    lulcChanges: anomalies.filter(d => d?.indicators?.lulc_change).length,
  };

  console.log("All stats:", stats);

  // Trend data
  const trendData = [
    { month: 'Jan', anomalies: Math.round(anomalies.length * 0.3) || 0 },
    { month: 'Feb', anomalies: Math.round(anomalies.length * 0.65) || 0 },
    { month: 'Mar', anomalies: anomalies.length },
  ];

  // Priority pie data
  const priorityPieData = [
    { name: 'High Priority', value: stats.highPri, color: '#ef4444' },
    { name: 'Medium Priority', value: stats.mediumPri, color: '#fbbf24' },
    { name: 'Low Priority', value: stats.lowPri, color: '#64748b' },
  ];

  // Group pie data
  const groupPieData = [
    { name: 'Man-Made', value: stats.manMade, color: '#f97316' },
    { name: 'Natural', value: stats.natural, color: '#10b981' },
    { name: 'Mixed', value: stats.mixed, color: '#a855f7' },
  ];

  const recentAnomalies = anomalies.slice(0, 5);

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard">
      {/* Stats Summary Row */}
      <div className="stats-summary-row">
        <div className="summary-card">
          <h4>Total Detections</h4>
          <div className="summary-value">{stats.total}</div>
        </div>
        <div className="summary-card">
          <h4>High Priority</h4>
          <div className="summary-value" style={{ color: '#ef4444' }}>{stats.highPri}</div>
        </div>
        <div className="summary-card">
          <h4>Medium Priority</h4>
          <div className="summary-value" style={{ color: '#fbbf24' }}>{stats.mediumPri}</div>
        </div>
        <div className="summary-card">
          <h4>Low Priority</h4>
          <div className="summary-value" style={{ color: '#64748b' }}>{stats.lowPri}</div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">🔍</div>
          <div className="stat-content">
            <span className="stat-label">Total Anomalies</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f97316' }}>
          <div className="stat-icon">🏭</div>
          <div className="stat-content">
            <span className="stat-label">Man-Made</span>
            <span className="stat-value">{stats.manMade}</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="stat-icon">🌿</div>
          <div className="stat-content">
            <span className="stat-label">Natural</span>
            <span className="stat-value">{stats.natural}</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#a855f7' }}>
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <span className="stat-label">Mixed</span>
            <span className="stat-value">{stats.mixed}</span>
          </div>
        </div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="detailed-stats">
        <h3>Detailed Breakdown</h3>
        <div className="detailed-grid">
          <div className="detail-item">
            <span className="detail-label">Urban Conversion</span>
            <span className="detail-value" style={{ color: '#f97316' }}>{stats.urbanConversion}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Mining / Quarrying</span>
            <span className="detail-value" style={{ color: '#ef4444' }}>{stats.miningQuarrying}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Human Activity</span>
            <span className="detail-value" style={{ color: '#a855f7' }}>{stats.humanActivity}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Vegetation Loss</span>
            <span className="detail-value" style={{ color: '#10b981' }}>{stats.vegetationLoss}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Land Degradation</span>
            <span className="detail-value" style={{ color: '#84cc16' }}>{stats.landDegradation}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Vegetation Change</span>
            <span className="detail-value" style={{ color: '#22c55e' }}>{stats.vegetationChange}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Environmental (Mixed)</span>
            <span className="detail-value" style={{ color: '#64748b' }}>{stats.environmental}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Spatial Clusters</span>
            <span className="detail-value" style={{ color: '#a855f7' }}>{stats.spatialClusters}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Land Cover Changes</span>
            <span className="detail-value" style={{ color: '#f59e0b' }}>{stats.lulcChanges}</span>
          </div>
        </div>
      </div>

      {/* Confidence Stats */}
      <div className="confidence-stats">
        <h3>Confidence Distribution</h3>
        <div className="confidence-bars">
          <div className="confidence-item">
            <span className="conf-label">High (≥70%)</span>
            <div className="conf-bar-container">
              <div 
                className="conf-bar conf-high" 
                style={{ width: `${(stats.highConfidence / stats.total) * 100}%` }}
              />
            </div>
            <span className="conf-value">{stats.highConfidence}</span>
          </div>
          <div className="confidence-item">
            <span className="conf-label">Medium (40-69%)</span>
            <div className="conf-bar-container">
              <div 
                className="conf-bar conf-medium" 
                style={{ width: `${(stats.mediumConfidence / stats.total) * 100}%` }}
              />
            </div>
            <span className="conf-value">{stats.mediumConfidence}</span>
          </div>
          <div className="confidence-item">
            <span className="conf-label">Low (&lt;40%)</span>
            <div className="conf-bar-container">
              <div 
                className="conf-bar conf-low" 
                style={{ width: `${(stats.lowConfidence / stats.total) * 100}%` }}
              />
            </div>
            <span className="conf-value">{stats.lowConfidence}</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Anomaly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="anomalies" 
                stroke="#3b82f6" 
                name="Anomalies"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => 
                  percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''
                }
              >
                {priorityPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Type Distribution (Man-Made vs Natural)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={groupPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => 
                  percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''
                }
              >
                {groupPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>NDVI Direction</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'NDVI Increase', value: stats.ndviIncrease, color: '#10b981' },
                  { name: 'NDVI Decrease', value: stats.ndviDecrease, color: '#ef4444' },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => 
                  percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''
                }
              >
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Anomalies Table */}
      <div className="recent-anomalies">
        <h3>Recent Anomalies</h3>
        <table className="anomaly-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Type</th>
              <th>Group</th>
              <th>Confidence</th>
              <th>Priority</th>
              <th>NDVI Change</th>
              <th>Nightlight</th>
            </tr>
          </thead>
          <tbody>
            {recentAnomalies.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">No anomalies found</td>
              </tr>
            ) : (
              recentAnomalies.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.lat?.toFixed(4)}°N, {item.lon?.toFixed(4)}°E</td>
                  <td>{classifyActivity(item)}</td>
                  <td>
                    <span style={{ 
                      color: getGroup(item) === 'MAN_MADE' ? '#f97316' : 
                             getGroup(item) === 'NATURAL' ? '#10b981' : '#a855f7'
                    }}>
                      {getGroup(item)}
                    </span>
                  </td>
                  <td>
                    <span className={`conf-badge conf-${
                      item.confidence >= 0.7 ? 'high' : 
                      item.confidence >= 0.4 ? 'medium' : 'low'
                    }`}>
                      {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge pri-${item.priority?.toLowerCase() || 'low'}`}>
                      {item.priority || 'LOW'}
                    </span>
                  </td>
                  <td className={item.indicators?.delta_ndvi < 0 ? 'negative' : 'positive'}>
                    {item.indicators?.delta_ndvi?.toFixed(3) || '—'}
                  </td>
                  <td className={item.indicators?.nightlight_growth_pct > 0 ? 'positive' : 'negative'}>
                    {item.indicators?.nightlight_growth_pct?.toFixed(1)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
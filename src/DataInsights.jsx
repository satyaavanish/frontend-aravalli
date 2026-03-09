// DataInsights.jsx - Enhanced version with comprehensive analytics
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';

const DataInsights = ({ data, loading }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Helper functions
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

  // Compute comprehensive statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Group by actual activity type (using classifier)
    const typeGroups = {};
    data.forEach(item => {
      const type = classifyActivity(item);
      typeGroups[type] = (typeGroups[type] || 0) + 1;
    });

    // Priority distribution
    const priorityDist = {
      HIGH: data.filter(d => d.priority === 'HIGH').length,
      MEDIUM: data.filter(d => d.priority === 'MEDIUM').length,
      LOW: data.filter(d => d.priority === 'LOW').length
    };

    // Confidence distribution
    const confidenceRanges = {
      '90-100%': data.filter(d => d.confidence >= 0.9).length,
      '80-89%': data.filter(d => d.confidence >= 0.8 && d.confidence < 0.9).length,
      '70-79%': data.filter(d => d.confidence >= 0.7 && d.confidence < 0.8).length,
      '60-69%': data.filter(d => d.confidence >= 0.6 && d.confidence < 0.7).length,
      '50-59%': data.filter(d => d.confidence >= 0.5 && d.confidence < 0.6).length,
      '40-49%': data.filter(d => d.confidence >= 0.4 && d.confidence < 0.5).length,
      '30-39%': data.filter(d => d.confidence >= 0.3 && d.confidence < 0.4).length,
      '20-29%': data.filter(d => d.confidence >= 0.2 && d.confidence < 0.3).length,
      '10-19%': data.filter(d => d.confidence >= 0.1 && d.confidence < 0.2).length,
      '0-9%': data.filter(d => d.confidence < 0.1).length,
    };

    // NDVI statistics
    const ndviChanges = data.map(d => d.indicators?.delta_ndvi || 0).filter(v => v !== null);
    const ndviMeans = data.map(d => d.indicators?.ndvi_mean || 0).filter(v => v !== null);
    
    const ndviStats = {
      avgChange: ndviChanges.reduce((a, b) => a + b, 0) / ndviChanges.length,
      maxIncrease: Math.max(...ndviChanges),
      maxDecrease: Math.min(...ndviChanges),
      avgMean: ndviMeans.reduce((a, b) => a + b, 0) / ndviMeans.length,
      decreasing: ndviChanges.filter(v => v < 0).length,
      increasing: ndviChanges.filter(v => v > 0).length,
    };

    // Nightlight statistics
    const nightlightGrowth = data.map(d => d.indicators?.nightlight_growth_pct || 0).filter(v => v !== null);
    const nightlightMeans = data.map(d => d.indicators?.nightlight_mean || 0).filter(v => v !== null);
    
    const nightlightStats = {
      avgGrowth: nightlightGrowth.reduce((a, b) => a + b, 0) / nightlightGrowth.length,
      maxGrowth: Math.max(...nightlightGrowth),
      minGrowth: Math.min(...nightlightGrowth),
      avgMean: nightlightMeans.reduce((a, b) => a + b, 0) / nightlightMeans.length,
      growing: nightlightGrowth.filter(v => v > 0).length,
      declining: nightlightGrowth.filter(v => v < 0).length,
    };

    // Spatial clustering
    const clusteredCount = data.filter(d => d.spatial_cluster).length;

    // Land cover changes
    const lulcChanges = data.filter(d => d.indicators?.lulc_change).length;

    // Change point detection
    const changePoints = data.filter(d => d.indicators?.change_point).length;

    // Prepare chart data
    const typeChartData = Object.entries(typeGroups).map(([name, value]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      fullName: name,
      value
    })).sort((a, b) => b.value - a.value);

    const priorityChartData = [
      { name: 'HIGH', value: priorityDist.HIGH, color: '#ef4444' },
      { name: 'MEDIUM', value: priorityDist.MEDIUM, color: '#fbbf24' },
      { name: 'LOW', value: priorityDist.LOW, color: '#64748b' },
    ];

    const confidenceChartData = Object.entries(confidenceRanges)
      .map(([range, count]) => ({ range, count }))
      .filter(item => item.count > 0);

    // NDVI vs Nightlight scatter data
    const scatterData = data
      .filter(d => d.indicators?.delta_ndvi !== null && d.indicators?.nightlight_growth_pct !== null)
      .map(d => ({
        x: d.indicators.delta_ndvi,
        y: d.indicators.nightlight_growth_pct,
        confidence: d.confidence,
        priority: d.priority,
        name: `${d.lat.toFixed(2)}°N, ${d.lon.toFixed(2)}°E`
      }));

    return {
      total: data.length,
      typeGroups,
      typeChartData,
      priorityDist,
      priorityChartData,
      confidenceRanges,
      confidenceChartData,
      ndviStats,
      nightlightStats,
      clusteredCount,
      lulcChanges,
      changePoints,
      scatterData,
      avgConfidence: (data.reduce((s, d) => s + d.confidence, 0) / data.length * 100).toFixed(1)
    };
  }, [data]);

  if (loading) {
    return (
      <div className="insights-loading">
        <div className="loader-ring"></div>
        <p>Generating insights...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="insights-empty">
        <span className="empty-icon">📊</span>
        <h3>No Data Available</h3>
        <p>Run an analysis to generate insights</p>
      </div>
    );
  }

  const COLORS = {
    high: '#ef4444',
    medium: '#fbbf24',
    low: '#64748b',
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    purple: '#a855f7'
  };

  return (
    <div className="insights-page">
      <div className="insights-header">
        <h2>Data Insights</h2>
        <div className="insights-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'vegetation' ? 'active' : ''}`}
            onClick={() => setActiveTab('vegetation')}
          >
            Vegetation
          </button>
          <button 
            className={`tab-btn ${activeTab === 'nightlight' ? 'active' : ''}`}
            onClick={() => setActiveTab('nightlight')}
          >
            Nightlight
          </button>
          <button 
            className={`tab-btn ${activeTab === 'correlations' ? 'active' : ''}`}
            onClick={() => setActiveTab('correlations')}
          >
            Correlations
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">🔍</div>
          <div className="metric-content">
            <span className="metric-label">Total Anomalies</span>
            <span className="metric-value">{stats.total}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <span className="metric-label">Avg Confidence</span>
            <span className="metric-value">{stats.avgConfidence}%</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🔴</div>
          <div className="metric-content">
            <span className="metric-label">High Priority</span>
            <span className="metric-value">{stats.priorityDist.HIGH}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🟡</div>
          <div className="metric-content">
            <span className="metric-label">Medium Priority</span>
            <span className="metric-value">{stats.priorityDist.MEDIUM}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⚪</div>
          <div className="metric-content">
            <span className="metric-label">Low Priority</span>
            <span className="metric-value">{stats.priorityDist.LOW}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🌿</div>
          <div className="metric-content">
            <span className="metric-label">Vegetation Loss</span>
            <span className="metric-value">{stats.typeGroups['Vegetation Loss'] || 0}</span>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Type Distribution */}
          <div className="insights-row">
            <div className="insight-card large">
              <h3>Anomaly Types Distribution</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.typeChartData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip 
                    formatter={(value, name, props) => [value, 'Count']}
                    labelFormatter={(label) => `Type: ${label}`}
                  />
                  <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="insight-card">
              <h3>Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.priorityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Confidence Distribution */}
          <div className="insight-card full-width">
            <h3>Confidence Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.confidenceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {activeTab === 'vegetation' && (
        <>
          <div className="insights-row">
            <div className="insight-card">
              <h3>NDVI Change Statistics</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span>Average Change</span>
                  <strong className={stats.ndviStats.avgChange < 0 ? 'negative' : 'positive'}>
                    {stats.ndviStats.avgChange.toFixed(4)}
                  </strong>
                </div>
                <div className="stat-item">
                  <span>Max Increase</span>
                  <strong className="positive">+{stats.ndviStats.maxIncrease.toFixed(4)}</strong>
                </div>
                <div className="stat-item">
                  <span>Max Decrease</span>
                  <strong className="negative">{stats.ndviStats.maxDecrease.toFixed(4)}</strong>
                </div>
                <div className="stat-item">
                  <span>Average NDVI</span>
                  <strong>{stats.ndviStats.avgMean.toFixed(4)}</strong>
                </div>
                <div className="stat-item">
                  <span>Trend Direction</span>
                  <strong>
                    <span className="positive">↑ {stats.ndviStats.increasing} increasing</span>
                    <br />
                    <span className="negative">↓ {stats.ndviStats.decreasing} decreasing</span>
                  </strong>
                </div>
              </div>
            </div>

            <div className="insight-card">
              <h3>NDVI Change Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Increasing', value: stats.ndviStats.increasing, fill: '#10b981' },
                  { name: 'Decreasing', value: stats.ndviStats.decreasing, fill: '#ef4444' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="insight-card full-width">
            <h3>Vegetation Health Indicators</h3>
            <div className="indicators-grid">
              <div className="indicator-item">
                <span className="indicator-label">Change Point Detected</span>
                <span className="indicator-value">{stats.changePoints}</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">Land Cover Changes</span>
                <span className="indicator-value">{stats.lulcChanges}</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">Spatial Clusters</span>
                <span className="indicator-value">{stats.clusteredCount}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'nightlight' && (
        <>
          <div className="insights-row">
            <div className="insight-card">
              <h3>Nightlight Growth Statistics</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span>Average Growth</span>
                  <strong className={stats.nightlightStats.avgGrowth > 0 ? 'positive' : 'negative'}>
                    {stats.nightlightStats.avgGrowth.toFixed(2)}%
                  </strong>
                </div>
                <div className="stat-item">
                  <span>Maximum Growth</span>
                  <strong className="positive">+{stats.nightlightStats.maxGrowth.toFixed(2)}%</strong>
                </div>
                <div className="stat-item">
                  <span>Minimum Growth</span>
                  <strong className="negative">{stats.nightlightStats.minGrowth.toFixed(2)}%</strong>
                </div>
                <div className="stat-item">
                  <span>Average Radiance</span>
                  <strong>{stats.nightlightStats.avgMean.toFixed(2)} nW</strong>
                </div>
                <div className="stat-item">
                  <span>Activity Pattern</span>
                  <strong>
                    <span className="positive">↑ {stats.nightlightStats.growing} growing</span>
                    <br />
                    <span className="negative">↓ {stats.nightlightStats.declining} declining</span>
                  </strong>
                </div>
              </div>
            </div>

            <div className="insight-card">
              <h3>Nightlight Activity Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Growing', value: stats.nightlightStats.growing, color: '#10b981' },
                      { name: 'Declining', value: stats.nightlightStats.declining, color: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'correlations' && (
        <div className="insight-card full-width">
          <h3>NDVI Change vs Nightlight Growth Correlation</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="NDVI Change" 
                unit="" 
                label={{ value: 'NDVI Change', position: 'bottom' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Nightlight Growth" 
                unit="%" 
                label={{ value: 'Nightlight Growth %', angle: -90, position: 'left' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name) => {
                  if (name === 'x') return [value.toFixed(4), 'NDVI Change'];
                  if (name === 'y') return [value.toFixed(2) + '%', 'Nightlight Growth'];
                  return [value, name];
                }}
              />
              <Scatter 
                name="Anomalies" 
                data={stats.scatterData} 
                fill={COLORS.primary}
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
          
          <div className="correlation-insights">
            <h4>Key Insights</h4>
            <ul>
              <li>
                <strong>Negative Correlation:</strong> Areas with decreasing vegetation often show increasing nightlight (urban expansion)
              </li>
              <li>
                <strong>Positive Correlation:</strong> Some areas show both vegetation increase and nightlight growth (agricultural development)
              </li>
              <li>
                <strong>Outliers:</strong> {stats.scatterData.filter(d => Math.abs(d.x) > 0.2 || Math.abs(d.y) > 100).length} extreme cases detected
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataInsights;
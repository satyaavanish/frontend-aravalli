// AnomalyReports.jsx - With working View button and detail modal
import React, { useState, useEffect } from 'react';

const AnomalyReports = ({ data, loading }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortField, setSortField] = useState('confidence');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  // Get unique types
  const getUniqueTypes = () => {
    if (!data || data.length === 0) return [];
    const types = new Set();
    data.forEach(item => {
      types.add(classifyActivity(item));
    });
    return Array.from(types);
  };

  // Apply filters and sorting
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...data];

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => {
        const itemType = classifyActivity(item);
        return itemType === typeFilter;
      });
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => {
        const location = `${item.lat.toFixed(4)}°N, ${item.lon.toFixed(4)}°E`.toLowerCase();
        const type = classifyActivity(item).toLowerCase();
        return location.includes(searchLower) || type.includes(searchLower);
      });
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'location':
          aVal = a.lat;
          bVal = b.lat;
          break;
        case 'type':
          aVal = classifyActivity(a);
          bVal = classifyActivity(b);
          break;
        case 'priority':
          const priorityWeight = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          aVal = priorityWeight[a.priority] || 0;
          bVal = priorityWeight[b.priority] || 0;
          break;
        case 'confidence':
          aVal = a.confidence || 0;
          bVal = b.confidence || 0;
          break;
        default:
          aVal = a.confidence;
          bVal = b.confidence;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredData(filtered);
  }, [data, search, typeFilter, priorityFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewDetails = (item) => {
    setSelectedAnomaly(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAnomaly(null);
  };

  const exportToCSV = () => {
    const headers = ['Latitude', 'Longitude', 'Type', 'Priority', 'Confidence', 'NDVI Change', 'Nightlight Growth'];
    const csvData = filteredData.map(item => [
      item.lat.toFixed(6),
      item.lon.toFixed(6),
      classifyActivity(item),
      item.priority,
      (item.confidence * 100).toFixed(1) + '%',
      item.indicators?.delta_ndvi?.toFixed(4) || '—',
      item.indicators?.nightlight_growth_pct?.toFixed(1) + '%' || '—'
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anomaly_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const uniqueTypes = getUniqueTypes();

  if (loading) {
    return <div className="loading">Loading anomaly reports...</div>;
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h2>Anomaly Reports</h2>
          <p className="reports-subtitle">
            {filteredData.length} of {data?.length || 0} anomalies shown
          </p>
        </div>
        <button 
          className="export-btn" 
          onClick={exportToCSV} 
          disabled={filteredData.length === 0}
        >
          <span>📥</span> Export CSV
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by location or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>
              ×
            </button>
          )}
        </div>
        
        <div className="filter-group">
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">📊 All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">🎯 All Priorities</option>
            <option value="HIGH">🔴 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">⚪ Low</option>
          </select>
        </div>
      </div>

      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('location')} className={sortField === 'location' ? 'active' : ''}>
                Location {sortField === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('type')} className={sortField === 'type' ? 'active' : ''}>
                Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('priority')} className={sortField === 'priority' ? 'active' : ''}>
                Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('confidence')} className={sortField === 'confidence' ? 'active' : ''}>
                Confidence {sortField === 'confidence' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>NDVI Change</th>
              <th>Nightlight</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  <div className="empty-state">
                    <span className="empty-icon">📊</span>
                    <h4>No anomalies found</h4>
                    <p>Try adjusting your filters or search criteria</p>
                    <button 
                      className="clear-filters-btn"
                      onClick={() => {
                        setSearch('');
                        setTypeFilter('all');
                        setPriorityFilter('all');
                      }}
                    >
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((item, idx) => {
                const type = classifyActivity(item);
                const confidenceClass = item.confidence >= 0.7 ? 'high' : 
                                       item.confidence >= 0.4 ? 'medium' : 'low';
                
                return (
                  <tr key={idx} className="anomaly-row">
                    <td className="location-cell">
                      <span className="coord">{item.lat.toFixed(4)}°N</span>
                      <span className="coord-sep">,</span>
                      <span className="coord">{item.lon.toFixed(4)}°E</span>
                    </td>
                    <td>
                      <span className="type-badge" style={{
                        backgroundColor: type === 'Vegetation Loss' ? 'rgba(16, 185, 129, 0.1)' :
                                        type === 'Urban Expansion' ? 'rgba(249, 115, 22, 0.1)' :
                                        type === 'Mining / Quarrying' ? 'rgba(239, 68, 68, 0.1)' :
                                        'rgba(100, 116, 139, 0.1)',
                        color: type === 'Vegetation Loss' ? '#10b981' :
                               type === 'Urban Expansion' ? '#f97316' :
                               type === 'Mining / Quarrying' ? '#ef4444' :
                               '#64748b'
                      }}>
                        {type}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge pri-${item.priority.toLowerCase()}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`conf-badge conf-${confidenceClass}`}>
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className={item.indicators?.delta_ndvi < 0 ? 'negative' : 'positive'}>
                      <span className="value-with-icon">
                        {item.indicators?.delta_ndvi < 0 ? '▼' : '▲'}
                        {Math.abs(item.indicators?.delta_ndvi || 0).toFixed(4)}
                      </span>
                    </td>
                    <td className={item.indicators?.nightlight_growth_pct > 0 ? 'positive' : 'negative'}>
                      <span className="value-with-icon">
                        {item.indicators?.nightlight_growth_pct > 0 ? '▲' : '▼'}
                        {Math.abs(item.indicators?.nightlight_growth_pct || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <button 
                        className="view-btn" 
                        onClick={() => handleViewDetails(item)}
                        title="View detailed analysis"
                      >
                        <span>👁️</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredData.length > 0 && (
        <div className="table-footer">
          <span>Showing {filteredData.length} of {data?.length || 0} anomalies</span>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedAnomaly && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            
            <div className="modal-header">
              <h3>Anomaly Details</h3>
              <div className="modal-badges">
                <span className={`priority-badge pri-${selectedAnomaly.priority.toLowerCase()}`}>
                  {selectedAnomaly.priority} Priority
                </span>
                <span className={`conf-badge conf-${
                  selectedAnomaly.confidence >= 0.7 ? 'high' : 
                  selectedAnomaly.confidence >= 0.4 ? 'medium' : 'low'
                }`}>
                  {(selectedAnomaly.confidence * 100).toFixed(0)}% Confidence
                </span>
              </div>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>📍 Location</h4>
                <div className="coord-display">
                  <div className="coord-item">
                    <span>Latitude</span>
                    <strong>{fmt(selectedAnomaly.lat, 6)}°N</strong>
                  </div>
                  <div className="coord-item">
                    <span>Longitude</span>
                    <strong>{fmt(selectedAnomaly.lon, 6)}°E</strong>
                  </div>
                </div>
              </div>

              {selectedAnomaly.date_windows && (
                <div className="detail-section">
                  <h4>📅 Analysis Period</h4>
                  <div className="date-display">
                    <div className="date-item">
                      <span>Current</span>
                      <span>{selectedAnomaly.date_windows.current_period?.replace(' to ', ' → ')}</span>
                    </div>
                    <div className="date-item">
                      <span>vs Previous</span>
                      <span>{selectedAnomaly.date_windows.previous_period?.replace(' to ', ' → ')}</span>
                    </div>
                    <div className="date-item">
                      <span>vs Season LY</span>
                      <span>{selectedAnomaly.date_windows.seasonal_baseline?.replace(' to ', ' → ')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>🌿 Vegetation (NDVI)</h4>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span>Mean NDVI</span>
                    <strong>{fmt(selectedAnomaly.indicators?.ndvi_mean, 4)}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Change vs Previous</span>
                    <strong className={selectedAnomaly.indicators?.delta_ndvi < 0 ? 'negative' : 'positive'}>
                      {fmt(selectedAnomaly.indicators?.delta_ndvi, 4)}
                    </strong>
                  </div>
                  {selectedAnomaly.indicators?.seasonal_delta_ndvi && (
                    <div className="metric-item">
                      <span>vs Season LY</span>
                      <strong className={selectedAnomaly.indicators?.seasonal_delta_ndvi < 0 ? 'negative' : 'positive'}>
                        {fmt(selectedAnomaly.indicators?.seasonal_delta_ndvi, 4)}
                      </strong>
                    </div>
                  )}
                  {selectedAnomaly.indicators?.ndvi_trend && (
                    <div className="metric-item">
                      <span>12-Month Trend</span>
                      <strong className={selectedAnomaly.indicators?.ndvi_trend < 0 ? 'negative' : 'positive'}>
                        {fmt(selectedAnomaly.indicators?.ndvi_trend, 6)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h4>💡 Nightlight Activity</h4>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span>Mean Radiance</span>
                    <strong>{fmt(selectedAnomaly.indicators?.nightlight_mean, 2)} nW</strong>
                  </div>
                  <div className="metric-item">
                    <span>Growth</span>
                    <strong className={selectedAnomaly.indicators?.nightlight_growth_pct > 0 ? 'positive' : 'negative'}>
                      {pct(selectedAnomaly.indicators?.nightlight_growth_pct)}
                    </strong>
                  </div>
                  {selectedAnomaly.indicators?.night_vol_change_pct && (
                    <div className="metric-item">
                      <span>Volatility</span>
                      <strong className={selectedAnomaly.indicators?.night_vol_change_pct > 0 ? 'positive' : 'negative'}>
                        {pct(selectedAnomaly.indicators?.night_vol_change_pct)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {selectedAnomaly.indicators?.lulc_change && (
                <div className="detail-section">
                  <h4>🗺️ Land Cover Change</h4>
                  <div className="lulc-change">
                    {selectedAnomaly.indicators.lulc_change}
                    {selectedAnomaly.indicators.lulc_severity > 0 && (
                      <span className="severity"> (Severity: {selectedAnomaly.indicators.lulc_severity}/4)</span>
                    )}
                  </div>
                </div>
              )}

              {selectedAnomaly.explanation && selectedAnomaly.explanation.length > 0 && (
                <div className="detail-section">
                  <h4>📋 Analysis</h4>
                  <ul className="explanation-list">
                    {selectedAnomaly.explanation.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAnomaly.spatial_cluster && (
                <div className="cluster-badge">⬡ Part of Spatial Cluster</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnomalyReports;
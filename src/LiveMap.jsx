// LiveMap.jsx - Beautiful satellite view with greenery
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

const LiveMap = ({ data, loading }) => {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markersRef = useRef(null);
  const heatRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [, setGlobalDateRange] = useState(null);

  // Get global date range from first item with date_windows
  useEffect(() => {
    if (data.length > 0 && data[0].date_windows) {
      const dw = data[0].date_windows;
      setGlobalDateRange(`${dw.current_period?.replace(' to ', ' → ')}`);
    }
  }, [data]);

  // Helper functions
  const fmt = (v, d = 4) => v == null || isNaN(v) ? '—' : Number(v).toFixed(d);
  
  const pct = (v) => v == null || isNaN(v) ? '—' : `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(1)}%`;

  const classifyActivity = (item) => {
    const dNdvi = item.indicators?.delta_ndvi ?? 0;
    const nlGrow = item.indicators?.nightlight_growth_pct ?? 0;
    const ndviMean = item.indicators?.ndvi_mean ?? 0;
    const lulc = item.indicators?.lulc_change;

    // Man-made signals
    if (lulc && lulc.includes('Built-up'))
      return { label: 'Urban Conversion', group: 'MAN_MADE', accent: '#f97316' };

    if (lulc && lulc.includes('Bare'))
      return { label: 'Mining / Quarrying', group: 'MAN_MADE', accent: '#ef4444' };

    if (nlGrow > 30)
      return { label: 'Human Activity Increase', group: 'MAN_MADE', accent: '#a855f7' };

    // Natural signals
    if (dNdvi < -0.07)
      return { label: 'Vegetation Loss', group: 'NATURAL', accent: '#10b981' };

    if (ndviMean < 0.25)
      return { label: 'Land Degradation', group: 'NATURAL', accent: '#84cc16' };

    if (Math.abs(dNdvi) > 0.03)
      return { label: 'Vegetation Change', group: 'NATURAL', accent: '#22c55e' };

    // Mixed / uncertain
    return { label: 'Environmental', group: 'MIXED', accent: '#64748b' };
  };

  const confidenceLabel = (c) => {
    if (c >= 0.7) return { text: 'HIGH', cls: 'high', color: '#10b981' };
    if (c >= 0.4) return { text: 'MEDIUM', cls: 'medium', color: '#fbbf24' };
    return { text: 'LOW', cls: 'low', color: '#64748b' };
  };

  const priorityMeta = (p) => {
    if (p === 'HIGH') return { cls: 'pri-high', icon: '▲', color: '#ef4444' };
    if (p === 'MEDIUM') return { cls: 'pri-medium', icon: '●', color: '#fbbf24' };
    return { cls: 'pri-low', icon: '▼', color: '#64748b' };
  };

  // Map initialization - with beautiful satellite tiles
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;

    mapInst.current = L.map(mapRef.current, {
      center: [27.5, 75.0],
      zoom: 7,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(mapInst.current);

    // Use beautiful satellite imagery with greenery
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19,
    }).addTo(mapInst.current);

    // Add a semi-transparent overlay for labels
    L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png', {
      attribution: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
      opacity: 0.6
    }).addTo(mapInst.current);

    markersRef.current = L.layerGroup().addTo(mapInst.current);
    
    // Heat layer with nature-inspired colors
    heatRef.current = L.heatLayer([], {
      radius: 35,
      blur: 25,
      maxZoom: 13,
      gradient: { 
        0.2: '#1e5f3e',  // dark green
        0.4: '#d97706',  // orange
        0.6: '#dc2626',  // red
        0.8: '#7f1d1d'   // dark red
      },
    }).addTo(mapInst.current);

    setMapReady(true);

    setTimeout(() => {
      if (mapInst.current) {
        mapInst.current.invalidateSize();
      }
    }, 100);

    return () => {
      if (mapInst.current) {
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapReady || !markersRef.current || !data.length) return;

    markersRef.current.clearLayers();
    const heatData = [];

    data.forEach((item) => {
      if (item.lat == null || item.lon == null) return;
      
      const act = classifyActivity(item);
      const conf = item.confidence ?? 0;
      const radius = 10 + conf * 20;

      heatData.push([item.lat, item.lon, conf]);

      // Outer circle (semi-transparent) - nature-inspired glow
      const outerCircle = L.circleMarker([item.lat, item.lon], {
        radius: radius,
        color: act.accent,
        weight: 2,
        opacity: 0.7,
        fillColor: act.accent,
        fillOpacity: 0.15,
      });

      // Inner circle (solid)
      const innerCircle = L.circleMarker([item.lat, item.lon], {
        radius: 6,
        color: '#fff',
        weight: 2,
        fillColor: act.accent,
        fillOpacity: 0.9,
      });

      // Detailed tooltip - nature theme
      const tooltipHtml = `
        <div style="font-family: 'DM Mono', monospace; min-width: 220px; background: rgba(20, 40, 20, 0.95); color: #e6f0da; border-radius: 8px; padding: 12px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; border-bottom: 1px solid #2d5a3c; padding-bottom: 8px;">
            <span style="width: 12px; height: 12px; border-radius: 50%; background: ${act.accent}; box-shadow: 0 0 10px ${act.accent};"></span>
            <span style="font-weight: 600; color: ${act.accent};">${item.type || act.label}</span>
            <span style="margin-left: auto; font-size: 10px; background: ${priorityMeta(item.priority).color}30; color: ${priorityMeta(item.priority).color}; padding: 3px 8px; border-radius: 12px; border: 1px solid ${priorityMeta(item.priority).color}40;">${item.priority}</span>
          </div>
          <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span style="color: #a7c957;">📍</span>
            <span style="color: #e6f0da;">${fmt(item.lat, 4)}°N, ${fmt(item.lon, 4)}°E</span>
          </div>
          <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span style="color: #a7c957;">📊</span>
            <span style="color: #e6f0da;">Confidence: ${Math.round(conf * 100)}%</span>
          </div>
          ${item.indicators ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; border-top: 1px solid #2d5a3c; padding-top: 10px;">
              <div style="background: rgba(0,0,0,0.2); padding: 6px; border-radius: 6px;">
                <div style="color: #a7c957; font-size: 8px; text-transform: uppercase; margin-bottom: 2px;">NDVI Mean</div>
                <div style="font-weight: 600; color: #e6f0da;">${item.indicators.ndvi_mean?.toFixed(4) || '—'}</div>
              </div>
              <div style="background: rgba(0,0,0,0.2); padding: 6px; border-radius: 6px;">
                <div style="color: #a7c957; font-size: 8px; text-transform: uppercase; margin-bottom: 2px;">NDVI Change</div>
                <div style="font-weight: 600; color: ${item.indicators.delta_ndvi < 0 ? '#ef4444' : '#10b981'};">${item.indicators.delta_ndvi?.toFixed(4) || '—'}</div>
              </div>
              <div style="background: rgba(0,0,0,0.2); padding: 6px; border-radius: 6px;">
                <div style="color: #a7c957; font-size: 8px; text-transform: uppercase; margin-bottom: 2px;">Nightlight</div>
                <div style="font-weight: 600; color: #e6f0da;">${item.indicators.nightlight_mean?.toFixed(2) || '—'} nW</div>
              </div>
              <div style="background: rgba(0,0,0,0.2); padding: 6px; border-radius: 6px;">
                <div style="color: #a7c957; font-size: 8px; text-transform: uppercase; margin-bottom: 2px;">Growth</div>
                <div style="font-weight: 600; color: ${item.indicators.nightlight_growth_pct > 0 ? '#10b981' : '#ef4444'};">${pct(item.indicators.nightlight_growth_pct)}</div>
              </div>
            </div>
          ` : ''}
          ${item.date_windows ? `
            <div style="margin-top: 10px; border-top: 1px solid #2d5a3c; padding-top: 8px; font-size: 10px; display: flex; align-items: center; gap: 6px;">
              <span style="color: #a7c957;">📅</span>
              <span style="color: #a7c957;">${item.date_windows.current_period?.replace(' to ', ' → ')}</span>
            </div>
          ` : ''}
        </div>
      `;

      const onClick = () => {
        setSelectedLocation(item);
        mapInst.current?.flyTo([item.lat, item.lon], 11, { duration: 1.1 });
      };

      outerCircle.on('click', onClick);
      innerCircle.on('click', onClick);
      outerCircle.bindTooltip(tooltipHtml, { 
        className: 'nature-tooltip', 
        sticky: true,
        direction: 'top'
      });

      markersRef.current.addLayer(outerCircle);
      markersRef.current.addLayer(innerCircle);
    });

    if (heatRef.current && heatData.length > 0) {
      heatRef.current.setLatLngs(heatData);
    }

    setTimeout(() => {
      if (mapInst.current) {
        mapInst.current.invalidateSize();
      }
    }, 50);
  }, [data, mapReady]);

  return (
    <div className="live-map-page">
      <div ref={mapRef} className="map-container" />
      
      {/* Map Legend - Nature theme */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        background: 'rgba(26, 63, 42, 0.95)',
        border: '1px solid #a7c957',
        borderRadius: '12px',
        padding: '16px',
        zIndex: 500,
        minWidth: '180px',
        color: '#e6f0da',
        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(5px)'
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a7c957', marginBottom: '10px' }}>
          Heat Intensity
        </div>
        <div style={{ height: '8px', borderRadius: '4px', background: 'linear-gradient(to right, #1e5f3e, #d97706, #dc2626, #7f1d1d)', marginBottom: '4px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#e6f0da', marginBottom: '12px' }}>
          <span>Low</span>
          <span>High</span>
        </div>
        <div style={{ height: '1px', background: '#2d5a3c', margin: '12px 0' }} />
        {[
          { color: '#f97316', label: 'Man-Made' },
          { color: '#10b981', label: 'Natural' },
          { color: '#a855f7', label: 'Mixed' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#e6f0da', marginBottom: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Detailed Location Panel - Nature theme */}
      {selectedLocation && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          width: '400px',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
          background: 'rgba(26, 63, 42, 0.95)',
          border: '1px solid #a7c957',
          borderRadius: '16px',
          padding: '24px',
          zIndex: 1000,
          color: '#e6f0da',
          boxShadow: '0 12px 28px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          animation: 'slideIn 0.2s ease-out'
        }}>
          <button 
            onClick={() => setSelectedLocation(null)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid #a7c957',
              color: '#e6f0da',
              borderRadius: '8px',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#a7c957';
              e.target.style.color = '#1a3f2a';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(0,0,0,0.3)';
              e.target.style.color = '#e6f0da';
            }}
          >
            ×
          </button>
          
          {(() => {
            const act = classifyActivity(selectedLocation);
            const conf = confidenceLabel(selectedLocation.confidence);
            const pri = priorityMeta(selectedLocation.priority);
            const ind = selectedLocation.indicators || {};
            
            return (
              <>
                {/* Header */}
                <div style={{ marginBottom: '20px', paddingLeft: '12px', borderLeft: `4px solid ${act.accent}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.3rem', fontWeight: '700', color: '#e6f0da' }}>
                      {selectedLocation.type || act.label}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: pri.color + '20',
                        color: pri.color,
                        border: `1px solid ${pri.color}40`
                      }}>
                        {pri.icon} {selectedLocation.priority}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: conf.color + '20',
                        color: conf.color,
                        border: `1px solid ${conf.color}40`
                      }}>
                        {Math.round(selectedLocation.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#a7c957' }}>
                    <span>{act.label} · {act.group}</span>
                    {selectedLocation.spatial_cluster && (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        background: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        color: '#a855f7',
                        borderRadius: '4px'
                      }}>
                        ⬡ Cluster
                      </span>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #2d5a3c' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#a7c957', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Location
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #2d5a3c', borderRadius: '8px', padding: '10px 12px' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#a7c957', marginBottom: '4px', textTransform: 'uppercase' }}>Latitude</span>
                      <strong style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.9rem', color: '#e6f0da' }}>{fmt(selectedLocation.lat, 6)}°N</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #2d5a3c', borderRadius: '8px', padding: '10px 12px' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#a7c957', marginBottom: '4px', textTransform: 'uppercase' }}>Longitude</span>
                      <strong style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.9rem', color: '#e6f0da' }}>{fmt(selectedLocation.lon, 6)}°E</strong>
                    </div>
                  </div>
                </div>

                {/* Date Windows */}
                {selectedLocation.date_windows && (
                  <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #2d5a3c' }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#a7c957', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Analysis Period
                    </h4>
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #2d5a3c', borderRadius: '8px', padding: '12px' }}>
                      {[
                        { label: 'Current', value: selectedLocation.date_windows.current_period },
                        { label: 'vs Previous', value: selectedLocation.date_windows.previous_period },
                        { label: 'vs Season LY', value: selectedLocation.date_windows.seasonal_baseline }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < 2 ? '1px dashed #2d5a3c' : 'none' }}>
                          <span style={{ color: '#a7c957', fontSize: '0.8rem' }}>{item.label}</span>
                          <span style={{ fontFamily: 'DM Mono, monospace', color: '#e6f0da', fontSize: '0.85rem' }}>
                            {item.value?.replace(' to ', ' → ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NDVI Section */}
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #2d5a3c' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#a7c957', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Vegetation (NDVI)
                  </h4>
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #2d5a3c', borderRadius: '8px', padding: '8px' }}>
                    {[
                      { label: 'Mean NDVI', value: ind.ndvi_mean, color: '#e6f0da' },
                      { label: 'vs Previous', value: ind.delta_ndvi, color: ind.delta_ndvi < 0 ? '#ef4444' : '#10b981' },
                      { label: 'vs Season LY', value: ind.seasonal_delta_ndvi, color: ind.seasonal_delta_ndvi < 0 ? '#ef4444' : '#10b981' },
                      { label: '12-Month Trend', value: ind.ndvi_trend, color: ind.ndvi_trend < 0 ? '#ef4444' : '#10b981' }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: idx < 3 ? '1px solid #2d5a3c' : 'none' }}>
                        <span style={{ fontSize: '0.85rem', color: '#a7c957' }}>{item.label}</span>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.9rem', fontWeight: '600', color: item.color }}>
                          {fmt(item.value, item.label.includes('Trend') ? 6 : 4)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nightlight Section */}
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #2d5a3c' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#a7c957', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Nightlight Activity
                  </h4>
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #2d5a3c', borderRadius: '8px', padding: '8px' }}>
                    {[
                      { label: 'Mean Radiance', value: ind.nightlight_mean, unit: ' nW', color: '#e6f0da' },
                      { label: 'Growth', value: ind.nightlight_growth_pct, unit: '%', color: ind.nightlight_growth_pct > 0 ? '#10b981' : '#ef4444' },
                      { label: 'Volatility', value: ind.night_vol_change_pct, unit: '%', color: ind.night_vol_change_pct > 0 ? '#10b981' : '#ef4444' }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: idx < 2 ? '1px solid #2d5a3c' : 'none' }}>
                        <span style={{ fontSize: '0.85rem', color: '#a7c957' }}>{item.label}</span>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.9rem', fontWeight: '600', color: item.color }}>
                          {item.label === 'Growth' ? pct(item.value) : fmt(item.value, 2) + (item.unit || '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Land Cover */}
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #2d5a3c' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#a7c957', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Land Cover (ESA WorldCover)
                  </h4>
                  {ind.lulc_change ? (
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #f97316', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.9rem', color: '#f97316', paddingBottom: '8px', borderBottom: '1px solid #2d5a3c', marginBottom: '8px' }}>
                        {ind.lulc_change}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#a7c957' }}>
                        <span>Severity {ind.lulc_severity || 0}/4</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[1,2,3,4].map(n => (
                            <div key={n} style={{ width: '20px', height: '4px', background: n <= (ind.lulc_severity || 0) ? '#f97316' : '#2d5a3c', borderRadius: '2px' }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#a7c957', fontStyle: 'italic', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed #2d5a3c', textAlign: 'center' }}>
                      No land cover change detected
                    </div>
                  )}
                </div>

                {/* Explanation */}
                {selectedLocation.explanation && selectedLocation.explanation.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: '#a7c957', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Why Flagged
                    </h4>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {selectedLocation.explanation.map((reason, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid #2d5a3c', borderRadius: '8px', marginBottom: '6px', fontSize: '0.85rem', color: '#e6f0da' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: act.accent, marginTop: '6px', flexShrink: 0 }} />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(-30px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .nature-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        .leaflet-control-zoom a {
          background: #1a3f2a !important;
          color: #e6f0da !important;
          border: 1px solid #a7c957 !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: #2d5a3c !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default LiveMap;
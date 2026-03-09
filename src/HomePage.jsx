// HomePage.jsx - Fixed with working image and better UI
import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = ({ data, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Background Image - working forest image from Unsplash */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url("https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0
      }} />

      {/* Gradient Overlay - darker for better text readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(0,20,10,0.85) 0%, rgba(0,40,20,0.8) 100%)',
        zIndex: 1
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        zIndex: 2,
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '900px',
          width: '100%',
          animation: 'fadeInUp 1.2s ease-out'
        }}>
          {/* Main Title */}
          <h1 style={{ 
            fontSize: 'clamp(3.5rem, 10vw, 6rem)', 
            fontWeight: '800', 
            marginBottom: '0.5rem',
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '4px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            lineHeight: '1.1'
          }}>
            ARAVALLI
          </h1>
          
          <p style={{ 
            fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
            marginBottom: '2rem',
            opacity: 0.95,
            fontWeight: '400',
            letterSpacing: '3px',
            fontFamily: 'DM Mono, monospace',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}>
            WATCH
          </p>
          
          <p style={{ 
            fontSize: 'clamp(1.2rem, 3.5vw, 1.4rem)', 
            marginBottom: '1.5rem',
            opacity: 0.9,
            maxWidth: '700px',
            margin: '0 auto 1.5rem auto',
            lineHeight: '1.6',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            fontStyle: 'italic',
            color: '#e6f0da'
          }}>
            "Guardians of the Ancient Mountains"
          </p>
          
          <p style={{ 
            fontSize: 'clamp(1rem, 3vw, 1.2rem)', 
            marginBottom: '3rem',
            opacity: 0.95,
            maxWidth: '800px',
            margin: '0 auto 3rem auto',
            lineHeight: '1.8',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            fontWeight: '300',
            color: '#f0f7ea'
          }}>
            Monitoring deforestation, illegal mining, and land use changes 
            in the Aravalli Range through advanced satellite technology
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            marginTop: '1rem'
          }}>
            <button 
              onClick={() => navigate('/map')}
              style={{
                padding: '1rem 2.8rem',
                fontSize: '1.1rem',
                background: '#2d6a4f',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(45, 106, 79, 0.4)',
                minWidth: '220px',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 8px 25px rgba(45, 106, 79, 0.6)';
                e.target.style.background = '#1e4b38';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(45, 106, 79, 0.4)';
                e.target.style.background = '#2d6a4f';
              }}
            >
              EXPLORE THE MAP
            </button>
            
            <button 
              onClick={() => navigate('/analyze')}
              style={{
                padding: '1rem 2.8rem',
                fontSize: '1.1rem',
                background: 'transparent',
                color: 'white',
                border: '2px solid #a7c957',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                minWidth: '220px',
                letterSpacing: '1px',
                backdropFilter: 'blur(5px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#a7c957';
                e.target.style.color = '#0a1f1a';
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 8px 25px rgba(167, 201, 87, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              ANALYZE LOCATION
            </button>
          </div>

          {/* Simple decorative line */}
          <div style={{
            width: '100px',
            height: '2px',
            background: 'rgba(255,255,255,0.3)',
            margin: '4rem auto 0',
            borderRadius: '2px'
          }} />
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
import React, { useState } from 'react';
import PromptDjComponent from './demos/promptdj/PromptDjComponent';
import PromptDjMidiComponent from './demos/promptdj-midi/PromptDjMidiComponent';
import VisionDjComponent from './demos/visiondj/VisionDjComponent';

const App = () => {
  const [selectedDemo, setSelectedDemo] = useState('promptdj-midi');

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    cursor: 'pointer',
    textDecoration: 'none',
    color: '#3c4043',
    fontFamily: 'Google Sans, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '20px',
    margin: '5px 0',
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: '#e8f0fe',
    color: '#1967d2',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      <div style={{
        width: '280px',
        borderRight: '1px solid #e0e0e0',
        padding: '20px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: '15px'
          }}>
            <img src="gcp-icon.png" alt="Google Cloud Platform Icon" style={{ width: '100%', height: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          </div>
          <h1 style={{ fontSize: '22px', color: '#3c4043', fontWeight: 500 }}>Google Cloud Summit</h1>
        </div>
        <nav style={{ flex: 1 }}>
          <a
            onClick={() => setSelectedDemo('promptdj-midi')}
            style={selectedDemo === 'promptdj-midi' ? activeLinkStyle : linkStyle}
          >
            <span style={{ marginRight: '15px', color: '#1967d2' }}>{'< >'}</span>
            Lyria DJ-MIDI
          </a>
          <a
            onClick={() => setSelectedDemo('promptdj')}
            style={selectedDemo === 'promptdj' ? activeLinkStyle : linkStyle}
          >
            <span style={{ marginRight: '15px', color: '#5f6368' }}>{'< >'}</span>
            PromptDJ with Gemini+Lyria
          </a>
          <a
            onClick={() => setSelectedDemo('visiondj')}
            style={selectedDemo === 'visiondj' ? activeLinkStyle : linkStyle}
          >
            <span style={{ marginRight: '15px', color: '#1967d2' }}>{'< >'}</span>
            VisionDJ
          </a>
        </nav>
        <div style={{ marginTop: 'auto', color: '#5f6368', fontSize: '12px' }}>
          © 2025 Google Cloud
        </div>
      </div>
      <div style={{ flex: 1, padding: '10px' }}>
        {selectedDemo === 'promptdj-midi' && <PromptDjMidiComponent />}
        {selectedDemo === 'promptdj' && <PromptDjComponent />}
        {selectedDemo === 'visiondj' && <VisionDjComponent />}
      </div>
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import PromptDjComponent from './demos/promptdj/PromptDjComponent';
import PromptDjMidiComponent from './demos/promptdj-midi/PromptDjMidiComponent';

const App = () => {
  const [selectedDemo, setSelectedDemo] = useState('promptdj');

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '200px', borderRight: '1px solid #ccc', padding: '10px', background: '#f0f0f0' }}>
        <h2>Demos</h2>
        <ul>
          <li onClick={() => setSelectedDemo('promptdj')} style={{ cursor: 'pointer', fontWeight: selectedDemo === 'promptdj' ? 'bold' : 'normal' }}>
            Prompt DJ
          </li>
          <li onClick={() => setSelectedDemo('promptdj-midi')} style={{ cursor: 'pointer', fontWeight: selectedDemo === 'promptdj-midi' ? 'bold' : 'normal' }}>
            Prompt DJ MIDI
          </li>
        </ul>
      </div>
      <div style={{ flex: 1, padding: '10px' }}>
        {selectedDemo === 'promptdj' && <PromptDjComponent />}
        {selectedDemo === 'promptdj-midi' && <PromptDjMidiComponent />}
      </div>
    </div>
  );
};

export default App;

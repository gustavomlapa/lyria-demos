import React, { useState } from 'react';
import PromptDjComponent from './demos/promptdj/PromptDjComponent';
import PromptDjMidiComponent from './demos/promptdj-midi/PromptDjMidiComponent';
import AiMusicSupervisorComponent from './demos/ai-music-supervisor/AiMusicSupervisorComponent';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { CloseIcon } from './icons/CloseIcon';
import { PlayIcon } from './icons/PlayIcon';

const App = () => {
  const [selectedDemo, setSelectedDemo] = useState('promptdj');

  const demos = [
    { id: 'promptdj', name: 'Prompt DJ', icon: <MusicNoteIcon className="w-5 h-5" /> },
    { id: 'promptdj-midi', name: 'Prompt DJ MIDI', icon: <PlayIcon className="w-5 h-5" /> },
    { id: 'ai-music-supervisor', name: 'AI Music Supervisor', icon: <CloseIcon className="w-5 h-5" /> },
  ];

  const renderDemo = () => {
    switch (selectedDemo) {
      case 'promptdj':
        return <PromptDjComponent />;
      case 'promptdj-midi':
        return <PromptDjMidiComponent />;
      case 'ai-music-supervisor':
        return <AiMusicSupervisorComponent />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Cloud Summit</h1>
        </div>
        <nav>
          <ul>
            {demos.map(demo => (
              <li key={demo.id}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedDemo(demo.id);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedDemo === demo.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {demo.icon}
                  <span>{demo.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="flex-1 flex flex-col">
        <header className="p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">Gemini API Demos</h1>
          <p className="text-gray-500 mt-1">Explore the power of Google's Gemini models with these interactive examples.</p>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow p-6 h-full">
            {renderDemo()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;

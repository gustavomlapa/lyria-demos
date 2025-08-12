import React, { useState, useCallback } from 'react';
import { AppState, MusicBrief } from './types';
import InputForm from './components/InputForm';
import MusicStudio from './components/MusicStudio';
import { generateMusicBrief } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INPUT);
  const [musicBrief, setMusicBrief] = useState<MusicBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (script: string, imageFile: File | null) => {
    setAppState(AppState.LOADING);
    setError(null);

    try {
      const brief = await generateMusicBrief(script, imageFile);
      setMusicBrief(brief);
      setAppState(AppState.STUDIO);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAppState(AppState.INPUT);
    }
  }, []);

  const handleBack = useCallback(() => {
    setAppState(AppState.INPUT);
    setMusicBrief(null);
    setError(null);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.INPUT:
        return <InputForm onGenerate={handleGenerate} error={error} />;
      case AppState.LOADING:
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
            <p className="mt-4 text-lg text-gray-600">AI is analyzing your creative brief...</p>
          </div>
        );
      case AppState.STUDIO:
        return musicBrief && <MusicStudio brief={musicBrief} onBack={handleBack} />;
      default:
        return <InputForm onGenerate={handleGenerate} error={error} />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
       <header className="w-full max-w-5xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
          AI Music Supervisor
        </h1>
        <p className="mt-2 text-gray-500">Transform your vision into a musical masterpiece</p>
      </header>
      <main className="w-full max-w-5xl flex-grow">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;

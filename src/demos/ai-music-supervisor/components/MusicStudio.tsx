import React, { useState, useEffect, useRef } from 'react';
import { MusicBrief } from '../types';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';

interface MusicStudioProps {
  brief: MusicBrief;
  onBack: () => void;
}

const generationSteps = [
  "Initializing Lyria model...",
  "Analyzing musical brief for emotional context...",
  "Generating harmonic and melodic structures...",
  "Synthesizing instrumental layers...",
  "Applying dynamic mastering...",
  "Final 30s track ready.",
];

const StudioCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-slate-700 animate-slide-up">
    <h3 className="text-sm font-semibold text-brand-cyan mb-2 uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

const MusicStudio: React.FC<MusicStudioProps> = ({ brief, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);

  // State for audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1

  // Refs for Web Audio API objects and animation
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<{ melody?: OscillatorNode, bass?: OscillatorNode }>({});
  const gainNodesRef = useRef<{ melody?: GainNode, bass?: GainNode }>({});
  const animationFrameRef = useRef<number>();
  const playbackStartTimeRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(30); // Target 30 seconds

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= generationSteps.length - 1) {
            clearInterval(interval);
            setIsGenerating(false);
            setIsGenerated(true);
            return generationSteps.length - 1;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Cleanup effect for audio and animation
  useEffect(() => {
    return () => {
      stopMusic();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const totalSecs = isNaN(seconds) ? 0 : Math.floor(seconds);
    const minutes = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const stopMusic = () => {
    if (audioContextRef.current) {
        Object.values(oscillatorsRef.current).forEach(osc => {
            try { 
                osc?.stop(); 
            } catch (e) {
                console.warn("Failed to stop oscillator; it may have already stopped.", e);
            }
        });
    }
    oscillatorsRef.current = {};
    setIsPlaying(false);

    if (typeof animationFrameRef.current === 'number') {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    setProgress(0);
  };
  
  const playMusic = () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch(e) {
            console.error("Web Audio API is not supported in this browser.");
            alert("Your browser does not support audio playback.");
            return;
        }
    }
    
    const audioContext = audioContextRef.current;
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    stopMusic(); // Ensure everything is clean before starting

    const now = audioContext.currentTime;
    playbackStartTimeRef.current = now;

    // --- Instruments ---
    const melodyOsc = audioContext.createOscillator();
    const melodyGain = audioContext.createGain();
    melodyOsc.type = 'triangle';
    melodyOsc.connect(melodyGain).connect(audioContext.destination);
    
    const bassOsc = audioContext.createOscillator();
    const bassGain = audioContext.createGain();
    bassOsc.type = 'sine';
    bassOsc.connect(bassGain).connect(audioContext.destination);

    oscillatorsRef.current = { melody: melodyOsc, bass: bassOsc };
    gainNodesRef.current = { melody: melodyGain, bass: bassGain };

    // --- Musical Content Generation ---
    const bpmMatch = brief.tempo.match(/(\d+)\s*BPM/);
    const bpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 120;
    const beatDuration = 60 / bpm;

    const isMinor = /melancholic|sad|dark|tense/i.test(brief.overallMood);
    const C4 = 261.63;
    const majorPentatonic = [0, 2, 4, 7, 9, 12];
    const minorPentatonic = [0, 3, 5, 7, 10, 12];
    const scale = isMinor ? minorPentatonic : majorPentatonic;

    const getNoteFreq = (rootFreq: number, steps: number) => rootFreq * Math.pow(2, steps / 12);

    // --- Schedule Notes ---
    let scheduleTime = now;
    melodyGain.gain.setValueAtTime(0, now);
    bassGain.gain.setValueAtTime(0, now);

    melodyGain.gain.linearRampToValueAtTime(0.15, now + 2);
    bassGain.gain.linearRampToValueAtTime(0.20, now + 4);

    let melodyNoteIndex = Math.floor(scale.length / 2);
    let beatCount = 0;
    
    while(scheduleTime < now + totalDurationRef.current - 2) {
        if (scheduleTime > now + 4 && beatCount % 4 === 0) {
            const bassFreq = getNoteFreq(C4 / 4, scale[beatCount/4 % 2]); 
            bassOsc.frequency.setValueAtTime(bassFreq, scheduleTime);
        }
        
        const melodyFreq = getNoteFreq(C4, scale[melodyNoteIndex]);
        melodyOsc.frequency.setValueAtTime(melodyFreq, scheduleTime);
        
        melodyNoteIndex += (Math.random() > 0.5 ? 1 : -1);
        if(melodyNoteIndex < 0) melodyNoteIndex = 1;
        if(melodyNoteIndex >= scale.length) melodyNoteIndex = scale.length - 2;

        const noteDuration = (Math.random() > 0.7 ? beatDuration : beatDuration / 2) * 0.95;
        scheduleTime += noteDuration;
        beatCount++;
    }

    melodyGain.gain.setValueAtTime(melodyGain.gain.value, scheduleTime);
    bassGain.gain.setValueAtTime(bassGain.gain.value, scheduleTime);
    melodyGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDurationRef.current);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDurationRef.current);

    melodyOsc.start(now);
    bassOsc.start(now);
    melodyOsc.stop(now + totalDurationRef.current);
    bassOsc.stop(now + totalDurationRef.current);

    const onPlaybackEnd = () => {
        setIsPlaying(false);
        oscillatorsRef.current = {};
        if (typeof animationFrameRef.current === 'number') {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }
        setProgress(1);
    };

    melodyOsc.onended = onPlaybackEnd;
    
    const animateProgress = () => {
      if (!audioContextRef.current || !isPlaying) return;
      const elapsedTime = audioContextRef.current.currentTime - playbackStartTimeRef.current;
      const currentProgress = Math.min(elapsedTime / totalDurationRef.current, 1);
      setProgress(currentProgress);

      if (currentProgress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateProgress);
      }
    };
    
    setIsPlaying(true);
    animationFrameRef.current = requestAnimationFrame(animateProgress);
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      stopMusic();
    } else {
      playMusic();
    }
  };

  const handleGenerateClick = () => {
    stopMusic();
    setIsGenerating(true);
    setGenerationProgress(0);
    setIsGenerated(false);
  };
  
  const handleBackWithCleanup = () => {
    stopMusic();
    onBack();
  };

  return (
    <div className="w-full animate-fade-in">
      <button onClick={handleBackWithCleanup} className="flex items-center gap-2 mb-6 text-slate-400 hover:text-brand-cyan transition-colors">
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Editor
      </button>

      <div className="space-y-6">
        <header className="text-center">
          <h2 className="text-3xl font-bold text-white">{brief.titleSuggestion}</h2>
          <p className="text-slate-400 italic mt-1">"{brief.overallMood}"</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StudioCard title="Key Elements">
            <div className="flex flex-wrap gap-2">
              {brief.keyElements.map((el, i) => (
                <span key={i} className="bg-cyan-900/50 text-cyan-300 text-xs font-medium px-2.5 py-1 rounded-full">{el}</span>
              ))}
            </div>
          </StudioCard>
          <StudioCard title="Tempo">
            <p className="text-2xl font-mono text-white">{brief.tempo}</p>
          </StudioCard>
           <StudioCard title="Negative Constraints">
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                {brief.negativeConstraints.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </StudioCard>
        </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StudioCard title="Instrumentation">
              <div className="flex flex-wrap gap-2">
                {brief.instrumentation.map((inst, i) => (
                  <span key={i} className="bg-fuchsia-900/50 text-fuchsia-300 text-xs font-medium px-2.5 py-1 rounded-full">{inst}</span>
                ))}
              </div>
            </StudioCard>
            <StudioCard title="Musical Cues">
                <div className="space-y-3 text-sm">
                    {brief.musicalCues.map((cue, i) => (
                        <div key={i} className="flex gap-4">
                            <span className="font-mono text-slate-400 flex-shrink-0 w-24">{cue.timestamp}</span>
                            <p className="text-slate-300">{cue.description}</p>
                        </div>
                    ))}
                </div>
            </StudioCard>
         </div>

        {/* Generation Section */}
        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
          {isGenerating ? (
             <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-center gap-4">
                    <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-brand-magenta"></div>
                    <p className="text-lg text-slate-300">{generationSteps[generationProgress]}</p>
                </div>
             </div>
          ) : isGenerated ? (
             <div className="p-4 bg-slate-800 rounded-lg animate-fade-in flex flex-col items-center">
                <h3 className="text-xl font-bold text-green-400 mb-2">Track Generated!</h3>
                 <p className="text-xs text-slate-500 mb-4">Music generated with Lyria technology (simulation)</p>
                <div className="w-full max-w-md p-3 bg-slate-900 rounded-lg flex items-center gap-4">
                    <button onClick={handlePlayToggle} className="p-2 bg-gradient-to-r from-brand-cyan to-brand-magenta rounded-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand-cyan">
                        {isPlaying ? <StopIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                    </button>
                    <div className="flex-grow h-2 bg-slate-700 rounded-full overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-brand-cyan to-brand-magenta" style={{ width: `${progress * 100}%`}}></div>
                    </div>
                    <span className="font-mono text-slate-400 w-24 text-center">
                      {formatTime(progress * totalDurationRef.current)} / {formatTime(totalDurationRef.current)}
                    </span>
                </div>
                <button onClick={handleGenerateClick} className="mt-4 text-sm text-slate-400 hover:text-white">Regenerate</button>
                <button onClick={stopMusic} className="mt-4 text-sm text-slate-400 hover:text-white">Stop</button>
             </div>
          ) : (
            <button
              onClick={handleGenerateClick}
              className="group flex items-center justify-center gap-3 px-8 py-4 font-bold text-xl rounded-full text-slate-900 bg-gradient-to-r from-brand-cyan to-brand-magenta hover:scale-105 transform transition-transform duration-300"
            >
              <MusicNoteIcon className="w-6 h-6 transition-transform group-hover:rotate-12" />
              Generate with Lyria
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicStudio;

import React, { useEffect, useRef } from 'react';
import { gen } from './index';
import type { PromptDjMidi } from './components/PromptDjMidi';
import { useWebSocket } from '../../contexts/WebSocketContext';

const PromptDjMidiComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const promptDjMidiRef = useRef<PromptDjMidi | null>(null);
  const { session } = useWebSocket() || {};

  useEffect(() => {
    if (containerRef.current && session) {
      // Clear any previous content
      containerRef.current.innerHTML = '';
      // Generate the Lit component and store a reference to it
      promptDjMidiRef.current = gen(containerRef.current);
      promptDjMidiRef.current.session = session;
    }

    // Cleanup function to be called on component unmount
    return () => {
      if (promptDjMidiRef.current) {
        promptDjMidiRef.current.close();
        promptDjMidiRef.current = null;
      }
    };
  }, [session]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
};

export default PromptDjMidiComponent;
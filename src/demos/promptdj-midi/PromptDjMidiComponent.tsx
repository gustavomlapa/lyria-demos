import React, { useEffect, useRef } from 'react';
import { gen } from './index';
import type { PromptDjMidi } from './components/PromptDjMidi';

const PromptDjMidiComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const promptDjMidiRef = useRef<PromptDjMidi | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear any previous content
      containerRef.current.innerHTML = '';
      // Generate the Lit component and store a reference to it
      promptDjMidiRef.current = gen(containerRef.current);
    }

    // Cleanup function to be called on component unmount
    return () => {
      if (promptDjMidiRef.current) {
        promptDjMidiRef.current.close();
        promptDjMidiRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
};

export default PromptDjMidiComponent;

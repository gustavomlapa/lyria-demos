import React, { useEffect, useRef } from 'react';
import { main } from './index';
import type { PromptDj } from './index';

const VisionDjComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const promptDjRef = useRef<PromptDj | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear any previous content
      containerRef.current.innerHTML = '';
      // Generate the Lit component and store a reference to it
      main(containerRef.current);
    }

    // Cleanup function to be called on component unmount
    return () => {
      if (promptDjRef.current) {
        promptDjRef.current.close();
        promptDjRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
};

export default VisionDjComponent;

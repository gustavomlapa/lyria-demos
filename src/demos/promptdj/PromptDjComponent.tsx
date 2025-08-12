import React, { useEffect, useRef } from 'react';
import { gen } from './index';
import type { PromptDj } from './index';
import { useWebSocket } from '../../contexts/WebSocketContext';

const PromptDjComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const promptDjRef = useRef<PromptDj | null>(null);
  const webSocket = useWebSocket();

  useEffect(() => {
    if (containerRef.current && webSocket?.session) {
      // Clear any previous content
      containerRef.current.innerHTML = '';
      // Generate the Lit component and store a reference to it
      promptDjRef.current = gen(containerRef.current);
      promptDjRef.current.session = webSocket.session;
    }

    // Cleanup function to be called on component unmount
    return () => {
      if (promptDjRef.current) {
        promptDjRef.current.close();
        promptDjRef.current = null;
      }
    };
  }, [webSocket?.session]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
};

export default PromptDjComponent;

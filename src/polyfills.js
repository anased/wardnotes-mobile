// src/polyfills.js
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Buffer polyfill
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Process polyfill
import process from 'process';
global.process = process;

// Additional global fixes
global.process.env = global.process.env || {};
global.process.version = global.process.version || 'v16.0.0';

// UPDATED: Create a non-functional WebSocket that doesn't throw errors
if (typeof global !== 'undefined') {
  global.WebSocket = class MockWebSocket {
    constructor(url) {
      console.warn('WebSocket is disabled in React Native - connection to', url, 'will be ignored');
      // Don't throw error, just create a non-functional WebSocket
      this.readyState = 3; // CLOSED state
      this.url = url;
      
      // Set up event properties
      this.onopen = null;
      this.onclose = null;
      this.onmessage = null;
      this.onerror = null;
      
      // Immediately "close" the connection
      setTimeout(() => {
        if (this.onclose) {
          this.onclose({ code: 1000, reason: 'WebSocket disabled in React Native' });
        }
      }, 0);
    }
    
    // Mock WebSocket methods
    send() {
      console.warn('WebSocket.send() called but WebSocket is disabled');
    }
    
    close() {
      console.warn('WebSocket.close() called but WebSocket is disabled');
    }
    
    addEventListener() {}
    removeEventListener() {}
  };
  
  // Add WebSocket constants
  global.WebSocket.CONNECTING = 0;
  global.WebSocket.OPEN = 1;
  global.WebSocket.CLOSING = 2;
  global.WebSocket.CLOSED = 3;
}

// Mock EventSource as well
if (typeof global.EventSource === 'undefined') {
  global.EventSource = class MockEventSource {
    constructor() {
      console.warn('EventSource disabled in React Native');
      this.readyState = 2; // CLOSED
    }
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}
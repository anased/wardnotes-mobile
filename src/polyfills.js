// polyfills.js (or src/polyfills.js)
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

// Disable WebSocket completely to prevent stream module issues
global.WebSocket = undefined;

// Mock real-time features that might cause issues
if (typeof global.EventSource === 'undefined') {
  global.EventSource = class MockEventSource {
    constructor() {
      console.warn('EventSource disabled in React Native');
    }
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}
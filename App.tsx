// App.tsx
// MUST be at the very top before any other imports
import './src/polyfills';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/components/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
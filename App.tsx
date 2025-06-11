// App.tsx
// MUST be at the very top before any other imports
import './src/polyfills';

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import notificationService from './src/services/notifications/notificationService';

import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/components/navigation/AppNavigator';

// Debug Logger Component
function DebugLogger() {
  const [logs, setLogs] = useState<Array<{message: string, type: string, timestamp: string}>>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    const addLog = (message: string, type: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev.slice(-50), { message, type, timestamp }]); // Keep last 50 logs
    };

    console.error = (...args) => {
      originalError(...args);
      addLog(args.join(' '), 'ERROR');
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog(args.join(' '), 'WARN');
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog(args.join(' '), 'LOG');
    };

    // Note: ErrorUtils is not available in React Native by default
    // Error handling is done through React Error Boundaries instead

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    };
  }, []);

  return (
    <>
      {/* Floating Debug Button */}
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          backgroundColor: logs.some(log => log.type === 'ERROR' || log.type === 'REACT_ERROR') ? 'red' : 'blue',
          padding: 10,
          borderRadius: 20,
          zIndex: 1000,
        }}
      >
        <Text style={{ color: 'white', fontSize: 12 }}>
          Debug ({logs.length})
        </Text>
      </TouchableOpacity>

      {/* Debug Modal */}
      <Modal visible={isVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'black', paddingTop: 50 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
            <TouchableOpacity onPress={() => setLogs([])}>
              <Text style={{ color: 'yellow' }}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsVisible(false)}>
              <Text style={{ color: 'white' }}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ flex: 1 }}>
            {logs.map((log, index) => (
              <View key={index} style={{ padding: 5, borderBottomWidth: 1, borderBottomColor: '#333' }}>
                <Text style={{ 
                  color: log.type === 'ERROR' || log.type === 'REACT_ERROR' ? 'red' : 
                        log.type === 'WARN' ? 'yellow' : 'white',
                  fontSize: 10 
                }}>
                  [{log.timestamp}] {log.type}: {log.message}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize notifications when app starts
    notificationService.initialize();
  }, []);
  return (
    <>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
      {__DEV__ && <DebugLogger />}
    </>
  );
}
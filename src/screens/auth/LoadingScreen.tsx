// src/screens/auth/LoadingScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoadingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>WardNotes</Text>
        <ActivityIndicator size="large" color="#0ea5e9" style={styles.spinner} />
        <Text style={styles.text}>Initializing...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
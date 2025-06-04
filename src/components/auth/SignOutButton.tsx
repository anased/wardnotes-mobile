// src/components/auth/SignOutButton.tsx
import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

interface SignOutButtonProps {
  variant?: 'text' | 'button' | 'icon';
  showIcon?: boolean;
  style?: any;
}

export default function SignOutButton({ 
  variant = 'button', 
  showIcon = true,
  style 
}: SignOutButtonProps) {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: confirmSignOut },
      ]
    );
  };

  const confirmSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={handleSignOut}
        disabled={isSigningOut}
        style={[styles.iconButton, style]}
      >
        {isSigningOut ? (
          <ActivityIndicator size="small" color="#ef4444" />
        ) : (
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'text') {
    return (
      <TouchableOpacity
        onPress={handleSignOut}
        disabled={isSigningOut}
        style={[styles.textButton, style]}
      >
        <Text style={styles.textButtonText}>
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      disabled={isSigningOut}
      style={[styles.button, style]}
    >
      <View style={styles.buttonContent}>
        {showIcon && !isSigningOut && (
          <Ionicons name="log-out-outline" size={16} color="#ef4444" />
        )}
        {isSigningOut && (
          <ActivityIndicator size="small" color="#ef4444" />
        )}
        <Text style={[styles.buttonText, showIcon && { marginLeft: 8 }]}>
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: 'transparent',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
  },
  textButton: {
    paddingVertical: 8,
  },
  textButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
});
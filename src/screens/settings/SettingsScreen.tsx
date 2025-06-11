import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { CombinedNavigationProp } from '../../types/navigation';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<CombinedNavigationProp>();
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
      // Navigation will be handled by AuthContext state change
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };
  const navigateToNotifications = () => {
    navigation.navigate('NotificationSettings');
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account and app preferences</Text>
        </View>

        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={navigateToProfile}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="person-outline" size={20} color="#0ea5e9" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Profile</Text>
                <Text style={styles.settingSubtitle}>{user?.email}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={navigateToNotifications}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications-outline" size={20} color="#0ea5e9" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSubtitle}>Manage notification preferences</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="color-palette-outline" size={20} color="#0ea5e9" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Appearance</Text>
                <Text style={styles.settingSubtitle}>Theme and display options</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="download-outline" size={20} color="#0ea5e9" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Data & Storage</Text>
                <Text style={styles.settingSubtitle}>Backup and sync settings</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="help-circle-outline" size={20} color="#0ea5e9" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Help Center</Text>
                <Text style={styles.settingSubtitle}>Get help and support</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={20} color="#0ea5e9" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Contact Us</Text>
                <Text style={styles.settingSubtitle}>Send feedback or report issues</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.settingItem, styles.signOutItem]} 
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, styles.signOutIconContainer]}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              </View>
              <Text style={[styles.settingTitle, styles.signOutText]}>
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>WardNotes Mobile v1.0.0</Text>
        </View>
      </ScrollView>
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
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginTop: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  signOutItem: {
    borderBottomWidth: 0,
  },
  signOutIconContainer: {
    backgroundColor: '#fee2e2',
  },
  signOutText: {
    color: '#ef4444',
  },
  versionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
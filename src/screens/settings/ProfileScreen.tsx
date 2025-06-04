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
import useNotes from '../../hooks/useNotes';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { notes } = useNotes();
  const navigation = useNavigation();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
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

  const isGoogleLogin = user?.app_metadata?.provider === 'google';
  const userName = String(user?.user_metadata?.full_name || user?.user_metadata?.name || '');

  // Calculate days since account creation (if available)
  const daysActive = (() => {
    if (!user?.email_confirmed_at) return 0;
    const createdDate = new Date(user.email_confirmed_at);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - createdDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  })();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {/* Empty spacer view for header alignment */}
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#0ea5e9" />
            </View>
          </View>

          {isGoogleLogin && userName && (
            <Text style={styles.userName}>{userName}</Text>
          )}
          
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          <View style={styles.loginMethodBadge}>
            <Ionicons 
              name={isGoogleLogin ? "logo-google" : "mail-outline"} 
              size={16} 
              color="#6b7280" 
            />
            <Text style={styles.loginMethodText}>
              {isGoogleLogin ? 'Google Account' : 'Email & Password'}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="document-text-outline" size={24} color="#0ea5e9" />
              </View>
              <Text style={styles.statNumber}>{notes.length}</Text>
              <Text style={styles.statLabel}>Total Notes</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="#10b981" />
              </View>
              <Text style={styles.statNumber}>{daysActive}</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-outline" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Privacy Settings</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="download-outline" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Export Data</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, styles.signOutItem]} 
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={[styles.settingText, styles.signOutText]}>
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.deleteAccountItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
              <Text style={[styles.settingText, styles.deleteAccountText]}>
                Delete Account
              </Text>
            </View>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  loginMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  loginMethodText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  statsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
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
  settingText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  signOutItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  signOutText: {
    color: '#ef4444',
  },
  deleteAccountItem: {
    borderBottomWidth: 0,
  },
  deleteAccountText: {
    color: '#dc2626',
  },
});
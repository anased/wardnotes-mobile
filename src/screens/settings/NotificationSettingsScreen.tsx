import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import notificationService, { NotificationSettings } from '../../services/notifications/notificationService';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await notificationService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      setSaving(true);
      await notificationService.saveSettings(newSettings);
      setSettings(newSettings);
      Alert.alert('Success', 'Notification settings saved successfully!');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = (enabled: boolean) => {
    if (!settings) return;
    
    const newSettings = { ...settings, enabled };
    saveSettings(newSettings);
  };

  const handleTimeChange = () => {
    if (!settings) return;
    
    // Simple time picker using Alert (cross-platform solution)
    Alert.prompt(
      'Set Reminder Time',
      'Enter time in 24-hour format (HH:MM)',
      (timeString) => {
        if (timeString && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
          const newSettings = { ...settings, time: timeString };
          saveSettings(newSettings);
        } else {
          Alert.alert('Invalid Time', 'Please enter time in HH:MM format (e.g., 20:00)');
        }
      },
      'plain-text',
      settings.time
    );
  };

  const handleMessageChange = (message: string) => {
    if (!settings) return;
    
    const newSettings = { ...settings, message };
    setSettings(newSettings);
  };

  const handleMessageSave = () => {
    if (settings) {
      saveSettings(settings);
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.sendTestNotification();
      Alert.alert('Test Sent', 'Check your notifications in a few seconds!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak Reminders</Text>
          <Text style={styles.sectionDescription}>
            Get daily reminders to add a new note and maintain your streak
          </Text>

          {/* Enable/Disable Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications" size={20} color="#0ea5e9" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Enable Reminders</Text>
                <Text style={styles.settingSubtitle}>
                  {settings.enabled ? 'Daily reminders are on' : 'Daily reminders are off'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: '#f3f4f6', true: '#bfdbfe' }}
              thumbColor={settings.enabled ? '#0ea5e9' : '#9ca3af'}
              disabled={saving}
            />
          </View>

          {/* Time Picker */}
          {settings.enabled && (
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleTimeChange}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time" size={20} color="#0ea5e9" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Reminder Time</Text>
                  <Text style={styles.settingSubtitle}>
                    Daily reminder at {formatTime(settings.time)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}

          {/* Custom Message */}
          {settings.enabled && (
            <View style={styles.messageSection}>
              <Text style={styles.messageLabel}>Custom Message</Text>
              <TextInput
                style={styles.messageInput}
                multiline
                numberOfLines={3}
                value={settings.message}
                onChangeText={handleMessageChange}
                onBlur={handleMessageSave}
                placeholder="Enter your custom reminder message..."
                placeholderTextColor="#9ca3af"
              />
            </View>
          )}

          {/* Test Notification */}
          {settings.enabled && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestNotification}
            >
              <Ionicons name="send" size={16} color="#0ea5e9" />
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              Notifications help you maintain your daily note-taking streak
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              You can disable notifications anytime from this screen
            </Text>
          </View>
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
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
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
  messageSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0ea5e9',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications are handled when the app is running
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  time: string; // Format: "HH:mm"
  message: string;
}

const STORAGE_KEY = 'notification_settings';
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  time: '20:00', // 8:00 PM default
  message: "Don't forget to add today's note! Keep your streak going! 🔥"
};

export class NotificationService {
  private static instance: NotificationService;
  private notificationId: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request permissions for notifications
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('streak-reminders', {
        name: 'Streak Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0ea5e9',
      });
    }

    return true;
  }

  // Get current notification settings
  async getSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
    return DEFAULT_SETTINGS;
  }

  // Save notification settings
  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      
      // Reschedule notifications with new settings
      if (settings.enabled) {
        await this.scheduleNotification(settings);
      } else {
        await this.cancelNotification();
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      throw error;
    }
  }

  // Schedule daily notification
  async scheduleNotification(settings: NotificationSettings): Promise<void> {
    try {
      // Cancel existing notification first
      await this.cancelNotification();

      if (!settings.enabled) return;

      // Parse time
      const [hours, minutes] = settings.time.split(':').map(Number);
      
      // Create trigger for daily notifications
      const trigger: Notifications.NotificationTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      };

      // Schedule the notification
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'WardNotes Streak Reminder',
          body: settings.message,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'streak-reminder',
        },
        trigger,
      });

      this.notificationId = id;
      console.log(`Notification scheduled with ID: ${id} for ${settings.time}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // Cancel scheduled notification
  async cancelNotification(): Promise<void> {
    try {
      if (this.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(this.notificationId);
        this.notificationId = null;
      }
      // Also cancel all scheduled notifications as a safety measure
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Initialize notifications (call when app starts)
  async initialize(): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    const settings = await this.getSettings();
    if (settings.enabled) {
      await this.scheduleNotification(settings);
    }

    // Set up notification response listener
    this.setupNotificationListeners();
  }

  // Set up listeners for when user taps notifications
  private setupNotificationListeners(): void {
    // Handle notification taps when app is running
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      // You can add navigation logic here if needed
      // For example, navigate to create note screen
    });

    // Handle notifications when app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
    });
  }

  // Test notification (useful for debugging)
  async sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test streak reminder!',
        sound: 'default',
      },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1 
      },
    });
  }

  // Get all scheduled notifications (for debugging)
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

export default NotificationService.getInstance();
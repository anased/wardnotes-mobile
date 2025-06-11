// src/screens/learning-tracker/LearningTrackerScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useDailyActivity } from '../../hooks/useDailyActivity';
import { CombinedNavigationProp } from '../../types/navigation';

const screenWidth = Dimensions.get('window').width;

export default function LearningTrackerScreen() {
  const navigation = useNavigation<CombinedNavigationProp>();
  const {
    currentStreak,
    weeklyActivity,
    monthlyActivity,
    loading,
    refreshActivity
  } = useDailyActivity();

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshActivity();
    }, [refreshActivity])
  );

  // Get today's note count
  const todayCount = (() => {
    const today = new Date().toISOString().split('T')[0];
    const todayActivity = weeklyActivity.find(day => day.date.split('T')[0] === today);
    return todayActivity?.notes_count || 0;
  })();

  // Calculate weekly total
  const weeklyTotal = weeklyActivity.reduce((total, day) => total + day.notes_count, 0);

  // Generate streak message
  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return "You haven't created any notes recently. Start your streak today!";
    } else if (todayCount === 0) {
      return `You have a ${currentStreak}-day streak going. Don't break the chain - create a note today!`;
    } else {
      return `Great job! You've maintained your learning streak for ${currentStreak} day${currentStreak !== 1 ? 's' : ''}.`;
    }
  };

  // Prepare weekly chart data
  const weeklyChartData = {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{
      data: (() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        
        // Create array for week starting from Sunday
        const weekData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(today.getDate() - dayOfWeek + i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayActivity = weeklyActivity.find(day => day.date.split('T')[0] === dateStr);
          return dayActivity?.notes_count || 0;
        });
        
        return weekData;
      })()
    }]
  };

  // Generate calendar data for current month
  const generateCalendarData = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create activity map
    const activityMap = new Map();
    monthlyActivity.forEach(day => {
      const date = new Date(day.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        const dateKey = date.getDate();
        activityMap.set(dateKey, day);
      }
    });
    
    const weeks = [];
    let days = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayActivity = activityMap.get(i);
      days.push({
        date: i,
        hasActivity: !!dayActivity,
        notesCount: dayActivity?.notes_count || 0
      });
      
      if ((i + startingDayOfWeek) % 7 === 0) {
        weeks.push([...days]);
        days = [];
      }
    }
    
    // Fill last week
    if (days.length > 0) {
      while (days.length < 7) {
        days.push(null);
      }
      weeks.push([...days]);
    }
    
    return weeks;
  };

  const calendarData = generateCalendarData();
  const monthName = new Date().toLocaleString('default', { month: 'long' });

  // Get activity color based on note count
  const getActivityColor = (count: number) => {
    if (count === 0) return '#f3f4f6';
    if (count === 1) return '#dbeafe';
    if (count === 2) return '#bfdbfe';
    if (count === 3) return '#93c5fd';
    if (count === 4) return '#60a5fa';
    return '#3b82f6';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Learning Tracker</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading your activity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learning Tracker</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Learning Habit</Text>
          <Text style={styles.cardSubtitle}>
            Track your consistency and build a daily learning habit. Each day you create a note adds to your streak.
          </Text>
        </View>

        {/* Current Streak */}
        <View style={styles.card}>
          <View style={styles.streakContainer}>
            <View style={styles.streakIcon}>
              <Ionicons name="flash" size={32} color="#0ea5e9" />
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <Text style={styles.streakNumber}>
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Message */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Progress</Text>
          <Text style={styles.progressMessage}>{getStreakMessage()}</Text>
          
          {todayCount === 0 && (
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigation.navigate('Create' as never)}
            >
              <Text style={styles.createButtonText}>Create Today's Note</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Weekly Activity Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Activity</Text>
          {weeklyActivity.length > 0 ? (
            <View style={styles.chartContainer}>
              <BarChart
                data={weeklyChartData}
                width={screenWidth - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  style: {
                    borderRadius: 8
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: '#e5e7eb',
                    strokeWidth: 1
                  },
                  barPercentage: 0.6,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
              />
            </View>
          ) : (
            <Text style={styles.noDataText}>No activity data available.</Text>
          )}
        </View>

        {/* Monthly Calendar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{monthName} Activity</Text>
          
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.calendarDayLabel}>{day}</Text>
            ))}
          </View>
          
          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarData.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.calendarWeek}>
                {week.map((day, dayIndex) => (
                  <View 
                    key={dayIndex} 
                    style={[
                      styles.calendarDay,
                      day && { backgroundColor: getActivityColor(day.notesCount) }
                    ]}
                  >
                    {day && (
                      <Text style={[
                        styles.calendarDayText,
                        day.hasActivity && styles.calendarDayTextActive
                      ]}>
                        {day.date}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statUnit}>days</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Notes Today</Text>
            <Text style={styles.statNumber}>{todayCount}</Text>
            <Text style={styles.statUnit}>notes</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statNumber}>{weeklyTotal}</Text>
            <Text style={styles.statUnit}>notes</Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.cardTitle}>Consistency Tips</Text>
          
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.tipText}>
              Create at least one note per day to build your streak
            </Text>
          </View>
          
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.tipText}>
              Set a daily reminder to ensure you don't break your streak
            </Text>
          </View>
          
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.tipText}>
              Quality matters, but consistency is key to long-term learning
            </Text>
          </View>
          
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.tipText}>
              Even a quick clinical pearl or observation counts toward your streak
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
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  progressMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  chart: {
    borderRadius: 8,
  },
  noDataText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    paddingVertical: 32,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    paddingVertical: 8,
  },
  calendarGrid: {
    gap: 4,
  },
  calendarWeek: {
    flexDirection: 'row',
    gap: 4,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#6b7280',
  },
  calendarDayTextActive: {
    color: '#1f2937',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 12,
    color: '#9ca3af',
  },
  tipsCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
});
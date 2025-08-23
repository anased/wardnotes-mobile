// src/screens/flashcards/StudyScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMobileStudySession } from '../../hooks/useStudySession';
import { useDeck } from '../../hooks/useDecks';
import FlashcardView from '../../components/flashcards/FlashcardView';
import type { StudyScreenRouteProp, MainTabNavigationProp } from '../../types/navigation';
import type { ReviewQuality, MobileStudyMode } from '../../types/flashcard';

export default function StudyScreen() {
  const navigation = useNavigation<MainTabNavigationProp>();
  const route = useRoute<StudyScreenRouteProp>();
  const { deckId, mode = 'mixed' } = route.params;
  
  const { deck } = useDeck(deckId);
  const {
    mobileSession,
    currentCard,
    showAnswer,
    sessionStats,
    progress,
    loading,
    error,
    isSessionComplete,
    startMobileSession,
    showCardAnswer,
    submitCardReview,
    endMobileSession
  } = useMobileStudySession();

  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (deck && !hasStarted && !loading) {
      const studyMode: MobileStudyMode = {
        mode,
        card_limit: mode === 'new' ? 10 : mode === 'review' ? 30 : 20,
      };
      
      startMobileSession(deckId, studyMode)
        .then(() => setHasStarted(true))
        .catch((err) => {
          Alert.alert('Error', err.message, [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        });
    }
  }, [deck, hasStarted, loading, startMobileSession, deckId, mode, navigation]);

  const handleShowAnswer = () => {
    showCardAnswer();
  };

  const handleSubmitReview = async (quality: ReviewQuality) => {
    if (!currentCard) return;
    
    try {
      await submitCardReview(quality);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
    }
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Study Session',
      'Are you sure you want to end this study session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => {
            endMobileSession();
            navigation.goBack();
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleEndSession}>
        <Text style={styles.backButtonText}>✕</Text>
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.deckName}>{deck?.name}</Text>
        <Text style={styles.progressText}>
          {progress.current} / {progress.total}
        </Text>
      </View>
      
      <View style={styles.headerRight}>
        <Text style={styles.accuracyText}>
          {sessionStats.accuracy.toFixed(0)}%
        </Text>
      </View>
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressBarContainer}>
      <View 
        style={[
          styles.progressBar, 
          { width: `${progress.percentage}%` }
        ]} 
      />
    </View>
  );

  const renderSessionComplete = () => (
    <View style={styles.completionContainer}>
      <Text style={styles.completionTitle}>Study Session Complete!</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{sessionStats.totalCards}</Text>
          <Text style={styles.statLabel}>Cards Studied</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {sessionStats.correctCards}
          </Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>
            {sessionStats.accuracy.toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
      </View>

      <View style={styles.sessionBreakdown}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownValue}>{sessionStats.newCards}</Text>
          <Text style={styles.breakdownLabel}>New Cards</Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownValue}>{sessionStats.reviewCards}</Text>
          <Text style={styles.breakdownLabel}>Review Cards</Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownValue}>{sessionStats.learningCards}</Text>
          <Text style={styles.breakdownLabel}>Learning</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !hasStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading study session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isSessionComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderSessionComplete()}
      </SafeAreaView>
    );
  }

  if (!currentCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No cards available for study</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      {renderProgressBar()}
      
      <FlashcardView
        flashcard={currentCard}
        showAnswer={showAnswer}
        onShowAnswer={handleShowAnswer}
        onSubmitReview={handleSubmitReview}
      />
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  deckName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
  },
  headerRight: {
    alignItems: 'center',
    minWidth: 40,
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 32,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  sessionBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  doneButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
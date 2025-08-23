// src/components/flashcards/FlashcardView.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import type { Flashcard, ReviewQuality } from '../../types/flashcard';

interface FlashcardViewProps {
  flashcard: Flashcard;
  showAnswer: boolean;
  onShowAnswer: () => void;
  onSubmitReview: (quality: ReviewQuality) => void;
  isLoading?: boolean;
  clozeNumber?: number;
}

const { width } = Dimensions.get('window');

export default function FlashcardView({ 
  flashcard, 
  showAnswer, 
  onShowAnswer, 
  onSubmitReview, 
  isLoading = false,
  clozeNumber = 1 
}: FlashcardViewProps) {
  
  const renderClozeCard = () => {
    if (!flashcard.cloze_content) return null;
    
    if (showAnswer) {
      // Show with all answers filled in - simple text version for mobile
      const withAnswers = flashcard.cloze_content.replace(
        /\{\{c(\d+)::(.*?)(?:::.*?)?\}\}/g, 
        '$2'
      );
      
      return (
        <Text style={styles.cardContent}>
          {withAnswers}
        </Text>
      );
    } else {
      // Show with only the specific cloze number hidden
      let processedContent = flashcard.cloze_content;
      
      // First, fill in all OTHER cloze deletions (not the current one being tested)
      processedContent = processedContent.replace(
        /\{\{c(\d+)::(.*?)(?:::.*?)?\}\}/g, 
        (match, clozeNum, content) => {
          if (parseInt(clozeNum) === clozeNumber) {
            // This is the cloze being tested - keep it as placeholder for now
            return match;
          } else {
            // This is a different cloze - show the answer
            return content;
          }
        }
      );
      
      // Now replace the specific cloze being tested with a blank
      processedContent = processedContent.replace(
        new RegExp(`\\{\\{c${clozeNumber}::(.*?)(?:::.*?)?\\}\\}`, 'g'),
        '[...]'
      );
      
      return (
        <Text style={styles.cardContent}>
          {processedContent}
        </Text>
      );
    }
  };

  const renderFrontBackCard = () => {
    return (
      <View style={styles.frontBackContainer}>
        {showAnswer ? (
          <View>
            <View style={styles.questionContainer}>
              <Text style={styles.sectionLabel}>Question:</Text>
              <Text style={styles.cardContent}>{flashcard.front_content}</Text>
            </View>
            <View style={styles.answerContainer}>
              <Text style={styles.sectionLabel}>Answer:</Text>
              <Text style={styles.cardContent}>{flashcard.back_content}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.cardContent}>{flashcard.front_content}</Text>
        )}
      </View>
    );
  };

  const renderReviewButtons = () => {
    if (!showAnswer) return null;

    const buttons = [
      { quality: 0 as ReviewQuality, text: 'Again', color: '#ef4444' },
      { quality: 1 as ReviewQuality, text: 'Hard', color: '#f97316' },
      { quality: 3 as ReviewQuality, text: 'Good', color: '#10b981' },
      { quality: 4 as ReviewQuality, text: 'Easy', color: '#3b82f6' },
    ];

    return (
      <View style={styles.reviewButtons}>
        <Text style={styles.reviewPrompt}>How well did you know this?</Text>
        <View style={styles.buttonGrid}>
          {buttons.map((button) => (
            <TouchableOpacity
              key={button.quality}
              style={[styles.reviewButton, { backgroundColor: button.color }]}
              onPress={() => onSubmitReview(button.quality)}
              disabled={isLoading}
            >
              <Text style={styles.reviewButtonText}>{button.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Card Content */}
      <View style={styles.cardContainer}>
        <View style={styles.cardContentContainer}>
          {flashcard.card_type === 'cloze' ? renderClozeCard() : renderFrontBackCard()}
        </View>

        {/* Card Info */}
        <View style={styles.cardInfo}>
          {flashcard.card_type === 'cloze' && (
            <Text style={styles.clozeInfo}>Testing cloze #{clozeNumber}</Text>
          )}
          <View style={styles.statsRow}>
            <Text style={styles.statText}>Reviews: {flashcard.total_reviews}</Text>
            <Text style={styles.statText}>
              Accuracy: {flashcard.total_reviews > 0 ? Math.round((flashcard.correct_reviews / flashcard.total_reviews) * 100) : 0}%
            </Text>
            <Text style={styles.statText}>Ease: {flashcard.ease_factor.toFixed(1)}</Text>
          </View>
        </View>

        {/* Action Button or Review Buttons */}
        {!showAnswer ? (
          <TouchableOpacity
            style={styles.showAnswerButton}
            onPress={onShowAnswer}
            disabled={isLoading}
          >
            <Text style={styles.showAnswerButtonText}>Show Answer</Text>
          </TouchableOpacity>
        ) : (
          renderReviewButtons()
        )}

        {/* Keyboard Shortcuts Help */}
        <Text style={styles.helpText}>
          {!showAnswer ? 'Tap to show answer' : 'Rate your performance above'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  cardContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  cardContent: {
    fontSize: 18,
    lineHeight: 28,
    color: '#111827',
    textAlign: 'center',
  },
  frontBackContainer: {
    width: '100%',
  },
  questionContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  answerContainer: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardInfo: {
    alignItems: 'center',
    marginVertical: 20,
  },
  clozeInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  showAnswerButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  showAnswerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewButtons: {
    marginBottom: 12,
  },
  reviewPrompt: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reviewButton: {
    width: (width - 80) / 2 - 6,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
// LearningQuestionsSection - Collapsible section for asking clinical learning questions
// Integrated into CreateNoteScreen and EditNoteScreen

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuota } from '../../hooks/useQuota';
import { useSubscription } from '../../hooks/useSubscription';
import InlineQuotaIndicator from '../premium/InlineQuotaIndicator';
import { answerLearningQuestions } from '../../services/learningQuestions';
import { formatAnswersToTipTap } from '../../utils/learningQuestionsFormatter';
import type { TipTapNode } from '../../utils/tiptapConverter';
import type { LearningQuestionsStatus, LearningQuestionsError } from '../../types/learningQuestions';

interface LearningQuestionsSectionProps {
  onAnswersGenerated: (content: TipTapNode[]) => void;
}

const MAX_CLINICAL_CONTEXT_LENGTH = 2000;
const MAX_QUESTIONS = 5;

export default function LearningQuestionsSection({
  onAnswersGenerated,
}: LearningQuestionsSectionProps) {
  // Collapsible state
  const [isExpanded, setIsExpanded] = useState(false);

  // Form state
  const [clinicalContext, setClinicalContext] = useState('');
  const [questions, setQuestions] = useState<string[]>(['']);

  // Status state - explicitly typed to include all possible states
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  // Hooks
  const { quota, refreshQuota, canUseFeature, getRemainingUses } = useQuota();
  const { isPremium, redirectToCheckout } = useSubscription();

  // Validation
  const validQuestions = questions.filter(q => q.trim().length > 0);
  const hasValidInput = clinicalContext.trim().length > 0 && validQuestions.length > 0;
  const isLoading = status === 'loading';
  const canSubmit = hasValidInput && !isLoading;

  // Handlers
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleQuestionChange = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = text;
    setQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    if (questions.length < MAX_QUESTIONS) {
      setQuestions([...questions, '']);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Check quota before making request
    if (!canUseFeature('note_improvement')) {
      const daysRemaining = quota?.period.daysRemaining || 0;
      const limit = quota?.note_improvement.limit || 2;

      Alert.alert(
        'Monthly Limit Reached',
        `You've used all ${limit} free uses this month. Your quota resets in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.\n\nUpgrade to Premium for unlimited access.`,
        [
          {
            text: 'Upgrade to Premium',
            onPress: async () => {
              try {
                await redirectToCheckout();
              } catch (err) {
                Alert.alert('Error', 'Failed to start upgrade process');
              }
            },
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
      return;
    }

    try {
      setStatus('loading');
      setError('');

      const response = await answerLearningQuestions(clinicalContext, validQuestions);

      // Format answers to TipTap content
      const formattedContent = formatAnswersToTipTap(clinicalContext, response.answers);

      // Refresh quota after successful generation
      await refreshQuota();

      // Notify parent to insert content
      onAnswersGenerated(formattedContent);

      // Reset form and collapse
      setClinicalContext('');
      setQuestions(['']);
      setIsExpanded(false);
      setStatus('success');

      // Show success message with remaining uses
      const remaining = getRemainingUses('note_improvement');
      const remainingText = remaining !== null && !isPremium
        ? `\n\nYou have ${remaining} free use${remaining !== 1 ? 's' : ''} remaining this month.`
        : '';

      Alert.alert(
        'Success!',
        `Your questions have been answered and added to the note.${remainingText}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('Error generating answers:', err);

      // Handle quota exceeded error
      if (err.type === 'quota_exceeded') {
        const daysRemaining = err.quota?.period?.daysRemaining || quota?.period.daysRemaining || 0;

        Alert.alert(
          'Monthly Limit Reached',
          err.message + `\n\nYour quota resets in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`,
          [
            {
              text: 'Upgrade to Premium',
              onPress: async () => {
                try {
                  await redirectToCheckout();
                } catch (checkoutErr) {
                  Alert.alert('Error', 'Failed to start upgrade process');
                }
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }

      setError(err.message || 'Failed to generate answers. Please try again.');
      setStatus('error');
    }
  };

  const handleRetry = () => {
    setError('');
    setStatus('idle');
  };

  return (
    <View style={styles.container}>
      {/* Collapsible Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name="bulb-outline"
            size={20}
            color="#0ea5e9"
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>Learn from an encounter</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6b7280"
        />
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Clinical Context Input */}
          <View style={styles.field}>
            <Text style={styles.label}>Clinical Context</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              placeholder="Describe the clinical encounter (e.g., 65-year-old patient with newly diagnosed glioma presenting with headaches...)"
              placeholderTextColor="#9ca3af"
              value={clinicalContext}
              onChangeText={setClinicalContext}
              maxLength={MAX_CLINICAL_CONTEXT_LENGTH}
              editable={status !== 'loading'}
            />
            <Text style={styles.charCount}>
              {clinicalContext.length}/{MAX_CLINICAL_CONTEXT_LENGTH}
            </Text>
          </View>

          {/* Questions Input */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Learning Questions ({validQuestions.length}/{MAX_QUESTIONS})
            </Text>
            {questions.map((question, index) => (
              <View key={index} style={styles.questionRow}>
                <Text style={styles.questionNumber}>{index + 1}.</Text>
                <TextInput
                  style={styles.questionInput}
                  placeholder="e.g., What are the radiological features of glioma?"
                  placeholderTextColor="#9ca3af"
                  value={question}
                  onChangeText={(text) => handleQuestionChange(index, text)}
                  editable={status !== 'loading'}
                  maxLength={500}
                />
                {questions.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveQuestion(index)}
                    disabled={isLoading}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {questions.length < MAX_QUESTIONS && (
              <TouchableOpacity
                style={styles.addQuestionButton}
                onPress={handleAddQuestion}
                disabled={isLoading}
              >
                <Ionicons name="add-circle-outline" size={18} color="#0ea5e9" />
                <Text style={styles.addQuestionText}>Add question</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleRetry}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                !canSubmit && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>Generating...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="flash" size={18} color="#fff" />
                  <Text style={styles.submitButtonText}>Answer My Questions</Text>
                </>
              )}
            </TouchableOpacity>
            <InlineQuotaIndicator featureType="note_improvement" />
          </View>

          {/* Loading overlay description */}
          {isLoading && (
            <Text style={styles.loadingHint}>
              AI is analyzing your clinical context and generating evidence-based answers...
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#eff6ff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  content: {
    padding: 12,
    paddingTop: 8,
    backgroundColor: '#f8fafc',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 8,
    width: 20,
  },
  questionInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  addQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  addQuestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0ea5e9',
    marginLeft: 6,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  retryText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  submitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingHint: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});

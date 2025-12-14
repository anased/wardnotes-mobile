// Main modal for AI flashcard generation
// Orchestrates the configuration -> generation -> preview -> save flow

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { FlashcardService } from '../../services/flashcardService';
import * as FlashcardGenerationService from '../../services/flashcardGeneration';
import type { FlashcardDeck } from '../../types/flashcard';
import type {
  PreviewCard,
  GenerationStatus,
  FlashcardType,
} from '../../types/flashcardGeneration';
import DeckCreationModal from './DeckCreationModal';
import FlashcardPreviewScreen from './FlashcardPreviewScreen';
import { useQuota } from '../../hooks/useQuota';
import { useSubscription } from '../../hooks/useSubscription';
import InlineQuotaIndicator from '../premium/InlineQuotaIndicator';

interface FlashcardGeneratorModalProps {
  visible: boolean;
  noteId: string;
  noteTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ADD_NEW_DECK = '__ADD_NEW_DECK__';

export default function FlashcardGeneratorModal({
  visible,
  noteId,
  noteTitle,
  onClose,
  onSuccess,
}: FlashcardGeneratorModalProps) {
  // Quota and subscription hooks
  const { quota, refreshQuota, getRemainingUses } = useQuota();
  const { isPremium, redirectToCheckout } = useSubscription();

  // Configuration state
  const [cardType, setCardType] = useState<FlashcardType>('cloze');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [maxCards, setMaxCards] = useState<number>(10);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [decksLoading, setDecksLoading] = useState(true);

  // Generation state
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [previewCards, setPreviewCards] = useState<PreviewCard[]>([]);
  const [error, setError] = useState<string>('');

  // Modals
  const [showDeckCreationModal, setShowDeckCreationModal] = useState(false);
  const [showCardTypePicker, setShowCardTypePicker] = useState(false);
  const [showDeckPicker, setShowDeckPicker] = useState(false);

  // Load decks when modal opens
  useEffect(() => {
    if (visible) {
      loadDecks();
      resetState();
    }
  }, [visible]);

  const loadDecks = async () => {
    try {
      setDecksLoading(true);
      const decksData = await FlashcardService.getDecks();
      setDecks(decksData);

      // Auto-select default deck or first deck
      if (decksData.length > 0) {
        const defaultDeck =
          decksData.find((d) => d.name === 'Default Deck') || decksData[0];
        setSelectedDeckId(defaultDeck.id);
      }
    } catch (err) {
      console.error('Failed to load decks:', err);
      setError('Failed to load decks. Please try again.');
    } finally {
      setDecksLoading(false);
    }
  };

  const resetState = () => {
    setStatus('idle');
    setError('');
    setPreviewCards([]);
    setCardType('cloze');
    setMaxCards(10);
  };

  const handleGenerate = async () => {
    if (!selectedDeckId) {
      Alert.alert(
        'Deck Required',
        decks.length === 0
          ? 'Please create a deck first.'
          : 'Please select a deck.'
      );
      return;
    }

    try {
      setStatus('loading');
      setError('');

      const generatedCards = await FlashcardGenerationService.generateFlashcardsPreview(
        noteId,
        cardType,
        selectedDeckId,
        maxCards
      );

      // Convert to PreviewCard format with selection state
      const cardsWithState: PreviewCard[] = generatedCards.map((card, index) => ({
        ...card,
        id: `preview-${index}`,
        isSelected: true, // All cards selected by default
        isEdited: false,
      }));

      setPreviewCards(cardsWithState);
      setStatus('preview');
    } catch (err: any) {
      console.error('Error generating flashcards:', err);

      // Check if it's a quota exceeded error (429)
      if (err.message?.includes('Quota exceeded') || err.type === 'quota_exceeded' || err.status === 429) {
        const daysRemaining = quota?.period.daysRemaining || 0;
        const limit = quota?.flashcard_generation.limit || 3;

        Alert.alert(
          'Monthly Limit Reached',
          `You've used all ${limit} free flashcard generations this month. Your quota resets in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`,
          [
            {
              text: 'Upgrade to Premium',
              onPress: async () => {
                try {
                  await redirectToCheckout();
                } catch (error) {
                  Alert.alert('Error', 'Failed to start upgrade process');
                }
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );

        setError('Monthly flashcard generation limit reached.');
      } else {
        setError(err.message || 'Failed to generate flashcards. Please try again.');
      }

      setStatus('error');
    }
  };

  const handleSaveSelected = async () => {
    const selectedCards = previewCards.filter((c) => c.isSelected);

    if (selectedCards.length === 0) {
      Alert.alert('No Cards Selected', 'Please select at least one card to save.');
      return;
    }

    try {
      setStatus('saving');
      setError('');

      // Convert back to GeneratedCard format (remove selection state)
      const cardsToSave = selectedCards.map((card) => ({
        front: card.front,
        back: card.back,
        cloze: card.cloze,
      }));

      await FlashcardGenerationService.saveFlashcards(
        cardsToSave,
        noteId,
        selectedDeckId,
        cardType
      );

      // Refresh quota to show updated usage
      await refreshQuota();

      setStatus('success');

      // Get remaining uses for success message
      const remaining = getRemainingUses('flashcard_generation');
      const remainingText = remaining !== null
        ? `\n\nYou have ${remaining} free generation${remaining !== 1 ? 's' : ''} remaining this month.`
        : '';

      // Show success message
      Alert.alert(
        'Success!',
        `${selectedCards.length} flashcard${
          selectedCards.length === 1 ? '' : 's'
        } saved successfully.${!isPremium ? remainingText : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Error saving flashcards:', err);
      setError(err.message || 'Failed to save flashcards. Please try again.');
      setStatus('error');
    }
  };

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate Cards?',
      'This will generate a new set of flashcards. Current preview will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: handleGenerate,
        },
      ]
    );
  };

  const handleDeckChange = (value: string) => {
    if (value === ADD_NEW_DECK) {
      setShowDeckCreationModal(true);
    } else {
      setSelectedDeckId(value);
    }
  };

  const handleDeckCreated = async (deckId: string, deckName: string) => {
    await loadDecks();
    setSelectedDeckId(deckId);
  };

  const handleClose = () => {
    if (status === 'loading' || status === 'saving') {
      Alert.alert(
        'Operation in Progress',
        'Please wait for the current operation to complete.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (previewCards.length > 0 && status !== 'success') {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved flashcards. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  const renderConfigurationScreen = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>

        {/* Card Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Card Type</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowCardTypePicker(true)}
          >
            <Text style={styles.selectorButtonText}>
              {cardType === 'cloze' ? 'Cloze Deletion' : 'Front & Back'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.hint}>
            {cardType === 'cloze'
              ? 'Creates cards with hidden text for active recall'
              : 'Creates traditional question and answer cards'}
          </Text>
        </View>

        {/* Deck Selection */}
        <View style={styles.field}>
          <Text style={styles.label}>Target Deck</Text>
          {decksLoading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowDeckPicker(true)}
                disabled={decks.length === 0}
              >
                <Text
                  style={[
                    styles.selectorButtonText,
                    !selectedDeckId && styles.selectorButtonPlaceholder,
                  ]}
                >
                  {selectedDeckId
                    ? decks.find((d) => d.id === selectedDeckId)?.name || 'Select a deck...'
                    : decks.length === 0
                    ? 'No decks yet - create one'
                    : 'Select a deck...'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>

              {decks.length === 0 && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                  <Text style={styles.warningText}>
                    No decks available. Create your first deck below.
                  </Text>
                </View>
              )}

              {/* Quick Create Deck Button */}
              <TouchableOpacity
                style={styles.createDeckButton}
                onPress={() => setShowDeckCreationModal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#0ea5e9" />
                <Text style={styles.createDeckButtonText}>Create New Deck</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Max Cards */}
        <View style={styles.field}>
          <Text style={styles.label}>Number of Cards</Text>
          <View style={styles.maxCardsControls}>
            <TouchableOpacity
              style={[styles.maxCardsButton, maxCards <= 1 && styles.maxCardsButtonDisabled]}
              onPress={() => setMaxCards(Math.max(1, maxCards - 1))}
              disabled={maxCards <= 1}
            >
              <Text style={[styles.maxCardsButtonText, maxCards <= 1 && styles.maxCardsButtonTextDisabled]}>−</Text>
            </TouchableOpacity>

            <View style={styles.maxCardsDisplay}>
              <Text style={styles.maxCardsDisplayText}>{maxCards}</Text>
            </View>

            <TouchableOpacity
              style={[styles.maxCardsButton, maxCards >= 50 && styles.maxCardsButtonDisabled]}
              onPress={() => setMaxCards(Math.min(50, maxCards + 1))}
              disabled={maxCards >= 50}
            >
              <Text style={[styles.maxCardsButtonText, maxCards >= 50 && styles.maxCardsButtonTextDisabled]}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Range: 1-50 cards. Recommended: 10-20 per note</Text>
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[
          styles.generateButton,
          (!selectedDeckId || decksLoading) && styles.generateButtonDisabled,
        ]}
        onPress={handleGenerate}
        disabled={!selectedDeckId || decksLoading}
      >
        <Text style={styles.generateButtonIcon}>✨</Text>
        <Text style={styles.generateButtonText}>Generate Flashcards</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderLoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0ea5e9" />
      <Text style={styles.loadingText}>Generating flashcards...</Text>
      <Text style={styles.loadingSubtext}>
        AI is analyzing your note and creating {maxCards} {cardType} cards
      </Text>
    </View>
  );

  const renderErrorScreen = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>❌</Text>
      <Text style={styles.errorTitle}>Generation Failed</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleGenerate}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={() => setStatus('idle')}>
        <Text style={styles.backButtonText}>Back to Configuration</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.headerTitle}>Generate Flashcards</Text>
                {!isPremium && quota && (
                  <InlineQuotaIndicator featureType="flashcard_generation" />
                )}
              </View>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {noteTitle}
              </Text>
            </View>
          </View>
        </View>

        {/* Content based on status */}
        {status === 'idle' && renderConfigurationScreen()}
        {status === 'loading' && renderLoadingScreen()}
        {status === 'error' && renderErrorScreen()}
        {(status === 'preview' || status === 'saving') && (
          <FlashcardPreviewScreen
            cards={previewCards}
            cardType={cardType}
            loading={status === 'saving'}
            onCardsChange={setPreviewCards}
            onSaveSelected={handleSaveSelected}
            onRegenerate={handleRegenerate}
          />
        )}

        {/* Card Type Picker Modal */}
        <Modal
          visible={showCardTypePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCardTypePicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => setShowCardTypePicker(false)}
            />
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowCardTypePicker(false)}>
                  <Text style={styles.pickerModalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerModalTitle}>Select Card Type</Text>
                <TouchableOpacity onPress={() => setShowCardTypePicker(false)}>
                  <Text style={styles.pickerModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={cardType}
                onValueChange={(value) => setCardType(value as FlashcardType)}
              >
                <Picker.Item label="Cloze Deletion" value="cloze" />
                <Picker.Item label="Front & Back" value="front_back" />
              </Picker>
            </View>
          </View>
        </Modal>

        {/* Deck Picker Modal */}
        <Modal
          visible={showDeckPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDeckPicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => setShowDeckPicker(false)}
            />
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowDeckPicker(false)}>
                  <Text style={styles.pickerModalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerModalTitle}>Select Deck</Text>
                <TouchableOpacity onPress={() => setShowDeckPicker(false)}>
                  <Text style={styles.pickerModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={selectedDeckId}
                onValueChange={(value) => {
                  if (value === ADD_NEW_DECK) {
                    setShowDeckPicker(false);
                    setShowDeckCreationModal(true);
                  } else {
                    setSelectedDeckId(value);
                  }
                }}
              >
                {decks.length === 0 && (
                  <Picker.Item label="No decks available" value="" />
                )}
                {decks.map((deck) => (
                  <Picker.Item key={deck.id} label={deck.name} value={deck.id} />
                ))}
                <Picker.Item label="+ Create New Deck" value={ADD_NEW_DECK} />
              </Picker>
            </View>
          </View>
        </Modal>

        {/* Deck Creation Modal */}
        <DeckCreationModal
          visible={showDeckCreationModal}
          onClose={() => setShowDeckCreationModal(false)}
          onDeckCreated={handleDeckCreated}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  selectorButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  selectorButtonPlaceholder: {
    color: '#9ca3af',
  },
  createDeckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderStyle: 'dashed',
    backgroundColor: '#eff6ff',
    gap: 8,
  },
  createDeckButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
  },
  maxCardsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  maxCardsButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  maxCardsButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
  maxCardsButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  maxCardsButtonTextDisabled: {
    color: '#d1d5db',
  },
  maxCardsDisplay: {
    flex: 1,
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  maxCardsDisplayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  generateButtonIcon: {
    fontSize: 20,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerModalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  pickerModalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
});

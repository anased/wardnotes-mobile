// Custom study session modal with deck and tag filtering
// Allows users to create targeted study sessions with live count preview

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { FlashcardService } from '../../services/flashcardService';
import TagSelector from '../ui/TagSelector';
import type { FlashcardDeck, Flashcard } from '../../types/flashcard';

interface CustomStudyModalProps {
  visible: boolean;
  onClose: () => void;
  onStartSession: (cards: Flashcard[], deckId: string) => void;
}

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function CustomStudyModal({
  visible,
  onClose,
  onStartSession,
}: CustomStudyModalProps) {
  // Configuration state
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueOnly, setDueOnly] = useState(true);

  // Data state
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [matchingCount, setMatchingCount] = useState(0);

  // UI state
  const [decksLoading, setDecksLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [countLoading, setCountLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string>('');

  // Modals
  const [showDeckPicker, setShowDeckPicker] = useState(false);

  // Debounce filter changes for count updates (300ms)
  const debouncedSelectedTags = useDebounce(selectedTags, 300);
  const debouncedDueOnly = useDebounce(dueOnly, 300);

  // Load decks and tags when modal opens
  useEffect(() => {
    if (visible) {
      loadDecks();
      loadTags();
      resetState();
    }
  }, [visible]);

  // Update count when filters change (debounced)
  useEffect(() => {
    if (visible && selectedDeckId) {
      updateCount();
    }
  }, [visible, selectedDeckId, debouncedSelectedTags, debouncedDueOnly]);

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

  const loadTags = async () => {
    try {
      setTagsLoading(true);
      const tags = await FlashcardService.getFlashcardTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
      // Don't show error - tags are optional
    } finally {
      setTagsLoading(false);
    }
  };

  const updateCount = async () => {
    try {
      setCountLoading(true);
      const count = await FlashcardService.getCustomStudyCount(
        selectedDeckId,
        debouncedSelectedTags.length > 0 ? debouncedSelectedTags : undefined,
        debouncedDueOnly
      );
      setMatchingCount(count);
    } catch (err) {
      console.error('Failed to get card count:', err);
      // Fail silently - show 0 count
      setMatchingCount(0);
    } finally {
      setCountLoading(false);
    }
  };

  const resetState = () => {
    setSelectedTags([]);
    setDueOnly(true);
    setMatchingCount(0);
    setError('');
  };

  const handleStartSession = async () => {
    if (!selectedDeckId) {
      Alert.alert(
        'Deck Required',
        decks.length === 0
          ? 'Please create a deck first.'
          : 'Please select a deck.'
      );
      return;
    }

    if (matchingCount === 0) {
      Alert.alert(
        'No Cards Match',
        'No cards match your criteria. Try:\n• Selecting different tags\n• Unchecking "Due cards only"\n• Choosing a different deck'
      );
      return;
    }

    try {
      setStarting(true);
      setError('');

      // Fetch the actual cards
      const cards = await FlashcardService.getCustomStudyCards(
        selectedDeckId,
        selectedTags.length > 0 ? selectedTags : undefined,
        dueOnly,
        50  // Limit to 50 cards
      );

      if (cards.length === 0) {
        Alert.alert('No Cards', 'No cards available for study.');
        return;
      }

      // Start the study session
      onStartSession(cards, selectedDeckId);
      onClose();
    } catch (err: any) {
      console.error('Error starting custom study:', err);
      setError(err.message || 'Failed to start study session.');
      Alert.alert('Error', err.message || 'Failed to start study session.');
    } finally {
      setStarting(false);
    }
  };

  const handleClose = () => {
    if (starting) {
      Alert.alert(
        'Loading',
        'Please wait for the session to start.',
        [{ text: 'OK' }]
      );
      return;
    }
    onClose();
  };

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
            <Text style={styles.headerTitle}>Custom Study Session</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Study Filters</Text>

            {/* Deck Selection */}
            <View style={styles.field}>
              <Text style={styles.label}>Deck (Required)</Text>
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
                        ? 'No decks available'
                        : 'Select a deck...'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6b7280" />
                  </TouchableOpacity>

                  {decks.length === 0 && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningIcon}>⚠️</Text>
                      <Text style={styles.warningText}>
                        No decks available. Please create a deck first.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Tag Filter */}
            <View style={styles.field}>
              <Text style={styles.label}>Tags (Optional)</Text>
              {tagsLoading ? (
                <ActivityIndicator style={{ marginVertical: 20 }} />
              ) : (
                <>
                  <TagSelector
                    selectedTags={selectedTags}
                    availableTags={availableTags}
                    onTagsChange={setSelectedTags}
                    placeholder="Filter by tags (optional)"
                  />
                  <Text style={styles.hint}>
                    {selectedTags.length > 0
                      ? `Cards with ANY of these tags will be included (OR logic)`
                      : 'Leave empty to include all cards from the deck'}
                  </Text>
                </>
              )}
            </View>

            {/* Due Only Toggle */}
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Due Cards Only</Text>
                  <Text style={styles.hint}>
                    {dueOnly
                      ? 'Only cards scheduled for review today'
                      : 'Include all cards, even future ones'}
                  </Text>
                </View>
                <Switch
                  value={dueOnly}
                  onValueChange={setDueOnly}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={dueOnly ? '#0ea5e9' : '#f3f4f6'}
                />
              </View>
            </View>

            {/* Live Card Count */}
            <View style={styles.countBox}>
              <View style={styles.countHeader}>
                <Ionicons name="information-circle-outline" size={20} color="#0ea5e9" />
                <Text style={styles.countTitle}>Cards Matching Your Criteria</Text>
              </View>
              {countLoading ? (
                <ActivityIndicator size="small" color="#0ea5e9" style={{ marginTop: 8 }} />
              ) : (
                <>
                  <Text style={styles.countNumber}>{matchingCount}</Text>
                  {matchingCount > 50 && (
                    <Text style={styles.countWarning}>
                      (Maximum 50 cards per session)
                    </Text>
                  )}
                  {matchingCount === 0 && selectedDeckId && (
                    <Text style={styles.countHelp}>
                      Try adjusting your filters to find cards
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={[
              styles.startButton,
              (!selectedDeckId || matchingCount === 0 || decksLoading || starting) &&
                styles.startButtonDisabled,
            ]}
            onPress={handleStartSession}
            disabled={!selectedDeckId || matchingCount === 0 || decksLoading || starting}
          >
            {starting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="play-circle" size={20} color="#fff" />
                <Text style={styles.startButtonText}>
                  Start Study Session ({Math.min(matchingCount, 50)} cards)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

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
                onValueChange={(value) => setSelectedDeckId(value)}
              >
                {decks.length === 0 && (
                  <Picker.Item label="No decks available" value="" />
                )}
                {decks.map((deck) => (
                  <Picker.Item key={deck.id} label={deck.name} value={deck.id} />
                ))}
              </Picker>
            </View>
          </View>
        </Modal>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countBox: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
    marginTop: 8,
  },
  countHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  countTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  countNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0ea5e9',
    textAlign: 'center',
    marginVertical: 8,
  },
  countWarning: {
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  countHelp: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  startButton: {
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
  startButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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

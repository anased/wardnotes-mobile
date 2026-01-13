// Manual flashcard creation modal - simple button approach without text selection
// Allows users to manually create flashcards from notes with auto tag inheritance

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
  TextInput,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { FlashcardService } from '../../services/flashcardService';
import type { FlashcardDeck } from '../../types/flashcard';
import type { FlashcardType } from '../../types/flashcardGeneration';
import DeckCreationModal from './DeckCreationModal';

interface ManualFlashcardModalProps {
  visible: boolean;
  noteId: string;
  noteTitle: string;
  noteTags: string[];  // Tags to inherit from parent note
  onClose: () => void;
  onSuccess?: () => void;
}

const ADD_NEW_DECK = '__ADD_NEW_DECK__';

export default function ManualFlashcardModal({
  visible,
  noteId,
  noteTitle,
  noteTags,
  onClose,
  onSuccess,
}: ManualFlashcardModalProps) {
  // Form state
  const [cardType, setCardType] = useState<FlashcardType>('front_back');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [frontContent, setFrontContent] = useState<string>('');
  const [backContent, setBackContent] = useState<string>('');
  const [clozeContent, setClozeContent] = useState<string>('');

  // Text selection state for cloze deletion
  const [clozeSelection, setClozeSelection] = useState({ start: 0, end: 0 });

  // UI state
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [decksLoading, setDecksLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  // Modals
  const [showCardTypePicker, setShowCardTypePicker] = useState(false);
  const [showDeckPicker, setShowDeckPicker] = useState(false);
  const [showDeckCreationModal, setShowDeckCreationModal] = useState(false);

  // Load decks when modal opens
  useEffect(() => {
    if (visible) {
      loadDecks();
      resetForm();
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

  const resetForm = () => {
    setCardType('front_back');
    setFrontContent('');
    setBackContent('');
    setClozeContent('');
    setClozeSelection({ start: 0, end: 0 });
    setError('');
  };

  const handleMakeCloze = () => {
    const { start, end } = clozeSelection;

    // No text selected
    if (start === end) {
      Alert.alert('No Selection', 'Please select text to make a cloze deletion.');
      return;
    }

    // Get the selected text
    const selectedText = clozeContent.substring(start, end);

    // Count existing cloze deletions to determine the next number
    const existingClozes = clozeContent.match(/{{c(\d+)::/g) || [];
    const maxNumber = existingClozes.reduce((max, match) => {
      const num = parseInt(match.match(/\d+/)?.[0] || '0');
      return Math.max(max, num);
    }, 0);
    const nextNumber = maxNumber + 1;

    // Create the cloze deletion
    const clozeWrapper = `{{c${nextNumber}::${selectedText}}}`;

    // Replace the selected text with the cloze deletion
    const newContent =
      clozeContent.substring(0, start) +
      clozeWrapper +
      clozeContent.substring(end);

    setClozeContent(newContent);

    // Reset selection
    setClozeSelection({ start: 0, end: 0 });
  };

  const validateForm = (): boolean => {
    if (!selectedDeckId) {
      Alert.alert(
        'Deck Required',
        decks.length === 0
          ? 'Please create a deck first.'
          : 'Please select a deck.'
      );
      return false;
    }

    if (cardType === 'cloze') {
      if (!clozeContent.trim()) {
        Alert.alert('Content Required', 'Please enter cloze content.');
        return false;
      }
    } else {
      if (!frontContent.trim()) {
        Alert.alert('Content Required', 'Please enter front content.');
        return false;
      }
      if (!backContent.trim()) {
        Alert.alert('Content Required', 'Please enter back content.');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      await FlashcardService.createManualFlashcard(
        noteId,
        selectedDeckId,
        cardType,
        frontContent.trim() || undefined,
        backContent.trim() || undefined,
        clozeContent.trim() || undefined,
        noteTags  // Inherit tags from parent note
      );

      Alert.alert(
        'Success!',
        'Flashcard created successfully.',
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
      console.error('Error saving flashcard:', err);
      setError(err.message || 'Failed to save flashcard. Please try again.');
      Alert.alert('Error', err.message || 'Failed to save flashcard.');
    } finally {
      setSaving(false);
    }
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
    const hasContent =
      frontContent.trim() || backContent.trim() || clozeContent.trim();

    if (hasContent && !saving) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved content. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
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
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Create Flashcard</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {noteTitle}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
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

            {/* Content Input Fields */}
            {cardType === 'cloze' ? (
              <View style={styles.field}>
                <Text style={styles.label}>Cloze Content</Text>

                {/* Make Cloze Button - always visible in cloze mode, above textarea */}
                <TouchableOpacity
                  style={[
                    styles.makeClozeButton,
                    clozeSelection.start === clozeSelection.end && styles.makeClozeButtonDisabled
                  ]}
                  onPress={handleMakeCloze}
                  disabled={clozeSelection.start === clozeSelection.end}
                >
                  <Ionicons name="eye-off-outline" size={18} color="#ffffff" />
                  <Text style={styles.makeClozeButtonText}>
                    Make Cloze Deletion
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.textInput}
                  placeholder="Enter text with {{c1::hidden content}} syntax..."
                  placeholderTextColor="#9ca3af"
                  value={clozeContent}
                  onChangeText={setClozeContent}
                  onSelectionChange={(e) =>
                    setClozeSelection(e.nativeEvent.selection)
                  }
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />

                <Text style={styles.hint}>
                  Select text and tap "Make Cloze Deletion" or manually use syntax: {'{'}{'{'} c1::answer {'}'}{'}'}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Front (Question)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter the question or prompt..."
                    placeholderTextColor="#9ca3af"
                    value={frontContent}
                    onChangeText={setFrontContent}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Back (Answer)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter the answer..."
                    placeholderTextColor="#9ca3af"
                    value={backContent}
                    onChangeText={setBackContent}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}

            {/* Tag Inheritance Info */}
            {noteTags && noteTags.length > 0 && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#0ea5e9" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoText}>
                    This flashcard will inherit {noteTags.length} tag{noteTags.length !== 1 ? 's' : ''} from the note
                  </Text>
                  <View style={styles.tagsPreview}>
                    {noteTags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.tagChip}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                    {noteTags.length > 3 && (
                      <Text style={styles.tagMore}>+{noteTags.length - 3} more</Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!selectedDeckId || decksLoading || saving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!selectedDeckId || decksLoading || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Flashcard</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

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
                <Picker.Item label="Front & Back" value="front_back" />
                <Picker.Item label="Cloze Deletion" value="cloze" />
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
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
    minHeight: 100,
  },
  makeClozeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  makeClozeButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  makeClozeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    fontStyle: 'italic',
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 8,
  },
  tagsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  tagText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '500',
  },
  tagMore: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
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

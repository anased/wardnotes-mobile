// Inline deck creation modal for flashcard generator
// Allows users to create a new deck without leaving the generator

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FlashcardService } from '../../services/flashcardService';

interface DeckCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onDeckCreated: (deckId: string, deckName: string) => void;
}

const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Yellow', value: '#F59E0B' },
];

export default function DeckCreationModal({
  visible,
  onClose,
  onDeckCreated,
}: DeckCreationModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      setError('Deck name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const newDeck = await FlashcardService.createDeck(
        name.trim(),
        description.trim() || undefined,
        selectedColor
      );

      // Reset form
      setName('');
      setDescription('');
      setSelectedColor(PRESET_COLORS[0].value);

      // Notify parent
      onDeckCreated(newDeck.id, newDeck.name);
      onClose();
    } catch (err) {
      console.error('Error creating deck:', err);
      setError(err instanceof Error ? err.message : 'Failed to create deck');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setDescription('');
      setSelectedColor(PRESET_COLORS[0].value);
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modal}>
          <ScrollView
            style={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Create New Deck</Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <View style={styles.field}>
              <Text style={styles.label}>Deck Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Cardiology, Anatomy, etc."
                value={name}
                onChangeText={setName}
                editable={!loading}
                maxLength={100}
                autoFocus
              />
            </View>

            {/* Description Input */}
            <View style={styles.field}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What topics does this deck cover?"
                value={description}
                onChangeText={setDescription}
                editable={!loading}
                maxLength={500}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Color Picker */}
            <View style={styles.field}>
              <Text style={styles.label}>Deck Color</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color.value}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color.value },
                      selectedColor === color.value && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color.value)}
                    disabled={loading}
                  >
                    {selectedColor === color.value && (
                      <Text style={styles.colorCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleCreate}
                disabled={loading || !name.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createButtonText}>Create Deck</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
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
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#1f2937',
  },
  colorCheckmark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  createButton: {
    backgroundColor: '#0ea5e9',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

// Modal for editing flashcard content before saving
// Supports both cloze deletion and front/back card types

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { PreviewCard } from '../../types/flashcardGeneration';

interface FlashcardEditModalProps {
  visible: boolean;
  card: PreviewCard | null;
  cardType: 'cloze' | 'front_back';
  onClose: () => void;
  onSave: (editedCard: PreviewCard) => void;
}

export default function FlashcardEditModal({
  visible,
  card,
  cardType,
  onClose,
  onSave,
}: FlashcardEditModalProps) {
  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [clozeContent, setClozeContent] = useState('');

  // Initialize form when card changes
  useEffect(() => {
    if (card) {
      if (cardType === 'cloze') {
        setClozeContent(card.cloze || '');
      } else {
        setFrontContent(card.front || '');
        setBackContent(card.back || '');
      }
    }
  }, [card, cardType]);

  const handleSave = () => {
    if (!card) return;

    const editedCard: PreviewCard = {
      ...card,
      isEdited: true,
    };

    if (cardType === 'cloze') {
      editedCard.cloze = clozeContent.trim();
    } else {
      editedCard.front = frontContent.trim();
      editedCard.back = backContent.trim();
    }

    onSave(editedCard);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setFrontContent('');
    setBackContent('');
    setClozeContent('');
    onClose();
  };

  const isValid = () => {
    if (cardType === 'cloze') {
      return clozeContent.trim().length > 0;
    } else {
      return frontContent.trim().length > 0 && backContent.trim().length > 0;
    }
  };

  if (!card) return null;

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
              <Text style={styles.title}>Edit Flashcard</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Card Type Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {cardType === 'cloze'
                  ? '💡 Cloze deletion: Use {{c1::text}} to mark hidden text'
                  : '💡 Front & Back: Question on front, answer on back'}
              </Text>
            </View>

            {/* Cloze Card Editor */}
            {cardType === 'cloze' && (
              <View style={styles.field}>
                <Text style={styles.label}>Cloze Content</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={clozeContent}
                  onChangeText={setClozeContent}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  placeholder="The {{c1::mitral valve}} is located between the left atrium and left ventricle."
                  autoFocus
                />
                <Text style={styles.hint}>
                  Use {'{'}
                  {'{'}c1::word{'}}'}
                  {'}'} format to create cloze deletions
                </Text>
              </View>
            )}

            {/* Front/Back Card Editor */}
            {cardType === 'front_back' && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Front (Question)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={frontContent}
                    onChangeText={setFrontContent}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholder="What is the function of the mitral valve?"
                    autoFocus
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Back (Answer)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={backContent}
                    onChangeText={setBackContent}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholder="The mitral valve prevents backflow of blood..."
                  />
                </View>
              </>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  !isValid() && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!isValid()}
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    !isValid() && styles.saveButtonTextDisabled,
                  ]}
                >
                  Save Changes
                </Text>
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
    maxHeight: '90%',
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
    marginBottom: 16,
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
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  infoText: {
    fontSize: 14,
    color: '#0369a1',
    lineHeight: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
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
    minHeight: 100,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    fontStyle: 'italic',
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
  saveButton: {
    backgroundColor: '#10b981',
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  saveButtonTextDisabled: {
    color: '#9ca3af',
  },
});

// src/screens/flashcards/CreateCardScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDecks } from '../../hooks/useDecks';
import { FlashcardService } from '../../services/flashcardService';
import type { CreateCardRouteProp, MainTabNavigationProp } from '../../types/navigation';
import type { FlashcardType } from '../../types/flashcard';

export default function CreateCardScreen() {
  const navigation = useNavigation<MainTabNavigationProp>();
  const route = useRoute<CreateCardRouteProp>();
  const { deckId } = route.params;
  
  const { decks } = useDecks();
  
  const [selectedDeckId, setSelectedDeckId] = useState(deckId || '');
  const [cardType, setCardType] = useState<FlashcardType>('front_back');
  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [clozeContent, setClozeContent] = useState('');
  const [tags, setTags] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateCard = async () => {
    if (!selectedDeckId) {
      Alert.alert('Error', 'Please select a deck');
      return;
    }

    if (cardType === 'front_back') {
      if (!frontContent.trim() || !backContent.trim()) {
        Alert.alert('Error', 'Please fill in both front and back content');
        return;
      }
    } else if (cardType === 'cloze') {
      if (!clozeContent.trim()) {
        Alert.alert('Error', 'Please enter cloze content');
        return;
      }
      if (!clozeContent.includes('{{c1::')) {
        Alert.alert('Error', 'Cloze content must include at least one cloze deletion like {{c1::answer}}');
        return;
      }
    }

    try {
      setCreating(true);
      
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await FlashcardService.createFlashcard({
        deck_id: selectedDeckId,
        card_type: cardType,
        front_content: cardType === 'front_back' ? frontContent.trim() : undefined,
        back_content: cardType === 'front_back' ? backContent.trim() : undefined,
        cloze_content: cardType === 'cloze' ? clozeContent.trim() : undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
      });

      Alert.alert('Success', 'Flashcard created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      
    } catch (error) {
      console.error('Failed to create flashcard:', error);
      Alert.alert('Error', 'Failed to create flashcard. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const selectedDeck = decks.find(deck => deck.id === selectedDeckId);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Create Flashcard</Text>
          
          <TouchableOpacity
            style={[styles.createButton, creating && styles.createButtonDisabled]}
            onPress={handleCreateCard}
            disabled={creating}
          >
            <Text style={styles.createButtonText}>
              {creating ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Deck Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Deck</Text>
            {selectedDeck ? (
              <View style={[styles.deckSelector, { borderLeftColor: selectedDeck.color }]}>
                <Text style={styles.deckName}>{selectedDeck.name}</Text>
                <TouchableOpacity 
                  style={styles.changeButton}
                  onPress={() => {
                    // In a real implementation, you'd show a deck picker modal
                    Alert.alert('Feature Coming Soon', 'Deck selection will be available soon');
                  }}
                >
                  <Text style={styles.changeButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.errorText}>No deck selected</Text>
            )}
          </View>

          {/* Card Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Card Type</Text>
            <View style={styles.cardTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.cardTypeButton,
                  cardType === 'front_back' && styles.cardTypeButtonSelected
                ]}
                onPress={() => setCardType('front_back')}
              >
                <Text style={[
                  styles.cardTypeButtonText,
                  cardType === 'front_back' && styles.cardTypeButtonTextSelected
                ]}>
                  Front/Back
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.cardTypeButton,
                  cardType === 'cloze' && styles.cardTypeButtonSelected
                ]}
                onPress={() => setCardType('cloze')}
              >
                <Text style={[
                  styles.cardTypeButtonText,
                  cardType === 'cloze' && styles.cardTypeButtonTextSelected
                ]}>
                  Cloze Deletion
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card Content */}
          {cardType === 'front_back' ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Front (Question)</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Enter the question or prompt..."
                  value={frontContent}
                  onChangeText={setFrontContent}
                  multiline
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Back (Answer)</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Enter the answer..."
                  value={backContent}
                  onChangeText={setBackContent}
                  multiline
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Cloze Content</Text>
              <Text style={styles.helpText}>
                Use {"{{c1::answer}}"} to mark cloze deletions. Example: "The capital of France is {"{{c1::Paris}}"}."
              </Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Enter text with cloze deletions..."
                value={clozeContent}
                onChangeText={setClozeContent}
                multiline
                placeholderTextColor="#9ca3af"
              />
            </View>
          )}

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter tags separated by commas..."
              value={tags}
              onChangeText={setTags}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  deckSelector: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deckName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  changeButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  cardTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  cardTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  cardTypeButtonSelected: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  cardTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  cardTypeButtonTextSelected: {
    color: '#3b82f6',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});
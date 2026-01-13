// Full screen modal for viewing and managing all flashcards in a deck or note
// Features: view all cards, edit, delete, search
// Similar to web app's FlashcardListView but adapted for mobile

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashcardService } from '../../services/flashcardService';
import type { Flashcard, FlashcardStatus } from '../../types/flashcard';

interface FlashcardListModalProps {
  visible: boolean;
  deckId?: string;
  noteId?: string;
  onClose: () => void;
  onFlashcardUpdated?: () => void;
}

interface EditingCard {
  id: string;
  cardType: 'cloze' | 'front_back';
  frontContent: string;
  backContent: string;
  clozeContent: string;
}

export default function FlashcardListModal({
  visible,
  deckId,
  noteId,
  onClose,
  onFlashcardUpdated,
}: FlashcardListModalProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCard, setEditingCard] = useState<EditingCard | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFlashcards();
    }
  }, [visible, deckId, noteId]);

  const loadFlashcards = async () => {
    try {
      setIsLoading(true);
      setError('');

      let cards: Flashcard[] = [];
      if (deckId) {
        cards = await FlashcardService.getFlashcards({ deck_id: deckId });
      } else if (noteId) {
        cards = await FlashcardService.getFlashcards({ note_id: noteId });
      }

      setFlashcards(cards);
    } catch (err) {
      console.error('Failed to load flashcards:', err);
      setError('Failed to load flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCard = (flashcard: Flashcard) => {
    setEditingCard({
      id: flashcard.id,
      cardType: flashcard.card_type,
      frontContent: flashcard.front_content || '',
      backContent: flashcard.back_content || '',
      clozeContent: flashcard.cloze_content || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;

    // Validation
    if (editingCard.cardType === 'front_back') {
      if (!editingCard.frontContent.trim() || !editingCard.backContent.trim()) {
        Alert.alert('Invalid Input', 'Both front and back content are required.');
        return;
      }
    } else {
      if (!editingCard.clozeContent.trim()) {
        Alert.alert('Invalid Input', 'Cloze content is required.');
        return;
      }
    }

    try {
      setIsUpdating(true);
      setError('');

      await FlashcardService.updateFlashcard(editingCard.id, {
        front_content: editingCard.cardType === 'front_back' ? editingCard.frontContent : undefined,
        back_content: editingCard.cardType === 'front_back' ? editingCard.backContent : undefined,
        cloze_content: editingCard.cardType === 'cloze' ? editingCard.clozeContent : undefined,
      });

      setEditingCard(null);
      await loadFlashcards();
      onFlashcardUpdated?.();
    } catch (err) {
      console.error('Failed to update flashcard:', err);
      setError('Failed to update flashcard');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCard = async (flashcard: Flashcard) => {
    const cardPreview =
      flashcard.card_type === 'front_back'
        ? flashcard.front_content?.substring(0, 50) || ''
        : flashcard.cloze_content?.substring(0, 50) || '';

    Alert.alert(
      'Delete Flashcard',
      `Are you sure you want to delete this flashcard?\n\n"${cardPreview}..."\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setError('');
              await FlashcardService.deleteFlashcard(flashcard.id);
              await loadFlashcards();
              onFlashcardUpdated?.();
            } catch (err) {
              console.error('Failed to delete flashcard:', err);
              setError('Failed to delete flashcard');
            }
          },
        },
      ]
    );
  };

  const filteredFlashcards = flashcards.filter((flashcard) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      flashcard.front_content?.toLowerCase().includes(query) ||
      flashcard.back_content?.toLowerCase().includes(query) ||
      flashcard.cloze_content?.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: FlashcardStatus) => {
    switch (status) {
      case 'new':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'learning':
        return { bg: '#fef3c7', text: '#d97706' };
      case 'review':
        return { bg: '#fed7aa', text: '#c2410c' };
      case 'mature':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'suspended':
        return { bg: '#fee2e2', text: '#dc2626' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>All Flashcards</Text>
              <Text style={styles.headerSubtitle}>
                {filteredFlashcards.length} of {flashcards.length} cards
              </Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search flashcards..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Flashcards List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.loadingText}>Loading flashcards...</Text>
          </View>
        ) : filteredFlashcards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="layers-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No flashcards match your search' : 'No flashcards yet'}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {filteredFlashcards.map((flashcard) => (
              <View key={flashcard.id} style={styles.card}>
                {editingCard?.id === flashcard.id ? (
                  /* Editing Mode */
                  <View style={styles.editContainer}>
                    <View style={styles.editHeader}>
                      <Text style={styles.editTitle}>
                        Editing {flashcard.card_type === 'cloze' ? 'Cloze' : 'Front & Back'} Card
                      </Text>
                      <View style={styles.editActions}>
                        <TouchableOpacity
                          onPress={handleSaveEdit}
                          disabled={isUpdating}
                          style={styles.saveButton}
                        >
                          {isUpdating ? (
                            <ActivityIndicator size="small" color="#10b981" />
                          ) : (
                            <Text style={styles.saveButtonText}>Save</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setEditingCard(null)}
                          disabled={isUpdating}
                          style={styles.cancelButton}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {flashcard.card_type === 'front_back' ? (
                      <View style={styles.editFields}>
                        <View style={styles.editField}>
                          <Text style={styles.editLabel}>Front</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editingCard.frontContent}
                            onChangeText={(text) =>
                              setEditingCard({ ...editingCard, frontContent: text })
                            }
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                          />
                        </View>
                        <View style={styles.editField}>
                          <Text style={styles.editLabel}>Back</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editingCard.backContent}
                            onChangeText={(text) =>
                              setEditingCard({ ...editingCard, backContent: text })
                            }
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                          />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.editField}>
                        <Text style={styles.editLabel}>Cloze Content</Text>
                        <TextInput
                          style={styles.editInput}
                          value={editingCard.clozeContent}
                          onChangeText={(text) =>
                            setEditingCard({ ...editingCard, clozeContent: text })
                          }
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                        />
                      </View>
                    )}
                  </View>
                ) : (
                  /* Display Mode */
                  <View>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardBadges}>
                        <View style={styles.typeBadge}>
                          <Ionicons
                            name={flashcard.card_type === 'cloze' ? 'document-text' : 'copy'}
                            size={12}
                            color="#0ea5e9"
                          />
                          <Text style={styles.typeBadgeText}>
                            {flashcard.card_type === 'cloze' ? 'Cloze' : 'Front/Back'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(flashcard.status).bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              { color: getStatusColor(flashcard.status).text },
                            ]}
                          >
                            {flashcard.status}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={() => handleEditCard(flashcard)}
                          style={styles.actionButton}
                        >
                          <Ionicons name="create-outline" size={20} color="#0ea5e9" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteCard(flashcard)}
                          style={styles.actionButton}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Card Content */}
                    {flashcard.card_type === 'front_back' ? (
                      <View style={styles.frontBackContent}>
                        <View style={styles.contentSection}>
                          <Text style={styles.contentLabel}>Front:</Text>
                          <Text style={styles.contentText}>{flashcard.front_content}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.contentSection}>
                          <Text style={styles.contentLabel}>Back:</Text>
                          <Text style={styles.contentText}>{flashcard.back_content}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.clozeContent}>
                        <Text style={styles.contentText}>{flashcard.cloze_content}</Text>
                      </View>
                    )}

                    {/* Tags */}
                    {flashcard.tags && flashcard.tags.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tagsRow}
                        contentContainerStyle={styles.tagsContent}
                      >
                        {flashcard.tags.map((tag, index) => (
                          <View key={index} style={styles.tagChip}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    )}

                    {/* Card Stats */}
                    <View style={styles.cardStats}>
                      <Text style={styles.statText}>Reviews: {flashcard.total_reviews}</Text>
                      <Text style={styles.statText}>
                        Accuracy:{' '}
                        {flashcard.total_reviews > 0
                          ? Math.round((flashcard.correct_reviews / flashcard.total_reviews) * 100)
                          : 0}
                        %
                      </Text>
                      <Text style={styles.statText}>Ease: {flashcard.ease_factor.toFixed(1)}</Text>
                      <Text style={styles.statText}>Interval: {flashcard.interval_days}d</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
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
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    padding: 4,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    padding: 4,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  frontBackContent: {
    gap: 12,
  },
  contentSection: {
    gap: 4,
  },
  contentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  contentText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  clozeContent: {
    marginBottom: 12,
  },
  tagsRow: {
    marginVertical: 8,
  },
  tagsContent: {
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  cardStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  editContainer: {
    gap: 16,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  editFields: {
    gap: 16,
  },
  editField: {
    gap: 8,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  editInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 80,
  },
});

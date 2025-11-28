// src/components/notes/NoteFlashcards.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFlashcards } from '../../hooks/useFlashcards';
import FlashcardListModal from '../flashcards/FlashcardListModal';
import type { CombinedNavigationProp } from '../../types/navigation';
import type { Flashcard } from '../../types/flashcard';

interface NoteFlashcardsProps {
  noteId: string;
}

export default function NoteFlashcards({ noteId }: NoteFlashcardsProps) {
  const navigation = useNavigation<CombinedNavigationProp>();
  const { flashcards, loading, error, refresh } = useFlashcards({ note_id: noteId });
  const [showFlashcardListModal, setShowFlashcardListModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    due: 0,
    new: 0,
    learning: 0,
  });

  useEffect(() => {
    if (flashcards) {
      const now = new Date();
      const newStats = {
        total: flashcards.length,
        due: flashcards.filter(
          card => new Date(card.next_review) <= now && card.status !== 'suspended'
        ).length,
        new: flashcards.filter(card => card.status === 'new').length,
        learning: flashcards.filter(card => card.status === 'learning').length,
      };
      setStats(newStats);
    }
  }, [flashcards]);

  const handleStartStudy = () => {
    if (flashcards.length === 0) return;

    navigation.navigate('StudyScreen', {
      noteId,
      mode: 'mixed',
    });
  };

  const handleViewCard = () => {
    // Open the flashcard list modal
    setShowFlashcardListModal(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Flashcards from this note</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading flashcards...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Flashcards from this note</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (flashcards.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Flashcards from this note</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="layers-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No flashcards generated yet</Text>
          <Text style={styles.emptySubtext}>
            Use the AI Flashcard Generator to create flashcards from this note
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Flashcards from this note</Text>
        <Text style={styles.cardCount}>{flashcards.length} cards</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.due}</Text>
          <Text style={styles.statLabel}>Due</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.new}</Text>
          <Text style={styles.statLabel}>New</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.learning}</Text>
          <Text style={styles.statLabel}>Learning</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.studyButton,
          flashcards.length === 0 && styles.studyButtonDisabled,
        ]}
        onPress={handleStartStudy}
        disabled={flashcards.length === 0}
      >
        <Ionicons name="school-outline" size={20} color="#ffffff" />
        <Text style={styles.studyButtonText}>
          Study All ({stats.due} due)
        </Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.cardsList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {flashcards.slice(0, 5).map((card, index) => (
          <TouchableOpacity
            key={card.id}
            style={styles.cardItem}
            onPress={handleViewCard}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={[
                  styles.cardTypeBadge,
                  { backgroundColor: card.card_type === 'cloze' ? '#dbeafe' : '#fef3c7' }
                ]}>
                  <Text style={[
                    styles.cardTypeText,
                    { color: card.card_type === 'cloze' ? '#1e40af' : '#d97706' }
                  ]}>
                    {card.card_type === 'cloze' ? 'Cloze' : 'Front/Back'}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      card.status === 'new' ? '#dcfce7' :
                      card.status === 'learning' ? '#fef3c7' :
                      card.status === 'review' ? '#dbeafe' :
                      card.status === 'mature' ? '#e0e7ff' : '#f3f4f6'
                  }
                ]}>
                  <Text style={[
                    styles.statusText,
                    {
                      color:
                        card.status === 'new' ? '#15803d' :
                        card.status === 'learning' ? '#d97706' :
                        card.status === 'review' ? '#1e40af' :
                        card.status === 'mature' ? '#5b21b6' : '#6b7280'
                    }
                  ]}>
                    {card.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardText} numberOfLines={2}>
                {card.card_type === 'front_back'
                  ? card.front_content
                  : card.cloze_content?.replace(/{{c\d+::/g, '[').replace(/}}/g, ']')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}

        {flashcards.length > 5 && (
          <TouchableOpacity
            style={styles.moreIndicator}
            onPress={handleViewCard}
          >
            <Text style={styles.moreText}>
              +{flashcards.length - 5} more cards
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Flashcard List Modal */}
      <FlashcardListModal
        visible={showFlashcardListModal}
        noteId={noteId}
        onClose={() => setShowFlashcardListModal(false)}
        onFlashcardUpdated={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  studyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  studyButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  studyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardsList: {
    maxHeight: 300,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  cardTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cardTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  moreIndicator: {
    alignItems: 'center',
    padding: 12,
  },
  moreText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});

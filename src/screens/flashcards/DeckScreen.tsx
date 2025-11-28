// src/screens/flashcards/DeckScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDeck, useDeckStats } from '../../hooks/useDecks';
import { useFlashcards } from '../../hooks/useFlashcards';
import { FlashcardService } from '../../services/flashcardService';
import FlashcardListModal from '../../components/flashcards/FlashcardListModal';
import type { DeckScreenRouteProp, MainTabNavigationProp } from '../../types/navigation';

export default function DeckScreen() {
  const navigation = useNavigation<MainTabNavigationProp>();
  const route = useRoute<DeckScreenRouteProp>();
  const { deckId } = route.params;
  
  const { deck, loading: deckLoading, refresh: refreshDeck } = useDeck(deckId);
  const { stats, loading: statsLoading, refresh: refreshStats } = useDeckStats(deckId);
  const { 
    flashcards, 
    loading: cardsLoading, 
    refresh: refreshCards 
  } = useFlashcards({ deck_id: deckId });

  const [isDeleting, setIsDeleting] = useState(false);
  const [showFlashcardListModal, setShowFlashcardListModal] = useState(false);

  const handleRefresh = async () => {
    await Promise.all([refreshDeck(), refreshStats(), refreshCards()]);
  };

  const handleStudy = (mode: 'new' | 'review' | 'mixed') => {
    navigation.navigate('StudyScreen', { deckId, mode });
  };

  const handleDeleteDeck = async () => {
    if (!deck) return;
    
    Alert.alert(
      'Delete Deck',
      `Are you sure you want to delete "${deck.name}"? This will permanently delete the deck and all its flashcards.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await FlashcardService.deleteDeck(deckId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete deck');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const isLoading = deckLoading || statsLoading || cardsLoading;

  if (!deck && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Deck not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteDeck}
            disabled={isDeleting}
          >
            <Text style={styles.deleteButtonText}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Deck Info */}
        {deck && (
          <View style={[styles.deckInfo, { borderLeftColor: deck.color }]}>
            <Text style={styles.deckName}>{deck.name}</Text>
            {deck.description && (
              <Text style={styles.deckDescription}>{deck.description}</Text>
            )}
          </View>
        )}

        {/* Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalCards}</Text>
              <Text style={styles.statLabel}>Total Cards</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>
                {stats.dueCards}
              </Text>
              <Text style={styles.statLabel}>Due</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10b981' }]}>
                {stats.newCards}
              </Text>
              <Text style={styles.statLabel}>New</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                {stats.matureCards}
              </Text>
              <Text style={styles.statLabel}>Mature</Text>
            </View>
          </View>
        )}

        {/* Study Options */}
        <View style={styles.studyOptions}>
          <Text style={styles.sectionTitle}>Study Options</Text>
          
          {stats?.dueCards > 0 && (
            <TouchableOpacity
              style={[styles.studyButton, { backgroundColor: '#ef4444' }]}
              onPress={() => handleStudy('review')}
            >
              <Text style={styles.studyButtonText}>
                Study Due Cards ({stats.dueCards})
              </Text>
            </TouchableOpacity>
          )}

          {stats?.newCards > 0 && (
            <TouchableOpacity
              style={[styles.studyButton, { backgroundColor: '#10b981' }]}
              onPress={() => handleStudy('new')}
            >
              <Text style={styles.studyButtonText}>
                Learn New Cards ({stats.newCards})
              </Text>
            </TouchableOpacity>
          )}

          {stats && (stats.dueCards > 0 || stats.newCards > 0) && (
            <TouchableOpacity
              style={[styles.studyButton, { backgroundColor: '#3b82f6' }]}
              onPress={() => handleStudy('mixed')}
            >
              <Text style={styles.studyButtonText}>Mixed Study</Text>
            </TouchableOpacity>
          )}

          {stats && stats.totalCards === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No cards in this deck yet</Text>
              <Text style={styles.emptySubtext}>
                Add some flashcards to start studying
              </Text>
            </View>
          )}

          {stats && stats.totalCards > 0 && stats.dueCards === 0 && stats.newCards === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>All caught up!</Text>
              <Text style={styles.emptySubtext}>
                No cards are due for review right now
              </Text>
            </View>
          )}
        </View>

        {/* Card List Preview */}
        {flashcards.length > 0 && (
          <View style={styles.cardPreview}>
            <View style={styles.cardPreviewHeader}>
              <Text style={styles.sectionTitle}>
                Recent Cards ({flashcards.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowFlashcardListModal(true)}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllButtonText}>View All</Text>
              </TouchableOpacity>
            </View>
            {flashcards.slice(0, 5).map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.cardItem}
                onPress={() => setShowFlashcardListModal(true)}
              >
                <Text style={styles.cardContent} numberOfLines={2}>
                  {card.card_type === 'front_back'
                    ? card.front_content
                    : card.cloze_content?.replace(/\{\{c\d+::(.*?)(?:::.*?)?\}\}/g, '$1')
                  }
                </Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardType}>{card.card_type}</Text>
                  <Text style={styles.cardStatus}>{card.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Flashcard List Modal */}
      <FlashcardListModal
        visible={showFlashcardListModal}
        deckId={deckId}
        onClose={() => setShowFlashcardListModal(false)}
        onFlashcardUpdated={handleRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  deckInfo: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deckName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  deckDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  studyOptions: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  studyButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  studyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  cardPreview: {
    margin: 16,
  },
  cardPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  cardItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardType: {
    fontSize: 12,
    color: '#3b82f6',
    textTransform: 'capitalize',
  },
  cardStatus: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    marginBottom: 16,
  },
});
// src/screens/flashcards/FlashcardDashboard.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDecksWithStats } from '../../hooks/useDecks';
import { FlashcardService } from '../../services/flashcardService';
import type { MainTabNavigationProp } from '../../types/navigation';
import type { FlashcardDeck, DeckWithStats } from '../../types/flashcard';

export default function FlashcardDashboard() {
  const navigation = useNavigation<MainTabNavigationProp>();
  const { decksWithStats, loading, error, refresh } = useDecksWithStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDeckModal, setShowCreateDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const filteredDecks = decksWithStats.filter(deck =>
    deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStats = filteredDecks.reduce(
    (acc, deck) => ({
      totalCards: acc.totalCards + deck.stats.totalCards,
      dueCards: acc.dueCards + deck.stats.dueCards,
      newCards: acc.newCards + deck.stats.newCards
    }),
    { totalCards: 0, dueCards: 0, newCards: 0 }
  );

  const handleCreateDeck = useCallback(async () => {
    if (!newDeckName.trim()) {
      Alert.alert('Error', 'Please enter a deck name');
      return;
    }

    try {
      setCreating(true);
      await FlashcardService.createDeck(newDeckName.trim(), newDeckDescription.trim() || undefined);
      setNewDeckName('');
      setNewDeckDescription('');
      setShowCreateDeckModal(false);
      refresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to create deck');
    } finally {
      setCreating(false);
    }
  }, [newDeckName, newDeckDescription, refresh]);

  const handleDeckPress = useCallback((deck: FlashcardDeck) => {
    navigation.navigate('DeckScreen', { deckId: deck.id });
  }, [navigation]);

  const handleStudyPress = useCallback((deck: FlashcardDeck) => {
    navigation.navigate('StudyScreen', { deckId: deck.id, mode: 'mixed' });
  }, [navigation]);

  const renderDeckCard = (deck: DeckWithStats) => (
    <TouchableOpacity
      key={deck.id}
      style={[styles.deckCard, { borderLeftColor: deck.color }]}
      onPress={() => handleDeckPress(deck)}
    >
      <View style={styles.deckHeader}>
        <Text style={styles.deckName}>{deck.name}</Text>
        {deck.description && (
          <Text style={styles.deckDescription} numberOfLines={2}>
            {deck.description}
          </Text>
        )}
      </View>

      <View style={styles.deckStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{deck.stats.totalCards}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {deck.stats.dueCards}
          </Text>
          <Text style={styles.statLabel}>Due</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {deck.stats.newCards}
          </Text>
          <Text style={styles.statLabel}>New</Text>
        </View>
      </View>

      {deck.stats.dueCards > 0 && (
        <TouchableOpacity
          style={styles.studyButton}
          onPress={() => handleStudyPress(deck)}
        >
          <Text style={styles.studyButtonText}>Study Now</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Flashcards</Text>
          <Text style={styles.subtitle}>Study with spaced repetition</Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsOverview}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>
              {totalStats.dueCards}
            </Text>
            <Text style={styles.statTitle}>Due Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>
              {totalStats.newCards}
            </Text>
            <Text style={styles.statTitle}>New Cards</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#3b82f6' }]}>
              {totalStats.totalCards}
            </Text>
            <Text style={styles.statTitle}>Total Cards</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search decks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Create Deck Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateDeckModal(true)}
        >
          <Text style={styles.createButtonText}>+ Create New Deck</Text>
        </TouchableOpacity>

        {/* Deck List */}
        <View style={styles.deckList}>
          {loading && filteredDecks.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading decks...</Text>
            </View>
          ) : filteredDecks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No decks found matching your search.' : 'No flashcard decks yet.'}
              </Text>
              <Text style={styles.emptySubtext}>
                Create your first deck to start studying!
              </Text>
            </View>
          ) : (
            filteredDecks.map(renderDeckCard)
          )}
        </View>
      </ScrollView>

      {/* Create Deck Modal */}
      <Modal
        visible={showCreateDeckModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateDeckModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Deck</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Deck name"
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholderTextColor="#9ca3af"
            />
            
            <TextInput
              style={[styles.modalInput, styles.descriptionInput]}
              placeholder="Description (optional)"
              value={newDeckDescription}
              onChangeText={setNewDeckDescription}
              multiline
              placeholderTextColor="#9ca3af"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateDeckModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createModalButton]}
                onPress={handleCreateDeck}
                disabled={creating}
              >
                <Text style={styles.createModalButtonText}>
                  {creating ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsOverview: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deckList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deckCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deckHeader: {
    marginBottom: 12,
  },
  deckName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  deckDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  deckStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  studyButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  studyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 6,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  createModalButton: {
    backgroundColor: '#3b82f6',
  },
  createModalButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
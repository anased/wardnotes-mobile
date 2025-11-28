// Preview screen for generated flashcards
// Allows selecting, editing, and saving flashcards

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { PreviewCard } from '../../types/flashcardGeneration';
import FlashcardEditModal from './FlashcardEditModal';

interface FlashcardPreviewScreenProps {
  cards: PreviewCard[];
  cardType: 'cloze' | 'front_back';
  loading?: boolean;
  onCardsChange: (cards: PreviewCard[]) => void;
  onSaveSelected: () => void;
  onRegenerate: () => void;
}

export default function FlashcardPreviewScreen({
  cards,
  cardType,
  loading = false,
  onCardsChange,
  onSaveSelected,
  onRegenerate,
}: FlashcardPreviewScreenProps) {
  const [editingCard, setEditingCard] = useState<PreviewCard | null>(null);

  const selectedCount = cards.filter((c) => c.isSelected).length;
  const allSelected = cards.length > 0 && selectedCount === cards.length;

  const toggleCardSelection = (cardId: string) => {
    const updatedCards = cards.map((card) =>
      card.id === cardId ? { ...card, isSelected: !card.isSelected } : card
    );
    onCardsChange(updatedCards);
  };

  const toggleSelectAll = () => {
    const updatedCards = cards.map((card) => ({
      ...card,
      isSelected: !allSelected,
    }));
    onCardsChange(updatedCards);
  };

  const handleEditCard = (card: PreviewCard) => {
    setEditingCard(card);
  };

  const handleSaveEdit = (editedCard: PreviewCard) => {
    const updatedCards = cards.map((card) =>
      card.id === editedCard.id ? editedCard : card
    );
    onCardsChange(updatedCards);
    setEditingCard(null);
  };

  const renderClozeCard = (card: PreviewCard, index: number) => (
    <View key={card.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleCardSelection(card.id)}
        >
          <View
            style={[
              styles.checkboxInner,
              card.isSelected && styles.checkboxInnerSelected,
            ]}
          >
            {card.isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <View style={styles.cardNumber}>
          <Text style={styles.cardNumberText}>Card {index + 1}</Text>
          {card.isEdited && (
            <View style={styles.editedBadge}>
              <Text style={styles.editedBadgeText}>Edited</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleEditCard(card)}
        activeOpacity={0.7}
      >
        <Text style={styles.cardText}>{card.cloze}</Text>
        <Text style={styles.tapToEditHint}>Tap to edit</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFrontBackCard = (card: PreviewCard, index: number) => (
    <View key={card.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleCardSelection(card.id)}
        >
          <View
            style={[
              styles.checkboxInner,
              card.isSelected && styles.checkboxInnerSelected,
            ]}
          >
            {card.isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <View style={styles.cardNumber}>
          <Text style={styles.cardNumberText}>Card {index + 1}</Text>
          {card.isEdited && (
            <View style={styles.editedBadge}>
              <Text style={styles.editedBadgeText}>Edited</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleEditCard(card)}
        activeOpacity={0.7}
      >
        <View style={styles.cardSide}>
          <Text style={styles.sideLabel}>Front:</Text>
          <Text style={styles.cardText}>{card.front}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardSide}>
          <Text style={styles.sideLabel}>Back:</Text>
          <Text style={styles.cardText}>{card.back}</Text>
        </View>

        <Text style={styles.tapToEditHint}>Tap to edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Preview ({cards.length} {cards.length === 1 ? 'card' : 'cards'})
        </Text>
        <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllButton}>
          <Text style={styles.selectAllButtonText}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          💡 {selectedCount} {selectedCount === 1 ? 'card' : 'cards'} selected.
          Tap any card to edit before saving.
        </Text>
      </View>

      {/* Cards list */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {cards.map((card, index) =>
          cardType === 'cloze'
            ? renderClozeCard(card, index)
            : renderFrontBackCard(card, index)
        )}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.regenerateButton]}
          onPress={onRegenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0ea5e9" size="small" />
          ) : (
            <>
              <Text style={styles.regenerateButtonIcon}>🔄</Text>
              <Text style={styles.regenerateButtonText}>Regenerate</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            (selectedCount === 0 || loading) && styles.saveButtonDisabled,
          ]}
          onPress={onSaveSelected}
          disabled={selectedCount === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.saveButtonIcon}>✓</Text>
              <Text style={styles.saveButtonText}>
                Save Selected ({selectedCount})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit modal */}
      <FlashcardEditModal
        visible={editingCard !== null}
        card={editingCard}
        cardType={cardType}
        onClose={() => setEditingCard(null)}
        onSave={handleSaveEdit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  selectAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0ea5e9',
  },
  infoBanner: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  infoBannerText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxInnerSelected: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  editedBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  editedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  cardContent: {
    paddingLeft: 36,
  },
  cardText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  cardSide: {
    marginBottom: 12,
  },
  sideLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  tapToEditHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  regenerateButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  regenerateButtonIcon: {
    fontSize: 16,
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  saveButton: {
    backgroundColor: '#10b981',
    flex: 1.5,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

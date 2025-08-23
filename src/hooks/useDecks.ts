// src/hooks/useDecks.ts
import { useState, useEffect, useCallback } from 'react';
import { FlashcardService } from '../services/flashcardService';
import type { FlashcardDeck, DeckStats, DeckWithStats } from '../types/flashcard';

export const useDecks = () => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await FlashcardService.getDecks();
      setDecks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createDeck = useCallback(async (name: string, description?: string, color?: string): Promise<FlashcardDeck> => {
    try {
      const newDeck = await FlashcardService.createDeck(name, description, color);
      setDecks(prev => [newDeck, ...prev]);
      return newDeck;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create deck';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateDeck = useCallback(async (id: string, updates: Partial<FlashcardDeck>): Promise<FlashcardDeck> => {
    try {
      const updatedDeck = await FlashcardService.updateDeck(id, updates);
      setDecks(prev => 
        prev.map(deck => 
          deck.id === id ? updatedDeck : deck
        )
      );
      return updatedDeck;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update deck';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteDeck = useCallback(async (id: string): Promise<void> => {
    try {
      await FlashcardService.deleteDeck(id);
      setDecks(prev => prev.filter(deck => deck.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete deck';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  return {
    decks,
    loading,
    error,
    refresh: loadDecks,
    createDeck,
    updateDeck,
    deleteDeck
  };
};

export const useDeck = (deckId: string | null) => {
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDeck = useCallback(async () => {
    if (!deckId) {
      setDeck(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await FlashcardService.getDeck(deckId);
      setDeck(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck');
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  return {
    deck,
    loading,
    error,
    refresh: loadDeck
  };
};

export const useDeckStats = (deckId: string | null) => {
  const [stats, setStats] = useState<DeckStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!deckId) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await FlashcardService.getDeckStats(deckId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck stats');
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
};

export const useDecksWithStats = () => {
  const [decksWithStats, setDecksWithStats] = useState<DeckWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDecksWithStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const decks = await FlashcardService.getDecks();
      
      // Load stats for each deck
      const decksWithStatsPromises = decks.map(async (deck) => {
        const stats = await FlashcardService.getDeckStats(deck.id);
        return { ...deck, stats };
      });
      
      const data = await Promise.all(decksWithStatsPromises);
      setDecksWithStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks with stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDecksWithStats();
  }, [loadDecksWithStats]);

  return {
    decksWithStats,
    loading,
    error,
    refresh: loadDecksWithStats
  };
};
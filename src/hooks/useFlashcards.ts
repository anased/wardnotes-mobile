// src/hooks/useFlashcards.ts
import { useState, useEffect, useCallback } from 'react';
import { FlashcardService } from '../services/flashcardService';
import type {
  Flashcard,
  FlashcardSearchFilters,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  SubmitReviewRequest,
  ReviewQuality
} from '../types/flashcard';

export const useFlashcards = (filters?: FlashcardSearchFilters) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFlashcards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await FlashcardService.getFlashcards(filters);
      setFlashcards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createFlashcard = useCallback(async (request: CreateFlashcardRequest): Promise<Flashcard> => {
    try {
      const newFlashcard = await FlashcardService.createFlashcard(request);
      setFlashcards(prev => [newFlashcard, ...prev]);
      return newFlashcard;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create flashcard';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateFlashcard = useCallback(async (id: string, request: UpdateFlashcardRequest): Promise<Flashcard> => {
    try {
      const updatedFlashcard = await FlashcardService.updateFlashcard(id, request);
      setFlashcards(prev => 
        prev.map(flashcard => 
          flashcard.id === id ? updatedFlashcard : flashcard
        )
      );
      return updatedFlashcard;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update flashcard';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteFlashcard = useCallback(async (id: string): Promise<void> => {
    try {
      await FlashcardService.deleteFlashcard(id);
      setFlashcards(prev => prev.filter(flashcard => flashcard.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete flashcard';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const submitReview = useCallback(async (request: SubmitReviewRequest): Promise<Flashcard> => {
    try {
      const updatedFlashcard = await FlashcardService.submitReview(request);
      setFlashcards(prev => 
        prev.map(flashcard => 
          flashcard.id === request.flashcard_id ? updatedFlashcard : flashcard
        )
      );
      return updatedFlashcard;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit review';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  return {
    flashcards,
    loading,
    error,
    refresh: loadFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    submitReview
  };
};

export const useDueFlashcards = (deckId?: string, limit?: number) => {
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDueCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await FlashcardService.getDueCards(deckId, limit);
      setDueCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load due cards');
    } finally {
      setLoading(false);
    }
  }, [deckId, limit]);

  const submitReview = useCallback(async (flashcardId: string, quality: ReviewQuality, responseTime?: number): Promise<void> => {
    try {
      await FlashcardService.submitReview({
        flashcard_id: flashcardId,
        quality,
        response_time: responseTime
      });
      
      // Remove the reviewed card from due cards
      setDueCards(prev => prev.filter(card => card.id !== flashcardId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit review';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  useEffect(() => {
    loadDueCards();
  }, [loadDueCards]);

  return {
    dueCards,
    loading,
    error,
    refresh: loadDueCards,
    submitReview
  };
};

export const useStudyCards = (deckId?: string, maxDue: number = 30, maxNew: number = 10) => {
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudyCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await FlashcardService.getStudyCards(deckId, maxDue, maxNew);
      setStudyCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study cards');
    } finally {
      setLoading(false);
    }
  }, [deckId, maxDue, maxNew]);

  const submitReview = useCallback(async (flashcardId: string, quality: ReviewQuality, responseTime?: number): Promise<void> => {
    try {
      await FlashcardService.submitReview({
        flashcard_id: flashcardId,
        quality,
        response_time: responseTime
      });
      
      // Remove the reviewed card from study cards
      setStudyCards(prev => prev.filter(card => card.id !== flashcardId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit review';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  useEffect(() => {
    loadStudyCards();
  }, [loadStudyCards]);

  return {
    studyCards,
    loading,
    error,
    refresh: loadStudyCards,
    submitReview
  };
};
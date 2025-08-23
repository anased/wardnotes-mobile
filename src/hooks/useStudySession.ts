// src/hooks/useStudySession.ts
import { useState, useCallback, useRef } from 'react';
import { FlashcardService } from '../services/flashcardService';
import type {
  FlashcardStudySession,
  StudySessionStats,
  Flashcard,
  ReviewQuality,
  MobileFlashcardSession,
  MobileStudyMode
} from '../types/flashcard';

export const useStudySession = () => {
  const [session, setSession] = useState<FlashcardStudySession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (
    deckId?: string, 
    sessionType: 'review' | 'new' | 'mixed' = 'review'
  ): Promise<FlashcardStudySession> => {
    try {
      setLoading(true);
      setError(null);
      const newSession = await FlashcardService.startStudySession(deckId, sessionType);
      setSession(newSession);
      return newSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start study session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (
    sessionId: string,
    updates: Partial<FlashcardStudySession>
  ): Promise<FlashcardStudySession> => {
    try {
      const updatedSession = await FlashcardService.updateStudySession(sessionId, updates);
      setSession(updatedSession);
      return updatedSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update study session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const endSession = useCallback(async (sessionId: string): Promise<FlashcardStudySession> => {
    try {
      const endedSession = await FlashcardService.endStudySession(sessionId);
      setSession(endedSession);
      return endedSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end study session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

  return {
    session,
    loading,
    error,
    startSession,
    updateSession,
    endSession,
    clearSession
  };
};

export const useMobileStudySession = () => {
  const [mobileSession, setMobileSession] = useState<MobileFlashcardSession | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState<StudySessionStats>({
    totalCards: 0,
    correctCards: 0,
    accuracy: 0,
    averageTime: 0,
    newCards: 0,
    reviewCards: 0,
    learningCards: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const startTimeRef = useRef<number>(0);
  const cardStartTimeRef = useRef<number>(0);

  const startMobileSession = useCallback(async (
    deckId: string,
    mode: MobileStudyMode
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Get study cards based on mode
      let cards: Flashcard[] = [];
      switch (mode.mode) {
        case 'new':
          cards = await FlashcardService.getNewFlashcards(deckId, mode.card_limit || 10);
          break;
        case 'review':
          cards = await FlashcardService.getDueCards(deckId, mode.card_limit || 30);
          break;
        case 'mixed':
          cards = await FlashcardService.getStudyCards(deckId, 15, 5);
          break;
      }

      if (cards.length === 0) {
        throw new Error('No cards available for study');
      }

      const sessionId = Date.now().toString();
      const startTime = Date.now();
      
      const newMobileSession: MobileFlashcardSession = {
        session_id: sessionId,
        deck_id: deckId,
        cards,
        current_index: 0,
        start_time: startTime,
        reviews: []
      };

      setMobileSession(newMobileSession);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      startTimeRef.current = startTime;
      cardStartTimeRef.current = startTime;
      
      // Reset stats
      setSessionStats({
        totalCards: 0,
        correctCards: 0,
        accuracy: 0,
        averageTime: 0,
        newCards: 0,
        reviewCards: 0,
        learningCards: 0
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start study session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const showCardAnswer = useCallback(() => {
    setShowAnswer(true);
  }, []);

  const submitCardReview = useCallback(async (quality: ReviewQuality) => {
    if (!mobileSession || currentCardIndex >= mobileSession.cards.length) {
      return;
    }

    try {
      const currentCard = mobileSession.cards[currentCardIndex];
      const responseTime = Date.now() - cardStartTimeRef.current;

      // Submit review to backend
      await FlashcardService.submitReview({
        flashcard_id: currentCard.id,
        quality,
        response_time: responseTime
      });

      // Update session stats
      const isCorrect = quality >= 3;
      const isNew = currentCard.repetitions === 0;
      const isLearning = quality < 3;

      setSessionStats(prev => ({
        totalCards: prev.totalCards + 1,
        correctCards: prev.correctCards + (isCorrect ? 1 : 0),
        accuracy: ((prev.correctCards + (isCorrect ? 1 : 0)) / (prev.totalCards + 1)) * 100,
        averageTime: (prev.averageTime * prev.totalCards + responseTime) / (prev.totalCards + 1),
        newCards: prev.newCards + (isNew ? 1 : 0),
        reviewCards: prev.reviewCards + (!isNew ? 1 : 0),
        learningCards: prev.learningCards + (isLearning ? 1 : 0)
      }));

      // Move to next card or complete session
      if (currentCardIndex < mobileSession.cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setShowAnswer(false);
        cardStartTimeRef.current = Date.now();
      } else {
        // Session complete
        setMobileSession(null);
        setCurrentCardIndex(0);
        setShowAnswer(false);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit review';
      setError(errorMessage);
    }
  }, [mobileSession, currentCardIndex]);

  const getCurrentCard = useCallback((): Flashcard | null => {
    if (!mobileSession || currentCardIndex >= mobileSession.cards.length) {
      return null;
    }
    return mobileSession.cards[currentCardIndex];
  }, [mobileSession, currentCardIndex]);

  const getProgress = useCallback(() => {
    if (!mobileSession) {
      return { current: 0, total: 0, percentage: 0 };
    }
    
    const current = currentCardIndex + 1;
    const total = mobileSession.cards.length;
    const percentage = (current / total) * 100;
    
    return { current, total, percentage };
  }, [mobileSession, currentCardIndex]);

  const endMobileSession = useCallback(() => {
    setMobileSession(null);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setError(null);
  }, []);

  const isSessionComplete = !mobileSession && sessionStats.totalCards > 0;

  return {
    mobileSession,
    currentCard: getCurrentCard(),
    currentCardIndex,
    showAnswer,
    sessionStats,
    progress: getProgress(),
    loading,
    error,
    isSessionComplete,
    startMobileSession,
    showCardAnswer,
    submitCardReview,
    endMobileSession
  };
};
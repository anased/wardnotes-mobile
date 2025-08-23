// src/services/flashcardService.ts
import { supabase } from './supabase/rest-client';
import type {
  Flashcard,
  FlashcardDeck,
  FlashcardReview,
  FlashcardStudySession,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  SubmitReviewRequest,
  ReviewQuality,
  FlashcardSearchFilters,
  DeckStats,
  StudySessionStats
} from '../types/flashcard';

export class FlashcardService {
  
  // Helper method to get authenticated user
  private static async getAuthenticatedUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('FlashcardService.getAuthenticatedUser - Auth result:', { user: user?.id, error });
    if (error || !user) {
      console.error('FlashcardService.getAuthenticatedUser - Authentication failed:', error);
      throw new Error('User must be authenticated');
    }
    return user;
  }
  
  // ======================
  // Deck Management
  // ======================
  
  static async getDecks(): Promise<FlashcardDeck[]> {
    const user = await this.getAuthenticatedUser();
    console.log('FlashcardService.getDecks - User ID:', user.id);
    
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    console.log('FlashcardService.getDecks - Response:', { data, error });
    if (error) throw error;
    return data || [];
  }
  
  static async getDeck(id: string): Promise<FlashcardDeck | null> {
    const user = await this.getAuthenticatedUser();
    
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async createDeck(name: string, description?: string, color?: string): Promise<FlashcardDeck> {
    const user = await this.getAuthenticatedUser();
    
    const { data, error } = await supabase
      .from('flashcard_decks')
      .insert({
        name,
        description,
        color: color || '#3B82F6',
        user_id: user.id
      });
    
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }
  
  static async updateDeck(id: string, updates: Partial<FlashcardDeck>): Promise<FlashcardDeck> {
    const user = await this.getAuthenticatedUser();
    
    const { data, error } = await supabase
      .from('flashcard_decks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }
  
  static async deleteDeck(id: string): Promise<void> {
    const user = await this.getAuthenticatedUser();
    
    const { error } = await supabase
      .from('flashcard_decks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
  }
  
  static async getDeckStats(deckId: string): Promise<DeckStats> {
    const user = await this.getAuthenticatedUser();
    
    const { data, error } = await supabase
      .from('flashcards')
      .select('status, next_review')
      .eq('deck_id', deckId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    const now = new Date();
    const stats: DeckStats = {
      totalCards: data?.length || 0,
      newCards: 0,
      dueCards: 0,
      learningCards: 0,
      matureCards: 0,
      suspendedCards: 0
    };
    
    data?.forEach(card => {
      switch (card.status) {
        case 'new':
          stats.newCards++;
          stats.dueCards++;
          break;
        case 'learning':
          stats.learningCards++;
          if (new Date(card.next_review) <= now) {
            stats.dueCards++;
          }
          break;
        case 'review':
          if (new Date(card.next_review) <= now) {
            stats.dueCards++;
          }
          break;
        case 'mature':
          stats.matureCards++;
          if (new Date(card.next_review) <= now) {
            stats.dueCards++;
          }
          break;
        case 'suspended':
          stats.suspendedCards++;
          break;
      }
    });
    
    return stats;
  }
  
  // ======================
  // Flashcard Management
  // ======================
  
  static async getFlashcards(filters?: FlashcardSearchFilters): Promise<Flashcard[]> {
    const user = await this.getAuthenticatedUser();
    
    let query = supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id);
    
    if (filters?.deck_id) {
      query = query.eq('deck_id', filters.deck_id);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.card_type) {
      query = query.eq('card_type', filters.card_type);
    }
    
    if (filters?.due_only) {
      query = query.lte('next_review', new Date().toISOString());
    }
    
    if (filters?.search_text) {
      // Simple text search - mobile version is simplified
      query = query.or(`front_content.ilike.%${filters.search_text}%,back_content.ilike.%${filters.search_text}%,cloze_content.ilike.%${filters.search_text}%`);
    }
    
    query = query.order('next_review', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  static async getFlashcard(id: string): Promise<Flashcard | null> {
    const user = await this.getAuthenticatedUser();
    
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async createFlashcard(request: CreateFlashcardRequest): Promise<Flashcard> {
    const user = await this.getAuthenticatedUser();
    
    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        deck_id: request.deck_id,
        note_id: request.note_id,
        card_type: request.card_type,
        front_content: request.front_content,
        back_content: request.back_content,
        cloze_content: request.cloze_content,
        tags: request.tags || [],
        status: 'new',
        ease_factor: 2.5,
        interval_days: 0,
        repetitions: 0,
        next_review: new Date().toISOString(),
        total_reviews: 0,
        correct_reviews: 0,
        user_id: user.id
      });
    
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }
  
  static async updateFlashcard(id: string, request: UpdateFlashcardRequest): Promise<Flashcard> {
    const user = await this.getAuthenticatedUser();
    
    const { data, error } = await supabase
      .from('flashcards')
      .update({
        ...request,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }
  
  static async deleteFlashcard(id: string): Promise<void> {
    const user = await this.getAuthenticatedUser();
    
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
  }
  
  static async getDueCards(deckId?: string, limit?: number): Promise<Flashcard[]> {
    const user = await this.getAuthenticatedUser();
    
    let query = supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .lte('next_review', new Date().toISOString())
      .neq('status', 'suspended')
      .order('next_review', { ascending: true });
    
    if (deckId) {
      query = query.eq('deck_id', deckId);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  static async getNewFlashcards(deckId?: string, limit: number = 20): Promise<Flashcard[]> {
    const user = await this.getAuthenticatedUser();
    
    let query = supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'new')
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (deckId) {
      query = query.eq('deck_id', deckId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  static async getStudyCards(deckId?: string, maxDue: number = 30, maxNew: number = 10): Promise<Flashcard[]> {
    const [dueCards, newCards] = await Promise.all([
      this.getDueCards(deckId, maxDue),
      this.getNewFlashcards(deckId, maxNew)
    ]);
    
    // Combine and shuffle
    const allCards = [...dueCards, ...newCards];
    return allCards.sort(() => Math.random() - 0.5);
  }

  // ======================
  // Review System
  // ======================
  
  static async submitReview(request: SubmitReviewRequest): Promise<Flashcard> {
    const user = await this.getAuthenticatedUser();
    
    // Get current flashcard state
    const flashcard = await this.getFlashcard(request.flashcard_id);
    if (!flashcard) {
      throw new Error('Flashcard not found');
    }
    
    // Calculate new spaced repetition values
    const { newEaseFactor, newInterval, newRepetitions, nextReviewDate } = 
      this.calculateNextReview(
        request.quality,
        flashcard.ease_factor,
        flashcard.interval_days,
        flashcard.repetitions
      );
    
    // Determine new status
    const newStatus = this.determineNewStatus(newRepetitions, request.quality);
    
    // Create review record
    const reviewData = {
      flashcard_id: request.flashcard_id,
      user_id: user.id,
      reviewed_at: new Date().toISOString(),
      quality: request.quality,
      response_time: request.response_time,
      previous_ease_factor: flashcard.ease_factor,
      previous_interval: flashcard.interval_days,
      previous_repetitions: flashcard.repetitions,
      new_ease_factor: newEaseFactor,
      new_interval: newInterval,
      new_repetitions: newRepetitions
    };
    
    // Save review
    const { error: reviewError } = await supabase
      .from('flashcard_reviews')
      .insert(reviewData);
    
    if (reviewError) throw reviewError;
    
    // Update flashcard
    const updatedFlashcard = await this.updateFlashcard(request.flashcard_id, {
      status: newStatus as any,
      ease_factor: newEaseFactor,
      interval_days: newInterval,
      repetitions: newRepetitions,
      last_reviewed: new Date().toISOString(),
      next_review: nextReviewDate.toISOString(),
      total_reviews: flashcard.total_reviews + 1,
      correct_reviews: flashcard.correct_reviews + (request.quality >= 3 ? 1 : 0)
    });
    
    return updatedFlashcard;
  }

  // ======================
  // Study Sessions
  // ======================
  
  static async startStudySession(deckId?: string, sessionType: 'review' | 'new' | 'mixed' = 'review'): Promise<FlashcardStudySession> {
    const user = await this.getAuthenticatedUser();
    
    const { data, error } = await supabase
      .from('flashcard_study_sessions')
      .insert({
        deck_id: deckId,
        session_type: sessionType,
        cards_studied: 0,
        cards_correct: 0,
        total_time: 0,
        user_id: user.id
      });
    
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }
  
  static async updateStudySession(
    sessionId: string, 
    updates: Partial<FlashcardStudySession>
  ): Promise<FlashcardStudySession> {
    const user = await this.getAuthenticatedUser();
    
    const { data, error } = await supabase
      .from('flashcard_study_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }
  
  static async endStudySession(sessionId: string): Promise<FlashcardStudySession> {
    const user = await this.getAuthenticatedUser();
    
    const { data, error } = await supabase
      .from('flashcard_study_sessions')
      .update({
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  // ======================
  // Spaced Repetition Algorithm (SM-2)
  // ======================

  static calculateNextReview(
    quality: ReviewQuality,
    easeFactor: number,
    intervalDays: number,
    repetitions: number
  ): {
    newEaseFactor: number;
    newInterval: number;
    newRepetitions: number;
    nextReviewDate: Date;
  } {
    let newEF = easeFactor;
    let newInterval = intervalDays;
    let newRepetitions = repetitions;
    
    if (quality >= 3) {
      // Correct response
      newRepetitions = repetitions + 1;
      
      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(intervalDays * easeFactor);
      }
      
      // Update ease factor
      newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      newEF = Math.max(newEF, 1.3);
    } else {
      // Incorrect response
      newRepetitions = 0;
      newInterval = 1;
    }
    
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    
    return {
      newEaseFactor: Math.round(newEF * 100) / 100,
      newInterval,
      newRepetitions,
      nextReviewDate
    };
  }
  
  static determineNewStatus(repetitions: number, quality: ReviewQuality): string {
    if (quality < 3) {
      return 'learning';
    }
    
    if (repetitions < 2) {
      return 'learning';
    } else if (repetitions < 5) {
      return 'review';
    } else {
      return 'mature';
    }
  }
}
// API service for AI flashcard generation
// Calls the web app's API endpoints for generating and saving flashcards

import { supabase } from './supabase/client';
import type {
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse,
  SaveFlashcardsRequest,
  SaveFlashcardsResponse,
  GeneratedCard,
  GenerationError,
} from '../types/flashcardGeneration';

// Configuration
const WEB_APP_URL = 'https://wardnotes.vercel.app';
// const WEB_APP_URL = 'http://localhost:3000'; // For local development

/**
 * Gets the authorization token from Supabase session
 */
async function getAuthToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error('You must be logged in to generate flashcards');
  }

  return session.access_token;
}

/**
 * Generates flashcards from a note using AI (preview mode)
 * Calls the web app's API endpoint
 */
export async function generateFlashcardsPreview(
  noteId: string,
  cardType: 'cloze' | 'front_back',
  deckId: string,
  maxCards: number = 10,
  enableDeduplication: boolean = false
): Promise<GeneratedCard[]> {
  try {
    const token = await getAuthToken();

    const requestBody: GenerateFlashcardsRequest = {
      note_id: noteId,
      card_type: cardType,
      deck_id: deckId,
      max_cards: maxCards,
      preview: true, // Preview mode - don't save to database
      enable_deduplication: enableDeduplication,
    };

    const response = await fetch(`${WEB_APP_URL}/api/flashcards/generate-from-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Extract quota information from 429 errors
      if (response.status === 429 && errorData.quota) {
        throw createGenerationError(
          errorData.message || errorData.error || 'Quota exceeded',
          response.status,
          errorData.quota
        );
      }

      throw createGenerationError(
        errorData.error || `Failed to generate flashcards (${response.status})`,
        response.status
      );
    }

    const data: GenerateFlashcardsResponse = await response.json();

    if (!data.cards || !Array.isArray(data.cards)) {
      throw new Error('Invalid response from server');
    }

    return data.cards;
  } catch (error) {
    console.error('Error generating flashcards preview:', error);
    throw handleError(error);
  }
}

/**
 * Saves selected flashcards to the database
 * Uses the save-from-preview endpoint
 */
export async function saveFlashcards(
  cards: GeneratedCard[],
  noteId: string,
  deckId: string,
  cardType: 'cloze' | 'front_back'
): Promise<SaveFlashcardsResponse> {
  try {
    const token = await getAuthToken();

    const requestBody: SaveFlashcardsRequest = {
      cards,
      deck_id: deckId,
      note_id: noteId,
      card_type: cardType,
    };

    const response = await fetch(`${WEB_APP_URL}/api/flashcards/save-from-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw createGenerationError(
        errorData.error || `Failed to save flashcards (${response.status})`,
        response.status
      );
    }

    const data: SaveFlashcardsResponse = await response.json();

    return data;
  } catch (error) {
    console.error('Error saving flashcards:', error);
    throw handleError(error);
  }
}

/**
 * Generates and saves flashcards in one step (direct mode)
 * Useful for "Generate & Save" button
 */
export async function generateAndSaveFlashcards(
  noteId: string,
  cardType: 'cloze' | 'front_back',
  deckId: string,
  maxCards: number = 10,
  enableDeduplication: boolean = false
): Promise<any[]> {
  try {
    const token = await getAuthToken();

    const requestBody = {
      note_id: noteId,
      card_type: cardType,
      deck_id: deckId,
      max_cards: maxCards,
      preview: false, // Direct save mode
      enable_deduplication: enableDeduplication,
    };

    const response = await fetch(`${WEB_APP_URL}/api/flashcards/generate-from-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw createGenerationError(
        errorData.error || `Failed to generate flashcards (${response.status})`,
        response.status
      );
    }

    const data = await response.json();

    return data.flashcards || [];
  } catch (error) {
    console.error('Error generating and saving flashcards:', error);
    throw handleError(error);
  }
}

/**
 * Creates a structured error object
 */
function createGenerationError(message: string, statusCode?: number, quota?: any): GenerationError {
  let type: GenerationError['type'] = 'unknown';
  let retryable = true;

  if (statusCode === 429) {
    type = 'quota_exceeded';
    retryable = false;
    message = message || 'Quota exceeded. Please upgrade or wait until next month.';
  } else if (statusCode === 401 || statusCode === 403) {
    type = 'api';
    retryable = false;
    message = 'Authentication failed. Please sign in again.';
  } else if (statusCode === 404) {
    type = 'api';
    retryable = false;
    message = 'Note or deck not found.';
  } else if (statusCode === 500) {
    type = 'openai';
    message = 'Failed to generate flashcards. Please try again.';
  } else if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    type = 'network';
    message = 'Unable to connect. Check your internet connection.';
  }

  return {
    message,
    type,
    retryable,
    status: statusCode,
    quota: quota
  };
}

/**
 * Handles errors and converts them to GenerationError
 */
function handleError(error: unknown): GenerationError {
  // If it's already a GenerationError, return it
  if (isGenerationError(error)) {
    return error;
  }

  // Network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Unable to connect. Check your internet connection.',
      type: 'network',
      retryable: true,
    };
  }

  // Generic errors
  if (error instanceof Error) {
    return createGenerationError(error.message);
  }

  // Unknown errors
  return {
    message: 'An unexpected error occurred. Please try again.',
    type: 'unknown',
    retryable: true,
  };
}

/**
 * Type guard for GenerationError
 */
function isGenerationError(error: unknown): error is GenerationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'type' in error &&
    'retryable' in error
  );
}

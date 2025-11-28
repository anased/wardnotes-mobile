// Type definitions for AI flashcard generation feature

export type FlashcardType = 'cloze' | 'front_back';

// API Request/Response types matching web app

export interface GenerateFlashcardsRequest {
  note_id: string;
  card_type: FlashcardType;
  deck_id: string;
  max_cards: number;
  preview: boolean;
}

export interface GeneratedCard {
  front?: string;
  back?: string;
  cloze?: string;
}

export interface GenerateFlashcardsResponse {
  cards: GeneratedCard[];
  preview: boolean;
}

export interface SaveFlashcardsRequest {
  cards: GeneratedCard[];
  deck_id: string;
  note_id: string;
  card_type: FlashcardType;
}

export interface SaveFlashcardsResponse {
  success: boolean;
  flashcards: any[]; // Full flashcard records from database
  count: number;
}

// Preview card with selection state for mobile UI

export interface PreviewCard extends GeneratedCard {
  id: string; // Temporary ID for preview (e.g., "preview-0")
  isSelected: boolean; // Checkbox state
  isEdited: boolean; // Track if user edited this card
}

// Configuration state for generator modal

export interface FlashcardGeneratorConfig {
  noteId: string;
  noteTitle: string;
  cardType: FlashcardType;
  deckId: string;
  maxCards: number;
}

// Generation state machine

export type GenerationStatus =
  | 'idle'        // Initial state
  | 'loading'     // Generating cards
  | 'preview'     // Showing preview with edit/select
  | 'saving'      // Saving selected cards
  | 'success'     // Successfully saved
  | 'error';      // Error occurred

export interface GenerationState {
  status: GenerationStatus;
  error?: string;
  previewCards: PreviewCard[];
  savedCount?: number;
}

// Error types

export interface GenerationError {
  message: string;
  type: 'network' | 'api' | 'openai' | 'unknown';
  retryable: boolean;
}

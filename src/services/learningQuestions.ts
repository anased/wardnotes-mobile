// API service for Learning Questions feature
// Calls the web app's API endpoint for generating AI answers

import { supabase } from './supabase/client';
import type {
  LearningQuestionsRequest,
  LearningQuestionsResponse,
  LearningQuestionsError,
  QuestionAnswer,
} from '../types/learningQuestions';

// Configuration
const WEB_APP_URL = 'https://wardnotes.vercel.app';
// const WEB_APP_URL = 'http://localhost:3000'; // For local development

/**
 * Gets the authorization token from Supabase session
 */
async function getAuthToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error('You must be logged in to use this feature');
  }

  return session.access_token;
}

/**
 * Sends learning questions to the API and returns AI-generated answers
 */
export async function answerLearningQuestions(
  clinicalContext: string,
  questions: string[]
): Promise<LearningQuestionsResponse> {
  try {
    const token = await getAuthToken();

    // Filter out empty questions
    const validQuestions = questions.filter(q => q.trim().length > 0);

    if (!clinicalContext.trim()) {
      throw createLearningQuestionsError(
        'Please enter clinical context',
        undefined,
        'validation'
      );
    }

    if (validQuestions.length === 0) {
      throw createLearningQuestionsError(
        'Please enter at least one question',
        undefined,
        'validation'
      );
    }

    const requestBody: LearningQuestionsRequest = {
      clinicalContext: clinicalContext.trim(),
      questions: validQuestions,
    };

    const response = await fetch(`${WEB_APP_URL}/api/answer-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle quota exceeded error
      if (response.status === 429 && errorData.quota) {
        throw createLearningQuestionsError(
          errorData.message || errorData.error || 'Monthly limit reached',
          response.status,
          'quota_exceeded',
          errorData.quota
        );
      }

      throw createLearningQuestionsError(
        errorData.error || `Failed to generate answers (${response.status})`,
        response.status
      );
    }

    const data = await response.json();

    if (!data.answers || !Array.isArray(data.answers)) {
      throw new Error('Invalid response from server');
    }

    return {
      answers: data.answers as QuestionAnswer[],
      metadata: data.metadata || {
        generationTime: 0,
        questionCount: validQuestions.length,
      },
      quota: data.quota || {
        used: 0,
        limit: 0,
        remaining: 0,
      },
    };
  } catch (error) {
    console.error('Error generating learning answers:', error);
    throw handleError(error);
  }
}

/**
 * Creates a structured error object
 */
function createLearningQuestionsError(
  message: string,
  statusCode?: number,
  type?: LearningQuestionsError['type'],
  quota?: LearningQuestionsError['quota']
): LearningQuestionsError {
  let errorType: LearningQuestionsError['type'] = type || 'unknown';
  let retryable = true;

  if (statusCode === 429) {
    errorType = 'quota_exceeded';
    retryable = false;
    message = message || 'Monthly limit reached. Upgrade to Premium for unlimited access.';
  } else if (statusCode === 401 || statusCode === 403) {
    errorType = 'api';
    retryable = false;
    message = 'Authentication failed. Please sign in again.';
  } else if (statusCode === 400) {
    errorType = 'validation';
    retryable = false;
  } else if (statusCode === 500) {
    errorType = 'api';
    message = 'Failed to generate answers. Please try again.';
  } else if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    errorType = 'network';
    message = 'Unable to connect. Check your internet connection.';
  }

  return {
    message,
    type: errorType,
    retryable,
    status: statusCode,
    quota,
  };
}

/**
 * Handles errors and converts them to LearningQuestionsError
 */
function handleError(error: unknown): LearningQuestionsError {
  // If it's already a LearningQuestionsError, return it
  if (isLearningQuestionsError(error)) {
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
    return createLearningQuestionsError(error.message);
  }

  // Unknown errors
  return {
    message: 'An unexpected error occurred. Please try again.',
    type: 'unknown',
    retryable: true,
  };
}

/**
 * Type guard for LearningQuestionsError
 */
function isLearningQuestionsError(error: unknown): error is LearningQuestionsError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'type' in error &&
    'retryable' in error
  );
}

// Utility functions for formatting learning questions answers
// Converts AI-generated answers to TipTap JSON format for editor insertion

import type { QuestionAnswer } from '../types/learningQuestions';
import type { TipTapDocument, TipTapNode } from './tiptapConverter';

/**
 * Creates a TipTap text node
 */
function createTextNode(text: string, marks?: Array<{ type: string }>): TipTapNode {
  const node: TipTapNode = {
    type: 'text',
    text,
  };
  if (marks && marks.length > 0) {
    node.marks = marks;
  }
  return node;
}

/**
 * Parses inline markdown formatting and returns TipTap text nodes
 * Handles **bold**, *italic*, and ***bold italic***
 */
function parseInlineMarkdown(text: string): TipTapNode[] {
  const nodes: TipTapNode[] = [];

  // Regex to match **bold**, *italic*, or ***bold italic***
  // Order matters: check for *** first, then **, then *
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;

  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match as plain text
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      if (plainText) {
        nodes.push(createTextNode(plainText));
      }
    }

    // Determine the type of formatting
    if (match[2]) {
      // ***bold italic***
      nodes.push(createTextNode(match[2], [{ type: 'bold' }, { type: 'italic' }]));
    } else if (match[3]) {
      // **bold**
      nodes.push(createTextNode(match[3], [{ type: 'bold' }]));
    } else if (match[4]) {
      // *italic*
      nodes.push(createTextNode(match[4], [{ type: 'italic' }]));
    }

    lastIndex = pattern.lastIndex;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      nodes.push(createTextNode(remainingText));
    }
  }

  // If no formatting was found, return the original text as a single node
  if (nodes.length === 0 && text) {
    nodes.push(createTextNode(text));
  }

  return nodes;
}

/**
 * Creates a TipTap paragraph node with inline markdown parsing
 */
function createParagraph(text: string): TipTapNode {
  if (!text) {
    return {
      type: 'paragraph',
      content: [createTextNode('')],
    };
  }

  const contentNodes = parseInlineMarkdown(text);

  return {
    type: 'paragraph',
    content: contentNodes.length > 0 ? contentNodes : [createTextNode('')],
  };
}

/**
 * Creates a TipTap heading node
 */
function createHeading(text: string, level: number): TipTapNode {
  return {
    type: 'heading',
    attrs: { level },
    content: [createTextNode(text)],
  };
}

/**
 * Creates a horizontal rule node
 */
function createHorizontalRule(): TipTapNode {
  return {
    type: 'horizontalRule',
  };
}

/**
 * Splits text into paragraphs while preserving formatting
 * Handles markdown-like formatting from AI responses
 */
function textToParagraphs(text: string): TipTapNode[] {
  const nodes: TipTapNode[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines but add spacing
    if (!trimmedLine) {
      continue;
    }

    // Handle bullet points
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
      const bulletText = trimmedLine.substring(2);
      nodes.push({
        type: 'bulletList',
        content: [{
          type: 'listItem',
          content: [createParagraph(bulletText)],
        }],
      });
      continue;
    }

    // Handle numbered lists
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      nodes.push({
        type: 'orderedList',
        content: [{
          type: 'listItem',
          content: [createParagraph(numberedMatch[2])],
        }],
      });
      continue;
    }

    // Regular paragraph with potential inline formatting
    nodes.push(createParagraph(trimmedLine));
  }

  // Ensure at least one paragraph
  if (nodes.length === 0) {
    nodes.push(createParagraph(text));
  }

  return nodes;
}

/**
 * Formats learning question answers as TipTap document content
 * Returns an array of TipTap nodes to append to existing content
 */
export function formatAnswersToTipTap(
  clinicalContext: string,
  answers: QuestionAnswer[]
): TipTapNode[] {
  const nodes: TipTapNode[] = [];

  // Add separator
  nodes.push(createHorizontalRule());

  // Add main heading
  nodes.push(createHeading('Learning from this Encounter', 2));

  // Add clinical context section
  nodes.push(createHeading('Clinical Context', 3));
  nodes.push(createParagraph(clinicalContext));

  // Add spacing
  nodes.push(createParagraph(''));

  // Add Q&A section heading
  nodes.push(createHeading('Learning Questions & Answers', 3));

  // Add each Q&A pair
  answers.forEach((qa, index) => {
    // Question as sub-heading
    nodes.push(createHeading(`Q${index + 1}: ${qa.question}`, 4));

    // Answer as paragraphs
    const answerParagraphs = textToParagraphs(qa.answer);
    nodes.push(...answerParagraphs);

    // Add spacing between Q&A pairs
    if (index < answers.length - 1) {
      nodes.push(createParagraph(''));
    }
  });

  return nodes;
}

/**
 * Creates a complete TipTap document from the formatted answers
 * Use this when you need a standalone document
 */
export function answersToTipTapDocument(
  clinicalContext: string,
  answers: QuestionAnswer[]
): TipTapDocument {
  return {
    type: 'doc',
    content: formatAnswersToTipTap(clinicalContext, answers),
  };
}

/**
 * Merges new content nodes into existing TipTap document
 * Appends the new nodes after all existing content
 */
export function appendToTipTapDocument(
  existingDoc: TipTapDocument | null,
  newNodes: TipTapNode[]
): TipTapDocument {
  const existingContent = existingDoc?.content || [];

  return {
    type: 'doc',
    content: [
      ...existingContent,
      ...newNodes,
    ],
  };
}

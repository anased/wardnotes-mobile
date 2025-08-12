// src/utils/contentUtils.ts

/**
 * TipTap document interface
 */
export interface TipTapDocument {
  type: 'doc';
  content: Array<{
    type: string;
    content?: any[];
    attrs?: Record<string, any>;
    marks?: Array<{ type: string; attrs?: Record<string, any> }>;
    text?: string;
  }>;
}

/**
 * Validates if TipTap content has meaningful text
 */
export const hasContentText = (content: any): boolean => {
  if (!content || !content.content) return false;
  
  // Recursively check for text nodes
  const hasText = (nodes: any[]): boolean => {
    for (const node of nodes) {
      if (node.type === 'text' && node.text?.trim()) {
        return true;
      }
      if (node.content && hasText(node.content)) {
        return true;
      }
    }
    return false;
  };
  
  return hasText(content.content);
};

/**
 * Creates an empty TipTap document
 */
export const createEmptyTipTapDocument = (): TipTapDocument => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }]
    }
  ]
});
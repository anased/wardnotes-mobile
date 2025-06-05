// src/utils/contentUtils.ts
import { convertTipTapToHtml, convertHtmlToTipTap, normalizeContent, TipTapDocument } from './tiptapConverter';

/**
 * Converts various content formats to HTML for display in RichTextEditor
 */
export const convertContentToHtml = (content: any): string => {
  console.log('Converting content to HTML:', content);
  
  const normalized = normalizeContent(content);
  return normalized.html;
};

/**
 * Converts HTML content to TipTap format for storage (compatible with web app)
 */
export const convertHtmlToStorageFormat = (html: string): TipTapDocument => {
  return convertHtmlToTipTap(html);
};

/**
 * Validates if content has meaningful text
 */
export const hasContentText = (content: any): boolean => {
  const html = convertContentToHtml(content);
  // Remove HTML tags and check if there's meaningful text
  const textOnly = html.replace(/<[^>]*>/g, '').trim();
  return textOnly.length > 0;
};

// Re-export TipTap utilities for convenience
export { convertTipTapToHtml, convertHtmlToTipTap, normalizeContent, type TipTapDocument } from './tiptapConverter';
// src/utils/tableDetection.ts

/**
 * Utility functions for detecting tables in note content
 * Used to determine if a note requires web-only editing
 */

export interface TipTapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TipTapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
  text?: string;
}

export interface TipTapDocument {
  type: 'doc';
  content: TipTapNode[];
}

/**
 * Recursively searches for table nodes in TipTap content
 */
const findTablesInContent = (content: TipTapNode[]): boolean => {
  for (const node of content) {
    // Direct table node
    if (node.type === 'table') {
      return true;
    }
    
    // Table-related nodes (in case of nested structures)
    if (['tableRow', 'tableCell', 'tableHeader'].includes(node.type)) {
      return true;
    }
    
    // Recursively check nested content
    if (node.content && Array.isArray(node.content)) {
      if (findTablesInContent(node.content)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Detects if HTML content contains table elements
 */
const hasHtmlTables = (html: string): boolean => {
  if (!html || typeof html !== 'string') {
    return false;
  }
  
  // Look for HTML table elements
  const tableRegex = /<table[^>]*>|<tr[^>]*>|<td[^>]*>|<th[^>]*>/i;
  return tableRegex.test(html);
};

/**
 * Main function to detect if note content contains tables
 * Handles both TipTap JSON and HTML formats
 */
export const hasTablesInContent = (content: any): boolean => {
  if (!content) {
    return false;
  }
  
  console.log('🔍 === TABLE DETECTION ===');
  console.log('🔍 Content type:', typeof content);
  console.log('🔍 Content preview:', JSON.stringify(content)?.substring(0, 200));
  
  try {
    // Handle TipTap document format
    if (content.type === 'doc' && Array.isArray(content.content)) {
      console.log('🔍 Checking TipTap document format');
      const hasTable = findTablesInContent(content.content);
      console.log('🔍 TipTap table detection result:', hasTable);
      return hasTable;
    }
    
    // Handle array of nodes
    if (Array.isArray(content)) {
      console.log('🔍 Checking array of nodes');
      const hasTable = findTablesInContent(content);
      console.log('🔍 Array table detection result:', hasTable);
      return hasTable;
    }
    
    // Handle HTML string format
    if (typeof content === 'string') {
      console.log('🔍 Checking HTML string format');
      const hasTable = hasHtmlTables(content);
      console.log('🔍 HTML table detection result:', hasTable);
      return hasTable;
    }
    
    // Handle legacy format with html property
    if (content.html && typeof content.html === 'string') {
      console.log('🔍 Checking legacy HTML format');
      const hasTable = hasHtmlTables(content.html);
      console.log('🔍 Legacy HTML table detection result:', hasTable);
      return hasTable;
    }
    
    // Handle object with content property
    if (content.content) {
      console.log('🔍 Checking nested content property');
      return hasTablesInContent(content.content);
    }
    
    console.log('🔍 No recognized content format found');
    return false;
    
  } catch (error) {
    console.error('🔍 Error during table detection:', error);
    return false;
  }
};

/**
 * Gets a user-friendly description of why the note is web-only
 */
export const getWebOnlyReason = (content: any): string => {
  if (hasTablesInContent(content)) {
    return 'This note contains tables and can only be edited on the web version for full functionality.';
  }
  
  return '';
};

/**
 * Checks if a note should be restricted to web-only editing
 */
export const isWebOnlyNote = (content: any): boolean => {
  return hasTablesInContent(content);
};
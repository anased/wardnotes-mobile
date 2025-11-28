// Utility to parse TipTap JSON and convert to native React Native representation
// This enables true native rendering instead of WebView

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

// Check if content is valid TipTap JSON
export function isValidTipTapContent(content: any): boolean {
  if (!content) return false;
  if (typeof content === 'string') return false;
  if (content.type === 'doc' && Array.isArray(content.content)) return true;
  return false;
}

// Parse TipTap JSON document
export function parseTipTapDocument(content: any): TipTapDocument | null {
  if (!isValidTipTapContent(content)) {
    return null;
  }
  return content as TipTapDocument;
}

// Extract plain text from TipTap node (useful for previews)
export function extractPlainText(node: TipTapNode): string {
  if (node.text) {
    return node.text;
  }

  if (node.content) {
    return node.content.map(extractPlainText).join('');
  }

  return '';
}

// Get text with marks applied (for styling)
export interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  strike?: boolean;
}

export function extractTextSegments(node: TipTapNode): TextSegment[] {
  if (node.text) {
    const segment: TextSegment = { text: node.text };

    if (node.marks) {
      node.marks.forEach(mark => {
        switch (mark.type) {
          case 'bold':
            segment.bold = true;
            break;
          case 'italic':
            segment.italic = true;
            break;
          case 'underline':
            segment.underline = true;
            break;
          case 'code':
            segment.code = true;
            break;
          case 'strike':
            segment.strike = true;
            break;
        }
      });
    }

    return [segment];
  }

  if (node.content) {
    return node.content.flatMap(extractTextSegments);
  }

  return [];
}

// Convert TipTap document to a simpler structure for native rendering
export interface NativeBlock {
  type: 'heading' | 'paragraph' | 'bulletList' | 'orderedList' | 'listItem' | 'blockquote' | 'codeBlock';
  level?: number; // For headings
  segments: TextSegment[];
  children?: NativeBlock[]; // For lists
}

export function convertToNativeBlocks(document: TipTapDocument): NativeBlock[] {
  return document.content.map(convertNodeToBlock).filter(Boolean) as NativeBlock[];
}

function convertNodeToBlock(node: TipTapNode): NativeBlock | null {
  switch (node.type) {
    case 'heading':
      return {
        type: 'heading',
        level: node.attrs?.level || 1,
        segments: node.content ? node.content.flatMap(extractTextSegments) : [],
      };

    case 'paragraph':
      return {
        type: 'paragraph',
        segments: node.content ? node.content.flatMap(extractTextSegments) : [],
      };

    case 'bulletList':
      return {
        type: 'bulletList',
        segments: [],
        children: node.content?.map(convertNodeToBlock).filter(Boolean) as NativeBlock[],
      };

    case 'orderedList':
      return {
        type: 'orderedList',
        segments: [],
        children: node.content?.map(convertNodeToBlock).filter(Boolean) as NativeBlock[],
      };

    case 'listItem':
      // List items contain paragraphs
      const listItemContent = node.content?.[0]; // First child is usually the paragraph
      return {
        type: 'listItem',
        segments: listItemContent?.content ? listItemContent.content.flatMap(extractTextSegments) : [],
      };

    case 'blockquote':
      return {
        type: 'blockquote',
        segments: node.content ? node.content.flatMap(n => n.content?.flatMap(extractTextSegments) || []) : [],
      };

    case 'codeBlock':
      const codeText = node.content ? node.content.map(extractPlainText).join('\n') : '';
      return {
        type: 'codeBlock',
        segments: [{ text: codeText, code: true }],
      };

    default:
      return null;
  }
}

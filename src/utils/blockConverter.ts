// Convert between TipTap JSON and Editor Blocks
// Ensures perfect compatibility with web app

import type { EditorBlock, TextSpan, TextMarks } from '../types/editor';
import type { TipTapDocument, TipTapNode } from './tiptapNativeParser';

// Generate unique block IDs
let blockIdCounter = 0;
function generateBlockId(): string {
  return `block_${Date.now()}_${blockIdCounter++}`;
}

// ========================================
// TipTap → Editor Blocks (for loading)
// ========================================

export function tipTapToBlocks(document: TipTapDocument | null): EditorBlock[] {
  if (!document || !document.content || document.content.length === 0) {
    return [createEmptyBlock('paragraph')];
  }

  const blocks: EditorBlock[] = [];

  for (const node of document.content) {
    const block = convertNodeToBlock(node);
    if (block) {
      blocks.push(block);
    }
  }

  // Ensure at least one block
  if (blocks.length === 0) {
    blocks.push(createEmptyBlock('paragraph'));
  }

  return blocks;
}

function convertNodeToBlock(node: TipTapNode): EditorBlock | null {
  switch (node.type) {
    case 'heading':
      return {
        id: generateBlockId(),
        type: 'heading',
        level: node.attrs?.level || 1,
        spans: extractSpans(node.content || []),
      };

    case 'paragraph':
      return {
        id: generateBlockId(),
        type: 'paragraph',
        spans: extractSpans(node.content || []),
      };

    case 'bulletList':
      // Convert list to multiple blocks (one per item)
      // For Phase 1, we'll flatten lists
      return convertListToBlock(node, 'bulletList');

    case 'orderedList':
      return convertListToBlock(node, 'orderedList');

    case 'blockquote':
      return {
        id: generateBlockId(),
        type: 'blockquote',
        spans: extractSpans(node.content || []),
      };

    case 'codeBlock':
      return {
        id: generateBlockId(),
        type: 'codeBlock',
        spans: extractSpans(node.content || []),
      };

    default:
      return null;
  }
}

function convertListToBlock(node: TipTapNode, listType: 'bulletList' | 'orderedList'): EditorBlock {
  // For now, convert first list item to a block
  // TODO: Handle multiple list items properly
  const firstItem = node.content?.[0];
  const itemContent = firstItem?.content?.[0]; // First paragraph in list item

  return {
    id: generateBlockId(),
    type: listType,
    spans: extractSpans(itemContent?.content || []),
  };
}

function extractSpans(nodes: TipTapNode[]): TextSpan[] {
  if (nodes.length === 0) {
    return [{ text: '' }];
  }

  const spans: TextSpan[] = [];

  for (const node of nodes) {
    if (node.type === 'text') {
      const marks: TextMarks = {};

      if (node.marks) {
        for (const mark of node.marks) {
          switch (mark.type) {
            case 'bold':
              marks.bold = true;
              break;
            case 'italic':
              marks.italic = true;
              break;
            case 'code':
              marks.code = true;
              break;
            case 'strike':
              marks.strikethrough = true;
              break;
            case 'underline':
              marks.underline = true;
              break;
          }
        }
      }

      spans.push({
        text: node.text || '',
        marks: Object.keys(marks).length > 0 ? marks : undefined,
      });
    } else if (node.type === 'hardBreak') {
      spans.push({ text: '\n' });
    }
  }

  return spans;
}

// ========================================
// Editor Blocks → TipTap (for saving)
// ========================================

export function blocksToTipTap(blocks: EditorBlock[]): TipTapDocument {
  const content: TipTapNode[] = blocks.map(blockToTipTapNode);

  return {
    type: 'doc',
    content,
  };
}

function blockToTipTapNode(block: EditorBlock): TipTapNode {
  switch (block.type) {
    case 'heading':
      return {
        type: 'heading',
        attrs: { level: block.level || 1 },
        content: spansToTipTapNodes(block.spans),
      };

    case 'paragraph':
      return {
        type: 'paragraph',
        content: spansToTipTapNodes(block.spans),
      };

    case 'bulletList':
      return {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: spansToTipTapNodes(block.spans),
              },
            ],
          },
        ],
      };

    case 'orderedList':
      return {
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: spansToTipTapNodes(block.spans),
              },
            ],
          },
        ],
      };

    case 'blockquote':
      return {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: spansToTipTapNodes(block.spans),
          },
        ],
      };

    case 'codeBlock':
      return {
        type: 'codeBlock',
        content: spansToTipTapNodes(block.spans),
      };

    default:
      return {
        type: 'paragraph',
        content: spansToTipTapNodes(block.spans),
      };
  }
}

function spansToTipTapNodes(spans: TextSpan[]): TipTapNode[] {
  if (spans.length === 0 || (spans.length === 1 && spans[0].text === '')) {
    return [];
  }

  return spans.map(span => {
    const marks: Array<{ type: string }> = [];

    if (span.marks) {
      if (span.marks.bold) marks.push({ type: 'bold' });
      if (span.marks.italic) marks.push({ type: 'italic' });
      if (span.marks.code) marks.push({ type: 'code' });
      if (span.marks.strikethrough) marks.push({ type: 'strike' });
      if (span.marks.underline) marks.push({ type: 'underline' });
    }

    return {
      type: 'text',
      text: span.text,
      marks: marks.length > 0 ? marks : undefined,
    };
  });
}

// ========================================
// Helper Functions
// ========================================

export function createEmptyBlock(type: EditorBlock['type'], level?: number): EditorBlock {
  return {
    id: generateBlockId(),
    type,
    level,
    spans: [{ text: '' }],
  };
}

export function getBlockStyle(block: EditorBlock): any {
  switch (block.type) {
    case 'heading':
      return getHeadingStyle(block.level || 1);
    case 'bulletList':
    case 'orderedList':
      return styles.listItem;
    case 'blockquote':
      return styles.blockquote;
    case 'codeBlock':
      return styles.codeBlock;
    default:
      return styles.paragraph;
  }
}

function getHeadingStyle(level: number): any {
  switch (level) {
    case 1:
      return styles.heading1;
    case 2:
      return styles.heading2;
    case 3:
      return styles.heading3;
    default:
      return styles.paragraph;
  }
}

// Style definitions
const styles = {
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    marginBottom: 8,
  },
  heading1: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    color: '#111827',
    marginBottom: 12,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: '#111827',
    marginBottom: 10,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
    color: '#111827',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    paddingLeft: 24,
    marginBottom: 4,
  },
  blockquote: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
    fontStyle: 'italic' as const,
    paddingLeft: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d1d5db',
    marginBottom: 8,
  },
  codeBlock: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Courier',
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
};

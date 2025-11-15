// Convert native editor content to TipTap JSON format
// This allows native editing while maintaining TipTap compatibility

import type { TipTapDocument, TipTapNode } from './tiptapNativeParser';

export interface ParsedLine {
  type: 'heading' | 'paragraph' | 'listItem' | 'empty';
  level?: number;
  text: string;
  formatting: FormattingRange[];
}

export interface FormattingRange {
  start: number;
  end: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

// Parse markdown-style text to TipTap JSON
// Supports: # Headings, **bold**, *italic*, and basic lists
export function parseNativeTextToTipTap(text: string, formatting: FormattingRange[] = []): TipTapDocument {
  const lines = text.split('\n');
  const nodes: TipTapNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const parsedLine = parseLine(line, formatting);

    if (parsedLine.type === 'empty') {
      // Add empty paragraph for spacing
      nodes.push({
        type: 'paragraph',
        content: [],
      });
    } else if (parsedLine.type === 'heading') {
      nodes.push(createHeadingNode(parsedLine));
    } else if (parsedLine.type === 'listItem') {
      // Collect consecutive list items
      const listItems: ParsedLine[] = [parsedLine];
      i++;
      while (i < lines.length) {
        const nextLine = parseLine(lines[i], formatting);
        if (nextLine.type === 'listItem') {
          listItems.push(nextLine);
          i++;
        } else {
          i--;
          break;
        }
      }
      nodes.push(createListNode(listItems));
    } else {
      // Regular paragraph
      nodes.push(createParagraphNode(parsedLine));
    }

    i++;
  }

  // Ensure at least one empty paragraph if content is empty
  if (nodes.length === 0) {
    nodes.push({
      type: 'paragraph',
      content: [],
    });
  }

  return {
    type: 'doc',
    content: nodes,
  };
}

function parseLine(line: string, formatting: FormattingRange[]): ParsedLine {
  const trimmed = line.trim();

  // Empty line
  if (!trimmed) {
    return { type: 'empty', text: '', formatting: [] };
  }

  // Heading detection (# = h1, ## = h2, ### = h3)
  const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    return {
      type: 'heading',
      level: headingMatch[1].length,
      text: headingMatch[2],
      formatting: [],
    };
  }

  // List item detection (- or • or 1. etc)
  const listMatch = trimmed.match(/^[-•]\s+(.+)$/);
  if (listMatch) {
    return {
      type: 'listItem',
      text: listMatch[1],
      formatting: [],
    };
  }

  // Regular paragraph
  return {
    type: 'paragraph',
    text: trimmed,
    formatting: [],
  };
}

function createHeadingNode(parsed: ParsedLine): TipTapNode {
  return {
    type: 'heading',
    attrs: { level: parsed.level || 1 },
    content: createTextContent(parsed.text, parsed.formatting),
  };
}

function createParagraphNode(parsed: ParsedLine): TipTapNode {
  return {
    type: 'paragraph',
    content: createTextContent(parsed.text, parsed.formatting),
  };
}

function createListNode(items: ParsedLine[]): TipTapNode {
  return {
    type: 'bulletList',
    content: items.map(item => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: createTextContent(item.text, item.formatting),
        },
      ],
    })),
  };
}

function createTextContent(text: string, formatting: FormattingRange[]): TipTapNode[] {
  if (!text) {
    return [];
  }

  // If no formatting, return simple text node
  if (formatting.length === 0) {
    return [{ type: 'text', text }];
  }

  // TODO: Apply formatting ranges to create styled text nodes
  // For now, return plain text
  return [{ type: 'text', text }];
}

// Simple conversion for basic text editing
export function simpleTextToTipTap(text: string): TipTapDocument {
  return parseNativeTextToTipTap(text);
}

// Convert TipTap JSON to plain text for editing
export function tipTapToPlainText(document: TipTapDocument | null): string {
  if (!document || !document.content) {
    return '';
  }

  const lines: string[] = [];

  for (const node of document.content) {
    lines.push(nodeToPlainText(node));
  }

  return lines.join('\n');
}

function nodeToPlainText(node: TipTapNode): string {
  switch (node.type) {
    case 'heading':
      const level = node.attrs?.level || 1;
      const headingPrefix = '#'.repeat(level);
      const headingText = extractTextFromNode(node);
      return `${headingPrefix} ${headingText}`;

    case 'paragraph':
      return extractTextFromNode(node);

    case 'bulletList':
      if (node.content) {
        return node.content.map(item => {
          const itemText = extractTextFromNode(item);
          return `- ${itemText}`;
        }).join('\n');
      }
      return '';

    case 'orderedList':
      if (node.content) {
        return node.content.map((item, index) => {
          const itemText = extractTextFromNode(item);
          return `${index + 1}. ${itemText}`;
        }).join('\n');
      }
      return '';

    case 'listItem':
      // Extract text from the paragraph inside the list item
      if (node.content && node.content[0]) {
        return extractTextFromNode(node.content[0]);
      }
      return '';

    case 'blockquote':
      const quoteText = extractTextFromNode(node);
      return `> ${quoteText}`;

    case 'codeBlock':
      const codeText = extractTextFromNode(node);
      return `\`\`\`\n${codeText}\n\`\`\``;

    default:
      return extractTextFromNode(node);
  }
}

function extractTextFromNode(node: TipTapNode): string {
  if (node.text) {
    return node.text;
  }

  if (node.content) {
    return node.content.map(extractTextFromNode).join('');
  }

  return '';
}

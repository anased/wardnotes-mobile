// WYSIWYG Editor Type Definitions
// Block-based editor with rich text spans (no markdown markers)

export interface EditorBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'bulletList' | 'orderedList' | 'blockquote' | 'codeBlock';
  level?: number; // For headings (1-6)
  spans: TextSpan[];
}

export interface TextSpan {
  text: string;
  marks?: TextMarks;
}

export interface TextMarks {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
}

// Editor state
export interface EditorState {
  blocks: EditorBlock[];
  focusedBlockId: string | null;
  selection?: {
    blockId: string;
    start: number;
    end: number;
  };
}

// Formatting actions
export type BlockType = EditorBlock['type'];
export type InlineFormat = keyof TextMarks;

export interface BlockStyle {
  fontSize: number;
  fontWeight?: 'normal' | 'bold' | '600';
  fontFamily?: string;
  lineHeight?: number;
  marginBottom?: number;
  paddingLeft?: number;
  backgroundColor?: string;
  borderLeftWidth?: number;
  borderLeftColor?: string;
}

// WYSIWYG Note Editor - Block-based with rich text formatting
// No markdown markers visible, true WYSIWYG experience

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, InputAccessoryView } from 'react-native';
import RichTextInput from './RichTextInput';
import FormattingToolbar, { type FormattingAction } from './FormattingToolbar';
import { tipTapToBlocks, blocksToTipTap, createEmptyBlock, getBlockStyle } from '../../utils/blockConverter';
import type { EditorBlock, TextSpan, TextMarks, InlineFormat } from '../../types/editor';
import type { TipTapDocument } from '../../utils/tiptapNativeParser';

interface WYSIWYGNoteEditorProps {
  initialContent: any;
  onContentChange: (content: TipTapDocument) => void;
  onStateChange?: (state: { currentBlockType?: string; hasSelection: boolean; handleFormat: (action: FormattingAction) => void }) => void;
}

export const INPUT_ACCESSORY_VIEW_ID = 'wardnotes-wysiwyg-toolbar';

export default function WYSIWYGNoteEditor({
  initialContent,
  onContentChange,
  onStateChange,
}: WYSIWYGNoteEditorProps) {
  // Parse initial content to blocks
  const initialBlocks = tipTapToBlocks(initialContent);

  const [blocks, setBlocks] = useState<EditorBlock[]>(initialBlocks);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [selection, setSelection] = useState({ blockId: '', start: 0, end: 0 });

  // Notify parent of changes (only when blocks actually change)
  useEffect(() => {
    const tipTapDoc = blocksToTipTap(blocks);
    onContentChange(tipTapDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      const currentBlockType = blocks.find(b => b.id === focusedBlockId)?.type;
      const hasSelection = selection.start !== selection.end;
      onStateChange({ currentBlockType, hasSelection, handleFormat });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedBlockId, selection.start, selection.end, handleFormat]);

  // Update a block's content
  const updateBlock = useCallback((blockId: string, spans: TextSpan[]) => {
    setBlocks(prev =>
      prev.map(block =>
        block.id === blockId ? { ...block, spans } : block
      )
    );
  }, []);

  // Create new block after current block
  const createBlockAfter = useCallback((blockId: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === blockId);
      if (index === -1) return prev;

      const newBlock = createEmptyBlock('paragraph');
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);

      // Focus the new block
      setTimeout(() => setFocusedBlockId(newBlock.id), 100);

      return newBlocks;
    });
  }, []);

  // Delete a block
  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => {
      if (prev.length === 1) {
        // Don't delete the last block, just clear it
        return [createEmptyBlock('paragraph')];
      }

      const index = prev.findIndex(b => b.id === blockId);
      if (index === -1) return prev;

      // Focus previous block
      if (index > 0) {
        setTimeout(() => setFocusedBlockId(prev[index - 1].id), 100);
      }

      return prev.filter(b => b.id !== blockId);
    });
  }, []);

  // Change block type
  const changeBlockType = useCallback((blockId: string, type: EditorBlock['type'], level?: number) => {
    setBlocks(prev =>
      prev.map(block =>
        block.id === blockId ? { ...block, type, level } : block
      )
    );
  }, []);

  // Apply inline formatting
  const applyInlineFormat = useCallback((format: InlineFormat) => {
    if (!focusedBlockId) return;

    const block = blocks.find(b => b.id === focusedBlockId);
    if (!block) return;

    const { start, end } = selection;
    if (start === end) {
      // No selection - can't apply formatting
      return;
    }

    // Apply formatting to selected range
    const newSpans = applyFormattingToRange(block.spans, start, end, format);
    updateBlock(focusedBlockId, newSpans);
  }, [focusedBlockId, selection, blocks, updateBlock]);

  // Handle formatting actions from toolbar
  const handleFormat = useCallback((action: FormattingAction) => {
    if (!focusedBlockId) return;

    switch (action.type) {
      case 'heading1':
        changeBlockType(focusedBlockId, 'heading', 1);
        break;
      case 'heading2':
        changeBlockType(focusedBlockId, 'heading', 2);
        break;
      case 'heading3':
        changeBlockType(focusedBlockId, 'heading', 3);
        break;
      case 'bulletList':
        changeBlockType(focusedBlockId, 'bulletList');
        break;
      case 'orderedList':
        changeBlockType(focusedBlockId, 'orderedList');
        break;
      case 'blockquote':
        changeBlockType(focusedBlockId, 'blockquote');
        break;
      case 'codeBlock':
        changeBlockType(focusedBlockId, 'codeBlock');
        break;
      case 'bold':
        applyInlineFormat('bold');
        break;
      case 'italic':
        applyInlineFormat('italic');
        break;
      case 'code':
        applyInlineFormat('code');
        break;
      case 'strikethrough':
        applyInlineFormat('strikethrough');
        break;
      case 'undo':
        // TODO: Implement undo
        break;
      case 'redo':
        // TODO: Implement redo
        break;
    }
  }, [focusedBlockId, changeBlockType, applyInlineFormat]);

  return (
    <View style={styles.container}>
      {blocks.map((block) => (
        <RichTextInput
          key={block.id}
          block={block}
          isFocused={focusedBlockId === block.id}
          onFocus={() => setFocusedBlockId(block.id)}
          onBlur={() => {
            // Don't unfocus if toolbar was tapped
            // This prevents keyboard from closing when formatting
          }}
          onChange={(spans) => updateBlock(block.id, spans)}
          onEnter={() => createBlockAfter(block.id)}
          onBackspace={(isEmpty) => {
            if (isEmpty) deleteBlock(block.id);
          }}
          onSelectionChange={(start, end) => {
            setSelection({ blockId: block.id, start, end });
          }}
          blockStyle={getBlockStyle(block)}
          inputAccessoryViewID={INPUT_ACCESSORY_VIEW_ID}
        />
      ))}
    </View>
  );
}

// ========================================
// Helper Functions
// ========================================

// Apply formatting to a specific range in spans
function applyFormattingToRange(
  spans: TextSpan[],
  start: number,
  end: number,
  format: InlineFormat
): TextSpan[] {
  const result: TextSpan[] = [];
  let currentPos = 0;

  for (const span of spans) {
    const spanStart = currentPos;
    const spanEnd = currentPos + span.text.length;

    // Span is completely before selection
    if (spanEnd <= start) {
      result.push(span);
      currentPos = spanEnd;
      continue;
    }

    // Span is completely after selection
    if (spanStart >= end) {
      result.push(span);
      currentPos = spanEnd;
      continue;
    }

    // Span overlaps with selection - need to split
    const overlapStart = Math.max(spanStart, start);
    const overlapEnd = Math.min(spanEnd, end);

    // Before overlap
    if (overlapStart > spanStart) {
      result.push({
        text: span.text.substring(0, overlapStart - spanStart),
        marks: span.marks,
      });
    }

    // Overlap - apply formatting
    const overlapText = span.text.substring(
      overlapStart - spanStart,
      overlapEnd - spanStart
    );

    const newMarks: TextMarks = { ...span.marks };

    // Toggle the format
    if (newMarks[format]) {
      delete newMarks[format];
    } else {
      newMarks[format] = true;
    }

    result.push({
      text: overlapText,
      marks: Object.keys(newMarks).length > 0 ? newMarks : undefined,
    });

    // After overlap
    if (overlapEnd < spanEnd) {
      result.push({
        text: span.text.substring(overlapEnd - spanStart),
        marks: span.marks,
      });
    }

    currentPos = spanEnd;
  }

  return result;
}

const styles = StyleSheet.create({
  container: {
    minHeight: 300,
  },
});

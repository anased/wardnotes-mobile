// Native Note Editor - iOS Notes-like editing experience
// Uses native TextInput with formatting toolbar

import React, { useState, useRef, useEffect } from 'react';
import { TextInput, StyleSheet, InputAccessoryView } from 'react-native';
import FormattingToolbar, { type FormattingAction } from './FormattingToolbar';
import { parseTipTapDocument } from '../../utils/tiptapNativeParser';
import { tipTapToPlainText, simpleTextToTipTap } from '../../utils/nativeToTipTap';
import type { TipTapDocument } from '../../utils/tiptapNativeParser';

interface NativeNoteEditorProps {
  initialContent: any;
  onContentChange: (content: TipTapDocument) => void;
  placeholder?: string;
}

interface HistoryState {
  text: string;
  cursor: number;
}

const INPUT_ACCESSORY_VIEW_ID = 'wardnotes-formatting-toolbar';

export default function NativeNoteEditor({
  initialContent,
  onContentChange,
  placeholder = 'Start writing your medical note...'
}: NativeNoteEditorProps) {
  const textInputRef = useRef<TextInput>(null);

  // Convert initial TipTap content to plain text
  const initialDoc = parseTipTapDocument(initialContent);
  const initialText = tipTapToPlainText(initialDoc);

  const [text, setText] = useState(initialText);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Undo/Redo history
  const [history, setHistory] = useState<HistoryState[]>([{ text: initialText, cursor: 0 }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Notify parent of content changes
  useEffect(() => {
    const tipTapDoc = simpleTextToTipTap(text);
    onContentChange(tipTapDoc);
  }, [text, onContentChange]);

  const handleTextChange = (newText: string) => {
    setText(newText);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ text: newText, cursor: cursorPosition });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleFormat = (action: FormattingAction) => {
    console.log('🎨 Format action:', action.type);

    switch (action.type) {
      case 'heading1':
        insertHeading(1);
        break;
      case 'heading2':
        insertHeading(2);
        break;
      case 'heading3':
        insertHeading(3);
        break;
      case 'bulletList':
        insertListItem('- ');
        break;
      case 'orderedList':
        insertListItem('1. ');
        break;
      case 'undo':
        performUndo();
        break;
      case 'redo':
        performRedo();
        break;
      case 'bold':
        // Bold formatting would require selection tracking
        // For now, just add ** markers
        wrapSelection('**', '**');
        break;
      case 'italic':
        wrapSelection('*', '*');
        break;
    }

    console.log('✅ Format action completed');

    // Refocus TextInput to keep keyboard open after formatting
    // Use requestAnimationFrame for smoother focus handling
    requestAnimationFrame(() => {
      console.log('🎯 Refocusing TextInput');
      textInputRef.current?.focus();
    });
  };

  const insertHeading = (level: number) => {
    console.log(`📝 insertHeading(${level})`);
    const lines = text.split('\n');
    const currentLineIndex = getCurrentLineIndex();
    const currentLine = lines[currentLineIndex] || '';
    console.log('Current line:', currentLine);

    // Remove existing heading markers
    const cleanLine = currentLine.replace(/^#+\s*/, '');

    // Add new heading marker
    const headingPrefix = '#'.repeat(level) + ' ';
    lines[currentLineIndex] = headingPrefix + cleanLine;

    const newText = lines.join('\n');
    console.log('New text:', newText);

    // Update text state
    setText(newText);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ text: newText, cursor: cursorPosition });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const insertListItem = (prefix: string) => {
    const lines = text.split('\n');
    const currentLineIndex = getCurrentLineIndex();
    const currentLine = lines[currentLineIndex] || '';

    // If line already starts with list marker, don't add another
    if (currentLine.match(/^[-•]\s/) || currentLine.match(/^\d+\.\s/)) {
      return;
    }

    lines[currentLineIndex] = prefix + currentLine;

    const newText = lines.join('\n');

    // Update text state
    setText(newText);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ text: newText, cursor: cursorPosition });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const wrapSelection = (prefix: string, suffix: string) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const afterCursor = text.substring(cursorPosition);

    const newText = beforeCursor + prefix + suffix + afterCursor;

    // Update text state
    setText(newText);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ text: newText, cursor: cursorPosition });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Move cursor between the markers
    const newCursor = cursorPosition + prefix.length;
    setCursorPosition(newCursor);
  };

  const getCurrentLineIndex = (): number => {
    const beforeCursor = text.substring(0, cursorPosition);
    return beforeCursor.split('\n').length - 1;
  };

  const performUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      setText(previousState.text);
      setCursorPosition(previousState.cursor);
      setHistoryIndex(newIndex);
    }
  };

  const performRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setText(nextState.text);
      setCursorPosition(nextState.cursor);
      setHistoryIndex(newIndex);
    }
  };

  return (
    <>
      <TextInput
        ref={textInputRef}
        style={styles.textInput}
        multiline
        value={text}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        onSelectionChange={(event) => {
          setCursorPosition(event.nativeEvent.selection.start);
        }}
        autoCapitalize="sentences"
        autoCorrect
        textAlignVertical="top"
        inputAccessoryViewID={INPUT_ACCESSORY_VIEW_ID}
        blurOnSubmit={false}
      />

      <InputAccessoryView nativeID={INPUT_ACCESSORY_VIEW_ID}>
        <FormattingToolbar
          onFormat={handleFormat}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />
      </InputAccessoryView>
    </>
  );
}

const styles = StyleSheet.create({
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    padding: 16,
    textAlignVertical: 'top',
  },
});

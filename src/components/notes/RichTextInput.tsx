// Rich Text Input Component
// Displays formatted text with WYSIWYG styling (no markdown markers)

import React, { useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputSelectionChangeEventData, NativeSyntheticEvent } from 'react-native';
import type { EditorBlock, TextSpan, TextMarks } from '../../types/editor';

interface RichTextInputProps {
  block: EditorBlock;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (spans: TextSpan[]) => void;
  onEnter: () => void;
  onBackspace: (isEmpty: boolean) => void;
  onSelectionChange: (start: number, end: number) => void;
  blockStyle: any;
  inputAccessoryViewID?: string;
}

export default function RichTextInput({
  block,
  isFocused,
  onFocus,
  onBlur,
  onChange,
  onEnter,
  onBackspace,
  onSelectionChange,
  blockStyle,
  inputAccessoryViewID,
}: RichTextInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  // Convert spans to plain text for TextInput
  const plainText = block.spans.map(span => span.text).join('');

  // Handle text changes
  const handleTextChange = (newText: string) => {
    // For now, create a single span with the new text
    // TODO: Preserve formatting when editing
    const newSpans: TextSpan[] = [{ text: newText }];
    onChange(newSpans);
  };

  // Handle selection changes
  const handleSelectionChange = (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    const { start, end } = event.nativeEvent.selection;
    setSelection({ start, end });
    onSelectionChange(start, end);
  };

  // Handle keyboard events
  const handleKeyPress = (event: any) => {
    if (event.nativeEvent.key === 'Enter') {
      onEnter();
    } else if (event.nativeEvent.key === 'Backspace' && plainText === '') {
      onBackspace(true);
    }
  };

  // Render formatted text (when not focused)
  const renderFormattedText = () => {
    if (block.spans.length === 0 || (block.spans.length === 1 && block.spans[0].text === '')) {
      return (
        <Text style={[blockStyle, styles.placeholder]}>
          {getPlaceholderText(block.type)}
        </Text>
      );
    }

    return (
      <Text style={blockStyle}>
        {block.spans.map((span, index) => {
          const spanStyle = getSpanStyle(span.marks);

          // Add bullet/number prefix for lists
          const prefix = getListPrefix(block, index);

          return (
            <Text key={index} style={spanStyle}>
              {prefix}{span.text}
            </Text>
          );
        })}
      </Text>
    );
  };

  // When not focused, show formatted text
  if (!isFocused) {
    console.log('📄 Block NOT focused - showing formatted text');
    return (
      <TouchableOpacity onPress={() => {
        console.log('👆 Block tapped - calling onFocus');
        onFocus();
      }} activeOpacity={1}>
        <View style={[styles.container, blockStyle]}>
          {renderFormattedText()}
        </View>
      </TouchableOpacity>
    );
  }

  // When focused, show TextInput
  console.log('✏️ Block IS focused - showing TextInput with accessoryViewID:', inputAccessoryViewID);
  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={[blockStyle, styles.input]}
        value={plainText}
        onChangeText={handleTextChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onSelectionChange={handleSelectionChange}
        onKeyPress={handleKeyPress}
        multiline
        autoFocus
        placeholder={getPlaceholderText(block.type)}
        placeholderTextColor="#9ca3af"
        selection={selection}
        inputAccessoryViewID={inputAccessoryViewID}
      />
    </View>
  );
}

// Helper: Get text style based on marks
function getSpanStyle(marks?: TextMarks) {
  const style: any = {};

  if (marks?.bold) {
    style.fontWeight = 'bold';
  }

  if (marks?.italic) {
    style.fontStyle = 'italic';
  }

  if (marks?.code) {
    style.fontFamily = 'Courier';
    style.backgroundColor = '#f3f4f6';
    style.paddingHorizontal = 4;
    style.paddingVertical = 2;
    style.borderRadius = 2;
  }

  if (marks?.strikethrough) {
    style.textDecorationLine = 'line-through';
  }

  if (marks?.underline) {
    style.textDecorationLine = style.textDecorationLine
      ? 'underline line-through'
      : 'underline';
  }

  return style;
}

// Helper: Get list prefix (bullet or number)
function getListPrefix(block: EditorBlock, spanIndex: number): string {
  if (spanIndex !== 0) return '';

  if (block.type === 'bulletList') {
    return '• ';
  } else if (block.type === 'orderedList') {
    return '1. '; // TODO: Track actual number
  }

  return '';
}

// Helper: Get placeholder text based on block type
function getPlaceholderText(type: EditorBlock['type']): string {
  switch (type) {
    case 'heading':
      return 'Heading';
    case 'bulletList':
      return 'List item';
    case 'orderedList':
      return 'Numbered item';
    case 'blockquote':
      return 'Quote';
    case 'codeBlock':
      return 'Code';
    default:
      return 'Type something...';
  }
}

const styles = StyleSheet.create({
  container: {
    minHeight: 24,
    paddingVertical: 4,
  },
  input: {
    padding: 0,
    margin: 0,
    textAlignVertical: 'top',
  },
  placeholder: {
    color: '#9ca3af',
  },
});

// Native formatting toolbar for note editing
// Provides iOS Notes-like formatting controls

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export interface FormattingAction {
  type: 'heading1' | 'heading2' | 'heading3' | 'bold' | 'italic' | 'code' | 'strikethrough' | 'bulletList' | 'orderedList' | 'blockquote' | 'codeBlock' | 'undo' | 'redo';
}

interface FormattingToolbarProps {
  onFormat: (action: FormattingAction) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  currentBlockType?: string;
  hasSelection?: boolean;
}

export default function FormattingToolbar({ onFormat, canUndo = false, canRedo = false, currentBlockType, hasSelection = false }: FormattingToolbarProps) {
  const insets = useSafeAreaInsets();

  // Block type buttons (change entire block)
  const blockButtons = [
    { type: 'heading1' as const, label: 'H1' },
    { type: 'heading2' as const, label: 'H2' },
    { type: 'heading3' as const, label: 'H3' },
    { type: 'bulletList' as const, icon: 'list' as const },
    { type: 'orderedList' as const, icon: 'list-outline' as const },
    { type: 'blockquote' as const, icon: 'chatbox-outline' as const },
    { type: 'codeBlock' as const, icon: 'code-slash' as const },
  ];

  // Inline formatting buttons (require text selection)
  const inlineButtons = [
    { type: 'bold' as const, label: 'B', bold: true },
    { type: 'italic' as const, label: 'I', italic: true },
    { type: 'code' as const, label: '<>' },
    { type: 'strikethrough' as const, icon: 'remove' as const },
  ];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {/* Block type buttons */}
        {blockButtons.map((button) => {
          const isActive = currentBlockType === button.type ||
            (button.type.includes('heading') && currentBlockType === 'heading');

          return (
            <TouchableOpacity
              key={button.type}
              style={[styles.button, isActive && styles.buttonActive]}
              onPress={() => onFormat({ type: button.type })}
              activeOpacity={0.7}
            >
              {'label' in button ? (
                <Text style={[
                  styles.buttonText,
                  button.type === 'heading1' && styles.h1Text,
                  button.type === 'heading2' && styles.h2Text,
                  button.type === 'heading3' && styles.h3Text,
                  isActive && styles.buttonTextActive,
                ]}>
                  {button.label}
                </Text>
              ) : (
                <Ionicons name={button.icon} size={20} color={isActive ? "#0ea5e9" : "#374151"} />
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.separator} />

        {/* Inline formatting buttons */}
        {inlineButtons.map((button) => (
          <TouchableOpacity
            key={button.type}
            style={[styles.button, !hasSelection && styles.buttonDisabled]}
            onPress={() => onFormat({ type: button.type })}
            disabled={!hasSelection}
            activeOpacity={0.7}
          >
            {'label' in button ? (
              <Text style={[
                styles.buttonText,
                'bold' in button && styles.boldText,
                'italic' in button && styles.italicText,
                !hasSelection && styles.textDisabled,
              ]}>
                {button.label}
              </Text>
            ) : (
              <Ionicons name={button.icon} size={20} color={hasSelection ? "#374151" : "#d1d5db"} />
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.separator} />

        {/* Undo/Redo */}
        <TouchableOpacity
          style={[styles.button, !canUndo && styles.buttonDisabled]}
          onPress={() => onFormat({ type: 'undo' })}
          disabled={!canUndo}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-undo" size={20} color={canUndo ? "#374151" : "#d1d5db"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !canRedo && styles.buttonDisabled]}
          onPress={() => onFormat({ type: 'redo' })}
          disabled={!canRedo}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-redo" size={20} color={canRedo ? "#374151" : "#d1d5db"} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0ea5e9',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  buttonTextActive: {
    color: '#0ea5e9',
  },
  textDisabled: {
    color: '#d1d5db',
  },
  h1Text: {
    fontSize: 18,
  },
  h2Text: {
    fontSize: 16,
  },
  h3Text: {
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  separator: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
});

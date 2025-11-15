// Native formatting toolbar for note editing
// Provides iOS Notes-like formatting controls

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export interface FormattingAction {
  type: 'heading1' | 'heading2' | 'heading3' | 'bold' | 'italic' | 'bulletList' | 'orderedList' | 'undo' | 'redo';
}

interface FormattingToolbarProps {
  onFormat: (action: FormattingAction) => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function FormattingToolbar({ onFormat, canUndo = false, canRedo = false }: FormattingToolbarProps) {
  const insets = useSafeAreaInsets();

  const buttons = [
    { type: 'heading1' as const, icon: 'text', label: 'H1' },
    { type: 'heading2' as const, icon: 'text', label: 'H2' },
    { type: 'heading3' as const, icon: 'text', label: 'H3' },
    { type: 'bold' as const, icon: 'text', label: 'B', iconName: null },
    { type: 'italic' as const, icon: 'text', label: 'I', iconName: null },
    { type: 'bulletList' as const, icon: 'list', label: '•' },
    { type: 'orderedList' as const, icon: 'list', label: '1.' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {buttons.map((button) => (
          <TouchableOpacity
            key={button.type}
            style={styles.button}
            onPress={() => onFormat({ type: button.type })}
            activeOpacity={0.7}
          >
            {button.type === 'heading1' ? (
              <Text style={[styles.buttonText, styles.h1Text]}>H1</Text>
            ) : button.type === 'heading2' ? (
              <Text style={[styles.buttonText, styles.h2Text]}>H2</Text>
            ) : button.type === 'heading3' ? (
              <Text style={[styles.buttonText, styles.h3Text]}>H3</Text>
            ) : button.type === 'bold' ? (
              <Text style={[styles.buttonText, styles.boldText]}>B</Text>
            ) : button.type === 'italic' ? (
              <Text style={[styles.buttonText, styles.italicText]}>I</Text>
            ) : button.type === 'bulletList' ? (
              <Ionicons name="list" size={20} color="#374151" />
            ) : button.type === 'orderedList' ? (
              <Ionicons name="list-outline" size={20} color="#374151" />
            ) : null}
          </TouchableOpacity>
        ))}

        <View style={styles.separator} />

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
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
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

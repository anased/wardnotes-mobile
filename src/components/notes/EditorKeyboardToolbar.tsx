import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EditorBridge } from '@10play/tentap-editor';

interface EditorKeyboardToolbarProps {
  editor: EditorBridge;
  visible?: boolean;
}

const EditorKeyboardToolbar: React.FC<EditorKeyboardToolbarProps> = ({
  editor,
  visible = true
}) => {
  if (!visible || !editor) {
    return null;
  }

  const handleBold = () => {
    editor.toggleBold();
  };

  const handleItalic = () => {
    editor.toggleItalic();
  };

  const handleUnderline = () => {
    editor.toggleUnderline();
  };

  const handleBulletList = () => {
    editor.toggleBulletList();
  };

  const handleOrderedList = () => {
    editor.toggleOrderedList();
  };

  const handleUndo = () => {
    editor.undo();
  };

  const handleRedo = () => {
    editor.redo();
  };

  return (
    <View style={styles.toolbar}>
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.button} onPress={handleUndo}>
          <Ionicons name="arrow-undo" size={20} color="#374151" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleRedo}>
          <Ionicons name="arrow-redo" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.separator} />

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.button} onPress={handleBold}>
          <Text style={styles.boldText}>B</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleItalic}>
          <Text style={styles.italicText}>I</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleUnderline}>
          <Text style={styles.underlineText}>U</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.separator} />

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.button} onPress={handleBulletList}>
          <Ionicons name="list" size={20} color="#374151" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleOrderedList}>
          <Ionicons name="list-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    minHeight: 44, // Minimum touch target size
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: '#d1d5db',
    marginHorizontal: 8,
  },
  boldText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  italicText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#374151',
  },
  underlineText: {
    fontSize: 16,
    textDecorationLine: 'underline',
    color: '#374151',
  },
});

export default EditorKeyboardToolbar;
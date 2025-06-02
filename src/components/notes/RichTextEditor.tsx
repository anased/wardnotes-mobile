import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

interface RichTextEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
  editable?: boolean;
}

export default function RichTextEditor({
  initialContent = '',
  onContentChange,
  editable = true,
}: RichTextEditorProps) {
  const richText = useRef<RichEditor>(null);

  const handleContentChange = (content: string) => {
    onContentChange(content);
  };

  return (
    <View style={styles.container}>
      {editable && (
        <RichToolbar
          editor={richText}
          actions={[
            actions.setBold,
            actions.setItalic,
            actions.setUnderline,
            actions.heading1,
            actions.heading2,
            actions.insertBulletsList,
            actions.insertOrderedList,
            actions.insertLink,
            actions.undo,
            actions.redo,
          ]}
          style={styles.toolbar}
          selectedIconTint="#0ea5e9"
          iconTint="#6b7280"
        />
      )}
      
      <ScrollView style={styles.editorContainer}>
        <RichEditor
          ref={richText}
          onChange={handleContentChange}
          placeholder="Start writing your medical note..."
          initialContentHTML={initialContent}
          style={styles.editor}
          editorStyle={{
            backgroundColor: 'white',
            color: '#1f2937',
            contentCSSText: `
              body {
                font-family: system-ui;
                font-size: 16px;
                line-height: 1.5;
                padding: 15px;
                color: #1f2937;
              }
              h1 { font-size: 24px; font-weight: bold; margin: 10px 0; }
              h2 { font-size: 20px; font-weight: bold; margin: 8px 0; }
              ul, ol { margin: 10px 0; padding-left: 20px; }
              li { margin: 5px 0; }
              p { margin: 5px 0; }
            `,
          }}
          disabled={!editable}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  toolbar: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  editorContainer: {
    flex: 1,
    minHeight: 200,
  },
  editor: {
    flex: 1,
  },
});
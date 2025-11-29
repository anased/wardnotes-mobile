// TipTapViewer - Read-only TipTap content viewer using WebView
// Provides native-feeling typography and full TipTap feature support
// Uses the same mobile-optimized CSS as the editor for consistency

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { RichText, useEditorBridge } from '@10play/tentap-editor';
import { MOBILE_TYPOGRAPHY_CSS } from '../../constants/editorStyles';
import { convertTipTapToHtml } from '../../utils/tiptapConverter';

interface TipTapViewerProps {
  content: any; // TipTap JSON
}

export default function TipTapViewer({ content }: TipTapViewerProps) {
  // Convert TipTap JSON to HTML for display (workaround for 10tap-editor initialization)
  const contentHtml = React.useMemo(() => {
    if (!content) return '';

    try {
      // If it's already a string, use it
      if (typeof content === 'string') {
        return content;
      }

      // Convert TipTap JSON to HTML
      const html = convertTipTapToHtml(content);
      return html;
    } catch (error) {
      console.error('TipTapViewer - Error converting TipTap to HTML:', error);
      return '';
    }
  }, [content]);

  const editor = useEditorBridge({
    autofocus: false,
    editable: false, // KEY: Read-only mode
    initialContent: contentHtml,
  });

  useEffect(() => {
    if (!editor) return;

    const initializeViewer = async () => {
      try {
        // Wait for editor to be ready
        let retries = 0;
        const maxRetries = 10;

        while (retries < maxRetries) {
          try {
            await editor.getJSON();
            console.log('✓ TipTapViewer - Editor bridge ready');
            break;
          } catch (error: any) {
            retries++;
            if (retries >= maxRetries) {
              console.error('TipTapViewer - Failed to initialize after max retries:', error);
              break;
            }
            await new Promise<void>(resolve => setTimeout(resolve, 500));
          }
        }

        // Inject mobile typography CSS
        editor.injectCSS(MOBILE_TYPOGRAPHY_CSS, 'mobile-typography');
        console.log('✅ TipTapViewer - Mobile typography CSS injected');
      } catch (error: any) {
        console.error('TipTapViewer - Error initializing:', error);
      }
    };

    initializeViewer();
  }, [editor]);

  return (
    <View style={styles.container}>
      <RichText
        editor={editor}
        style={styles.viewer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  viewer: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});

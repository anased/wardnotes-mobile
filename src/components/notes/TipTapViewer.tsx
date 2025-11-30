// TipTapViewer - Read-only TipTap content viewer using WebView
// Provides native-feeling typography and full TipTap feature support
// Uses the same mobile-optimized CSS as the editor for consistency

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { RichText, useEditorBridge } from '@10play/tentap-editor';
import { MOBILE_TYPOGRAPHY_CSS } from '../../constants/editorStyles';
import { convertTipTapToHtml } from '../../utils/tiptapConverter';

interface TipTapViewerProps {
  content: any; // TipTap JSON
}

export default function TipTapViewer({ content }: TipTapViewerProps) {
  const [isReady, setIsReady] = useState(false);

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
      console.log('TipTapViewer - Converted to HTML:', html);
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
              setIsReady(true); // Show content anyway
              return;
            }
            await new Promise<void>(resolve => setTimeout(resolve, 500));
          }
        }

        // Inject mobile typography CSS
        await editor.injectCSS(MOBILE_TYPOGRAPHY_CSS, 'mobile-typography');
        console.log('✅ TipTapViewer - Mobile typography CSS injected');

        // Mark as ready
        setIsReady(true);
      } catch (error: any) {
        console.error('TipTapViewer - Error initializing:', error);
        setIsReady(true); // Show content anyway
      }
    };

    initializeViewer();
  }, [editor]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  viewer: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});

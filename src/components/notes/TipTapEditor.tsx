import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
import { convertTipTapToHtml } from '../../utils/tiptapConverter';

// Mobile-optimized typography CSS
// Matches the native NativeNoteRenderer styles exactly for consistency
// This CSS is injected into the WebView to provide iOS Notes-like appearance
const MOBILE_TYPOGRAPHY_CSS = `
  /* Base body styles - match iOS system font */
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    color: #1f2937 !important;
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Mobile-optimized heading sizes - match native exactly */
  h1, h1 * {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 24px !important;
    font-weight: 700 !important;
    line-height: 1.4 !important;
    margin-top: 16px !important;
    margin-bottom: 12px !important;
    color: #1f2937 !important;
  }

  h2, h2 * {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 20px !important;
    font-weight: 700 !important;
    line-height: 1.4 !important;
    margin-top: 14px !important;
    margin-bottom: 10px !important;
    color: #1f2937 !important;
  }

  h3, h3 * {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    line-height: 1.4 !important;
    margin-top: 12px !important;
    margin-bottom: 8px !important;
    color: #1f2937 !important;
  }

  h4 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 17px !important;
    font-weight: 600 !important;
    line-height: 1.4 !important;
    margin-top: 10px !important;
    margin-bottom: 6px !important;
    color: #1f2937 !important;
  }

  h5, h6 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    line-height: 1.4 !important;
    margin-top: 8px !important;
    margin-bottom: 6px !important;
    color: #1f2937 !important;
  }

  /* Body text - optimal for mobile reading */
  p {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 16px !important;
    line-height: 1.5 !important;
    margin-bottom: 12px !important;
    color: #1f2937 !important;
  }

  /* Lists - tighter spacing for mobile */
  ul, ol {
    margin-top: 8px !important;
    margin-bottom: 12px !important;
    padding-left: 24px !important;
  }

  li {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 16px !important;
    line-height: 1.5 !important;
    margin-bottom: 4px !important;
    color: #1f2937 !important;
  }

  /* Blockquotes */
  blockquote {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 16px !important;
    line-height: 1.5 !important;
    margin: 12px 0 !important;
    padding-left: 12px !important;
    color: #6b7280 !important;
    font-style: italic !important;
    border-left: 3px solid #d1d5db !important;
  }

  /* Code blocks */
  pre {
    font-family: "Courier New", Courier, monospace !important;
    font-size: 14px !important;
    line-height: 1.4 !important;
    padding: 12px !important;
    margin: 12px 0 !important;
    background-color: #f3f4f6 !important;
    border-radius: 6px !important;
    color: #1f2937 !important;
  }

  code {
    font-family: "Courier New", Courier, monospace !important;
    font-size: 14px !important;
    color: #1f2937 !important;
  }

  /* Inline code */
  p code, li code {
    background-color: #f3f4f6 !important;
    padding: 2px 4px !important;
    border-radius: 3px !important;
  }

  /* Bold, italic, etc - ensure they inherit font family */
  strong, b {
    font-weight: 700 !important;
  }

  em, i {
    font-style: italic !important;
  }
`;

interface TipTapEditorProps {
  initialContent?: any;
  onContentChange: (content: any) => void;
  editable?: boolean;
  placeholder?: string;
  showToolbar?: boolean;
  renderToolbarExternally?: boolean; // If true, returns editor bridge for external toolbar rendering
}

export interface TipTapEditorRef {
  forceContentUpdate: () => Promise<void>;
  getCurrentContent: () => Promise<any>;
  getEditorBridge: () => any; // Expose editor bridge for external toolbar
}

const TipTapEditor = React.forwardRef<TipTapEditorRef, TipTapEditorProps>(({
  initialContent,
  onContentChange,
  editable = true,
  placeholder = 'Start writing your medical note...',
  showToolbar = true,
  renderToolbarExternally = false,
}, ref) => {
  const contentUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');

  // Function to manually check and update content
  const forceContentUpdate = async () => {
    if (!editor || !editable || !onContentChange) {
      console.log('Force update skipped - missing:', { editor: !!editor, editable, onContentChange: !!onContentChange });
      return;
    }

    try {
      console.log('=== FORCE CONTENT UPDATE STARTED ===');
      // Use getJSON() instead of getHTML() for direct TipTap JSON
      const tipTapContent = await editor.getJSON();
      const contentString = JSON.stringify(tipTapContent);
      console.log('Current TipTap JSON from editor:', contentString);
      console.log('Last stored content:', lastContentRef.current);
      console.log('Content comparison:', contentString === lastContentRef.current ? 'SAME' : 'DIFFERENT');

      // Always update content when force update is called, regardless of comparison
      console.log('Force update - processing content change...');
      lastContentRef.current = contentString;

      // Pass TipTap JSON directly - no conversion needed!
      console.log('Force update - TipTap JSON:', JSON.stringify(tipTapContent, null, 2));
      onContentChange(tipTapContent);
      console.log('Force update - content change callback executed successfully');
    } catch (error: any) {
      console.error('Error getting JSON from editor:', error);
    }

    console.log('=== FORCE CONTENT UPDATE COMPLETED ===');
  };

  // Convert TipTap JSON to HTML for initialContent (workaround for 10tap-editor bug #282)
  const initialHtml = React.useMemo(() => {
    if (!initialContent) return '';

    try {
      // If it's already a string, use it
      if (typeof initialContent === 'string') {
        return initialContent;
      }

      // Convert TipTap JSON to HTML
      const html = convertTipTapToHtml(initialContent);
      console.log('TipTapEditor - Converted TipTap JSON to HTML:', html);
      return html;
    } catch (error) {
      console.error('Error converting TipTap to HTML:', error);
      return '';
    }
  }, [initialContent]);

  console.log('TipTapEditor - Props:', { initialContent, editable, placeholder });
  console.log('TipTapEditor - Initial HTML for editor:', initialHtml);

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: false,
    initialContent: initialHtml,
    editable: editable,
  });

  useEffect(() => {
    if (!editor) return;

    const initializeContent = async () => {
      try {
        // Wait for editor to be ready
        let retries = 0;
        const maxRetries = 10;

        while (retries < maxRetries) {
          try {
            await editor.getJSON();
            console.log('✓ Editor bridge ready');
            break;
          } catch (error: any) {
            retries++;
            console.warn(`Editor not ready yet, retry ${retries}/${maxRetries}`);
            if (retries >= maxRetries) {
              console.error('Failed to initialize editor after max retries:', error);
              break;
            }
            await new Promise<void>(resolve => setTimeout(resolve, 500));
          }
        }

        // Inject CSS ASAP
        editor.injectCSS(MOBILE_TYPOGRAPHY_CSS, 'mobile-typography');
        console.log('✅ Mobile typography CSS injected');

        if (initialHtml && !lastContentRef.current) {
          lastContentRef.current = initialHtml;
          console.log('✓ Initial content loaded successfully');
        }
      } catch (error: any) {
        console.error('Error initializing content:', error);
      }
    };

    initializeContent();
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Monitor content changes using polling
  useEffect(() => {
    if (!editor || !editable || !onContentChange) return;

    const checkContentChanges = async () => {
      try {
        // Use getJSON() for direct TipTap JSON - no conversion needed!
        const tipTapContent = await editor.getJSON();
        const contentString = JSON.stringify(tipTapContent);

        if (contentString !== lastContentRef.current && contentString.trim() !== '') {
          console.log('Content change detected via polling');
          console.log('Previous:', lastContentRef.current);
          console.log('Current:', contentString);

          lastContentRef.current = contentString;

          if (contentUpdateRef.current) {
            clearTimeout(contentUpdateRef.current);
          }

          contentUpdateRef.current = setTimeout(() => {
            console.log('=== TRIGGERING CONTENT CHANGE ===');
            console.log('Sending TipTap JSON to parent:', contentString);

            // Pass TipTap JSON directly - no conversion!
            onContentChange(tipTapContent);
            console.log('✓ Content change callback executed successfully with TipTap JSON');
          }, 100);
        }
      } catch (error: any) {
        console.error('Error checking content changes:', error);
      }
    };

    // Poll for changes every 500ms when editor is focused/active
    const interval = setInterval(checkContentChanges, 500);

    return () => {
      clearInterval(interval);
    };
  }, [editor, editable, onContentChange]);

  // Cleanup effect to capture final content changes
  useEffect(() => {
    return () => {
      if (contentUpdateRef.current) {
        clearTimeout(contentUpdateRef.current);
      }
      // Don't force update on unmount as it can interfere with save operations
    };
  }, []);

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    forceContentUpdate: forceContentUpdate,
    getCurrentContent: async () => {
      if (editor) {
        try {
          // Use getJSON() for direct TipTap JSON - no conversion!
          const tipTapContent = await editor.getJSON();
          return tipTapContent;
        } catch (error: any) {
          console.error('Error getting current content:', error);
          return null;
        }
      }
      return null;
    },
    getEditorBridge: () => editor,
  }), [editor, forceContentUpdate]);

  if (!editable) {
    // Read-only mode - no toolbar needed
    return (
      <View style={[styles.container, styles.readOnlyContainer]}>
        <RichText
          editor={editor}
          style={[styles.editor, styles.readOnlyEditor]}
        />
      </View>
    );
  }

  // Editable mode - if renderToolbarExternally is true, only return RichText
  if (renderToolbarExternally) {
    return (
      <View style={styles.editorWrapper}>
        <RichText
          editor={editor}
          style={styles.editor}
        />
      </View>
    );
  }

  // Default mode with embedded toolbar (for simple use cases)
  return (
    <View style={styles.editorWrapper}>
      <RichText
        editor={editor}
        style={styles.editor}
      />
      {showToolbar && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <Toolbar editor={editor} />
        </KeyboardAvoidingView>
      )}
    </View>
  );
});

TipTapEditor.displayName = 'TipTapEditor';

export default TipTapEditor;

const styles = StyleSheet.create({
  editorWrapper: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  // Official 10tap-editor pattern for toolbar above keyboard
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  readOnlyContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
  },
  editor: {
    flex: 1,
    minHeight: 200,
    padding: 16,
  },
  readOnlyEditor: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
});
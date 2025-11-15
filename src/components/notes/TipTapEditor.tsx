import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { RichText, useEditorBridge } from '@10play/tentap-editor';
import { convertTipTapToHtml, convertHtmlToTipTap } from '../../utils/tiptapConverter';
import EditorKeyboardToolbar from './EditorKeyboardToolbar';

// Mobile-optimized typography CSS
// Follows iOS Notes app principle: comfortable reading and editing on mobile
// This CSS is injected into the WebView to provide mobile-appropriate font sizes
const MOBILE_TYPOGRAPHY_CSS = `
  /* Mobile-optimized heading sizes */
  h1, h1 * {
    font-size: 24px !important;
    line-height: 1.4 !important;
    margin-top: 16px !important;
    margin-bottom: 12px !important;
  }

  h2, h2 * {
    font-size: 20px !important;
    line-height: 1.4 !important;
    margin-top: 14px !important;
    margin-bottom: 10px !important;
  }

  h3, h3 * {
    font-size: 18px !important;
    line-height: 1.4 !important;
    margin-top: 12px !important;
    margin-bottom: 8px !important;
  }

  h4 {
    font-size: 17px !important;
    line-height: 1.4 !important;
  }

  h5, h6 {
    font-size: 16px !important;
    line-height: 1.4 !important;
  }

  /* Body text - optimal for mobile reading */
  p {
    font-size: 16px !important;
    line-height: 1.5 !important;
    margin-bottom: 12px !important;
  }

  /* Lists - tighter spacing for mobile */
  ul, ol {
    margin-top: 8px !important;
    margin-bottom: 12px !important;
    padding-left: 24px !important;
  }

  li {
    font-size: 16px !important;
    line-height: 1.5 !important;
    margin-bottom: 4px !important;
  }

  /* Blockquotes */
  blockquote {
    font-size: 16px !important;
    line-height: 1.5 !important;
    margin: 12px 0 !important;
    padding-left: 12px !important;
  }

  /* Code blocks */
  pre {
    font-size: 14px !important;
    line-height: 1.4 !important;
    padding: 12px !important;
    margin: 12px 0 !important;
  }

  code {
    font-size: 14px !important;
  }

  /* Disable text size adjustment for consistent rendering */
  body {
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
  }
`;

interface TipTapEditorProps {
  initialContent?: any;
  onContentChange: (content: any) => void;
  editable?: boolean;
  placeholder?: string;
  showToolbar?: boolean;
}

export interface TipTapEditorRef {
  forceContentUpdate: () => Promise<void>;
  getCurrentContent: () => Promise<any>;
}

const TipTapEditor = React.forwardRef<TipTapEditorRef, TipTapEditorProps>(({
  initialContent,
  onContentChange,
  editable = true,
  placeholder = 'Start writing your medical note...',
  showToolbar = true,
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
      const htmlContent = await editor.getHTML();
      console.log('Current HTML from editor:', htmlContent);
      console.log('Last stored content:', lastContentRef.current);
      console.log('Content comparison:', htmlContent === lastContentRef.current ? 'SAME' : 'DIFFERENT');
      
      // Always update content when force update is called, regardless of comparison
      console.log('Force update - processing content change...');
      lastContentRef.current = htmlContent;
      
      try {
        // Convert HTML to TipTap for consistency
        const { convertHtmlToTipTap } = require('../../utils/tiptapConverter');
        const tipTapContent = convertHtmlToTipTap(htmlContent);
        console.log('Force update - converted HTML to TipTap:', JSON.stringify(tipTapContent, null, 2));
        onContentChange(tipTapContent);
        console.log('Force update - content change callback executed successfully');
      } catch (error: any) {
        console.error('Error in content processing:', error);
        console.log('Fallback: passing raw HTML content');
        onContentChange(htmlContent);
      }
    } catch (error: any) {
      console.error('Error getting HTML from editor:', error);
    }
    
    console.log('=== FORCE CONTENT UPDATE COMPLETED ===');
  };

  // Convert TipTap JSON to HTML for the editor
  const convertTipTapToHtmlContent = (tipTapContent: any): string => {
    if (!tipTapContent) return '';
    
    try {
      if (typeof tipTapContent === 'string') {
        return tipTapContent;
      }
      
      const converted = convertTipTapToHtml(tipTapContent);
      console.log('Minimal - TipTap to HTML conversion:', converted);
      return converted;
    } catch (error: any) {
      console.error('Error converting TipTap to HTML:', error);
      return '';
    }
  };

  const initialHtmlContent = convertTipTapToHtmlContent(initialContent);
  console.log('Minimal - Initial content:', initialHtmlContent);

  console.log('TipTapEditor - Props:', { initialContent, editable, placeholder });
  console.log('TipTapEditor - onContentChange type:', typeof onContentChange);
  
  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: false,
    initialContent: initialHtmlContent || '',
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
            // Check if editor is ready by testing a simple operation
            await editor.getHTML();
            
            // Only set initial content if we haven't set any content yet
            if (initialContent && initialHtmlContent && !lastContentRef.current) {
              console.log('Minimal - Setting initial content:', initialHtmlContent);
              await editor.setContent(initialHtmlContent);
              lastContentRef.current = initialHtmlContent;
              console.log('✓ Initial content set successfully');
              break;
            } else if (lastContentRef.current) {
              console.log('✓ Editor ready, content already exists, skipping initial content');
              break;
            } else {
              console.log('✓ Editor ready, no initial content to set');
              break;
            }
          } catch (error: any) {
            retries++;
            console.warn(`Editor not ready yet, retry ${retries}/${maxRetries}`);
            if (retries >= maxRetries) {
              console.error('Failed to initialize content after max retries:', error);
              break;
            }
            await new Promise<void>(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (error: any) {
        console.error('Error initializing content:', error);
      }
    };

    // Only initialize once
    initializeContent();
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Inject mobile-optimized typography CSS once when editor initializes
  useEffect(() => {
    if (!editor) return;

    const setupMobileTypography = async () => {
      try {
        // Wait for editor to be ready
        await new Promise(resolve => setTimeout(resolve, 300));

        // Inject mobile typography CSS once
        // This is the proper way to configure WebView styles for mobile
        editor.injectCSS(MOBILE_TYPOGRAPHY_CSS, 'mobile-typography');

        console.log('✅ Mobile typography configured');
      } catch (error: any) {
        console.error('Error configuring mobile typography:', error);
      }
    };

    setupMobileTypography();
  }, [editor]);

  // Monitor content changes using polling
  useEffect(() => {
    if (!editor || !editable || !onContentChange) return;

    const checkContentChanges = async () => {
      try {
        const htmlContent = await editor.getHTML();
        if (htmlContent !== lastContentRef.current && htmlContent.trim() !== '') {
          console.log('Content change detected via polling');
          console.log('Previous:', lastContentRef.current);
          console.log('Current:', htmlContent);
          
          lastContentRef.current = htmlContent;
          
          if (contentUpdateRef.current) {
            clearTimeout(contentUpdateRef.current);
          }
          
          contentUpdateRef.current = setTimeout(() => {
            console.log('=== TRIGGERING CONTENT CHANGE ===');
            console.log('Sending content to parent:', htmlContent);
            
            try {
              // Convert HTML to TipTap for saving
              const { convertHtmlToTipTap } = require('../../utils/tiptapConverter');
              const tipTapContent = convertHtmlToTipTap(htmlContent);
              console.log('Converted HTML to TipTap:', JSON.stringify(tipTapContent, null, 2));
              onContentChange(tipTapContent);
              console.log('✓ Content change callback executed successfully with TipTap data');
            } catch (error: any) {
              console.error('✗ Error converting HTML to TipTap:', error);
              // Fallback: send HTML and let parent handle conversion
              onContentChange(htmlContent);
              console.log('✓ Content change callback executed with HTML fallback');
            }
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
          const htmlContent = await editor.getHTML();
          const tipTapContent = convertHtmlToTipTap(htmlContent);
          return tipTapContent;
        } catch (error: any) {
          console.error('Error getting current content:', error);
          return null;
        }
      }
      return null;
    }
  }), [editor, forceContentUpdate]);

  return (
    <View style={[styles.container, !editable && styles.readOnlyContainer]}>
      <RichText
        editor={editor}
        style={[styles.editor, !editable && styles.readOnlyEditor]}
      />
      {showToolbar && editable && (
        <EditorKeyboardToolbar editor={editor} />
      )}
    </View>
  );
});

TipTapEditor.displayName = 'TipTapEditor';

export default TipTapEditor;

const styles = StyleSheet.create({
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
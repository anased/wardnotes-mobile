// src/utils/tiptapConverter.ts

/**
 * Utilities for converting between HTML and TipTap JSON format
 * to ensure compatibility between mobile and web versions
 * Uses a custom HTML parser that works in React Native
 */

export interface TipTapNode {
    type: string;
    attrs?: Record<string, any>;
    content?: TipTapNode[];
    marks?: Array<{ type: string; attrs?: Record<string, any> }>;
    text?: string;
  }
  
  export interface TipTapDocument {
    type: 'doc';
    content: TipTapNode[];
  }
  
  /**
   * Simple HTML parser for React Native
   */
  interface ParsedElement {
    type: 'element' | 'text';
    tagName?: string;
    text?: string;
    attributes?: Record<string, string>;
    children?: ParsedElement[];
  }
  
  /**
   * Escapes HTML special characters
   */
  const escapeHtml = (text: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return text.replace(/[&<>"']/g, (char) => map[char]);
  };
  
  /**
   * Parse attributes from tag content
   */
  const parseAttributes = (tagContent: string): Record<string, string> => {
    const attributes: Record<string, string> = {};
    const attrRegex = /(\w+)=["']([^"']*)["']/g;
    let match;
  
    while ((match = attrRegex.exec(tagContent)) !== null) {
      attributes[match[1]] = match[2];
    }
  
    return attributes;
  };
  
  /**
   * Extract text content from parsed elements
   */
  const extractTextFromChildren = (children: ParsedElement[]): string => {
    return children.map(child => {
      if (child.type === 'text') {
        return child.text || '';
      } else if (child.children) {
        return extractTextFromChildren(child.children);
      }
      return '';
    }).join('');
  };
  
  /**
   * Simple HTML parser that works in React Native
   */
  const parseHTML = (html: string): ParsedElement[] => {
    const elements: ParsedElement[] = [];
    let currentPos = 0;
  
    while (currentPos < html.length) {
      const nextTag = html.indexOf('<', currentPos);
      
      if (nextTag === -1) {
        // No more tags, add remaining text - preserve whitespace
        const text = html.substring(currentPos);
        if (text) {
          elements.push({ type: 'text', text });
        }
        break;
      }
  
      // Add text before the tag - preserve whitespace
      if (nextTag > currentPos) {
        const text = html.substring(currentPos, nextTag);
        if (text) {
          elements.push({ type: 'text', text });
        }
      }
  
      // Parse the tag
      const tagEnd = html.indexOf('>', nextTag);
      if (tagEnd === -1) {
        // Malformed HTML - treat the rest as text
        const text = html.substring(currentPos).trim();
        if (text) {
          elements.push({ type: 'text', text });
        }
        break;
      }
  
      const tagContent = html.substring(nextTag + 1, tagEnd);
      
      // Check if it's a closing tag
      if (tagContent.startsWith('/')) {
        currentPos = tagEnd + 1;
        continue;
      }
  
      // Check if it's a self-closing tag
      const isSelfClosing = tagContent.endsWith('/') || 
        ['br', 'hr', 'img', 'input'].includes(tagContent.split(' ')[0]);
  
      if (isSelfClosing) {
        const tagName = tagContent.split(' ')[0].replace('/', '');
        const attributes = parseAttributes(tagContent);
        elements.push({ 
          type: 'element', 
          tagName: tagName.toLowerCase(), 
          attributes,
          children: [] 
        });
        currentPos = tagEnd + 1;
        continue;
      }
  
      // Find the closing tag
      const tagName = tagContent.split(' ')[0];
      const closingTag = `</${tagName}>`;
      const closingPos = html.indexOf(closingTag, tagEnd + 1);
  
      if (closingPos === -1) {
        // No closing tag found, treat the content from the current position as text
        // This handles malformed HTML by preserving it as text content
        const remainingText = html.substring(nextTag);
        elements.push({ type: 'text', text: remainingText });
        break;
      }
  
      // Extract content between opening and closing tags
      const innerContent = html.substring(tagEnd + 1, closingPos);
      const attributes = parseAttributes(tagContent);
      
      // Recursively parse inner content
      const children = parseHTML(innerContent);
      
      elements.push({
        type: 'element',
        tagName: tagName.toLowerCase(),
        attributes,
        children
      });
      
      currentPos = closingPos + closingTag.length;
    }
  
    return elements;
  };
  
  /**
   * Converts a parsed element to TipTap format
   */
  const convertParsedElementToTipTap = (element: ParsedElement): TipTapNode | null => {
    if (element.type === 'text') {
      const text = element.text || '';
      if (text.trim() === '') {
        return null;
      }
      return {
        type: 'text',
        text: text
      };
    }
  
    if (element.type === 'element' && element.tagName) {
      const tagName = element.tagName.toLowerCase();
      const children = (element.children || [])
        .map(convertParsedElementToTipTap)
        .filter(Boolean) as TipTapNode[];
  
      switch (tagName) {
        case 'p':
          // Ensure paragraph always has at least one text node
          const paragraphContent = children.length > 0 ? children : [{ type: 'text', text: '' }];
          // Filter out null/undefined children and ensure we have valid text nodes
          const validContent = paragraphContent.filter(child => child && child.type === 'text');
          return {
            type: 'paragraph',
            content: validContent.length > 0 ? validContent : [{ type: 'text', text: '' }]
          };
  
        case 'h1':
          return {
            type: 'heading',
            attrs: { level: 1 },
            content: children.length > 0 ? children.filter(child => child && child.type === 'text') : [{ type: 'text', text: '' }]
          };
  
        case 'h2':
          return {
            type: 'heading',
            attrs: { level: 2 },
            content: children.length > 0 ? children.filter(child => child && child.type === 'text') : [{ type: 'text', text: '' }]
          };
  
        case 'h3':
          return {
            type: 'heading',
            attrs: { level: 3 },
            content: children.length > 0 ? children.filter(child => child && child.type === 'text') : [{ type: 'text', text: '' }]
          };
  
        case 'h4':
          return {
            type: 'heading',
            attrs: { level: 4 },
            content: children.length > 0 ? children.filter(child => child && child.type === 'text') : [{ type: 'text', text: '' }]
          };
  
        case 'h5':
          return {
            type: 'heading',
            attrs: { level: 5 },
            content: children.length > 0 ? children.filter(child => child && child.type === 'text') : [{ type: 'text', text: '' }]
          };
  
        case 'h6':
          return {
            type: 'heading',
            attrs: { level: 6 },
            content: children.length > 0 ? children.filter(child => child && child.type === 'text') : [{ type: 'text', text: '' }]
          };
  
        case 'ul':
          return {
            type: 'bulletList',
            content: children.filter(child => child.type === 'listItem')
          };
  
        case 'ol':
          return {
            type: 'orderedList',
            content: children.filter(child => child.type === 'listItem')
          };
  
        case 'li':
          // Wrap text children in paragraphs for TipTap compatibility
          const listContent = children.length > 0 ? children : [{ type: 'text', text: '' }];
          const wrappedContent = listContent.map(child => {
            if (child && child.type === 'text') {
              return {
                type: 'paragraph',
                content: [child]
              };
            }
            return child;
          }).filter(Boolean);
          
          return {
            type: 'listItem',
            content: wrappedContent.length > 0 ? wrappedContent : [{
              type: 'paragraph',
              content: [{ type: 'text', text: '' }]
            }]
          };
  
        case 'blockquote':
          const validBlockquoteChildren = children.filter(child => child && (child.type === 'paragraph' || child.type === 'text'));
          return {
            type: 'blockquote',
            content: validBlockquoteChildren.length > 0 ? validBlockquoteChildren : [{
              type: 'paragraph',
              content: [{ type: 'text', text: '' }]
            }]
          };
  
        case 'br':
          return {
            type: 'hardBreak'
          };
  
        case 'hr':
          return {
            type: 'horizontalRule'
          };
  
        case 'pre':
          // Handle code blocks
          const codeText = extractTextFromChildren(element.children || []);
          return {
            type: 'codeBlock',
            content: [{ type: 'text', text: codeText }]
          };
  
        case 'strong':
        case 'b':
          // Preserve text nodes with proper spacing, including leading/trailing spaces
          if (children.length === 1 && children[0]?.type === 'text') {
            return {
              ...children[0],
              marks: [{ type: 'bold' }]
            };
          }
          // Extract text while preserving whitespace
          const boldText = element.children?.map(child => {
            if (child.type === 'text') return child.text || '';
            return '';
          }).join('') || '';
          
          return {
            type: 'text',
            text: boldText,
            marks: [{ type: 'bold' }]
          };
  
        case 'em':
        case 'i':
          // Preserve text nodes with proper spacing, including leading/trailing spaces
          if (children.length === 1 && children[0]?.type === 'text') {
            return {
              ...children[0],
              marks: [{ type: 'italic' }]
            };
          }
          // Extract text while preserving whitespace
          const italicText = element.children?.map(child => {
            if (child.type === 'text') return child.text || '';
            return '';
          }).join('') || '';
          
          return {
            type: 'text',
            text: italicText,
            marks: [{ type: 'italic' }]
          };
  
        case 'u':
          const underlineText = extractTextFromChildren(element.children || []);
          return {
            type: 'text',
            text: underlineText,
            marks: [{ type: 'underline' }]
          };
  
        case 's':
        case 'strike':
          const strikeText = extractTextFromChildren(element.children || []);
          return {
            type: 'text',
            text: strikeText,
            marks: [{ type: 'strike' }]
          };
  
        case 'code':
          const codeInlineText = extractTextFromChildren(element.children || []);
          return {
            type: 'text',
            text: codeInlineText,
            marks: [{ type: 'code' }]
          };
  
        case 'a':
          const linkText = extractTextFromChildren(element.children || []);
          const href = element.attributes?.href;
          return {
            type: 'text',
            text: linkText,
            marks: href ? [{ type: 'link', attrs: { href } }] : []
          };
  
        case 'div':
          // Convert div content as paragraph if it has meaningful content
          if (children.length > 0) {
            const validChildren = children.filter(child => child && child.type === 'text');
            return {
              type: 'paragraph',
              content: validChildren.length > 0 ? validChildren : [{ type: 'text', text: '' }]
            };
          }
          return null;

        case 'table':
          // Mobile TipTap editor might not support tables - convert to formatted text as fallback
          console.log('🔄 🚨 PROCESSING TABLE ELEMENT');
          console.log('🔄 Table element children count:', children.length);
          console.log('🔄 Table element children details:', children.map(c => ({ 
            type: c?.type, 
            hasContent: !!c?.content
          })));
          
          let allTableRows: TipTapNode[] = [];
          
          // Collect rows first - handle both direct rows and rows within sections
          children.forEach((child, index) => {
            console.log(`🔄 Processing table child ${index}:`, child?.type);
            if (child && child.type === 'tableRow') {
              console.log('🔄 ✅ Found direct table row');
              allTableRows.push(child);
            } else if (child && child.type === 'tableSectionPlaceholder' && child.content) {
              console.log('🔄 ✅ Found table section placeholder with rows:', child.content.length);
              allTableRows.push(...child.content);
            }
          });
          
          console.log('🔄 Total table rows collected:', allTableRows.length);
          
          if (allTableRows.length === 0) {
            console.log('🔄 ❌ No table rows found - returning fallback');
            return {
              type: 'paragraph',
              content: [{ type: 'text', text: '📊 [Empty Table]' }]
            };
          }
          
          // Convert rows to readable text format
          const contentNodes: TipTapNode[] = [
            { 
              type: 'paragraph', 
              content: [{ 
                type: 'text', 
                text: '📊 TABLE:', 
                marks: [{ type: 'bold' }] 
              }] 
            }
          ];
          
          allTableRows.forEach((row, rowIndex) => {
            console.log(`🔄 Processing row ${rowIndex}:`, { 
              hasContent: !!row.content,
              cellCount: row.content?.length || 0
            });
            
            if (row.content && row.content.length > 0) {
              const cellTexts: string[] = [];
              
              row.content.forEach((cell: any, cellIndex: number) => {
                console.log(`🔄 Processing cell ${cellIndex}:`, {
                  type: cell?.type,
                  hasContent: !!cell.content
                });
                
                // Extract text from cell content
                let cellText = '';
                if (cell.content && Array.isArray(cell.content)) {
                  cell.content.forEach((paragraph: any) => {
                    if (paragraph.content && Array.isArray(paragraph.content)) {
                      const textParts = paragraph.content
                        .filter((textNode: any) => textNode.type === 'text')
                        .map((textNode: any) => textNode.text || '')
                        .join('');
                      cellText += textParts;
                    }
                  });
                }
                
                console.log(`🔄 Extracted cell text: "${cellText}"`);
                if (cellText.trim()) {
                  cellTexts.push(cellText.trim());
                }
              });
              
              if (cellTexts.length > 0) {
                const rowText = cellTexts.join(' | ');
                console.log(`🔄 Row ${rowIndex} text: "${rowText}"`);
                
                contentNodes.push({
                  type: 'paragraph',
                  content: [{ type: 'text', text: rowText }]
                });
                
                // Add separator line after header row
                if (rowIndex === 0 && allTableRows.length > 1) {
                  contentNodes.push({
                    type: 'paragraph', 
                    content: [{ type: 'text', text: '---' }]
                  });
                }
              }
            }
          });
          
          console.log('🔄 ✅ Table converted to', contentNodes.length, 'paragraphs');
          
          // Always return tableAsText type for expansion
          return { 
            type: 'tableAsText', 
            content: contentNodes 
          };

        case 'tbody':
        case 'thead':
        case 'tfoot':
          // These are table section elements - return their row children directly
          const sectionRows = children.filter(child => child && child.type === 'tableRow');
          // Return rows as separate nodes rather than null, so they get added to parent content
          return sectionRows.length > 0 ? { type: 'tableSectionPlaceholder', content: sectionRows } : null;

        case 'tr':
          console.log('🔄 Processing table row, children:', children.length);
          const tableCells = children.filter(child => child && (child.type === 'tableCell' || child.type === 'tableHeader'));
          console.log('🔄 Table row cells found:', tableCells.length);
          return {
            type: 'tableRow',
            content: tableCells.length > 0 ? tableCells : []
          };

        case 'th':
          // Table headers can contain rich content - process children to preserve formatting
          console.log('🔄 Processing table header, children:', children.length);
          const thContent = children.length > 0 ? children.filter(child => child && child.type === 'text') : [{ type: 'text', text: '' }];
          console.log('🔄 Table header content nodes:', thContent.length);
          return {
            type: 'tableHeader',
            content: [{
              type: 'paragraph',
              content: thContent.length > 0 ? thContent : [{ type: 'text', text: '' }]
            }]
          };

        case 'td':
          // Table cells can contain rich content - process children to preserve formatting
          console.log('🔄 Processing table cell, children:', children.length);
          const tdContent = children.length > 0 ? children.filter(child => child && child.type === 'text') : [{ type: 'text', text: '' }];
          console.log('🔄 Table cell content nodes:', tdContent.length);
          return {
            type: 'tableCell',
            content: [{
              type: 'paragraph',
              content: tdContent.length > 0 ? tdContent : [{ type: 'text', text: '' }]
            }]
          };
  
        default:
          // For unknown elements, try to preserve text content
          const textContent = extractTextFromChildren(element.children || []);
          if (textContent.trim()) {
            return {
              type: 'text',
              text: textContent
            };
          }
          return null;
      }
    }
  
    return null;
  };
  
  /**
   * Preserves formatting while cleaning up problematic HTML
   */
  const cleanupHtmlContent = (html: string): string => {
    if (!html || typeof html !== 'string') {
      return '';
    }
    
    // Only remove obvious TipTap JSON fragments, preserve HTML formatting
    let cleanHtml = html
      .replace(/\{"type":"[^"]+","content":\[[^\]]*\]\}/g, '') // Remove TipTap JSON fragments
      .trim();
    
    // Only decode double-encoded entities, preserve single encoding for display
    cleanHtml = cleanHtml
      .replace(/&amp;lt;/g, '&lt;')  // Double to single encoding
      .replace(/&amp;gt;/g, '&gt;')
      .replace(/&amp;amp;/g, '&amp;')
      .replace(/&amp;quot;/g, '&quot;')
      .replace(/&amp;#39;/g, '&#39;');
    
    // Only decode entities that are clearly meant to be HTML tags
    const tagRegex = /&lt;(\/?(?:p|h[1-6]|strong|b|em|i|u|s|br|table|tbody|thead|tfoot|tr|td|th|ul|ol|li|div|span|code|pre|blockquote|a)(?:\s[^&]*?)?)&gt;/gi;
    cleanHtml = cleanHtml.replace(tagRegex, '<$1>');
    
    return cleanHtml;
  };

  /**
   * Validates content consistency before conversion
   */
  const validateHtmlInput = (html: string): { isValid: boolean; cleaned: string } => {
    if (!html || typeof html !== 'string') {
      return { isValid: false, cleaned: '' };
    }

    // Check for obvious corruption patterns
    const hasJsonPattern = /\{\"type\":\"[^\"]+\",\"content\":\[/.test(html);
    const hasExcessiveEntities = (html.match(/&[a-zA-Z0-9]+;/g) || []).length > html.length / 10;
    
    if (hasJsonPattern || hasExcessiveEntities) {
      console.warn('Detected potentially corrupted HTML content');
    }

    return { 
      isValid: true, 
      cleaned: cleanupHtmlContent(html)
    };
  };

  /**
   * Converts HTML from mobile rich text editor to TipTap JSON format
   */
  export const convertHtmlToTipTap = (html: string): TipTapDocument => {
    console.log('🔄 === HTML TO TIPTAP CONVERSION ===');
    console.log('🔄 Input HTML:', html);
    console.log('🔄 HTML length:', html.length);
    
    // Validate and clean input
    const validation = validateHtmlInput(html);
    if (!validation.isValid || !validation.cleaned.trim()) {
      console.warn('Invalid HTML input, returning empty document');
      return {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        }]
      };
    }
    
    console.log('🔄 Cleaned HTML:', validation.cleaned);
    
    try {
      // Parse HTML using our custom parser
      const parsed = parseHTML(validation.cleaned);
      console.log('🔄 Parsed elements count:', parsed.length);
      console.log('🔄 Parsed elements:', parsed.map(p => ({ type: p.type, tagName: p.tagName, hasChildren: !!p.children?.length })));
      
      // Check specifically for table elements
      const tableElements = parsed.filter(p => p.tagName === 'table');
      console.log('🔄 🚨 TABLE ELEMENTS FOUND:', tableElements.length);
      if (tableElements.length > 0) {
        console.log('🔄 Table element details:', tableElements.map(t => ({
          type: t.type,
          tagName: t.tagName,
          childrenCount: t.children?.length || 0,
          children: t.children?.map(c => ({ type: c.type, tagName: c.tagName }))
        })));
      }
      
      const content: TipTapNode[] = [];
      
      // Process each parsed element
      for (const element of parsed) {
        try {
          const node = convertParsedElementToTipTap(element);
          if (node) {
            // Handle special tableAsText type - expand to multiple paragraphs
            if (node.type === 'tableAsText' && node.content) {
              console.log('🔄 🚨 EXPANDING TABLEASTEXT');
              console.log('🔄 Expanding tableAsText to', node.content.length, 'paragraphs');
              console.log('🔄 TableAsText content preview:', node.content.map(n => ({
                type: n.type,
                text: n.content?.[0]?.text?.substring(0, 50)
              })));
              content.push(...node.content);
            } else {
              content.push(node);
            }
          }
        } catch (elementError) {
          console.warn('Error processing element:', element, elementError);
          // Continue with other elements
        }
      }
    
      // Ensure we have at least one paragraph with proper text node
      if (content.length === 0) {
        content.push({
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        });
      }
    
      // Validate the resulting structure before returning
      const validatedContent = content.filter(node => {
        if (!node || !node.type) return false;
        
        // For complex nodes, ensure they have valid content arrays
        if (['table', 'tableRow', 'bulletList', 'orderedList', 'blockquote'].includes(node.type)) {
          if (!Array.isArray(node.content)) return false;
        }
        
        // For leaf nodes, ensure they have text or valid content
        if (node.type === 'text') {
          return typeof node.text === 'string';
        }
        
        return true;
      });

      const result = {
        type: 'doc' as const,
        content: validatedContent.length > 0 ? validatedContent : [{
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        }]
      };

      console.log('🔄 === CONVERSION COMPLETED ===');
      console.log('🔄 Final TipTap nodes count:', result.content.length);
      console.log('🔄 Final TipTap result:', JSON.stringify(result, null, 2));
      
      // Final validation
      try {
        JSON.stringify(result);
        return result;
      } catch (serializationError) {
        throw serializationError;
      }
      
    } catch (error) {
      console.error('Failed to convert HTML to TipTap:', error);
      console.error('Problematic HTML:', html);
      
      // Return fallback with preserved text content
      const textContent = html.replace(/<[^>]*>/g, '').trim();
      return {
        type: 'doc',
        content: [{
          type: 'paragraph', 
          content: [{ 
            type: 'text', 
            text: textContent || 'Content conversion failed - please refresh' 
          }]
        }]
      };
    }
  };
  
  /**
   * Converts a single TipTap node to HTML
   */
  const convertTipTapNodeToHtml = (node: TipTapNode): string => {
    if (!node || !node.type) {
      return '';
    }
  
    switch (node.type) {
      case 'paragraph':
        const pContent = (node.content || []).map(convertTipTapNodeToHtml).join('');
        return `<p>${pContent || ''}</p>`;
  
      case 'heading':
        const level = node.attrs?.level || 1;
        const hContent = (node.content || []).map(convertTipTapNodeToHtml).join('');
        return `<h${level}>${hContent}</h${level}>`;
  
      case 'bulletList':
        const ulItems = (node.content || []).map(convertTipTapNodeToHtml).join('');
        return `<ul>${ulItems}</ul>`;
  
      case 'orderedList':
        const olItems = (node.content || []).map(convertTipTapNodeToHtml).join('');
        return `<ol>${olItems}</ol>`;
  
      case 'listItem':
        const liContent = (node.content || [])
          .map(convertTipTapNodeToHtml)
          .join('')
          .replace(/<\/?p>/g, ''); // Remove paragraph tags inside list items
        return `<li>${liContent}</li>`;
  
      case 'blockquote':
        const bqContent = (node.content || []).map(convertTipTapNodeToHtml).join('');
        return `<blockquote>${bqContent}</blockquote>`;
  
      case 'codeBlock':
        const codeContent = (node.content || [])
          .map(n => n.text || '')
          .join('');
        return `<pre><code>${escapeHtml(codeContent)}</code></pre>`;
  
      case 'hardBreak':
        return '<br>';
  
      case 'horizontalRule':
        return '<hr>';
  
      case 'text':
        let text = node.text || '';
        
        // Minimal escaping - preserve spaces and formatting
        text = text.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
        
        // Apply marks while preserving whitespace
        if (node.marks && Array.isArray(node.marks)) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'bold':
                text = `<strong>${text}</strong>`;
                break;
              case 'italic':
                text = `<em>${text}</em>`;
                break;
              case 'underline':
                text = `<u>${text}</u>`;
                break;
              case 'strike':
                text = `<s>${text}</s>`;
                break;
              case 'code':
                text = `<code>${text}</code>`;
                break;
              case 'link':
                const href = mark.attrs?.href || '#';
                const unescapedHref = href.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
                text = `<a href="${unescapedHref}">${text}</a>`;
                break;
            }
          }
        }
        
        return text;

      case 'table':
        // Convert TipTap table to mobile-friendly text format instead of HTML
        console.log('🔄 🚨 CONVERTING TIPTAP TABLE TO TEXT FORMAT');
        console.log('🔄 Table rows count:', node.content?.length || 0);
        
        const tableRows = node.content || [];
        if (tableRows.length === 0) {
          return '<p>📊 [Empty Table]</p>';
        }
        
        let tableHtml = '<div style="margin: 16px 0; padding: 12px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #0ea5e9;">';
        tableHtml += '<p style="margin: 0 0 8px 0; font-weight: bold; color: #0ea5e9;">📊 TABLE</p>';
        
        tableRows.forEach((row: any, rowIndex: number) => {
          if (row.type === 'tableRow' && row.content) {
            const cellTexts: string[] = [];
            
            row.content.forEach((cell: any) => {
              let cellContent = '';
              if (cell.content) {
                cellContent = cell.content.map((paragraph: any) => {
                  if (paragraph.content) {
                    return paragraph.content
                      .filter((textNode: any) => textNode.type === 'text')
                      .map((textNode: any) => textNode.text || '')
                      .join('');
                  }
                  return '';
                }).join(' ').trim();
              }
              
              if (cellContent) {
                cellTexts.push(cellContent);
              }
            });
            
            if (cellTexts.length > 0) {
              const rowText = cellTexts.join(' | ');
              tableHtml += `<p style="margin: 4px 0; font-family: monospace; color: #374151;">${escapeHtml(rowText)}</p>`;
              
              // Add separator after header
              if (rowIndex === 0 && tableRows.length > 1) {
                tableHtml += '<p style="margin: 4px 0; color: #9ca3af;">---</p>';
              }
            }
          }
        });
        
        tableHtml += '</div>';
        console.log('🔄 ✅ Table converted to styled HTML format:', tableHtml.length, 'characters');
        return tableHtml;

      case 'tableRow':
      case 'tableHeader':
      case 'tableCell':
        // These are handled by the table case above in the div-based conversion
        return '';
  
      default:
        // For unknown node types, try to extract text content
        if (node.content) {
          return (node.content || []).map(convertTipTapNodeToHtml).join('');
        }
        // Escape HTML in raw text content to prevent HTML injection
        return escapeHtml(node.text || '');
    }
  };
  
  /**
   * Converts TipTap JSON to HTML for display in mobile rich text editor
   */
  export const convertTipTapToHtml = (tipTapDoc: any): string => {
    console.log('🔄 === TIPTAP TO HTML CONVERSION ===');
    console.log('🔄 Input TipTap doc:', JSON.stringify(tipTapDoc, null, 2));
    
    // Check for table nodes specifically
    if (tipTapDoc && tipTapDoc.content) {
      const tableNodes = tipTapDoc.content.filter((node: any) => node.type === 'table');
      console.log('🔄 🚨 TABLE NODES IN TIPTAP:', tableNodes.length);
      if (tableNodes.length > 0) {
        console.log('🔄 Table nodes details:', tableNodes.map((table: any) => ({
          type: table.type,
          rowCount: table.content?.length || 0,
          rows: table.content?.map((row: any) => ({
            type: row.type,
            cellCount: row.content?.length || 0
          }))
        })));
      }
    }
    
    if (!tipTapDoc) {
      console.log('No content provided, returning empty string');
      return '';
    }

    // If it's already an HTML string, return it as-is (but log a warning)
    if (typeof tipTapDoc === 'string') {
      console.warn('Received HTML string instead of TipTap document:', tipTapDoc);
      return tipTapDoc;
    }
  
    // Handle different input formats
    let content;
    if (tipTapDoc.type === 'doc' && tipTapDoc.content) {
      content = tipTapDoc.content;
    } else if (Array.isArray(tipTapDoc)) {
      content = tipTapDoc;
    } else if (tipTapDoc.content) {
      content = tipTapDoc.content;
    } else if (typeof tipTapDoc === 'object' && tipTapDoc.html) {
      // Handle legacy format with html property
      console.warn('Received legacy format with html property:', tipTapDoc);
      return tipTapDoc.html;
    } else {
      console.warn('Unknown content format, attempting to extract text:', tipTapDoc);
      // Try to extract any text content from the object
      const extractedText = JSON.stringify(tipTapDoc);
      if (extractedText && extractedText !== '{}' && !extractedText.includes('"type"')) {
        return `<p>${escapeHtml(extractedText)}</p>`;
      }
      return '<p></p>';
    }

    if (!Array.isArray(content)) {
      console.warn('Content is not an array:', content);
      return '<p></p>';
    }

    if (content.length === 0) {
      console.log('Content array is empty');
      return '<p></p>';
    }
  
    const html = content.map((node: TipTapNode) => convertTipTapNodeToHtml(node)).join('');
    console.log('Converted HTML result:', html);
    
    // If the result is empty, return a basic paragraph
    if (!html || html.trim() === '') {
      console.log('Conversion resulted in empty HTML, returning default paragraph');
      return '<p></p>';
    }
    
    return html;
  };
  
  /**
   * Validates and fixes TipTap document structure
   */
  const validateTipTapDocument = (doc: any): TipTapDocument => {
    if (!doc || doc.type !== 'doc' || !Array.isArray(doc.content)) {
      return {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
      };
    }

    const fixedContent = doc.content.map((node: any) => {
      if (!node || !node.type) return null;
      
      // Fix paragraphs with empty content arrays
      if (node.type === 'paragraph') {
        if (!Array.isArray(node.content) || node.content.length === 0) {
          return {
            type: 'paragraph',
            content: [{ type: 'text', text: '' }]
          };
        }
        // Ensure all paragraph children are valid text nodes
        const validContent = node.content.filter((child: any) => child && child.type === 'text');
        return {
          ...node,
          content: validContent.length > 0 ? validContent : [{ type: 'text', text: '' }]
        };
      }
      
      // Fix headings with empty content
      if (node.type === 'heading') {
        if (!Array.isArray(node.content) || node.content.length === 0) {
          return {
            ...node,
            content: [{ type: 'text', text: '' }]
          };
        }
      }
      
      return node;
    }).filter(Boolean);

    return {
      type: 'doc',
      content: fixedContent.length > 0 ? fixedContent : [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
    };
  };

  /**
   * Handles content from various sources and converts appropriately
   */
  export const normalizeContent = (content: any): { html: string; tiptap: TipTapDocument } => {
    // If it's already a TipTap document, validate and fix it
    if (content && content.type === 'doc') {
      const validatedTipTap = validateTipTapDocument(content);
      return {
        html: convertTipTapToHtml(validatedTipTap),
        tiptap: validatedTipTap
      };
    }
  
    // If it has html property (from mobile app)
    if (content && content.html) {
      const tiptap = convertHtmlToTipTap(content.html);
      return {
        html: content.html,
        tiptap
      };
    }
  
    // If it's a plain HTML string
    if (typeof content === 'string') {
      const tiptap = convertHtmlToTipTap(content);
      return {
        html: content,
        tiptap
      };
    }
  
    // Fallback for empty content
    const emptyTipTap: TipTapDocument = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
    };
  
    return {
      html: '',
      tiptap: emptyTipTap
    };
  };
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
        // No more tags, add remaining text
        const text = html.substring(currentPos).trim();
        if (text) {
          elements.push({ type: 'text', text });
        }
        break;
      }
  
      // Add text before the tag
      if (nextTag > currentPos) {
        const text = html.substring(currentPos, nextTag).trim();
        if (text) {
          elements.push({ type: 'text', text });
        }
      }
  
      // Parse the tag
      const tagEnd = html.indexOf('>', nextTag);
      if (tagEnd === -1) break;
  
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
        // No closing tag found, treat as text
        elements.push({ type: 'text', text: html.substring(nextTag) });
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
          return {
            type: 'paragraph',
            content: children.length > 0 ? children : [{ type: 'text', text: '' }]
          };
  
        case 'h1':
          return {
            type: 'heading',
            attrs: { level: 1 },
            content: children
          };
  
        case 'h2':
          return {
            type: 'heading',
            attrs: { level: 2 },
            content: children
          };
  
        case 'h3':
          return {
            type: 'heading',
            attrs: { level: 3 },
            content: children
          };
  
        case 'h4':
          return {
            type: 'heading',
            attrs: { level: 4 },
            content: children
          };
  
        case 'h5':
          return {
            type: 'heading',
            attrs: { level: 5 },
            content: children
          };
  
        case 'h6':
          return {
            type: 'heading',
            attrs: { level: 6 },
            content: children
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
            if (child.type === 'text') {
              return {
                type: 'paragraph',
                content: [child]
              };
            }
            return child;
          });
          
          return {
            type: 'listItem',
            content: wrappedContent
          };
  
        case 'blockquote':
          return {
            type: 'blockquote',
            content: children
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
          const boldText = extractTextFromChildren(element.children || []);
          return {
            type: 'text',
            text: boldText,
            marks: [{ type: 'bold' }]
          };
  
        case 'em':
        case 'i':
          const italicText = extractTextFromChildren(element.children || []);
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
            return {
              type: 'paragraph',
              content: children
            };
          }
          return null;
  
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
   * Converts HTML from mobile rich text editor to TipTap JSON format
   */
  export const convertHtmlToTipTap = (html: string): TipTapDocument => {
    console.log('Converting HTML to TipTap:', html);
    
    if (!html || html.trim() === '') {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: []
          }
        ]
      };
    }
  
    // Parse HTML using our custom parser
    const parsed = parseHTML(html);
    
    const content: TipTapNode[] = [];
    
    // Process each parsed element
    for (const element of parsed) {
      const node = convertParsedElementToTipTap(element);
      if (node) {
        content.push(node);
      }
    }
  
    // Ensure we have at least one paragraph
    if (content.length === 0) {
      content.push({
        type: 'paragraph',
        content: []
      });
    }
  
    const result = {
      type: 'doc' as const,
      content
    };
  
    console.log('Converted TipTap result:', JSON.stringify(result, null, 2));
    return result;
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
        let text = escapeHtml(node.text || '');
        
        // Apply marks
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
                text = `<a href="${escapeHtml(href)}">${text}</a>`;
                break;
            }
          }
        }
        
        return text;
  
      default:
        // For unknown node types, try to extract text content
        if (node.content) {
          return (node.content || []).map(convertTipTapNodeToHtml).join('');
        }
        return node.text || '';
    }
  };
  
  /**
   * Converts TipTap JSON to HTML for display in mobile rich text editor
   */
  export const convertTipTapToHtml = (tipTapDoc: any): string => {
    console.log('Converting TipTap to HTML:', tipTapDoc);
    
    if (!tipTapDoc) {
      return '';
    }
  
    // Handle different input formats
    let content;
    if (tipTapDoc.type === 'doc' && tipTapDoc.content) {
      content = tipTapDoc.content;
    } else if (Array.isArray(tipTapDoc)) {
      content = tipTapDoc;
    } else if (tipTapDoc.content) {
      content = tipTapDoc.content;
    } else {
      return '';
    }
  
    const html = content.map((node: TipTapNode) => convertTipTapNodeToHtml(node)).join('');
    console.log('Converted HTML result:', html);
    return html;
  };
  
  /**
   * Handles content from various sources and converts appropriately
   */
  export const normalizeContent = (content: any): { html: string; tiptap: TipTapDocument } => {
    // If it's already a TipTap document
    if (content && content.type === 'doc') {
      return {
        html: convertTipTapToHtml(content),
        tiptap: content
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
      content: [{ type: 'paragraph', content: [] }]
    };
  
    return {
      html: '',
      tiptap: emptyTipTap
    };
  };
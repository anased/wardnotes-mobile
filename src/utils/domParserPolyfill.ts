// src/utils/domParserPolyfill.ts

/**
 * Simple HTML parser polyfill for React Native
 * This is a basic implementation to parse HTML into a structure we can work with
 */

interface SimpleElement {
  tagName: string;
  textContent: string;
  children: SimpleElement[];
  attributes: Record<string, string>;
  nodeType: number;
  childNodes: SimpleNode[];
}

interface SimpleTextNode {
  nodeType: number;
  textContent: string;
}

type SimpleNode = SimpleElement | SimpleTextNode;

class SimpleDOMParser {
  parseFromString(html: string, mimeType: string): { querySelector: (selector: string) => SimpleElement | null } {
    // Remove the wrapper div and parse the content
    const content = html.replace(/^<div>|<\/div>$/g, '');
    const parsed = this.parseHTML(content);
    
    return {
      querySelector: (selector: string) => {
        if (selector === 'div') {
          return {
            tagName: 'div',
            textContent: content,
            children: parsed,
            attributes: {},
            nodeType: 1,
            childNodes: parsed
          };
        }
        return null;
      }
    };
  }

  private parseHTML(html: string): SimpleElement[] {
    const elements: SimpleElement[] = [];
    let currentPos = 0;

    while (currentPos < html.length) {
      const nextTag = html.indexOf('<', currentPos);
      
      if (nextTag === -1) {
        // No more tags, add remaining text
        const text = html.substring(currentPos).trim();
        if (text) {
          elements.push(this.createTextElement(text));
        }
        break;
      }

      // Add text before the tag
      if (nextTag > currentPos) {
        const text = html.substring(currentPos, nextTag).trim();
        if (text) {
          elements.push(this.createTextElement(text));
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
        elements.push(this.createElement(tagName, '', {}));
        currentPos = tagEnd + 1;
        continue;
      }

      // Find the closing tag
      const tagName = tagContent.split(' ')[0];
      const closingTag = `</${tagName}>`;
      const closingPos = html.indexOf(closingTag, tagEnd + 1);

      if (closingPos === -1) {
        // No closing tag found, treat as text
        elements.push(this.createTextElement(html.substring(nextTag)));
        break;
      }

      // Extract content between opening and closing tags
      const innerContent = html.substring(tagEnd + 1, closingPos);
      const attributes = this.parseAttributes(tagContent);
      
      // Recursively parse inner content
      const children = this.parseHTML(innerContent);
      const element = this.createElement(tagName, innerContent, attributes);
      element.children = children;
      element.childNodes = children;
      
      elements.push(element);
      currentPos = closingPos + closingTag.length;
    }

    return elements;
  }

  private createElement(tagName: string, textContent: string, attributes: Record<string, string>): SimpleElement {
    return {
      tagName: tagName.toLowerCase(),
      textContent,
      children: [],
      attributes,
      nodeType: 1, // ELEMENT_NODE
      childNodes: []
    };
  }

  private createTextElement(text: string): SimpleElement {
    return {
      tagName: '#text',
      textContent: text,
      children: [],
      attributes: {},
      nodeType: 3, // TEXT_NODE
      childNodes: []
    };
  }

  private parseAttributes(tagContent: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const attrRegex = /(\w+)=["']([^"']*)["']/g;
    let match;

    while ((match = attrRegex.exec(tagContent)) !== null) {
      attributes[match[1]] = match[2];
    }

    return attributes;
  }
}

// Set up the polyfill only in React Native environment and only if not already defined
if (typeof global !== 'undefined' && typeof global.DOMParser === 'undefined') {
  // Use type assertion to avoid TypeScript conflicts
  (global as any).DOMParser = SimpleDOMParser;
  
  // Also add Node constants for compatibility
  (global as any).Node = {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_FRAGMENT_NODE: 11,
    ATTRIBUTE_NODE: 2,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_POSITION_DISCONNECTED: 1,
    DOCUMENT_POSITION_PRECEDING: 2,
    DOCUMENT_POSITION_FOLLOWING: 4,
    DOCUMENT_POSITION_CONTAINS: 8,
    DOCUMENT_POSITION_CONTAINED_BY: 16,
    DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32
  };
}

export { SimpleDOMParser };
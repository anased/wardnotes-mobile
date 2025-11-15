// Native Note Renderer - Renders TipTap JSON as native React Native components
// This provides a true iOS Notes-like experience without WebView

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  parseTipTapDocument,
  convertToNativeBlocks,
  type NativeBlock,
  type TextSegment,
} from '../../utils/tiptapNativeParser';

interface NativeNoteRendererProps {
  content: any;
}

export default function NativeNoteRenderer({ content }: NativeNoteRendererProps) {
  const document = parseTipTapDocument(content);

  if (!document) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No content to display</Text>
      </View>
    );
  }

  const blocks = convertToNativeBlocks(document);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </View>
  );
}

function renderBlock(block: NativeBlock, index: number): React.ReactNode {
  switch (block.type) {
    case 'heading':
      return renderHeading(block, index);
    case 'paragraph':
      return renderParagraph(block, index);
    case 'bulletList':
      return renderBulletList(block, index);
    case 'orderedList':
      return renderOrderedList(block, index);
    case 'blockquote':
      return renderBlockquote(block, index);
    case 'codeBlock':
      return renderCodeBlock(block, index);
    default:
      return null;
  }
}

function renderHeading(block: NativeBlock, key: number): React.ReactNode {
  const level = block.level || 1;
  const styleKey = `h${level}` as keyof typeof styles;

  return (
    <Text key={key} style={styles[styleKey]}>
      {renderTextSegments(block.segments)}
    </Text>
  );
}

function renderParagraph(block: NativeBlock, key: number): React.ReactNode {
  if (block.segments.length === 0 || (block.segments.length === 1 && !block.segments[0].text)) {
    // Empty paragraph - render small space
    return <View key={key} style={styles.emptyParagraph} />;
  }

  return (
    <Text key={key} style={styles.paragraph}>
      {renderTextSegments(block.segments)}
    </Text>
  );
}

function renderBulletList(block: NativeBlock, key: number): React.ReactNode {
  return (
    <View key={key} style={styles.list}>
      {block.children?.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listItemText}>
            {renderTextSegments(item.segments)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function renderOrderedList(block: NativeBlock, key: number): React.ReactNode {
  return (
    <View key={key} style={styles.list}>
      {block.children?.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>{index + 1}.</Text>
          <Text style={styles.listItemText}>
            {renderTextSegments(item.segments)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function renderBlockquote(block: NativeBlock, key: number): React.ReactNode {
  return (
    <View key={key} style={styles.blockquoteContainer}>
      <View style={styles.blockquoteBorder} />
      <Text style={styles.blockquote}>
        {renderTextSegments(block.segments)}
      </Text>
    </View>
  );
}

function renderCodeBlock(block: NativeBlock, key: number): React.ReactNode {
  return (
    <View key={key} style={styles.codeBlockContainer}>
      <Text style={styles.codeBlock}>
        {renderTextSegments(block.segments)}
      </Text>
    </View>
  );
}

function renderTextSegments(segments: TextSegment[]): React.ReactNode {
  return segments.map((segment, index) => {
    const textStyles = [styles.text];

    if (segment.bold) textStyles.push(styles.bold);
    if (segment.italic) textStyles.push(styles.italic);
    if (segment.underline) textStyles.push(styles.underline);
    if (segment.code) textStyles.push(styles.inlineCode);
    if (segment.strike) textStyles.push(styles.strike);

    return (
      <Text key={index} style={textStyles}>
        {segment.text}
      </Text>
    );
  });
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  // Mobile-optimized heading styles (iOS Notes-like)
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 33.6, // 1.4 line height
    marginTop: 16,
    marginBottom: 12,
    color: '#1f2937',
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28, // 1.4 line height
    marginTop: 14,
    marginBottom: 10,
    color: '#1f2937',
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 25.2, // 1.4 line height
    marginTop: 12,
    marginBottom: 8,
    color: '#1f2937',
  },
  h4: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 23.8,
    marginTop: 10,
    marginBottom: 6,
    color: '#1f2937',
  },
  h5: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22.4,
    marginTop: 8,
    marginBottom: 6,
    color: '#1f2937',
  },
  h6: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22.4,
    marginTop: 8,
    marginBottom: 6,
    color: '#1f2937',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24, // 1.5 line height
    marginBottom: 12,
    color: '#1f2937',
  },
  emptyParagraph: {
    height: 12, // Small space for empty paragraphs
  },
  text: {
    fontSize: 16,
    color: '#1f2937',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  inlineCode: {
    fontFamily: 'Courier',
    fontSize: 14,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  list: {
    marginTop: 8,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 24,
    marginRight: 8,
    color: '#1f2937',
    width: 20,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
  },
  blockquoteContainer: {
    flexDirection: 'row',
    marginVertical: 12,
    paddingLeft: 12,
  },
  blockquoteBorder: {
    width: 3,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    marginRight: 12,
  },
  blockquote: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  codeBlockContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    padding: 12,
    marginVertical: 12,
  },
  codeBlock: {
    fontFamily: 'Courier',
    fontSize: 14,
    lineHeight: 19.6,
    color: '#1f2937',
  },
});

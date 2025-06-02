import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function NoteDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // For now, we'll use placeholder data
  // Later, we'll get the actual note data using the noteId from route params
  const noteId = (route.params as any)?.noteId || 'sample-note';
  
  // Placeholder note data
  const sampleNote = {
    id: noteId,
    title: 'Sample Medical Note',
    content: 'This is sample content for a medical note. In the real app, this would show the actual note content from Supabase.',
    category: 'Cardiology',
    tags: ['sample', 'demo'],
    created_at: new Date().toISOString(),
  };

  const handleEdit = () => {
    // TODO: Navigate to edit screen when it's implemented
    console.log('Edit note:', noteId);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete note:', noteId);
    navigation.goBack();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Text style={[styles.actionButtonText, styles.deleteButton]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>{sampleNote.title}</Text>
        
        <View style={styles.metadata}>
          <Text style={styles.date}>
            {new Date(sampleNote.created_at).toLocaleDateString()}
          </Text>
          <Text style={styles.category}>{sampleNote.category}</Text>
        </View>

        {sampleNote.tags && sampleNote.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>Tags:</Text>
            <View style={styles.tags}>
              {sampleNote.tags.map((tag, index) => (
                <Text key={index} style={styles.tag}>
                  {tag}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.contentContainer}>
          <Text style={styles.contentLabel}>Content:</Text>
          <Text style={styles.contentText}>{sampleNote.content}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0ea5e9',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#0ea5e9',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  category: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
    marginBottom: 5,
  },
  contentContainer: {
    flex: 1,
  },
  contentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});
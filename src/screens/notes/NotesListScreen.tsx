import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function NotesListScreen() {
  const navigation = useNavigation();

  // Sample notes data for demonstration
  const sampleNotes = [
    {
      id: '1',
      title: 'Cardiac Assessment',
      category: 'Cardiology',
      tags: ['assessment', 'heart'],
      created_at: '2024-01-15',
    },
    {
      id: '2',
      title: 'Neurological Examination',
      category: 'Neurology',
      tags: ['neuro', 'examination'],
      created_at: '2024-01-14',
    },
    {
      id: '3',
      title: 'Central Line Procedure',
      category: 'Procedures',
      tags: ['procedure', 'central-line'],
      created_at: '2024-01-13',
    },
  ];

  const handleNotePress = (noteId: string) => {
    // TODO: Navigate to note detail when navigation is properly set up
    console.log('Navigate to note:', noteId);
    // For now, we'll just log the action
  };

  const renderNoteItem = (note: typeof sampleNotes[0]) => (
    <TouchableOpacity
      key={note.id}
      style={styles.noteCard}
      onPress={() => handleNotePress(note.id)}
    >
      <Text style={styles.noteTitle}>{note.title}</Text>
      <Text style={styles.noteDate}>
        {new Date(note.created_at).toLocaleDateString()}
      </Text>
      <Text style={styles.noteCategory}>{note.category}</Text>
      {note.tags && note.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {note.tags.slice(0, 3).map((tag, index) => (
            <Text key={index} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes Library</Text>
      </View>

      <ScrollView style={styles.content}>
        {sampleNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notes found</Text>
            <Text style={styles.emptySubtext}>Create your first note to get started</Text>
          </View>
        ) : (
          <View style={styles.notesContainer}>
            {sampleNotes.map(renderNoteItem)}
          </View>
        )}
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
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
  },
  notesContainer: {
    padding: 15,
  },
  noteCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#1f2937',
  },
  noteDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 5,
  },
  noteCategory: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: '500',
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 10,
    color: '#6b7280',
    marginRight: 5,
    marginBottom: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
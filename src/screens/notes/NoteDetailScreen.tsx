// src/screens/notes/NoteDetailScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useNotes from '../../hooks/useNotes';
import useCategories from '../../hooks/useCategories';
import TipTapViewer from '../../components/notes/TipTapViewer';
import PremiumFeatureGate from '../../components/premium/PremiumFeatureGate';
import NoteFlashcards from '../../components/notes/NoteFlashcards';
import FlashcardGeneratorModal from '../../components/flashcards/FlashcardGeneratorModal';
import { CombinedNavigationProp, NoteDetailRouteProp } from '../../types/navigation';
import { hasTablesInContent, getWebOnlyReason } from '../../utils/tableDetection';

export default function NoteDetailScreen() {
  const navigation = useNavigation<CombinedNavigationProp>();
  const route = useRoute<NoteDetailRouteProp>();
  const { noteId } = route.params;
  
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isWebOnlyNote, setIsWebOnlyNote] = useState(false);
  const [showFlashcardGenerator, setShowFlashcardGenerator] = useState(false);

  const { fetchNoteById, removeNote } = useNotes();
  const { categories } = useCategories();

  useFocusEffect(
    useCallback(() => {
      loadNote();
    }, [noteId])
  );

  const loadNote = async () => {
    try {
      setLoading(true);
      const noteData = await fetchNoteById(noteId);
      console.log('👁️ === LOADING NOTE FOR DISPLAY ===');
      console.log('👁️ Note ID:', noteId);
      console.log('👁️ Loaded note data:', JSON.stringify(noteData, null, 2));
      console.log('👁️ Note content field:', noteData.content);
      console.log('👁️ Content type:', typeof noteData.content);
      console.log('👁️ Content is truthy?', !!noteData.content);
      
      // Check if this note contains tables
      const containsTables = hasTablesInContent(noteData.content);
      console.log('👁️ Note contains tables:', containsTables);
      setIsWebOnlyNote(containsTables);
      
      setNote(noteData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load note');
      console.error('Error loading note:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (isWebOnlyNote) {
      Alert.alert(
        'Edit on Web Only',
        getWebOnlyReason(note?.content) + '\n\nPlease use the web version to edit this note.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } else {
      navigation.navigate('EditNote', { noteId });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await removeNote(noteId);
      Alert.alert('Success', 'Note deleted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to delete note');
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateFlashcards = () => {
    setShowFlashcardGenerator(true);
  };

  const handleFlashcardGeneratorClose = () => {
    setShowFlashcardGenerator(false);
  };

  const handleFlashcardGenerationSuccess = () => {
    // Reload the note to refresh the flashcards section
    loadNote();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || 'blue';
  };

  const getCategoryBadgeColor = (categoryName: string) => {
    const color = getCategoryColor(categoryName);
    const colorMap: Record<string, string> = {
      blue: '#dbeafe',
      red: '#fee2e2',
      green: '#dcfce7',
      yellow: '#fef3c7',
      purple: '#f3e8ff',
      pink: '#fce7f3',
      indigo: '#e0e7ff',
      gray: '#f3f4f6',
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadNote} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!note) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Note not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <PremiumFeatureGate
            featureName="AI Flashcard Generator"
            description="Generate Anki-compatible flashcards from this note to boost your learning efficiency."
          >
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleGenerateFlashcards}
            >
              <Ionicons name="flash-outline" size={20} color="#0ea5e9" />
            </TouchableOpacity>
          </PremiumFeatureGate>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Ionicons 
              name={isWebOnlyNote ? "globe-outline" : "create-outline"} 
              size={20} 
              color={isWebOnlyNote ? "#f59e0b" : "#0ea5e9"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleDelete}
            disabled={deleting}
          >
            <Ionicons 
              name="trash-outline" 
              size={20} 
              color={deleting ? "#9ca3af" : "#ef4444"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.noteHeader}>
          <Text style={styles.title}>{note.title}</Text>
          
          <View style={styles.metadata}>
            <Text style={styles.date}>
              {formatDate(note.created_at)}
            </Text>
            <View style={styles.badgeContainer}>
              {isWebOnlyNote && (
                <View style={styles.webOnlyBadge}>
                  <Ionicons name="globe-outline" size={12} color="#f59e0b" />
                  <Text style={styles.webOnlyText}>Web Only</Text>
                </View>
              )}
              <View style={[
                styles.categoryBadge, 
                { backgroundColor: getCategoryBadgeColor(note.category) }
              ]}>
                <Text style={styles.categoryText}>{note.category}</Text>
              </View>
            </View>
          </View>
        </View>

        {note.tags && note.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>Tags:</Text>
            <View style={styles.tags}>
              {note.tags.map((tag: string, index: number) => (
                <Text key={index} style={styles.tag}>
                  {tag}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.contentContainer}>
          {note.content ? (
            <TipTapViewer content={note.content} />
          ) : (
            <View style={styles.noContentContainer}>
              <Ionicons name="document-outline" size={48} color="#d1d5db" />
              <Text style={styles.noContentText}>No content available</Text>
              <Text style={styles.noContentSubtext}>
                This note appears to be empty or the content format is not supported.
              </Text>
            </View>
          )}
        </View>
        <View style={styles.divider} />

        <NoteFlashcards noteId={noteId} />
      </ScrollView>

      {/* Flashcard Generator Modal */}
      <FlashcardGeneratorModal
        visible={showFlashcardGenerator}
        noteId={noteId}
        noteTitle={note?.title || ''}
        onClose={handleFlashcardGeneratorClose}
        onSuccess={handleFlashcardGenerationSuccess}
      />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 15,
    padding: 8,
    borderRadius: 6,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  noteHeader: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    lineHeight: 32,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    gap: 4,
  },
  webOnlyText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#d97706',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
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
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 24,
  },
  noContentContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noContentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 8,
  },
  noContentSubtext: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});
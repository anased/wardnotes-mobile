// src/screens/notes/NotesListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuthGuard } from '../../hooks/useAuthGuard';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CombinedNavigationProp } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import useNotes from '../../hooks/useNotes';
import useCategories from '../../hooks/useCategories';
import useTags from '../../hooks/useTags';
import useAuth from '../../hooks/useAuth';

export default function NotesListScreen() {
  const { isAuthenticated, loading } = useAuthGuard();
  const navigation = useNavigation<CombinedNavigationProp>();
  const { user } = useAuth();
  const { 
    notes, 
    loading, 
    error, 
    fetchNotes,
    search,
    filterByCategory,
    filterByTag 
  } = useNotes();
  const { categories } = useCategories();
  const { tags } = useTags();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user, fetchNotes]);

  const handleNotePress = (noteId: string) => {
    navigation.navigate('NoteDetail', { noteId });
  };

  const handleSearch = async () => {
    try {
      await search(searchQuery);
      setSelectedCategory('All');
      setSelectedTag('All');
    } catch (err) {
      Alert.alert('Error', 'Failed to search notes');
    }
  };

  const handleCategoryFilter = async (category: string) => {
    setSelectedCategory(category);
    setSelectedTag('All');
    setSearchQuery('');
    
    try {
      await filterByCategory(category);
    } catch (err) {
      Alert.alert('Error', 'Failed to filter by category');
    }
  };

  const handleTagFilter = async (tag: string) => {
    setSelectedTag(tag);
    setSelectedCategory('All');
    setSearchQuery('');
    
    try {
      if (tag === 'All') {
        await fetchNotes();
      } else {
        await filterByTag(tag);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to filter by tag');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTag('All');
    fetchNotes();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNotes();
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const categoryData = categories.find(
      cat => cat.name.toLowerCase() === category.toLowerCase()
    );
    return categoryData?.color || 'blue';
  };

  const renderNoteItem = (note: typeof notes[0]) => (
    <TouchableOpacity
      key={note.id}
      style={styles.noteCard}
      onPress={() => handleNotePress(note.id)}
    >
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle} numberOfLines={2}>
          {note.title}
        </Text>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryBadgeColor(note.category) }]}>
          <Text style={styles.categoryText}>{note.category}</Text>
        </View>
      </View>
      
      <Text style={styles.noteDate}>
        {formatDate(note.created_at)}
      </Text>

      {note.tags && note.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {note.tags.slice(0, 3).map((tag, index) => (
            <Text key={index} style={styles.tag}>
              {tag}
            </Text>
          ))}
          {note.tags.length > 3 && (
            <Text style={styles.tag}>+{note.tags.length - 3}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const getCategoryBadgeColor = (category: string) => {
    const color = getCategoryColor(category);
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.message}>Please sign in to view your notes</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes Library</Text>
      </View>

      {/* Search and Filter Section */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCategory}
              onValueChange={handleCategoryFilter}
              style={styles.picker}
            >
              <Picker.Item label="All Categories" value="All" />
              {categories.map(cat => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedTag}
              onValueChange={handleTagFilter}
              style={styles.picker}
            >
              <Picker.Item label="All Tags" value="All" />
              {tags.map(tag => (
                <Picker.Item key={tag.id} label={tag.name} value={tag.name} />
              ))}
            </Picker>
          </View>
        </View>

        {(selectedCategory !== 'All' || selectedTag !== 'All' || searchQuery) && (
          <TouchableOpacity onPress={handleClearFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error.message}</Text>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading notes...</Text>
          </View>
        ) : notes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery || selectedCategory !== 'All' || selectedTag !== 'All'
                ? 'No notes match your search criteria'
                : 'No notes found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedCategory !== 'All' || selectedTag !== 'All'
                ? 'Try adjusting your filters'
                : 'Create your first note to get started'}
            </Text>
          </View>
        ) : (
          <View style={styles.notesContainer}>
            {notes.map(renderNoteItem)}
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
  searchContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    padding: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  picker: {
    height: 50,
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0ea5e9',
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  notesContainer: {
    padding: 16,
  },
  noteCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  noteDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
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
    marginRight: 4,
    marginBottom: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
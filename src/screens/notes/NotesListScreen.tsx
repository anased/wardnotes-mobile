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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CombinedNavigationProp } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import useNotes from '../../hooks/useNotes';
import useCategories from '../../hooks/useCategories';
import useTags from '../../hooks/useTags';
import LoadingScreen from '../auth/LoadingScreen';
import { getNotes } from '../../services/supabase/client';
import { Note } from '../../services/supabase/client';

export default function NotesListScreen() {
  const { isAuthenticated, loading: authLoading, user } = useAuthGuard();
  const navigation = useNavigation<CombinedNavigationProp>();
  
  const { 
    notes, 
    setNotes,
    loading: notesLoading, 
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

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  // Show loading screen while auth is being checked
  if (authLoading) {
    return <LoadingScreen />;
  }

  // If not authenticated, the useAuthGuard will handle redirect
  // This is just a fallback
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.message}>Redirecting to login...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Load notes when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotes();
    }
  }, [isAuthenticated, user, fetchNotes]);

  const handleNotePress = (noteId: string) => {
    navigation.navigate('NoteDetail', { noteId });
  };

  
  const applyFiltersClientSide = async (categoryOverride?: string, tagOverride?: string, searchOverride?: string) => {
    try {
      const allNotes = await getNotes();
      let filteredNotes = [...allNotes];
  
      // Use override values if provided, otherwise use state
      const currentCategory = categoryOverride !== undefined ? categoryOverride : selectedCategory;
      const currentTag = tagOverride !== undefined ? tagOverride : selectedTag;
      const currentSearch = searchOverride !== undefined ? searchOverride : searchQuery;
  
      // Apply category filter
      if (currentCategory !== 'All') {
        filteredNotes = filteredNotes.filter(note => note.category === currentCategory);
      }
  
      // Apply tag filter
      if (currentTag !== 'All') {
        filteredNotes = filteredNotes.filter(note => 
          note.tags && note.tags.includes && note.tags.includes(currentTag)
        );
      }
  
      // Apply search filter
      if (currentSearch && currentSearch.trim()) {
        const searchTerm = currentSearch.trim().toLowerCase();
        filteredNotes = filteredNotes.filter(note => {
          const titleText = note.title || '';
          const titleMatch = titleText.toLowerCase().includes(searchTerm);
          
          let contentMatch = false;
          if (note.content) {
            try {
              const contentAsString = JSON.stringify(note.content);
              contentMatch = contentAsString.toLowerCase().includes(searchTerm);
            } catch {
              contentMatch = false;
            }
          }
          
          return titleMatch || contentMatch;
        });
      }
  
      setNotes(filteredNotes);
    } catch (err) {
      Alert.alert('Error', 'Failed to apply filters');
      console.error('Filter error:', err);
    }
  };

  const handleSearch = async () => {
    try {
      // Pass the current search query directly
      await applyFiltersClientSide(selectedCategory, selectedTag, searchQuery);
    } catch (err) {
      Alert.alert('Error', 'Failed to search notes');
    }
  };
  const handleCategoryFilter = async (category: string) => {
    setSelectedCategory(category);
    
    try {
      // Pass the new category value directly instead of relying on state
      await applyFiltersClientSide(category, selectedTag, searchQuery);
    } catch (err) {
      Alert.alert('Error', 'Failed to filter by category');
    }
  };

  const handleTagFilter = async (tag: string) => {
    setSelectedTag(tag);
    
    try {
      // Pass the new tag value directly instead of relying on state
      await applyFiltersClientSide(selectedCategory, tag, searchQuery);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes Library</Text>
        <Text style={styles.welcomeText}>Welcome, {user.email}</Text>
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
          {/* Custom Category Picker */}
          <TouchableOpacity 
            style={styles.customPickerButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={[
              styles.customPickerText,
              { color: selectedCategory === 'All' ? '#9ca3af' : '#1f2937' }
            ]}>
              {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>

          {/* Custom Tag Picker */}
          <TouchableOpacity 
            style={styles.customPickerButton}
            onPress={() => setShowTagPicker(true)}
          >
            <Text style={[
              styles.customPickerText,
              { color: selectedTag === 'All' ? '#9ca3af' : '#1f2937' }
            ]}>
              {selectedTag === 'All' ? 'All Tags' : selectedTag}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {(selectedCategory !== 'All' || selectedTag !== 'All' || searchQuery) && (
          <TouchableOpacity onPress={handleClearFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Category Picker Modal */}
      <Modal 
        visible={showCategoryPicker} 
        transparent 
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedCategory === 'All' && styles.selectedModalItem
                ]}
                onPress={() => {
                  handleCategoryFilter('All');
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedCategory === 'All' && styles.selectedModalItemText
                ]}>
                  All Categories
                </Text>
                {selectedCategory === 'All' && (
                  <Ionicons name="checkmark" size={20} color="#0ea5e9" />
                )}
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.modalItem,
                    selectedCategory === cat.name && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    handleCategoryFilter(cat.name);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedCategory === cat.name && styles.selectedModalItemText
                  ]}>
                    {cat.name}
                  </Text>
                  {selectedCategory === cat.name && (
                    <Ionicons name="checkmark" size={20} color="#0ea5e9" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Tag Picker Modal */}
      <Modal 
        visible={showTagPicker} 
        transparent 
        animationType="slide"
        onRequestClose={() => setShowTagPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Tag</Text>
              <TouchableOpacity onPress={() => setShowTagPicker(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedTag === 'All' && styles.selectedModalItem
                ]}
                onPress={() => {
                  handleTagFilter('All');
                  setShowTagPicker(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedTag === 'All' && styles.selectedModalItemText
                ]}>
                  All Tags
                </Text>
                {selectedTag === 'All' && (
                  <Ionicons name="checkmark" size={20} color="#0ea5e9" />
                )}
              </TouchableOpacity>
              {tags.map(tag => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.modalItem,
                    selectedTag === tag.name && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    handleTagFilter(tag.name);
                    setShowTagPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedTag === tag.name && styles.selectedModalItemText
                  ]}>
                    {tag.name}
                  </Text>
                  {selectedTag === tag.name && (
                    <Ionicons name="checkmark" size={20} color="#0ea5e9" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error.message}</Text>
            <TouchableOpacity onPress={fetchNotes} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {notesLoading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
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
            {(!searchQuery && selectedCategory === 'All' && selectedTag === 'All') && (
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => navigation.navigate('Create' as never)}
              >
                <Text style={styles.createButtonText}>Create Your First Note</Text>
              </TouchableOpacity>
            )}
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
  welcomeText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
    marginTop: 4, // Add margin for better spacing
  },
  customPickerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    minHeight: 50,
  },
  customPickerText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedModalItem: {
    backgroundColor: '#f0f9ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  selectedModalItemText: {
    color: '#0ea5e9',
    fontWeight: '500',
  },
  pickerItem: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '400',
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
    marginTop: 100,
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
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
});
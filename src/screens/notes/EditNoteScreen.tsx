// src/screens/notes/EditNoteScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useNotes from '../../hooks/useNotes';
import useCategories from '../../hooks/useCategories';
import useTags from '../../hooks/useTags';
import NativeNoteEditor from '../../components/notes/NativeNoteEditor';
import { CombinedNavigationProp, EditNoteRouteProp } from '../../types/navigation';
import { hasTablesInContent, getWebOnlyReason } from '../../utils/tableDetection';

// Custom Category Picker Component (same as in CreateNoteScreen)
interface CategoryPickerProps {
  categories: Array<{ id: string; name: string; color: string }>;
  selectedCategory: string;
  onCategorySelect: (categoryName: string) => void;
  onAddNewCategory: () => void;
  disabled?: boolean;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  onAddNewCategory,
  disabled = false
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleCategorySelect = (categoryName: string) => {
    if (categoryName === 'add_new') {
      setIsModalVisible(false);
      onAddNewCategory();
    } else {
      onCategorySelect(categoryName);
      setIsModalVisible(false);
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    const color = category?.color || 'blue';
    const colorMap: Record<string, string> = {
      blue: '#3b82f6',
      red: '#ef4444',
      green: '#10b981',
      yellow: '#f59e0b',
      purple: '#8b5cf6',
      pink: '#ec4899',
      indigo: '#6366f1',
      gray: '#6b7280',
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.categoryPickerButton, disabled && styles.categoryPickerDisabled]}
        onPress={() => !disabled && setIsModalVisible(true)}
        disabled={disabled}
      >
        <View style={styles.categoryPickerContent}>
          {selectedCategory ? (
            <View style={styles.selectedCategoryContainer}>
              <View 
                style={[
                  styles.categoryColorDot, 
                  { backgroundColor: getCategoryColor(selectedCategory) }
                ]} 
              />
              <Text style={styles.selectedCategoryText}>{selectedCategory}</Text>
            </View>
          ) : (
            <Text style={styles.categoryPickerPlaceholder}>Select a category</Text>
          )}
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.categoryModalContent}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    selectedCategory === category.name && styles.selectedCategoryOption
                  ]}
                  onPress={() => handleCategorySelect(category.name)}
                >
                  <View style={styles.categoryOptionContent}>
                    <View 
                      style={[
                        styles.categoryColorDot, 
                        { backgroundColor: getCategoryColor(category.name) }
                      ]} 
                    />
                    <Text style={[
                      styles.categoryOptionText,
                      selectedCategory === category.name && styles.selectedCategoryOptionText
                    ]}>
                      {category.name}
                    </Text>
                  </View>
                  {selectedCategory === category.name && (
                    <Ionicons name="checkmark" size={20} color="#0ea5e9" />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.addCategoryOption}
                onPress={() => handleCategorySelect('add_new')}
              >
                <View style={styles.categoryOptionContent}>
                  <View style={styles.addCategoryIcon}>
                    <Ionicons name="add" size={16} color="#0ea5e9" />
                  </View>
                  <Text style={styles.addCategoryText}>Add new category...</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default function EditNoteScreen() {
  const navigation = useNavigation<CombinedNavigationProp>();
  const route = useRoute<EditNoteRouteProp>();
  const { noteId } = route.params;

  const [note, setNote] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<any>(null);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWebOnlyNote, setIsWebOnlyNote] = useState(false);

  const { fetchNoteById, editNote } = useNotes();
  const { categories, addCategory } = useCategories();
  const { tags: availableTags } = useTags();

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('blue');

  const colorOptions = [
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'green', label: 'Green', color: '#10b981' },
    { value: 'red', label: 'Red', color: '#ef4444' },
    { value: 'yellow', label: 'Yellow', color: '#f59e0b' },
    { value: 'purple', label: 'Purple', color: '#8b5cf6' },
    { value: 'pink', label: 'Pink', color: '#ec4899' },
    { value: 'indigo', label: 'Indigo', color: '#6366f1' },
    { value: 'gray', label: 'Gray', color: '#6b7280' },
  ];

  useEffect(() => {
    loadNote();
  }, [noteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadNote = async () => {
    try {
      setLoading(true);
      const noteData = await fetchNoteById(noteId);
      console.log('Loading note for edit:', noteData);
      
      setNote(noteData);
      setTitle(noteData.title);
      
      // Check if this note contains tables
      const containsTables = hasTablesInContent(noteData.content);
      console.log('📝 Note contains tables:', containsTables);
      setIsWebOnlyNote(containsTables);
      
      // If it's a web-only note, show warning and navigate back
      if (containsTables) {
        Alert.alert(
          'Edit on Web Only',
          getWebOnlyReason(noteData.content) + '\n\nPlease use the web version to edit this note.',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack()
            }
          ]
        );
        return; // Don't continue loading the edit interface
      }
      
      // Use TipTap content directly - no conversion needed!
      console.log('Loading TipTap content directly:', noteData.content);
      setContent(noteData.content);
      
      setCategory(noteData.category);
      setTags(noteData.tags ? noteData.tags.join(', ') : '');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load note');
      console.error('Error loading note:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.error('🔥 HANDLE SAVE CALLED');
    try {
      console.error('🔥 INSIDE TRY BLOCK');
      console.log('🟢 === SAVE BUTTON PRESSED ===');
      
      // Use content from state (managed by NativeNoteEditor)
      let finalContent = content;
      
      console.log('🟢 Final content to save:', finalContent);
      console.log('🟢 Content type:', typeof finalContent);
      
      try {
        console.log('🟢 Content JSON:', JSON.stringify(content, null, 2));
      } catch (jsonError: any) {
        console.error('🔥 JSON stringify failed:', jsonError);
        console.log('🟢 Content (safe):', String(content));
      }
      
      if (!title.trim()) {
        console.log('Save failed: No title');
        Alert.alert('Error', 'Please enter a title');
        return;
      }

      if (!category) {
        console.log('Save failed: No category');
        Alert.alert('Error', 'Please select a category');
        return;
      }

      console.log('Validation passed, starting save process...');
      setSaving(true);
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Use the final content from editor
      const contentToSave = finalContent || {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
      };

      console.log('🔵 === SAVING NOTE DATA ===');
      console.log('🔵 Title:', title.trim());
      console.log('🔵 Raw content state:', content);
      console.log('🔵 Raw content type:', typeof content);
      console.log('🔵 Content to save:', contentToSave);
      console.log('🔵 Content to save type:', typeof contentToSave);
      console.log('🔵 Content to save JSON:', JSON.stringify(contentToSave, null, 2));
      console.log('🔵 Category:', category);
      console.log('🔵 Tags:', tagArray);
      console.log('🔵 About to call editNote...');

      const saveResult = await editNote(noteId, {
        title: title.trim(),
        content: contentToSave,
        category,
        tags: tagArray,
      });

      console.log('🟡 === SAVE COMPLETED ===');
      console.log('🟡 Save result:', JSON.stringify(saveResult, null, 2));

      Alert.alert('Success', 'Note updated successfully', [
        { text: 'OK', onPress: () => {
          console.log('About to navigate back...');
          // Small delay to ensure any pending operations complete
          setTimeout(() => {
            navigation.goBack();
          }, 100);
        }}
      ]);
    } catch (error: any) {
      console.error('🚨 === SAVE ERROR ===');
      console.error('🚨 Error updating note:', error);
      console.error('🚨 Error details:', JSON.stringify(error, null, 2));
      console.error('🚨 Error message:', error?.message);
      console.error('🚨 Error stack:', error?.stack);
      Alert.alert('Error', 'Failed to update note: ' + (error?.message || 'Unknown error'));
    } finally {
      console.error('🔥 FINALLY BLOCK');
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      const newCategory = await addCategory(newCategoryName.trim(), newCategoryColor);
      setCategory(newCategory.name);
      setNewCategoryName('');
      setNewCategoryColor('blue');
      setShowCategoryModal(false);
      Alert.alert('Success', 'Category created successfully');
    } catch (error: any) {
      console.error('Error creating category:', error);
      Alert.alert('Error', 'Failed to create category');
    }
  };

  const getTagSuggestions = () => {
    const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    return availableTags
      .filter(tag => !currentTags.includes(tag.name))
      .slice(0, 5);
  };

  const addSuggestedTag = (tagName: string) => {
    const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tagName)) {
      const newTags = [...currentTags, tagName].join(', ');
      setTags(newTags);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 60 }} />
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
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadNote} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Edit Note</Text>
          
          <TouchableOpacity
            onPress={() => {
              console.error('🔴 BUTTON CLICKED!');
              console.warn('🟠 BUTTON CLICKED!');
              console.log('⚪ BUTTON CLICKED!');
              // Remove the alert() as it can block execution
              // alert('Button clicked!');
              handleSave();
            }}
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.titleInput}
            placeholder="Enter note title..."
            value={title}
            onChangeText={setTitle}
            multiline
          />

          <View style={styles.categoryContainer}>
            <Text style={styles.label}>Category</Text>
            <CategoryPicker
              categories={categories}
              selectedCategory={category}
              onCategorySelect={setCategory}
              onAddNewCategory={() => setShowCategoryModal(true)}
            />
          </View>

          <View style={styles.tagsContainer}>
            <Text style={styles.label}>Tags (comma separated)</Text>
            <TextInput
              style={styles.tagsInput}
              placeholder="Enter tags..."
              value={tags}
              onChangeText={setTags}
              multiline
            />
            
            {/* Tag suggestions */}
            {getTagSuggestions().length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsLabel}>Suggestions:</Text>
                <View style={styles.suggestionsRow}>
                  {getTagSuggestions().map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      style={styles.suggestionTag}
                      onPress={() => addSuggestedTag(tag.name)}
                    >
                      <Text style={styles.suggestionText}>{tag.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.editorContainer}>
            <Text style={styles.label}>Content</Text>
            <NativeNoteEditor
              key={noteId}
              initialContent={content}
              onContentChange={setContent}
              placeholder="Start writing your medical note..."
            />
          </View>
        </ScrollView>

        {/* Category Creation Modal */}
        {showCategoryModal && (
          <Modal
            visible={showCategoryModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Create New Category</Text>
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Category name"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                />

                <View style={styles.colorSelection}>
                  <Text style={styles.modalLabel}>Color</Text>
                  <View style={styles.colorRow}>
                    {colorOptions.map((color) => (
                      <TouchableOpacity
                        key={color.value}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color.color },
                          newCategoryColor === color.value && styles.selectedColor
                        ]}
                        onPress={() => setNewCategoryColor(color.value)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelModalButton]}
                    onPress={() => {
                      setShowCategoryModal(false);
                      setNewCategoryName('');
                      setNewCategoryColor('blue');
                    }}
                  >
                    <Text style={styles.cancelModalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.createModalButton]}
                    onPress={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                  >
                    <Text style={styles.createModalButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
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
  cancelButton: {
    color: '#6b7280',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    padding: 15,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  // Custom Category Picker Styles
  categoryPickerButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 15,
    minHeight: 50,
  },
  categoryPickerDisabled: {
    opacity: 0.6,
  },
  categoryPickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  selectedCategoryText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  categoryPickerPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  // Category Modal Styles
  categoryModalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '70%',
    width: '90%',
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedCategoryOption: {
    backgroundColor: '#f0f9ff',
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  selectedCategoryOptionText: {
    color: '#0ea5e9',
    fontWeight: '500',
  },
  addCategoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addCategoryIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addCategoryText: {
    fontSize: 16,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  tagsContainer: {
    marginBottom: 15,
  },
  tagsInput: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    minHeight: 50,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionTag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 12,
    color: '#0ea5e9',
  },
  editorContainer: {
    flex: 1,
    minHeight: 300,
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  colorSelection: {
    marginBottom: 20,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedColor: {
    borderColor: '#1f2937',
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelModalButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelModalButtonText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  createModalButton: {
    backgroundColor: '#0ea5e9',
  },
  createModalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
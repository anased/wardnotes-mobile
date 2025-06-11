// src/screens/notes/CreateNoteScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useNotes from '../../hooks/useNotes';
import useCategories from '../../hooks/useCategories';
import useTags from '../../hooks/useTags';
import { convertHtmlToStorageFormat } from '../../utils/contentUtils';
import RichTextEditor from '../../components/notes/RichTextEditor';

// Custom Category Picker Component
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

export default function CreateNoteScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('blue');

  const { addNote } = useNotes();
  const { categories, addCategory, loading: categoriesLoading } = useCategories();
  const { tags: availableTags } = useTags();
  const navigation = useNavigation();

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

  // Create default categories if none exist
  useEffect(() => {
    const createDefaultCategories = async () => {
      if (!categoriesLoading && categories.length === 0) {
        try {
          console.log('Creating default categories...');
          const defaultCategories = [
            { name: 'General Medicine', color: 'blue' },
            { name: 'Cardiology', color: 'red' },
            { name: 'Neurology', color: 'purple' },
            { name: 'Surgery', color: 'green' },
            { name: 'Pediatrics', color: 'yellow' },
            { name: 'Psychiatry', color: 'indigo' },
          ];
          
          for (const cat of defaultCategories) {
            await addCategory(cat.name, cat.color);
          }
          
          console.log('Default categories created successfully');
        } catch (error) {
          console.error('Error creating default categories:', error);
        }
      }
    };

    createDefaultCategories();
  }, [categories, categoriesLoading, addCategory]);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
      console.log('Set default category to:', categories[0].name);
    }
  }, [categories, category]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setLoading(true);
    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      console.log('Creating note with data:', {
        title: title.trim(),
        content: convertHtmlToStorageFormat(content),
        category,
        tags: tagArray,
      });

      await addNote({
        title: title.trim(),
        content: convertHtmlToStorageFormat(content),
        category,
        tags: tagArray,
      });

      Alert.alert('Success', 'Note created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert('Error', 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      console.log('Creating new category:', newCategoryName, newCategoryColor);
      const newCategory = await addCategory(newCategoryName.trim(), newCategoryColor);
      setCategory(newCategory.name);
      setNewCategoryName('');
      setNewCategoryColor('blue');
      setShowCategoryModal(false);
      Alert.alert('Success', 'Category created successfully');
    } catch (error) {
      console.error('Error creating category:', error);
      Alert.alert('Error', 'Failed to create category');
    }
  };

  const insertTemplate = (templateType: string) => {
    let template = '';
    
    switch (templateType) {
      case 'soap':
        template = '<h2>Subjective</h2><p></p><h2>Objective</h2><p></p><h2>Assessment</h2><p></p><h2>Plan</h2><p></p>';
        break;
      case 'physical':
        template = '<h2>Physical Examination</h2><p><strong>Vitals:</strong></p><p><strong>General:</strong></p><p><strong>HEENT:</strong></p><p><strong>Cardiovascular:</strong></p><p><strong>Respiratory:</strong></p><p><strong>Abdominal:</strong></p><p><strong>Extremities:</strong></p><p><strong>Neurological:</strong></p>';
        break;
      case 'procedure':
        template = '<h2>Procedure Note</h2><p><strong>Indication:</strong></p><p><strong>Procedure:</strong></p><p><strong>Technique:</strong></p><p><strong>Findings:</strong></p><p><strong>Complications:</strong></p><p><strong>Post-procedure care:</strong></p>';
        break;
    }
    
    setContent(template);
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

  console.log('Current state:', {
    categoriesLoading,
    categoriesCount: categories.length,
    selectedCategory: category,
    categories: categories.map(c => c.name)
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>New Note</Text>
          
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.titleInput}
            placeholder="Enter note title..."
            value={title}
            onChangeText={setTitle}
            multiline
          />

          <View style={styles.categoryContainer}>
            <Text style={styles.label}>Category</Text>
            {categoriesLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading categories...</Text>
              </View>
            ) : (
              <CategoryPicker
                categories={categories}
                selectedCategory={category}
                onCategorySelect={setCategory}
                onAddNewCategory={() => setShowCategoryModal(true)}
                disabled={categoriesLoading}
              />
            )}
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

          {/* Template buttons */}
          <View style={styles.templatesContainer}>
            <Text style={styles.label}>Quick Templates</Text>
            <View style={styles.templatesRow}>
              <TouchableOpacity
                style={styles.templateButton}
                onPress={() => insertTemplate('soap')}
              >
                <Text style={styles.templateButtonText}>SOAP Note</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.templateButton}
                onPress={() => insertTemplate('physical')}
              >
                <Text style={styles.templateButtonText}>Physical Exam</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.templateButton}
                onPress={() => insertTemplate('procedure')}
              >
                <Text style={styles.templateButtonText}>Procedure</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.editorContainer}>
            <Text style={styles.label}>Content</Text>
            <RichTextEditor
              initialContent={content}
              onContentChange={setContent}
              editable={true}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
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
  content: {
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
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 15,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
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
  templatesContainer: {
    marginBottom: 15,
  },
  templatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  templateButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  editorContainer: {
    flex: 1,
    minHeight: 300,
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
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#1f2937',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
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
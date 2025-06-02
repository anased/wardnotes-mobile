import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import useNotes from '../../hooks/useNotes';
import RichTextEditor from '../../components/notes/RichTextEditor';

export default function CreateNoteScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const { createNote } = useNotes();
  const navigation = useNavigation();

  const categories = ['General', 'Cardiology', 'Neurology', 'Procedures'];

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setLoading(true);
    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await createNote({
        title: title.trim(),
        content: { html: content },
        category,
        tags: tagArray,
      });

      Alert.alert('Success', 'Note created successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

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
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
              >
                {categories.map(cat => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
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
          </View>

          <View style={styles.editorContainer}>
            <Text style={styles.label}>Content</Text>
            <RichTextEditor
              onContentChange={setContent}
              editable={true}
            />
          </View>
        </ScrollView>
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
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  picker: {
    height: 50,
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
  editorContainer: {
    flex: 1,
    minHeight: 300,
  },
});
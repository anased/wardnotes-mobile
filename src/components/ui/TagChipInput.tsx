// Inline tag chip input with autocomplete
// Displays selected tags as removable chips with real-time filtering suggestions

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TagChipInputProps {
  selectedTags: string[];
  availableTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagChipInput({
  selectedTags,
  availableTags,
  onTagsChange,
  placeholder = 'Add tag...',
}: TagChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Filter available tags based on input, excluding already selected tags
  const filteredTags = availableTags.filter(
    (tag) =>
      !selectedTags.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Check if input matches an existing tag exactly (case-insensitive)
  const exactMatch = availableTags.some(
    (tag) => tag.toLowerCase() === inputValue.toLowerCase()
  );

  // Show "Create" option when input has value and doesn't exactly match existing tag
  const showCreateOption =
    inputValue.trim().length > 0 &&
    !exactMatch &&
    !selectedTags.some((t) => t.toLowerCase() === inputValue.toLowerCase());

  const handleAddTag = (tagName: string) => {
    const trimmedTag = tagName.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      onTagsChange([...selectedTags, trimmedTag]);
    }
    setInputValue('');
    // Keep keyboard open for quick multi-tag entry
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      // If there's a filtered match, use that; otherwise create new
      if (filteredTags.length > 0) {
        handleAddTag(filteredTags[0]);
      } else {
        handleAddTag(inputValue);
      }
    }
  };

  const handleSuggestionPress = (tag: string) => {
    handleAddTag(tag);
    inputRef.current?.focus();
  };

  const handleCreatePress = () => {
    handleAddTag(inputValue);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay blur to allow suggestion tap to register
    setTimeout(() => {
      setIsFocused(false);
    }, 150);
  };

  return (
    <View style={styles.container}>
      {/* Selected Tags as Chips */}
      {selectedTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContainer}
          keyboardShouldPersistTaps="handled"
        >
          {selectedTags.map((tag) => (
            <View key={tag} style={styles.chip}>
              <Text style={styles.chipText}>{tag}</Text>
              <TouchableOpacity
                onPress={() => handleRemoveTag(tag)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#0ea5e9" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Text Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="pricetag-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={inputValue}
          onChangeText={setInputValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {inputValue.length > 0 && (
          <TouchableOpacity
            onPress={() => setInputValue('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Dropdown */}
      {isFocused && (filteredTags.length > 0 || showCreateOption) && (
        <View style={styles.suggestionsContainer}>
          {/* Existing tag suggestions */}
          {filteredTags.slice(0, 5).map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(tag)}
            >
              <Ionicons name="pricetag" size={16} color="#6b7280" />
              <Text style={styles.suggestionText}>{tag}</Text>
            </TouchableOpacity>
          ))}

          {/* Create new tag option */}
          {showCreateOption && (
            <TouchableOpacity
              style={[styles.suggestionItem, styles.createItem]}
              onPress={handleCreatePress}
            >
              <Ionicons name="add-circle" size={16} color="#0ea5e9" />
              <Text style={styles.createText}>
                Create "{inputValue.trim()}"
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chipsScroll: {
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#93c5fd',
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  inputIcon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    padding: 0,
  },
  suggestionsContainer: {
    marginTop: 4,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  suggestionText: {
    fontSize: 15,
    color: '#374151',
  },
  createItem: {
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 0,
  },
  createText: {
    fontSize: 15,
    color: '#0ea5e9',
    fontWeight: '500',
  },
});

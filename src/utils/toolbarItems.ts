// Custom toolbar items for 10tap-editor with image support
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { EditorBridge } from '@10play/tentap-editor';

// Image icon for toolbar - 112x112 PNG with black silhouette on transparent background
// This format is required for 10tap-editor's tintColor styling to work properly
const ImageIcon = require('../assets/image-icon.png');

export interface ToolbarItem {
  onPress: (args: { editor: EditorBridge; editorState: any; setToolbarContext: any; toolbarContext: any }) => () => void;
  active: (args: { editor: EditorBridge; editorState: any }) => boolean;
  disabled: (args: { editor: EditorBridge; editorState: any }) => boolean;
  image: (args: { editor: EditorBridge; editorState: any }) => any;
}

/**
 * Creates an image toolbar item that opens the image picker
 */
export const createImageToolbarItem = (): ToolbarItem => ({
  onPress: ({ editor }) => async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to add images to your notes.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];

        if (asset.base64) {
          // Create data URL from base64
          const mimeType = asset.mimeType || 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,${asset.base64}`;

          // Insert image into editor
          editor.setImage(dataUrl);
          console.log('✅ Image inserted into editor');
        } else {
          Alert.alert('Error', 'Could not process the selected image');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  },
  active: () => false,
  disabled: () => false,
  image: () => ImageIcon,
});

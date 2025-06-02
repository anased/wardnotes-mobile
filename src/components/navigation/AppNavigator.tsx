import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import only the screens we've created
import AuthScreen from '../../screens/auth/AuthScreen';
import NotesListScreen from '../../screens/notes/NotesListScreen';
import NoteDetailScreen from '../../screens/notes/NoteDetailScreen';
import CreateNoteScreen from '../../screens/notes/CreateNoteScreen';
import SettingsScreen from '../../screens/settings/SettingsScreen';
import ProfileScreen from '../../screens/settings/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'home';

          if (route.name === 'Notes') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Notes" component={NotesListScreen} />
      <Tab.Screen name="Create" component={CreateNoteScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  // For now, always show the main tabs (no authentication)
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={MainTabs} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="NoteDetail" 
          component={NoteDetailScreen}
          options={{ title: 'Note Details' }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
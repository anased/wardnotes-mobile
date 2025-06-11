// src/components/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Auth
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../../screens/auth/LoadingScreen';
import AuthScreen from '../../screens/auth/AuthScreen';

// Main screens
import NotesListScreen from '../../screens/notes/NotesListScreen';
import NoteDetailScreen from '../../screens/notes/NoteDetailScreen';
import CreateNoteScreen from '../../screens/notes/CreateNoteScreen';
import EditNoteScreen from '../../screens/notes/EditNoteScreen';
import SettingsScreen from '../../screens/settings/SettingsScreen';
import ProfileScreen from '../../screens/settings/ProfileScreen';
import LearningTrackerScreen from '../../screens/learning-tracker/LearningTrackerScreen'; // Add this import

// Import types
import { RootStackParamList, MainTabParamList } from '../../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Authenticated user's main tabs
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Notes') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'LearningTracker') { // Add this condition
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Notes" 
        component={NotesListScreen}
        options={{ title: 'Library' }}
      />
      <Tab.Screen 
        name="Create" 
        component={CreateNoteScreen}
        options={{ title: 'New Note' }}
      />
      <Tab.Screen 
      name="LearningTracker" 
      component={LearningTrackerScreen}
      options={{ tabBarLabel: 'Tracker' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
      />
    </Tab.Navigator>
  );
}

// Stack navigator for authenticated users
function AuthenticatedNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="NoteDetail" 
        component={NoteDetailScreen}
        options={{ 
          title: 'Note Details',
          headerShown: false, // We handle the header in the component
        }}
      />
      <Stack.Screen 
        name="EditNote" 
        component={EditNoteScreen}
        options={{ 
          title: 'Edit Note',
          headerShown: false, // We handle the header in the component
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for unauthenticated users
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Loading" component={LoadingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AuthenticatedNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
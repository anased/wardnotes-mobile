// src/types/navigation.ts
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// Define the parameter lists for our navigators
export type RootStackParamList = {
  MainTabs: undefined;
  NoteDetail: { noteId: string };
  EditNote: { noteId: string };
  Profile: undefined;
  Auth: undefined;
  Loading: undefined;
  NotificationSettings: undefined;
  // Flashcard screens
  DeckScreen: { deckId: string };
  StudyScreen: { deckId: string; mode?: 'new' | 'review' | 'mixed' };
  CreateCard: { deckId?: string };
};

export type MainTabParamList = {
  Notes: undefined;
  Create: undefined;
  Settings: undefined;
  LearningTracker: undefined;
  Flashcards: undefined;
};

// Navigation prop types for screens
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;

export type MainTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  StackNavigationProp<RootStackParamList>
>;

// Route prop types
export type NoteDetailRouteProp = RouteProp<RootStackParamList, 'NoteDetail'>;
export type EditNoteRouteProp = RouteProp<RootStackParamList, 'EditNote'>;
export type DeckScreenRouteProp = RouteProp<RootStackParamList, 'DeckScreen'>;
export type StudyScreenRouteProp = RouteProp<RootStackParamList, 'StudyScreen'>;
export type CreateCardRouteProp = RouteProp<RootStackParamList, 'CreateCard'>;

// Combined navigation prop for screens that need both
export type CombinedNavigationProp = CompositeNavigationProp<
  MainTabNavigationProp,
  RootStackNavigationProp
>;
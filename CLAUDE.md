# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Development Commands

### Core Commands
- `npm start` - Start Expo development server
- `npm run android` - Start Expo for Android device/emulator 
- `npm run ios` - Start Expo for iOS device/simulator
- `npm run web` - Start Expo for web development

## Architecture Overview

WardNotes Mobile is a React Native app built with Expo that provides cross-platform medical note-taking functionality, sharing the same Supabase backend as the web version.

### Database & Authentication
- **Supabase** for PostgreSQL database and authentication via custom REST client
- **Authentication:** Email/password + Google OAuth (implicit flow)
- **OAuth Integration:** Expo WebBrowser for secure in-app Google sign-in
- Row-level security (RLS) implemented for all tables (shared with web app)
- Custom database functions for flashcard scheduling (SM-2 algorithm) and activity tracking
- Key tables: notes, categories, tags, flashcards, flashcard_decks, daily_activity, subscriptions

### Core Features
1. **Notes System** - Native markdown editor with iOS keyboard toolbar, categories, and tags
2. **Flashcard System** - AI-generated flashcards from notes with spaced repetition
3. **Activity Tracking** - Daily note counts and streak tracking
4. **Premium Subscriptions** - Stripe integration for premium features
5. **User-defined Categories/Tags** - Custom organization system

### Mobile Architecture
- **React Native 0.79.5** with Expo 53
- **TypeScript** with strict mode enabled
- **React Navigation** for native navigation stack
- **Custom Supabase REST client** (no realtime features for mobile compatibility)
- **AsyncStorage** for local session persistence
- **Native Editor** - Markdown-based editing with native TextInput and InputAccessoryView keyboard toolbar

### Current Editor Architecture (November 2025)

**Note Viewing (Read-Only):**
- Native renderer using 100% React Native Text/View components
- Parses TipTap JSON from database into native-friendly block structure
- Zero WebView usage for optimal performance
- Mobile-optimized typography (H1: 24px, H2: 20px, H3: 18px, Body: 16px)
- Supports headings, paragraphs, lists, blockquotes, code blocks, text formatting
- Used in `NoteDetailScreen` for viewing notes

**Note Editing (Create/Edit):**
- **10tap-editor** - Full TipTap WYSIWYG editor for React Native
- WebView-based but mobile-optimized with iOS-native typography
- Rich text formatting toolbar with all TipTap features
- Direct TipTap JSON editing (no conversion needed)
- Formatting: Headings, Bold, Italic, Lists, Links, Images, etc.
- **Mobile Typography:** iOS system font, 16px body text, native color (#1f2937)
- Both `CreateNoteScreen` and `EditNoteScreen` use `TipTapEditor` component (single source of truth)
- CSS injected immediately for consistent native appearance

**Data Flow:**
```
1. Database stores TipTap JSON (shared with web app)
2. Viewing: TipTap JSON → Parser → Native React Native components (NativeNoteRenderer)
3. Editing: TipTap JSON → 10tap-editor (WebView) → TipTap JSON → Save
```

**Key Files:**
- `src/components/notes/TipTapEditor.tsx` - 10tap-editor wrapper with mobile typography
- `src/components/notes/EditorKeyboardToolbar.tsx` - Custom keyboard toolbar (if used)
- `src/components/notes/NativeNoteRenderer.tsx` - Native viewing component
- `src/utils/tiptapNativeParser.ts` - TipTap JSON parser for native rendering
- `src/utils/tiptapConverter.ts` - HTML ↔ TipTap conversion utilities

**Cross-Platform Compatibility:**
- ✅ Same TipTap JSON storage format as web app
- ✅ Content syncs perfectly between mobile and web
- ✅ Web uses TipTap WYSIWYG editor
- ✅ Mobile uses 10tap-editor for editing (TipTap in WebView)
- ✅ Mobile uses native components for viewing (performance)
- ✅ No data migration required

### Key Directories
- `src/components/` - React Native components organized by feature
- `src/screens/` - Screen components for React Navigation
- `src/contexts/` - React Context providers (AuthContext)
- `src/hooks/` - Custom React hooks for data operations
- `src/services/` - Backend integration services
- `src/utils/` - Utility functions including TipTap converters

### Database Schema Key Points
- User-specific data with RLS policies (same as web app)
- Flashcard scheduling uses SM-2 algorithm via PostgreSQL functions
- Daily activity automatically tracked via triggers
- Categories and tags are user-defined and customizable
- Premium features gated by subscription status

### Development Notes
- TypeScript strict mode enabled
- Metro bundler configured to block Node.js modules incompatible with React Native
- Custom REST client implementation avoids WebSocket dependencies
- Cross-platform development supports iOS, Android, and web simultaneously
- Shared backend with web app ensures data consistency

### File Organization Patterns
- Components grouped by feature (auth/, notes/, premium/, etc.)
- Custom hooks follow `use[Feature]` naming pattern
- Screen components use React Navigation patterns
- Services mirror web app organization for consistency

### Mobile-Specific Considerations
- **No WebSocket support** - Uses custom REST client instead of full Supabase client
- **Metro bundler configuration** - Aliases and blocks problematic Node.js modules
- **Rich text editing limitations** - Tables require web-only editing mode
- **Platform-specific navigation** - Native iOS/Android navigation patterns
- **Offline-first auth** - Session persistence for offline access

### Content Management
- **TipTap JSON Storage** - Rich text stored as TipTap JSON documents (same as web)
- **WYSIWYG Editing** - 10tap-editor provides full TipTap editing on mobile
- **Native Rendering** - Custom parser converts TipTap JSON to native components for viewing
- **Cross-platform compatibility** - Seamless sync between mobile and web (both use TipTap)
- **Table detection** - Complex formatting (tables) may require web-only editing mode

## Code Style Guidelines

This section defines the coding standards and patterns to follow when working on the WardNotes mobile codebase. These guidelines maintain consistency with the web app while accommodating React Native specifics.

### TypeScript Guidelines

#### Type Definitions
- **Prefer interfaces over type aliases** for object shapes
- **Use explicit return types** for functions, especially public APIs
- **Avoid `any` type** - use `unknown` or proper typing instead
- **Use strict null checks** - handle undefined/null explicitly

```typescript
// ✅ Good
interface NoteScreenProps {
  initialData?: Partial<Note>;
  isEditing?: boolean;
}

function createNote(data: NoteData): Promise<Note> {
  // implementation
}

// ❌ Avoid
type NoteScreenProps = {
  initialData: any;
  isEditing: boolean | undefined;
}
```

#### Import/Export Patterns
- **Use default exports** for React components and screens
- **Use named exports** for utilities, hooks, and types
- **Import types separately** when needed for clarity

```typescript
// ✅ Component files
export default function NoteScreen({ ... }: NoteScreenProps) { }

// ✅ Utility/hook files
export const formatDate = (date: Date) => { }
export { useNotes, useCategories };

// ✅ Type imports
import type { Note, Category } from '../services/supabase/client';
```

### React Native Component Patterns

#### Component Structure
- **Use functional components** with hooks
- **Follow the component order**: imports → types → constants → component → export
- **Extract complex logic** into custom hooks
- **Keep components focused** - single responsibility

```typescript
// ✅ Component structure
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface ComponentProps {
  title: string;
  onSave: (data: FormData) => void;
}

const DEFAULT_CONFIG = {
  autoSave: true,
  debounceMs: 500,
};

export default function MyComponent({ title, onSave }: ComponentProps) {
  // Component implementation
}
```

#### State Management
- **Use useState** for local component state
- **Use useEffect** with proper dependencies
- **Extract stateful logic** into custom hooks when reused
- **Use Context** for app-wide state (auth, notifications)

#### Event Handlers
- **Prefix event handlers** with `handle`
- **Use arrow functions** for inline handlers only when necessary
- **Extract complex handlers** to separate functions

### Naming Conventions

#### Files and Directories
- **PascalCase** for React components and screens: `NoteScreen.tsx`, `TipTapEditor.tsx`
- **camelCase** for utilities and hooks: `useAuth.ts`, `formatDate.ts`
- **Feature-based directories**: Group related components together

```
src/
├── components/
│   ├── notes/           # Note-related components
│   │   ├── TipTapEditor.tsx
│   │   ├── EditorKeyboardToolbar.tsx
│   │   └── NoteViewer.tsx
│   ├── ui/              # Reusable UI components
│   └── auth/            # Authentication components
├── screens/
│   ├── notes/           # Note screens
│   ├── auth/            # Auth screens
│   └── settings/        # Settings screens
├── hooks/               # Custom React hooks
├── services/            # Backend services
└── utils/               # Utility functions
```

#### Variables and Functions
- **camelCase** for variables, functions, and methods
- **PascalCase** for React components and classes
- **UPPER_SNAKE_CASE** for constants and environment variables
- **Descriptive names** - avoid abbreviations

### React Native Styling Patterns

#### StyleSheet Usage
- **Use StyleSheet.create** for component styles
- **Group related styles** logically
- **Use consistent spacing and sizing** patterns
- **Follow platform design guidelines**

```typescript
// ✅ StyleSheet patterns
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0ea5e9',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});
```

### Error Handling
- **Use try-catch blocks** for async operations
- **Provide meaningful error messages** to users
- **Log errors** for debugging but don't expose sensitive data
- **Handle loading states** appropriately

```typescript
// ✅ Error handling pattern
const handleSaveNote = async () => {
  try {
    setIsLoading(true);
    await saveNote(noteData);
    // Show success feedback
  } catch (error) {
    console.error('Failed to save note:', error);
    // Show error feedback to user
  } finally {
    setIsLoading(false);
  }
};
```

### Performance Guidelines
- **Use React.memo** for expensive components that re-render frequently
- **Use useCallback/useMemo** judiciously - only when actually needed
- **Optimize list rendering** with proper keyExtractor and item optimization
- **Handle memory leaks** by cleaning up subscriptions and timers

These guidelines ensure consistency with the web app while accommodating React Native's specific patterns and constraints.

Always ensure changes maintain compatibility between mobile and web versions, particularly for shared data structures and API contracts.

## Troubleshooting

### iOS Simulator Issues

If you encounter "Unable to boot the Simulator" errors with launchd_sim failures, follow these steps:

**iOS Simulator Reset Procedure:**
1. **Shutdown all simulators**: `xcrun simctl shutdown all`
2. **Erase simulator data**: `xcrun simctl erase all` 
3. **Clear CoreSimulator caches**: `rm -rf ~/Library/Developer/CoreSimulator/Caches/*`
4. **Restart CoreSimulator service**: 
   ```bash
   launchctl unload com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null
   launchctl load com.apple.CoreSimulator.CoreSimulatorService
   ```
5. **Open Simulator app**: `open -a Simulator`
6. **Boot specific simulator**: `xcrun simctl boot [DEVICE_ID]`
7. **Launch app**: `npm run ios`

**Common Symptoms:**
- "launchd failed to respond" errors
- "Failed to start launchd_sim" messages  
- CoreSimulatorService with exit code -9
- Unable to boot any simulator device

**Alternative Solutions:**
- If the above doesn't work, restart your Mac (most reliable)
- Use physical iOS device with Expo Go app
- Use web version temporarily: `npm run web`

This procedure has successfully resolved iOS Simulator issues in the past.

## Recent Changes & Updates

This section highlights the most recent major changes. For complete project history, see [CHANGELOG.md](./CHANGELOG.md).

### Editor Toolbar & Keyboard Scrolling Improvements (January 2025)
**Status:** ✅ **COMPLETE**

**What Changed:**
- Fixed toolbar positioning consistency between CreateNoteScreen and EditNoteScreen
- Resolved keyboard scrolling issue where content was hidden and inaccessible
- Toolbar now appears above keyboard in both create and edit screens
- ScrollView automatically adjusts when keyboard appears, enabling scrolling to see hidden content

**Technical Details:**

**Problem Solved:**
1. **Inconsistent Toolbar Position:** In EditNoteScreen, formatting toolbar appeared above keyboard. In CreateNoteScreen, it appeared at bottom of editor content area.
2. **Keyboard Coverage Issue:** When keyboard appeared, it covered large portion of content field. Users couldn't scroll down to see text being typed behind the keyboard.

**Solution Implemented:**

1. **External Toolbar Rendering (Both Screens):**
   - Added `renderToolbarExternally={true}` prop to TipTapEditor component
   - Prevents toolbar from rendering inside editor WebView
   - Renders Toolbar component outside ScrollView using absolute positioning

2. **Keyboard-Aware Positioning:**
   ```tsx
   <KeyboardAvoidingView
     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
     keyboardVerticalOffset={keyboardVerticalOffset}
     style={styles.toolbarKeyboardAvoidingView}
   >
     <Toolbar editor={editorRef.current.getEditorBridge()} />
   </KeyboardAvoidingView>
   ```
   - Toolbar positioned absolutely at bottom of screen with `zIndex: 1000`
   - Moves up automatically when keyboard appears (iOS native behavior)

3. **Automatic Keyboard Insets:**
   ```tsx
   <ScrollView
     automaticallyAdjustKeyboardInsets={true}
     keyboardDismissMode="interactive"
   >
   ```
   - Automatically adjusts ScrollView bottom padding when keyboard appears
   - Enables scrolling to see content hidden behind keyboard
   - Allows interactive keyboard dismissal by swiping down

**Files Modified:**
- `src/screens/notes/CreateNoteScreen.tsx`
  - Restructured layout to match EditNoteScreen pattern
  - Added external toolbar rendering with KeyboardAvoidingView
  - Added `automaticallyAdjustKeyboardInsets={true}` to ScrollView
  - Added `keyboardDismissMode="interactive"` for better UX

- `src/screens/notes/EditNoteScreen.tsx`
  - Added `automaticallyAdjustKeyboardInsets={true}` to ScrollView
  - Added `keyboardDismissMode="interactive"` for better UX

**Style Changes:**
- Added `toolbarKeyboardAvoidingView` style with absolute positioning
- Updated `content` wrapper style for proper layout structure
- Ensured consistent `editorContainer` styling between screens

**User Experience Improvements:**
- ✅ Consistent toolbar position across create and edit screens
- ✅ Toolbar always attached to keyboard (native iOS behavior)
- ✅ Can scroll to see all content while typing, even with keyboard open
- ✅ Swipe down to dismiss keyboard (standard iOS gesture)
- ✅ No content hidden or inaccessible when typing

**Impact:** Provides professional iOS-native editing experience with proper keyboard handling, matching industry standards like Apple Notes and Evernote. Both create and edit flows now have identical, intuitive UX.

---

### Google OAuth Authentication (January 2025)
**Status:** ✅ **COMPLETE**

**What Changed:**
- Implemented Google OAuth authentication for mobile app
- Full feature parity with web app Google sign-in
- Uses Expo's secure WebBrowser for OAuth flow
- Supports account picker for multiple Google accounts

**Technical Architecture:**
- **OAuth Flow:** Implicit flow using access tokens (not authorization codes)
- **Dependencies:** `expo-auth-session`, `expo-web-browser`, `expo-crypto`
- **Session Management:** Tokens stored securely in AsyncStorage
- **Account Picker:** Forces Google account selection every time with `prompt=select_account`
- **Same Backend:** Uses identical Supabase OAuth configuration as web app

**Implementation Details:**

1. **OAuth URL Construction:**
   - Base URL: `${supabaseUrl}/auth/v1/authorize`
   - Query parameters:
     - `provider=google` - OAuth provider
     - `redirect_to=wardnotes://auth/callback` - Mobile deep link
     - `prompt=select_account` - Force account picker
     - `access_type=offline` - Request refresh token

2. **Authentication Flow:**
   ```
   1. User taps "Sign in with Google"
   2. WebBrowser opens Google OAuth in secure in-app browser
   3. User selects Google account and authenticates
   4. Google redirects to: wardnotes://auth/callback#access_token=...&refresh_token=...
   5. App extracts tokens from URL fragment
   6. App fetches user data using access token
   7. Session stored in AsyncStorage and user signed in
   ```

3. **Sign Out Enhancements:**
   - Clears Supabase session
   - Calls `WebBrowser.maybeCompleteAuthSession()` to clear OAuth cookies
   - Clears AsyncStorage session data
   - Ensures users can switch Google accounts on next sign-in

**Files Created:**
- `src/components/auth/GoogleLoginButton.tsx` - OAuth button with native styling

**Files Modified:**
- `src/services/supabase/client.ts` - Added `signInWithOAuth()` method with query params
- `src/contexts/AuthContext.tsx` - Added `signInWithOAuth(session)` method and WebBrowser sign-out
- `src/screens/auth/AuthScreen.tsx` - Integrated Google sign-in button with divider

**Supabase Configuration Required:**
Add these redirect URIs in Supabase Dashboard → Authentication → URL Configuration:
- `wardnotes://auth/callback` (production/TestFlight)
- `exp://localhost:8081/--/auth/callback` (development with Expo Go)

**User Experience:**
- ✅ Native iOS-styled "Sign in with Google" button
- ✅ Opens secure in-app browser (not external Safari)
- ✅ Account picker shows all Google accounts + option to add new one
- ✅ Seamless redirect back to app after authentication
- ✅ Persistent session across app restarts
- ✅ Can switch Google accounts by signing out and in again

**Technical Notes:**
- Uses implicit OAuth flow (tokens in URL fragment) instead of authorization code flow
- `WebBrowser.openAuthSessionAsync()` replaces deprecated `AuthSession.startAsync()`
- Tokens parsed from URL fragment (`#access_token=...`) not query params
- User data fetched from `/auth/v1/user` endpoint using access token
- Compatible with existing email/password authentication

**Impact:** Mobile users can now sign in with Google just like on the web app, providing a seamless cross-platform authentication experience. 🎉

---

### AI Flashcard Generation Feature (November 2025)
**Status:** ✅ **COMPLETE**

**What Changed:**
- Implemented full AI flashcard generation feature for mobile app
- Calls existing web app API endpoints for consistency (no code duplication)
- Complete preview, edit, and save workflow with native iOS UX patterns
- Fixed iOS Picker component rendering issues with custom modal selectors

**Technical Architecture:**
- **API Integration:** Calls `wardnotes.vercel.app/api/flashcards/generate-from-note`
- **Same OpenAI Prompts:** Uses identical GPT-4o prompts as web app for consistency
- **No Fallback System:** Shows proper error messages instead of auto-generated cards
- **Secure:** OpenAI API key stays on server, never exposed in mobile app

**Feature Capabilities:**
1. **Configuration Screen:**
   - Card Type: Cloze Deletion or Front & Back (iOS-native modal picker)
   - Deck Selection: Touchable selector opens bottom sheet picker
   - Quick Deck Creation: Inline modal with color picker (8 preset colors)
   - Max Cards Control: +5/-5 buttons, range 1-50, default 10

2. **Generation Flow:**
   - Loading state with informative message
   - Calls web API with Bearer token authentication
   - Error handling for network, OpenAI, and auth failures

3. **Preview & Edit:**
   - All cards selected by default (checkboxes)
   - Tap any card to edit content before saving
   - Select/deselect individual cards
   - "Regenerate" button to generate new set
   - "Save Selected" button (only enabled if cards selected)

4. **Card Editing:**
   - Cloze cards: Edit cloze content with {{c1::text}} format
   - Front/Back cards: Edit question and answer separately
   - Validation ensures non-empty content
   - Visual indicator for edited cards

**iOS-Specific UX Fixes:**
- **Problem:** iOS Picker renders inline as scroll wheel, poor UX
- **Solution:** Touchable selector fields + bottom sheet modals
  - Card Type field: Shows current selection, tap opens modal picker
  - Deck field: Shows selected deck name, tap opens deck picker
  - Native iOS modal pattern (slides from bottom, Cancel/Done buttons)
  - Prevents render cycle issues with conditional state updates

**Files Created:**
- `src/types/flashcardGeneration.ts` - Type definitions
- `src/services/flashcardGeneration.ts` - API service
- `src/components/flashcards/DeckCreationModal.tsx` - Deck creation
- `src/components/flashcards/FlashcardEditModal.tsx` - Card editing
- `src/components/flashcards/FlashcardPreviewScreen.tsx` - Preview/select
- `src/components/flashcards/FlashcardGeneratorModal.tsx` - Main orchestrator

**Files Modified:**
- `src/screens/notes/NoteDetailScreen.tsx` - Integrated generator modal

**User Flow:**
```
1. Note Detail → Tap ⚡ icon → Generator opens
2. Configure: Select card type, deck, max cards
3. Tap "Generate Flashcards" → Loading → Preview
4. Edit/select cards → Tap "Save Selected"
5. Success toast → Flashcards added to deck
```

**Impact:** Full feature parity with web app, native iOS UX, consistent AI generation

---

### Flashcard Management & Editing (November 2025)
**Status:** ✅ **COMPLETE**

**What Changed:**
- Implemented comprehensive flashcard management system with full CRUD operations
- Added FlashcardListModal component for viewing and editing all flashcards
- Updated DeckScreen and NoteFlashcards to support tapping cards to view/edit
- Achieved feature parity with web app's FlashcardListView component

**Technical Architecture:**
- **FlashcardListModal Component:** Full-screen modal for flashcard management
- **Database Integration:** Uses FlashcardService for CRUD operations
- **Real-time Updates:** Auto-refresh after edits/deletes
- **Search Functionality:** Filter flashcards by content

**Feature Capabilities:**
1. **View All Flashcards:**
   - Display ALL flashcards in a deck or note (not limited to 5)
   - Shows front/back or cloze content
   - Visual badges for card type (cloze/front-back) and status
   - Card statistics: reviews, accuracy, ease factor, interval

2. **Search & Filter:**
   - Search by front content, back content, or cloze content
   - Live filtering as you type
   - Shows "X of Y cards" count

3. **Inline Editing:**
   - Tap edit button to enter edit mode
   - Front/Back cards: Edit both sides in separate text fields
   - Cloze cards: Edit cloze content with {{c1::text}} format
   - Validation ensures non-empty content
   - Save/Cancel buttons with loading states
   - Auto-refresh list after successful edit

4. **Delete Flashcards:**
   - Tap delete button (trash icon)
   - Confirmation dialog shows card preview
   - Permanent deletion with proper error handling
   - Auto-refresh after deletion

5. **Status Badges:**
   - Color-coded badges: New (blue), Learning (yellow), Review (orange), Mature (green), Suspended (red)
   - Visual distinction between card types with icons

**Integration Points:**
- **DeckScreen:**
  - Added "View All" button in card preview header
  - Made individual cards tappable
  - Opens FlashcardListModal with deckId filter

- **NoteFlashcards:**
  - Changed tap behavior from navigating to deck to opening modal
  - Made "+X more cards" indicator tappable
  - Opens FlashcardListModal with noteId filter

**Files Created:**
- `src/components/flashcards/FlashcardListModal.tsx` - Full flashcard management modal

**Files Modified:**
- `src/screens/flashcards/DeckScreen.tsx` - Added View All button and modal integration
- `src/components/notes/NoteFlashcards.tsx` - Updated tap handlers to open modal

**Bug Fixes:**
- Fixed duplicate flashcard issue in note study sessions
  - Problem: New cards appeared twice (once in due query, once in new query)
  - Solution: Added `.neq('status', 'new')` to due cards query in `getStudyCardsForNote`
  - File: `src/services/flashcardService.ts:341`

**UX Improvements:**
- Changed max cards selector from +5/-5 to +1/-1 for precise control
- Removed preset buttons to reduce UI clutter
- Users can now select any number from 1-50

**Impact:**
- Full feature parity with web app for flashcard management
- Native iOS patterns (modals, touch interactions)
- Comprehensive CRUD operations for flashcards
- Improved usability for reviewing and editing study materials

---

### Mobile-Optimized Typography (November 2025)
**Status:** ✅ **COMPLETE**

**What Changed:**
- Added native iOS-like typography to 10tap-editor (TipTapEditor component)
- Refactored EditNoteScreen to use TipTapEditor component (eliminated 152+ lines of duplicate code)
- Fixed keyboard scrolling issues in CreateNoteScreen
- CSS injected immediately for consistent native appearance

**Typography Details:**
- **Font:** iOS system font (`-apple-system, BlinkMacSystemFont`)
- **Color:** Native text gray (#1f2937)
- **Sizes:** H1: 24px, H2: 20px, H3: 18px, Body: 16px
- **Weights:** Bold (700) for H1-H3, Semibold (600) for H4-H6

**Architecture Improvement:**
- Both CreateNoteScreen and EditNoteScreen now use the same `TipTapEditor` component
- Single source of truth for mobile typography and editor configuration
- Eliminated code duplication between create/edit screens

**Files Modified:**
- `src/components/notes/TipTapEditor.tsx` - Added comprehensive mobile typography CSS
- `src/screens/notes/EditNoteScreen.tsx` - Refactored to use TipTapEditor component
- `src/screens/notes/CreateNoteScreen.tsx` - Fixed keyboard/scroll interaction

**Impact:** Professional native appearance matching iOS Notes, consistent UX across all editor screens

---

### Native Editor & Keyboard Toolbar (November 2025)
**Status:** ⚠️ **SUPERSEDED** - Replaced with 10tap-editor

**What Changed:**
- Replaced WebView-based TipTap editor with native React Native components
- Built custom TipTap JSON parser for native rendering
- Implemented markdown-based editing with native TextInput
- Added InputAccessoryView keyboard-attached formatting toolbar (iOS-native)
- Achieved true iOS Notes-like experience

**Key Features:**
- **Viewing:** Native renderer (zero WebView overhead)
- **Editing:** Markdown syntax with formatting toolbar
- **Toolbar:** Attached to keyboard, appears/disappears automatically
- **Buttons:** H1, H2, H3, Bold, Italic, Lists, Undo/Redo
- **Performance:** Native scrolling, instant rendering
- **Cross-platform:** Same TipTap JSON storage as web app

**Files:**
- `src/components/notes/NativeNoteEditor.tsx` - Editor component
- `src/components/notes/FormattingToolbar.tsx` - Keyboard toolbar
- `src/components/notes/NativeNoteRenderer.tsx` - Viewing component
- `src/utils/tiptapNativeParser.ts` - TipTap JSON parser
- `src/utils/nativeToTipTap.ts` - Markdown converter

**Impact:** Massive UX improvement, matches industry standards (Apple Notes, Evernote)

---

### Flashcard Loading Fix & UX Improvements (November 2025)
**Status:** ✅ **RESOLVED**

**What Changed:**
- Fixed infinite loading bug in flashcard hooks (useCallback object dependencies)
- Improved Note Detail screen UX (removed clutter, enhanced readability)
- Updated Xcode to 26.1.1, resolved iOS 26.1 simulator compatibility

**Files Modified:**
- `src/hooks/useFlashcards.ts` - Fixed infinite loop with stable dependencies
- `src/screens/notes/NoteDetailScreen.tsx` - Cleaner layout

**Impact:** Resolved critical bug, improved content readability

---

### TestFlight Deployment (November 2024)
**Status:** ✅ **LIVE**

**What Changed:**
- First production build deployed to TestFlight
- Resolved EAS Build Node.js version configuration
- Added required Apple privacy descriptions

**Build Info:**
- **Bundle ID:** `com.anased.wardnotes`
- **Distribution:** TestFlight (internal testing)
- **Node Version:** 20.19.4

**Commands:**
```bash
# Production builds
npx eas build --platform ios --profile production --auto-submit

# Simulator builds
npx eas build --profile preview --platform ios
```

**Impact:** App available for TestFlight beta testing

---

### Previous Updates

For complete history including:
- iOS Build Compatibility Issues (November 2024)
- Flashcard System Implementation (August 2024)
- And other historical changes

See [CHANGELOG.md](./CHANGELOG.md) for detailed documentation.

---

## Update Guidelines

When adding new features or making significant changes:

1. **Update Architecture sections** if core implementation changes
2. **Add brief summary** to Recent Changes (keep it concise)
3. **Document details** in CHANGELOG.md
4. **List modified files** for easy reference
5. **Note breaking changes** or migration requirements

This keeps CLAUDE.md focused on current guidance while maintaining complete history in CHANGELOG.md.

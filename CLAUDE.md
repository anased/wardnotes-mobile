# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Note Viewing:**
- Native renderer using 100% React Native Text/View components
- Parses TipTap JSON from database into native-friendly block structure
- Zero WebView usage for optimal performance
- Mobile-optimized typography (H1: 24px, H2: 20px, H3: 18px, Body: 16px)
- Supports headings, paragraphs, lists, blockquotes, code blocks, text formatting

**Note Editing:**
- Native TextInput with markdown syntax (`## Heading`, `- List`, etc.)
- InputAccessoryView keyboard-attached formatting toolbar (iOS-native)
- Real-time conversion from markdown to TipTap JSON on save
- Formatting buttons: H1, H2, H3, Bold, Italic, Bullet List, Ordered List, Undo/Redo
- Toolbar appears/disappears automatically with keyboard
- Matches Apple Notes, WhatsApp, Messages UX patterns

**Data Flow:**
```
1. Database stores TipTap JSON (shared with web app)
2. Viewing: TipTap JSON → Parser → Native React Native components
3. Editing: TipTap JSON → Markdown text → User edits → TipTap JSON → Save
```

**Key Files:**
- `src/components/notes/NativeNoteEditor.tsx` - Markdown editor with formatting toolbar
- `src/components/notes/FormattingToolbar.tsx` - iOS-native keyboard toolbar
- `src/components/notes/NativeNoteRenderer.tsx` - Native viewing component
- `src/utils/tiptapNativeParser.ts` - TipTap JSON parser
- `src/utils/nativeToTipTap.ts` - Markdown ↔ TipTap converter

**Cross-Platform Compatibility:**
- ✅ Same TipTap JSON storage format as web app
- ✅ Content syncs perfectly between mobile and web
- ✅ Web uses TipTap WYSIWYG editor, mobile uses native components
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
- **Native Rendering** - Custom parser converts TipTap JSON to native React Native components
- **Markdown Editing** - Native TextInput with markdown syntax, converts to TipTap JSON on save
- **Cross-platform compatibility** - Seamless sync between mobile (native) and web (TipTap editor)
- **Table detection** - Complex formatting (tables) requires web-only editing mode

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

### Native Editor & Keyboard Toolbar (November 2025)
**Status:** ✅ **COMPLETE**

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

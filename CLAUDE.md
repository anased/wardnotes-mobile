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
1. **Notes System** - Rich text editing with TipTap mobile editor, categories, and tags
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
- **TipTap Editor** via @10play/tentap-editor for rich text editing

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
- **TipTap Content Format** - Rich text stored as TipTap JSON documents (same as web)
- **Cross-platform compatibility** - Content conversion utilities for mobile/web sync
- **Table detection** - Automatic web-only mode for complex formatting
- **Content polling** - Regular content change detection for editor updates

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

This section tracks major feature additions, architectural changes, and important fixes to help future Claude instances understand the project evolution.

### Flashcard System Implementation (August 2024)
**What Changed:**
- Complete mobile flashcard system implementation with spaced repetition (SM-2 algorithm)
- Cross-platform compatibility with existing web app flashcard data
- Full study workflow with mobile-optimized UI components

**Technical Details:**
**Phase 1 - Core Infrastructure:**
- **Types**: Created comprehensive TypeScript interfaces in `src/types/flashcard.ts` for mobile flashcard system
- **REST Client Extensions**: Extended `src/services/supabase/rest-client.ts` with additional query methods (lte, gte, neq, in, or)
- **Authentication Fix**: Implemented dynamic token fetching to resolve authentication issues with flashcard data loading
- **Custom Hooks**: Built `src/hooks/useDecks.ts`, `src/hooks/useFlashcards.ts`, and `src/hooks/useStudySession.ts` for state management
- **Navigation**: Updated `src/types/navigation.ts` to include flashcard screens (DeckScreen, StudyScreen, CreateCard)

**Phase 2 - Screen Implementation:**
- **FlashcardDashboard**: Main dashboard screen (`src/screens/flashcards/FlashcardDashboard.tsx`) with deck overview and statistics
- **DeckScreen**: Deck management screen (`src/screens/flashcards/DeckScreen.tsx`) for individual deck operations
- **StudyScreen**: Complete study interface (`src/screens/flashcards/StudyScreen.tsx`) with progress tracking and session management
- **CreateCardScreen**: Card creation interface (`src/screens/flashcards/CreateCardScreen.tsx`)

**Phase 3 - Study Components:**
- **FlashcardView**: Mobile-optimized card display component (`src/components/flashcards/FlashcardView.tsx`) supporting front/back and cloze deletion
- **Review Interface**: Touch-friendly 4-point rating system for spaced repetition reviews
- **Study Session Management**: Complete session tracking with statistics and completion flow

**Service Layer:**
- **FlashcardService**: Full service implementation (`src/services/flashcardService.ts`) with SM-2 spaced repetition algorithm
- **CRUD Operations**: Complete deck and flashcard management functionality
- **Statistics**: Real-time deck statistics calculation and study session tracking

**Files Added/Modified:**
- `src/types/flashcard.ts` - Complete mobile flashcard type definitions
- `src/services/supabase/rest-client.ts` - Extended with flashcard query methods and authentication fixes
- `src/services/flashcardService.ts` - Complete flashcard service with SM-2 algorithm
- `src/hooks/useDecks.ts`, `src/hooks/useFlashcards.ts`, `src/hooks/useStudySession.ts` - Custom React hooks
- `src/screens/flashcards/` - All flashcard screen components
- `src/components/flashcards/FlashcardView.tsx` - Core flashcard display component
- `src/types/navigation.ts` - Extended navigation types
- `src/screens/main/MainTabs.tsx` - Added flashcard tab

**Bug Fixes During Implementation:**
1. **UI Layout Issue**: Content overlapping status bar - fixed with SafeAreaView and StatusBar components
2. **Authentication Issue**: Static headers not updating after login - resolved with dynamic token fetching in REST client
3. **Query Chaining Issue**: REST client methods not returning 'this' - fixed by restructuring query builder pattern to support method chaining for insert/update/delete operations

**Testing Results:**
- Successfully tested flashcard creation, study sessions, and review submissions
- Confirmed cross-platform data compatibility between mobile and web versions
- Verified spaced repetition algorithm functioning correctly with proper interval calculations

**Development Workflow:**
- Developed on feature branch `feature/mobile-flashcards`
- Systematic testing and bug resolution through iOS Simulator
- Successfully merged to main branch after complete testing

**Impact:**
- Mobile app now has full feature parity with web app for flashcard functionality
- Users can seamlessly study flashcards across mobile and web platforms
- Implements proven spaced repetition algorithm for effective learning
- Maintains consistent data model and user experience across platforms

### iOS Build Compatibility Issues (November 2024)
**Status:** ✅ **RESOLVED** - iOS builds now working via EAS Build with patch-package fix

**What Changed:**
- Identified iOS build incompatibilities while attempting to run `npm run ios`
- Two critical blocking issues discovered and resolved
- Upgraded macOS to 26.1 and Xcode to 16.1.1
- Implemented permanent TenTap codegen fix using patch-package
- Successfully built and deployed app using EAS Build

**Technical Details:**

**Issue #1: TenTap Editor Codegen Incompatibility** (RESOLVED)
- `@10play/tentap-editor@0.7.4` incompatible with React Native 0.79.5 new architecture
- Codegen fails to generate required C++ headers (TenTapViewProps, TenTapViewComponentDescriptor, RCTTenTapViewViewProtocol)
- Root cause: Conditional logic in component spec prevents proper codegen
- **Solution:** Created patch using `patch-package` that extracts codegen call to separate spec file
- Patch automatically applies via `postinstall` script in package.json

**Issue #2: Expo SDK Requires Xcode 16** (RESOLVED)
- Expo 53 uses iOS 18 SwiftUI APIs (`onGeometryChange`)
- Previous system: Xcode 15.4 with iOS 17.5 SDK
- **Solution:** Upgraded macOS to 26.1 (Sequoia 15.1) and Xcode to 16.1.1
- Used EAS Build cloud service as interim solution before local simulator runtime download

**Resolution Approach:**
- Upgraded system: macOS 14.4.1 → 26.1, Xcode 15.4 → 16.1.1
- Applied TenTap codegen fix via patch-package
- Used EAS Build with Xcode 16 in cloud (avoided iOS 18.1 simulator download)
- Successfully built and installed on iPhone 15 iOS 17.5 simulator

**Current State:**
- ✅ macOS 26.1 (Sequoia 15.1) with Xcode 16.1.1
- ✅ TenTap codegen fix committed via patch-package
- ✅ iOS simulator build successful via EAS Build
- ✅ App tested and working on iPhone 15 simulator
- ✅ Local builds will work once iOS 18.1 simulator runtime installed

**Files Modified:**
- `package.json` - Added `postinstall: "patch-package"` script
- `package-lock.json` - Added patch-package dependency
- `patches/@10play+tentap-editor+0.7.4.patch` - TenTap codegen fix
- `CLAUDE.md` - Updated documentation
- Commit: `f89f0e0` - "Add TenTap editor codegen fix via patch-package"

**Build Information:**
- EAS Build URL: https://expo.dev/accounts/anased/projects/wardnotes-mobile/builds/12c8ff9a-de77-4576-9818-8d7fa775bed8
- Build Profile: `preview` (iOS simulator)
- Build Time: ~10 minutes (cloud build)
- App Bundle: 30.8 MB

**Future Development:**
- Use `npx eas build --profile preview --platform ios` for simulator builds
- Local builds via `npm run ios` will work after downloading iOS 18.1 simulator runtime
- Patch-package ensures TenTap fix persists across all installs
- Web and Android development unaffected

**Files Referenced:**
- `IOS_BUILD_TROUBLESHOOTING.md` - Complete troubleshooting session documentation
- `patches/@10play+tentap-editor+0.7.4.patch` - TenTap fix implementation

### TestFlight Deployment (November 2024)
**Status:** ✅ **LIVE** - App successfully deployed to TestFlight and tested on physical iPhone

**What Changed:**
- Successfully configured and deployed production iOS build to TestFlight
- Resolved EAS Build Node.js version configuration issues
- Added required Apple privacy descriptions for App Store compliance
- First production build submitted and approved for TestFlight distribution

**Technical Details:**

**Challenge #1: EAS Build Node Version Not Applied**
- Initial builds used Node 18.18.0 despite `eas.json` configuration
- **Root Cause:** Running build command from wrong directory (web app instead of mobile app)
- **Solution:** Ensured command run from correct directory + added `engines` field to package.json
- Both `eas.json` and `package.json` now specify Node >=20.19.4

**Challenge #2: Apple Privacy Strings Missing**
- Manual Transporter upload failed with NSCameraUsageDescription error
- **Root Cause:** TenTap editor and other dependencies reference camera/photo APIs
- **Solution:** Added privacy descriptions to `app.config.js`:
  - `NSCameraUsageDescription` - Camera access for adding photos to notes
  - `NSPhotoLibraryUsageDescription` - Photo library access for images in notes
  - `NSPhotoLibraryAddUsageDescription` - Permission to save images
  - `ITSAppUsesNonExemptEncryption` - Declare no custom encryption

**Deployment Process:**
1. Fixed directory context issue (was in web app directory)
2. Added Node.js engine requirement to package.json
3. Added iOS privacy descriptions to app.config.js
4. Built production IPA via EAS Build
5. Initially attempted auto-submit (queued 40+ minutes)
6. Manually submitted via Apple Transporter after adding privacy strings
7. Successfully uploaded to App Store Connect
8. Build processed by Apple (~15-30 minutes)
9. TestFlight distribution enabled
10. Successfully tested on physical iPhone

**Current State:**
- ✅ Production build successfully deployed to TestFlight
- ✅ App tested and working on physical iPhone
- ✅ EAS Build properly configured with Node 20.19.4
- ✅ All required Apple privacy descriptions included
- ✅ Ready for additional tester distribution
- ✅ Ready for App Store submission when needed

**Files Modified:**
- `app.config.js` - Added iOS privacy descriptions (NSCamera*, NSPhotoLibrary*)
- `package.json` - Added `engines: { "node": ">=20.19.4" }` field
- `eas.json` - Already had Node version specified (commit 5acfee8)
- Commit: `71377e6` - "Add required iOS privacy descriptions to Info.plist"
- Commit: `6eb1968` - "Add Node.js engine requirement to package.json"

**Build Information:**
- **Bundle ID:** `com.anased.wardnotes`
- **Build Number:** 4
- **Profile:** production
- **Distribution:** TestFlight (internal testing)
- **Node Version:** 20.19.4
- **Xcode Version:** 15.4 (on EAS Build VM)
- **Build Time:** ~15-20 minutes (EAS cloud build)

**Lessons Learned:**
1. **Directory Context Matters:** Always verify you're in the mobile app directory when running EAS commands
2. **Multiple Node Config Methods:** Specify Node version in both `eas.json` AND `package.json` engines field
3. **Privacy Strings Required:** Even if app doesn't actively use camera/photos, dependencies may reference APIs requiring descriptions
4. **Manual Submission Option:** If EAS auto-submit queue is too long, Apple Transporter is a reliable alternative
5. **Free Tier Queues:** Build queue and submission queue are separate; submission queue can be unpredictably long on free tier

**Future Builds:**
```bash
# For TestFlight/App Store production builds
npx eas build --platform ios --profile production --auto-submit

# For simulator testing
npx eas build --profile preview --platform ios

# For local development (requires iOS 18.1 simulator)
npm run ios
```

**TestFlight Distribution:**
- Access TestFlight builds at: https://appstoreconnect.apple.com
- Add testers via App Store Connect → TestFlight tab
- Testers download via TestFlight app on their devices
- Internal testing group "Team (Expo)" already created

**Next Steps for App Store:**
- Continue testing on TestFlight
- Gather user feedback and iterate
- Add app screenshots and metadata
- Submit for App Store review when ready

### Flashcard Loading Fix & Note Detail UX Improvements (November 2025)
**Status:** ✅ **RESOLVED** - Infinite loading bug fixed and UI improvements implemented

**What Changed:**
- Fixed critical infinite loading bug in flashcard hooks
- Improved Note Detail screen UX by removing unnecessary visual clutter
- Enhanced content readability with cleaner layout
- Updated Xcode to 26.1.1 and resolved iOS 26.1 simulator compatibility

**Technical Details:**

**Issue #1: Infinite Loading in NoteFlashcards Component** (RESOLVED)
- **Root Cause:** Object dependencies in `useCallback` causing infinite re-render loops
- **Affected Hooks:** `useFlashcards`, `useDueFlashcards`, `useStudyCards`
- **Problem:** Passing `filters` object (`{ note_id: noteId }`) as dependency - new object created on every render
- **Solution:** Convert object to stable string dependency using `JSON.stringify(filters)` as `filtersKey`
- **Additional Cleanup:** Removed excessive console.log statements from `useDecksWithStats`

**Issue #2: Note Detail Screen UX Clutter** (RESOLVED)
- **Problem:** Content displayed in bordered white box with redundant "Content:" label
- **Impact:** Reduced readability, wasted vertical space, visual hierarchy conflict
- **Solution:** Implemented clean, minimal design following Option 1 approach:
  - Removed "Content:" label entirely
  - Removed bordered box styling from content area
  - Added subtle horizontal divider before flashcards section
  - Updated TipTapEditor read-only mode: transparent background, no border, adjusted padding

**Xcode 26.1.1 Compatibility:**
- Upgraded to macOS 26.1, Xcode 26.1.1, iOS 26.1
- **Known Issue:** CoreSVG asset catalog compilation bug with Stripe dependencies
- **Workaround:** Use EAS Build when local builds fail due to asset catalog errors
- Successfully tested app with iOS 26.1 simulator after installing runtime

**Files Modified:**
- `src/hooks/useFlashcards.ts` - Fixed infinite loop with stable dependencies (all 3 hooks)
- `src/hooks/useDecks.ts` - Removed debug logging from `useDecksWithStats`
- `src/screens/notes/NoteDetailScreen.tsx` - Removed "Content:" label, removed box styling, added divider
- `src/components/notes/NoteFlashcards.tsx` - Adjusted spacing
- `src/components/notes/TipTapEditor.tsx` - Updated read-only mode styling for clean display
- Commit: `00008c5` - "Add flashcards-from-note feature and fix infinite loading issue"

**Before & After:**
- **Before:** Content in bordered white box with "Content:" label, flashcards showed continuous loading
- **After:** Content flows naturally on page, proper loading state handling, clean visual separation

**Testing Results:**
- ✅ Flashcard loading completes successfully (no infinite loops)
- ✅ Empty state displays correctly ("No flashcards generated yet")
- ✅ Content displays without unnecessary borders
- ✅ Improved readability with cleaner layout
- ✅ Proper visual hierarchy maintained

**Impact:**
- Significantly improved UX for note viewing
- Resolved critical infinite loading bug affecting user experience
- Better content readability and visual flow
- Maintains consistency with modern mobile design patterns

**Development Notes:**
- Xcode 26.1.1 CoreSVG bug is Apple toolchain issue, not code issue
- EAS Build recommended for reliable builds until Apple resolves asset catalog bug
- Object dependencies in React hooks should always be stabilized with useMemo or string conversion

### Future Update Guidelines
When adding new features or making significant changes:

1. **Document in this section** with date and brief description
2. **Include technical details** that affect architecture or major components  
3. **List modified files** for easy reference
4. **Note any breaking changes** or migration requirements
5. **Update relevant sections above** if core architecture changes

This helps maintain continuity across different Claude Code sessions and provides context for debugging or further development.
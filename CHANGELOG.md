# WardNotes Mobile - Changelog

This file tracks the complete history of major feature additions, architectural changes, and important fixes for the WardNotes mobile app.

## Native Renderer & Editor Implementation (November 2025)
**Status:** ✅ **COMPLETE** - True iOS Notes-like native experience achieved

### What Changed
- Replaced WebView-based TipTap editor with 100% native React Native components
- Built custom TipTap JSON parser for native rendering
- Created native note editor with formatting toolbar
- Achieved true cross-platform architecture: native UI on mobile, TipTap on web, shared data format

### The Problem
- TipTap editor runs in WebView (essentially a mini browser)
- WebView has CSS styling conflicts and performance overhead
- Not truly native - feels "web-like" rather than "app-like"
- Typography customization requires fighting CSS specificity
- Professional note apps (Apple Notes, Evernote, Bear) use native components

### The Solution: Industry-Standard Architecture
```
DATABASE (Platform-Agnostic)
    ↓
[TipTap JSON Format]
    ↓
    ├─→ WEB: TipTap Editor → HTML rendering
    └─→ MOBILE: Custom Parser → Native React Native Text/View components
```

### Implementation Details

#### Phase 1: Native Viewing (Read-Only)

**1. TipTap Parser** (`src/utils/tiptapNativeParser.ts`)
- Parses TipTap JSON from database
- Converts to native-friendly block structure
- Handles: headings, paragraphs, lists, blockquotes, code blocks
- Extracts text formatting (bold, italic, underline, strike, code)
- Type-safe interfaces for all node types

**2. Native Note Renderer** (`src/components/notes/NativeNoteRenderer.tsx`)
- **100% native React Native components** (Text, View)
- **Zero WebView usage** - true iOS experience
- Mobile-optimized typography:
  - H1: 24px (down from 32-36px desktop)
  - H2: 20px (down from 28px)
  - H3: 18px (down from 24px)
  - Body: 16px with 1.5 line height
  - Tighter margins for mobile density
- Renders all TipTap node types as native components
- Supports text formatting with native TextStyle props
- Clean, maintainable styling using StyleSheet

**3. Updated NoteDetailScreen**
- Replaced `TipTapEditor` WebView with `NativeNoteRenderer`
- Removed 150+ lines of HTML conversion code (no longer needed)
- Cleaner, simpler implementation
- No CSS conflicts or WebView overhead

#### Phase 2: Native Editing

**4. Native-to-TipTap Converter** (`src/utils/nativeToTipTap.ts`)
- Converts plain text with markdown-style formatting to TipTap JSON
- Bidirectional conversion: TipTap JSON ↔ Plain Text
- Supports markdown shortcuts:
  - `# Text` → H1
  - `## Text` → H2
  - `### Text` → H3
  - `- Item` → Bullet list
  - `1. Item` → Ordered list
- Preserves formatting when converting back and forth
- Ensures web/mobile compatibility

**5. Formatting Toolbar** (`src/components/notes/FormattingToolbar.tsx`)
- iOS Notes-like formatting controls
- Buttons: H1, H2, H3, Bold, Italic, Bullet List, Ordered List
- Undo/Redo with visual state indicators
- Horizontal scroll for space efficiency
- Native iOS design aesthetic
- Keyboard-aware positioning

**6. Native Note Editor** (`src/components/notes/NativeNoteEditor.tsx`)
- **100% native TextInput** (no WebView!)
- Real-time conversion: Text → TipTap JSON
- Undo/Redo history management
- Cursor position tracking for formatting
- Formatting toolbar integration
- Keyboard avoidance for iOS
- Auto-capitalization and autocorrect
- Markdown shortcuts support
- Plain text editing with TipTap output

**7. Updated EditNoteScreen**
- Replaced `TipTapEditor` WebView with `NativeNoteEditor`
- Simplified save logic (no more WebView ref handling)
- Content changes managed through React state
- Removed complex HTML/TipTap conversion code

#### Phase 3: InputAccessoryView Keyboard Toolbar (November 2025)

**8. iOS-Native Keyboard Toolbar**
- Implemented `InputAccessoryView` for iOS-native keyboard attachment
- Toolbar appears/disappears automatically with keyboard
- Added `keyboardShouldPersistTaps="always"` to prevent keyboard dismissal
- Added `blurOnSubmit={false}` to maintain TextInput focus
- Professional iOS experience matching Apple Notes, WhatsApp, Messages

### Files Created
- `src/utils/tiptapNativeParser.ts` - TipTap JSON parser (220 lines)
- `src/utils/nativeToTipTap.ts` - Native to TipTap converter (250 lines)
- `src/components/notes/NativeNoteRenderer.tsx` - Native viewing component (280 lines)
- `src/components/notes/NativeNoteEditor.tsx` - Native editing component (230 lines)
- `src/components/notes/FormattingToolbar.tsx` - Formatting controls (120 lines)

### Files Modified
- `src/screens/notes/NoteDetailScreen.tsx` - Now uses NativeNoteRenderer (removed 150 lines of HTML conversion)
- `src/screens/notes/EditNoteScreen.tsx` - Now uses NativeNoteEditor (simplified save logic)
- Branch: `feature/mobile-native-typography`

### Technical Architecture

**Data Flow - Viewing:**
```
1. Load note from database (TipTap JSON)
2. Parse with tiptapNativeParser
3. Convert to NativeBlock[] structure
4. Render as React Native <Text> and <View> components
5. Apply mobile-optimized styles
```

**Data Flow - Editing:**
```
1. Load note from database (TipTap JSON)
2. Convert to plain text with markdown (tipTapToPlainText)
3. Edit in native TextInput
4. User applies formatting via toolbar
5. Real-time conversion to TipTap JSON (simpleTextToTipTap)
6. Save TipTap JSON to database
```

### How It Matches Industry Standards

**Apple Notes:**
- iOS: Native UITextView, macOS: Native NSTextView, Web: HTML
- Storage: NSAttributedString archive
- WardNotes equivalent: Native TextInput → TipTap JSON

**Evernote:**
- Mobile: Native text views, Web: Web editor
- Storage: ENML (XML format)
- WardNotes equivalent: Native components → TipTap JSON

**Bear:**
- iOS: Native UITextView, Web: HTML
- Storage: Markdown
- WardNotes equivalent: Native TextInput with markdown shortcuts → TipTap JSON

### Cross-Platform Compatibility
- ✅ Same TipTap JSON storage format
- ✅ Web app uses TipTap editor (unchanged)
- ✅ Mobile app uses native components
- ✅ Content syncs perfectly between platforms
- ✅ No data migration required

### Benefits Achieved

**Performance:**
- ✅ No WebView overhead
- ✅ Native scrolling performance
- ✅ Instant rendering (no WebView load time)
- ✅ Lower memory usage

**User Experience:**
- ✅ True iOS Notes feel
- ✅ Native text selection
- ✅ Native keyboard experience
- ✅ Platform-specific fonts and rendering
- ✅ Mobile-optimized typography (24px H1 vs 36px desktop)
- ✅ Keyboard-attached formatting toolbar (iOS-native)

**Developer Experience:**
- ✅ No CSS fighting
- ✅ Easy to customize styles (StyleSheet)
- ✅ Simpler codebase (no HTML conversion)
- ✅ Type-safe (TypeScript throughout)
- ✅ Easier to debug (no WebView black box)

**Maintainability:**
- ✅ Clear separation of concerns
- ✅ Reusable parser utilities
- ✅ Platform-specific rendering
- ✅ Future-proof architecture

### Testing Results
- ✅ Viewing: Native rendering works perfectly, mobile-optimized typography
- ✅ Editing: Native TextInput with formatting toolbar functional
- ✅ Saving: TipTap JSON saved correctly to database
- ✅ Cross-platform: Content displays correctly on web after mobile edit
- ✅ Markdown shortcuts work (# for headings, - for lists)
- ✅ Undo/Redo functional with proper state management
- ✅ Keyboard toolbar stays attached during editing
- ✅ Formatting buttons apply changes correctly

### Supported Features

**Viewing (NativeNoteRenderer):**
- ✅ Headings (H1-H6)
- ✅ Paragraphs
- ✅ Bullet lists
- ✅ Ordered lists
- ✅ Blockquotes
- ✅ Code blocks
- ✅ Text formatting (bold, italic, underline, strike, inline code)
- ✅ Nested content

**Editing (NativeNoteEditor):**
- ✅ Headings (H1-H3 via toolbar or markdown)
- ✅ Paragraphs
- ✅ Bullet lists (via toolbar or markdown)
- ✅ Ordered lists (via toolbar)
- ✅ Plain text editing
- ✅ Undo/Redo
- ✅ Markdown shortcuts
- ✅ Auto-save on content change
- ✅ InputAccessoryView keyboard toolbar (iOS)

### Future Enhancements
- [ ] Bold/Italic selection-based formatting
- [ ] Image support
- [ ] Link support
- [ ] Nested lists
- [ ] Search within note
- [ ] Advanced markdown syntax
- [ ] WYSIWYG visual formatting (hide markdown syntax)

### Migration Notes
- No database migration required (TipTap JSON format unchanged)
- Existing notes render perfectly with new native renderer
- Web app continues to work unchanged
- Backwards compatible with all existing content

### Impact
- **Massive UX improvement** - True native mobile experience
- **Better performance** - No WebView overhead
- **Easier maintenance** - Simpler, more maintainable code
- **Industry standard** - Matches how professional apps work
- **Cross-platform done right** - Native UI, shared data

### Key Learnings
1. WebView is not suitable for core mobile UX (notes, messages, etc.)
2. TipTap JSON is an excellent cross-platform data format
3. Platform-specific rendering is the industry standard approach
4. Native components always feel better than web views on mobile
5. Markdown shortcuts provide good UX for mobile formatting
6. InputAccessoryView is essential for iOS-native keyboard toolbar UX

---

## Flashcard Loading Fix & Note Detail UX Improvements (November 2025)
**Status:** ✅ **RESOLVED** - Infinite loading bug fixed and UI improvements implemented

### What Changed
- Fixed critical infinite loading bug in flashcard hooks
- Improved Note Detail screen UX by removing unnecessary visual clutter
- Enhanced content readability with cleaner layout
- Updated Xcode to 26.1.1 and resolved iOS 26.1 simulator compatibility

### Technical Details

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

### Files Modified
- `src/hooks/useFlashcards.ts` - Fixed infinite loop with stable dependencies (all 3 hooks)
- `src/hooks/useDecks.ts` - Removed debug logging from `useDecksWithStats`
- `src/screens/notes/NoteDetailScreen.tsx` - Removed "Content:" label, removed box styling, added divider
- `src/components/notes/NoteFlashcards.tsx` - Adjusted spacing
- `src/components/notes/TipTapEditor.tsx` - Updated read-only mode styling for clean display
- Commit: `00008c5` - "Add flashcards-from-note feature and fix infinite loading issue"

### Testing Results
- ✅ Flashcard loading completes successfully (no infinite loops)
- ✅ Empty state displays correctly ("No flashcards generated yet")
- ✅ Content displays without unnecessary borders
- ✅ Improved readability with cleaner layout
- ✅ Proper visual hierarchy maintained

### Impact
- Significantly improved UX for note viewing
- Resolved critical infinite loading bug affecting user experience
- Better content readability and visual flow
- Maintains consistency with modern mobile design patterns

### Development Notes
- Xcode 26.1.1 CoreSVG bug is Apple toolchain issue, not code issue
- EAS Build recommended for reliable builds until Apple resolves asset catalog bug
- Object dependencies in React hooks should always be stabilized with useMemo or string conversion

---

## TestFlight Deployment (November 2024)
**Status:** ✅ **LIVE** - App successfully deployed to TestFlight and tested on physical iPhone

### What Changed
- Successfully configured and deployed production iOS build to TestFlight
- Resolved EAS Build Node.js version configuration issues
- Added required Apple privacy descriptions for App Store compliance
- First production build submitted and approved for TestFlight distribution

### Technical Details

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

### Deployment Process
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

### Current State
- ✅ Production build successfully deployed to TestFlight
- ✅ App tested and working on physical iPhone
- ✅ EAS Build properly configured with Node 20.19.4
- ✅ All required Apple privacy descriptions included
- ✅ Ready for additional tester distribution
- ✅ Ready for App Store submission when needed

### Files Modified
- `app.config.js` - Added iOS privacy descriptions (NSCamera*, NSPhotoLibrary*)
- `package.json` - Added `engines: { "node": ">=20.19.4" }` field
- `eas.json` - Already had Node version specified (commit 5acfee8)
- Commit: `71377e6` - "Add required iOS privacy descriptions to Info.plist"
- Commit: `6eb1968` - "Add Node.js engine requirement to package.json"

### Build Information
- **Bundle ID:** `com.anased.wardnotes`
- **Build Number:** 4
- **Profile:** production
- **Distribution:** TestFlight (internal testing)
- **Node Version:** 20.19.4
- **Xcode Version:** 15.4 (on EAS Build VM)
- **Build Time:** ~15-20 minutes (EAS cloud build)

### Lessons Learned
1. **Directory Context Matters:** Always verify you're in the mobile app directory when running EAS commands
2. **Multiple Node Config Methods:** Specify Node version in both `eas.json` AND `package.json` engines field
3. **Privacy Strings Required:** Even if app doesn't actively use camera/photos, dependencies may reference APIs requiring descriptions
4. **Manual Submission Option:** If EAS auto-submit queue is too long, Apple Transporter is a reliable alternative
5. **Free Tier Queues:** Build queue and submission queue are separate; submission queue can be unpredictably long on free tier

### Future Builds
```bash
# For TestFlight/App Store production builds
npx eas build --platform ios --profile production --auto-submit

# For simulator testing
npx eas build --profile preview --platform ios

# For local development (requires iOS 18.1 simulator)
npm run ios
```

### TestFlight Distribution
- Access TestFlight builds at: https://appstoreconnect.apple.com
- Add testers via App Store Connect → TestFlight tab
- Testers download via TestFlight app on their devices
- Internal testing group "Team (Expo)" already created

### Next Steps for App Store
- Continue testing on TestFlight
- Gather user feedback and iterate
- Add app screenshots and metadata
- Submit for App Store review when ready

---

## iOS Build Compatibility Issues (November 2024)
**Status:** ✅ **RESOLVED** - iOS builds now working via EAS Build with patch-package fix

### What Changed
- Identified iOS build incompatibilities while attempting to run `npm run ios`
- Two critical blocking issues discovered and resolved
- Upgraded macOS to 26.1 and Xcode to 16.1.1
- Implemented permanent TenTap codegen fix using patch-package
- Successfully built and deployed app using EAS Build

### Technical Details

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

### Resolution Approach
- Upgraded system: macOS 14.4.1 → 26.1, Xcode 15.4 → 16.1.1
- Applied TenTap codegen fix via patch-package
- Used EAS Build with Xcode 16 in cloud (avoided iOS 18.1 simulator download)
- Successfully built and installed on iPhone 15 iOS 17.5 simulator

### Current State
- ✅ macOS 26.1 (Sequoia 15.1) with Xcode 16.1.1
- ✅ TenTap codegen fix committed via patch-package
- ✅ iOS simulator build successful via EAS Build
- ✅ App tested and working on iPhone 15 simulator
- ✅ Local builds will work once iOS 18.1 simulator runtime installed

### Files Modified
- `package.json` - Added `postinstall: "patch-package"` script
- `package-lock.json` - Added patch-package dependency
- `patches/@10play+tentap-editor+0.7.4.patch` - TenTap codegen fix
- `CLAUDE.md` - Updated documentation
- Commit: `f89f0e0` - "Add TenTap editor codegen fix via patch-package"

### Build Information
- EAS Build URL: https://expo.dev/accounts/anased/projects/wardnotes-mobile/builds/12c8ff9a-de77-4576-9818-8d7fa775bed8
- Build Profile: `preview` (iOS simulator)
- Build Time: ~10 minutes (cloud build)
- App Bundle: 30.8 MB

### Future Development
- Use `npx eas build --profile preview --platform ios` for simulator builds
- Local builds via `npm run ios` will work after downloading iOS 18.1 simulator runtime
- Patch-package ensures TenTap fix persists across all installs
- Web and Android development unaffected

### Files Referenced
- `IOS_BUILD_TROUBLESHOOTING.md` - Complete troubleshooting session documentation
- `patches/@10play+tentap-editor+0.7.4.patch` - TenTap fix implementation

---

## Flashcard System Implementation (August 2024)
**Status:** ✅ **COMPLETE** - Full mobile flashcard system with spaced repetition

### What Changed
- Complete mobile flashcard system implementation with spaced repetition (SM-2 algorithm)
- Cross-platform compatibility with existing web app flashcard data
- Full study workflow with mobile-optimized UI components

### Technical Details

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

### Files Added/Modified
- `src/types/flashcard.ts` - Complete mobile flashcard type definitions
- `src/services/supabase/rest-client.ts` - Extended with flashcard query methods and authentication fixes
- `src/services/flashcardService.ts` - Complete flashcard service with SM-2 algorithm
- `src/hooks/useDecks.ts`, `src/hooks/useFlashcards.ts`, `src/hooks/useStudySession.ts` - Custom React hooks
- `src/screens/flashcards/` - All flashcard screen components
- `src/components/flashcards/FlashcardView.tsx` - Core flashcard display component
- `src/types/navigation.ts` - Extended navigation types
- `src/screens/main/MainTabs.tsx` - Added flashcard tab

### Bug Fixes During Implementation
1. **UI Layout Issue**: Content overlapping status bar - fixed with SafeAreaView and StatusBar components
2. **Authentication Issue**: Static headers not updating after login - resolved with dynamic token fetching in REST client
3. **Query Chaining Issue**: REST client methods not returning 'this' - fixed by restructuring query builder pattern to support method chaining for insert/update/delete operations

### Testing Results
- Successfully tested flashcard creation, study sessions, and review submissions
- Confirmed cross-platform data compatibility between mobile and web versions
- Verified spaced repetition algorithm functioning correctly with proper interval calculations

### Development Workflow
- Developed on feature branch `feature/mobile-flashcards`
- Systematic testing and bug resolution through iOS Simulator
- Successfully merged to main branch after complete testing

### Impact
- Mobile app now has full feature parity with web app for flashcard functionality
- Users can seamlessly study flashcards across mobile and web platforms
- Implements proven spaced repetition algorithm for effective learning
- Maintains consistent data model and user experience across platforms

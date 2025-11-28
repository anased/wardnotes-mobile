# WardNotes Mobile - Changelog

This file tracks the complete history of major feature additions, architectural changes, and important fixes for the WardNotes mobile app.

## AI Flashcard Generation Feature (November 2025)
**Status:** ✅ **COMPLETE** - Full AI flashcard generation with native iOS UX

### What Changed
- Implemented complete AI flashcard generation feature for mobile app
- Integrated with existing web app API endpoints (no code duplication)
- Added preview, edit, and save workflow with native iOS patterns
- Fixed iOS Picker component UX issues with custom modal selectors
- Full feature parity with web app

### Feature Capabilities

**1. Configuration Screen**
- Card Type selector: Cloze Deletion or Front & Back
- Deck selector: Choose from existing decks or create new
- Max Cards control: Range 1-50, default 10 (+5/-5 buttons)
- Real-time deck loading with loading states
- Warning messages for no decks available

**2. Generation Flow**
- Calls web API: `POST /api/flashcards/generate-from-note`
- Uses GPT-4o with same prompts as web app
- Loading state with informative messages
- Error handling for network, OpenAI, and auth failures
- No fallback system (shows proper errors instead)

**3. Preview & Edit Screen**
- All cards selected by default (checkboxes)
- Tap any card to open edit modal
- Select/deselect individual cards
- "Regenerate" button to generate new set
- "Save Selected" button (only saves checked cards)
- Shows card count and selection stats

**4. Card Editing**
- Cloze cards: Edit with {{c1::text}} format helper
- Front/Back cards: Separate inputs for question and answer
- Content validation (non-empty required)
- Visual "Edited" badge on modified cards
- Cancel/Save buttons with validation

**5. Deck Creation**
- Inline modal with color picker (8 preset colors)
- Name, description, and color selection
- Validation and error handling
- Auto-reloads deck list after creation

### Technical Architecture

**API Integration:**
```typescript
// Calls existing web API
const API_URL = 'https://wardnotes.vercel.app';
POST /api/flashcards/generate-from-note
  Headers: { Authorization: Bearer <token> }
  Body: { note_id, card_type, deck_id, max_cards, preview: true }
  Response: { cards: [...], preview: true }
```

**Security:**
- OpenAI API key stays on server (web app)
- Never exposed in mobile app binary
- Bearer token authentication from Supabase session

**Error Handling:**
```typescript
type GenerationError = {
  message: string;
  type: 'network' | 'api' | 'openai' | 'unknown';
  retryable: boolean;
}
```

**State Management:**
```typescript
type GenerationStatus =
  | 'idle'        // Configuration screen
  | 'loading'     // Generating cards
  | 'preview'     // Preview/edit screen
  | 'saving'      // Saving to database
  | 'success'     // Completed
  | 'error';      // Error occurred
```

### iOS-Specific UX Fixes

**Problem:** iOS Picker Component Rendering
- On iOS, `<Picker>` renders inline as a scroll wheel below the field
- Tapping the label/field does nothing
- Poor UX compared to native iOS selectors

**Solution:** Custom Modal Pickers
- Replaced inline Picker with touchable selector buttons
- Tap button → Bottom sheet modal slides up → Picker wheel → Done/Cancel
- Native iOS design pattern (like Safari date picker)

**Implementation:**
```typescript
// Before (Poor UX)
<Picker selectedValue={cardType} onValueChange={...}>
  <Picker.Item label="Cloze" value="cloze" />
</Picker>

// After (Native iOS UX)
<TouchableOpacity onPress={() => setShowPicker(true)}>
  <Text>Cloze Deletion</Text>
  <Icon name="chevron-down" />
</TouchableOpacity>

<Modal visible={showPicker}>
  <Picker selectedValue={cardType} onValueChange={...} />
  <Button onPress={close}>Done</Button>
</Modal>
```

**Additional Fix: Render Cycle Prevention**
```typescript
// iOS Picker fires onValueChange on mount, causing render errors
onValueChange={(value) => {
  // Only update if value actually changed
  if (value !== currentValue) {
    setCurrentValue(value);
  }
}}
```

### Files Created

**1. Type Definitions (`src/types/flashcardGeneration.ts`)**
- `GenerateFlashcardsRequest` - API request structure
- `GeneratedCard` - Card format from API
- `PreviewCard` - Card with selection/edit state
- `GenerationStatus` - State machine types
- `GenerationError` - Structured error types

**2. API Service (`src/services/flashcardGeneration.ts`)**
- `generateFlashcardsPreview()` - Generate without saving
- `saveFlashcards()` - Save selected cards to deck
- `generateAndSaveFlashcards()` - Direct mode (unused in MVP)
- Error handling with structured error types
- Bearer token authentication

**3. DeckCreationModal (`src/components/flashcards/DeckCreationModal.tsx`)**
- Name, description, color inputs
- 8 preset colors with visual picker
- Validation and error handling
- Calls FlashcardService.createDeck()
- Returns new deck ID to parent

**4. FlashcardEditModal (`src/components/flashcards/FlashcardEditModal.tsx`)**
- Edit cloze or front/back content
- Type-specific UI (cloze vs front/back)
- Validation ensures non-empty content
- Visual hints for format ({{c1::text}})
- Marks card as edited

**5. FlashcardPreviewScreen (`src/components/flashcards/FlashcardPreviewScreen.tsx`)**
- List of cards with checkboxes
- Tap card to edit
- "Select All" / "Deselect All" toggle
- Shows selected count in button
- Regenerate and Save buttons
- Info banner with instructions

**6. FlashcardGeneratorModal (`src/components/flashcards/FlashcardGeneratorModal.tsx`)**
- Main orchestrator component
- Configuration screen with selectors
- Loading screen during generation
- Error screen with retry
- Preview screen integration
- Custom modal pickers for iOS
- State machine management

### Files Modified

**NoteDetailScreen (`src/screens/notes/NoteDetailScreen.tsx`)**
- Added flashcard generator state
- Integrated FlashcardGeneratorModal
- Connected to existing ⚡ button (was placeholder)
- Reloads note after successful generation

### User Flow

```
1. User opens note detail screen
2. Taps ⚡ icon → FlashcardGeneratorModal opens
3. Configuration:
   - Taps "Card Type" → Modal picker → Select → Done
   - Taps "Target Deck" → Modal picker → Select deck or "Create New"
   - If no decks: Taps "Create New Deck" button
   - Adjusts card count with +5/-5 buttons
4. Taps "Generate Flashcards" button
5. Loading screen: "Generating flashcards..."
6. Preview screen appears:
   - All cards checked by default
   - User taps card → Edit modal → Make changes → Save
   - User unchecks unwanted cards
   - User taps "Save Selected (N)"
7. Saving: Brief loading state
8. Success: Alert dialog confirms N cards saved
9. Modal closes, note flashcards section refreshes
```

### Dependencies

**Required:**
- `@react-native-picker/picker` - Already installed (v2.11.1)
- `@expo/vector-icons` - Already available

**No New Dependencies Added**

### Testing Checklist

✅ Generate cloze deletion cards
✅ Generate front & back cards
✅ Edit card content before saving
✅ Select/deselect individual cards
✅ Create new deck inline
✅ Handle network errors gracefully
✅ Handle OpenAI API failures (no fallback)
✅ iOS modal pickers work correctly
✅ Cross-platform compatibility (iOS primary, Android compatible)

### Impact

- **Feature Parity:** Mobile app now has same AI generation as web app
- **Consistency:** Uses same OpenAI prompts, ensures consistent card quality
- **Security:** API key never exposed in mobile binary
- **UX:** Native iOS patterns, feels like built-in functionality
- **Performance:** Fast API calls, efficient state management
- **Maintainability:** No code duplication, reuses web infrastructure

---

## Mobile-Optimized Typography (November 2025)
**Status:** ✅ **COMPLETE** - Native iOS-like typography for editor

### What Changed
- Added mobile-optimized typography CSS to TipTapEditor component
- Refactored EditNoteScreen to use TipTapEditor component (eliminated code duplication)
- Fixed keyboard scrolling issues in CreateNoteScreen
- Improved CSS injection timing to minimize flash of unstyled content

### Typography Specifications
**Font:** iOS system font (`-apple-system, BlinkMacSystemFont, "Segoe UI"...`)
**Sizes:**
- H1: 24px, bold (700)
- H2: 20px, bold (700)
- H3: 18px, bold (700)
- H4: 17px, semibold (600)
- H5-H6: 16px, semibold (600)
- Paragraph/List: 16px, normal (400)
- Code: 14px, monospace

**Color:** #1f2937 (native text gray)
**Line Heights:** 1.4 for headings, 1.5 for body text

### Issues Fixed

**1. Typography Mismatch Between Screens**
- **Problem:** Editor showed serif/default WebView font instead of iOS system font
- **Root Cause:** TipTap WebView uses default browser typography without custom CSS
- **Solution:** Inject comprehensive typography CSS matching native iOS appearance
```typescript
const MOBILE_TYPOGRAPHY_CSS = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", ...;
    color: #1f2937 !important;
  }
  h1 { font-size: 24px !important; font-weight: 700 !important; }
  // ... etc
`;
editor.injectCSS(MOBILE_TYPOGRAPHY_CSS, 'mobile-typography');
```

**2. Code Duplication in EditNoteScreen**
- **Problem:** EditNoteScreen used `useEditorBridge` directly, duplicating CSS and logic
- **Root Cause:** Inconsistent implementation between CreateNoteScreen and EditNoteScreen
- **Solution:** Refactored EditNoteScreen to use TipTapEditor component
- **Impact:**
  - Removed 152 lines of duplicated CSS
  - Removed duplicate CSS injection logic
  - Consistent typography across all screens
  - Single source of truth for editor configuration

**3. Keyboard Scrolling in CreateNoteScreen**
- **Problem:** Pressing Enter caused entire screen to scroll to bottom
- **Root Cause:** Conflict between outer ScrollView and editor's WebView scrolling
- **Solution:**
  - Changed `avoidIosKeyboard: false` in editor config
  - Removed `keyboardDismissMode="on-drag"` from ScrollView
  - Added `nestedScrollEnabled={true}` for proper nested scroll handling

**4. Keyboard Dismissing on Scroll**
- **Problem:** Scrolling dismissed the keyboard unexpectedly
- **Root Cause:** `keyboardDismissMode="on-drag"` on parent ScrollView
- **Solution:** Removed the prop, allowing keyboard to persist while scrolling

### Files Modified
- `src/components/notes/TipTapEditor.tsx` - Added mobile typography CSS
- `src/screens/notes/EditNoteScreen.tsx` - Refactored to use TipTapEditor component
- `src/screens/notes/CreateNoteScreen.tsx` - Fixed keyboard/scroll interaction

### Technical Details
**Before (Duplication):**
```
CreateNoteScreen → TipTapEditor (wrapper) → useEditorBridge + CSS
EditNoteScreen   → useEditorBridge directly + duplicated CSS
```

**After (Consolidated):**
```
CreateNoteScreen → TipTapEditor → useEditorBridge + CSS
EditNoteScreen   → TipTapEditor → useEditorBridge + CSS
```

**CSS Injection Flow:**
1. Editor bridge created with `initialContent`
2. When editor ready, CSS injected immediately
3. Content renders with typography already applied
4. Minimal/no flash of unstyled content

---

## 10tap-editor Integration (November 2025)
**Status:** ✅ **COMPLETE** - Full TipTap WYSIWYG editor for React Native

### What We've Accomplished
✅ Integrated 10tap-editor (@10play/tentap-editor v0.7.4)
✅ Replaced custom native markdown editor with WYSIWYG editor
✅ Updated EditNoteScreen to use TipTapEditor component
✅ Fixed content loading issue (HTML conversion for initialContent)
✅ Fixed inconsistent content loading in EditNoteScreen (race condition eliminated)
✅ Fixed keyboard scrolling with KeyboardAvoidingView
✅ Replaced custom toolbar with 10tap-editor's built-in Toolbar
✅ Added keyboard height tracking for iOS
✅ Configured iOS native dependencies with CocoaPods
✅ Added mobile-optimized typography matching native iOS appearance

### Known Limitations
⚠️ **Toolbar Positioning:** 10tap-editor toolbar appears at bottom of editor content instead of attached to keyboard (known issue #272). This is a library limitation; workaround would require significant custom implementation.

### Issues Fixed

**1. Empty Editor on Load**
- **Problem:** Editor showed empty when editing existing notes
- **Root Cause:** Race condition - editor mounted before content loaded from database
- **Solution:** Conditional rendering - only render TipTapEditor when content exists
```typescript
{content ? (
  <TipTapEditor initialContent={content} ... />
) : (
  <ActivityIndicator /> // Show loading
)}
```

**2. HTML Tags Appearing in Editor**
- **Problem:** Raw HTML tags like `<ul><li><p>` visible in editor text
- **Root Cause:** Converting TipTap JSON → HTML → TipTap JSON caused data corruption
- **Solution:** Use `getJSON()` instead of `getHTML()` throughout
```typescript
// Before: HTML conversion (caused corruption)
const html = await editor.getHTML();
const tipTap = convertHtmlToTipTap(html);

// After: Direct JSON (no conversion)
const tipTap = await editor.getJSON();
```

**3. Content Not Appearing in Editor (Bug #282)**
- **Problem:** `initialContent` with TipTap JSON from database didn't render
- **Root Cause:** Known 10tap-editor bug - JSON from database doesn't initialize correctly
- **Solution:** Convert TipTap JSON → HTML for `initialContent`
```typescript
const initialHtml = React.useMemo(() => {
  return convertTipTapToHtml(initialContent);
}, [initialContent]);

const editor = useEditorBridge({
  initialContent: initialHtml, // HTML string, not JSON
});
```

**4. Keyboard Covering Content**
- **Problem:** Couldn't scroll to see content when keyboard appeared
- **Solution:** Added KeyboardAvoidingView to EditNoteScreen with proper configuration

**5. Inconsistent Content Loading in EditNoteScreen (November 2025)**
- **Problem:** Some notes loaded content correctly, others showed "Write something" placeholder
- **Root Cause:** Race condition - editor created with empty `initialContent`, then content loaded dynamically via `setContent()` after note fetch
- **Symptoms:**
  - Worked for some notes (fast database response)
  - Failed for others (slower database response)
  - Unreliable due to arbitrary 1000ms timeout and async timing issues
- **Solution:** Refactored to follow React declarative pattern and 10tap-editor best practices
  - Use `useMemo` to convert TipTap JSON → HTML when content loads
  - Pass converted HTML as `initialContent` to `useEditorBridge`
  - Removed dynamic `setContent()` calls and verification logic
  - Eliminated 80 lines of unreliable async code
```typescript
// Before (race condition):
const editor = useEditorBridge({ initialContent: '' }); // Empty!
useEffect(() => {
  await setTimeout(1000); // Arbitrary delay
  await editor.setContent(html); // May fail
}, [content]);

// After (reliable):
const initialHtml = React.useMemo(() =>
  convertTipTapToHtml(content), [content]
);
const editor = useEditorBridge({ initialContent: initialHtml });
```
- **Impact:** 100% reliable content loading, simpler codebase, follows official 10tap-editor pattern
- **Files Modified:** `src/screens/notes/EditNoteScreen.tsx`

### Current Issue: Toolbar Positioning

**Problem:** Toolbar appears at bottom of editor content, not attached to keyboard top

**Solutions Attempted:**

1. **KeyboardAvoidingView in TipTapEditor** - Toolbar still at bottom of editor
2. **Toolbar with InputAccessoryView** - Not supported by 10tap-editor
3. **Absolute positioning with keyboard height tracking** - Positioned at top instead of bottom
4. **Separated wrapper structure** - Current attempt (toolbar at `bottom: 0`)

**Current Code Structure:**
```typescript
<View style={styles.editorWrapper}>
  <KeyboardAvoidingView>
    <RichText editor={editor} />
  </KeyboardAvoidingView>
  {showToolbar && keyboardHeight > 0 && (
    <View style={{ position: 'absolute', bottom: 0 }}>
      <Toolbar editor={editor} />
    </View>
  )}
</View>
```

**Next Steps to Try:**
- Use SafeAreaView with keyboard tracking
- Try `react-native-keyboard-aware-scroll-view`
- Implement custom InputAccessoryView wrapper
- Check 10tap-editor custom keyboard example implementation

### Architecture

**Data Flow:**
```
DATABASE (TipTap JSON)
    ↓
EDITING:
  TipTap JSON → HTML → useEditorBridge(initialContent: HTML)
  User edits → getJSON() → TipTap JSON → Save to DB
    ↓
VIEWING:
  TipTap JSON → Parser → Native React Native components
```

**Why This Hybrid Approach:**
- **Input (initialContent):** HTML string (workaround for bug #282)
- **Output (getJSON):** TipTap JSON (no conversion, no corruption)
- **Viewing:** Native components (better performance)

### Files Modified

**Components:**
- `src/components/notes/TipTapEditor.tsx` - Main editor component using 10tap-editor
  - Uses `RichText` and `Toolbar` from @10play/tentap-editor
  - HTML → TipTap conversion for initialContent
  - JSON output via `getJSON()`
  - Keyboard height tracking for iOS
  - Mobile typography CSS injection

**Screens:**
- `src/screens/notes/EditNoteScreen.tsx`
  - Conditional rendering (wait for content before showing editor)
  - KeyboardAvoidingView for keyboard scrolling
  - Uses TipTapEditor with ref for force updates

**Dependencies:**
- `@10play/tentap-editor: ^0.7.4` (already installed)
- `react-native-webview: 13.13.5` (required by 10tap-editor)

**iOS Configuration:**
- CocoaPods: `tentap` pod linked successfully
- Native codegen: `RNTenTapViewSpec` generated

---

## Native Renderer & Editor Implementation (November 2025 - ARCHIVED)
**Status:** ⚠️ **REPLACED** - Superseded by 10tap-editor integration

This approach was replaced because:
- Markdown editing less intuitive than WYSIWYG
- Custom toolbar complexity
- 10tap-editor provides better mobile experience

#### Phase 2: Native Editing (ARCHIVED)

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

---

## WYSIWYG Editor Exploration (November 2025)
**Status:** ⚠️ **RESEARCH** - Explored block-based WYSIWYG, discovered architectural limitations

### Objective
Enhance the note editor to provide true WYSIWYG (What You See Is What You Get) experience where:
- Users see formatted text while editing (no markdown markers visible)
- Headings appear large (24px) during editing, not just when viewing
- Bold/italic text is visually styled in real-time
- Low-friction editing with effortless formatting

### Approaches Explored

#### Approach 1: Block-Based WYSIWYG Editor
**Architecture:**
- Each paragraph/heading/list item = separate TextInput component
- Multiple TextInputs sharing same InputAccessoryView ID
- Visual styling applied to each TextInput based on block type
- TipTap JSON ↔ Block structure conversion

**Files Created:**
- `src/types/editor.ts` - Block-based data model with rich text spans
- `src/utils/blockConverter.ts` - TipTap JSON ↔ Editor Blocks converter (280 lines)
- `src/components/notes/RichTextInput.tsx` - Single block editor with WYSIWYG styling
- `src/components/notes/WYSIWYGNoteEditor.tsx` - Main multi-block editor component

**Implementation Details:**
```typescript
// Data structure
interface EditorBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'bulletList' | 'orderedList' | 'blockquote' | 'codeBlock';
  level?: number; // For headings (1-6)
  spans: TextSpan[];
}

interface TextSpan {
  text: string;
  marks?: { bold?: boolean; italic?: boolean; code?: boolean };
}
```

**Features Implemented:**
- Block-level WYSIWYG (headings rendered at correct size while editing)
- Smart block navigation (Enter creates new block, Backspace deletes empty blocks)
- Block type switching via toolbar
- TipTap JSON compatibility maintained
- Enhanced FormattingToolbar with block type selector and active state indicators

#### Approach 2: Screen-Level InputAccessoryView
**Attempted Fix:**
- Moved InputAccessoryView to EditNoteScreen (SafeAreaView level)
- Used forwardRef pattern to expose editor methods
- State callbacks to update toolbar in real-time
- Attempted to avoid React Native nesting limitations

### The Problem Discovered

**InputAccessoryView Architectural Limitation:**
```
❌ DOESN'T WORK:
Multiple TextInput components → Same InputAccessoryView ID
(iOS doesn't support this pattern)

✅ WORKS:
Single TextInput → Single InputAccessoryView
(1:1 relationship)
```

**Why It Failed:**
1. Block-based editor requires multiple TextInput components (one per block)
2. InputAccessoryView expects a 1:1 relationship with a single TextInput
3. When multiple TextInputs share the same `inputAccessoryViewID`, iOS doesn't know which one to attach the toolbar to
4. Result: Toolbar never appears above keyboard despite correct implementation

**Debugging Evidence:**
- ✅ TextInputs rendering correctly with proper `inputAccessoryViewID`
- ✅ InputAccessoryView rendering at component level
- ✅ IDs matching exactly (`wardnotes-wysiwyg-toolbar`)
- ✅ Blocks getting focused correctly
- ❌ Toolbar never appeared above keyboard
- ✅ Reverted to NativeNoteEditor (single TextInput) → toolbar immediately worked

### Files Cleaned Up
The following experimental files were created but not integrated into production:
- `src/types/editor.ts` - Can be repurposed for future WYSIWYG attempts
- `src/utils/blockConverter.ts` - Solid TipTap conversion logic, reusable
- `src/components/notes/RichTextInput.tsx` - Component architecture was sound
- `src/components/notes/WYSIWYGNoteEditor.tsx` - Good patterns for block management

### Key Learnings

**React Native Constraints:**
1. **InputAccessoryView limitation**: Only works with single TextInput per ID
2. **Multi-TextInput WYSIWYG is not viable** on React Native without custom native modules
3. **Current markdown editor is optimal** for React Native's capabilities

**What Works:**
- ✅ Single TextInput with markdown syntax (current NativeNoteEditor)
- ✅ InputAccessoryView keyboard toolbar (proven working)
- ✅ TipTap JSON storage/sync (web compatibility maintained)
- ✅ Native rendering for viewing (NativeNoteRenderer)

**Industry Comparison:**
- **Notion Mobile**: Uses WebView for editing (not truly native)
- **Apple Notes**: Native UITextView with NSAttributedString (single text view)
- **Evernote**: Native editors but proprietary storage format
- **Bear**: Markdown-based like our current approach

### Recommended Path Forward

**Option A: Enhanced Markdown Editor** ⭐ (Recommended)
- Keep single TextInput architecture (proven to work)
- Add smart auto-formatting features:
  - Auto-continue lists (press Enter in list → new bullet appears)
  - Smart list exit (double Enter or backspace on empty item)
  - Auto-heading shortcuts (type `## ` → heading mode)
- Add preview toggle button (view formatted output)
- Enhance toolbar with more formatting options
- **Benefit**: Works within React Native constraints, professional UX

**Option B: WebView WYSIWYG**
- Use TipTap editor in WebView (like web app)
- Full WYSIWYG experience
- **Drawback**: Not truly native, performance overhead, CSS conflicts

**Option C: Hybrid View/Edit**
- Native viewing (current NativeNoteRenderer - works great)
- Markdown editing (current NativeNoteEditor - works great)
- Split-view preview mode
- **Benefit**: Best of both worlds, leverages existing working code

### Current Status
- Reverted to `NativeNoteEditor` (markdown-based, single TextInput)
- InputAccessoryView toolbar confirmed working
- All WYSIWYG experimental code preserved but not in use
- Ready to enhance markdown editor or pursue alternative WYSIWYG approach

### Decision Point
Project is at a crossroads:
1. **Enhance current markdown editor** (fast, proven, works within constraints)
2. **Explore WebView WYSIWYG** (full features, but loses native feel)
3. **Accept markdown editing** as industry-standard approach (Bear, iA Writer, Ulysses all use markdown)

The current implementation (native viewing + markdown editing) already matches or exceeds many professional note apps while maintaining perfect web/mobile sync.
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

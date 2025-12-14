# CLAUDE.md

This file provides guidance to Claude Code when working with the WardNotes mobile app.

## Development Commands

```bash
npm start          # Start Expo development server
npm run ios        # iOS device/simulator
npm run android    # Android device/emulator
npm run web        # Web development

# Production builds (EAS)
npx eas build --platform ios --profile production --auto-submit
npx eas build --profile preview --platform ios  # Simulator build
```

## Architecture Overview

**WardNotes Mobile** is a React Native app built with Expo, sharing the Supabase backend with the web app.

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.79.5, Expo 53 |
| Navigation | React Navigation |
| Database | Supabase (custom REST client, no WebSockets) |
| Editor | 10tap-editor (WebView-based TipTap) |
| Auth | Supabase + Google OAuth (Expo WebBrowser) |
| Storage | AsyncStorage (session persistence) |

### Core Features
1. **Notes** - WYSIWYG rich text editing with 10tap-editor
2. **Flashcards** - AI generation + SM-2 spaced repetition
3. **Activity Tracking** - Daily note counts and streaks
4. **Premium** - Stripe subscriptions (shared with web)

### Key Directories
```
src/
├── components/    # React Native components (by feature)
├── screens/       # Screen components for React Navigation
├── contexts/      # React Context providers (AuthContext)
├── hooks/         # Custom hooks (useNotes, useDecks, useFlashcards)
├── services/      # Backend services (REST client, FlashcardService)
├── types/         # TypeScript definitions
└── utils/         # Utilities (TipTap converters)
```

### Editor Architecture

| Mode | Implementation |
|------|---------------|
| **Viewing** | TipTapEditor in read-only mode (WebView) |
| **Editing** | 10tap-editor with formatting toolbar |

**Key Files:**
- `src/components/notes/TipTapEditor.tsx` - Editor wrapper (view + edit)
- `src/constants/editorStyles.ts` - Mobile typography CSS

**Data Flow:** Database (TipTap JSON) ↔ 10tap-editor ↔ Save

### Mobile-Specific Notes
- **No WebSockets** - Custom REST client (no realtime features)
- **Metro bundler** - Aliases block problematic Node.js modules
- **Patch-package** - TenTap codegen fix applied via postinstall
- **Cross-platform sync** - Same TipTap JSON as web app

## Code Style (Summary)

- **TypeScript**: Prefer interfaces, explicit return types, avoid `any`
- **Components**: Functional with hooks, default exports
- **Naming**: PascalCase (components), camelCase (functions/variables)
- **Navigation**: React Navigation patterns, screen components in `screens/`
- **Styling**: StyleSheet.create() with consistent spacing

## Recent Changes (Brief)

| Date | Feature | Details |
|------|---------|---------|
| Dec 2025 | Freemium Pricing with Quotas | Soft paywall with monthly usage limits (3 flashcard generations for free users). See CHANGELOG.md |
| Nov 2025 | AI Flashcard Generation | Full generation with preview/edit/save. See CHANGELOG.md |
| Nov 2025 | Flashcard Management | CRUD operations, FlashcardListModal. See CHANGELOG.md |
| Nov 2025 | Mobile Typography | iOS system font styling for 10tap-editor. See CHANGELOG.md |
| Nov 2025 | TestFlight Deploy | Production build live on TestFlight. See CHANGELOG.md |
| Nov 2024 | iOS Build Fixes | TenTap codegen patch, Xcode 16 upgrade. See CHANGELOG.md |

**For full implementation details, see CHANGELOG.md.**

## Build Info

| Item | Value |
|------|-------|
| Bundle ID | `com.anased.wardnotes` |
| Node Version | ≥20.19.4 |
| Distribution | TestFlight (internal testing) |

## Update Guidelines

When making significant changes:
1. Add brief summary to "Recent Changes" table above
2. Add detailed documentation to CHANGELOG.md
3. Update architecture sections if core structure changes

# iOS Build Troubleshooting Summary

## Session Date: November 11, 2024

## Problem
Running `npm run ios` resulted in build errors. The mobile app could not be built for iOS.

## Root Causes Identified

### 1. TenTap Editor Codegen Issue
**Problem:** `@10play/tentap-editor@0.7.4` has compatibility issues with React Native 0.79.5's new architecture codegen.

**Error:**
```
cannot find protocol declaration for 'RCTTenTapViewViewProtocol'
use of undeclared identifier 'TenTapViewComponentDescriptor'
use of undeclared identifier 'TenTapViewProps'
```

**Root Cause:** The TenTap component spec file (`TenTapViewNativeComponent.ts`) uses conditional logic that prevents React Native's codegen from properly generating required C++ header files.

**Attempted Fix:** Created a separate spec file (`TenTapViewNativeComponentSpec.ts`) with straightforward codegen call, but this fix was lost when we reset to git.

### 2. Expo SDK Compatibility Issue
**Problem:** Expo 53 uses iOS 18+ SwiftUI APIs that aren't available in Xcode 15.4

**Error:**
```
AutoSizingStack.swift:35:16: value of type 'some View' has no member 'onGeometryChange'
```

**Root Cause:** `expo-modules-core` uses `onGeometryChange` API which requires iOS 18 SDK. Current system has Xcode 15.4 with iOS 17.5 SDK.

**System Limitations:**
- macOS: 14.4.1 (Sonoma)
- Xcode: 15.4 (iOS 17.5 SDK)
- Xcode 16 requires: macOS 14.5+ or macOS 15+

## What We Tried

1. ✅ **Cleaned and rebuilt iOS project** - Removed Pods, build folder
2. ✅ **Applied TenTap codegen fix** - Created spec file with proper codegen structure
3. ✅ **Updated iOS deployment target** - Changed from 15.1 to 17.0
4. ❌ **Patched Expo SwiftUI code** - Attempted iOS 17 fallback, but didn't work
5. ✅ **Reset to clean git state** - Reverted all changes

## Current State

- ✅ **Git:** Clean working tree, all changes reverted
- ✅ **Branch:** `feature/mobile-subscription-management`
- ✅ **Last commit:** `b9b3461 - Add explicit iOS and Android deep link URL scheme configuration`
- ✅ **Dependencies:** Clean install, no patches applied
- ❌ **iOS Build:** Cannot build due to Xcode/SDK version incompatibility

## Why Expo Go Won't Work

The app **cannot run in Expo Go** because it uses custom native modules:
- `@10play/tentap-editor` - Rich text editor
- `@stripe/stripe-react-native` - Payment processing
- Other native modules requiring compilation

**Error when using Expo Go:**
```
ERROR Could not find component config for native component
```

## Next Steps (Choose One)

### Option 1: EAS Build (RECOMMENDED - Fastest)
Build the app in the cloud using Expo's build service with Xcode 16 already installed.

**Pros:**
- No system upgrades needed
- Xcode 16 available in cloud
- Can start immediately
- Works with current macOS 14.4.1

**Steps:**
```bash
# 1. Login to EAS (if not already)
npx eas-cli login

# 2. Configure EAS project (if needed)
npx eas build:configure

# 3. Build development client
npx eas build --profile development --platform ios

# 4. Download and install on simulator/device
```

**Note:** Requires Expo account (free tier available)

### Option 2: Upgrade macOS + Xcode (Most thorough, takes time)
Upgrade local system to support Xcode 16.

**Steps:**
```bash
# 1. Update macOS to 14.5+ or 15
System Settings → General → Software Update

# 2. Install Xcode 16 from App Store

# 3. Switch Xcode version
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# 4. Verify
xcodebuild -version  # Should show Xcode 16.x

# 5. Build app
npx expo run:ios
```

**Time estimate:** 1-2 hours (downloads + installation)

### Option 3: Downgrade Expo (Quick workaround, may have issues)
Downgrade to Expo 52 which works with Xcode 15.4.

**Steps:**
```bash
npm install expo@~52.0.0
npx expo install --fix
npx expo run:ios
```

**Risks:**
- May require downgrading other dependencies
- Potential compatibility issues
- Not tested with current codebase

## Technical Details for Future Reference

### TenTap Codegen Fix (If Needed)
If building locally with Xcode 16, this fix resolves the TenTap codegen issue:

**Create:** `node_modules/@10play/tentap-editor/src/TenTapViewNativeComponentSpec.ts`
```typescript
import type { ViewProps } from 'react-native';
import type { Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { HostComponent } from 'react-native';

interface NativeProps extends ViewProps {
  keyboardHeight: Int32;
  keyboardID?: string;
  inputTag?: Int32;
  rootBackground?: Int32;
}

export default codegenNativeComponent<NativeProps>('TenTapView') as HostComponent<NativeProps>;
```

**Update:** `node_modules/@10play/tentap-editor/src/TenTapViewNativeComponent.ts`
```typescript
// Change line 5 from:
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

// To:
import TenTapViewNativeComponent from './TenTapViewNativeComponentSpec';

// And change line 25 from:
TenTapView = codegenNativeComponent<NativeProps>('TenTapView');

// To:
TenTapView = TenTapViewNativeComponent as NativeComponentType<NativeProps>;
```

**Note:** This fix must be reapplied after `npm install` since it patches `node_modules`.

### Expo SwiftUI Fix (If Building with Xcode 15)
If you must use Xcode 15, patch `node_modules/expo-modules-core/ios/Core/Views/SwiftUI/AutoSizingStack.swift` to remove iOS 18 API usage. However, this approach was not fully tested.

## Recommended Path Forward

**Start with Option 1 (EAS Build)** as it's the fastest and doesn't require system upgrades. This will get your development build running immediately while you can decide whether to upgrade your local environment later.

## Files Modified During Session (All Reverted)
- `app.config.js`
- `eas.json`
- `package.json`
- `package-lock.json`
- `ios/` directory (created and removed)
- `node_modules/@10play/tentap-editor/*` (patched and reverted)
- `node_modules/expo-modules-core/ios/Core/Views/SwiftUI/AutoSizingStack.swift` (patched and reverted)

## Contact/Resources
- Expo EAS Build Docs: https://docs.expo.dev/build/introduction/
- TenTap Editor Issues: https://github.com/10play/10Tap-Editor/issues
- React Native New Architecture: https://reactnative.dev/docs/new-architecture-intro

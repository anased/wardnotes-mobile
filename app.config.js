export default {
    expo: {
      name: "WardNotes",
      slug: "wardnotes-mobile",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "automatic",
      scheme: "wardnotes",
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#0ea5e9"
      },
      assetBundlePatterns: [
        "**/*"
      ],
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.wardnotes.mobile", // Add this
        buildNumber: "1", // Add this
        infoPlist: {
          CFBundleURLTypes: [
            {
              CFBundleURLName: "wardnotes",
              CFBundleURLSchemes: ["wardnotes"]
            }
          ],
          NSCameraUsageDescription: "WardNotes needs access to your camera to add photos to your medical notes.",
          NSPhotoLibraryUsageDescription: "WardNotes needs access to your photo library to add images to your medical notes.",
          NSPhotoLibraryAddUsageDescription: "WardNotes needs permission to save images to your photo library.",
          ITSAppUsesNonExemptEncryption: false
        }
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#0ea5e9"
        },
        intentFilters: [
          {
            action: "VIEW",
            autoVerify: true,
            data: [
              {
                scheme: "wardnotes",
              },
            ],
            category: ["BROWSABLE", "DEFAULT"],
          },
        ],
      },
      web: {
        favicon: "./assets/favicon.png"
      },
      extra: {
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        eas: {
          projectId: "101f4789-38fb-46d2-973c-0f51b275415c"  // Add this line
        },
      },
      platforms: ["ios", "android", "web"],
    }
  };
export default {
    expo: {
      name: "WardNotes",
      slug: "wardnotes-mobile",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "automatic",
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#0ea5e9"
      },
      assetBundlePatterns: [
        "**/*"
      ],
      ios: {
        supportsTablet: true,
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#0ea5e9"
        },
      },
      web: {
        favicon: "./assets/favicon.png"
      },
      extra: {
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      },
    }
  };
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Supabase uses `url` and `crypto` which need polyfills in React Native.
// The `react-native-url-polyfill` and `expo-crypto` packages handle this.
// Expo's default config should handle most of this, but explicitly adding
// them can help in some edge cases.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve("expo-crypto"),
  url: require.resolve("react-native-url-polyfill"),
};

module.exports = config;

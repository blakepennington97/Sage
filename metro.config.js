// metro.config.js - REPLACE WITH THIS AGGRESSIVE VERSION
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Aggressive WebSocket blocking
config.resolver.platforms = ['ios', 'android', 'native'];

// Block problematic Node.js modules completely
config.resolver.blockList = [
  /node_modules\/ws\/.*/,
  /node_modules\/.*\/ws\/.*/,
  /.*\/ws\/lib\/stream\.js$/,
  /.*\/ws\/lib\/.*$/,
];

// Provide polyfills for Node.js modules
config.resolver.alias = {
  'crypto': 'expo-crypto',
  'stream': 'stream-browserify',
  'buffer': 'buffer',
  'util': 'util',
  'url': 'react-native-url-polyfill',
  'querystring': 'querystring-es3',
  'ws': false, // Completely block ws
  'websocket': false, // Block websocket
};

// Prioritize React Native resolutions
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Transform specific modules
config.transformer.minifierConfig = {
  // Keep class names for better debugging
  keep_classnames: true,
  mangle: {
    keep_classnames: true,
  },
};

module.exports = config;
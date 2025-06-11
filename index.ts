// index.ts - PROJECT ROOT - REPLACE EXISTING FILE
// Import polyfills FIRST - before any other imports
import "react-native-url-polyfill/auto";
import "react-native-get-random-values";

import { registerRootComponent } from "expo";

import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

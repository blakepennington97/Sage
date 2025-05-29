// App.tsx - Replace your existing App.tsx with this
import React from "react";
import { StatusBar } from "expo-status-bar";
import { AITestScreen } from "./src/screens/AITestScreen";

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <AITestScreen />
    </>
  );
}

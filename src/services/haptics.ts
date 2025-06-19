// src/services/haptics.ts
import * as Haptics from "expo-haptics";

export class HapticService {
  // Light tap for button presses
  static light() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Medium tap for selections
  static medium() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  // Heavy tap for important actions
  static heavy() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  // Success notification
  static success() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Warning notification
  static warning() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  // Error notification
  static error() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

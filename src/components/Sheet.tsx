import React, { useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 120,
};

export const Sheet: React.FC<SheetProps> = ({
  isVisible,
  onClose,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(500);
  const opacity = useSharedValue(0);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      // Allow animations to finish before unmounting
      translateY.value = withTiming(500, { duration: 200 });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]} />
      </Pressable>

      <Animated.View
        style={[
          styles.sheetContainer,
          { paddingBottom: insets.bottom || 16 },
          sheetAnimatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1E1E1E", // Using surface color from theme
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
});

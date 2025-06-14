import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "../constants/theme";
import { UserRecipe } from "../services/supabase";

interface RecipeCardProps {
  recipe: UserRecipe;
  onPress: () => void;
}

const DifficultyIndicator: React.FC<{ level: number }> = ({ level }) => (
  <View style={styles.difficultyContainer}>
    {[1, 2, 3, 4, 5].map((i) => (
      <View
        key={i}
        style={[
          styles.difficultyDot,
          i <= level ? styles.difficultyDotFilled : {},
        ]}
      />
    ))}
  </View>
);

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.card}>
        <Text style={styles.name} numberOfLines={3}>
          {recipe.recipe_name}
        </Text>
        <View>
          <DifficultyIndicator level={recipe.difficulty_level || 1} />
          <View style={styles.footer}>
            <Text style={styles.metaText}>
              {recipe.estimated_time || "N/A"}
            </Text>
            {recipe.is_favorite && <Text style={styles.favorite}>❤️</Text>}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1 / 2,
    padding: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    justifyContent: "space-between",
    minHeight: 160,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  metaText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  cookCount: {
    ...typography.small,
    color: colors.textSecondary,
  },
  favorite: {
    fontSize: 16,
  },
  difficultyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  difficultyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceVariant,
    marginRight: 4,
  },
  difficultyDotFilled: {
    backgroundColor: colors.primary,
  },
});

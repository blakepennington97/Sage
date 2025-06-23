// src/hooks/useMealPlans.ts (with logging)

import { useCallback } from "react";
import { Alert } from "react-native";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
} from "@tanstack/react-query";
import { MealPlanService } from "../services/mealPlanService";
import { RecipeService } from "../services/supabase";
import {
  WeeklyMealPlan,
  CreateMealPlanRequest,
  UpdateMealPlanRequest,
  MealPlanRecipe,
} from "../types/mealPlan";
import { useAuthStore } from "../stores/authStore";
import { ErrorHandler } from "../utils/errorHandling";

interface BatchUpdateContext {
  previousMealPlan?: WeeklyMealPlan;
  queryKey: QueryKey;
}

const QUERY_KEYS = {
  mealPlans: (userId: string) => ["mealPlans", userId],
  mealPlanByWeek: (userId: string, weekStartDate: string) => [
    "mealPlans",
    "week",
    userId,
    weekStartDate,
  ],
} as const;

export const useMealPlans = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const batchUpdateMealPlanMutation = useMutation<
    WeeklyMealPlan | null,
    Error,
    UpdateMealPlanRequest[],
    BatchUpdateContext | undefined
  >({
    mutationFn: (requests: UpdateMealPlanRequest[]) => {
      console.log(
        "4️⃣ [MUTATION] batchUpdateMealPlanMutation: mutationFn starting."
      );
      if (!user) throw new Error("User must be authenticated");
      if (requests.length === 0) {
        console.warn(
          "⚠️ [MUTATION] batchUpdateMealPlanMutation: mutationFn called with 0 requests. Resolving null."
        );
        return Promise.resolve(null);
      }
      return MealPlanService.batchUpdateMealPlan(requests);
    },
    onSuccess: (updatedPlan) => {
      console.log(
        "✅ [MUTATION] batchUpdateMealPlanMutation: onSuccess triggered."
      );
      if (updatedPlan && user) {
        const queryKey = QUERY_KEYS.mealPlanByWeek(
          user.id,
          updatedPlan.week_start_date
        );
        console.log(
          `🟢 [MUTATION] onSuccess: Updating cache for key:`,
          queryKey
        );
        queryClient.setQueryData(queryKey, updatedPlan);
      } else {
        console.log(
          "🟡 [MUTATION] onSuccess: No updated plan returned, not updating cache."
        );
      }
    },
    onError: (err, variables, context) => {
      console.error(
        "🔴 [MUTATION] batchUpdateMealPlanMutation: onError triggered.",
        err
      );
      if (context?.previousMealPlan) {
        console.log(
          "⏪ [MUTATION] onError: Rolling back optimistic update for key:",
          context.queryKey
        );
        queryClient.setQueryData(context.queryKey, context.previousMealPlan);
      }
      ErrorHandler.handleError(err, "batch meal plan update");
    },
  });

  const createMealPlan = useCallback(async (request: CreateMealPlanRequest) => {
    return await createMealPlanMutation.mutateAsync(request);
  }, []);

  const updateMealPlan = useCallback(async (request: UpdateMealPlanRequest) => {
    return await updateMealPlanMutation.mutateAsync(request);
  }, []);

  const batchUpdateMealPlan = useCallback(
    async (requests: UpdateMealPlanRequest[]) => {
      return await batchUpdateMealPlanMutation.mutateAsync(requests);
    },
    []
  );

  const deleteMealPlan = useCallback((mealPlanId: string) => {
    deleteMealPlanMutation.mutate(mealPlanId);
  }, []);

  // Other mutations (create, update, delete) are simplified for brevity but should follow a similar pattern
  const createMealPlanMutation = useMutation({
    mutationFn: (request: CreateMealPlanRequest) => {
      if (!user) throw new Error("User must be authenticated");
      return MealPlanService.createMealPlan(user.id, request);
    },
    onSuccess: (newMealPlan) => {
      queryClient.setQueryData(
        QUERY_KEYS.mealPlanByWeek(user!.id, newMealPlan.week_start_date),
        newMealPlan
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.mealPlans(user!.id),
      });
    },
    onError: (error: any) => {
      ErrorHandler.handleError(error, "meal plan creation");
    },
  });

  const updateMealPlanMutation = useMutation({
    mutationFn: (request: UpdateMealPlanRequest) =>
      MealPlanService.updateMealPlan(request),
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(
        QUERY_KEYS.mealPlanByWeek(user!.id, updatedPlan.week_start_date),
        updatedPlan
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.mealPlans(user!.id),
      });
    },
    onError: (err) => {
      ErrorHandler.handleError(err, "meal plan update");
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
    },
  });

  const deleteMealPlanMutation = useMutation({
    mutationFn: (mealPlanId: string) =>
      MealPlanService.deleteMealPlan(mealPlanId),
    onSuccess: (deletedPlan) => {
      if (deletedPlan && user) {
        const queryKey = QUERY_KEYS.mealPlanByWeek(
          user.id,
          deletedPlan.week_start_date
        );
        queryClient.setQueryData(queryKey, null);
      }
      if (user) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.mealPlans(user.id),
        });
      }
    },
    onError: (err) => {
      ErrorHandler.handleError(err, "deleting meal plan");
    },
  });

  return {
    isCreating: createMealPlanMutation.isPending,
    isUpdating: updateMealPlanMutation.isPending,
    isBatchUpdating: batchUpdateMealPlanMutation.isPending,
    isDeleting: deleteMealPlanMutation.isPending,
    createMealPlan,
    updateMealPlan,
    batchUpdateMealPlan,
    deleteMealPlan,
  };
};

export const useMealPlanByWeek = (weekStartDate: string) => {
  const { user } = useAuthStore();
  return useQuery<WeeklyMealPlan | null>({
    queryKey: QUERY_KEYS.mealPlanByWeek(user?.id || "", weekStartDate),
    queryFn: () => {
      console.log(
        `📡 [QUERY] useMealPlanByWeek: Fetching for key: ['mealPlans', 'week', '${user?.id}', '${weekStartDate}']`
      );
      return user
        ? MealPlanService.getMealPlanByWeek(user.id, weekStartDate)
        : null;
    },
    enabled: !!user && !!weekStartDate,
    staleTime: 5 * 60 * 1000,
  });
};

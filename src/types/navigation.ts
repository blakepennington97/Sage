// Navigation type definitions for the app

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type OnboardingStackParamList = {
  Skills: undefined;
  Kitchen: undefined;
};

export type AppStackParamList = {
  Main: undefined;
  RecipeDetail: { recipe: any };
  RecipeGeneration: undefined;
  CookingCoach: { recipe: any };
};

export type MainTabsParamList = {
  RecipeBook: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  App: undefined;
};
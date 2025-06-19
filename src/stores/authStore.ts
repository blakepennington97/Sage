import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "../services/supabase";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  initializeSession: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setProfileLoading: (isLoading: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isProfileLoading: false,
  initializeSession: (user) => set({ user, isLoading: false }),
  setProfile: (profile) => set({ profile }),
  setProfileLoading: (isLoading) => set({ isProfileLoading: isLoading }),
  clearSession: () => set({ user: null, profile: null, isLoading: false }),
}));

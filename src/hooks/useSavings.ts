import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { SessionService } from '../services/supabase';

interface SavingsData {
  totalSavings: number;
  totalCookingSessions: number;
  averageSavingsPerMeal: number;
  monthlySavings: number;
}

export const useSavings = () => {
  const { user } = useAuthStore();
  const [savingsData, setSavingsData] = useState<SavingsData>({
    totalSavings: 0,
    totalCookingSessions: 0,
    averageSavingsPerMeal: 0,
    monthlySavings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSavingsData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await SessionService.getUserSavings(user.id);
        setSavingsData(data);
      } catch (error) {
        console.error('Error fetching savings data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavingsData();
  }, [user]);

  return {
    savingsData,
    isLoading,
    refetch: async () => {
      if (user) {
        setIsLoading(true);
        try {
          const data = await SessionService.getUserSavings(user.id);
          setSavingsData(data);
        } catch (error) {
          console.error('Error refetching savings data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    },
  };
};
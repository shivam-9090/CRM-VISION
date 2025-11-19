import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

/**
 * Custom hook for cache invalidation
 * Use this to refresh data across the app after mutations
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    // Invalidate all dashboard data
    invalidateDashboard: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },

    // Invalidate all deals data (including stats)
    invalidateDeals: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
    },

    // Invalidate all contacts data
    invalidateContacts: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },

    // Invalidate all companies data
    invalidateCompanies: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },

    // Invalidate all activities data
    invalidateActivities: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },

    // Invalidate all analytics
    invalidateAnalytics: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },

    // Invalidate everything (use sparingly)
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },

    // Invalidate related data when a deal changes
    invalidateOnDealChange: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },

    // Invalidate related data when a contact changes
    invalidateOnContactChange: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },

    // Invalidate related data when a company changes
    invalidateOnCompanyChange: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },

    // Invalidate related data when an activity changes
    invalidateOnActivityChange: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  };
}

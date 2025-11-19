/**
 * Centralized Query Keys for React Query
 * This ensures consistent cache invalidation across the app
 */

export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: ['dashboard', 'stats'] as const,
    recentActivities: ['dashboard', 'recent-activities'] as const,
  },
  
  // Deals
  deals: {
    all: ['deals'] as const,
    list: (filters?: Record<string, string | number>) => 
      ['deals', 'list', filters] as const,
    detail: (id: string) => ['deals', 'detail', id] as const,
    stats: {
      all: ['deals', 'stats'] as const,
      pipeline: ['deals', 'stats', 'pipeline'] as const,
      myDeals: ['deals', 'stats', 'my-deals'] as const,
    },
  },
  
  // Contacts
  contacts: {
    all: ['contacts'] as const,
    list: (filters?: Record<string, string>) => 
      ['contacts', 'list', filters] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
  },
  
  // Companies
  companies: {
    all: ['companies'] as const,
    list: (filters?: Record<string, string>) => 
      ['companies', 'list', filters] as const,
    detail: (id: string) => ['companies', 'detail', id] as const,
  },
  
  // Activities
  activities: {
    all: ['activities'] as const,
    list: (filters?: Record<string, string>) => 
      ['activities', 'list', filters] as const,
    detail: (id: string) => ['activities', 'detail', id] as const,
    upcoming: ['activities', 'upcoming'] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    deals: ['analytics', 'deals'] as const,
    activities: ['analytics', 'activities'] as const,
  },
} as const;

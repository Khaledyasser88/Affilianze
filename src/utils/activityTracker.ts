/**
 * Simple local activity tracker to make the UI feel reactive
 * before the backend processes and returns the activity.
 */

export interface LocalActivity {
  description: string;
  date: string;
  amount?: string;
  type: 'conversion' | 'application' | 'payment' | 'system';
}

const STORAGE_KEY = 'affiliance_local_activities';

export const activityTracker = {
  getActivities: (): LocalActivity[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  addActivity: (activity: Omit<LocalActivity, 'date'>) => {
    try {
      const activities = activityTracker.getActivities();
      const newActivity: LocalActivity = {
        ...activity,
        date: new Date().toISOString()
      };
      
      let updated = [newActivity, ...activities];
      
      // If activities exceed 5 items, restart from the beginning (just the new activity)
      if (updated.length > 5) {
        updated = [newActivity];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      // Trigger a storage event for other components to listen to (if in same tab)
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to add local activity:', e);
    }
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};

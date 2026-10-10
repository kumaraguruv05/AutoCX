import { SavedAnalysis } from '@/types/api';

const STORAGE_KEY = 'autocx_prediction_history_v1';

export const storageService = {
  getHistory(): SavedAnalysis[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAnalysis(analysis: Omit<SavedAnalysis, 'id' | 'timestamp'>): SavedAnalysis {
    const history = this.getHistory();
    const newEntry: SavedAnalysis = {
      ...analysis,
      id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...history].slice(0, 50); // Keep latest 50
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
    return newEntry;
  },

  deleteAnalysis(id: string): void {
    const history = this.getHistory();
    const updated = history.filter((item) => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update local storage', e);
    }
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear local storage', e);
    }
  },
};

import { create } from 'zustand';
import { Volume, Filters, Status } from './types';
import { db } from './db';
import { filterVolumes, runAllChecks, getTaskSummary, getUniqueTopics, getUniqueAssignees } from './utils/checks';

interface AppState {
  volumes: Volume[];
  selectedId: string | null;
  selectedIds: Set<string>;
  filters: Filters;
  view: 'list' | 'checklist';
  loading: boolean;
  isBatchMode: boolean;
  
  loadVolumes: () => Promise<void>;
  setSelectedId: (id: string | null) => void;
  toggleSelectedId: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  setView: (view: 'list' | 'checklist') => void;
  setBatchMode: (enabled: boolean) => void;
  
  addVolume: (volume: Omit<Volume, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVolume: (volume: Volume) => Promise<void>;
  updateVolumeStatus: (id: string, status: Status) => Promise<void>;
  deleteVolume: (id: string) => Promise<void>;
  reorderVolumes: (fromIndex: number, toIndex: number) => Promise<void>;
  
  batchUpdateStatus: (ids: string[], status: Status) => Promise<void>;
  batchDelete: (ids: string[]) => Promise<void>;
  
  getFilteredVolumes: () => Volume[];
  getCheckResults: () => ReturnType<typeof runAllChecks>;
  getTaskSummary: () => ReturnType<typeof getTaskSummary>;
  getTopics: () => string[];
  getAssignees: () => string[];
}

export const useAppStore = create<AppState>((set, get) => ({
  volumes: [],
  selectedId: null,
  selectedIds: new Set(),
  filters: {
    topic: '',
    assignee: '',
    status: '',
    pageMin: '',
    pageMax: '',
  },
  view: 'list',
  loading: false,
  isBatchMode: false,

  loadVolumes: async () => {
    set({ loading: true });
    try {
      const volumes = await db.getAll();
      set({ volumes, loading: false });
    } catch (error) {
      console.error('Failed to load volumes:', error);
      set({ loading: false });
    }
  },

  setSelectedId: (id) => set({ selectedId: id, selectedIds: id ? new Set([id]) : new Set() }),
  
  toggleSelectedId: (id) => {
    const { selectedIds, isBatchMode } = get();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (isBatchMode) {
        newSelected.add(id);
      } else {
        newSelected.clear();
        newSelected.add(id);
      }
    }
    set({
      selectedIds: newSelected,
      selectedId: newSelected.size === 1 ? Array.from(newSelected)[0] : null,
    });
  },
  
  clearSelection: () => set({ selectedIds: new Set(), selectedId: null }),
  
  selectAll: () => {
    const filtered = get().getFilteredVolumes();
    const allIds = new Set(filtered.map(v => v.id));
    set({ selectedIds: allIds, selectedId: allIds.size === 1 ? Array.from(allIds)[0] : null });
  },

  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
  })),

  resetFilters: () => set({
    filters: { topic: '', assignee: '', status: '', pageMin: '', pageMax: '' },
  }),

  setView: (view) => set({ view }),
  
  setBatchMode: (enabled) => set({ isBatchMode: enabled, selectedIds: new Set(), selectedId: null }),

  addVolume: async (volume) => {
    const newVolume = await db.add(volume);
    set((state) => ({ volumes: [...state.volumes, newVolume] }));
  },

  updateVolume: async (volume) => {
    const updated = await db.update(volume);
    set((state) => ({
      volumes: state.volumes.map((v) => (v.id === updated.id ? updated : v)),
    }));
  },

  updateVolumeStatus: async (id, status) => {
    const volume = get().volumes.find(v => v.id === id);
    if (volume) {
      const updated = await db.update({ ...volume, status });
      set((state) => ({
        volumes: state.volumes.map((v) => (v.id === updated.id ? updated : v)),
      }));
    }
  },

  deleteVolume: async (id) => {
    await db.delete(id);
    set((state) => ({
      volumes: state.volumes.filter((v) => v.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      selectedIds: new Set(Array.from(state.selectedIds).filter(sid => sid !== id)),
    }));
  },

  reorderVolumes: async (fromIndex, toIndex) => {
    const volumes = [...get().volumes];
    const [removed] = volumes.splice(fromIndex, 1);
    volumes.splice(toIndex, 0, removed);
    
    const reordered = volumes.map((v, index) => ({ ...v, sortOrder: index }));
    const updated = await db.bulkUpdate(reordered);
    
    set({ volumes: updated });
  },

  batchUpdateStatus: async (ids, status) => {
    const volumes = get().volumes.filter(v => ids.includes(v.id));
    const updated = volumes.map(v => ({ ...v, status }));
    await db.bulkUpdate(updated);
    
    set((state) => ({
      volumes: state.volumes.map(v => 
        ids.includes(v.id) ? { ...v, status, updatedAt: Date.now() } : v
      ),
    }));
  },

  batchDelete: async (ids) => {
    await db.bulkDelete(ids);
    set((state) => ({
      volumes: state.volumes.filter(v => !ids.includes(v.id)),
      selectedIds: new Set(),
      selectedId: null,
    }));
  },

  getFilteredVolumes: () => filterVolumes(get().volumes, get().filters),
  getCheckResults: () => runAllChecks(get().volumes),
  getTaskSummary: () => getTaskSummary(get().volumes),
  getTopics: () => getUniqueTopics(get().volumes),
  getAssignees: () => getUniqueAssignees(get().volumes),
}));

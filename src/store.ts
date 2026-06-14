import { create } from 'zustand';
import { Volume, Filters, Status, FlowRecord } from './types';
import { db } from './db';
import { filterVolumes, runAllChecks, getTaskSummary, getUniqueTopics, getUniqueAssignees, generateChangeSummary, createFlowRecord } from './utils/checks';

interface AppState {
  volumes: Volume[];
  flowRecords: FlowRecord[];
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
  getFlowRecordsForVolume: (volumeId: string) => FlowRecord[];
}

export const useAppStore = create<AppState>((set, get) => ({
  volumes: [],
  flowRecords: [],
  selectedId: null,
  selectedIds: new Set(),
  filters: {
    topic: '',
    assignee: '',
    status: '',
    pageMin: '',
    pageMax: '',
    quickFilter: '',
  },
  view: 'list',
  loading: false,
  isBatchMode: false,

  loadVolumes: async () => {
    set({ loading: true });
    try {
      const volumes = await db.getAll();
      const flowRecords = await db.getAllFlowRecords();
      set({ volumes, flowRecords, loading: false });
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
    filters: { topic: '', assignee: '', status: '', pageMin: '', pageMax: '', quickFilter: '' },
  }),

  setView: (view) => set({ view }),

  setBatchMode: (enabled) => set({ isBatchMode: enabled, selectedIds: new Set(), selectedId: null }),

  addVolume: async (volume) => {
    const newVolume = await db.add(volume);
    const changes = generateChangeSummary(null, { ...newVolume, ...volume });
    if (newVolume.missingPages && newVolume.missingPages.trim()) {
      changes.push({
        operationType: 'missing_pages_change',
        summary: `缺页说明更新为「${newVolume.missingPages}」`,
      });
    }
    const newRecords: FlowRecord[] = [];
    for (const change of changes) {
      const record = await db.addFlowRecord(createFlowRecord(newVolume.id, change.operationType, change.summary));
      newRecords.push(record);
    }
    set((state) => ({
      volumes: [...state.volumes, newVolume],
      flowRecords: [...newRecords, ...state.flowRecords],
    }));
  },

  updateVolume: async (volume) => {
    const oldVolume = get().volumes.find(v => v.id === volume.id);
    const updated = await db.update(volume);
    const newRecords: FlowRecord[] = [];
    if (oldVolume) {
      const changes = generateChangeSummary(oldVolume, volume);
      for (const change of changes) {
        const record = await db.addFlowRecord(createFlowRecord(volume.id, change.operationType, change.summary));
        newRecords.push(record);
      }
    }
    set((state) => ({
      volumes: state.volumes.map((v) => (v.id === updated.id ? updated : v)),
      flowRecords: [...newRecords, ...state.flowRecords],
    }));
  },

  updateVolumeStatus: async (id, status) => {
    const volume = get().volumes.find(v => v.id === id);
    if (volume) {
      const updatedVolume = { ...volume, status };
      const updated = await db.update(updatedVolume);
      const changes = generateChangeSummary(volume, updatedVolume);
      const newRecords: FlowRecord[] = [];
      for (const change of changes) {
        const record = await db.addFlowRecord(createFlowRecord(id, change.operationType, change.summary));
        newRecords.push(record);
      }
      set((state) => ({
        volumes: state.volumes.map((v) => (v.id === updated.id ? updated : v)),
        flowRecords: [...newRecords, ...state.flowRecords],
      }));
    }
  },

  deleteVolume: async (id) => {
    await db.delete(id);
    await db.deleteFlowRecordsByVolumeId(id);
    set((state) => ({
      volumes: state.volumes.filter((v) => v.id !== id),
      flowRecords: state.flowRecords.filter((r) => r.volumeId !== id),
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

    const newRecords: FlowRecord[] = [];
    for (const vol of volumes) {
      const changes = generateChangeSummary(vol, { ...vol, status });
      for (const change of changes) {
        const record = await db.addFlowRecord(createFlowRecord(vol.id, change.operationType, change.summary));
        newRecords.push(record);
      }
    }

    set((state) => ({
      volumes: state.volumes.map(v =>
        ids.includes(v.id) ? { ...v, status, updatedAt: Date.now() } : v
      ),
      flowRecords: [...newRecords, ...state.flowRecords],
    }));
  },

  batchDelete: async (ids) => {
    await db.bulkDelete(ids);
    for (const id of ids) {
      await db.deleteFlowRecordsByVolumeId(id);
    }
    set((state) => ({
      volumes: state.volumes.filter(v => !ids.includes(v.id)),
      flowRecords: state.flowRecords.filter(r => !ids.includes(r.volumeId)),
      selectedIds: new Set(),
      selectedId: null,
    }));
  },

  getFilteredVolumes: () => filterVolumes(get().volumes, get().filters),
  getCheckResults: () => runAllChecks(get().volumes),
  getTaskSummary: () => getTaskSummary(get().volumes, get().flowRecords),
  getTopics: () => getUniqueTopics(get().volumes),
  getAssignees: () => getUniqueAssignees(get().volumes),
  getFlowRecordsForVolume: (volumeId: string) => {
    return get().flowRecords
      .filter(r => r.volumeId === volumeId)
      .sort((a, b) => b.timestamp - a.timestamp);
  },
}));

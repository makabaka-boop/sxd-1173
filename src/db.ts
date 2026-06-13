import { openDB, IDBPDatabase } from 'idb';
import { Volume } from './types';

const DB_NAME = 'training-manual-db';
const STORE_NAME = 'volumes';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

const initDB = async () => {
  if (dbPromise) return dbPromise;
  
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('volumeNumber', 'volumeNumber', { unique: true });
        store.createIndex('topic', 'topic');
        store.createIndex('assignee', 'assignee');
        store.createIndex('status', 'status');
        store.createIndex('sortOrder', 'sortOrder');
      }
    },
  });
  
  return dbPromise;
};

export const db = {
  async getAll(): Promise<Volume[]> {
    const database = await initDB();
    return database.getAllFromIndex(STORE_NAME, 'sortOrder');
  },

  async getById(id: string): Promise<Volume | undefined> {
    const database = await initDB();
    return database.get(STORE_NAME, id);
  },

  async add(volume: Omit<Volume, 'id' | 'createdAt' | 'updatedAt'>): Promise<Volume> {
    const database = await initDB();
    const now = Date.now();
    const newVolume: Volume = {
      ...volume,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await database.add(STORE_NAME, newVolume);
    return newVolume;
  },

  async update(volume: Volume): Promise<Volume> {
    const database = await initDB();
    const updated = { ...volume, updatedAt: Date.now() };
    await database.put(STORE_NAME, updated);
    return updated;
  },

  async bulkUpdate(volumes: Volume[]): Promise<Volume[]> {
    const database = await initDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const now = Date.now();
    const updated = volumes.map(v => ({ ...v, updatedAt: now }));
    await Promise.all([
      ...updated.map(v => tx.store.put(v)),
      tx.done,
    ]);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const database = await initDB();
    await database.delete(STORE_NAME, id);
  },

  async bulkDelete(ids: string[]): Promise<void> {
    const database = await initDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    await Promise.all([
      ...ids.map(id => tx.store.delete(id)),
      tx.done,
    ]);
  },

  async clear(): Promise<void> {
    const database = await initDB();
    await database.clear(STORE_NAME);
  },
};

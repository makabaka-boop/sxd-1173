import { openDB, IDBPDatabase } from 'idb';
import { Volume, FlowRecord, ExceptionRecord } from './types';

const DB_NAME = 'training-manual-db';
const VOLUME_STORE = 'volumes';
const FLOW_STORE = 'flowRecords';
const EXCEPTION_STORE = 'exceptions';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase> | null = null;

const initDB = async () => {
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion) {
      if (!database.objectStoreNames.contains(VOLUME_STORE)) {
        const store = database.createObjectStore(VOLUME_STORE, { keyPath: 'id' });
        store.createIndex('volumeNumber', 'volumeNumber', { unique: true });
        store.createIndex('topic', 'topic');
        store.createIndex('assignee', 'assignee');
        store.createIndex('status', 'status');
        store.createIndex('sortOrder', 'sortOrder');
      }

      if (!database.objectStoreNames.contains(FLOW_STORE)) {
        const flowStore = database.createObjectStore(FLOW_STORE, { keyPath: 'id' });
        flowStore.createIndex('volumeId', 'volumeId');
        flowStore.createIndex('timestamp', 'timestamp');
      }

      if (!database.objectStoreNames.contains(EXCEPTION_STORE)) {
        const exceptionStore = database.createObjectStore(EXCEPTION_STORE, { keyPath: 'id' });
        exceptionStore.createIndex('volumeId', 'volumeId');
        exceptionStore.createIndex('status', 'status');
        exceptionStore.createIndex('type', 'type');
        exceptionStore.createIndex('createdAt', 'createdAt');
      }

      if (oldVersion < 3) {
        const volumeStore = database.transaction(VOLUME_STORE, 'readwrite').store;
        const request = volumeStore.openCursor();
        request.then(function addExceptionFields(cursor) {
          if (!cursor) return;
          const volume = cursor.value;
          if (volume.hasOpenException === undefined) {
            volume.hasOpenException = false;
          }
          if (volume.exceptionCount === undefined) {
            volume.exceptionCount = 0;
          }
          cursor.update(volume);
          cursor.continue().then(addExceptionFields);
        });
      }
    },
  });

  return dbPromise;
};

export const db = {
  async getAll(): Promise<Volume[]> {
    const database = await initDB();
    return database.getAllFromIndex(VOLUME_STORE, 'sortOrder');
  },

  async getById(id: string): Promise<Volume | undefined> {
    const database = await initDB();
    return database.get(VOLUME_STORE, id);
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
    await database.add(VOLUME_STORE, newVolume);
    return newVolume;
  },

  async update(volume: Volume): Promise<Volume> {
    const database = await initDB();
    const updated = { ...volume, updatedAt: Date.now() };
    await database.put(VOLUME_STORE, updated);
    return updated;
  },

  async bulkUpdate(volumes: Volume[]): Promise<Volume[]> {
    const database = await initDB();
    const tx = database.transaction(VOLUME_STORE, 'readwrite');
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
    await database.delete(VOLUME_STORE, id);
  },

  async bulkDelete(ids: string[]): Promise<void> {
    const database = await initDB();
    const tx = database.transaction(VOLUME_STORE, 'readwrite');
    await Promise.all([
      ...ids.map(id => tx.store.delete(id)),
      tx.done,
    ]);
  },

  async clear(): Promise<void> {
    const database = await initDB();
    await database.clear(VOLUME_STORE);
  },

  async getFlowRecords(volumeId: string): Promise<FlowRecord[]> {
    const database = await initDB();
    const index = database.transaction(FLOW_STORE).store.index('volumeId');
    const records = await index.getAll(volumeId);
    return records.sort((a, b) => b.timestamp - a.timestamp);
  },

  async addFlowRecord(record: Omit<FlowRecord, 'id'>): Promise<FlowRecord> {
    const database = await initDB();
    const newRecord: FlowRecord = {
      ...record,
      id: crypto.randomUUID(),
    };
    await database.add(FLOW_STORE, newRecord);
    return newRecord;
  },

  async getAllFlowRecords(): Promise<FlowRecord[]> {
    const database = await initDB();
    const records = await database.getAllFromIndex(FLOW_STORE, 'timestamp');
    return records.reverse();
  },

  async deleteFlowRecordsByVolumeId(volumeId: string): Promise<void> {
    const database = await initDB();
    const tx = database.transaction(FLOW_STORE, 'readwrite');
    const index = tx.store.index('volumeId');
    let cursor = await index.openCursor(volumeId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  },

  async getExceptionsByVolumeId(volumeId: string): Promise<ExceptionRecord[]> {
    const database = await initDB();
    const index = database.transaction(EXCEPTION_STORE).store.index('volumeId');
    const records = await index.getAll(volumeId);
    return records.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getAllExceptions(): Promise<ExceptionRecord[]> {
    const database = await initDB();
    const records = await database.getAllFromIndex(EXCEPTION_STORE, 'createdAt');
    return records.reverse();
  },

  async addException(exception: Omit<ExceptionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExceptionRecord> {
    const database = await initDB();
    const now = Date.now();
    const newException: ExceptionRecord = {
      ...exception,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await database.add(EXCEPTION_STORE, newException);
    return newException;
  },

  async updateException(exception: ExceptionRecord): Promise<ExceptionRecord> {
    const database = await initDB();
    const updated = { ...exception, updatedAt: Date.now() };
    await database.put(EXCEPTION_STORE, updated);
    return updated;
  },

  async deleteException(id: string): Promise<void> {
    const database = await initDB();
    await database.delete(EXCEPTION_STORE, id);
  },

  async deleteExceptionsByVolumeId(volumeId: string): Promise<void> {
    const database = await initDB();
    const tx = database.transaction(EXCEPTION_STORE, 'readwrite');
    const index = tx.store.index('volumeId');
    let cursor = await index.openCursor(volumeId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  },
};

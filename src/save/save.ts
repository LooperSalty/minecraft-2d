import { Dimension } from '../constants';

export interface SaveData {
  version: number;
  seed: number;
  player: object;
  world: object;
  mobs: object;
  dragon: object | null;
  timestamp: number;
}

export class SaveManager {
  private readonly dbName: string;
  private readonly storeName: string;
  private db: IDBDatabase | null;
  private readonly autoSaveInterval: number;
  private autoSaveTimer: ReturnType<typeof setInterval> | null;

  constructor() {
    this.dbName = 'minecraft2d';
    this.storeName = 'saves';
    this.db = null;
    this.autoSaveInterval = 60000;
    this.autoSaveTimer = null;
  }

  async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (): void => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = (): void => {
        this.db = request.result;
        resolve();
      };

      request.onerror = (): void => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  async save(data: SaveData): Promise<void> {
    if (!this.db) {
      console.error('SaveManager: database not initialized');
      return;
    }

    const savedData: SaveData = {
      ...data,
      timestamp: Date.now(),
    };

    return new Promise<void>((resolve, reject) => {
      try {
        const tx = this.db!.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const request = store.put(savedData, 'current');

        request.onsuccess = (): void => {
          resolve();
        };

        request.onerror = (): void => {
          console.error('Failed to save game:', request.error);
          reject(request.error);
        };
      } catch (err) {
        console.error('Failed to create save transaction:', err);
        reject(err);
      }
    });
  }

  async load(): Promise<SaveData | null> {
    if (!this.db) {
      console.error('SaveManager: database not initialized');
      return null;
    }

    return new Promise<SaveData | null>((resolve) => {
      try {
        const tx = this.db!.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const request = store.get('current');

        request.onsuccess = (): void => {
          const result = request.result as SaveData | undefined;
          resolve(result ?? null);
        };

        request.onerror = (): void => {
          console.error('Failed to load save:', request.error);
          resolve(null);
        };
      } catch (err) {
        console.error('Failed to create load transaction:', err);
        resolve(null);
      }
    });
  }

  async hasSave(): Promise<boolean> {
    const data = await this.load();
    return data !== null;
  }

  async deleteSave(): Promise<void> {
    if (!this.db) {
      console.error('SaveManager: database not initialized');
      return;
    }

    return new Promise<void>((resolve) => {
      try {
        const tx = this.db!.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const request = store.delete('current');

        request.onsuccess = (): void => {
          resolve();
        };

        request.onerror = (): void => {
          console.error('Failed to delete save:', request.error);
          resolve();
        };
      } catch (err) {
        console.error('Failed to create delete transaction:', err);
        resolve();
      }
    });
  }

  startAutoSave(getState: () => SaveData): void {
    this.stopAutoSave();

    this.autoSaveTimer = setInterval(async () => {
      try {
        const state = getState();
        await this.save(state);
        console.log('Auto-save completed');
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, this.autoSaveInterval);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  async exportSave(): Promise<string | null> {
    try {
      const data = await this.load();
      if (data === null) {
        return null;
      }
      return JSON.stringify(data);
    } catch (err) {
      console.error('Failed to export save:', err);
      return null;
    }
  }

  async importSave(json: string): Promise<boolean> {
    try {
      const data = JSON.parse(json) as SaveData;

      if (
        typeof data.version !== 'number' ||
        typeof data.seed !== 'number' ||
        typeof data.player !== 'object' ||
        typeof data.world !== 'object' ||
        typeof data.mobs !== 'object' ||
        typeof data.timestamp !== 'number'
      ) {
        console.error('Invalid save data format');
        return false;
      }

      await this.save(data);
      return true;
    } catch (err) {
      console.error('Failed to import save:', err);
      return false;
    }
  }
}

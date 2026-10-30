import { DEFAULT_SETTINGS } from '../constants';
import { Settings } from '../types';

// 캐릭터·결과·내 포즈는 이 브라우저의 IndexedDB에만 저장된다
const DB_NAME = 'pose-studio';
const DB_VERSION = 1;
export type StoreName = 'characters' | 'results' | 'poses';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of ['characters', 'results', 'poses']) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

const done = <T,>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDb();
  return done(db.transaction(store).objectStore(store).getAll() as IDBRequest<T[]>);
}

export async function put<T>(store: StoreName, value: T): Promise<void> {
  const db = await openDb();
  await done(db.transaction(store, 'readwrite').objectStore(store).put(value));
}

export async function remove(store: StoreName, id: string): Promise<void> {
  const db = await openDb();
  await done(db.transaction(store, 'readwrite').objectStore(store).delete(id));
}

// ---------- localStorage (설정·즐겨찾기) ----------

const SETTINGS_KEY = 'pose-studio:settings';
const FAVORITES_KEY = 'pose-studio:favorites';
const EXPORT_KEY = 'pose-studio:export';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간이 막힌 브라우저에서는 이번 세션 동안만 유지된다
  }
}

export const loadSettings = (): Settings => readJson(SETTINGS_KEY, DEFAULT_SETTINGS);
export const saveSettings = (s: Settings) => writeJson(SETTINGS_KEY, s);

export const loadFavorites = (): string[] => readJson<{ ids: string[] }>(FAVORITES_KEY, { ids: [] }).ids;
export const saveFavorites = (ids: string[]) => writeJson(FAVORITES_KEY, { ids });

export interface ExportPrefs {
  size: number;
  transparent: boolean;
}
export const loadExportPrefs = (): ExportPrefs => readJson(EXPORT_KEY, { size: 0, transparent: false });
export const saveExportPrefs = (p: ExportPrefs) => writeJson(EXPORT_KEY, p);

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

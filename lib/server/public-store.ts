import { promises as fs } from 'fs';
import path from 'path';

interface StoreRecord {
  value: unknown;
  expiresAt?: number;
}

interface StoreData {
  values: Record<string, StoreRecord>;
  sets: Record<string, string[]>;
}

interface SetOptions {
  ex?: number;
}

export interface PublicStore {
  provider: 'vercel-kv' | 'file';
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: SetOptions): Promise<void>;
  del(key: string): Promise<void>;
  sadd(key: string, value: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
  srem(key: string, value: string): Promise<void>;
}

let cachedStore: PublicStore | null = null;
let fileQueue: Promise<unknown> = Promise.resolve();

export function getPublicStore(): PublicStore {
  if (!cachedStore) {
    cachedStore = hasVercelKvEnv() ? createVercelKvStore() : createFileStore();
  }

  return cachedStore;
}

function hasVercelKvEnv(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function createVercelKvStore(): PublicStore {
  async function loadKv() {
    const kvModule = await import('@vercel/kv');
    return kvModule.kv;
  }

  return {
    provider: 'vercel-kv',
    async get<T>(key: string) {
      return (await loadKv()).get<T>(key);
    },
    async set(key: string, value: unknown, options?: SetOptions) {
      const kvClient = await loadKv();
      if (options?.ex) {
        await kvClient.set(key, value, { ex: options.ex });
        return;
      }
      await kvClient.set(key, value);
    },
    async del(key: string) {
      await (await loadKv()).del(key);
    },
    async sadd(key: string, value: string) {
      await (await loadKv()).sadd(key, value);
    },
    async smembers(key: string) {
      const members = await (await loadKv()).smembers(key);
      return Array.isArray(members) ? members.map(String) : [];
    },
    async srem(key: string, value: string) {
      await (await loadKv()).srem(key, value);
    },
  };
}

function createFileStore(): PublicStore {
  return {
    provider: 'file',
    async get<T>(key: string) {
      return withFileStore(async (store) => {
        const record = store.values[key];
        if (!record) return null;
        if (isExpired(record)) {
          delete store.values[key];
          return null;
        }
        return record.value as T;
      });
    },
    async set(key: string, value: unknown, options?: SetOptions) {
      await withFileStore(async (store) => {
        store.values[key] = {
          value,
          ...(options?.ex ? { expiresAt: Date.now() + options.ex * 1000 } : {}),
        };
      });
    },
    async del(key: string) {
      await withFileStore(async (store) => {
        delete store.values[key];
        delete store.sets[key];
      });
    },
    async sadd(key: string, value: string) {
      await withFileStore(async (store) => {
        const members = new Set(store.sets[key] || []);
        members.add(value);
        store.sets[key] = Array.from(members);
      });
    },
    async smembers(key: string) {
      return withFileStore(async (store) => store.sets[key] || []);
    },
    async srem(key: string, value: string) {
      await withFileStore(async (store) => {
        store.sets[key] = (store.sets[key] || []).filter((member) => member !== value);
      });
    },
  };
}

async function withFileStore<T>(operation: (store: StoreData) => T | Promise<T>): Promise<T> {
  const run = fileQueue.then(async () => {
    const store = await readStoreFile();
    const result = await operation(store);
    await writeStoreFile(store);
    return result;
  });

  fileQueue = run.catch(() => undefined);
  return run;
}

async function readStoreFile(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(getStoreFilePath(), 'utf8');
    const data = JSON.parse(raw) as Partial<StoreData>;
    return {
      values: data.values && typeof data.values === 'object' ? data.values : {},
      sets: data.sets && typeof data.sets === 'object' ? data.sets : {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('读取本地公开存储失败，使用空存储:', error);
    }
    return { values: {}, sets: {} };
  }
}

async function writeStoreFile(store: StoreData): Promise<void> {
  const filePath = getStoreFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), 'utf8');
}

function getStoreFilePath(): string {
  const dataDir = process.env.POSTER_STUDIO_DATA_DIR || path.join(process.cwd(), '.data');
  return path.join(dataDir, 'public-store.json');
}

function isExpired(record: StoreRecord): boolean {
  return typeof record.expiresAt === 'number' && record.expiresAt <= Date.now();
}

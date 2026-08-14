import type { DatabaseSchema } from '@idea-chartrons/shared';
import { seedData } from './seed.js';

class InMemoryStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = structuredClone(seedData);
  }

  getAll<K extends keyof DatabaseSchema>(collection: K): DatabaseSchema[K] {
    return this.data[collection];
  }

  getById<K extends keyof DatabaseSchema>(
    collection: K,
    id: string,
  ): DatabaseSchema[K][number] | undefined {
    return this.data[collection].find((item) => (item as { id: string }).id === id);
  }

  create<K extends keyof DatabaseSchema>(
    collection: K,
    item: DatabaseSchema[K][number],
  ): DatabaseSchema[K][number] {
    (this.data[collection] as DatabaseSchema[K][number][]).push(item);
    return item;
  }

  update<K extends keyof DatabaseSchema>(
    collection: K,
    id: string,
    patch: Partial<DatabaseSchema[K][number]>,
  ): DatabaseSchema[K][number] | undefined {
    const items = this.data[collection] as DatabaseSchema[K][number][];
    const index = items.findIndex((item) => (item as { id: string }).id === id);
    if (index === -1) return undefined;
    items[index] = { ...items[index], ...patch, updatedAt: new Date().toISOString() };
    return items[index];
  }

  reset(): void {
    this.data = structuredClone(seedData);
  }
}

export const store = new InMemoryStore();

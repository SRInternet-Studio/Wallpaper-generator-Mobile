import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('.settings.dat');

export async function setSetting(key: string, value: unknown): Promise<void> {
  await store.set(key, value);
  await store.save();
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const value = await store.get<T>(key);
  return value === undefined ? null : value;
}

import { Store } from '@tauri-apps/plugin-store';

// @ts-ignore According to the official documentation, this is the correct way to instantiate a Store.
const store = new Store('.settings.dat');

export async function setSetting(key: string, value: unknown): Promise<void> {
  await store.set(key, value);
  await store.save();
}

export async function getSetting<T>(key: string): Promise<T | null> {
  return await store.get<T>(key);
}

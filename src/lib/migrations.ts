import { getItem, setItem, STORAGE_KEYS } from './storage';

export const CURRENT_SCHEMA_VERSION = 2;

async function migrateV1ToV2(): Promise<void> {
  const license = await getItem<unknown>(STORAGE_KEYS.license, null);
  const extensionId = (
    globalThis as { chrome?: { runtime?: { id?: string } } }
  ).chrome?.runtime?.id;
  if (typeof license !== 'object' || license === null || !extensionId) {
    return;
  }
  const record = license as Record<string, unknown>;
  if (record.extension_id !== undefined) {
    return;
  }
  await setItem(STORAGE_KEYS.license, {
    ...record,
    extension_id: extensionId,
  });
}

export async function runMigrations(): Promise<void> {
  let version = await getItem<number | null>(STORAGE_KEYS.schema_version, null);

  if (version === null) {
    await setItem(STORAGE_KEYS.schema_version, CURRENT_SCHEMA_VERSION);
    await migrateV1ToV2();
    return;
  }

  while (version < CURRENT_SCHEMA_VERSION) {
    switch (version) {
      case 1:
        await migrateV1ToV2();
        version = 2;
        break;
      default:
        throw new Error(`Unknown schema version: ${version}`);
    }
    await setItem(STORAGE_KEYS.schema_version, version);
  }
}

import { getItem, setItem, STORAGE_KEYS } from './storage';

export const CURRENT_SCHEMA_VERSION = 1;

async function migrateV1ToV2(): Promise<void> {
  /* TODO */
}

export async function runMigrations(): Promise<void> {
  let version = await getItem<number | null>(STORAGE_KEYS.schema_version, null);

  if (version === null) {
    await setItem(STORAGE_KEYS.schema_version, CURRENT_SCHEMA_VERSION);
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

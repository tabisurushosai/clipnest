import {
  deleteClip,
  getClip,
  getSettings,
  updateClip,
  incrementUseCount,
  listClips,
  pruneClips,
  saveClip,
} from '../lib/db';
import { runMigrations } from '../lib/migrations';
import { prepareHtmlClipContent } from '../lib/html';
import { MAX_IMAGE_BYTES, prepareImageClipContent } from '../lib/image';
import { scheduleAiForClip } from '../lib/ai_pipeline';
import { prepareUrlClipContent } from '../lib/url';
import { isMsg, type ClipInput, type Msg, type MsgResponse } from '../lib/messages';
import type { Clip } from '../lib/types';

globalThis.console.log('[clipnest] background SW started', new Date().toISOString());

const PRUNE_ALARM_NAME = 'clipnest_prune';
const MS_PER_DAY = 86_400_000;
const BADGE_BG_COLOR = '#3B82F6';
const BADGE_WARNING_BG_COLOR = '#EF4444';
const STORAGE_QUOTA_BYTES = 5_242_880;
const STORAGE_WARNING_PERCENT = 80;

type ChromeTabs = {
  query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<Array<{ id?: number }>>;
};

type ChromeScripting = {
  executeScript: (injection: {
    target: { tabId: number };
    func: (...args: never[]) => unknown;
    args: unknown[];
  }) => Promise<Array<{ result?: unknown; error?: string }>>;
};

type ChromeAlarms = {
  create: (name: string, alarmInfo: { periodInMinutes: number }) => void;
  onAlarm: { addListener: (callback: (alarm: { name?: string }) => void) => void };
};

type ChromeAction = {
  setBadgeText: (details: { text: string }) => void;
  setBadgeBackgroundColor: (details: { color: string }) => void;
};

type ChromeStorageLocal = {
  getBytesInUse: (keys: string | string[] | null) => Promise<number>;
};

type ChromeStorage = {
  local: ChromeStorageLocal;
};

type ChromeRuntime = {
  onInstalled: { addListener: (callback: () => void) => void };
  onStartup: { addListener: (callback: () => void) => void };
  onMessage: {
    addListener: (
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: (response: MsgResponse) => void,
      ) => boolean | void,
    ) => void;
  };
};

type ChromeApi = {
  runtime?: ChromeRuntime;
  tabs?: ChromeTabs;
  scripting?: ChromeScripting;
  alarms?: ChromeAlarms;
  action?: ChromeAction;
  storage?: ChromeStorage;
};

function getChrome(): ChromeApi | undefined {
  return (globalThis as { chrome?: ChromeApi }).chrome;
}

export async function getStorageUsage(): Promise<{ bytes: number; percent: number }> {
  const getBytesInUse = getChrome()?.storage?.local?.getBytesInUse;
  if (!getBytesInUse) {
    return { bytes: 0, percent: 0 };
  }

  const bytes = await getBytesInUse(null);
  const percent = (bytes / STORAGE_QUOTA_BYTES) * 100;
  return { bytes, percent };
}

async function checkStorageUsageWarning(): Promise<void> {
  const usage = await getStorageUsage();
  if (usage.percent <= STORAGE_WARNING_PERCENT) {
    return;
  }

  getChrome()?.action?.setBadgeBackgroundColor({ color: BADGE_WARNING_BG_COLOR });
  globalThis.console.warn('[clipnest] storage usage high', usage);
}

export async function refreshBadge(): Promise<void> {
  const action = getChrome()?.action;
  if (!action) {
    return;
  }

  action.setBadgeBackgroundColor({ color: BADGE_BG_COLOR });

  const count = (await listClips()).length;
  if (count === 0) {
    action.setBadgeText({ text: '' });
    return;
  }

  action.setBadgeText({ text: count >= 100 ? '99+' : String(count) });
}

/* eslint-disable no-undef -- runs in page context when injected via executeScript */
/** Injected into the active tab via chrome.scripting.executeScript */
async function injectWriteImage(dataUrl: string): Promise<void> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const mimeType = blob.type || 'image/png';
  await navigator.clipboard.write([new ClipboardItem({ [mimeType]: blob })]);
}

/** Injected into the active tab via chrome.scripting.executeScript */
async function injectWriteText(text: string, clipType: string): Promise<void> {
  if (clipType === 'html') {
    const container = document.createElement('div');
    container.innerHTML = text;
    const plain = container.textContent ?? text;
    await navigator.clipboard.writeText(plain);
    return;
  }
  await navigator.clipboard.writeText(text);
}
/* eslint-enable no-undef */

async function copyClipToClipboard(clip: Clip): Promise<{ ok: true } | { ok: false; error: string }> {
  const chromeApi = getChrome();
  const tabs = await chromeApi?.tabs?.query({ active: true, currentWindow: true });
  const tabId = tabs?.[0]?.id;

  if (tabId === undefined) {
    return { ok: false, error: 'No active tab' };
  }

  if (!chromeApi?.scripting) {
    return { ok: false, error: 'chrome.scripting is not available' };
  }

  try {
    let results: Array<{ result?: unknown; error?: string }>;

    if (clip.type === 'image') {
      results = await chromeApi.scripting.executeScript({
        target: { tabId },
        func: injectWriteImage,
        args: [clip.content],
      });
    } else {
      results = await chromeApi.scripting.executeScript({
        target: { tabId },
        func: injectWriteText,
        args: [clip.content, clip.type],
      });
    }

    const injection = results[0];
    if (injection?.error) {
      return { ok: false, error: injection.error };
    }

    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function handleCopyClip(id: string): Promise<Extract<MsgResponse, { type: 'copy_clip' }>> {
  const clip = await getClip(id);
  if (!clip) {
    return { type: 'copy_clip', ok: false, error: `Clip not found: ${id}` };
  }

  await incrementUseCount(id);

  const copyResult = await copyClipToClipboard(clip);
  if (!copyResult.ok) {
    return { type: 'copy_clip', ok: false, error: copyResult.error };
  }

  return { type: 'copy_clip', ok: true };
}

function prepareSaveClipPayload(payload: ClipInput): ClipInput | null {
  if (payload.type === 'html') {
    const { content, preview } = prepareHtmlClipContent(payload.content);
    return { ...payload, content, preview };
  }

  if (payload.type === 'image') {
    const prepared = prepareImageClipContent(payload.content);
    if (!prepared) {
      globalThis.console.warn('[clipnest] image too large, save rejected', {
        maxBytes: MAX_IMAGE_BYTES,
      });
      return null;
    }
    return { ...payload, content: prepared.content, preview: prepared.preview };
  }

  if (payload.type === 'url') {
    const { content, preview } = prepareUrlClipContent(payload.content);
    return { ...payload, content, preview };
  }

  return payload;
}

async function handleMessage(msg: Msg): Promise<MsgResponse> {
  switch (msg.type) {
    case 'list_clips':
      return { type: 'list_clips', clips: await listClips() };
    case 'save_clip': {
      const prepared = prepareSaveClipPayload(msg.payload);
      if (!prepared) {
        throw new Error('save_clip rejected');
      }
      const clip = await saveClip(prepared);
      scheduleAiForClip(clip);
      await refreshBadge();
      await checkStorageUsageWarning();
      return { type: 'save_clip', clip };
    }
    case 'get_storage_usage': {
      const usage = await getStorageUsage();
      return { type: 'get_storage_usage', bytes: usage.bytes, percent: usage.percent };
    }
    case 'delete_clip':
      await deleteClip(msg.id);
      await refreshBadge();
      return { type: 'delete_clip', success: true };
    case 'toggle_pin': {
      const clip = await getClip(msg.id);
      if (!clip) {
        throw new Error(`Clip not found: ${msg.id}`);
      }
      await updateClip(msg.id, { pinned: !clip.pinned });
      const updated = await getClip(msg.id);
      if (!updated) {
        throw new Error(`Clip not found after toggle: ${msg.id}`);
      }
      return { type: 'toggle_pin', clip: updated };
    }
    case 'copy_clip':
      return handleCopyClip(msg.id);
  }
}

async function runPruneFromSettings(): Promise<void> {
  const settings = await getSettings();
  const removed = await pruneClips(settings.max_clips, settings.retention_days * MS_PER_DAY);
  globalThis.console.log('[clipnest] pruned clips', removed);
  await refreshBadge();
}

const chromeApi = getChrome();
const chromeRuntime = chromeApi?.runtime;

chromeRuntime?.onInstalled.addListener(() => {
  void (async () => {
    await runMigrations();
    await getSettings();
    chromeApi?.alarms?.create(PRUNE_ALARM_NAME, { periodInMinutes: 60 });
    await refreshBadge();
  })();
});

chromeRuntime?.onStartup.addListener(() => {
  globalThis.console.log('[clipnest] background SW onStartup', new Date().toISOString());
  void refreshBadge();
});

chromeApi?.alarms?.onAlarm.addListener((alarm) => {
  if (alarm.name === PRUNE_ALARM_NAME) {
    void runPruneFromSettings();
  }
});

void runPruneFromSettings();

chromeRuntime?.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isMsg(message)) {
    return false;
  }

  void handleMessage(message)
    .then((response) => {
      sendResponse(response);
    })
    .catch((error: unknown) => {
      globalThis.console.error('[clipnest] message handler error', error);
    });

  return true;
});

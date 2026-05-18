import {
  deleteClip,
  getClip,
  getSettings,
  incrementUseCount,
  listClips,
  saveClip,
} from '../lib/db';
import { runMigrations } from '../lib/migrations';
import { isMsg, type Msg, type MsgResponse } from '../lib/messages';

globalThis.console.log('[clipnest] background SW started', new Date().toISOString());

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

async function handleMessage(msg: Msg): Promise<MsgResponse> {
  switch (msg.type) {
    case 'list_clips':
      return { type: 'list_clips', clips: await listClips() };
    case 'save_clip':
      return { type: 'save_clip', clip: await saveClip(msg.payload) };
    case 'delete_clip':
      await deleteClip(msg.id);
      return { type: 'delete_clip', success: true };
    case 'copy_clip': {
      const clip = await getClip(msg.id);
      if (!clip) {
        throw new Error(`Clip not found: ${msg.id}`);
      }
      await incrementUseCount(msg.id);
      return { type: 'copy_clip', content: clip.content };
    }
  }
}

const chromeRuntime = (globalThis as { chrome?: { runtime?: ChromeRuntime } }).chrome?.runtime;

chromeRuntime?.onInstalled.addListener(() => {
  void runMigrations();
  void getSettings();
});

chromeRuntime?.onStartup.addListener(() => {
  globalThis.console.log('[clipnest] background SW onStartup', new Date().toISOString());
});

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

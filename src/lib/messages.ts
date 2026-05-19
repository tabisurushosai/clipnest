import type { Clip } from './types';

export type ClipInput = Omit<Clip, 'id' | 'created_at' | 'updated_at' | 'use_count'>;

export type Msg =
  | { type: 'list_clips' }
  | { type: 'save_clip'; payload: ClipInput }
  | { type: 'delete_clip'; id: string }
  | { type: 'copy_clip'; id: string }
  | { type: 'toggle_pin'; id: string }
  | { type: 'get_storage_usage' };

export type MsgResponse =
  | { type: 'list_clips'; clips: Clip[] }
  | { type: 'save_clip'; clip: Clip }
  | { type: 'delete_clip'; success: true }
  | { type: 'copy_clip'; ok: true }
  | { type: 'copy_clip'; ok: false; error: string }
  | { type: 'toggle_pin'; clip: Clip }
  | { type: 'get_storage_usage'; bytes: number; percent: number };

export type ResponseFor<T extends Msg> = Extract<MsgResponse, { type: T['type'] }>;

function isCopyClipResponse(value: unknown): value is Extract<MsgResponse, { type: 'copy_clip' }> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (record.type !== 'copy_clip') {
    return false;
  }
  if (record.ok === true) {
    return true;
  }
  return record.ok === false && typeof record.error === 'string';
}

function isMsgResponseFor<T extends Msg['type']>(
  msgType: T,
  value: unknown,
): value is Extract<MsgResponse, { type: T }> {
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    return false;
  }
  if (msgType === 'copy_clip') {
    return isCopyClipResponse(value);
  }
  return (value as MsgResponse).type === msgType;
}

export function isMsg(value: unknown): value is Msg {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  switch (record.type) {
    case 'list_clips':
      return true;
    case 'save_clip':
      return typeof record.payload === 'object' && record.payload !== null;
    case 'delete_clip':
    case 'copy_clip':
    case 'toggle_pin':
      return typeof record.id === 'string';
    case 'get_storage_usage':
      return true;
    default:
      return false;
  }
}

export async function sendMessage<T extends Msg>(msg: T): Promise<ResponseFor<T>> {
  const runtime = (
    globalThis as {
      chrome?: { runtime?: { sendMessage: (message: Msg) => Promise<MsgResponse> } };
    }
  ).chrome?.runtime;

  if (!runtime) {
    throw new Error('chrome.runtime is not available');
  }

  const response: unknown = await runtime.sendMessage(msg);
  if (!isMsgResponseFor(msg.type, response)) {
    throw new Error(`Unexpected response for message type: ${msg.type}`);
  }

  return response as ResponseFor<T>;
}

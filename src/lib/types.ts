/** クリップの種別 */
export type ClipType = 'text' | 'html' | 'image' | 'link';

const CLIP_TYPES: readonly ClipType[] = ['text', 'html', 'image', 'link'];

/** クリップボード履歴の1件 */
export interface Clip {
  /** 一意 ID (UUID) */
  id: string;
  /** コンテンツ種別 */
  type: ClipType;
  /** 本文 */
  content: string;
  /** 一覧表示用プレビュー */
  preview: string;
  /** コピー元 URL */
  source_url: string;
  /** コピー元ページタイトル */
  source_title: string;
  /** 紐づくタグ ID 一覧 */
  tag_ids: string[];
  /** AI 分類カテゴリ (未分類時 null) */
  ai_category: string | null;
  /** ピン留め */
  pinned: boolean;
  /** 作成日時 (Unix ms) */
  created_at: number;
  /** 更新日時 (Unix ms) */
  updated_at: number;
  /** 貼り付け利用回数 */
  use_count: number;
}

export function isClip(value: unknown): value is Clip {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.type === 'string' &&
    CLIP_TYPES.includes(record.type as ClipType) &&
    typeof record.content === 'string' &&
    typeof record.preview === 'string' &&
    typeof record.source_url === 'string' &&
    typeof record.source_title === 'string' &&
    Array.isArray(record.tag_ids) &&
    record.tag_ids.every((tagId) => typeof tagId === 'string') &&
    (record.ai_category === null || typeof record.ai_category === 'string') &&
    typeof record.pinned === 'boolean' &&
    typeof record.created_at === 'number' &&
    typeof record.updated_at === 'number' &&
    typeof record.use_count === 'number'
  );
}

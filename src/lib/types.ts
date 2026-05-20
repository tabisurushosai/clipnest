/** クリップの種別 */
export type ClipType = 'text' | 'html' | 'image' | 'link' | 'url';

const CLIP_TYPES: readonly ClipType[] = ['text', 'html', 'image', 'link', 'url'];

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
  /** コピー元サイトの favicon URL */
  source_favicon_url?: string;
  /** 紐づくタグ ID 一覧 */
  tag_ids: string[];
  /** AI 分類カテゴリ (未分類時 null) */
  ai_category: string | null;
  /** AI 生成タイトル */
  ai_title?: string | null;
  /** AI 要約 (長文のみ) */
  ai_summary?: string | null;
  /** ピン留め */
  pinned: boolean;
  /** 作成日時 (Unix ms) */
  created_at: number;
  /** 更新日時 (Unix ms) */
  updated_at: number;
  /** 貼り付け利用回数 */
  use_count: number;
}

/** ユーザー定義タグ */
export interface Tag {
  id: string;
  name: string;
  color: string;
}

export function isTag(value: unknown): value is Tag {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.color === 'string'
  );
}

/** 定型文テンプレート */
export interface Template {
  id: string;
  title: string;
  body: string;
  category: string;
  variables: string[];
  use_count: number;
  created_at: number;
  updated_at: number;
}

export function isTemplate(value: unknown): value is Template {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.body === 'string' &&
    typeof record.category === 'string' &&
    Array.isArray(record.variables) &&
    record.variables.every((variable) => typeof variable === 'string') &&
    typeof record.use_count === 'number' &&
    typeof record.created_at === 'number' &&
    typeof record.updated_at === 'number'
  );
}

/** UI テーマ */
export type Theme = 'auto' | 'light' | 'dark';

/** ユーザー設定 */
export interface Settings {
  /** 保存クリップ数の上限 */
  max_clips: number;
  /** 保持日数 */
  retention_days: number;
  /** UI テーマ */
  theme: Theme;
  /** AI 機能の有効化 */
  ai_enabled: boolean;
  /** キーボードショートカット */
  shortcuts: {
    /** ポップアップを開くショートカット */
    open_popup: string;
  };
  /** Gemini API キー (Premium BYO、未設定時は省略) */
  gemini_api_key?: string;
}

const THEMES: readonly Theme[] = ['auto', 'light', 'dark'];

export function isSettings(value: unknown): value is Settings {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const shortcuts = record.shortcuts;
  return (
    typeof record.max_clips === 'number' &&
    typeof record.retention_days === 'number' &&
    typeof record.theme === 'string' &&
    THEMES.includes(record.theme as Theme) &&
    typeof record.ai_enabled === 'boolean' &&
    typeof shortcuts === 'object' &&
    shortcuts !== null &&
    typeof (shortcuts as Record<string, unknown>).open_popup === 'string' &&
    (record.gemini_api_key === undefined || typeof record.gemini_api_key === 'string')
  );
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
    (record.source_favicon_url === undefined || typeof record.source_favicon_url === 'string') &&
    Array.isArray(record.tag_ids) &&
    record.tag_ids.every((tagId) => typeof tagId === 'string') &&
    (record.ai_category === null || typeof record.ai_category === 'string') &&
    (record.ai_title === undefined ||
      record.ai_title === null ||
      typeof record.ai_title === 'string') &&
    (record.ai_summary === undefined ||
      record.ai_summary === null ||
      typeof record.ai_summary === 'string') &&
    typeof record.pinned === 'boolean' &&
    typeof record.created_at === 'number' &&
    typeof record.updated_at === 'number' &&
    typeof record.use_count === 'number'
  );
}

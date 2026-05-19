import { getItem, setItem, STORAGE_KEYS } from '../lib/storage';
import type { ClipTypeFilter, DateRangeFilter } from './filter';
import type { SortMode } from './sort';

export type PopupUiState = {
  query: string;
  type: ClipTypeFilter;
  dateRange: DateRangeFilter;
  sort: SortMode;
  tagIds: string[];
};

const POPUP_STATE_KEY = STORAGE_KEYS.popup_state;

export const DEFAULT_POPUP_STATE: PopupUiState = {
  query: '',
  type: 'all',
  dateRange: 'all',
  sort: 'pinned_first',
  tagIds: [],
};

export async function loadPopupState(): Promise<PopupUiState> {
  const stored = await getItem<Partial<PopupUiState> | null>(POPUP_STATE_KEY, null);
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_POPUP_STATE };
  }
  return { ...DEFAULT_POPUP_STATE, ...stored };
}

export async function savePopupState(state: PopupUiState): Promise<void> {
  await setItem(POPUP_STATE_KEY, state);
}

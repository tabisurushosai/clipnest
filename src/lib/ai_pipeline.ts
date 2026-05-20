import {
  generateClipCategory,
  generateClipSummary,
  generateClipTitle,
  shouldGenerateSummary,
} from './ai';
import { getAiCache, hashClipBody, setAiCache } from './ai_cache';
import { enqueue } from './ai_queue';
import { incrementAiUsage } from './ai_usage';
import { getClip, getSettings, updateClip } from './db';
import { getLicense, recordAiAuthFailure } from './license';
import type { Clip } from './types';

async function applyCachedAiFields(clipId: string, cached: Awaited<ReturnType<typeof getAiCache>>): Promise<void> {
  if (!cached) {
    return;
  }
  const patch: Partial<Clip> = {};
  if (cached.ai_title) {
    patch.ai_title = cached.ai_title;
  }
  if (cached.ai_category) {
    patch.ai_category = cached.ai_category;
  }
  if (cached.ai_summary) {
    patch.ai_summary = cached.ai_summary;
  }
  if (Object.keys(patch).length > 0) {
    await updateClip(clipId, patch);
  }
}

export function scheduleAiForClip(clip: Clip): void {
  void enqueue(async () => {
    const settings = await getSettings();
    if (!settings.ai_enabled || !settings.gemini_api_key) {
      return;
    }

    const license = await getLicense();
    if (license.tier === 'free') {
      return;
    }

    const apiKey = settings.gemini_api_key;
    const hash = await hashClipBody(clip.content);
    const cached = await getAiCache(hash);
    if (cached) {
      await applyCachedAiFields(clip.id, cached);
      return;
    }

    try {
      const title = settings.ai_auto_title ? await generateClipTitle(clip, apiKey) : undefined;
      const category = settings.ai_auto_category
        ? await generateClipCategory(clip, apiKey)
        : undefined;
      const patch: Partial<Clip> = {};
      if (title) {
        patch.ai_title = title;
      }
      if (category) {
        patch.ai_category = category;
      }
      let summary: string | undefined;
      if (settings.ai_auto_summary && shouldGenerateSummary(clip)) {
        summary = await generateClipSummary(clip, apiKey);
        patch.ai_summary = summary;
      }
      await updateClip(clip.id, patch);
      await setAiCache(hash, {
        ai_title: title,
        ai_category: category,
        ai_summary: summary,
      });
      await incrementAiUsage();
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 401) {
        await recordAiAuthFailure();
      }
      throw error;
    }
  }).catch((error) => {
    globalThis.console.warn('[clipnest] AI pipeline failed', error);
  });
}

export async function refreshClipAfterAi(clipId: string): Promise<Clip | null> {
  return getClip(clipId);
}

import type { Clip } from './types';

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const AI_CATEGORIES = [
  'Code',
  'URL',
  'Note',
  'Quote',
  'Address',
  'Email',
  'Phone',
  'Other',
] as const;

export type AiCategory = (typeof AI_CATEGORIES)[number];

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { code?: number; message?: string };
};

export async function callGemini(
  apiKey: string,
  prompt: string,
  opts?: { temperature?: number },
): Promise<string> {
  const url = `${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts?.temperature ?? 0.3,
      },
    }),
  });

  if (!response.ok) {
    const error = new Error(`Gemini API error: ${response.status}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  const payload = (await response.json()) as GeminiResponse;
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error('Gemini API returned empty response');
  }
  return text;
}

export async function generateClipTitle(clip: Clip, apiKey: string): Promise<string> {
  const body = clip.content.slice(0, 500);
  const prompt = `Generate a 5-10 word title for this clipboard content:\n\n${body}`;
  return callGemini(apiKey, prompt);
}

export async function generateClipCategory(clip: Clip, apiKey: string): Promise<AiCategory> {
  const body = clip.content.slice(0, 500);
  const prompt = `Classify this clipboard content into exactly one of: ${AI_CATEGORIES.join(', ')}. Reply with only the category name.\n\n${body}`;
  const raw = await callGemini(apiKey, prompt);
  const match = AI_CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase());
  return match ?? 'Other';
}

export async function generateClipSummary(clip: Clip, apiKey: string): Promise<string> {
  const prompt = `Summarize the following text in at most 100 characters:\n\n${clip.content.slice(0, 4000)}`;
  return callGemini(apiKey, prompt);
}

export async function translateClip(
  clip: Clip,
  targetLang: string,
  apiKey: string,
): Promise<string> {
  const prompt = `Translate the following text to ${targetLang}. Reply with translation only:\n\n${clip.content.slice(0, 4000)}`;
  return callGemini(apiKey, prompt);
}

export function shouldGenerateSummary(clip: Clip): boolean {
  return clip.content.length > 500;
}

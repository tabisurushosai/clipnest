export function getMessage(key: string, substitutions?: string | string[]): string {
  const i18n = (
    globalThis as {
      chrome?: { i18n?: { getMessage: (name: string, subs?: string | string[]) => string } };
    }
  ).chrome?.i18n;
  const subs = substitutions === undefined ? undefined : Array.isArray(substitutions) ? substitutions : [substitutions];
  return i18n?.getMessage(key, subs) ?? key;
}

export function getUiLanguage(): string {
  return (
    globalThis as { chrome?: { i18n?: { getUILanguage?: () => string } } }
  ).chrome?.i18n?.getUILanguage?.() ?? 'en';
}

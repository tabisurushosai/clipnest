interface ChromeI18n {
  getMessage: (key: string) => string | undefined;
}

interface ChromeGlobal {
  i18n?: ChromeI18n;
}

export function t(key: string): string {
  const chromeApi = (globalThis as { chrome?: ChromeGlobal }).chrome;
  if (chromeApi?.i18n) {
    const message = chromeApi.i18n.getMessage(key);
    if (message) {
      return message;
    }
  }
  return key;
}

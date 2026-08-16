export type LocaleText = { fr: string; en: string };

export function loc(lang: string, text: LocaleText): string {
  return lang.toLowerCase().startsWith('en') ? text.en : text.fr;
}

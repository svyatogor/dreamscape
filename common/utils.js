export function t(i18nString, locale, fallback) {
  return i18nString && (i18nString[locale] || i18nString[fallback||'en'] || '')
}

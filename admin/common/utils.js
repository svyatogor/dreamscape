import {isObject} from 'lodash'

export function t(i18nString, locale, fallback) {
  if (!isObject(i18nString)) {
    return i18nString
  }
  if (Object.keys(i18nString).length === 1) {
    const locale = Object.keys(i18nString)[0]
    return i18nString[locale]
  }
  return i18nString && (i18nString[locale] || i18nString[fallback||'en'] || '')
}

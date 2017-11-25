import {isString} from 'lodash'

export function t(i18nString, locale, fallback) {
  if (isString(i18nString)) {
    return i18nString
  }
  return i18nString && (i18nString[locale] || i18nString[fallback||'en'] || '')
}

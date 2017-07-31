import {find, get} from 'lodash'

const t = (i18nString, locale, fallback = 'en') => {
  let value = get(find(i18nString, {locale}), 'value')
  if (!value && locale !== fallback) {
    return t(i18nString, fallback, fallback)
  } else {
    return value
  }
}

export {t}
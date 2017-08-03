import {get} from 'lodash'

const t = (i18nString, locale, fallback = 'en') => i18nString && (i18nString[locale] || i18nString[fallback] || '')

export {t}
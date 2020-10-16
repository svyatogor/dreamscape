import { isMap, isObject } from 'lodash'
import memoizee = require('memoizee')

export function t(i18nString: string | Map<string, string> | any, locale: string, fallback = 'en') {
  if (isMap(i18nString)) {
    return i18nString.get(locale) || i18nString.get(fallback || 'en')
  }
  if (!isObject(i18nString)) {
    return i18nString
  }
  if (Object.keys(i18nString).length === 1) {
    const locale = Object.keys(i18nString)[0]
    return i18nString[locale]
  }
  return i18nString && (i18nString[locale] || i18nString[fallback] || '')
}

export const memoize = (args: memoizee.Options<any> = {}): MethodDecorator => {
  return (_: any, __: string, descriptor: PropertyDescriptor) => {
    const func = descriptor.value
    descriptor.value = memoizee(func, args)
    return descriptor
  }
}
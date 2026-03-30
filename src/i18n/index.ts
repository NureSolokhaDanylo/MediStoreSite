import { createI18n } from 'vue-i18n'
import { messages } from './messages'

export const SUPPORTED_LOCALES = ['uk', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const STORAGE_KEY = 'app_locale'
const DEFAULT_LOCALE: SupportedLocale = 'uk'
const FALLBACK_LOCALE: SupportedLocale = 'en'

function resolveInitialLocale(): SupportedLocale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
    return stored as SupportedLocale
  }

  const browser = navigator.language.toLowerCase()
  if (browser.startsWith('uk')) return 'uk'
  if (browser.startsWith('en')) return 'en'

  return DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: FALLBACK_LOCALE,
  messages,
})

export function setLocale(locale: SupportedLocale): void {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
}

export function getLocale(): SupportedLocale {
  return i18n.global.locale.value as SupportedLocale
}


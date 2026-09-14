import { ref, computed } from 'vue'
import zh from './locales/zh'
import en from './locales/en'
import { pluginNameMap, categoryNameMap, propertyLabelMap } from './pluginNames'

export type Lang = 'zh' | 'en'

const STORAGE_KEY = 'scenelab_lang'

const getInitialLang = (): Lang => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh' || saved === 'en') return saved
  } catch (e) {
    // ignore
  }
  return 'zh'
}

export const lang = ref<Lang>(getInitialLang())

const dictionaries: Record<Lang, Record<string, string>> = { zh, en }

export const messages = computed(() => dictionaries[lang.value])

/**
 * Translate a key to the current language.
 * Supports {0}, {1}, ... placeholder interpolation.
 * Returns the key itself if no translation is found.
 */
export function t(key: string, ...args: (string | number)[]): string {
  const dict = dictionaries[lang.value]
  let str = dict[key] ?? key
  if (args.length > 0) {
    args.forEach((val, i) => {
      str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), String(val))
    })
  }
  return str
}

/**
 * Set the language and persist to localStorage.
 */
export function setLang(next: Lang) {
  lang.value = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch (e) {
    // ignore
  }
}

/**
 * Toggle between zh and en.
 */
export function toggleLang() {
  setLang(lang.value === 'zh' ? 'en' : 'zh')
}

/**
 * Translate a plugin (object) display name by its key.
 * Falls back to the original name if no mapping exists.
 */
export function tPluginName(key: string, fallback: string): string {
  const map = pluginNameMap[lang.value]
  return map[key] ?? fallback
}

/**
 * Translate a category (sidebar group) display name by its id.
 * Falls back to the original name if no mapping exists.
 */
export function tCategoryName(id: string, fallback: string): string {
  const map = categoryNameMap[lang.value]
  return map[id] ?? fallback
}

/**
 * Translate a property / enum display label (defined in Chinese in entity code).
 * Falls back to the original label if no mapping exists.
 */
export function tLabel(label: string): string {
  const map = propertyLabelMap[lang.value]
  return map[label] ?? label
}

export default { lang, t, setLang, toggleLang, tPluginName, tCategoryName, tLabel }

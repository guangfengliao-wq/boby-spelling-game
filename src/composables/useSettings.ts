import { readonly, ref } from 'vue'

const STORAGE_KEY = 'keySoundEnabled'
const keySoundEnabled = ref(localStorage.getItem(STORAGE_KEY) !== 'false')
const ALL_WORDS_KEY = 'dictateAllWords'
const dictateAllWords = ref(localStorage.getItem(ALL_WORDS_KEY) === 'true')

export function useSettings() {
  function toggleKeySound() {
    keySoundEnabled.value = !keySoundEnabled.value
    localStorage.setItem(STORAGE_KEY, String(keySoundEnabled.value))
  }

  function toggleDictateAllWords() {
    dictateAllWords.value = !dictateAllWords.value
    localStorage.setItem(ALL_WORDS_KEY, String(dictateAllWords.value))
  }

  return { keySoundEnabled: readonly(keySoundEnabled), toggleKeySound, dictateAllWords: readonly(dictateAllWords), toggleDictateAllWords }
}

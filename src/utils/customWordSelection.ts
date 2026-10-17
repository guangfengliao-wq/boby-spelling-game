import { getAllUnits } from './wordLoader'

export function getSelectionEntries(semesterId: string) {
  return getAllUnits(semesterId).flatMap(unit => unit.words.map((word, wordIndex) => ({
    ...word, unitId: unit.id, wordIndex, key: JSON.stringify([unit.id, wordIndex, word.en, word.cn])
  })))
}

export function selectionStorageKey(semesterId: string, learning: boolean) {
  return `${learning ? 'customLearningSelection' : 'customDictationSelection'}:${semesterId}`
}

export function loadSelectionKeys(semesterId: string, learning: boolean): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(selectionStorageKey(semesterId, learning)) ?? '[]')
    const valid = new Set(getSelectionEntries(semesterId).map(entry => entry.key))
    return Array.isArray(saved) ? saved.filter((key): key is string => typeof key === 'string' && valid.has(key)) : []
  } catch { return [] }
}

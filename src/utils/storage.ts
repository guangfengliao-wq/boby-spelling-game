import { normalizeUnitId } from './wordLoader'

export interface PlayerProfile {
  totalScore: number
  bestStreak: number
  currentStreak: number
  errorWords: ErrorWord[]
}

export interface ErrorWord {
  en: string
  cn: string
  unitId: string
  errorCount: number
  lastError: number
}

const STORAGE_KEY = 'playerProfile'

export function loadPlayerProfile(): PlayerProfile {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    return {
      totalScore: 0,
      bestStreak: 0,
      currentStreak: 0,
      errorWords: []
    }
  }
  const profile: PlayerProfile = JSON.parse(data)
  profile.errorWords = profile.errorWords.map((word) => ({ ...word, unitId: normalizeUnitId(word.unitId) }))
  return profile
}

export function savePlayerProfile(profile: PlayerProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function addErrorWord(word: { en: string; cn: string }, unitId: string): void {
  const profile = loadPlayerProfile()
  const existing = profile.errorWords.find((w) => w.en === word.en && w.unitId === unitId)

  if (existing) {
    existing.errorCount++
    existing.lastError = Date.now()
  } else {
    profile.errorWords.push({
      ...word,
      unitId,
      errorCount: 1,
      lastError: Date.now()
    })
  }

  savePlayerProfile(profile)
}

export function getErrorWords(unitId?: string): ErrorWord[] {
  const profile = loadPlayerProfile()
  let errors = profile.errorWords

  if (unitId) {
    errors = errors.filter((w) => w.unitId === unitId)
  }

  return errors.sort((a, b) => b.errorCount - a.errorCount)
}

export function updateStreak(correct: boolean, score: number): PlayerProfile {
  const profile = loadPlayerProfile()

  if (correct) {
    profile.currentStreak++
    profile.bestStreak = Math.max(profile.bestStreak, profile.currentStreak)
  } else {
    profile.currentStreak = 0
  }

  profile.totalScore += score

  savePlayerProfile(profile)
  return profile
}

export function resetPlayerData(): void {
  const emptyProfile: PlayerProfile = {
    totalScore: 0,
    bestStreak: 0,
    currentStreak: 0,
    errorWords: []
  }
  savePlayerProfile(emptyProfile)
}

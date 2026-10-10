import { ref, computed } from 'vue'
import {
  loadPlayerProfile,
  savePlayerProfile,
  addErrorWord,
  getErrorWords,
  updateStreak,
  resetPlayerData,
  type PlayerProfile,
  type ErrorWord
} from '../utils/storage'

export function usePlayerProfile() {
  const profile = ref<PlayerProfile>(loadPlayerProfile())

  const totalScore = computed(() => profile.value.totalScore)
  const bestStreak = computed(() => profile.value.bestStreak)
  const currentStreak = computed(() => profile.value.currentStreak)
  const errorWords = computed(() => profile.value.errorWords)

  function recordErrorWord(word: { en: string; cn: string }, unitId: string) {
    addErrorWord(word, unitId)
    profile.value = loadPlayerProfile()
  }

  function getErrorWordsByUnit(unitId: string): ErrorWord[] {
    return getErrorWords(unitId)
  }

  function updateScore(isCorrect: boolean, points: number = 10) {
    profile.value = updateStreak(isCorrect, points)
  }

  function save() {
    savePlayerProfile(profile.value)
  }

  function reload() {
    profile.value = loadPlayerProfile()
  }

  function resetData() {
    resetPlayerData()
    profile.value = loadPlayerProfile()
  }

  return {
    profile,
    totalScore,
    bestStreak,
    currentStreak,
    errorWords,
    recordErrorWord,
    getErrorWordsByUnit,
    updateScore,
    save,
    reload,
    resetData
  }
}

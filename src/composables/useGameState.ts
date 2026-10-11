import { ref, computed } from 'vue'
import type { Word } from '../utils/wordLoader'
import { getRandomWords, normalizeUnitId, getUnit } from '../utils/wordLoader'
import { useSemester } from './useSemester'
import { useSettings } from './useSettings'
import { saveDictationRecord } from '../utils/career'

// 模块级单例状态，所有页面共享同一份数据
const currentUnitId = ref('')
const isCustom = ref(false)
const currentQuestionIndex = ref(0)
const questions = ref<(Word & { unitId?: string })[]>([])
const score = ref(0)
const answered = ref<{ word: Word; correct: boolean }[]>([])
const elapsedSeconds = ref(0)       // 本局已用秒数
const gameStartTime = ref(0)        // 游戏开始时间戳
let sessionId = ''
let tickTimer: ReturnType<typeof setInterval> | null = null

const GAME_STATE_KEY = 'vue_word_game_state'

interface GameState {
  isCustom?: boolean
  sessionId?: string
  startedAt?: number
  currentUnitId: string
  currentQuestionIndex: number
  questions: (Word & { unitId?: string })[]
  score: number
  answered: { word: Word; correct: boolean }[]
  elapsedSeconds: number
}

function saveGameState() {
  const state: GameState = {
    isCustom: isCustom.value,
    sessionId,
    startedAt: gameStartTime.value,
    currentUnitId: currentUnitId.value,
    currentQuestionIndex: currentQuestionIndex.value,
    questions: questions.value,
    score: score.value,
    answered: answered.value,
    elapsedSeconds: elapsedSeconds.value
  }
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state))
}

function loadGameState(): GameState | null {
  const saved = localStorage.getItem(GAME_STATE_KEY)
  return saved ? JSON.parse(saved) : null
}

function clearGameState() {
  localStorage.removeItem(GAME_STATE_KEY)
}

function restoreGameState(state: GameState) {
  isCustom.value = state.isCustom ?? false
  sessionId = state.sessionId || crypto.randomUUID()
  gameStartTime.value = state.startedAt || Date.now()
  currentUnitId.value = normalizeUnitId(state.currentUnitId)
  const unit = getUnit(currentUnitId.value)
  if (unit) useSemester().selectSemester(unit.semesterId)
  currentQuestionIndex.value = state.currentQuestionIndex
  questions.value = state.questions
  score.value = state.score
  answered.value = state.answered
  elapsedSeconds.value = state.elapsedSeconds
  // 恢复后继续计时
  startTick()
  saveGameState()
}

function startTick() {
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = setInterval(() => { elapsedSeconds.value++ }, 1000)
}

function stopTick() {
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null }
}

export function useGameState() {

  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
  const questionsRemaining = computed(() => questions.value.length - currentQuestionIndex.value)
  const isGameEnd = computed(() => currentQuestionIndex.value >= questions.value.length)

  function startGame(unitId: string, questionCount?: number) {
    const count = questionCount ?? (useSettings().dictateAllWords.value ? getUnit(unitId)?.words.length ?? 0 : 10)
    beginGame(unitId, getRandomWords(unitId, count), false)
  }

  function startCustomGame(selections: { unitId: string; wordIndex: number }[]) {
    const seen = new Set<string>()
    const selected = selections.flatMap(({ unitId, wordIndex }) => {
      const unit = getUnit(unitId)
      const word = unit?.words[wordIndex]
      const key = `${unit?.id}:${wordIndex}`
      if (!word || unit?.semesterId !== useSemester().selectedSemesterId.value || seen.has(key)) return []
      seen.add(key)
      return [{ ...word, unitId: unit.id }]
    })
    if (!selected.length) return false
    for (let i = selected.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[selected[i], selected[j]] = [selected[j], selected[i]]
    }
    beginGame(selected[0].unitId, selected, true)
    return true
  }

  function beginGame(unitId: string, wordList: (Word & { unitId?: string })[], custom: boolean) {
    isCustom.value = custom
    sessionId = crypto.randomUUID()
    gameStartTime.value = Date.now()
    elapsedSeconds.value = 0
    currentUnitId.value = unitId
    currentQuestionIndex.value = 0
    score.value = 0
    answered.value = []
    questions.value = wordList
    startTick()
    saveGameState()
  }

  function submitAnswer(answer: string) {
    if (!currentQuestion.value) return

    const correct = answer.toLowerCase().trim() === currentQuestion.value.en.toLowerCase()

    if (correct) {
      score.value += 10
    }

    answered.value.push({
      word: currentQuestion.value,
      correct
    })

    currentQuestionIndex.value++
    saveGameState()  // 答题后保存状态
    const unit = getUnit(currentUnitId.value)
    saveDictationRecord({
      id: sessionId,
      startedAt: gameStartTime.value,
      updatedAt: Date.now(),
      semesterName: unit?.semesterName ?? '',
      unitName: isCustom.value ? '自定义默写' : unit?.name ?? currentUnitId.value,
      unitId: currentUnitId.value,
      score: score.value,
      elapsedSeconds: elapsedSeconds.value,
      totalQuestions: questions.value.length,
      completed: currentQuestionIndex.value >= questions.value.length,
      answers: answered.value
    })

    // 最后一题提交后停止计时
    if (currentQuestionIndex.value >= questions.value.length) {
      stopTick()
      clearGameState()  // 游戏结束，清除保存的状态
    }
  }

  function nextQuestion() {
    if (!isGameEnd.value) {
      currentQuestionIndex.value++
    }
  }

  function resetGame() {
    isCustom.value = false
    currentUnitId.value = ''
    currentQuestionIndex.value = 0
    questions.value = []
    score.value = 0
    answered.value = []
    elapsedSeconds.value = 0
    stopTick()
    clearGameState()
  }

  return {
    isCustom,
    startCustomGame,
    currentUnitId,
    currentQuestionIndex,
    questions,
    score,
    answered,
    elapsedSeconds,
    currentQuestion,
    questionsRemaining,
    isGameEnd,
    startGame,
    submitAnswer,
    nextQuestion,
    resetGame,
    loadGameState,
    restoreGameState,
    clearGameState
  }
}

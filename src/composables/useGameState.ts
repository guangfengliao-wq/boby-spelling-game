import { ref, computed } from 'vue'
import type { Word } from '../utils/wordLoader'
import { getRandomWords, normalizeUnitId, getUnit } from '../utils/wordLoader'
import { useSemester } from './useSemester'
import { useSettings } from './useSettings'
import { saveDictationRecord } from '../utils/career'

// 模块级单例状态，所有页面共享同一份数据
const currentUnitId = ref('')
const currentQuestionIndex = ref(0)
const questions = ref<Word[]>([])
const score = ref(0)
const answered = ref<{ word: Word; correct: boolean }[]>([])
const elapsedSeconds = ref(0)       // 本局已用秒数
const gameStartTime = ref(0)        // 游戏开始时间戳
let sessionId = ''
let tickTimer: ReturnType<typeof setInterval> | null = null

const GAME_STATE_KEY = 'vue_word_game_state'

interface GameState {
  sessionId?: string
  startedAt?: number
  currentUnitId: string
  currentQuestionIndex: number
  questions: Word[]
  score: number
  answered: { word: Word; correct: boolean }[]
  elapsedSeconds: number
}

function saveGameState() {
  const state: GameState = {
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
    sessionId = crypto.randomUUID()
    gameStartTime.value = Date.now()
    elapsedSeconds.value = 0
    currentUnitId.value = unitId
    currentQuestionIndex.value = 0
    score.value = 0
    answered.value = []
    const count = questionCount ?? (useSettings().dictateAllWords.value ? getUnit(unitId)?.words.length ?? 0 : 10)
    questions.value = getRandomWords(unitId, count)
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
      unitName: unit?.name ?? currentUnitId.value,
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

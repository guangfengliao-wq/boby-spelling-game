import { computed, ref } from 'vue'
import { getUnit } from '../utils/wordLoader'
import { getSelectionEntries, loadSelectionKeys } from '../utils/customWordSelection'
import { useSemester } from './useSemester'
import { useGameState } from './useGameState'

// Learning stays separate from dictation saves, scores and error records.
export function useLearningState(unitId: string, custom = false) {
  const { selectedSemesterId } = useSemester()
  const selectedKeys = new Set(custom ? loadSelectionKeys(selectedSemesterId.value, true) : [])
  const customEntries = custom
    ? getSelectionEntries(selectedSemesterId.value).filter(entry => selectedKeys.has(entry.key))
    : []
  const currentUnitId = ref(unitId)
  const questions = ref(custom
    ? customEntries
    : getUnit(unitId)?.words.slice() ?? [])
  const currentQuestionIndex = ref(0)
  const score = ref(0)
  const elapsedSeconds = ref(0)
  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
  const isGameEnd = computed(() => currentQuestionIndex.value >= questions.value.length)
  function submitAnswer(answer: string) {
    if (currentQuestion.value && answer.toLowerCase() === currentQuestion.value.en.toLowerCase()) {
      currentQuestionIndex.value++
    }
  }
  function startDictation() {
    if (!questions.value.length) return false
    const game = useGameState()
    if (custom) return game.startCustomGame(customEntries)
    game.startGame(currentUnitId.value)
    return true
  }
  return { currentUnitId, questions, currentQuestionIndex, score, elapsedSeconds, currentQuestion, isGameEnd, submitAnswer, startDictation }
}

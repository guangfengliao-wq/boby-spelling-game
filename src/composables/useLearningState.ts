import { computed, ref } from 'vue'
import { getUnit } from '../utils/wordLoader'

// Learning stays separate from dictation saves, scores and error records.
export function useLearningState(unitId: string) {
  const currentUnitId = ref(unitId)
  const questions = ref(getUnit(unitId)?.words.slice() ?? [])
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
  return { currentUnitId, questions, currentQuestionIndex, score, elapsedSeconds, currentQuestion, isGameEnd, submitAnswer }
}

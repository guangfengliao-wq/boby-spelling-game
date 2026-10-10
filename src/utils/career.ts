import type { Word } from './wordLoader'

export interface DictationRecord {
  id: string
  startedAt: number
  updatedAt: number
  semesterName: string
  unitName: string
  unitId: string
  score: number
  elapsedSeconds: number
  totalQuestions: number
  completed: boolean
  answers: { word: Word; correct: boolean }[]
}

const KEY = 'dictationCareer'

export function loadCareer(): DictationRecord[] {
  const data = localStorage.getItem(KEY)
  return data ? JSON.parse(data) : []
}

export function saveDictationRecord(record: DictationRecord) {
  const records = loadCareer().filter((item) => item.id !== record.id)
  records.push(record)
  localStorage.setItem(KEY, JSON.stringify(records))
}

export function clearCareer() {
  localStorage.removeItem(KEY)
}

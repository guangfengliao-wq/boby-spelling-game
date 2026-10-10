import { ref } from 'vue'
import { DEFAULT_SEMESTER_ID, getSemesters } from '../utils/wordLoader'

const STORAGE_KEY = 'selectedSemester'
const saved = localStorage.getItem(STORAGE_KEY)
const selectedSemesterId = ref(getSemesters().some((semester) => semester.id === saved)
  ? saved! : DEFAULT_SEMESTER_ID)

export function useSemester() {
  function selectSemester(id: string) {
    if (!getSemesters().some((semester) => semester.id === id)) return
    selectedSemesterId.value = id
    localStorage.setItem(STORAGE_KEY, id)
  }
  return { selectedSemesterId, selectSemester }
}

import words from '../data/words.json'
import { PHONETICS_ID } from '../data/phonetics'

export interface Word {
  en: string
  cn: string
}

export interface Unit {
  id: string
  name: string
  words: Word[]
  semesterId: string
  semesterName: string
}

export const DEFAULT_SEMESTER_ID = 'grade-3-2'

export function getSemesters() {
  return [...words.semesters, { id: PHONETICS_ID, name: '音标学习', units: [] }]
}

// Older saves used unqualified unit IDs and all belong to grade 3, term 2.
export function normalizeUnitId(id: string): string {
  return id && !id.includes('/') ? `${DEFAULT_SEMESTER_ID}/${id}` : id
}

export function getAllUnits(semesterId?: string): Unit[] {
  return words.semesters.filter((semester) => !semesterId || semester.id === semesterId)
    .flatMap((semester) => semester.units.map((unit) => ({
      ...unit,
      id: `${semester.id}/${unit.id}`,
      semesterId: semester.id,
      semesterName: semester.name
    })))
}

export function getUnit(id: string): Unit | undefined {
  return getAllUnits().find((unit) => unit.id === normalizeUnitId(id))
}

export function getRandomWords(unitId: string, count: number): Word[] {
  const unit = getUnit(unitId)
  if (!unit) return []

  const wordList = [...unit.words]
  const selected = []

  for (let i = 0; i < count && wordList.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length)
    selected.push(wordList[randomIndex])
    wordList.splice(randomIndex, 1)
  }

  return selected
}

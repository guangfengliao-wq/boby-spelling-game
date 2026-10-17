import phonetics from '../data/wordPhonetics.json'

const entries: Record<string, string> = phonetics
export function getWordPhonetic(text: string): string {
  return entries[text.trim().toLowerCase().replace(/\s+/g, ' ')] ?? ''
}

import manifest from '../data/wordAudio.json'

const sources: Record<string, string> = manifest
const keyFor = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ')
export const hasWordAudio = (text: string) => Boolean(sources[keyFor(text)])

export function createWordAudioPlayer() {
  let active: HTMLAudioElement | null = null
  let playbackId = 0
  let completion: Promise<void> = Promise.resolve()
  let resolveCompletion: (() => void) | undefined
  function stop() {
    playbackId++
    resolveCompletion?.()
    resolveCompletion = undefined
    if (!active) return
    active.onended = null
    active.onerror = null
    active.pause()
    active.removeAttribute('src')
    active.load()
    active = null
  }
  function play(text: string, onError: (message: string) => void, onEnded?: () => void) {
    stop()
    const source = sources[keyFor(text)]
    if (!source) { onError('这个单词暂无内置录音。'); return }
    completion = new Promise<void>(resolve => { resolveCompletion = resolve })
    const id = playbackId
    const player = new Audio(source)
    active = player
    const fail = () => {
      if (id !== playbackId) return
      stop()
      onError('录音暂时无法播放，请重试。')
    }
    player.onerror = fail
    player.onended = () => {
      if (id !== playbackId) return
      stop()
      onEnded?.()
    }
    player.play().catch(fail)
  }
  return { play, stop, whenFinished: () => completion }
}

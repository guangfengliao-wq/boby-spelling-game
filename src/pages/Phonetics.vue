<template>
  <div class="phonetics-page">
    <button class="back-button" @click="router.push('/')">← 返回首页</button>
    <main>
      <h1>音标学习</h1>
      <p class="subtitle">{{ phoneticCount }} 个音标 · 看音标，听例词，跟着读</p>
      <div class="groups" role="group" aria-label="音标分类">
        <button v-for="(group, i) in phoneticGroups" :key="group.name" :aria-pressed="groupIndex === i" :class="{ active: groupIndex === i }" @click="chooseGroup(i)">{{ group.name }} <span>{{ group.entries.length }}</span></button>
      </div>
      <section class="study-card">
        <p class="position">{{ currentGroup.name }} · {{ entryIndex + 1 }} / {{ currentGroup.entries.length }} · {{ phoneticAudioSource(entry[0]) }}</p>
        <div class="symbol">/{{ entry[0] }}/<button class="speaker phoneme-speaker" :class="{ playing: repeatNumber > 0 }" @click="speakPhoneme" :aria-label="`播放音标 /${entry[0]}/ 三遍`" title="音标读三遍"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg></button></div>
        <p class="repeat-status" role="status">{{ repeatNumber ? `音标跟读 · 第 ${repeatNumber} / 3 遍` : '点击音标旁的喇叭，连续听三遍' }}</p>
        <div class="example"><strong lang="en">{{ entry[1] }}</strong><button class="speaker" :disabled="!canSpeak" @click="speak" aria-label="播放例词发音" title="播放例词发音"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg></button></div>
        <p class="meaning">{{ entry[2] }}</p>
        <p class="audio-note" :class="{ error: speechError || !canSpeak }" role="status">{{ speechError || (canSpeak ? '点击喇叭听例词，跟读并留意对应的音。' : '这个例词暂无内置录音。') }}</p>
        <div class="navigation"><button :disabled="atStart" @click="move(-1)">← 上一个</button><button :disabled="atEnd" @click="move(1)">下一个 →</button></div>
        <p v-if="atEnd" class="audio-note">已到最后一个音标，可切换分类继续复习。</p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PHONETICS_ID, phoneticGroups, phoneticCount } from '../data/phonetics'
import { useSemester } from '../composables/useSemester'
import { phoneticAudio, phoneticAudioSource } from '../data/phoneticAudio'
import { createWordAudioPlayer, hasWordAudio } from '../utils/wordAudio'
const router = useRouter()
useSemester().selectSemester(PHONETICS_ID)
const groupIndex = ref(0)
const entryIndex = ref(0)
const currentGroup = computed(() => phoneticGroups[groupIndex.value])
const entry = computed(() => currentGroup.value.entries[entryIndex.value])
const atStart = computed(() => groupIndex.value === 0 && entryIndex.value === 0)
const atEnd = computed(() => groupIndex.value === phoneticGroups.length - 1 && entryIndex.value === currentGroup.value.entries.length - 1)
const canSpeak = computed(() => hasWordAudio(entry.value[1]))
const wordPlayer = createWordAudioPlayer()
const speechError = ref('')
const repeatNumber = ref(0)
let phonemePlayer: HTMLAudioElement | null = null
let repeatTimer: ReturnType<typeof setTimeout> | undefined
let playbackId = 0
function stopSpeech() {
  playbackId++
  if (repeatTimer) clearTimeout(repeatTimer)
  repeatTimer = undefined
  if (phonemePlayer) {
    phonemePlayer.onended = null
    phonemePlayer.onerror = null
    phonemePlayer.pause()
    phonemePlayer = null
  }
  repeatNumber.value = 0
  wordPlayer.stop()
  speechError.value = ''
}
function speakPhoneme() {
  stopSpeech()
  const id = playbackId
  const source = phoneticAudio[entry.value[0]]
  if (!source) { speechError.value = '当前音标暂无录音。'; return }
  const player = new Audio(source)
  phonemePlayer = player
  const fail = () => {
    if (id !== playbackId) return
    stopSpeech()
    speechError.value = '音标录音暂时无法播放，请重试。'
  }
  const play = () => {
    if (id !== playbackId) return
    repeatNumber.value++
    player.currentTime = 0
    player.play().catch(fail)
  }
  player.onerror = fail
  player.onended = () => {
    if (id !== playbackId) return
    if (repeatNumber.value < 3) repeatTimer = setTimeout(play, 500)
    else { repeatNumber.value = 0; phonemePlayer = null }
  }
  play()
}
function chooseGroup(i: number) { stopSpeech(); groupIndex.value = i; entryIndex.value = 0 }
function move(direction: number) {
  if ((direction < 0 && atStart.value) || (direction > 0 && atEnd.value)) return
  stopSpeech()
  const next = entryIndex.value + direction
  if (next < 0) { groupIndex.value--; entryIndex.value = currentGroup.value.entries.length - 1 }
  else if (next >= currentGroup.value.entries.length) { groupIndex.value++; entryIndex.value = 0 }
  else entryIndex.value = next
}
function speak() {
  stopSpeech()
  wordPlayer.play(entry.value[1], message => { speechError.value = message })
}
onUnmounted(stopSpeech)
</script>

<style scoped>
/* Older tablet WebViews need vh / fixed fallbacks for spacing and type sizes. */
.phonetics-page { position: fixed; inset: 0; height: 100vh; height: 100dvh; overflow-y: auto; padding: max(72px, calc(env(safe-area-inset-top) + 52px)) 20px max(20px, env(safe-area-inset-bottom)); background: linear-gradient(135deg, #667eea, #764ba2); }
main { width: 100%; max-width: 800px; height: 100%; min-height: 0; margin: auto; display: flex; flex-direction: column; gap: 16px; gap: clamp(12px, 2vh, 20px); text-align: center; color: white; }
h1 { font-size: 28px; font-size: clamp(24px, 4vh, 36px); line-height: 1.2; }
.subtitle { font-size: 14px; opacity: .9; }
.groups { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
button { font: inherit; cursor: pointer; } button:disabled { opacity: .4; cursor: not-allowed; } button:focus-visible { outline: 3px solid #ffe080; outline-offset: 2px; }
.groups button { background: #ffffff26; border: 1px solid #ffffff50; color: white; padding: 10px 6px; border-radius: 12px; font-size: 14px; }
.groups button.active { background: white; color: #6658b8; } .groups span { font-size: 12px; opacity: .7; margin-left: 4px; }
.study-card { flex: 0 0 auto; width: 100%; max-width: 640px; align-self: center; display: flex; flex-direction: column; justify-content: center; gap: 16px; gap: clamp(12px, 2vh, 20px); background: white; border-radius: 24px; padding: 24px; padding: clamp(24px, 3vh, 32px); color: #45405e; box-shadow: 0 12px 32px #30215426; }
.position { color: #88839a; font-size: 14px; }
.symbol { display: flex; align-items: center; justify-content: center; gap: 16px; font-family: 'Segoe UI', 'Arial', sans-serif; font-size: 56px; font-size: clamp(40px, 9vh, 72px); line-height: 1.2; color: #667eea; }
.repeat-status { color: #88839a; font-size: 13px; }
.example { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 24px; font-size: clamp(22px, 3.5vh, 28px); }
.speaker { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; padding: 8px; border: 0; border-radius: 50%; color: #667eea; background: #eef0ff; }
.phoneme-speaker.playing { background: #667eea; color: white; }
.meaning { color: #777; } .audio-note { color: #88839a; font-size: 13px; line-height: 1.4; }
.navigation { display: flex; gap: 16px; margin-top: 12px; padding-top: 6px; }
.navigation button { flex: 1; min-height: 44px; border: 0; border-radius: 12px; background: #eeedff; color: #6658b8; padding: 10px; }
.back-button { position: fixed; top: max(12px, env(safe-area-inset-top)); left: max(16px, env(safe-area-inset-left)); z-index: 50; min-height: 44px; padding: 8px 16px; border: 2px solid #ffffff66; border-radius: 8px; background: #ffffff33; backdrop-filter: blur(4px); color: white; font-size: 14px; font-weight: 600; }
@media (max-width: 600px) { .phonetics-page { padding-left: 12px; padding-right: 12px; } .groups { gap: 6px; } .groups button { font-size: 12px; padding: 8px 2px; } .groups span { margin-left: 2px; } }
@media (max-height: 700px) { .subtitle { display: none; } .audio-note:not(.error) { display: none; } .study-card { gap: 12px; } }
@media (max-height: 500px) and (min-width: 600px) {
  .phonetics-page { padding-top: 64px; padding-bottom: 12px; }
  main { max-width: 960px; display: grid; grid-template-columns: 220px minmax(0, 1fr); grid-template-rows: auto 1fr; gap: 12px; }
  h1 { grid-column: 1; font-size: 24px; }
  .groups { grid-column: 1; grid-row: 2; grid-template-columns: repeat(2, minmax(0, 1fr)); align-content: center; }
  .study-card { grid-column: 2; grid-row: 1 / 3; height: 100%; padding: 12px 20px; gap: 4px; }
  .symbol { font-size: 40px; } .repeat-status { font-size: 12px; } .speaker { width: 36px; height: 36px; } .navigation { margin-top: 8px; padding-top: 0; }
}
</style>

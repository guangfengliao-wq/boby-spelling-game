<template>
  <div class="wordbook-page">
    <div class="wordbook-container">
      <button @click="router.push('/select?mode=learn')">← 返回单元列表</button>
      <h1>单词本</h1>
      <p class="subtitle">{{ semesterName }} · 看音标，听发音，预览全部单词</p>
      <div class="filters">
        <label>单元
          <select v-model="unitFilter">
            <option value="">全部单元</option>
            <option v-for="unit in units" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
          </select>
        </label>
        <label>搜索单词
          <input v-model="search" type="search" placeholder="输入英文或中文" />
        </label>
      </div>
      <p class="count" aria-live="polite">当前显示 {{ visibleEntries.length }} 个 · 英式音标与发音</p>
      <p v-if="speechError" class="error" role="status">{{ speechError }}</p>
      <section v-for="group in groups" :key="group.id" class="unit-section">
        <h2>{{ group.name }} <span>{{ group.entries.length }} 个</span></h2>
        <div class="word-grid">
          <div v-for="entry in group.entries" :key="entry.key" class="word" :class="{ playing: playingKey === entry.key }">
            <div class="word-content">
              <div class="pronunciation"><strong lang="en">{{ entry.en }}</strong><span class="ipa">{{ getWordPhonetic(entry.en) || '音标待补充' }}</span></div>
              <span class="translation">{{ entry.cn }}</span>
            </div>
            <button class="speaker" :class="{ active: playingKey === entry.key }" :disabled="!hasWordAudio(entry.en)" :aria-label="`播放 ${entry.en} 的发音`" :title="playingKey === entry.key ? '重新播放' : '播放发音'" @click="speak(entry)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" /></svg>
            </button>
          </div>
        </div>
      </section>
      <p v-if="!visibleEntries.length" class="empty">{{ entries.length ? '没有符合条件的单词，请调整筛选或搜索。' : '本学期暂无单词，请返回首页选择其他学期。' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSemester } from '../composables/useSemester'
import { getAllUnits, getSemesters } from '../utils/wordLoader'
import { getSelectionEntries } from '../utils/customWordSelection'
import { createWordAudioPlayer, hasWordAudio } from '../utils/wordAudio'
import { getWordPhonetic } from '../utils/wordPhonetics'

const router = useRouter()
const { selectedSemesterId } = useSemester()
const units = computed(() => getAllUnits(selectedSemesterId.value))
const semesterName = computed(() => getSemesters().find(semester => semester.id === selectedSemesterId.value)?.name)
const entries = computed(() => getSelectionEntries(selectedSemesterId.value))
const unitFilter = ref('')
const search = ref('')
const visibleEntries = computed(() => {
  const query = search.value.trim().toLowerCase()
  return entries.value.filter(entry => (!unitFilter.value || entry.unitId === unitFilter.value)
    && (!query || entry.en.toLowerCase().includes(query) || entry.cn.includes(query)))
})
const groups = computed(() => units.value.map(unit => ({
  ...unit, entries: visibleEntries.value.filter(entry => entry.unitId === unit.id)
})).filter(group => group.entries.length))
const player = createWordAudioPlayer()
const playingKey = ref('')
const speechError = ref('')
function stop() {
  player.stop()
  playingKey.value = ''
  speechError.value = ''
}
function speak(entry: typeof entries.value[number]) {
  speechError.value = ''
  playingKey.value = entry.key
  player.play(entry.en, message => {
    playingKey.value = ''
    speechError.value = `${entry.en}：${message}`
  }, () => { playingKey.value = '' })
}
watch([unitFilter, search], stop)
watch(selectedSemesterId, () => { stop(); unitFilter.value = ''; search.value = '' })
onUnmounted(stop)
</script>

<style scoped>
.wordbook-page { min-height: 100vh; width: 100%; background: linear-gradient(135deg, #667eea, #764ba2); padding: max(24px, env(safe-area-inset-top)) 20px max(32px, env(safe-area-inset-bottom)); }
.wordbook-container { max-width: 960px; margin: auto; }
h1 { color: white; text-align: center; margin: 24px 0 8px; font-size: 30px; }
.subtitle { color: white; text-align: center; margin-bottom: 24px; line-height: 1.6; }
button, input, select { font: inherit; }
button { cursor: pointer; min-height: 44px; border: 1px solid #d9dcec; border-radius: 8px; background: white; color: #4f46a5; padding: 8px 14px; }
button:disabled { opacity: .5; cursor: default; }
button:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid #ffc857; outline-offset: 3px; }
.filters { display: flex; flex-wrap: wrap; gap: 10px; padding: 14px; background: white; border-radius: 12px; }
.filters label { flex: 1; min-width: min(180px, 100%); color: #45435c; font-weight: 600; }
select, input { display: block; width: 100%; min-height: 44px; margin-top: 8px; border: 1px solid #c9cadd; border-radius: 8px; padding: 10px; background: white; }
.count { color: white; margin: 16px 0; font-size: 14px; }
.unit-section { background: white; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
h2 { font-size: 18px; color: #39364f; margin: 4px 0 12px; }
h2 span { font-size: 13px; color: #777; font-weight: 400; margin-left: 8px; }
.word-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.word { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e1e2ed; border-radius: 8px; overflow-wrap: anywhere; }
.word.playing { background: #f0edff; border-color: #8270d7; }
.word-content { flex: 1; min-width: 0; line-height: 1.6; }
.pronunciation { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 10px; }
strong { color: #37324c; font-size: 16px; }
.ipa { color: #6b5c99; font-family: 'Segoe UI', 'Arial', sans-serif; font-size: 14px; }
.translation { display: block; color: #666276; font-size: 14px; }
.speaker { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; padding: 0; border-radius: 50%; background: #f5f2ff; }
.speaker:hover, .speaker.active { background: #6756c8; color: white; }
.empty, .error { padding: 24px; background: white; border-radius: 12px; text-align: center; color: #666; }
.error { color: #a52c40; margin-bottom: 12px; }
@media (max-width: 600px) { .word-grid { grid-template-columns: 1fr; } .wordbook-page { padding-left: 12px; padding-right: 12px; } }
</style>

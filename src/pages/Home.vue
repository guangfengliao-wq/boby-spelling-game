<template>
  <div class="home-page">
    <div class="container">
      <div class="home-content">
        <h1 class="title fade-in">🎮 英文拼写练习</h1>
        <p class="subtitle">看中文，拼英文，轻松学英语！</p>

        <SemesterPicker />
        <p v-if="isPhonetics" class="semester-notice">音标仅支持学习，听例词发音，认识音标。</p>
        <p v-else-if="!hasWords" class="semester-notice">本学期单词表待补充，请选择其他学期。</p>

        <div class="button-group">
          <button class="mode-button" :disabled="!hasWords && !isPhonetics" @click="router.push(isPhonetics ? '/phonetics' : '/select?mode=learn')">
            <span class="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1v14"/><path d="m6 9 3 1m6 0 3-1M6 13l3 1m6 0 3-1"/></svg></span>
            <span>学习</span>
          </button>
          <button class="mode-button dictation" :disabled="isPhonetics || (!hasWords && !hasSavedGame)" @click="startGame">
            <span class="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 5 5 5M5 19l1-5L17 3a2 2 0 0 1 3 3L9 17l-4 2ZM4 22h16"/></svg></span>
            <span>{{ hasSavedGame ? '继续默写' : '默写' }}</span>
          </button>
          <button class="mode-button errors" @click="showErrorWords">
            <span class="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="15" height="18" rx="2"/><path d="M3 7h4m-4 5h4m-4 5h4m4-9 5 5m0-5-5 5m0 4h5"/></svg></span>
            <span>错题本</span>
          </button>
          <button class="mode-button career" @click="router.push('/career')">
            <span class="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4v16h17M8 16v-4m5 4V9m5 7V5M7 8l5-3 4-2"/></svg></span>
            <span>生涯</span>
          </button>
        </div>
        <button v-if="hasSavedGame && hasWords" class="change-unit" @click="router.push('/select')">选择其他单元默写</button>
      </div>
    </div>

    <SettingsDialog @reset="resetData" />
    <span class="app-version" aria-label="应用版本">v{{ appVersion }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerProfile } from '../composables/usePlayerProfile'
import { useGameState } from '../composables/useGameState'
import SemesterPicker from '../components/SemesterPicker.vue'
import SettingsDialog from '../components/SettingsDialog.vue'
import { useSemester } from '../composables/useSemester'
import { getAllUnits, getUnit } from '../utils/wordLoader'
import { clearCareer } from '../utils/career'
import { PHONETICS_ID } from '../data/phonetics'
import { version as appVersion } from '../../package.json'

const router = useRouter()
const { resetData: resetPlayerData } = usePlayerProfile()
const gameState = useGameState()

const { selectedSemesterId } = useSemester()
const isPhonetics = computed(() => selectedSemesterId.value === PHONETICS_ID)
const savedGame = ref<ReturnType<typeof gameState.loadGameState>>(null)
const hasWords = computed(() => getAllUnits(selectedSemesterId.value).some((unit) => unit.words.length > 0))
const hasSavedGame = computed(() => !!(savedGame.value && savedGame.value.questions.length > 0
  && getUnit(savedGame.value.currentUnitId)?.semesterId === selectedSemesterId.value))

onMounted(() => {
  // 检查是否有未完成的游戏
  savedGame.value = gameState.loadGameState()
})

const startGame = () => {
  if (isPhonetics.value) return
  // 如果有保存的游戏，直接进入游戏页面
  if (hasSavedGame.value) {
    router.push('/game')
  } else if (hasWords.value) {
    router.push('/select')
  }
}

const showErrorWords = () => {
  router.push('/error-review')
}

const resetData = () => {
  if (confirm('确定要清除所有数据吗？\n\n这将删除：\n• 所有积分\n• 连胜记录\n• 错题记录\n• 生涯默写记录\n\n此操作无法撤销。')) {
    resetPlayerData()
    gameState.resetGame()
    clearCareer()
    savedGame.value = null
    alert('数据已重置')
  }
}
</script>

<style scoped>
.home-page { position: relative; width: 100%; height: 100dvh; min-height: 0; overflow: hidden; overscroll-behavior: none; display: flex; align-items: center; justify-content: center; padding: max(76px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left)); background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.home-page > .container { max-width: 760px; width: 100%; padding: 0; }
.app-version { position: fixed; right: 16px; bottom: 12px; right: max(16px, env(safe-area-inset-right)); bottom: max(12px, env(safe-area-inset-bottom)); color: #ffffffb3; font-size: 12px; line-height: 1.4; pointer-events: none; }
.home-content { text-align: center; color: white; }
.title { font-size: 48px; font-weight: 700; margin-bottom: 16px; text-shadow: 0 4px 8px #0002; }
.subtitle { font-size: 18px; margin-bottom: 48px; opacity: .9; }
.home-content :deep(.semester-picker) { max-width: 100%; margin-bottom: 24px; }
.button-group { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.mode-button { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px 12px; border: 1px solid #ffffff70; border-radius: 20px; background: #ffffffed; color: #44405f; font: inherit; font-size: 18px; font-weight: 600; cursor: pointer; box-shadow: 0 6px 20px #34255712; transition: transform .18s ease, background .18s ease, box-shadow .18s ease; }
.mode-icon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; background: #eaeefe; color: #6275de; }
.mode-icon svg { width: 28px; height: 28px; }
.mode-button.dictation .mode-icon { background: #ede6ff; color: #8560cd; }
.mode-button.errors .mode-icon { background: #fff0e7; color: #c97b48; }
.mode-button.career .mode-icon { background: #e2f3f0; color: #338d80; }
.mode-button:hover:not(:disabled) { transform: translateY(-4px); background: white; box-shadow: 0 12px 28px #34255726; }
.mode-button:active:not(:disabled) { transform: translateY(-1px); }
.mode-button:focus-visible { outline: 3px solid #ffe080; outline-offset: 4px; }
.mode-button:disabled { opacity: .5; cursor: not-allowed; }
.change-unit { display: block; margin: 24px auto 0; border: 0; background: transparent; color: white; text-decoration: underline; font: inherit; cursor: pointer; }
.semester-notice { margin: -8px 0 24px; font-size: 14px; opacity: .9; }
@media (max-width: 600px) { .title { font-size: 30px; } .subtitle { font-size: 16px; margin-bottom: 32px; } .button-group { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } .mode-button { padding: 20px 12px; flex-direction: row; justify-content: center; gap: 12px; font-size: 16px; } .mode-icon { width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0; } .mode-icon svg { width: 24px; height: 24px; } }
@media (max-height: 650px) {
  .home-page { padding-top: max(68px, env(safe-area-inset-top)); padding-bottom: max(12px, env(safe-area-inset-bottom)); }
  .title { font-size: 30px; margin-bottom: 8px; }
  .subtitle { font-size: 16px; margin-bottom: 20px; }
  .home-content :deep(.semester-picker) { margin-bottom: 16px; }
  .mode-button { padding: 14px 10px; gap: 10px; }
  .mode-icon { width: 40px; height: 40px; border-radius: 12px; }
  .mode-icon svg { width: 24px; height: 24px; }
  .semester-notice { margin: -4px 0 16px; }
  .change-unit { margin-top: 12px; }
}
@media (max-height: 450px) {
  .title { font-size: 24px; margin-bottom: 4px; }
  .subtitle { font-size: 14px; margin-bottom: 10px; }
  .home-content :deep(.semester-label) { margin-bottom: 4px; }
  .home-content :deep(.semester-trigger) { min-height: 48px; padding-top: 6px; padding-bottom: 6px; }
  .home-content :deep(.semester-picker) { margin-bottom: 10px; }
  .button-group { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .mode-button { flex-direction: row; justify-content: center; padding: 10px 6px; gap: 6px; font-size: 14px; }
  .mode-icon { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; }
  .mode-icon svg { width: 20px; height: 20px; }
  .semester-notice { margin: 0 0 10px; font-size: 12px; }
  .change-unit { margin-top: 8px; font-size: 14px; }
}
@media (prefers-reduced-motion: reduce) { .mode-button { transition: none; } }
</style>

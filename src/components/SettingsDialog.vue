<template>
  <button class="settings-button" aria-haspopup="dialog" @click="dialog?.showModal()">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m9 3-.6 2.3-2 .9L4.2 5.5 2 9.3 3.7 11v2L2 14.7l2.2 3.8 2.2-.7 2 .9L9 21h6l.6-2.3 2-.9 2.2.7 2.2-3.8-1.7-1.7v-2L22 9.3l-2.2-3.8-2.2.7-2-.9L15 3Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
    设置
  </button>

  <dialog ref="dialog" class="settings-dialog" aria-labelledby="settings-title" @click="closeOnBackdrop">
    <div class="settings-content">
      <header>
        <h2 id="settings-title">设置</h2>
        <button class="close-button" aria-label="关闭设置" @click="dialog?.close()">×</button>
      </header>
      <div class="settings-row">
        <div>
          <h3 id="key-sound-label">按键音效</h3>
          <p>输入和删除字母时播放音效</p>
        </div>
        <button class="sound-switch" :class="{ enabled: keySoundEnabled }" role="switch" :aria-checked="keySoundEnabled" aria-labelledby="key-sound-label" @click="toggleKeySound">
          <span></span>
        </button>
      </div>
      <div class="settings-row">
        <div>
          <h3 id="all-words-label">默写本单元全部内容</h3>
          <p id="all-words-description">关闭时随机默写 10 个，不足 10 个则全部默写；开启后默写本单元全部单词和短语。下次开始默写时生效。</p>
        </div>
        <button class="sound-switch" :class="{ enabled: dictateAllWords }" role="switch" :aria-checked="dictateAllWords" aria-labelledby="all-words-label" aria-describedby="all-words-description" @click="toggleDictateAllWords">
          <span></span>
        </button>
      </div>
      <AppUpdate />
      <div class="settings-row reset-row">
        <div>
          <h3>清除数据</h3>
          <p>重置积分、连胜、错题和默写记录</p>
        </div>
        <button class="clear-button" @click="$emit('reset')">清除</button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSettings } from '../composables/useSettings'
import AppUpdate from './AppUpdate.vue'

defineEmits<{ reset: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const { keySoundEnabled, toggleKeySound, dictateAllWords, toggleDictateAllWords } = useSettings()

function closeOnBackdrop(event: MouseEvent) {
  if (event.target !== dialog.value || !dialog.value) return
  const bounds = dialog.value.getBoundingClientRect()
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
    dialog.value.close()
  }
}
</script>

<style scoped>
.settings-button { position: absolute; top: max(20px, env(safe-area-inset-top)); right: max(20px, env(safe-area-inset-right)); display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 10px 16px; border: 1px solid #ffffff70; border-radius: 12px; background: #ffffff26; color: white; font: inherit; font-weight: 600; cursor: pointer; }
.settings-button:hover { background: #ffffff40; }
.settings-button svg { width: 20px; height: 20px; }
.settings-dialog { margin: auto; width: min(440px, calc(100% - 32px)); max-height: calc(100dvh - 40px); padding: 0; border: 0; border-radius: 24px; color: #44405f; background: white; box-shadow: 0 24px 80px #20143f40; }
.settings-dialog::backdrop { background: #20143f66; backdrop-filter: blur(4px); }
.settings-content { padding: 24px; }
header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
h2 { font-size: 24px; }
.close-button { width: 44px; height: 44px; border: 0; border-radius: 12px; background: #f3f1f8; color: #69617e; font-size: 28px; cursor: pointer; }
.settings-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 24px 0; }
h3 { font-size: 16px; font-weight: 600; }
p { margin-top: 8px; color: #817991; font-size: 13px; line-height: 1.6; }
.sound-switch { flex-shrink: 0; display: flex; align-items: center; width: 52px; height: 32px; padding: 4px; border: 0; border-radius: 20px; background: #cbc7d6; cursor: pointer; }
.sound-switch span { width: 24px; height: 24px; border-radius: 50%; background: white; box-shadow: 0 2px 4px #0002; }
.sound-switch.enabled { background: #7566d8; }
.sound-switch.enabled span { transform: translateX(20px); }
.reset-row { border-top: 1px solid #eeebf3; padding-bottom: 8px; }
.clear-button { flex-shrink: 0; min-height: 44px; padding: 10px 16px; border: 1px solid #f1c9cd; border-radius: 10px; background: #fff2f3; color: #c24c5a; font: inherit; font-size: 14px; cursor: pointer; }
button:focus-visible { outline: 3px solid #b29aef; outline-offset: 3px; }
</style>

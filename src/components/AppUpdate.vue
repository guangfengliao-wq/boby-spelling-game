<template>
  <div class="update-row">
    <div><h3>版本更新</h3><p>当前版本 v{{ currentVersion }}</p></div>
    <button class="check-button" :disabled="checking" @click="check">{{ checking ? '正在检查…' : '检查更新' }}</button>
  </div>
  <p v-if="status" class="update-status" role="status">{{ status }}</p>
  <dialog ref="notice" class="update-dialog" aria-labelledby="update-title">
    <div class="update-content">
      <h2 id="update-title">发现新版本 v{{ release?.version }}</h2>
      <p class="version-info">v{{ currentVersion }} → v{{ release?.version }} · {{ ((release?.size ?? 0) / 1024 / 1024).toFixed(1) }} MB</p>
      <h3>更新公告</h3>
      <pre class="release-notes">{{ release?.notes }}</pre>
      <p class="install-help">确认后通过浏览器下载 APK，下载完成后打开文件，按系统提示覆盖安装。请勿卸载旧版本，以保留学习记录。</p>
      <p v-if="downloadError" class="error" role="alert">{{ downloadError }}</p>
      <div class="actions">
        <button :disabled="opening" @click="notice?.close()">稍后再说</button>
        <button class="primary" :disabled="opening" @click="confirmUpdate">{{ opening ? '正在打开…' : '下载并更新' }}</button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { version as currentVersion } from '../../package.json'
import { checkForUpdate, downloadUpdate, type AppRelease } from '../utils/appUpdate'

const checking = ref(false)
const opening = ref(false)
const status = ref('')
const downloadError = ref('')
const release = ref<AppRelease | null>(null)
const notice = ref<HTMLDialogElement | null>(null)

async function check() {
  if (checking.value) return
  checking.value = true
  status.value = ''
  downloadError.value = ''
  try {
    release.value = await checkForUpdate()
    if (!release.value) status.value = '当前已是最新版本'
    else {
      await nextTick()
      notice.value?.showModal()
    }
  } catch (error) {
    status.value = error instanceof Error ? error.message : '检查更新失败，请重试'
  } finally { checking.value = false }
}

async function confirmUpdate() {
  if (!release.value || opening.value) return
  opening.value = true
  downloadError.value = ''
  try {
    await downloadUpdate(release.value)
    notice.value?.close()
    status.value = '已打开下载链接，请下载后按系统提示安装'
  } catch {
    downloadError.value = '无法打开下载链接，请确认已安装浏览器后重试'
  } finally { opening.value = false }
}
</script>

<style scoped>
.update-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:24px 0;border-top:1px solid #eeebf3}
h3{font-size:16px;font-weight:600}p{margin-top:8px;color:#817991;font-size:13px;line-height:1.6}
button{min-height:44px;padding:10px 16px;border:1px solid #ded8f0;border-radius:10px;background:#f4f1fc;color:#6553b4;font:inherit;font-size:14px;cursor:pointer;flex-shrink:0}
button:disabled{opacity:.6;cursor:wait}button:focus-visible{outline:3px solid #b29aef;outline-offset:3px}
.update-status{margin:0 0 18px}.update-dialog{margin:auto;width:min(520px,calc(100% - 32px));max-height:calc(100dvh - 40px);padding:0;border:0;border-radius:24px;color:#44405f;background:white;box-shadow:0 24px 80px #20143f40}
.update-dialog::backdrop{background:#20143f66;backdrop-filter:blur(4px)}.update-content{padding:24px}h2{font-size:22px}.version-info{margin-bottom:20px}
.release-notes{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.8;font-family:inherit;background:#f7f5fb;padding:16px;border-radius:12px;max-height:35vh;overflow:auto;margin:12px 0}
.actions{display:flex;justify-content:flex-end;gap:12px;margin-top:20px}.primary{background:#7566d8;color:white;border-color:#7566d8}.error{color:#b83f4a}
</style>

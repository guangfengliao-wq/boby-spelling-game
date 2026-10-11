<template>
  <div class="custom-page">
    <div class="custom-container">
      <button class="back" @click="router.push('/select')">← 返回单元列表</button>
      <h1>自定义默写</h1>
      <p class="subtitle">{{ semesterName }} · 勾选想练习的单词或短语，可跨单元选择</p>

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
        <label class="selected-filter"><input v-model="onlySelected" type="checkbox" />只看已选</label>
      </div>

      <div class="toolbar">
        <span>当前显示 {{ visibleEntries.length }} 个</span>
        <button :disabled="!visibleEntries.length" @click="selectVisible">全选当前列表</button>
        <button :disabled="!selectedEntries.length" @click="selectedKeys = []">清空已选</button>
      </div>

      <section v-for="group in groups" :key="group.id" class="unit-section">
        <div class="unit-heading">
          <h2>{{ group.name }}</h2>
          <button @click="toggleGroup(group.entries)">{{ group.entries.every(entry => selectedSet.has(entry.key)) ? '取消本组' : '选择本组' }}</button>
        </div>
        <div class="word-grid">
          <label v-for="entry in group.entries" :key="entry.key" class="word" :class="{ checked: selectedSet.has(entry.key) }">
            <input v-model="selectedKeys" type="checkbox" :value="entry.key" />
            <span><strong>{{ entry.en }}</strong><span class="translation">{{ entry.cn }}</span></span>
          </label>
        </div>
      </section>
      <p v-if="!visibleEntries.length" class="empty">{{ entries.length ? '没有符合条件的单词，请调整筛选或搜索。' : '本学期暂无单词，请返回首页选择其他学期。' }}</p>

      <div class="start-bar">
        <div aria-live="polite"><strong>已选 {{ selectedEntries.length }} 个</strong><p>全部默写，随机排序</p></div>
        <button class="btn btn-primary" :disabled="!selectedEntries.length" @click="start">开始默写</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAllUnits, getSemesters } from '../utils/wordLoader'
import { useSemester } from '../composables/useSemester'
import { useGameState } from '../composables/useGameState'

const router = useRouter()
const { selectedSemesterId } = useSemester()
const { startCustomGame } = useGameState()
const units = computed(() => getAllUnits(selectedSemesterId.value))
const semesterName = computed(() => getSemesters().find(semester => semester.id === selectedSemesterId.value)?.name)
const entries = computed(() => units.value.flatMap(unit => unit.words.map((word, wordIndex) => ({
  ...word, unitId: unit.id, wordIndex, key: JSON.stringify([unit.id, wordIndex, word.en, word.cn])
}))))
type Entry = typeof entries.value[number]
const storageKey = `customDictationSelection:${selectedSemesterId.value}`
function loadSelection(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    const valid = new Set(entries.value.map(entry => entry.key))
    return Array.isArray(saved) ? saved.filter((key): key is string => typeof key === 'string' && valid.has(key)) : []
  } catch { return [] }
}
const selectedKeys = ref<string[]>(loadSelection())
watch(selectedKeys, value => localStorage.setItem(storageKey, JSON.stringify(value)), { deep: true })
const selectedSet = computed(() => new Set(selectedKeys.value))
const selectedEntries = computed(() => entries.value.filter(entry => selectedSet.value.has(entry.key)))
const unitFilter = ref('')
const search = ref('')
const onlySelected = ref(false)
const visibleEntries = computed(() => {
  const query = search.value.trim().toLowerCase()
  return entries.value.filter(entry => (!unitFilter.value || entry.unitId === unitFilter.value)
    && (!onlySelected.value || selectedSet.value.has(entry.key))
    && (!query || entry.en.toLowerCase().includes(query) || entry.cn.includes(query)))
})
const groups = computed(() => units.value.map(unit => ({
  ...unit, entries: visibleEntries.value.filter(entry => entry.unitId === unit.id)
})).filter(group => group.entries.length))
function selectVisible() {
  selectedKeys.value = [...new Set([...selectedKeys.value, ...visibleEntries.value.map(entry => entry.key)])]
}
function toggleGroup(group: Entry[]) {
  const keys = new Set(group.map(entry => entry.key))
  selectedKeys.value = group.every(entry => selectedSet.value.has(entry.key))
    ? selectedKeys.value.filter(key => !keys.has(key))
    : [...new Set([...selectedKeys.value, ...keys])]
}
function start() {
  if (startCustomGame(selectedEntries.value)) router.push('/game')
}
</script>

<style scoped>
.custom-page { min-height: 100vh; width: 100%; background: linear-gradient(135deg, #667eea, #764ba2); padding: max(24px, env(safe-area-inset-top)) 20px calc(120px + env(safe-area-inset-bottom)); }
.custom-container { max-width: 960px; margin: auto; }
h1 { color: white; text-align: center; margin: 24px 0 8px; font-size: 30px; }
.subtitle { color: white; text-align: center; margin-bottom: 24px; line-height: 1.6; }
button, input, select { font: inherit; }
button { cursor: pointer; min-height: 44px; border: 1px solid #d9dcec; border-radius: 8px; background: white; color: #4f46a5; padding: 8px 14px; }
button:disabled { opacity: .5; cursor: default; }
button:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid #ffc857; outline-offset: 3px; }
.filters { display: flex; flex-wrap: wrap; align-items: end; gap: 10px; padding: 14px; background: white; border-radius: 12px; }
.filters > label { flex: 1; min-width: 180px; color: #45435c; font-weight: 600; }
select, input[type=search] { display: block; width: 100%; min-height: 44px; margin-top: 8px; border: 1px solid #c9cadd; border-radius: 8px; padding: 10px; background: white; }
.filters .selected-filter { display: flex; align-items: center; gap: 8px; min-height: 44px; flex: 0 0 auto; min-width: auto; }
input[type=checkbox] { width: 20px; height: 20px; accent-color: #6756c8; flex-shrink: 0; }
.toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 12px 0; color: white; }
.toolbar > span { margin-right: auto; }
.unit-section { background: white; border-radius: 12px; padding: 12px; margin-bottom: 10px; }
.unit-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
h2 { font-size: 18px; color: #39364f; }
.unit-heading button { flex-shrink: 0; }
.word-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 8px; }
.word { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 7px 10px; border: 1px solid #e1e2ed; border-radius: 6px; cursor: pointer; overflow-wrap: anywhere; }
.word > span { display: flex; align-items: baseline; flex-wrap: wrap; gap: 2px 10px; min-width: 0; line-height: 1.4; }
.word.checked { background: #f0edff; border-color: #8270d7; }
.word strong { color: #37324c; font-size: 15px; }
.translation { color: #666276; font-size: 14px; }
.empty { padding: 32px; background: white; border-radius: 16px; text-align: center; color: #666; }
.start-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: center; gap: 32px; padding: 14px 20px calc(14px + env(safe-area-inset-bottom)); background: white; box-shadow: 0 -4px 20px #30265b22; z-index: 10; }
.start-bar p { color: #777; font-size: 13px; margin-top: 4px; }
.start-bar button { flex: 0 1 240px; }
@media (max-width: 600px) { .word-grid { grid-template-columns: 1fr; } .unit-section { padding: 10px; } .start-bar { gap: 16px; } .start-bar > div { flex-shrink: 0; } }
</style>

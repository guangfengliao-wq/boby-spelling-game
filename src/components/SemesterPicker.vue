<template>
  <div class="semester-picker" ref="root">
    <span :id="`${id}-label`" class="semester-label">学习内容</span>
    <button ref="trigger" type="button" class="semester-trigger" :class="{ expanded: open }"
      aria-haspopup="listbox" :aria-expanded="open" :aria-controls="open ? id : undefined"
      :aria-labelledby="`${id}-label ${id}-value`" @click="open ? close() : show()" @keydown="onTriggerKey">
      <span class="book-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1v14"/></svg></span>
      <span :id="`${id}-value`" class="selected-name">{{ selected.name }}</span>
      <span class="word-badge" :class="{ pending: !wordCount(selected) }">{{ countLabel(selected) }}</span>
      <svg class="chevron" :class="{ rotated: open }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>
    </button>
    <Teleport to="body">
      <div v-if="open" :id="id" ref="list" class="semester-menu" :style="menuStyle" role="listbox" tabindex="-1"
        :aria-labelledby="`${id}-label`" :aria-activedescendant="`${id}-${activeIndex}`" @keydown="onListKey" @focusout="onFocusOut">
        <div v-for="(semester, index) in semesters" :id="`${id}-${index}`" :key="semester.id" role="option"
          :aria-selected="semester.id === selectedSemesterId" class="semester-option"
          :class="{ selected: semester.id === selectedSemesterId, active: index === activeIndex, 'grade-start': index > 0 && index % 2 === 0 }"
          @pointermove="activeIndex = index" @mousedown.prevent @click="choose(index)">
          <span class="option-name">{{ semester.name }}</span>
          <span class="word-badge" :class="{ pending: !wordCount(semester) }">{{ countLabel(semester) }}</span>
          <svg class="check" :class="{ visible: semester.id === selectedSemesterId }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { getSemesters } from '../utils/wordLoader'
import { PHONETICS_ID, phoneticCount } from '../data/phonetics'
import { useSemester } from '../composables/useSemester'
const semesters = getSemesters()
const { selectedSemesterId, selectSemester } = useSemester()
const selected = computed(() => semesters.find(s => s.id === selectedSemesterId.value) ?? semesters[0])
const wordCount = (semester: typeof semesters[number]) => semester.id === PHONETICS_ID ? phoneticCount : semester.units.reduce((count, unit) => count + unit.words.length, 0)
const countLabel = (semester: typeof semesters[number]) => semester.id === PHONETICS_ID ? `${phoneticCount} 个音标 · 仅学习` : wordCount(semester) ? `${wordCount(semester)} 个单词` : '待补充'
const id = `semester-list-${getCurrentInstance()!.uid}`
const open = ref(false)
const activeIndex = ref(0)
const root = ref<HTMLDivElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const list = ref<HTMLDivElement | null>(null)
const menuStyle = ref<CSSProperties>({})
function positionMenu() {
  if (!open.value || !trigger.value) return
  const rect = trigger.value.getBoundingClientRect()
  const below = window.innerHeight - rect.bottom - 16
  const above = rect.top - 16
  const upwards = below < 280 && above > below
  menuStyle.value = { left: `${rect.left}px`, width: `${rect.width}px`, maxHeight: `${Math.max(80, Math.min(400, upwards ? above : below))}px`,
    ...(upwards ? { bottom: `${window.innerHeight - rect.top + 8}px` } : { top: `${rect.bottom + 8}px` }) }
}
async function show() {
  activeIndex.value = Math.max(0, semesters.findIndex(s => s.id === selectedSemesterId.value))
  open.value = true
  positionMenu()
  await nextTick()
  list.value?.focus({ preventScroll: true })
  scrollActive()
}
function close(restoreFocus = true) {
  open.value = false
  if (restoreFocus) trigger.value?.focus({ preventScroll: true })
}
function choose(index: number) { selectSemester(semesters[index].id); close() }
function scrollActive() {
  const option = list.value?.children[activeIndex.value] as HTMLElement | undefined
  option?.scrollIntoView({ block: 'nearest' })
}
function onTriggerKey(event: KeyboardEvent) {
  if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); show() }
}
function onListKey(event: KeyboardEvent) {
  if (event.key === 'Tab') { close(); return }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape'].includes(event.key)) return
  event.preventDefault()
  if (event.key === 'Escape') return close()
  if (event.key === 'Enter' || event.key === ' ') return choose(activeIndex.value)
  if (event.key === 'Home') activeIndex.value = 0
  else if (event.key === 'End') activeIndex.value = semesters.length - 1
  else activeIndex.value = (activeIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + semesters.length) % semesters.length
  nextTick(scrollActive)
}
function onOutside(event: PointerEvent) {
  const target = event.target as Node
  if (open.value && !root.value?.contains(target) && !list.value?.contains(target)) close(false)
}
function onFocusOut(event: FocusEvent) {
  if (!list.value?.contains(event.relatedTarget as Node | null) && !trigger.value?.contains(event.relatedTarget as Node | null)) close(false)
}
onMounted(() => {
  document.addEventListener('pointerdown', onOutside)
  window.addEventListener('resize', positionMenu)
  window.addEventListener('scroll', positionMenu, true)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onOutside)
  window.removeEventListener('resize', positionMenu)
  window.removeEventListener('scroll', positionMenu, true)
})
</script>

<style scoped>
.semester-picker { width: 100%; max-width: 380px; margin: 0 auto 28px; text-align: left; }
.semester-label { display: block; color: #ffffffe6; font-size: 14px; margin-bottom: 10px; }
.semester-trigger { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 68px; padding: 12px 18px; border: 1px solid #ffffff80; border-radius: 18px; background: #fcfcff; color: #45405e; cursor: pointer; font: inherit; text-align: left; box-shadow: 0 6px 20px #34255712; }
.semester-trigger.expanded { background: white; box-shadow: 0 0 0 3px #ffffff30; }
.semester-trigger:focus-visible { outline: 3px solid #cbd0ff; outline-offset: 3px; }
.book-icon { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; border-radius: 11px; background: #eeefff; color: #7480d9; }
.book-icon svg { width: 21px; height: 21px; }
.selected-name { flex: 1; font-size: 16px; font-weight: 600; }
.word-badge { flex-shrink: 0; font-size: 12px; font-weight: 500; line-height: 1.5; background: #eeefff; color: #7475aa; border-radius: 7px; padding: 4px 8px; white-space: nowrap; }
.word-badge.pending { background: #f3f3f6; color: #9292a3; }
.chevron { width: 20px; height: 20px; flex-shrink: 0; color: #9490ac; transition: transform .18s; }
.chevron.rotated { transform: rotate(180deg); }
.semester-menu { position: fixed; z-index: 200; box-sizing: border-box; padding: 8px; border: 1px solid #ebeaf5; border-radius: 18px; background: #fff; box-shadow: 0 16px 48px #30215433, 0 3px 10px #3021540d; overflow-y: auto; overscroll-behavior: contain; outline: none; scrollbar-width: thin; scrollbar-color: #d4d1e7 transparent; }
.semester-option { display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 10px 12px; border-radius: 11px; color: #55516a; cursor: pointer; }
.semester-option.grade-start { margin-top: 4px; }
.semester-option.active { background: #f5f4fb; }
.semester-option.selected { background: #eeedff; color: #6658b8; }
.semester-option.selected.active { background: #e7e4fc; }
.option-name { flex: 1; font-size: 15px; }
.semester-option.selected .option-name { font-weight: 600; }
.check { width: 18px; height: 18px; flex-shrink: 0; opacity: 0; color: #7a6bcc; }
.check.visible { opacity: 1; }
@media (max-width: 420px) { .semester-trigger { gap: 8px; padding: 12px; } .book-icon { display: none; } .selected-name { font-size: 15px; } .semester-option { gap: 8px; padding: 10px 8px; } }
@media (prefers-reduced-motion: reduce) { .chevron { transition: none; } }
</style>

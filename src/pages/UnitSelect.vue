<template>
  <div class="unit-select-page">
    <button class="btn-back" type="button" @click="goBack" title="返回首页">← 返回首页</button>
    <div class="container">
      <h1 class="page-title">{{ isLearning ? '选择学习单元' : '选择默写单元' }}</h1>
      <p class="page-subtitle">选择一个单元开始{{ isLearning ? '学习' : '默写' }}，返回首页可切换学期</p>
      <p v-if="!isLearning" class="dictation-scope">{{ dictateAllWords ? '当前范围：本单元全部单词和短语' : '当前范围：随机 10 个，不足 10 个则全部默写' }}</p>
      <h2 class="semester-heading">{{ semesterName }}</h2>
      <p v-if="units.length === 0" class="empty-state">本学期单词表待补充，请返回首页选择其他学期。</p>

      <div class="units-grid">
        <button
          v-for="unit in units"
          :key="unit.id"
          class="unit-card fade-in"
          :disabled="unit.words.length === 0"
          @click="selectUnit(unit.id)"
        >
          <div class="unit-icon">📚</div>
          <h3>{{ unit.name }}</h3>
          <p>{{ unit.words.length }} 个单词</p>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import { getAllUnits, getSemesters } from '../utils/wordLoader'
import { useSemester } from '../composables/useSemester'
import { useGameState } from '../composables/useGameState'
import { useSettings } from '../composables/useSettings'
import { PHONETICS_ID } from '../data/phonetics'

const router = useRouter()
const route = useRoute()
const isLearning = computed(() => route.query.mode === 'learn')
const { startGame } = useGameState()
const { dictateAllWords } = useSettings()
const { selectedSemesterId } = useSemester()
onMounted(() => {
  if (selectedSemesterId.value === PHONETICS_ID) router.replace('/phonetics')
})
const units = computed(() => getAllUnits(selectedSemesterId.value))
const semesterName = computed(() => getSemesters().find((semester) => semester.id === selectedSemesterId.value)?.name)

const selectUnit = (unitId: string) => {
  if (!units.value.some((unit) => unit.id === unitId && unit.words.length > 0)) return
  if (isLearning.value) {
    router.push({ path: '/learn', query: { unit: unitId } })
    return
  }
  startGame(unitId)
  router.push('/game')
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.dictation-scope { color: rgba(255, 255, 255, .9); text-align: center; margin: -24px 0 24px; font-size: 14px; }
.semester-heading { color: white; text-align: center; margin-bottom: 24px; font-size: 22px; }
.empty-state { background: white; border-radius: 16px; padding: 40px 20px; text-align: center; color: #666; }
.unit-card { border: 0; font: inherit; }
.unit-card:disabled { opacity: .6; cursor: default; }
.unit-select-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px 40px;
}

.unit-select-page .container {
  max-width: 1100px;
}

.page-title {
  color: white;
  font-size: 36px;
  text-align: center;
  margin-bottom: 8px;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 40px;
  font-size: 16px;
}

.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  grid-auto-rows: 1fr;
  gap: 24px;
  margin-bottom: 40px;
}

.unit-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  width: 100%;
  min-width: 0;
  aspect-ratio: 10 / 7;
  background: white;
  border-radius: 16px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.unit-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
}

.unit-icon {
  flex-shrink: 0;
  font-size: 36px;
  line-height: 1;
  margin-bottom: 8px;
}

.unit-card h3 {
  font-size: 18px;
  min-height: 2.7em;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.35;
  overflow-wrap: anywhere;
  margin-bottom: 8px;
  color: #333;
}

.unit-card p {
  color: #888;
  font-size: 14px;
}

.btn-back {
  position: fixed;
  top: max(20px, env(safe-area-inset-top));
  left: max(20px, env(safe-area-inset-left));
  z-index: 50;
  min-height: 44px;
  padding: 8px 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
}

.btn-back:focus-visible {
  outline: 3px solid #ffe080;
  outline-offset: 3px;
}

@media (max-width: 600px) {
  .page-title {
    font-size: 24px;
  }

  .units-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .unit-select-page .container {
    padding: 20px 0;
  }

  .unit-card {
    padding: 8px;
  }

  .unit-icon {
    font-size: 24px;
    margin-bottom: 4px;
  }

  .unit-card h3 {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .unit-card p {
    font-size: 12px;
  }
}

@media (max-width: 359px) {
  .units-grid {
    grid-template-columns: 1fr;
  }
}
</style>

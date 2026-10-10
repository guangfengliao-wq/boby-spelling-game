<template>
  <div class="error-review-page">
    <button class="btn-back" @click="goBack" title="返回">
      <span>← 返回</span>
    </button>

    <div class="container">
      <h1 class="title">📚 错题本</h1>
      <SemesterPicker />

      <div v-if="errorCount === 0" class="empty-state">
        <p>{{ selectedSemesterId === PHONETICS_ID ? '音标仅支持学习，不产生默写错题。' : hasWords ? '🎉 本学期暂无错题，继续加油！' : '本学期单词表待补充' }}</p>
      </div>

      <div v-else class="error-book">
        <div class="error-summary">
          <span>本学期共 {{ errorCount }} 个错词</span>
        </div>

        <div class="units-list">
          <div v-for="unit in errorWordsByUnit" :key="unit.id" class="unit-section">
            <div 
              class="unit-header"
              @click="toggleUnit(unit.id)"
              :class="{ expanded: expandedUnits.has(unit.id) }"
            >
              <span class="expand-icon">{{ expandedUnits.has(unit.id) ? '▼' : '▶' }}</span>
              <span class="unit-name">{{ unit.name }}</span>
              <span class="error-count">{{ unit.errors.length }}</span>
            </div>

            <div v-if="expandedUnits.has(unit.id)" class="error-book-list">
              <div v-for="error in unit.errors" :key="error.en" class="error-book-item">
                <div class="error-word-info">
                  <span class="error-en">{{ error.en }}</span>
                  <span class="error-cn">{{ error.cn }}</span>
                </div>
                <span class="error-times">错 {{ error.errorCount }} 次</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerProfile } from '../composables/usePlayerProfile'
import { getAllUnits } from '../utils/wordLoader'
import { PHONETICS_ID } from '../data/phonetics'
import SemesterPicker from '../components/SemesterPicker.vue'
import { useSemester } from '../composables/useSemester'

const router = useRouter()
const { profile: playerProfile } = usePlayerProfile()

const expandedUnits = ref<Set<string>>(new Set())
const { selectedSemesterId } = useSemester()
const hasWords = computed(() => getAllUnits(selectedSemesterId.value).some((unit) => unit.words.length > 0))
const errorCount = computed(() => errorWordsByUnit.value.reduce((count, unit) => count + unit.errors.length, 0))

const errorWordsByUnit = computed(() => {
  const allUnits = getAllUnits(selectedSemesterId.value)
  const errorWords = playerProfile.value?.errorWords || []
  return allUnits
    .map((unit) => ({
      ...unit,
      errors: (errorWords)
        .filter((w: { unitId: string; errorCount: number }) => w.unitId === unit.id)
        .sort((a: { errorCount: number }, b: { errorCount: number }) => b.errorCount - a.errorCount)
    }))
    .filter((unit) => unit.errors.length > 0)
})

const toggleUnit = (unitId: string) => {
  if (expandedUnits.value.has(unitId)) expandedUnits.value.delete(unitId)
  else expandedUnits.value.add(unitId)
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.error-review-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.btn-back {
  position: fixed;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 50;
  backdrop-filter: blur(4px);
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateX(-2px);
}

.container {
  max-width: 600px;
  width: 100%;
}

.title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 30px;
  text-align: center;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.empty-state {
  background: white;
  border-radius: 16px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  font-size: 18px;
  color: #999;
}

.error-book {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.error-summary {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.units-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.unit-section {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.unit-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f8f8;
  cursor: pointer;
  transition: background 0.3s ease;
  user-select: none;
}

.unit-header:hover {
  background: #f0f0f0;
}

.unit-header.expanded {
  background: #f0f4ff;
}

.expand-icon {
  font-size: 12px;
  color: #999;
  transition: transform 0.3s ease;
}

.unit-header.expanded .expand-icon {
  transform: rotate(0deg);
}

.unit-name {
  flex: 1;
  font-weight: 600;
  color: #333;
}

.error-count {
  display: inline-block;
  background: #e91e63;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.error-book-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.error-book-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  transition: background 0.2s ease;
}

.error-book-item:hover {
  background: #f9f9f9;
}

.error-word-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.error-en {
  font-weight: 600;
  color: #e91e63;
  font-size: 14px;
}

.error-cn {
  color: #999;
  font-size: 12px;
}

.error-times {
  display: inline-block;
  background: #ffebee;
  color: #e91e63;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 600px) {
  .error-review-page {
    padding: 70px 16px 40px;
  }

  .title {
    font-size: 24px;
    margin-bottom: 20px;
  }

  .error-book {
    padding: 16px;
  }

  .unit-header {
    padding: 12px;
  }

  .unit-name {
    font-size: 14px;
  }

  .error-book-item {
    padding: 10px 12px;
  }
}
</style>

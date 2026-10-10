<template>
  <div class="result-page">
    <div class="container">
      <div class="result-content fade-in">
        <h1 class="result-title">🎉 本局完成！</h1>
        <p class="learning-context">{{ currentUnit?.semesterName }} · {{ currentUnit?.name }}</p>

        <div class="result-stats">
          <div class="stat-box">
            <div class="stat-icon">🎯</div>
            <div class="stat-label">本轮得分</div>
            <div class="stat-value">{{ score }}</div>
          </div>

          <div class="stat-box">
            <div class="stat-icon">⏱</div>
            <div class="stat-label">答题用时</div>
            <div class="stat-value">{{ formattedTime }}</div>
          </div>

          <div class="stat-box">
            <div class="stat-icon">🔥</div>
            <div class="stat-label">连胜数</div>
            <div class="stat-value">{{ playerProfile.currentStreak }}</div>
          </div>

          <div class="stat-box">
            <div class="stat-icon">⭐</div>
            <div class="stat-label">总积分</div>
            <div class="stat-value">{{ playerProfile.totalScore }}</div>
          </div>
        </div>

        <!-- Error Words Summary -->
        <div v-if="errorWordsInGame.length > 0" class="error-summary">
          <h3>📋 本局错题：{{ errorWordsInGame.length }} 个</h3>
          <div class="error-list">
            <div v-for="(error, idx) in errorWordsInGame" :key="idx" class="error-item">
              <span class="error-cn">{{ error.cn }}</span>
              <span class="error-arrow">→</span>
              <span class="error-en">{{ error.en }}</span>
            </div>
          </div>
        </div>

        <!-- Error Words Book (分单元显示历史错题) -->
        <div v-if="errorWordsByUnit.length > 0" class="error-book">
          <h3>📚 错题本（共 {{ playerProfile.errorWords.value.length }} 个错词）</h3>
          <div class="units-list">
            <div v-for="unit in errorWordsByUnit" :key="unit.id" class="unit-section">
              <div 
                class="unit-header"
                @click="toggleUnit(unit.id)"
                :class="{ expanded: expandedUnits.has(unit.id) }"
              >
                <span class="expand-icon">{{ expandedUnits.has(unit.id) ? '▼' : '▶' }}</span>
                <span class="unit-name">{{ unit.semesterName }} · {{ unit.name }}</span>
                <span class="error-count">{{ unit.errors.length }} 个</span>
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

        <div v-else-if="errorWordsInGame.length === 0" class="perfect-msg">
          <p>🌟 完美！本局全部正确，还没有错过的单词！</p>
        </div>

        <!-- Buttons -->
        <div class="button-group">
          <button class="btn btn-primary" @click="playAgain">再来一次</button>
          <button class="btn btn-secondary" @click="goHome">返回主菜单</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameState } from '../composables/useGameState'
import { usePlayerProfile } from '../composables/usePlayerProfile'
import { getAllUnits, getUnit } from '../utils/wordLoader'

const router = useRouter()
const gameState = useGameState()
const playerProfile = usePlayerProfile()
const expandedUnits = ref<Set<string>>(new Set())

const { score, answered, elapsedSeconds, resetGame } = gameState
const currentUnit = computed(() => getUnit(gameState.currentUnitId.value))

const formattedTime = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60)
  const s = elapsedSeconds.value % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
})

const errorWordsInGame = computed(() => {
  return answered.value
    .filter((a) => !a.correct)
    .map((a) => a.word)
    .filter((word, idx, self) => self.findIndex((w) => w.en === word.en) === idx)
})

// 错题本分单元组织
const errorWordsByUnit = computed(() => {
  const allUnits = getAllUnits()
  const errorWords = playerProfile.errorWords.value
  
  return allUnits
    .map((unit) => ({
      ...unit,
      errors: errorWords.filter((w: { unitId: string; errorCount: number }) => w.unitId === unit.id).sort((a: { errorCount: number }, b: { errorCount: number }) => b.errorCount - a.errorCount)
    }))
    .filter((unit) => unit.errors.length > 0)
})

const toggleUnit = (unitId: string) => {
  if (expandedUnits.value.has(unitId)) {
    expandedUnits.value.delete(unitId)
  } else {
    expandedUnits.value.add(unitId)
  }
}

const playAgain = () => {
  resetGame()
  router.push('/select')
}

const goHome = () => {
  resetGame()
  playerProfile.reload()
  router.push('/')
}
</script>

<style scoped>
.result-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 600px;
  width: 100%;
}

.result-content {
  background: white;
  border-radius: 16px;
  padding: 40px 24px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}

.result-title {
  font-size: 36px;
  text-align: center;
  margin-bottom: 32px;
  color: #333;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}

.stat-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.error-summary {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.error-summary h3 {
  margin-bottom: 12px;
  color: #856404;
  font-size: 14px;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.error-cn {
  color: #333;
  font-weight: 600;
  min-width: 60px;
}

.error-arrow {
  color: #999;
}

.error-en {
  color: #666;
}

.perfect-msg {
  text-align: center;
  font-size: 20px;
  padding: 24px;
  background: #c8e6c9;
  border-radius: 8px;
  color: #2e7d32;
  margin-bottom: 24px;
}

/* Error Book Styles */
.error-book {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  max-height: 400px;
  overflow-y: auto;
}

.error-book h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.units-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.unit-section {
  background: white;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.unit-header {
  padding: 12px;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.unit-header:hover {
  background: #f0f0f0;
}

.unit-header.expanded {
  border-bottom: none;
}

.expand-icon {
  font-size: 10px;
  color: #999;
  flex-shrink: 0;
}

.unit-name {
  flex: 1;
  font-weight: 600;
  font-size: 13px;
  color: #333;
}

.error-count {
  font-size: 12px;
  background: #ff6b6b;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
}

.error-book-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-book-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #fafafa;
  border-radius: 4px;
  border-left: 3px solid #ff6b6b;
}

.error-word-info {
  display: flex;
  gap: 12px;
  flex: 1;
}

.error-en {
  color: #e53935;
  font-weight: 600;
  font-size: 13px;
  min-width: 60px;
}

.error-cn {
  color: #666;
  font-size: 13px;
}

.error-times {
  font-size: 12px;
  color: #ff6b6b;
  font-weight: 600;
  padding: 2px 6px;
  background: #ffe0e0;
  border-radius: 4px;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  min-width: 120px;
}

@media (max-width: 600px) {
  .result-title {
    font-size: 24px;
  }

  .result-stats {
    grid-template-columns: 1fr;
  }

  .error-item {
    font-size: 12px;
  }
}
</style>

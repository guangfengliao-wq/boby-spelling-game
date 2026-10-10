<template>
  <div class="career-page">
    <button class="back-button" @click="router.push('/')">← 返回首页</button>
    <main>
      <h1>生涯</h1>
      <p class="subtitle">每一次默写，都是进步的足迹</p>
      <div class="overview">共 {{ records.length }} 次记录 · 已完成 {{ records.filter(r => r.completed).length }} 次</div>
      <div v-if="!records.length" class="empty-state">暂无默写记录，完成一次默写后就能在这里查看。<br><small>记录从本功能启用后开始保存。</small></div>
      <details v-for="record in records" :key="record.id" class="record">
        <summary>
          <div class="record-heading"><strong>{{ record.semesterName }} · {{ record.unitName }}</strong><span class="status">{{ record.completed ? '已完成' : '未完成' }}</span></div>
          <p class="date">{{ formatDate(record.startedAt) }} · 用时 {{ formatTime(record.elapsedSeconds) }}</p>
          <div class="numbers"><span>{{ record.score }} 分</span><span class="correct">正确 {{ record.answers.filter(a => a.correct).length }}</span><span class="wrong">错误 {{ record.answers.filter(a => !a.correct).length }}</span><span>{{ record.answers.length }} / {{ record.totalQuestions }} 词</span></div>
          <p class="expand-hint">展开 / 收起单词列表</p>
        </summary>
        <div class="word-lists">
          <section v-for="group in groups" :key="group.label">
            <h2 :class="group.correct ? 'correct' : 'wrong'">{{ group.label }}</h2>
            <ul v-if="record.answers.some(a => a.correct === group.correct)">
              <li v-for="(answer, index) in record.answers.filter(a => a.correct === group.correct)" :key="index"><strong lang="en">{{ answer.word.en }}</strong><span>{{ answer.word.cn }}</span></li>
            </ul>
            <p v-else class="no-words">{{ group.correct ? '暂无答对的单词' : '暂无答错的单词' }}</p>
          </section>
        </div>
      </details>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { loadCareer } from '../utils/career'
const router = useRouter()
const records = loadCareer().sort((a, b) => b.startedAt - a.startedAt)
const groups = [{ label: '正确的单词', correct: true }, { label: '错误的单词', correct: false }]
const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}分${seconds % 60}秒`
</script>

<style scoped>
.career-page { min-height: 100vh; padding: 90px 20px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
main { max-width: 800px; margin: 0 auto; }
h1 { color: white; font-size: 36px; text-align: center; }
.subtitle, .overview { color: #ffffffe0; text-align: center; margin: 16px 0 24px; }
.empty-state { padding: 40px 20px; background: white; border-radius: 16px; text-align: center; color: #666; line-height: 2; }
.record { background: white; border-radius: 16px; margin-bottom: 20px; color: #45405e; overflow: hidden; }
summary { padding: 24px; cursor: pointer; }
summary:focus-visible { outline: 3px solid #ffe080; outline-offset: -3px; }
.record-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 8px; }
.status { white-space: nowrap; font-size: 13px; padding: 4px 8px; border-radius: 6px; background: #eef0ff; color: #667eea; }
.date, .expand-hint { font-size: 13px; color: #777; margin-top: 12px; }
.numbers { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; font-weight: 600; }
.correct { color: #24844c; }
.wrong { color: #cb3c54; }
.word-lists { border-top: 1px solid #eee; padding: 24px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
h2 { font-size: 17px; margin-bottom: 16px; }
ul { list-style: none; padding: 0; }
li { padding: 12px 0; border-bottom: 1px solid #eee; overflow-wrap: anywhere; }
li strong, li span { display: block; }
li span { color: #777; margin-top: 4px; font-size: 14px; }
.no-words { color: #888; font-size: 14px; }
.back-button { position: fixed; top: max(20px, env(safe-area-inset-top)); left: max(20px, env(safe-area-inset-left)); z-index: 50; min-height: 44px; padding: 8px 16px; border: 2px solid #ffffff66; border-radius: 8px; background: #ffffff33; backdrop-filter: blur(4px); color: white; font-size: 14px; font-weight: 600; cursor: pointer; }
@media (max-width: 600px) { .word-lists { grid-template-columns: 1fr; } .record-heading { align-items: flex-start; } summary, .word-lists { padding: 18px; } }
</style>

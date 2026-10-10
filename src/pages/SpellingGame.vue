<template>
  <div class="game-page" :class="{ 'has-error': showFeedback && !lastCorrect }">
    <!-- Back button -->
    <button class="btn-back" @click="goBack" title="返回">
      <span>← 返回</span>
    </button>

    <div class="container">
      <p class="learning-context">{{ currentUnit?.semesterName }} · {{ currentUnit?.name }}</p>
      <!-- Progress Bar -->
      <div class="progress-section">
        <div class="progress-info">
          <span class="progress-text">第 {{ Math.min(currentQuestionIndex + 1, totalQuestions) }} / {{ totalQuestions }} {{ learning ? '词' : '题' }}</span>
          <span class="score-text">{{ learning ? '学习模式' : `得分: ${score}` }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <!-- Question -->
      <div v-if="currentQuestion" class="question-section fade-in">
        <div v-if="!learning" class="question-timer">⏱ {{ formattedTime }}</div>
        <div class="hint-label">{{ currentQuestion.cn }}
          <button v-if="learning" class="speak-button" :disabled="!canSpeak || isSubmitting" @click="speakWord" aria-label="播放单词英语发音" title="播放单词英语发音">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
              <path d="M11 5 6 9H3v6h3l5 4V5Z" />
              <path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
            </svg>
          </button>
        </div>
        <p v-if="learning" class="learning-tip" aria-live="polite">{{ learningHint || '照着浅色字母逐个输入，拼完后自动进入下一词' }}</p>
        <p v-if="speechError || (learning && !canSpeak)" class="learning-tip" role="status">{{ speechError || '这个单词暂无内置录音' }}</p>

        <!-- Input Boxes -->
        <div class="input-boxes-wrapper">
          <div class="input-boxes" ref="inputBoxesRef">
            <input
              v-for="(char, index) in userInput"
              :key="index"
              :value="char === ' ' ? '␣' : char"
              type="text"
              maxlength="1"
              class="input-box"
              :class="{
                'box-correct': showFeedback && lastCorrect,
                'box-right-letter': showFeedback && !lastCorrect && letterStates[index] === 'right',
                'box-wrong-letter': showFeedback && !lastCorrect && letterStates[index] === 'wrong',

              }"
              readonly
            />
            <div v-for="n in (currentQuestion.en.length - userInput.length)" :key="'empty-' + n" class="input-box empty">
              <span v-if="learning" class="ghost-letter">{{ displayCharacter(currentQuestion.en[userInput.length + n - 1]) }}</span>
            </div>
          </div>

          <!-- Confetti -->
          <div
            v-for="piece in confettiPieces"
            :key="piece.id"
            class="confetti-piece"
            :class="{ circle: piece.shape === 'circle' }"
            :style="{
              left: piece.x + '%',
              top: '50%',
              backgroundColor: piece.color,
              width: piece.size + 'px',
              height: piece.size * 1.6 + 'px',
              animationDelay: piece.delay + 's',
              '--tx': piece.tx + 'px',
              '--ty': piece.ty + 'px',
              '--rot': piece.rotate + 'deg',
            }"
          ></div>
        </div>

        <!-- 错误时哭脸动画 -->
        <div v-if="showFeedback && !lastCorrect" class="cry-face">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- 脸 -->
            <circle cx="50" cy="50" r="46" fill="#FFD93D" stroke="#F4A100" stroke-width="3"/>
            <!-- 左眼 -->
            <ellipse cx="33" cy="38" rx="6" ry="7" fill="#333"/>
            <ellipse cx="35" cy="36" rx="2" ry="2" fill="white"/>
            <!-- 右眼 -->
            <ellipse cx="67" cy="38" rx="6" ry="7" fill="#333"/>
            <ellipse cx="69" cy="36" rx="2" ry="2" fill="white"/>
            <!-- 眉毛（八字皱眉） -->
            <path d="M24 28 Q33 22 38 26" stroke="#333" stroke-width="3" stroke-linecap="round" fill="none"/>
            <path d="M76 28 Q67 22 62 26" stroke="#333" stroke-width="3" stroke-linecap="round" fill="none"/>
            <!-- 嘴（哭嘴） -->
            <path d="M32 70 Q50 58 68 70" stroke="#333" stroke-width="3" stroke-linecap="round" fill="none"/>
            <!-- 左眼泪 -->
            <ellipse cx="30" cy="52" rx="3.5" ry="5" fill="#5DADE2" class="tear tear-left"/>
            <!-- 右眼泪 -->
            <ellipse cx="70" cy="52" rx="3.5" ry="5" fill="#5DADE2" class="tear tear-right"/>
          </svg>
        </div>

        <!-- 错误时显示正确答案方块 -->
        <div v-if="showFeedback && !lastCorrect" class="correct-answer-row">
          <div class="correct-answer-label">正确答案：</div>
          <div class="input-boxes">
            <div
              v-for="(char, index) in correctAnswerLetters"
              :key="'ans-' + index"
              class="input-box box-answer"
            >{{ char }}</div>
          </div>
          <button class="btn-next-question" :disabled="feedbackPlaying" @click="goToNextQuestion">下一题</button>
        </div>

        <!-- 正确时简短提示 -->
        <div v-if="showFeedback && lastCorrect" class="feedback feedback-correct">
          ✓ 正确！继续加油 🎉
        </div>
      </div>

      <!-- Game End -->
      <div v-else class="game-end">
        <template v-if="learning">
          <p>{{ totalQuestions ? '🎉 本单元学习完成！' : '本单元暂无单词' }}</p>
          <button class="btn btn-secondary" @click="router.push('/select?mode=learn')">返回单元</button>
          <button v-if="totalQuestions" class="btn btn-primary" @click="restartLearning">再学一遍</button>
        </template>
        <p v-else>游戏已结束，正在跳转...</p>
      </div>
    </div>

    <!-- 软键盘 -->
    <div v-if="currentQuestion" class="soft-keyboard" ref="keyboardRef">
      <div v-for="row in keyboardRows" :key="row.join('')" class="keyboard-row">
        <button
          v-for="key in row"
          :key="key"
          class="key-btn"
          :disabled="isSubmitting"
          :class="{
            'key-pressed': pressedKeys.has(key),
            'key-wide': key === 'DEL' || key === 'ENTER' || key === 'SPACE',
            'key-del': key === 'DEL',
            'key-enter': key === 'ENTER',
          }"
          @mousedown.prevent="(e: MouseEvent) => onKeyPress(key, e.currentTarget as HTMLElement)"
          @touchstart.prevent="(e: TouchEvent) => onKeyPress(key, e.currentTarget as HTMLElement)"
          @click="(e: MouseEvent) => { if (e.detail === 0) onKeyPress(key, e.currentTarget as HTMLElement) }"
        >
          <template v-if="key === 'DEL'">
            <span class="key-main">⌫</span>
            <span class="key-sub">DEL</span>
          </template>
          <template v-else-if="key === 'ENTER'">
            <span class="key-main">↵</span>
            <span class="key-sub">OK</span>
          </template>
          <template v-else-if="key === 'SPACE'">
            <span class="key-main">␣</span>
            <span class="key-sub">空格</span>
          </template>
          <template v-else>
            <span class="key-main">{{ key }}</span>
            <span class="key-sub">{{ key.toLowerCase() }}</span>
          </template>
        </button>
      </div>
    </div>
    <canvas ref="flyCanvas" class="fly-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameState } from '../composables/useGameState'
import { usePlayerProfile } from '../composables/usePlayerProfile'
import { getUnit } from '../utils/wordLoader'
import { useLearningState } from '../composables/useLearningState'
import { createWordAudioPlayer, hasWordAudio } from '../utils/wordAudio'
import { useSettings } from '../composables/useSettings'

const props = defineProps<{ learning?: boolean }>()
const route = useRoute()

const router = useRouter()
const gameState = useGameState()
const playerProfile = usePlayerProfile()

const {
  currentUnitId,
  currentQuestionIndex,
  questions,
  score,
  elapsedSeconds,
  currentQuestion,
  isGameEnd,
  submitAnswer
} = props.learning ? useLearningState(typeof route.query.unit === 'string' ? route.query.unit : '') : gameState
const currentUnit = computed(() => getUnit(currentUnitId.value))
const learningHint = ref('')
const speechError = ref('')
const canSpeak = computed(() => Boolean(currentQuestion.value && hasWordAudio(currentQuestion.value.en)))
const wordPlayer = createWordAudioPlayer()
let advanceTimer: ReturnType<typeof setTimeout> | undefined
const feedbackPlaying = ref(false)
let feedbackId = 0
const displayCharacter = (char: string) => char === ' ' ? '␣' : char

function stopSpeech() {
  feedbackId++
  feedbackPlaying.value = false
  wordPlayer.stop()
}

function speakWord() {
  if (!currentQuestion.value) return
  stopSpeech()
  speechError.value = ''
  wordPlayer.play(currentQuestion.value.en, message => { speechError.value = message })
}

function restartLearning() {
  stopSpeech()
  currentQuestionIndex.value = 0
  userInput.value = []
  learningHint.value = ''
  speechError.value = ''
}

const formattedTime = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60)
  const s = elapsedSeconds.value % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
})

// ======== Sound Effects (Web Audio API) ========
const { keySoundEnabled } = useSettings()
let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playKeyClick() {
  if (!keySoundEnabled.value) return
  const ctx = getAudioCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05)
  gain.gain.setValueAtTime(0.18, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.08)
}

function playDeleteClick() {
  if (!keySoundEnabled.value) return
  const ctx = getAudioCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.06)
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.08)
}

function playCorrect(onEnded: () => void) {
  const ctx = getAudioCtx()
  if (ctx.state === 'suspended') void ctx.resume().catch(onEnded)
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    if (i === notes.length - 1) osc.onended = onEnded
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    const t = ctx.currentTime + i * 0.1
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.22, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    osc.start(t)
    osc.stop(t + 0.18)
  })
}

function playWrong(onEnded: () => void) {
  const ctx = getAudioCtx()
  if (ctx.state === 'suspended') void ctx.resume().catch(onEnded)
  const notes = [311.13, 277.18] // Eb4 Db4 下行短促
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    if (i === notes.length - 1) osc.onended = onEnded
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    const t = ctx.currentTime + i * 0.13
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.18, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
    osc.start(t)
    osc.stop(t + 0.2)
  })
}

const userInput = ref<string[]>([])
const showFeedback = ref(false)
const lastCorrect = ref(false)
const isSubmitting = ref(false)
const letterStates = ref<('right' | 'wrong')[]>([])   // 逐字母对比结果
const correctAnswerLetters = ref<string[]>([])          // 正确答案字母数组
// -------- 飞行字母动画 --------
const flyCanvas = ref<HTMLCanvasElement | null>(null)
const keyboardRef = ref<HTMLElement | null>(null)
const inputBoxesRef = ref<HTMLElement | null>(null)

// 软键盘
const keyboardRows = [
  ['Q','W','E','R','T','Y','U','I','O','P','DEL'],
  ['A','S','D','F','G','H','J','K','L','-','SPACE'],
  ['Z','X','C','V','B','N','M','ENTER'],
]
const pressedKeys = ref<Set<string>>(new Set())

function flashKey(key: string) {
  pressedKeys.value = new Set([...pressedKeys.value, key])
  setTimeout(() => {
    const next = new Set(pressedKeys.value)
    next.delete(key)
    pressedKeys.value = next
  }, 150)
}

function onKeyPress(key: string, sourceEl?: HTMLElement | null) {
  if (!currentQuestion.value || isSubmitting.value) return
  flashKey(key)
  if (key === 'DEL') {
    learningHint.value = ''
    playDeleteClick()
    userInput.value = userInput.value.slice(0, -1)
  } else if (key === 'ENTER') {
    submitCurrentAnswer()
  } else {
    if (userInput.value.length < currentQuestion.value.en.length) {
      const character = key === 'SPACE' ? ' ' : key.toLowerCase()
      if (/^[a-z]$/.test(character)) {
        speechError.value = ''
        wordPlayer.play(character, message => { speechError.value = message })
      } else {
        playKeyClick()
      }
      if (props.learning && character !== currentQuestion.value.en[userInput.value.length].toLowerCase()) {
        learningHint.value = `请点击字母 ${displayCharacter(currentQuestion.value.en[userInput.value.length])}`
        return
      }
      learningHint.value = ''
      flyLetter(character === ' ' ? '␣' : character, userInput.value.length, sourceEl ?? null)
      userInput.value = [...userInput.value, character]
      if (props.learning && userInput.value.length === currentQuestion.value.en.length) submitCurrentAnswer()
    }
  }
}

interface ConfettiPiece {
  id: number
  x: number
  color: string
  rotate: number
  tx: number
  ty: number
  size: number
  delay: number
  shape: 'rect' | 'circle'
}
const confettiPieces = ref<ConfettiPiece[]>([])
const CONFETTI_COLORS = ['#f44336','#ff9800','#ffeb3b','#4caf50','#2196f3','#9c27b0','#e91e63','#00bcd4','#ff5722']

function launchConfetti() {
  const pieces: ConfettiPiece[] = []
  for (let i = 0; i < 50; i++) {
    pieces.push({
      id: i,
      x: 5 + Math.random() * 90,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotate: Math.random() * 720 - 360,
      tx: (Math.random() - 0.5) * 280,
      ty: -(60 + Math.random() * 160),
      size: 6 + Math.random() * 7,
      delay: Math.random() * 0.25,
      shape: Math.random() > 0.45 ? 'rect' : 'circle',
    })
  }
  confettiPieces.value = pieces
  setTimeout(() => { confettiPieces.value = [] }, 1200)
}

const totalQuestions = computed(() => questions.value.length)
const progressPercent = computed(() => {
  return totalQuestions.value > 0 ? (currentQuestionIndex.value / totalQuestions.value) * 100 : 0
})

const handleKeydown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return
  if ((e.target as HTMLElement)?.closest('button') && (e.key === 'Enter' || e.key === ' ')) return
  const key = e.key === 'Backspace' ? 'DEL' : e.key === 'Enter' ? 'ENTER'
    : e.key === ' ' ? 'SPACE' : /^[a-zA-Z-]$/.test(e.key) ? e.key.toUpperCase() : null
  if (key) {
    e.preventDefault()
    onKeyPress(key)
  }
}

const goBack = () => {
  if (props.learning) {
    router.push('/select?mode=learn')
    return
  }
  if (confirm('确定要退出游戏吗？进度将不被保存。')) {
    gameState.resetGame()
    router.push('/select')
  }
}

const submitCurrentAnswer = async () => {
  if (!currentQuestion.value || isSubmitting.value) return
  if (userInput.value.length === 0) return
  if (props.learning && userInput.value.length !== currentQuestion.value.en.length) {
    learningHint.value = '继续输入剩余的浅色字母'
    return
  }

  isSubmitting.value = true
  // Lock input immediately, but let the last letter finish before feedback starts.
  const pendingFeedbackId = feedbackId
  await wordPlayer.whenFinished()
  if (pendingFeedbackId !== feedbackId) return

  const answer = userInput.value.join('')
  const isCorrect = answer.toUpperCase() === currentQuestion.value.en.toUpperCase()

  lastCorrect.value = isCorrect

  // 逐字母对比，生成高亮状态和正确答案（不足位视为答错）
  const correctWord = currentQuestion.value.en.toLowerCase()
  letterStates.value = correctWord.split('').map((ch, i) => (answer[i] ?? '').toLowerCase() === ch ? 'right' : 'wrong')
  correctAnswerLetters.value = correctWord.split('')

  showFeedback.value = true
  stopSpeech()
  speechError.value = ''
  feedbackPlaying.value = true
  const id = feedbackId
  const feedbackStarted = Date.now()
  let wordStarted = false

  const finishFeedback = () => {
    if (id !== feedbackId) return
    feedbackPlaying.value = false
    if (!isCorrect) return
    // Keep feedback visible for at least two seconds, and let the word finish.
    advanceTimer = setTimeout(() => {
      if (id !== feedbackId) return
      stopSpeech()
      submitAnswer(answer)
      speechError.value = ''
      showFeedback.value = false
      userInput.value = []
      isSubmitting.value = false
      if (isGameEnd.value && !props.learning) router.push('/result')
    }, Math.max(0, 2000 - (Date.now() - feedbackStarted)))
  }

  const playAnswerWord = () => {
    if (id !== feedbackId || wordStarted) return
    wordStarted = true
    wordPlayer.play(correctWord, message => {
      speechError.value = message
      finishFeedback()
    }, finishFeedback)
  }

  if (isCorrect) {
    playCorrect(playAnswerWord)
    launchConfetti()
  } else {
    playWrong(playAnswerWord)
    if (!props.learning) playerProfile.recordErrorWord(currentQuestion.value, currentUnitId.value)
  }
  if (!props.learning) playerProfile.updateScore(isCorrect, 10)

}

const goToNextQuestion = () => {
  if (feedbackPlaying.value) return
  stopSpeech()
  const answer = userInput.value.join('')
  submitAnswer(answer)
  showFeedback.value = false
  userInput.value = []
  isSubmitting.value = false

  if (isGameEnd.value) {
    router.push('/result')
  }
}

// ======== Flying Letter Animation System ========
interface FlyingStar {
  x: number; y: number
  vx: number; vy: number
  life: number
  size: number; color: string
}
interface FlyAnim {
  char: string
  t: number          // 0 → 1
  sx: number; sy: number   // start
  ex: number; ey: number   // end
  stars: FlyingStar[]
  lastSpawnT: number
}

const flyQueue: FlyAnim[] = []
let flyRafId: number | null = null
const STAR_COLORS = ['#FFD700','#FFF176','#FFEB3B','#FFA726','#ffffff','#a78bfa','#f472b6','#86efac','#7dd3fc']

function drawStar5(ctx: CanvasRenderingContext2D, r: number) {
  const inner = r * 0.42
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : inner
    const angle = (Math.PI / 5) * i - Math.PI / 2
    if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
  }
  ctx.closePath()
  ctx.fill()
}

function startFlyLoop() {
  if (flyRafId !== null) return
  const canvas = flyCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!

  function loop() {
    ctx.clearRect(0, 0, canvas!.width, canvas!.height)

    for (let i = flyQueue.length - 1; i >= 0; i--) {
      const a = flyQueue[i]
      a.t = Math.min(1, a.t + 0.0167)   // 1000ms (60fps)

      const bx = a.sx + (a.ex - a.sx) * a.t
      const by = a.sy + (a.ey - a.sy) * a.t

      // spawn trail stars
      if (a.t - a.lastSpawnT > 0.09 && a.t < 0.92) {
        a.lastSpawnT = a.t
        for (let k = 0; k < 2; k++) {
          a.stars.push({
            x: bx + (Math.random() - 0.5) * 8,
            y: by + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2 - 0.2,
            life: 1,
            size: 2.5 + Math.random() * 4,
            color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          })
        }
      }

      // burst stars when arriving
      if (a.t >= 1 && a.stars.length === 0) {
        for (let k = 0; k < 12; k++) {
          const angle = (Math.PI * 2 / 12) * k
          const spd = 2 + Math.random() * 3.5
          a.stars.push({
            x: a.ex, y: a.ey,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 1,
            size: 3.5 + Math.random() * 4,
            color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          })
        }
      }

      // draw & update stars
      for (let j = a.stars.length - 1; j >= 0; j--) {
        const s = a.stars[j]
        s.x += s.vx; s.y += s.vy
        s.vy += 0.12   // reduced gravity
        s.vx *= 0.985
        s.life -= 0.025
        if (s.life <= 0) { a.stars.splice(j, 1); continue }
        ctx.save()
        ctx.globalAlpha = Math.max(0, s.life)
        ctx.fillStyle = s.color
        ctx.shadowColor = s.color
        ctx.shadowBlur = 6
        ctx.translate(s.x, s.y)
        drawStar5(ctx, s.size * s.life)
        ctx.restore()
      }

      // draw flying letter (fades out in last 20%)
      if (a.t < 1) {
        const fadeAlpha = a.t > 0.82 ? 1 - (a.t - 0.82) / 0.18 : 1
        ctx.save()
        ctx.globalAlpha = fadeAlpha
        ctx.font = 'bold 32px system-ui, sans-serif'
        ctx.fillStyle = '#FFD700'
        ctx.shadowColor = '#FF6B9D'
        ctx.shadowBlur = 16
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(a.char, bx, by)
        ctx.restore()
      }

      if (a.t >= 1 && a.stars.length === 0) {
        flyQueue.splice(i, 1)
      }
    }

    if (flyQueue.length > 0) {
      flyRafId = requestAnimationFrame(loop)
    } else {
      flyRafId = null
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)
    }
  }

  flyRafId = requestAnimationFrame(loop)
}

function flyLetter(char: string, targetIndex: number, sourceEl: HTMLElement | null) {
  const canvas = flyCanvas.value
  if (!canvas) return

  // source: pressed key center, or keyboard top-center
  let sx: number, sy: number
  if (sourceEl) {
    const r = sourceEl.getBoundingClientRect()
    sx = r.left + r.width / 2
    sy = r.top + r.height / 2
  } else if (keyboardRef.value) {
    const r = keyboardRef.value.getBoundingClientRect()
    sx = r.left + r.width / 2
    sy = r.top + 20
  } else {
    sx = window.innerWidth / 2
    sy = window.innerHeight - 100
  }

  // target: the n-th input-box (includes both filled inputs & empty divs)
  let ex: number, ey: number
  if (inputBoxesRef.value) {
    const boxes = inputBoxesRef.value.querySelectorAll('.input-box')
    if (targetIndex < boxes.length) {
      const r = boxes[targetIndex].getBoundingClientRect()
      ex = r.left + r.width / 2
      ey = r.top + r.height / 2
    } else {
      ex = window.innerWidth / 2
      ey = sy - 120
    }
  } else {
    ex = window.innerWidth / 2
    ey = sy - 120
  }

  flyQueue.push({ char: char.toUpperCase(), t: 0, sx, sy, ex, ey, stars: [], lastSpawnT: 0 })
  startFlyLoop()
}

function resizeCanvas() {
  const c = flyCanvas.value
  if (!c) return
  c.width = window.innerWidth
  c.height = window.innerHeight
}

onMounted(() => {
  // 检查是否有保存的游戏进度
  if (!props.learning && questions.value.length === 0) {
    const savedState = gameState.loadGameState()
    if (savedState && savedState.questions.length > 0) {
      // 恢复保存的游戏进度
      gameState.restoreGameState(savedState)
    } else {
      // 没有保存的进度，重定向回选择页面
      router.push('/select')
      return
    }
  }

  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', resizeCanvas)
  resizeCanvas()
})

onUnmounted(() => {
  if (advanceTimer) clearTimeout(advanceTimer)
  stopSpeech()
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', resizeCanvas)
  if (flyRafId !== null) cancelAnimationFrame(flyRafId)
  flyQueue.length = 0
})
</script>

<style scoped>
.ghost-letter { color: rgba(79, 70, 229, .3); }
.learning-tip { text-align: center; color: #777; font-size: 14px; margin: 12px 0; }
.speak-button { display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: #eef0ff; color: #667eea; font-size: inherit; padding: .15em; width: 1em; height: 1em; margin-left: .25em; cursor: pointer; vertical-align: -.1em; transition: background .15s ease, transform .15s ease; }
.speak-button svg { width: 100%; height: 100%; }
.speak-button:hover:not(:disabled) { background: #e0e5ff; }
.speak-button:active:not(:disabled) { transform: scale(.94); }
.speak-button:disabled { opacity: .4; cursor: not-allowed; }
.speak-button:focus-visible { outline: 3px solid #667eea; outline-offset: 3px; }
.game-page {
  width: 100%;
  min-height: 100dvh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.container {
  max-width: 600px;
  width: 100%;
  flex: 1;
}

.progress-section {
  margin-bottom: 40px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  color: white;
  margin-bottom: 12px;
  font-size: 16px;
}

.timer-row {
  display: none;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
  transition: width 0.3s ease;
}

.question-section {
  background: white;
  border-radius: 16px;
  padding: 40px 24px 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  position: relative;
}

.question-timer {
  position: absolute;
  bottom: 12px;
  right: 16px;
  font-size: 12px;
  color: #bbb;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.hint-label {
  font-size: 32px;
  font-weight: 700;
  color: #667eea;
  text-align: center;
  margin-bottom: 32px;
}

.input-boxes-wrapper {
  position: relative;
  margin-bottom: 32px;
}

.input-boxes {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.input-box {
  width: 48px;
  height: 48px;
  border: 2px solid #ddd;
  border-radius: 8px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  background: #f9f9f9;
  transition: all 0.2s ease;
}

.input-box:not(.empty) {
  border-color: #667eea;
  background: #f0f4ff;
  animation: slideIn 0.2s ease;
}

.input-box.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

/* 正确时全绿 */
.box-correct {
  border-color: #4caf50 !important;
  background: #e8f5e9 !important;
  color: #2e7d32 !important;
}

/* 错误时：打对的字母绿，打错的字母红 */
.box-right-letter {
  border-color: #4caf50 !important;
  background: #e8f5e9 !important;
  color: #2e7d32 !important;
}

.box-wrong-letter {
  border-color: #e53935 !important;
  background: #ffebee !important;
  color: #b71c1c !important;
  animation: shake 0.4s ease;
}

/* 抖动方块 */

/* 正确答案行 */
.correct-answer-row {
  margin-bottom: 16px;
  text-align: center;
}

.correct-answer-label {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}

.box-answer {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border-color: #4caf50 !important;
  background: #e8f5e9 !important;
  color: #2e7d32 !important;
  font-size: 20px;
}

/* -------- 哭脸 -------- */
.cry-face {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  animation: cry-bounce 0.5s ease;
}

.cry-face svg {
  width: 80px;
  height: 80px;
}

.tear {
  animation: tear-drop 0.8s ease-in infinite;
  transform-origin: top center;
}

.tear-right {
  animation-delay: 0.4s;
}

@keyframes cry-bounce {
  0%   { transform: scale(0.3); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}

@keyframes tear-drop {
  0%   { transform: translateY(0);   opacity: 1; }
  80%  { transform: translateY(18px); opacity: 0.6; }
  100% { transform: translateY(24px); opacity: 0; }
}

/* 正确反馈文字 */
.feedback-correct {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #2e7d32;
  background: #c8e6c9;
  padding: 10px;
  border-radius: 8px;
  animation: fadeIn 0.3s ease;
}

/* -------- Confetti -------- */
.confetti-piece {
  position: absolute;
  border-radius: 2px;
  pointer-events: none;
  transform-origin: center;
  animation: confetti-fly 1s ease-out forwards;
}

.confetti-piece.circle {
  border-radius: 50%;
}

@keyframes confetti-fly {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) rotate(var(--rot));
    opacity: 0;
  }
}

.feedback {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  padding: 12px;
  border-radius: 8px;
  animation: fadeIn 0.3s ease;
}

.feedback.correct {
  background: #c8e6c9;
  color: #2e7d32;
}

.feedback.wrong {
  background: #ffcdd2;
  color: #c62828;
}

.game-end {
  text-align: center;
  color: white;
  font-size: 18px;
}

/* -------- 软键盘（机械键盘风格） -------- */
.soft-keyboard {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #1a1a2e;
  padding: 16px 2vw 22px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -6px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
  z-index: 100;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 0 4px;
}

.key-btn {
  flex: 1;
  max-width: 72px;
  height: 56px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(180deg, #2d2d4e 0%, #222240 100%);
  color: #e0e0ff;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 4px 2px 6px;
  position: relative;
  /* 机械键帽：顶面高光 + 底部厚边 */
  box-shadow:
    0 5px 0 #0d0d1f,
    0 6px 0 rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.12),
    inset 0 -1px 0 rgba(0,0,0,0.4);
  transition: transform 0.07s, box-shadow 0.07s, background 0.07s;
  -webkit-tap-highlight-color: transparent;
}

.key-btn::before {
  content: '';
  position: absolute;
  inset: 2px 2px auto 2px;
  height: 40%;
  border-radius: 6px 6px 0 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%);
  pointer-events: none;
}

.key-main {
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
  color: #e8e8ff;
  letter-spacing: 0;
}

.key-sub {
  font-size: 9px;
  font-weight: 500;
  color: rgba(160,160,220,0.7);
  letter-spacing: 0.5px;
  line-height: 1;
}

.key-btn:hover {
  background: linear-gradient(180deg, #3a3a60 0%, #2a2a50 100%);
}

.key-btn.key-pressed {
  transform: translateY(5px);
  box-shadow:
    0 0 0 #0d0d1f,
    inset 0 2px 4px rgba(0,0,0,0.5),
    inset 0 -1px 0 rgba(0,0,0,0.3);
  background: linear-gradient(180deg, #222240 0%, #1a1a35 100%);
}

/* 宽键：DEL / ENTER */
.key-wide {
  max-width: 100px;
}

.key-wide .key-main {
  font-size: 20px;
}

.key-wide .key-sub {
  font-size: 9px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* 删除键：红色调 */
.key-del {
  background: linear-gradient(180deg, #5c1a1a 0%, #430e0e 100%);
  box-shadow:
    0 5px 0 #1a0505,
    0 6px 0 rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,120,120,0.15),
    inset 0 -1px 0 rgba(0,0,0,0.4);
}

.key-del .key-main { color: #ff8a80; }
.key-del .key-sub  { color: rgba(255,138,128,0.6); }

.key-del:hover {
  background: linear-gradient(180deg, #712020 0%, #551212 100%);
}

.key-del.key-pressed {
  background: linear-gradient(180deg, #430e0e 0%, #350a0a 100%);
  box-shadow: 0 0 0 #1a0505, inset 0 2px 4px rgba(0,0,0,0.6);
}

/* 确认键：蓝紫发光 */
.key-enter {
  background: linear-gradient(180deg, #1e3a6e 0%, #152a52 100%);
  box-shadow:
    0 5px 0 #070e1f,
    0 6px 0 rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(100,180,255,0.2),
    inset 0 -1px 0 rgba(0,0,0,0.4);
}

.key-enter .key-main { color: #82cfff; font-size: 22px; }
.key-enter .key-sub  { color: rgba(130,207,255,0.6); }

.key-enter:hover {
  background: linear-gradient(180deg, #254a88 0%, #1b3666 100%);
}

.key-enter.key-pressed {
  background: linear-gradient(180deg, #152a52 0%, #0f1f3d 100%);
  box-shadow: 0 0 0 #070e1f, inset 0 2px 4px rgba(0,0,0,0.6);
}

@media (max-width: 480px) {
  .key-btn {
    height: 48px;
    border-radius: 7px;
    max-width: 54px;
  }
  .key-main { font-size: 15px; }
  .key-wide { max-width: 72px; }
  .soft-keyboard { gap: 5px; padding: 12px 4px 18px; }
  .game-page { padding-bottom: 210px; }
}

@media (max-width: 600px) {
  .hint-label {
    font-size: 24px;
  }

  .input-box {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .progress-info {
    font-size: 14px;
  }
}

/* -------- flying letter canvas overlay -------- */
/* Keep tablet practice inside the visible viewport, including feedback states. */
@media (min-width: 800px) and (orientation: landscape) {
  .game-page {
    position: fixed;
    inset: 0;
    height: 100dvh;
    min-height: 0;
    padding: 12px 20px 0;
    overflow: hidden;
    overscroll-behavior: none;
    touch-action: none;
    gap: 12px;
  }

  .container {
    max-width: 1000px;
    min-height: 0;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
  }

  .learning-context { margin: 0 100px 8px; }
  .progress-section { margin-bottom: 12px; }
  .progress-info { margin-bottom: 6px; }
  .question-section {
    flex: 1;
    min-height: 0;
    padding: 12px 24px 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }
  .hint-label { font-size: clamp(24px, 4dvh, 36px); margin-bottom: 0; }
  .learning-tip { margin: 0; }
  .input-boxes-wrapper { margin-bottom: 0; }
  .input-boxes { gap: 5px; }
  .input-box {
    width: clamp(30px, 5dvh, 48px);
    height: clamp(30px, 5dvh, 48px);
    font-size: clamp(16px, 2.6dvh, 20px);
  }
  .correct-answer-row { margin: 0; }
  .correct-answer-label { margin-bottom: 4px; }
  .btn-next-question { margin-top: 8px; padding: 8px 24px; }
  .cry-face { position: absolute; top: 12px; right: 12px; margin: 0; }
  .cry-face svg { width: 36px; height: 36px; }
  .has-error .hint-label { padding: 0 32px; }
  .feedback { padding: 6px; font-size: 16px; }
  .soft-keyboard {
    position: relative;
    flex: none;
    width: calc(100% + 40px);
    gap: 8px;
    padding: 12px max(2vw, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(2vw, env(safe-area-inset-left));
  }
  .key-btn { height: clamp(40px, 8dvh, 64px); }
}

@media (min-width: 800px) and (orientation: landscape) and (max-height: 650px) {
  .game-page { gap: 8px; padding-top: 8px; }
  .learning-context { margin-bottom: 4px; font-size: 13px; }
  .progress-section { margin-bottom: 8px; }
  .question-section { gap: 4px; padding: 8px 16px 20px; }
  .hint-label { font-size: 24px; }
  .input-box { width: 28px; height: 28px; font-size: 16px; }
  .input-boxes { gap: 4px; }
  .btn-next-question { margin-top: 4px; padding: 6px 24px; }
  .soft-keyboard { padding-top: 8px; }
}

.fly-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}
</style>

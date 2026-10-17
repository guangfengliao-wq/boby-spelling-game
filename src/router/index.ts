import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import UnitSelect from '../pages/UnitSelect.vue'
import CustomDictation from '../pages/CustomDictation.vue'
import SpellingGame from '../pages/SpellingGame.vue'
import Result from '../pages/Result.vue'
import ErrorReview from '../pages/ErrorReview.vue'
import WordLearn from '../pages/WordLearn.vue'
import WordBook from '../pages/WordBook.vue'
import Career from '../pages/Career.vue'
import Phonetics from '../pages/Phonetics.vue'

const routes = [
  { path: '/', component: Home, name: 'Home' },
  { path: '/select', component: UnitSelect, name: 'UnitSelect' },
  { path: '/custom-dictation', component: CustomDictation, name: 'CustomDictation' },
  { path: '/custom-learn', component: CustomDictation, name: 'CustomLearn' },
  { path: '/game', component: SpellingGame, name: 'SpellingGame' },
  { path: '/learn', component: WordLearn, name: 'WordLearn' },
  { path: '/wordbook', component: WordBook, name: 'WordBook' },
  { path: '/career', component: Career, name: 'Career' },
  { path: '/phonetics', component: Phonetics, name: 'Phonetics' },
  { path: '/result', component: Result, name: 'Result' },
  { path: '/error-review', component: ErrorReview, name: 'ErrorReview' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

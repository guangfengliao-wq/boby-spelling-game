<template>
  <SpellingGame :key="route.fullPath" learning />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import SpellingGame from './SpellingGame.vue'
const route = useRoute()
</script>
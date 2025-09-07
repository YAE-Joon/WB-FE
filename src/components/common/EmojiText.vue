<template>
  <span class="emoji-text">{{ text }}</span>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.emoji-text {
  display: inline-block !important;
  transform: skew(12deg) !important;  /* 부모의 -12deg를 상쇄 */
  font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-style: normal !important;
  font-weight: normal !important;
  text-shadow: none !important;
}
</style>
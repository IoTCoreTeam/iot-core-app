<template>
  <div class="relative min-h-[90vh] flex flex-col">
    <AppHeader />

    <!-- Spinner -->
    <div
      v-if="!hasContent"
      class="flex items-center justify-center flex-1 bg-white h-[80vh]"
    >
      <div class="relative w-8 h-8">
        <div
          class="absolute inset-0 border-4 border-blue-300 border-t-blue-800 rounded-full animate-spin"
        ></div>
        <div
          class="absolute inset-1 border-4 border-blue-200 border-t-transparent rounded-full animate-spin-slow"
        ></div>
      </div>
    </div>

    <!-- Nội dung -->
    <v-main v-else class="flex-1">
      <slot />
    </v-main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import AppHeader from '~/components/AppHeader.vue'
import AppFooter from '~/components/AppFooter.vue'

const hasContent = ref(false)

onMounted(async () => {
  await nextTick()
  // Kiểm tra slot có nội dung hay không
  const slotEl = document.querySelector('v-main slot')
  if (slotEl && slotEl.assignedNodes().length > 0) {
    hasContent.value = true
  } else {
    // Giả lập delay khi đang load
    setTimeout(() => (hasContent.value = true), 3000)
  }
})
</script>

<style scoped>
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 2.5s linear infinite;
}
</style>

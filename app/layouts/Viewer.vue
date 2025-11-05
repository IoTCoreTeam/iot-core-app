<template>
  <div class="relative min-h-[90vh] flex flex-col">
    <!-- Header cố định -->
    <AppHeader />

    <!-- Nội dung -->
    <main class="relative flex-1 bg-white flex justify-center">
      <!-- Spinner -->
      <div
        v-if="loading"
        class="flex items-center justify-center w-full h-full my-auto"
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

      <!-- Nội dung page -->
      <div v-else class="w-full h-full">
        <slot />
      </div>
    </main>

    <!-- Footer cố định -->
    <AppFooter />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '~/components/AppHeader.vue'
import AppFooter from '~/components/AppFooter.vue'

const loading = ref(false)
const route = useRoute()

// Khi đổi route -> hiển thị spinner trước khi render page
watch(
  () => route.fullPath,
  async () => {
    loading.value = true
    // Giả lập thời gian tải (bạn có thể thay bằng chờ API)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    loading.value = false
  }
)
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

<template>
  <div class="relative min-h-screen flex flex-col bg-white">
    <!-- Layout hiển thị page -->
    <Viewer>
      <!-- Chỉ NuxtPage được reload -->
      <NuxtPage :key="$route.fullPath" />
    </Viewer>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import Viewer from '~/layouts/Viewer.vue'

// vẫn theo dõi route để reload NuxtPage nếu cần
const route = useRoute()
</script>

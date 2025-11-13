<template>
  <div class="relative min-h-screen flex flex-col bg-white">
    <!-- Layout hiển thị page -->
    <NuxtLayout>
      <!-- Chỉ NuxtPage được reload -->
      <NuxtPage :key="$route.fullPath" />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
// vẫn theo dõi route để reload NuxtPage nếu cần
const route = useRoute();
</script>

<template>
  <div class="relative min-h-screen flex flex-col bg-white">
    <!-- Layout hi?n th? page -->
    <NuxtLayout>
      <!-- Ch? NuxtPage du?c reload -->
      <NuxtPage :key="$route.fullPath" />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useMetrics } from "@/composables/useMetrics";

const route = useRoute();
const { fetchMetrics } = useMetrics();

onMounted(() => {
  fetchMetrics();
});
</script>

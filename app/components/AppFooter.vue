<template>
  <footer
    class="w-full flex items-center justify-between px-6 py-10 bg-white border-t border-gray-200 mt-auto"
  >
    <!-- Left: Copyright -->
    <div>
      <p class="text-sm text-gray-500">
        &copy; 2026 IOT CORE SYSTEM. All rights reserved.
      </p>
    </div>
    <!-- Right: Links -->
    <div>
      <p class="text-sm text-gray-500">
        Designed by IOT CORE RESEARCH TEAM.
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<style scoped>
/* Additional custom styles if needed */
</style>

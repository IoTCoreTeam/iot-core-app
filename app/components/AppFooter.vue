<template>
  <footer
    class="w-full flex items-center justify-between px-6 py-10 bg-white border-t border-gray-200 mt-auto"
  >
    <!-- Left: Copyright -->
    <div>
      <p class="text-sm text-gray-500">
        &copy; 2024 IOT CORE. All rights reserved.
      </p>
    </div>
    <!-- Right: Links -->
    <div class="flex space-x-4">
      <a href="#" class="text-sm text-blue-800 hover:underline"
        >Privacy Policy</a
      >
      <a href="#" class="text-sm text-blue-800 hover:underline"
        >Terms of Service</a
      >
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

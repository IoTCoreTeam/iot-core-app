<template>
  <header
    class="w-full flex items-center px-8 py-4 bg-white border-b border-gray-200 shadow-sm"
  >
    <!-- Left: App name -->
    <a href="">
      <h1 class="text-md font-bold text-blue-900 tracking-tight">
        IOT ROUTING MANAGEMENT
      </h1>
    </a>

    <!-- Navigation -->
    <div class="flex items-center space-x-8 ml-8">
      <div class="text-gray-700 text-sm font-medium">
        <NuxtLink to="" class="text-gray-700 hover:text-blue-700 cursor-pointer">Devices Control</NuxtLink>
      </div>
      <div class="text-gray-700 text-sm font-medium">
        <NuxtLink to="" class="text-gray-700 hover:text-blue-700 cursor-pointer">Map Configuration</NuxtLink>
      </div>
      <div class="text-gray-700 text-sm font-medium">
        <NuxtLink to="" class="text-gray-700 hover:text-blue-700 cursor-pointer">Scenarios</NuxtLink>
      </div>
      <div class="text-gray-700 text-sm font-medium">
        <NuxtLink to="" class="text-gray-700 hover:text-blue-700 cursor-pointer ">Logs</NuxtLink>
      </div>
      <!-- Internal dropdown (Vue-based) -->
      <div class="relative text-sm font-medium cursor-pointer">
        <button
          @click="toggleDropdown"
          class="flex items-center text-gray-700 hover:text-blue-700 transition-colors"
        >
          Internal
          <svg
            class="w-3 h-3 ml-1 mt-1 transition-transform duration-200"
            :class="{ 'rotate-180': isOpen }"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <div
          v-if="isOpen"
          @click.outside="isOpen = false"
          class="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
        >
          <NuxtLink
            to="/company-setup"
            class="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            @click="isOpen = false"
          >
            Company Setup
          </NuxtLink>
          <NuxtLink
            to=""
            class="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            @click="isOpen = false"
          >
            Users Management
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Right: Company & Account -->
    <div class="flex items-center space-x-6 ml-auto">
      <div class="text-gray-700 text-sm font-medium">
        <NuxtLink to="/company-setup" class="text-gray-700 hover:text-blue-700">Company</NuxtLink>
      </div>
      <div class="text-gray-700 text-sm font-medium mr-4">
        <NuxtLink to="/company-setup" class="text-gray-700 hover:text-blue-700">My Account</NuxtLink>
      </div>
      <!-- Account -->
      <div
        class="flex items-center space-x-6 cursor-pointer hover:text-blue-700 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 text-gray-600"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 
                9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 
                1-5.982-2.275M15 9.75a3 3 0 1 1-6 
                0 3 3 0 0 1 6 0Z"
          />
        </svg>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";

const isOpen = ref(false);

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}
</script>

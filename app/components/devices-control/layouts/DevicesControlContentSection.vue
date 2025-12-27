<template>
  <div class="bg-white p-4">
    <h2 class="text-2xl font-bold text-gray-900">
      {{ section.headline }}
    </h2>
    <p class="mt-3 text-sm text-gray-600 max-w-3xl">
      {{ section.body }}
    </p>
    <div class="mt-6 overflow-x-auto w-full">
      <table class="w-full">
        <thead>
          <tr class="text-xs uppercase tracking-wide text-slate-500">
            <th class="px-3 py-2 text-left">
              Spotlight
            </th>
            <th class="px-3 py-2 text-left">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="section.cards.length > 0">
            <tr
              v-for="card in section.cards"
              :key="card.title"
              class="border-b border-slate-100 last:border-b-0"
            >
              <td class="px-3 py-4 align-top">
                <p class="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  {{ card.kicker }}
                </p>
                <p class="text-base font-semibold text-slate-900 mt-1">
                  {{ card.title }}
                </p>
              </td>
              <td class="px-3 py-4 text-sm text-slate-600 align-top">
                {{ card.description }}
              </td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="2" class="py-6 text-center text-gray-400 text-xs">
              No highlights recorded for this section yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Section } from "@/types/devices-control";

defineProps<{
  section: Section;
}>();
</script>

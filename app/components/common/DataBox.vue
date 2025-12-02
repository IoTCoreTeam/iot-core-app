<template>
  <div class="overflow-x-auto w-full">
    <table class="w-full">
      <thead>
        <slot name="head" />
      </thead>

      <tbody>
        <tr v-if="isLoading">
          <td :colspan="columns" class="text-center py-12">
            <slot name="loading">
              <LoadingState :message="loadingText" />
            </slot>
          </td>
        </tr>
        <template v-else>
          <slot v-if="hasData" />
          <tr v-else>
            <td :colspan="columns" class="py-6 text-center text-gray-400">
              <slot name="empty">No data found.</slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <!-- Pagination -->
    <div
      v-if="pagination"
      class="px-2 py-1 border-t border-gray-200 bg-gray-50 flex items-center justify-between"
    >
      <div class="text-gray-500 text-xs">
        {{ pagination.page }}/{{ pagination.lastPage }} of
        {{ pagination.total }} items
      </div>
      <div class="flex items-center gap-1">
        <select
          class="border border-gray-300 rounded py-0.5 px-0.5 bg-white text-xs"
          :value="pagination.perPage"
          @change="handlePerPageChange"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="15">15</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>

        <button
          class="px-1 py-0.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-xs"
          :disabled="pagination.page <= 1"
          @click="$emit('prev-page')"
        >
          <BootstrapIcon name="chevron-left" class="w-3 h-3" />
        </button>

        <button
          class="px-1 py-0.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-xs"
          :disabled="pagination.page >= pagination.lastPage"
          @click="$emit('next-page')"
        >
          <BootstrapIcon name="chevron-right" class="w-3 h-3" />
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import LoadingState from "@/components/common/LoadingState.vue";

interface PaginationState {
  page: number;
  perPage: number;
  lastPage: number;
  total: number;
}

withDefaults(
  defineProps<{
    isLoading: boolean;
    pagination?: PaginationState | null;
    hasData?: boolean;
    columns?: number;
    loadingText?: string;
  }>(),
  {
    hasData: true,
    columns: 1,
    loadingText: "Loading data...",
  }
);

const emit = defineEmits<{
  (e: "prev-page"): void;
  (e: "next-page"): void;
  (e: "change-per-page", value: number): void;
}>();

function handlePerPageChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit("change-per-page", Number(target.value));
}
</script>

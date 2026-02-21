<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEdit ? 'Update Scenario' : 'Add Scenario'"
    max-width="max-w-lg"
    panel-class="p-6 shadow-xl"
    :close-disabled="isSaving"
    @request-close="handleClose"
  >
    <form class="space-y-4 text-xs text-gray-700" @submit.prevent="handleSubmit">
      <div class="space-y-1">
        <label class="text-xs font-semibold text-gray-700">Scenario name</label>
        <input
          v-model="form.name"
          type="text"
          class="w-full rounded border border-gray-300 px-3 py-2 text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          placeholder="Enter scenario name"
        />
      </div>

      <div class="space-y-1">
        <label class="text-xs font-semibold text-gray-700">Status</label>
        <select
          v-model="form.status"
          class="w-full rounded border border-gray-300 px-3 py-2 text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-xs font-semibold text-gray-700">Definition (JSON)</label>
        <textarea
          v-model="form.definition"
          rows="6"
          class="w-full rounded border border-gray-300 px-3 py-2 font-mono text-[11px] focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          placeholder='{"version":1,"nodes":[],"edges":[]}'
        />
        <p class="text-[10px] text-gray-400">
          Paste a valid JSON definition. The builder will override this later.
        </p>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSaving"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded bg-blue-600 px-4 py-1 text-xs text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSaving"
        >
          {{ isSaving ? "Saving..." : isEdit ? "Update" : "Create" }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from "../BaseModal.vue";

type ScenarioForm = {
  id: string | number;
  name: string;
  status: string;
  definition: string;
};

const props = defineProps<{
  modelValue: boolean;
  isEdit: boolean;
  isSaving: boolean;
  form: ScenarioForm;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit"): void;
  (e: "close"): void;
}>();

function handleClose() {
  if (props.isSaving) return;
  emit("update:modelValue", false);
  emit("close");
}

function handleSubmit() {
  emit("submit");
}
</script>

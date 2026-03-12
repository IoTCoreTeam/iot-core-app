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
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Scenario name</label>
          <input
            v-model="formState.name"
            type="text"
            class="w-full rounded border border-gray-300 px-3 py-2 text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            placeholder="Enter scenario name"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Status</label>
          <select
            v-model="formState.status"
            class="w-full rounded border border-gray-300 px-3 py-2 text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          >
            <option value="" disabled>Select status</option>
            <option value="approved">Approved</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
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
import { reactive, watch } from "vue";
import BaseModal from "../BaseModal.vue";

type ScenarioForm = {
  id: string | number;
  name: string;
  status: string;
  definition: string;
  control_definition: string;
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

const formState = reactive<ScenarioForm>({
  id: "",
  name: "",
  status: "",
  definition: "",
  control_definition: "",
});

watch(
  () => props.form,
  (value) => {
    Object.assign(formState, value, {
      status: value.status === "draft" ? "" : value.status,
    });
  },
  { immediate: true, deep: true },
);

watch(
  formState,
  (value) => {
    Object.assign(props.form, value);
  },
  { deep: true },
);

function handleClose() {
  if (props.isSaving) return;
  emit("update:modelValue", false);
  emit("close");
}

function handleSubmit() {
  emit("submit");
}
</script>

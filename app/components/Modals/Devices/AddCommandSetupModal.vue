<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Command Setup' : 'Add Command Setup'"
    max-width="max-w-3xl"
    panel-class="p-5 shadow-xl"
    @request-close="$emit('request-close')"
    @after-leave="$emit('after-leave')"
  >
    <div class="space-y-3 text-xs">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-gray-600 font-medium">Control URL</label>
          <select
            v-model="form.control_url_id"
            class="border border-gray-300 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          >
            <option value="">Select control URL</option>
            <option
              v-for="option in controlUrlOptions"
              :key="option.id"
              :value="option.id"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-gray-600 font-medium">Name</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="e.g. Pump Forward"
            class="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white"
          />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-gray-600 font-medium">Mode</label>
          <select
            v-model="form.commandMode"
            class="border border-gray-300 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            @change="$emit('mode-changed')"
          >
            <option value="digital">digital</option>
            <option value="analog">analog</option>
          </select>
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <a-tabs
          :active-key="form.commandInputType"
          size="small"
          class="command-format-tabs text-xs"
          @change="handleCommandInputTypeTabChange"
        >
          <a-tab-pane key="generated" tab="Generated Fields" />
          <a-tab-pane key="raw" tab="Raw JSON" />
        </a-tabs>
      </div>
      <template v-if="form.commandInputType === 'generated'">
        <div class="space-y-2">
          <div class="grid grid-cols-[1fr_1fr_auto] gap-3 px-1">
            <span class="text-gray-500 text-[11px] font-medium uppercase">Key</span>
            <span class="text-gray-500 text-[11px] font-medium uppercase">Value</span>
            <span></span>
          </div>

          <div
            v-for="(field, index) in form.generatedFields"
            :key="`generated-field-${index}`"
            class="grid grid-cols-[1fr_1fr_auto] gap-3 items-center bg-gray-50 border border-gray-200 rounded px-2 py-2"
          >
            <input
              v-model="field.key"
              type="text"
              placeholder="direction"
              class="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white"
              @input="$emit('draft-changed')"
            />

            <input
              v-model="field.valueText"
              type="text"
              placeholder="forward"
              class="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white"
              @input="$emit('draft-changed')"
            />

            <div class="flex items-center gap-1">
              <button
                type="button"
                class="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                @click="$emit('add-generated-field-input')"
              >
                +
              </button>
              <button
                type="button"
                class="w-7 h-7 flex items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                :disabled="form.generatedFields.length <= 1"
                @click="$emit('remove-generated-field-input', index)"
              >
                -
              </button>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-gray-600 font-medium">Generated JSON</label>
          <textarea
            id="generated-command-preview"
            :value="form.commandText"
            rows="8"
            readonly
            class="max-h-[40vh] overflow-y-auto border border-gray-300 rounded px-2 py-2 font-mono text-xs bg-gray-50"
          />
          <p class="text-[11px] text-gray-500">
            JSON is auto-formatted from mode + all key/value fields above.
          </p>
        </div>
      </template>
      <div v-else class="flex flex-col gap-1">
        <label class="text-gray-600 font-medium">JSON Command</label>
        <textarea
          v-model="form.commandText"
          rows="9"
          placeholder='{\n  "mode": "digital",\n  "value": "on"\n}'
          class="max-h-[40vh] overflow-y-auto border border-gray-300 rounded px-2 py-2 font-mono text-xs focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
        />
        <p class="text-[11px] text-gray-500">
          Raw JSON keeps your keys and will enforce <code class="font-mono">mode</code> from the selected Mode above.
        </p>
      </div>
    </div>
    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <button
          type="button"
          class="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
          :disabled="isSaving"
          @click="$emit('request-close')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="isSaving"
          @click="$emit('save')"
        >
          {{ isSaving ? "Saving..." : isEditing ? "Update" : "Save" }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { toRefs } from "vue";
import BaseModal from "@/components/Modals/BaseModal.vue";

type CommandSetupForm = {
  control_url_id: string;
  name: string;
  commandInputType: "generated" | "raw";
  commandMode: "digital" | "analog";
  generatedFields: Array<{ key: string; valueText: string }>;
  commandText: string;
};

const props = defineProps<{
  modelValue: boolean;
  isEditing: boolean;
  isSaving: boolean;
  controlUrlOptions: Array<{ id: string; label: string }>;
  form: CommandSetupForm;
}>();
const { modelValue, isEditing, isSaving, controlUrlOptions, form } = toRefs(props);

const emit = defineEmits<{
  (event: "request-close"): void;
  (event: "after-leave"): void;
  (event: "save"): void;
  (event: "draft-changed"): void;
  (event: "add-generated-field-input"): void;
  (event: "remove-generated-field-input", index: number): void;
  (event: "mode-changed"): void;
  (event: "input-type-changed"): void;
}>();

function handleCommandInputTypeTabChange(activeKey: string | number) {
  if (activeKey !== "generated" && activeKey !== "raw") {
    return;
  }
  form.value.commandInputType = activeKey;
  emit("input-type-changed");
}
</script>

<style scoped>
.command-format-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.command-format-tabs :deep(.ant-tabs-tab-btn) {
  font-size: 12px;
  line-height: 1rem;
  color: #6b7280;
}

.command-format-tabs :deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #374151 !important;
}

.command-format-tabs :deep(.ant-tabs-ink-bar) {
  background: #9ca3af;
}
</style>

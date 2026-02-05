<template>
  <transition name="modal-overlay" appear>
    <div v-if="isOpen" class="fixed inset-0 flex justify-center z-50 px-4 pt-12">
      <div class="absolute inset-0 bg-black/30" @click="closeModal"></div>

      <transition name="modal-slide" appear>
        <div
          class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 border border-gray-200 py-4 z-10 h-fit"
        >
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-sm font-semibold text-gray-800">Area Details</h3>
            <button
              @click="closeModal"
              :disabled="isSubmitting"
              class="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                class="w-5 h-5 cursor-pointer"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form
            @submit.prevent="submitForm"
            class="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                v-model="areaForm.name"
                type="text"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Production Zone"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Height (m)
              </label>
              <input
                v-model="areaForm.height_m"
                type="number"
                step="0.1"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 3.5"
                min="0"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                v-model="areaForm.description"
                rows="4"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Short description for this area"
              ></textarea>
            </div>

            <div class="mt-4 flex justify-end space-x-3 md:col-span-2">
              <button
                type="button"
                @click="closeModal"
                :disabled="isSubmitting"
                class="px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {{ isSubmitting ? "Saving..." : "Save Changes" }}
              </button>
            </div>
          </form>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "ant-design-vue";

type AreaDetail = {
  id: number;
  name: string;
  description?: string | null;
  height_m?: number | null;
};

const props = defineProps<{
  area: AreaDetail | null;
}>();

const emit = defineEmits(["close", "save"]);

const isOpen = ref(true);
const isSubmitting = ref(false);

const areaForm = ref({
  name: "",
  description: "",
  height_m: "3.5",
});

function normalizeDetailArea(input?: AreaDetail | null) {
  return {
    name: input?.name ?? "",
    description: input?.description ?? "",
    height_m: input?.height_m ? String(input.height_m) : "3.5",
  };
}

function closeModal(event: MouseEvent): void;
function closeModal(force: boolean): void;
function closeModal(arg?: MouseEvent | boolean) {
  const force = typeof arg === "boolean" ? arg : false;
  if (!force && isSubmitting.value) return;

  isOpen.value = false;
  setTimeout(() => emit("close"), 400);
}

function submitForm() {
  if (!props.area?.id) {
    message.error("Area ID is missing.");
    return;
  }
  if (!areaForm.value.name) {
    message.warning("Please fill in the required fields.");
    return;
  }

  isSubmitting.value = true;
  emit("save", { ...areaForm.value, id: props.area.id });
  closeModal(true);
  isSubmitting.value = false;
}

watch(
  () => props.area,
  (value) => {
    areaForm.value = normalizeDetailArea(value);
  },
  { deep: true, immediate: true }
);
</script>

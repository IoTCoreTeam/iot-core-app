<template>
  <section class="min-h-screen">
    <div class="px-4 pb-2">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div
          :class="[
            'bg-white rounded border border-slate-200 overflow-hidden w-full lg:w-64 shrink-0 h-fit lg:sticky lg:top-4',
            { hidden: !isFilterVisible },
          ]"
        >
          <div class="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h4 class="text-xs font-semibold text-gray-700">Filters</h4>
              <p class="text-xs text-gray-500">Refine the scenario list.</p>
            </div>
            <button
              type="button"
              class="text-xs text-gray-500 hover:text-gray-700 lg:hidden"
              @click="toggleFilters"
            >
              Close
            </button>
          </div>
          <AdvancedFilterPanel
            :fields="scenarioFilterFields"
            :model-value="scenarioFilters"
            :is-loading="isScenarioLoading"
            apply-label="Apply"
            reset-label="Reset"
            @update:modelValue="handleFilterModelUpdate"
            @apply="applyFilters"
            @reset="resetFilters"
          />
        </div>

        <DataBoxCard
          :class="[
            'lg:self-start',
            isFilterVisible ? 'flex-1' : 'max-w-8xl w-full mx-auto',
          ]"
          :is-loading="isScenarioLoading"
          :columns="scenarioTableColumns.length"
          :has-data="displayedScenarioRows.length > 0"
          :pagination="scenarioPagination"
          :loading-text="loadingText"
          @prev-page="prevScenarioPage"
          @next-page="nextScenarioPage"
          @change-per-page="changeScenarioPerPage"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <h3 class="text-gray-700 text-xs">
                {{ title }}
              </h3>
              <button
                type="button"
                class="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-0.5"
                @click="toggleFilters"
              >
                {{ isFilterVisible ? "Hide Filters" : "Show Filters" }}
              </button>
            </div>

            <div class="flex items-center gap-2">
              <div class="relative">
                <input
                  v-model="searchKeyword"
                  type="text"
                  placeholder="Search scenario..."
                  class="pl-5 pr-1 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white w-52 text-xs cursor-text"
                />
                <BootstrapIcon
                  name="search"
                  class="absolute left-1 top-1.5 w-3 h-3 text-gray-400"
                />
              </div>
              <button
                @click="refreshRows"
                class="inline-flex items-center bg-gray-50 hover:bg-gray-100 text-gray-600 rounded px-3 py-1 text-xs border border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="isScenarioLoading"
              >
                <BootstrapIcon
                  name="arrow-clockwise"
                  class="w-3 h-3 mr-1"
                  :class="{ 'animate-spin': isScenarioLoading }"
                />
                {{ isScenarioLoading ? "Refreshing..." : "Refresh" }}
              </button>
              <button
                type="button"
                class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
                @click="openAddScenario"
              >
                <BootstrapIcon name="plus-lg" class="w-3 h-3 mr-1" />
                Add Scenario
              </button>
              <button
                type="button"
                class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
                :disabled="isScenarioLoading"
                @click="exportRows"
              >
                <BootstrapIcon name="file-earmark-arrow-down" class="w-3 h-3 mr-1" />
                Export
              </button>
            </div>
          </template>

          <template #head>
            <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-600 text-center">
              <th
                v-for="column in scenarioTableColumns"
                :key="column"
                class="px-2 py-2 font-normal text-gray-600 text-center align-middle leading-4"
              >
                {{ column }}
              </th>
            </tr>
          </template>

          <template #default>
            <tr
              v-for="row in displayedScenarioRows"
              :key="row.id"
              class="hover:bg-gray-50 transition-colors text-xs align-top border-b border-gray-100 py-1 text-center"
            >
              <td class="px-2 py-2 text-gray-800 text-center align-middle leading-4">
                {{ row.id }}
              </td>
              <td class="px-2 py-2 text-gray-700 text-center align-middle leading-4">
                {{ row.name || "-" }}
              </td>
              <td class="px-2 py-2 text-gray-700 text-center align-middle leading-4">
                {{ row.type || "-" }}
              </td>
              <td class="px-2 py-2 text-gray-700 text-center align-middle leading-4">
                {{ row.status || "-" }}
              </td>
              <td class="px-2 py-2 text-gray-600 text-center align-middle leading-4">
                {{ formatDateTime(row.updated_at) }}
              </td>
              <td class="px-2 py-2 text-center align-middle">
                <div class="inline-flex items-center justify-center gap-2">
                  <button
                    type="button"
                    class="w-8 h-8 inline-flex items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                    @click="openEditScenario(row)"
                    title="Edit"
                    aria-label="Edit scenario"
                  >
                    <BootstrapIcon name="pencil-square" class="w-3 h-3" />
                    <span class="sr-only">Edit</span>
                  </button>
                  <button
                    type="button"
                    class="w-8 h-8 inline-flex items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                    @click="confirmDeleteScenario(row)"
                    title="Delete"
                    aria-label="Delete scenario"
                  >
                    <BootstrapIcon name="trash" class="w-3 h-3" />
                    <span class="sr-only">Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </template>

          <template #empty> {{ emptyText }} </template>

          <template #footer>
            <span>Showing {{ displayedScenarioRows.length }} entries on this page.</span>
            <span>
              Total filtered:
              <span class="text-gray-600 font-medium">{{ scenarioPagination.total }}</span>
            </span>
          </template>
        </DataBoxCard>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { message } from "ant-design-vue";
import AdvancedFilterPanel, {
  type FilterFieldRow,
} from "@/components/common/AdvancedFilterPanel.vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import type { Section } from "@/types/devices-control";

defineProps<{
  section: Section;
}>();

type ScenarioRow = {
  id: string | number;
  name?: string | null;
  type?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

type ScenarioFilterState = {
  id: string;
  name: string;
  type: string;
  status: string;
};

const title = "Scenarios";
const loadingText = "Loading scenarios...";
const emptyText = "No scenarios found.";

const scenarioTableColumns = [
  "ID",
  "Name",
  "Type",
  "Status",
  "Updated",
  "Actions",
];

const isScenarioLoading = ref(false);
const isFilterVisible = ref(true);
const searchKeyword = ref("");

const scenarioRows = ref<ScenarioRow[]>([]);
const scenarioPagination = ref({ page: 1, perPage: 10, lastPage: 1, total: 0 });

const scenarioFilters = reactive<ScenarioFilterState>({
  id: "",
  name: "",
  type: "",
  status: "",
});
const appliedScenarioFilters = ref<ScenarioFilterState>({
  ...scenarioFilters,
});

const scenarioFilterFields: FilterFieldRow[] = [
  [
    { key: "id", label: "Scenario ID", type: "text", placeholder: "ID" },
    { key: "name", label: "Scenario name", type: "text", placeholder: "Name" },
  ],
  [
    { key: "type", label: "Type", type: "text", placeholder: "Type" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "All", value: "" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ],
];

const filteredScenarioRows = computed(() => {
  const filters = appliedScenarioFilters.value;
  const idFilter = normalizeText(filters.id);
  const nameFilter = normalizeText(filters.name);
  const typeFilter = normalizeText(filters.type);
  const statusFilter = normalizeText(filters.status);
  const keyword = normalizeText(searchKeyword.value);

  return scenarioRows.value.filter((row) => {
    if (idFilter && !normalizeText(row.id).includes(idFilter)) return false;
    if (nameFilter && !normalizeText(row.name).includes(nameFilter)) return false;
    if (typeFilter && !normalizeText(row.type).includes(typeFilter)) return false;
    if (statusFilter && normalizeText(row.status) !== statusFilter) return false;
    if (keyword) {
      const haystack = [
        row.id,
        row.name,
        row.type,
        row.status,
      ]
        .map((value) => normalizeText(value))
        .join(" ");
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
});

const displayedScenarioRows = computed(() => {
  const start =
    (scenarioPagination.value.page - 1) * scenarioPagination.value.perPage;
  const end = start + scenarioPagination.value.perPage;
  return filteredScenarioRows.value.slice(start, end);
});

function normalizeText(value: string | number | null | undefined) {
  return (value ?? "").toString().trim().toLowerCase();
}

function handleFilterModelUpdate(value: Record<string, string>) {
  Object.assign(scenarioFilters, value);
}

function applyFilters(payload?: Record<string, string>) {
  appliedScenarioFilters.value = {
    ...scenarioFilters,
    ...(payload ?? {}),
  };
  scenarioPagination.value.page = 1;
}

function resetFilters() {
  scenarioFilters.id = "";
  scenarioFilters.name = "";
  scenarioFilters.type = "";
  scenarioFilters.status = "";
  appliedScenarioFilters.value = { ...scenarioFilters };
  scenarioPagination.value.page = 1;
}

function toggleFilters() {
  isFilterVisible.value = !isFilterVisible.value;
}

function refreshRows() {
  if (isScenarioLoading.value) return;
  isScenarioLoading.value = true;
  setTimeout(() => {
    isScenarioLoading.value = false;
  }, 800);
}

function openAddScenario() {
  message.info("Scenario creation will be available soon.");
}

function exportRows() {
  if (!import.meta.client) return;
  const rows = filteredScenarioRows.value;
  if (!rows.length) {
    message.warning("No scenarios to export.");
    return;
  }
  const headers = scenarioTableColumns.filter((column) => column !== "Actions");
  const escapeValue = (value: string | number | null | undefined) => {
    const str = (value ?? "").toString().replace(/"/g, '""');
    return `"${str}"`;
  };
  const csvRows = [
    headers.map(escapeValue).join(","),
    ...rows.map((row) =>
      [row.id, row.name, row.type, row.status, row.updated_at]
        .map(escapeValue)
        .join(","),
    ),
  ];
  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "scenarios.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function openEditScenario(row: ScenarioRow) {
  message.info(`Edit scenario ${row.name ?? row.id}`);
}

function confirmDeleteScenario(row: ScenarioRow) {
  message.info(`Delete scenario ${row.name ?? row.id}`);
}

function prevScenarioPage() {
  if (scenarioPagination.value.page > 1) {
    scenarioPagination.value.page -= 1;
  }
}

function nextScenarioPage() {
  if (scenarioPagination.value.page < scenarioPagination.value.lastPage) {
    scenarioPagination.value.page += 1;
  }
}

function changeScenarioPerPage(value: number) {
  if (value <= 0) return;
  scenarioPagination.value.perPage = value;
}

function recalculateScenarioPagination() {
  const total = filteredScenarioRows.value.length;
  scenarioPagination.value.total = total;
  const lastPage = Math.max(1, Math.ceil(total / scenarioPagination.value.perPage));
  scenarioPagination.value.lastPage = lastPage;
  if (scenarioPagination.value.page > lastPage) {
    scenarioPagination.value.page = lastPage;
  }
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return dateTimeFormatter.format(new Date(timestamp));
}

watch(
  filteredScenarioRows,
  () => {
    recalculateScenarioPagination();
  },
  { immediate: true },
);

watch(
  () => scenarioPagination.value.perPage,
  () => {
    scenarioPagination.value.page = 1;
    recalculateScenarioPagination();
  },
);

watch(searchKeyword, () => {
  scenarioPagination.value.page = 1;
});
</script>

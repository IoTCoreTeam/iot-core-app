<template>
  <div
    class="min-h-[90vh] flex flex-col items-center justify-start py-10 pt-5 bg-gray-50"
  >
    <!-- Company Information Form -->
    <form
      @submit.prevent="saveCompany"
      class="w-full max-w-7xl bg-white rounded-sm shadow-sm p-8 px-12 text-xs"
    >
      <h2 class="text-base font-semibold text-gray-800 mb-6">
        Company Information
      </h2>

      <!-- Company Name -->
      <div class="flex items-center mb-4">
        <label class="w-1/4 text-gray-700 font-medium">Company Name</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Enter company name"
          class="flex-1 border border-gray-300 rounded-sm px-3 py-2 focus:ring focus:ring-blue-300"
        />
      </div>

      <!-- Address -->
      <div class="flex items-center mb-4">
        <label class="w-1/4 text-gray-700 font-medium">Company Address</label>
        <input
          v-model="form.address"
          type="text"
          placeholder="Enter address"
          class="flex-1 border border-gray-300 rounded-sm px-3 py-2 focus:ring focus:ring-blue-300"
        />
      </div>

      <!-- Phone -->
      <div class="flex items-center mb-4">
        <label class="w-1/4 text-gray-700 font-medium">Company Phone</label>
        <input
          v-model="form.phone"
          type="text"
          placeholder="Enter phone number"
          class="flex-1 border border-gray-300 rounded-sm px-3 py-2 focus:ring focus:ring-blue-300"
        />
      </div>

      <!-- Fax -->
      <div class="flex items-center mb-4">
        <label class="w-1/4 text-gray-700 font-medium">Company Fax</label>
        <input
          v-model="form.fax"
          type="text"
          placeholder="Enter fax number"
          class="flex-1 border border-gray-300 rounded-sm px-3 py-2 focus:ring focus:ring-blue-300"
        />
      </div>

      <!-- Email -->
      <div class="flex items-center mb-4">
        <label class="w-1/4 text-gray-700 font-medium">Company Email</label>
        <input
          v-model="form.email"
          type="email"
          placeholder="Enter email address"
          class="flex-1 border border-gray-300 rounded-sm px-3 py-2 focus:ring focus:ring-blue-300"
        />
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end mt-6">
        <button
          type="submit"
          class="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded-lg"
        >
          Save Company
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { message } from "ant-design-vue";

const form = ref({
  name: "",
  address: "",
  email: "",
  phone: "",
  fax: "",
});

const api_url = "http://127.0.0.1:8000/api/company";

const fetchCompanyData = async () => {
  const res = await fetch(api_url, {
    method: "GET",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
  }).catch(() => null);

  if (!res) return message.error("Cannot connect to server");

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) return message.error(data?.message || "Failed to fetch company data");

  Object.assign(form.value, {
    name: data.data?.name || "",
    address: data.data?.address || "",
    email: data.data?.email || "",
    phone: data.data?.phone || "",
    fax: data.data?.fax || "",
  });
};

const saveCompany = async () => {
  const res = await fetch(api_url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(form.value),
  }).catch(() => null);

  if (!res) return message.error("Cannot connect to server");

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) return message.error(data?.message || "Failed to update company");

  message.success("Company information updated");
};

onMounted(fetchCompanyData);
</script>

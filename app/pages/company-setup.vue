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

const apiUrl = "http://127.0.0.1:8000/api/company";

const buildAuthHeaders = () => {
  if (!import.meta.client) return {};
  const token = localStorage.getItem("access_token");
  const tokenType = localStorage.getItem("token_type") ?? "Bearer";
  if (!token) {
    throw new Error("Missing access token. Please sign in again.");
  }
  return {
    Authorization: `${tokenType} ${token}`,
  };
};

const fetchCompanyData = async () => {
  try {
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...buildAuthHeaders(),
      },
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        errorBody?.message ?? `Failed to fetch company data (${res.status})`
      );
    }
    const data = await res.json().catch(() => ({}));

    const company = data?.data ?? data;
    Object.assign(form.value, {
      name: company?.name ?? "",
      address: company?.address ?? "",
      email: company?.email ?? "",
      phone: company?.phone ?? "",
      fax: company?.fax ?? "",
    });
  } catch (error) {
    if (error?.message?.includes("Missing access token")) {
      message.error(error.message);
      return;
    }
    const errorMessage =
      error?.message ?? "Failed to fetch company data";
    message.error(errorMessage);
  }
};

const saveCompany = async () => {
  try {
    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...buildAuthHeaders(),
      },
      body: JSON.stringify(form.value),
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        errorBody?.message ?? `Failed to update company (${res.status})`
      );
    }
    const data = await res.json().catch(() => ({}));

    const messageText =
      data?.data?.message ?? data?.message ?? "Company information updated";
    message.success(messageText);
  } catch (error) {
    if (error?.message?.includes("Missing access token")) {
      message.error(error.message);
      return;
    }
    const errorMessage =
      error?.data?.message ?? error?.message ?? "Failed to update company";
    message.error(errorMessage);
  }
};

onMounted(fetchCompanyData);
</script>

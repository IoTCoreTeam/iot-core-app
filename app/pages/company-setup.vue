<template>
  <div class="min-h-[90vh] flex flex-col items-center justify-start py-10 bg-gray-50">
    <!-- Header -->
    <h1 class="text-2xl font-bold text-blue-800 mb-6">Company Management</h1>

    <!-- Form -->
    <form
      @submit.prevent="addCompany"
      class="w-full max-w-md bg-white rounded-2xl shadow-md p-6 mb-10"
    >
      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Enter company name"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring focus:ring-blue-300"
          required
        />
      </div>

      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-1">Address</label>
        <input
          v-model="form.address"
          type="text"
          placeholder="Enter address"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring focus:ring-blue-300"
        />
      </div>

      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-1">Contact Info</label>
        <input
          v-model="form.contact_info"
          type="text"
          placeholder="Email, phone, etc."
          class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring focus:ring-blue-300"
        />
      </div>

      <button
        type="submit"
        class="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg"
      >
        Add Company
      </button>
    </form>

    <!-- Company List -->
    <div class="w-full max-w-3xl bg-white rounded-2xl shadow-md p-6">
      <h2 class="text-lg font-bold text-gray-700 mb-4">Company List</h2>
      <table class="min-w-full text-sm text-gray-700 border">
        <thead class="bg-gray-100">
          <tr>
            <th class="py-2 px-3 border">#</th>
            <th class="py-2 px-3 border">Name</th>
            <th class="py-2 px-3 border">Address</th>
            <th class="py-2 px-3 border">Contact Info</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(company, index) in companies"
            :key="company.id"
            class="hover:bg-gray-50"
          >
            <td class="py-2 px-3 border text-center">{{ index + 1 }}</td>
            <td class="py-2 px-3 border">{{ company.name }}</td>
            <td class="py-2 px-3 border">{{ company.address }}</td>
            <td class="py-2 px-3 border">{{ company.contact_info }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Form data
const form = ref({
  name: '',
  address: '',
  contact_info: ''
})

// Company list (mock)
const companies = ref([])

// Add new company
const addCompany = () => {
  if (!form.value.name) return
  companies.value.push({
    id: Date.now().toString(),
    name: form.value.name,
    address: form.value.address,
    contact_info: form.value.contact_info
  })
  form.value = { name: '', address: '', contact_info: '' }
}
</script>

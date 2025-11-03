<template>
  <div class="min-h-[90vh] flex flex-col items-center justify-start py-10 pt-5 bg-gray-50">
    <!-- Header -->

    <!-- Company Information Form -->
    <form
      @submit.prevent="saveCompany"
      class="w-full max-w-7xl bg-white rounded-sm shadow-sm p-8 px-12 text-xs"
    >
      <h2 class="text-base font-semibold text-gray-800 mb-6">
        Company Information
      </h2>

      <!-- Name -->
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
        <label class="w-1/4 text-gray-700 font-medium">Address</label>
        <input
          v-model="form.address"
          type="text"
          placeholder="Enter address"
          class="flex-1 border border-gray-300 rounded-sm px-3 py-2 focus:ring focus:ring-blue-300"
        />
      </div>

      <!-- Contact Info -->
      <div class="flex items-center mb-4">
        <label class="w-1/4 text-gray-700 font-medium">Contact Info</label>
        <input
          v-model="form.contact_info"
          type="text"
          placeholder="Email, phone, etc."
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
import { ref } from 'vue'

const form = ref({
  name: '',
  address: '',
  contact_info: ''
})

// Tạm thời giữ để test — dữ liệu thật sẽ load từ API sau
const saveCompany = () => {
  console.log('Saving company:', form.value)
}
</script>

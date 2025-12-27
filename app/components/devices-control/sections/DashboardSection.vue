<template>
  <DevicesControlContentSection :section="section" />
</template>

<script setup lang="ts">
import DevicesControlContentSection from "@/components/devices-control/layouts/DevicesControlContentSection.vue";
import type { Section } from "@/types/devices-control";

defineProps<{
  section: Section;
}>();
</script>

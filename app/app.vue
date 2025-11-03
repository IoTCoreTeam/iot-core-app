<template>
  <Viewer>
    <index />
  </Viewer>
</template>

<script>
import index from '~/pages/index.vue'
import Viewer from './layouts/Viewer.vue';
export default {
  components: {
    index,
    Viewer
  }
}
</script>

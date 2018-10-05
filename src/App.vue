<template>
  <div class="main-wrapper">
    <div>{{title}}</div>

    <mixer></mixer>
  </div>
  </template>

<script>
import Mixer from "./components/Mixer.vue";

export default {
  name: "app",
  data() {
    return {
      title: "Mixer"
    };
  },
  components: {
    Mixer
  }
};
</script>

<style scoped>
</style>

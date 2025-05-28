<script setup>
import { RouterLink, RouterView } from 'vue-router'
import Header from './components/Header.vue'
</script>

<template>
  <v-app>
    <Header />
    <RouterView />
  </v-app>
  

</template>

<style scoped>
  .v-application {
    font-family: Arial, Helvetica, sans-serif !important;
  }
</style>

<template>
  <v-app-bar color="primary">
  <v-app-bar-title>
    <v-img
      alt="Vuetify Logo"
      src="https://www.oncokb.org/content/oncokb-white.svg"
      height="30"
    />
  </v-app-bar-title>

  <div class="d-flex justify-space-between">
    <v-btn class="mx-3" text to="/home">
      <v-icon left>mdi-city-variant</v-icon>Home
    </v-btn>
    <v-btn class="mx-3" text to="/browse">
      <v-icon left>mdi-database-eye</v-icon>Browse
    </v-btn>
    <v-btn class="mx-3" text to="/search">
      <v-icon left>mdi-database-search</v-icon>Search
    </v-btn>
    <v-btn class="mx-3" text to="/visualize">
      <v-icon left>mdi-chart-box</v-icon>Visualize
    </v-btn>
    <v-btn class="mx-3" text to="/analyze">
      <v-icon left>mdi-cloud-cog</v-icon>Analyze
    </v-btn>
    <v-btn class="mx-3" text to="/download">
      <v-icon left>mdi-download-box</v-icon>Download
    </v-btn>
    <v-btn class="mx-3" text to="/statistics">
      <v-icon left>mdi-chart-pie</v-icon>Statistics
    </v-btn>
    <v-btn class="mx-3" text to="/document">
      <v-icon left>mdi-account-circle</v-icon>Document
    </v-btn>
  </div>
  <v-spacer />
  </v-app-bar> 
</template>

<script>
  import { ref } from 'vue'
  const tab = ref(null)
</script>

<style scoped>
.v-tab {
    font-size: 14px;
    text-transform: none;
    min-width: 100px;
  }
</style>
<template>
  <v-sheet
    color="#174978"
    style="background-image: url('https://ngdc.cncb.ac.cn/lncrnawiki/images/background.png');background-size: cover;background-position: center center;background-repeat: no-repeat;min-height: 100px"
    density="compact"
    class="px-4 py-2"
  >
    <v-row class="mt-4 d-flex align-center">
      <span style="color: white;font-size: 36px;font-family: 'Arial';padding-right: 15px;margin-left: 30px !important;margin-right: 30px !important;">ClinMAVE</span>
      <span style="color: white;font-size: 20px;font-family: 'Arial'">Community curation of long non-coding RNAs</span>
    </v-row>

    <v-row align-center>
      <v-col
        cols="12"
        sm="12"
        md="2"
        lg="1"
        xl="1"
      >
        <v-sheet
          color="#174978"
          style="border-color: #174978;"
        >
          <v-img
            src="https://ngdc.cncb.ac.cn/macdb/static/img/macdb_logo_1.b67cf0a.png"
            contain
            height="40"
          />
        </v-sheet>
      </v-col>

      <v-col
        cols="11"
        sm="7"
        md="7"
        lg="7"
        xl="7"
        class="text-center"
      >
        <!-- Tabs -->
        <v-tabs
          centered
          grow
          dark
          background-color="#174978"
          class="mx-auto"
        >
          <v-tab to="/home">
            <v-icon icon="mdi-home" size="small"></v-icon>
            <span class="ml-1">Home</span>
          </v-tab>

          <!-- Browse with dropdown -->
          <v-menu open-on-hover>
            <template v-slot:activator="{ props }">
              <v-tab v-bind="props">
                <v-icon icon="mdi-bookmark-box-multiple-outline" size="small"></v-icon>
                <span class="ml-1">Browse</span>
                <v-icon icon="mdi-menu-down" size="small"></v-icon>
              </v-tab>
            </template>
            <v-list>
              <v-list-item 
                v-for="(item, i) in browseItems" 
                :key="i"
                :to="item.to"
              >
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-menu open-on-hover>
            <template v-slot:activator="{ props }">
              <v-tab v-bind="props">
                <v-icon icon="mdi-stat-machine" size="small"></v-icon>
                <span class="ml-1">Visualize</span>
                <v-icon icon="mdi-menu-down" size="small"></v-icon>
              </v-tab>
            </template>
            <v-list>
              <v-list-item 
                v-for="(item, i) in visualizeItems" 
                :key="i"
                :to="item.to"
              >
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-tab to="/analyze">
            <v-icon icon="mdi-toolbox-outline" size="small"></v-icon>
            <span class="ml-1">Analyze</span>
          </v-tab>

          <v-tab to="/statistics">
            <v-icon icon="mdi-chart-bar" size="small"></v-icon>
            <span class="ml-1">Statistics</span>
          </v-tab>

          <v-tab to="/document">
            <v-icon icon="mdi-book-open-outline" size="small"></v-icon>
            <span class="ml-1">Documentation</span>
          </v-tab>
        </v-tabs>
      </v-col>
    </v-row>
    
  </v-sheet>
  
</template>

<script setup>
const browseItems = [
  { title: 'Variants', to: '/browse/variants' },
  { title: 'Genes', to: '/browse/genes' },
  { title: 'Mutagenesis strategies', to: '/browse/mutagenesis_strategies' },
  { title: 'Datasets', to: '/browse/datasets' },
  { title: 'Studies', to: '/browse/studies' }
]

const visualizeItems = [
  { title: 'By gene', to: '/visualize/gene' },
  { title: 'By dataset', to: '/visualize/dataset' },
]
</script>

<style scoped>
.v-tab {
  font-size: 15px;
  text-transform: none;
  min-width: 100px;
}
</style>
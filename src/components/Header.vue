<template>
  <v-sheet
    color="#174978"
    style="background-image: url('https://ngdc.cncb.ac.cn/lncrnawiki/images/background.png'); background-size: cover; background-position: center center; background-repeat: no-repeat; min-height: 140px;"
    density="compact"
    class="px-3 py-2"
  >
    <v-row class="ml-3">
      <v-col cols="12" sm="6" md="6" lg="6" xl="6">
        <v-row no-gutters align="end">
          <v-col cols="12" md="auto" lg="auto" class="ma-0 pa-0">
            <div class="d-flex align-end">
              <router-link to="/" style="display: inline-block; text-decoration: none; margin-right: 0;">
                <v-img
                  src="/clinmave/images/brand.png"
                  contain
                  width="140"
                  height="100"
                  style="scale: 130%; max-width: 140px; display: inline-block;"
                  class="floating-icon"
                />
              </router-link>
              <span
                class="text-subtitle-1 ml-5"
                style="color: white !important; font-family: 'Arial'; font-size: 20px !important;"
              >
                MAVE database for clinical application
              </span>
            </div>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-row class="align-center">

      <v-col cols="12" sm="10" md="9" lg="9" xl="8">
        <v-tabs
          fixed-tabs
          dark
          background-color="#174978"
          slider-color="white"
        >
          <v-tab to="/">
            <v-icon icon="mdi-home" size="small"></v-icon>
            <span class="ml-1">Home</span>
          </v-tab>

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
                <v-icon icon="mdi-state-machine" size="small"></v-icon>
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

          <v-tab to="/analysis/dataset">
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
  { title: 'Datasets', to: '/browse/datasets' },
  { title: 'Studies', to: '/browse/studies' },
  { title: 'MAVE techniques', to: '/browse/mave_techniques' },
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
  min-width: 80px;
  padding: 0 8px;
}

/* 为icon容器设置相对定位 */
.icon-container {
  position: relative;
  height: 70px; /* 固定容器高度，确保不影响row */
}

@media (max-width: 960px) {
  .v-tab {
    font-size: 0.8rem;
    min-width: 60px;
    padding: 0 6px;
  }
  .text-h4 {
    font-size: 1.8rem !important;
  }
  .text-subtitle-1 {
    font-size: 0.9rem !important;
  }
  .icon-container {
    height: 80px; /* 调整小屏幕下的容器高度 */
  }
  .floating-icon {
    width: 120px; /* 减小图标尺寸以适配小屏幕 */
    height: 120px;
  }
}

@media (max-width: 600px) {
  .v-tab {
    font-size: 0.7rem;
    min-width: 50px;
    padding: 0 4px;
  }
  .text-h4 {
    font-size: 1.5rem !important;
  }
  .text-subtitle-1 {
    font-size: 0.8rem !important;
  }
  .icon-container {
    height: 60px; /* 调整更小屏幕下的容器高度 */
  }
  .floating-icon {
    width: 100px; /* 进一步减小图标尺寸 */
    height: 100px;
  }
}
</style>
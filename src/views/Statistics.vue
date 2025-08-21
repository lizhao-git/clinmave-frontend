<template>
  <v-main>
    <v-container fluid class="mt-4">
      <!-- Breadcrumbs -->
      <v-row>
        <v-col cols="12">
          <v-card flat>
            <v-breadcrumbs :items="breadcrumbs">
              <template v-slot:item="{ item }">
                <v-breadcrumbs-item
                  :to="item.href"
                  :class="{ 'text-primary': item.href }"
                  link
                >
                  <span>{{ item.title }}</span>
                </v-breadcrumbs-item>
              </template>
            </v-breadcrumbs>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <!-- Sidebar Column -->
        <v-col cols="12" md="2" class="sidebar-col">
          <v-list nav>
            <template v-for="(item, index) in sidebarItems" :key="index">
              <v-list-item
                :title="item.title"
                :value="item.value"
                :active="activeSection === item.value"
                @click="scrollToSection(item.value)"
              ></v-list-item>
              <v-divider v-if="index < sidebarItems.length - 1" class="my-1"></v-divider>
            </template>
          </v-list>
        </v-col>

        <!-- Main Content Column -->
        <v-col cols="12" md="10">
          <v-alert
            v-for="(section, index) in sections"
            :key="index"
            border="end"
            variant="outlined"
            :border-color="section.borderColor"
            class="mb-6"
            :id="section.id"
          >
            <h1 class="mt-4 mb-2">{{ section.title }}</h1>
            <v-row class="chart-row">
              <v-col
                v-for="(chart, subIndex) in section.charts"
                :key="subIndex"
                :cols="chart.cols"
                :md="chart.md"
                :sm="chart.sm || 12"
                :id="chart.id"
                class="chart-container"
              >
                <h3 class="text-h6 mb-2">{{ chart.title }}</h3>
                <v-progress-circular
                  v-if="chart.loading"
                  indeterminate
                  color="primary"
                  class="ma-4"
                ></v-progress-circular>
                <component
                  v-else
                  :is="chart.component"
                  v-bind="chart.props"
                  class="chart-content"
                ></component>
              </v-col>
            </v-row>
          </v-alert>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import Sanky from '@/components/stat/Sanky.vue'
import Sunburst from '@/components/stat/Sunburst.vue'
import ScatterAccumulative from '@/components/stat/ScatterAccumulative.vue'
import ConsequenceProporiton from '@/components/Visualization/ConsequenceProportion.vue'
import GeneAccumulative from '@/components/stat/GeneAccumulative.vue'
import IntensityProportion from '@/components/stat/IntensityProportion.vue'
import Venn from '@/components/stat/Venn.vue'
import DoubleAxisBar from '@/components/stat/DoubleAxisBar.vue'

// Breadcrumbs
const breadcrumbs = ref([
  { title: 'Home', href: '/' },
  { title: 'Statistics' }
])

// Sidebar state
const activeSection = ref('data-flow')
const sidebarItems = ref([
  { title: '1. Overall summary', value: 'data-flow' },
  { title: '2. Statistics of clinically relevant genes', value: 'gene-intensity' },
  { title: '3. Cross-assay statistics', value: 'assay-comparison' }
])

// Chart data and loading states
const sankeyData = ref([])
const sankeyLoading = ref(true)
const sunburstLoading = ref(true)
const datasetAccumulationData = ref([])
const datasetAccumulationLoading = ref(true)
const consequenceProportionData = ref({})
const consequenceProportionLoading = ref(true)
const geneAccumulativeData = ref([])
const geneAccumulativeLoading = ref(true)
const intensityProportionData = ref({})
const intensityProportionLoading = ref(true)
const vennData = ref({})
const vennLoading = ref(true)
const assayProportionData = ref({})
const assayProportionLoading = ref(true)
const geneIntensityDistData = ref({})
const geneIntensityDistLoading = ref(true)

// Sections for main content with explicit cols/md
const sections = computed(() => [
  {
    id: 'data-flow',
    title: '1. Overall summary',
    borderColor: 'error',
    charts: [
      { id: 'sankey', title: '1.1 Variant distribution across functional classifications', component: Sanky, props: { rawData: sankeyData.value }, loading: sankeyLoading.value, cols: 6, md: 6 },
      { id: 'sunburst', title: '1.2 Distribution of 49 studies among MAVE techniques and subcategories', component: Sunburst, props: {}, loading: sunburstLoading.value, cols: 6, md: 6 }
    ]
  },
  {
    borderColor: 'success',
    charts: [
      { id: 'consequence-proportion', title: '1.3 Dataset summary: cumulative variant numbers with functional abnormality proportions', component: ConsequenceProporiton, props: { data: consequenceProportionData.value }, loading: consequenceProportionLoading.value, cols: 6, md: 6 },
      { id: 'dataset-accumulation', title: '1.4 Sankey plot of 818 curated genes with established disease and clinical roles', component: ScatterAccumulative, props: { data: datasetAccumulationData.value }, loading: datasetAccumulationLoading.value, cols: 6, md: 6 }
    ]
  },
  {
    id: 'gene-intensity',
    title: '2. Statistics of clinically relevant genes',
    borderColor: 'primary',
    charts: [
      { id: 'gene-accumulation', title: '2.1 Summary of 45 clinically relevant genes: dataset and variant statistics across MAVE techniques.', component: GeneAccumulative, props: { data: geneAccumulativeData.value }, loading: geneAccumulativeLoading.value, cols: 6, md: 6 },
      { id: 'intensity-proportion', title: '2.2 OddsPath statistics', component: IntensityProportion, props: { data: intensityProportionData.value, colors: { Strong: '#fb9a99', Moderate: '#fdbf6f', Weak: '#a6cee3'}}, loading: intensityProportionLoading.value, cols: 6, md: 6 },
      { id: 'gene-intensity-dist', title: '2.3 Summary of variant-level functional intensity tiers', component: DoubleAxisBar, props: { data: geneIntensityDistData.value }, loading: geneIntensityDistLoading.value, cols: 12, md: 12 }
    ]
  },
  {
    id: 'assay-comparison',
    title: '3. Cross-assay statistics',
    borderColor: 'warning',
    charts: [
      { id: 'venn', title: '3.1 Overlap of genes covered by DMS- and CRISPR-based MAVEs', component: Venn, props: { data: vennData.value }, loading: vennLoading.value, cols: 6, md: 6 },
      { id: 'assay-proportion', title: '3.2 Distribution of variant proportion by cross-assay frequency', component: IntensityProportion, props: { data: assayProportionData.value, colors: { 'shared': '#fb9a99', 'single assay': '#a6cee3' } }, loading: assayProportionLoading.value, cols: 6, md: 6 }
    ]
  }
])

// Sidebar interaction
function scrollToSection(value) {
  activeSection.value = value
  const element = document.getElementById(value)
  if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Fetch data asynchronously
onMounted(async () => {
  try {
    const [
      sankeyRes,
      datasetAccumulationRes,
      consequenceProportionRes,
      geneAccumulativeRes,
      intensityProportionRes,
      vennRes,
      assayProportionRes,
      geneIntensityDistRes
    ] = await Promise.all([
      axios.get('/clinmave/api/stat/sanky').finally(() => { sankeyLoading.value = false }),
      axios.get('/clinmave/api/stat/dataset/accumulation').finally(() => { datasetAccumulationLoading.value = false }),
      axios.get('/clinmave/api/stat/variant/consequence').finally(() => { consequenceProportionLoading.value = false }),
      axios.get('/clinmave/api/stat/dataset/oddspath').finally(() => { geneAccumulativeLoading.value = false }),
      axios.get('/clinmave/api/stat/dataset/intensity').finally(() => { intensityProportionLoading.value = false }),
      axios.get('/clinmave/api/stat/mave/venn').finally(() => { vennLoading.value = false }),
      axios.get('/clinmave/api/stat/assay/proportion').finally(() => { assayProportionLoading.value = false }),
      axios.get('/clinmave/api/stat/gene/barplot').finally(() => { geneIntensityDistLoading.value = false })
    ])

    sankeyData.value = sankeyRes.data || []
    datasetAccumulationData.value = datasetAccumulationRes.data || []
    consequenceProportionData.value = consequenceProportionRes.data || {}
    geneAccumulativeData.value = geneAccumulativeRes.data || []
    intensityProportionData.value = intensityProportionRes.data || {}
    vennData.value = vennRes.data || {}
    assayProportionData.value = assayProportionRes.data || {}
    geneIntensityDistData.value = geneIntensityDistRes.data || {}
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    setTimeout(() => { sunburstLoading.value = false }, 500)
  }
})
</script>

<style scoped>
/* Sidebar styling */
.sidebar-col {
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  overflow-y: auto;
  background-color: #fafafa;
  border-right: 1px solid #e0e0e0;
}

.v-list {
  background-color: transparent;
}

.v-list-item--active {
  background-color: #e3f2fd;
  color: #1976d2;
}

.v-list-item {
  transition: background-color 0.2s ease;
}

.v-divider {
  border-color: #e0e0e0;
  border-width: 2px;
}

/* Alert styling */
.v-alert {
  border-radius: 8px;
  padding: 16px;
}

/* Chart row and container styling */
.chart-row {
  display: flex;
  align-items: stretch;
  min-height: 320px;
}

.chart-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.chart-content {
  flex: none;
  width: auto;
  min-height: 280px;
}

/* Chart title styling */
.text-h6 {
  color: #1a3c5e;
  font-weight: 500;
}

/* Center loading indicator */
.v-progress-circular {
  display: block;
  margin: auto;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .sidebar-col {
    position: static;
    height: auto;
    max-height: 300px;
  }
  .chart-row {
    flex-direction: column;
    min-height: auto;
  }
  .chart-container {
    min-height: 300px;
    margin-bottom: 16px;
  }
}
</style>

<template>
  <v-main>
    <v-container fluid class="mt-4">
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
        <v-col>
          <v-alert border="start" border-color="deep-purple accent-4">
            <div class="d-flex flex-wrap">
              <span class="font-weight-bold mr-2">Tips:</span>
              <div class="flex-grow-1">
                <div class="mb-1">(1) Use filters to narrow the datasets table by gene, Mutagenesis strategy, experimental model and phenotype;</div>
                <div>(2) Click the ‘Visualize’ button to:</div>
                <ul class="list-disc pl-5 mt-1 mb-0">
                  <li class="d-flex items-center">
                    <v-icon color="black" size="12" class="mr-2" style="margin-top:5px">mdi-circle</v-icon>
                    Measure the ability of functional score to distinguish clinically classified pathogenic (P/LP) and benign (B/LB) variants ;
                  </li>
                  <li class="d-flex items-center">
                    <v-icon color="black" size="12" class="mr-2" style="margin-top:5px">mdi-circle</v-icon>
                    Compare functional scores in MAVE with widely used in-silico prediction tools.
                  </li>
                </ul>
              </div>
            </div>
          </v-alert>
        </v-col>
      </v-row>
      <v-row>
        <!-- Filter Panel -->
        <v-col cols="12" xl="2" lg="3" md="3" sm="12">
          <v-sheet class="py-6 px-3">
            <v-row>
              <v-col cols="12">
                <div class="text-body-1">Filters</div>
              </v-col>
            </v-row>

            <v-sheet>
              <v-row dense>
                <v-col cols="12">
                  <v-autocomplete
                    v-model="filters.geneName"
                    v-model:search="searchGeneName"
                    :items="geneNameOptions"
                    item-title="text"
                    item-value="value"
                    label="Gene Name"
                    variant="outlined"
                    density="compact"
                    clearable
                    :loading="loadingGeneName"
                  >
                  </v-autocomplete>
                </v-col>
              </v-row>
              
              <v-row dense>
                <v-col cols="12">
                  <v-autocomplete
                    v-model="filters.mutagenesisStrategy"
                    v-model:search="searchMutagenesisStrategy"
                    :items="mutagenesisStrategyOptions"
                    item-title="text"
                    item-value="value"
                    label="Mutagenesis Strategy"
                    variant="outlined"
                    density="compact"
                    clearable
                    :loading="loadingMutagenesisStrategy"
                  >
                  </v-autocomplete>
                </v-col>
              </v-row>

              <v-row dense>
                <v-col cols="12">
                  <v-autocomplete
                    v-model="filters.experimentModel"
                    v-model:search="searchExperimentModel"
                    :items="experimentModelOptions"
                    item-title="text"
                    item-value="value"
                    label="Experiment Model"
                    variant="outlined"
                    density="compact"
                    clearable
                    :loading="loadingExperimentModel"
                  >
                  </v-autocomplete>
                </v-col>
              </v-row>

              <v-row dense>
                <v-col cols="12">
                  <v-autocomplete
                    v-model="filters.phenotype"
                    v-model:search="searchPhenotype"
                    :items="phenotypeOptions"
                    item-title="text"
                    item-value="value"
                    label="Phenotype"
                    variant="outlined"
                    density="compact"
                    clearable
                    :loading="loadingPhenotype"
                  >
                  </v-autocomplete>
                </v-col>
              </v-row>

              <v-row dense>
                <v-spacer></v-spacer>
                <v-col cols="10" class="text-right">
                  <v-btn size="small" dark color="#091C2B" @click="applyFilters" class="mr-2">Apply</v-btn>
                  <v-btn size="small" dark color="#091C2B" @click="resetFilters">Reset</v-btn>
                </v-col>
              </v-row>
            </v-sheet>
          </v-sheet>
        </v-col>
        
        <!-- Table and Visualization Content -->
        <v-col cols="12" xl="10" lg="9" md="9" sm="12" v-if="showResults">
          <v-sheet class="pa-3">
            <!-- Table -->
            <vxe-toolbar ref="toolbarRef" export custom></vxe-toolbar>
            <vxe-table
              ref="tableRef"
              :export-config="{}"
              :column-config="{ resizable: true }"
              :data="tableData"
              :row-class-name="getRowClassName"
              round
              :loading="loading"
              :pager-config="{ currentPage, pageSize, total: totalRecords }"
              @sort-change="handleSortChange"
            >
              <vxe-column field="datasetId" width="140" sortable align="center">
                <template #header>Dataset ID</template>
                <template #default="{ row }">
                  <a 
                    v-if="row.datasetId" 
                    :href="`/clinmave/browse/dataset/${encodeURIComponent(row.datasetId)}`" 
                    target="_blank"
                    style="text-decoration: none;"
                  >
                    {{ row.datasetId }}
                  </a>
                  <span v-else>-</span>
                </template>
              </vxe-column>

              <vxe-column field="geneName" width="130" sortable align="center">
                <template #header>Gene name</template>
                <template #default="{ row }">
                  <a 
                    v-if="row.geneName" 
                    :href="`/clinmave/browse/gene/${encodeURIComponent(row.geneName)}`" 
                    target="_blank"
                    style="text-decoration: none;font-style: italic"
                  >
                    {{ row.geneName }}
                  </a>
                  <span v-else>-</span>
                </template>
              </vxe-column>
              
              <vxe-column field="maveTechnique" title="MAVE technique" min-width="200" align="center">
                <template #default="{ row }">
                  <a 
                    v-if="row.maveTechnique" 
                    :href="`/clinmave/browse/mave_techniques/${encodeURIComponent(row.maveTechnique)}`" 
                    target="_blank"
                    style="text-decoration: none;"
                  >
                    {{ row.maveTechnique }}
                  </a>
                  <span v-else>-</span>
                </template>
              </vxe-column>
              
              <vxe-column field="functionalAssay" title="Function Assay" min-width="160" align="center"></vxe-column>

              <vxe-column field="phenotype" title="Phenotype" min-width="400" align="center"></vxe-column>

              <vxe-column field="varNum" title="#Variants" min-width="120" align="center" sortable></vxe-column>
            </vxe-table>
            <!-- Pagination -->
            <vxe-pager
              :current-page.sync="currentPage"
              :page-size.sync="pageSize"
              :total="totalRecords"
              :layouts="['Home', 'PrevPage', 'JumpNumber', 'NextPage', 'End', 'Sizes', 'Total']"
              @page-change="handlePageChange"
            ></vxe-pager>
          </v-sheet>
          <v-divider></v-divider>

          <!-- Tabs and Visualizations -->
          <v-sheet bg-color="white" class="visualization-wrapper" v-if="showVisualize">
            <v-tabs
              v-model="activeTab"
              bg-color="white"
              color="primary"
              density="compact"
              align-tabs="start"
            >
              <v-tab value="compareConsequence">Compare Consequence</v-tab>
              <v-tab value="rocCurve">RocCurve Plot</v-tab>
            </v-tabs>

            <v-tabs-window v-model="activeTab">
              <!-- RocCurve Plot -->
              <v-tabs-window-item value="rocCurve">
                <v-sheet style="min-height: 300px; position: relative; overflow: visible;">
                  <v-row justify="center">
                    <v-col cols="12" md="4" sm="12">
                      <template v-if="RocCurveLoading">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                          <v-progress-circular
                            indeterminate
                            color="primary"
                            size="48"
                          ></v-progress-circular>
                          <div style="margin-top: 8px; color: #666;">Loading RocCurve data...</div>
                        </div>
                      </template>
                      <template v-else-if="hasRocCurveData">
                        <v-card-text class="d-flex flex-column">
                          <div ref="rocChartWrapper" style="position: relative; width: 100%; min-height: 400px;">
                            <RocCurve
                              :scores="RocCurveMap.score"
                              :tags="RocCurveMap.clvGroup"
                              :titleFlag="true"
                              ref="rocCurveComponent"
                            />
                            <!-- Download Button -->
                            <div class="download-wrapper" style="position: absolute; top: 5px; right: 5px;">
                              <v-btn class="download-btn" variant="text" size="small">
                                <v-icon>mdi-download</v-icon>
                              </v-btn>
                              <v-menu activator="parent">
                                <v-list>
                                  <v-list-item @click="downloadRocCurveSVG">
                                    <v-list-item-title>Download SVG</v-list-item-title>
                                  </v-list-item>

                                  <v-list-item @click="downloadRocCurvePDF">
                                    <v-list-item-title>Download PDF</v-list-item-title>
                                  </v-list-item>
                                </v-list>
                              </v-menu>
                            </div>
                          </div>
                        </v-card-text>
                      </template>
                      <template v-else>
                        <div class="text-center" style="margin-top: 100px; color: #999;">
                          No RocCurve data available.
                        </div>
                      </template>
                    </v-col>
                  </v-row>
                </v-sheet>
              </v-tabs-window-item>

              <!-- CompareConsequenceBox -->
              <v-tabs-window-item value="compareConsequence">
                <v-sheet style="min-height: 300px; position: relative; overflow: visible;">
                  <v-row justify="center">
                    <v-col cols="12" md="8" sm="12">
                      <template v-if="scatterLoading">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                          <v-progress-circular
                            indeterminate
                            color="primary"
                            size="48"
                          ></v-progress-circular>
                          <div style="margin-top: 8px; color: #666;">Loading compare consequence data...</div>
                        </div>
                      </template>
                      <template v-else-if="hasCompareConsequenceBpxData">
                        <CompareConsequenceBox
                          :data="consequencecomparingboxArray"
                          :titleFlag="true"
                          :yAxisTitleMap="{ 
                            'cadd': 'CADD', 
                            'metasvm': 'MetaSVM', 
                            'alphamissense': 'AlphaMissense',
                            'polyphen2': 'Polyphen2', 
                            'revel': 'REVEL'
                          }"
                        />
                      </template>
                      <template v-else>
                        <div class="text-center" style="margin-top: 100px; color: #999;">
                          No Compare Consequence data available.
                        </div>
                      </template>
                    </v-col>
                  </v-row>
                </v-sheet>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-sheet>
        </v-col>
      </v-row>

      <v-dialog v-model="showWarningDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h6">
            Filter warning
          </v-card-title>
          <v-card-text>
            Multiple entries found. Please refine your filter selections to return exact entry.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="showWarningDialog = false">
              OK
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </v-main>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import axios from 'axios'
import { debounce } from 'lodash'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import VxeUI from 'vxe-pc-ui'
import 'vxe-pc-ui/lib/style.css'
import 'vxe-table/lib/style.css'

import RocCurve from '@/components/analyze/RocCurve.vue'
import CompareConsequenceBox from '@/components/analyze/CompareConsequenceBox.vue'

const breadcrumbs = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'Analysis',
    disabled: false,
  },
  {
    title: 'Dataset',
    disabled: false,
  },
]

// Filters
const filters = ref({
  geneName: 'BRAF',
  mutagenesisStrategy: null,
  experimentModel: 'E. coli',
  phenotype: null,
})

const geneNameOptions = ref([])
const searchGeneName = ref(null)
const loadingGeneName = ref(false)

const mutagenesisStrategyOptions = ref([])
const searchMutagenesisStrategy = ref(null)
const loadingMutagenesisStrategy = ref(false)

const experimentModelOptions = ref([])
const searchExperimentModel = ref(null)
const loadingExperimentModel = ref(false)

const phenotypeOptions = ref([])
const searchPhenotype = ref(null)
const loadingPhenotype = ref(false)

// Warning dialog control
const showWarningDialog = ref(false)

// Control variables
const showResults = ref(false)
const showVisualize = ref(false)
const highlightedRowId = ref(null)
const activeTab = ref('compareConsequence')

const scatterLoading = ref(false)
const consequencecomparingboxArray = ref({})
const RocCurveMap = ref({})
const RocCurveLoading = ref(false)

const toolbarRef = ref()
const tableRef = ref()
const tableData = ref([]) 
const currentPage = ref(1)
const pageSize = ref(5)
const totalRecords = ref(0)
const loading = ref(false)
const sortParams = ref({
  field: '',
  order: ''
})

const rocChartWrapper = ref(null)
const rocCurveComponent = ref(null)

const datasetId = computed(() => tableData.value[0]?.datasetId || '')

const debouncedFetchGeneName = debounce(() => fetchOptions('geneName', geneNameOptions, loadingGeneName), 300)
const debouncedFetchMutagenesisStrategy = debounce(() => fetchOptions('mutagenesisStrategy', mutagenesisStrategyOptions, loadingMutagenesisStrategy), 300)
const debouncedFetchExperimentModel = debounce(() => fetchOptions('experimentModel', experimentModelOptions, loadingExperimentModel), 300)
const debouncedFetchPhenotype = debounce(() => fetchOptions('phenotype', phenotypeOptions, loadingPhenotype), 300)
const debouncedFetchCompareConsequenceBox = debounce(fetchCompareConsequenceBox, 300)
const debouncedFetchRocCurve = debounce(fetchRocCurveData, 300)

const hasRocCurveData = computed(() => {
  if (!RocCurveMap.value || typeof RocCurveMap.value !== 'object') return false
  const score = RocCurveMap.value.score
  const clvGroup = RocCurveMap.value.clvGroup
  if (!Array.isArray(score) || !Array.isArray(clvGroup)) return false
  if (score.length === 0 || clvGroup.length === 0) return false
  if (score.length !== clvGroup.length) return false
  const allScoresAreNumbers = score.every(item => typeof item === 'number')
  const allGroupsAreValid = clvGroup.every(item => item === 0 || item === 1)
  return allScoresAreNumbers && allGroupsAreValid
})

const hasCompareConsequenceBpxData = computed(() => {
  if (!consequencecomparingboxArray.value) return false;
  const d = consequencecomparingboxArray.value;
  if (!d || typeof d !== 'object') return false;
  return Object.keys(d).some(key => {
    const functionalAltered = d[key]?.["Functional altered"];
    const functionallyNormal = d[key]?.["Functionally normal"];
    return Array.isArray(functionalAltered) && functionalAltered.length > 0 && 
           Array.isArray(functionallyNormal) && functionallyNormal.length > 0;
  });
});

async function fetchOptions(term, optionsRef, loadingRef, search = '') {
  try {
    loadingRef.value = true
    const params = { ...filters.value, term }
    if (search) params.search = search
    const response = await axios.get('/clinmave/api/select/dataset', { params })
    optionsRef.value = response.data.result.map(item => ({
      text: `${item[term]} (#Entries: ${item.count})`,
      value: item[term]
    }))
  } catch (error) {
    VxeUI.message.error(`Failed to load ${term} options`)
    optionsRef.value = []
  } finally {
    loadingRef.value = false
  }
}

async function fetchRocCurveData(query = '') {
  RocCurveLoading.value = true
  try {
    const response = await axios.get('/clinmave/api/analyze/clinvarauc', {
      params: { datasetId: query || '' },
    })
    RocCurveMap.value = response.data || {}
    console.log('[RocCurveMap]', RocCurveMap.value)
  } catch (error) {
    VxeUI.message.error('Failed to load RocCurve data')
    RocCurveMap.value = {}
  } finally {
    RocCurveLoading.value = false
  }
}

async function fetchCompareConsequenceBox(query = '') {
  scatterLoading.value = true
  try {
    const response = await axios.get('/clinmave/api/analyze/consequencecomparingbox', {
      params: { datasetId: query || '' },
    })
    consequencecomparingboxArray.value = response.data || {}
    console.log('[CompareConsequenceBox Array]', consequencecomparingboxArray.value)
  } catch (error) {
    VxeUI.message.error('Failed to load CompareConsequenceBox data')
    consequencecomparingboxArray.value = {}
  } finally {
    scatterLoading.value = false
  }
}

const getRowClassName = ({ row }) => {
  if (row.datasetId === highlightedRowId.value) {
    return 'highlighted-row'
  }
  return ''
}

const loadData = async () => {
  loading.value = true
  try {
    let sort
    if (Array.isArray(sortParams.value)) {
      sort = sortParams.value
        .filter(param => param.field && param.order)
        .map(param => `${param.field},${param.order}`)
        .join(',')
    } else {
      sort = sortParams.value.field && sortParams.value.order
        ? `${sortParams.value.field},${sortParams.value.order}`
        : 'id,asc'
    }

    const params = {
      page: currentPage.value - 1,
      size: pageSize.value,
      sort: sort || undefined,
      ...filters.value
    }

    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key]
      }
    })

    const response = await axios.get('/clinmave/api/fetch/table/dataset', { params })
    tableData.value = response.data.data || []
    totalRecords.value = response.data.totalRows || 0
  } catch (error) {
    console.error('[API Error]', error)
    tableData.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

const applyFilters = async () => {
  const allOptions = [
    ...geneNameOptions.value,
    ...mutagenesisStrategyOptions.value,
    ...experimentModelOptions.value,
    ...phenotypeOptions.value
  ]
  
  const maxEntries = allOptions.reduce((max, option) => {
    const match = option.text.match(/#Entries: (\d+)/)
    const count = match ? parseInt(match[1], 10) : 0
    return Math.max(max, count)
  }, 0)

  if (maxEntries > 1) {
    showWarningDialog.value = true
    return
  }

  currentPage.value = 1
  activeTab.value = 'compareConsequence'
  await loadData()
  
  showResults.value = true
  showVisualize.value = true
}

const resetFilters = () => {
  showVisualize.value = false
  showResults.value = false
  activeTab.value = 'compareConsequence'
  searchGeneName.value = null
  searchMutagenesisStrategy.value = null
  searchExperimentModel.value = null
  searchPhenotype.value = null

  filters.value = { 
    geneName: null,
    mutagenesisStrategy: null,
    experimentModel: null,
    phenotype: null,
  }
  
  currentPage.value = 1
}

const handlePageChange = (event) => {
  currentPage.value = event.currentPage
  pageSize.value = event.pageSize
  loadData()
}

const handleSortChange = ({ field, order, sortList }) => {
  if (sortList && sortList.length > 0) {
    const validSorts = sortList
      .filter(sort => sort.field && sort.order && sort.field !== 'null')
      .map(sort => ({ field: sort.field, order: sort.order }))
    
    if (validSorts.length > 0) {
      sortParams.value = validSorts
    } else {
      sortParams.value = { field: 'id', order: 'asc' }
    }
  } else {
    sortParams.value = {
      field: field && field !== 'null' ? field : 'id',
      order: order || 'asc'
    }
  }
  
  currentPage.value = 1
  loadData()
}

const getConsequenceClassColor = (consequenceClass) => {
  const colorMap = {
    'Loss-of-function': '#FF5252', 
    'Functional neutral': '#9E9E9E', 
    'Gain-of-function': '#4CAF50', 
    'Dominant negative': '#FF9800',
    'Unknown': '#9C27B0',
  }
  
  const normalized = consequenceClass.toLowerCase()
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalized.includes(key.toLowerCase())) {
      return value
    }
  }
  
  return '#2196F3'
}

// Download SVG for RocCurve
const downloadRocCurveSVG = () => {
  const svgEl = rocCurveComponent.value.$el.querySelector('svg')
  if (!svgEl) {
    VxeUI.message.error('No SVG element found for download')
    return
  }
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgEl)
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'roc-curve.svg'
  a.click()
  URL.revokeObjectURL(url)
}

// Download PDF for RocCurve
const downloadRocCurvePDF = async () => {
  try {
    const container = rocChartWrapper.value
    if (!container) {
      VxeUI.message.error('Chart container not found')
      return
    }
    const downloadWrapper = container.querySelector('.download-wrapper')
    downloadWrapper.style.display = 'none'
    const { clientWidth: width, clientHeight: height } = container
    const canvas = await html2canvas(container, { scale: 2 })
    downloadWrapper.style.display = ''
    const imgData = canvas.toDataURL('image/png')
    const doc = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [width, height]
    })
    doc.addImage(imgData, 'PNG', 0, 0, width, height)
    doc.save('roc-curve.pdf')
  } catch (error) {
    console.error('PDF download failed:', error)
    VxeUI.message.error('Failed to generate PDF')
  }
}

watch(datasetId, (newDatasetId) => {
  if (newDatasetId) {
    console.log('[Dataset ID changed]', newDatasetId)
    debouncedFetchCompareConsequenceBox(newDatasetId)
    debouncedFetchRocCurve(newDatasetId)
  }
})

watch([currentPage, pageSize], () => {
  loadData()
})

watch(
  () => ({
    ...filters.value,
    searchGeneName: searchGeneName.value,
    searchMutagenesisStrategy: searchMutagenesisStrategy.value,
    searchPhenotype: searchPhenotype.value,
    searchExperimentModel: searchExperimentModel.value,
  }),
  () => {
    debouncedFetchGeneName()
    debouncedFetchMutagenesisStrategy()
    debouncedFetchExperimentModel()
    debouncedFetchPhenotype()
  },
  { deep: true }
)

onMounted(async () => {
  debouncedFetchGeneName()
  debouncedFetchMutagenesisStrategy()
  debouncedFetchExperimentModel()
  debouncedFetchPhenotype()
  showResults.value = true
  await loadData()
  showVisualize.value = true
  const $table = tableRef.value
  const $toolbar = toolbarRef.value
  if ($table && $toolbar) {
    $table.connect($toolbar)
  }
})
</script>

<style scoped>
.visualization-wrapper {
  padding: 0;
}
.v-tabs {
  background-color: #FFFFFF;
}
.v-tab {
  font-size: 14px;
  text-transform: none;
  color: #bcbcbc;
}
.v-tab--active {
  color: var(--v-theme-primary) !important;
}
.download-wrapper {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 10;
}
.download-btn {
  font-size: 12px;
  text-transform: none;
  color: #333333;
}
</style>

<style>
.highlighted-row {
  background-color: #E3F2FD !important;
}
</style>
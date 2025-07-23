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
                    View the distribution of MAVE functional scores grouped by molecular consequence/Clinvar classification
                  </li>
                  <li class="d-flex items-center">
                    <v-icon color="black" size="12" class="mr-2" style="margin-top:5px">mdi-circle</v-icon>
                    Explore the relationship between population allele frequency (gnomAD) and MAVE functional score.
                  </li>
                </ul>
              </div>
            </div>
          </v-alert>
        </v-col>
      </v-row>
      <v-row>
        <!-- Filter Panel 左侧筛选栏，始终显示 -->
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
                  <v-btn size="small" dark color="#091C2B" @click="applyFilters" class="mr-2">Visualize</v-btn>
                  <v-btn size="small" dark color="#091C2B" @click="resetFilters">Reset</v-btn>
                </v-col>
              </v-row>
            </v-sheet>
          </v-sheet>
        </v-col>
        
        <!-- Table Content 右侧内容：itors="showResults显示/隐藏 -->
        <v-col cols="12" xl="10" lg="9" md="9" sm="12" v-if="showResults">
          <v-sheet class="pa-3">   
            <!-- Table -->
            <vxe-toolbar ref="toolbarRef" export custom></vxe-toolbar>
            <!-- Pagination -->

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

                  <template #header>
                    Gene name
                  </template>
                  
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

              <vxe-column field="pmid" title="PMID" min-width="153" align="center">
                <template #default="{ row }">
                  <div v-if="row">
                    <a :href="`https://pubmed.ncbi.nlm.nih.gov/${row.pmid}`" target="_blank" style="text-decoration: none;">
                      {{ row.pmid ? row.pmid : 'N/A' }}
                    </a>
                    <v-icon small color="primary">mdi-share</v-icon>
                  </div>
                </template>
              </vxe-column>

              <vxe-column field="maveTechnique" title="MAVE technique" min-width="230" align="center">
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
              
              <vxe-column field="functionalAssay" title="Function Assay" min-width="240" align="center"></vxe-column>

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

          <v-sheet style="min-height: 300px; position: relative; overflow: visible;" v-if="showVisualize">
            <v-row>
              <v-col cols="12" md="4" sm="12" style="position: relative;">
                <template v-if="clinVarBinLoading">
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      size="48"
                    ></v-progress-circular>
                    <div style="margin-top: 8px; color: #666;">Loading Oncoprint data...</div>
                  </div>
                </template>

                <template v-else-if="hasClinVarBinData">
                  <ClinVarBin
                    :inputData="ClinVarBinArray"
                    :titleFlag="true"
                  />
                </template>

                <template v-else>
                  <div class="text-center" style="margin-top: 100px; color: #999;">
                    No ClinVar data available.
                  </div>
                </template>
              </v-col>

              <v-col cols="12" md="4" sm="12" style="position: relative;">
                <template v-if="scatterLoading">
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      size="48"
                    ></v-progress-circular>
                    <div style="margin-top: 8px; color: #666;">Loading Scatter data...</div>
                  </div>
                </template>

                <template v-else-if="hasScatterData">
                  <Scatter2d
                    :scatterData="scatterArray"
                    :size="300"
                    :titleFlag="true"
                  />
                </template>

                <template v-else>
                  <div class="text-center" style="margin-top: 100px; color: #999;">
                    No Scatter2d data available.
                  </div>
                </template>
              </v-col>

              <v-col cols="12" md="4" sm="12" style="position: relative;">
                <template v-if="consequenceDensityLoading">
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      size="48"
                    ></v-progress-circular>
                    <div style="margin-top: 8px; color: #666;">Loading Oncoprint data...</div>
                  </div>
                </template>

                <template v-else-if="hasConsequenceDensityData">
                  <ConsequenceDensity
                    :data="consequenceArray" 
                    :titleFlag="true"
                  />
                </template>

                <template v-else>
                  <div class="text-center" style="margin-top: 100px; color: #999;">
                    No ClinVar data available.
                  </div>
                </template>
              </v-col>
            </v-row>
            
          </v-sheet>

        </v-col>
      </v-row>

      <!-- Warning Dialog -->
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

import VxeUI from 'vxe-pc-ui';
import 'vxe-pc-ui/lib/style.css';
import 'vxe-table/lib/style.css'

import Scatter2d from '@/components/Visualization/Scatter2d.vue'
import ClinVarBin from '@/components/Visualization/ClinVarBin.vue'
import ConsequenceDensity from '@/components/Visualization/ConsequenceDensity.vue'

const breadcrumbs = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'Visualize',
  },
  {
    title: 'Dataset',
  },
]

// Filters
const filters = ref({
  geneName: 'BRCA1',
  mutagenesisStrategy: 'Mutagenic PCR',
  experimentModel: null,
  phenotype: null,
})

const geneNameOptions = ref([])
const searchGeneName = ref(null)
const loadingGeneName = ref(false)

const mutagenesisStrategyOptions = ref([])
const searchMutagenesisStrategy = ref(null)
const loadingMutagenesisStrategy= ref(false)

const experimentModelOptions = ref([])
const searchExperimentModel = ref(null)
const loadingExperimentModel = ref(false)

const phenotypeOptions = ref([])
const searchPhenotype = ref(null)
const loadingPhenotype = ref(false)

// Warning dialog control
const showWarningDialog = ref(false)

// Control variables for results and visualization
const showResults = ref(false)
const showVisualize = ref(false)
const highlightedRowId = ref(null)

const scatterArray = ref([])
const scatterLoading = ref(false)

const clinVarBinLoading = ref(false)
const ClinVarBinArray = ref([])

const consequenceDensityLoading = ref(false)
const consequenceArray = ref([])

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

const datasetId = computed(() => tableData.value[0]?.datasetId || '')

const debouncedFetchGeneName = debounce(() => fetchOptions('geneName', geneNameOptions, loadingGeneName), 300)
const debouncedFetchMutagenesisStrategy = debounce(() => fetchOptions('mutagenesisStrategy', mutagenesisStrategyOptions, loadingMutagenesisStrategy), 300)
const debouncedFetchExperimentModel = debounce(() => fetchOptions('experimentModel', experimentModelOptions, loadingExperimentModel), 300)
const debouncedFetchPhenotype = debounce(() => fetchOptions('phenotype', phenotypeOptions, loadingPhenotype), 300)

const debouncedFetchClinVarBinData = debounce(fetchClinVarBinData, 300)
const debouncedFetchScatterData = debounce(fetchScatterData, 300)
const debouncedFetchConsequenceDensityData = debounce(fetchConsequenceDensityData, 300)

const hasClinVarBinData = computed(() => {
  return Array.isArray(ClinVarBinArray.value) &&
          ClinVarBinArray.value.length > 0 &&
          ClinVarBinArray.value[0].clvGroupCounts &&
          typeof ClinVarBinArray.value[0].clvGroupCounts === 'object' &&
          Object.keys(ClinVarBinArray.value[0].clvGroupCounts).length > 0
})

const hasScatterData = computed(() => {
  return scatterArray.value &&
         Array.isArray(scatterArray.value) &&
         scatterArray.value.length > 0 &&
         scatterArray.value[0].af !== undefined &&
         scatterArray.value[0].score !== undefined
})

const hasConsequenceDensityData = computed(() => {
  return consequenceArray.value &&
         Array.isArray(consequenceArray.value) &&
         consequenceArray.value.length > 0
})

// Generic fetch function for autocomplete options
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

async function fetchScatterData(query = '') {
  scatterLoading.value = true
  try {
    const response = await axios.get('/clinmave/api/visualize/bydataset/scatter', {
      params: { datasetId: !query ? '' : query },
    })
    scatterArray.value = response.data || []
    console.log('[Scatter Array]', scatterArray)
  } catch (error) {
    VxeUI.message.error('Failed to load scatter data')
    scatterArray.value = []
  } finally {
    scatterLoading.value = false
  }
}

async function fetchClinVarBinData(query = '') {
  clinVarBinLoading.value = true
  try {
    const response = await axios.get('/clinmave/api/visualize/bydataset/clinvarbin', {
      params: { datasetId: !query ? '' : query },
    })
    ClinVarBinArray.value = response.data || []
  } catch (error) {
    VxeUI.message.error('Failed to load ClinVar bin data')
    ClinVarBinArray.value = []
  } finally {
    clinVarBinLoading.value = false
  }
}

async function fetchConsequenceDensityData(query = '') {
  consequenceDensityLoading.value = true
  try {
    const response = await axios.get('/clinmave/api/visualize/bydataset/consequencedensity', {
      params: { datasetId: !query ? '' : query },
    })
    consequenceArray.value = response.data || []
    console.log('[Consequence Array]', consequenceArray)
  } catch (error) {
    VxeUI.message.error('Failed to load consequence density data')
    consequenceArray.value = []
  } finally {
    consequenceDensityLoading.value = false
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
  // Check maximum entries count from all autocomplete options
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
  await loadData()
  
  showResults.value = true
  showVisualize.value = true
}

const resetFilters = () => {
  showVisualize.value = false
  showResults.value = false
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
  
  return '#2196F3' // Default blue
}

watch(datasetId, (newDatasetId) => {
  if (newDatasetId) {
    debouncedFetchClinVarBinData(newDatasetId)
    debouncedFetchScatterData(newDatasetId)
    debouncedFetchConsequenceDensityData(newDatasetId)
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
  showVisualize.value = true
  await loadData()

  const $table = tableRef.value
  const $toolbar = toolbarRef.value
  if ($table && $toolbar) {
    $table.connect($toolbar)
  }
})
</script>

<style scoped>
.banner-tips {
  align-items: flex-start
}
.dot-icon {
  vertical-align: middle
}
</style>

<style>
.highlighted-row {
  background-color: #E3F2FD !important
}
</style>
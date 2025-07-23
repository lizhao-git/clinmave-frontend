<template>
  <v-main>
    <v-container fluid class="mt-4">
        <v-row>
          <v-col cols="12">
            <v-card 
              flat
            >
              <v-breadcrumbs :items="breadcrumbs">
                <template v-slot:item="{ item }">
                  <v-breadcrumbs-item
                    :disabled="item.disabled"
                    :href="item.href"
                  >
                    <!-- Customized icons -->
                    <span>
                      <v-icon v-if="item.icon" :icon="item.icon" left></v-icon>
                      {{ item.title }}
                    </span>
                  </v-breadcrumbs-item>
                </template>
              </v-breadcrumbs>
            </v-card>
          </v-col>
        </v-row>
        <v-row>

          <!-- Filter Panel -->
          <v-col cols="12" xl="2" lg="3" md="3" sm="12" v-if="showFilters">
            <v-sheet v-if="showFilters" class="py-6 px-3">
              <v-row>
                <v-col cols="12">
                  <div class="text-body-1">Filters</div>
                  <v-btn 
                    size="small" 
                    dark 
                    color="#091C2B" 
                    class="float-end" 
                    @click="toggleFilters"
                  >
                    <span>{{ showFilters ? 'Hide' : 'Show' }}</span>
                    <v-icon small>{{ showFilters ? 'mdi-chevron-double-left' : 'mdi-chevron-double-right' }}</v-icon>
                  </v-btn>
                </v-col>
              </v-row>

              <v-sheet>
                <v-row dense>
                  
                  <v-col cols="12">
                    <v-autocomplete
                      v-model="filters.maveTechnique"
                      v-model:search="searchMaveTechnique"
                      :items="maveTechniqueOptions"
                      label="MAVE technique"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingMaveTechnique"
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
          <!-- Table Content -->
          <v-col :cols="showFilters ? 12 : 12" :xl="showFilters ? 10 : 12" :lg="showFilters ? 9 : 12" :md="showFilters ? 9 : 12" :sm="showFilters ? 12 : 12">
            <v-sheet class="pa-3">

              <!-- Show Filters Button when filters are hidden -->
              <v-btn 
                v-if="!showFilters"
                size="small" 
                dark 
                color="#091C2B" 
                class="mb-3"
                @click="toggleFilters"
              >
                <span>Show Filters</span>
                <v-icon small>mdi-chevron-double-right</v-icon>
              </v-btn>

              <!-- Table -->
              <vxe-toolbar ref="toolbarRef" export custom></vxe-toolbar>
              <!-- Pagination -->
              <vxe-pager
                :current-page.sync="currentPage"
                :page-size.sync="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="totalRecords"
                :layouts="['Home', 'PrevPage', 'JumpNumber', 'NextPage', 'End', 'Sizes', 'Total']"
                @page-change="handlePageChange"
              ></vxe-pager>

              <vxe-table
                ref="tableRef"
                :export-config="{}"
                :column-config="{ resizable: true }"
                :data="tableData"
                stripe
                round
                :loading="loading"
                :pager-config="{ currentPage, pageSize, total: totalRecords }"
                @sort-change="handleSortChange"
              >
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

                <!-- <vxe-column field="geneName" width="130" sortable>

                    <template #header>
                      Gene Name
                    </template>
                    
                    <template #default="{ row }">
                      <a 
                        v-if="row.geneName" 
                        :href="`/browse/gene/${encodeURIComponent(row.geneName)}`" 
                        target="_blank"
                        style="text-decoration: none;"
                      >
                        {{ row.geneName }}
                        <v-icon small color="blue">mdi-share</v-icon>
                      </a>
                      <span v-else>-</span>
                    </template>

                </vxe-column> -->
                
                <vxe-column field="totalDatasets" title="#Datasets" min-width="100" align="center" sortable></vxe-column>

                <!-- <vxe-column field="dataset" title="Dataset ID" min-width="500" align="center">
                  <template #default="{ row }">
                    <span v-for="(id, idx) in splitDatasetIds(row.dataset)" :key="idx">
                      <v-chip 
                        color="primary"
                        variant="outlined" 
                        class="mr-2"
                      >
                        <a :href="'/browse/dataset/' + id" target="_blank" style="color: #1976d2;">{{ id }}</a>
                      </v-chip>
                    </span>
                  </template>
                </vxe-column> -->

                <!-- <vxe-column field="info" title="Information" min-width="200" align="center"></vxe-column> -->

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
          </v-col>
        </v-row>
      </v-container>
  </v-main>
</template>

<style scoped>

</style>

<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import axios from 'axios'
import { debounce } from 'lodash'

import VxeUI from 'vxe-pc-ui';
import 'vxe-pc-ui/lib/style.css';

import {VXETable} from 'vxe-table'
import 'vxe-table/lib/style.css'

const breadcrumbs = [
  {
    title: 'Home',
  },
  {
    title: 'Browse',
    href: '/browse/mave_techniques'
  },
  {
    title: 'MAVE techniques',
    href: '/browse/mave_techniques'
  },
]

// Reactive state for filters
const filters = ref({
  geneName: null,
  datasetId: null,
})


// Reactive state for autocomplete options
const geneNameOptions = ref([])
const ensemblIdOptions = ref([])
const datasetIdOptions = ref([])

// Reactive state for search inputs
const searchGeneName = ref(null)
const searchEnsemblId = ref(null)
const searchDatasetId = ref(null)

// Loading states for autocomplete fields
const loadingGeneName = ref(false)
const loadingEnsemblId = ref(false)
const loadingDatasetId = ref(false)

// Reactive state for filter panel visibility
const showFilters = ref(true)

// Table state
const toolbarRef = ref()
const tableRef = ref()
const tableData = ref([]) 
const currentPage = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)
const loading = ref(false)
const sortParams = ref({
  field: '',
  order: ''
})

const debouncedFetchGeneName = debounce(fetchGeneNameOptions, 300)
const debouncedFetchEnsemblId = debounce(fetchEnsemblIdOptions, 300)
const debouncedFetchDatasetId = debounce(fetchDatasetIdOptions, 300)

// Debounced fetch functions for autocomplete options

async function fetchGeneNameOptions(query = '') {
  try {
    loadingGeneName.value = true;
    const response = await axios.get('/clinmave/api/select/genes', {
      params: { geneName: !query ? '' : query },
    });
    geneNameOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load dbSNP IDs');
    geneNameOptions.value = [];
  } finally {
    loadingGeneName.value = false;
  }
}

async function fetchEnsemblIdOptions(query = '') {
  try {
    loadingEnsemblId.value = true;
    const response = await axios.get('/clinmave/api/select/genes', {
      params: { ensemblId: !query ? '' : query },
    });
    ensemblIdOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load Ensembl IDs');
    ensemblIdOptions.value = [];
  } finally {
    loadingEnsemblId.value = false;
  }
}

async function fetchDatasetIdOptions(query = '') {
  try {
    loadingDatasetId.value = true;
    const response = await axios.get('/clinmave/api/select/genes', {
      params: { datasetId: !query ? '' : query },
    });
    datasetIdOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load Dataset IDs');
    datasetIdOptions.value = [];
  } finally {
    loadingDatasetId.value = false;
  }
}

function splitDatasetIds(datasetIdStr) {
  if (!datasetIdStr) return [];
  return datasetIdStr.split(';').map(s => s.trim()).filter(Boolean);
}

// Load data function
const loadData = async () => {
  loading.value = true;
  
  try {
    let sort;

    if (Array.isArray(sortParams.value)) {
      // 多列排序
      sort = sortParams.value
        .filter(param => param.field && param.order)
        .map(param => `${param.field},${param.order}`)
        .join(',');
    } else {
      // 单列排序
      sort = sortParams.value.field && sortParams.value.order
        ? `${sortParams.value.field},${sortParams.value.order}`
        : 'id,asc'; // 默认排序
    }

    // Construct request parameters
    const params = {
      page: currentPage.value - 1, // Adjust based on backend: use currentPage.value - 1 if zero-based
      size: pageSize.value,
      sort: sort || undefined,
      ...filters.value
    };

    // Remove empty or undefined params
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    // Replace with your actual API endpoint
    const response = await axios.get('/clinmave/api/fetch/table/mavetechnique', { params });
    
    // Verify response structure
    tableData.value = response.data.data || [];
    console.log(tableData.value)
    totalRecords.value = response.data.totalRows || 0;
  } catch (error) {
    console.error('[API Error]', error);
    // Handle error gracefully
    tableData.value = [];
    totalRecords.value = 0;
  } finally {
    loading.value = false;
  }
};

// Methods
const toggleFilters = () => {
  showFilters.value = !showFilters.value;
}

const applyFilters = () => {
  currentPage.value = 1;
  loadData();
}

const resetFilters = () => {
  searchGeneName.value = null;
  searchEnsemblId.value = null;
  searchDatasetId.value = null;

  filters.value = { 
    geneName: null, 
    ensemblId: null,
    datasetId: null
  };
  
  currentPage.value = 1;

  loadData();
}

const handlePageChange = (event) => {
  console.log('[Page Change]', event) // Debug event data
  currentPage.value = event.currentPage
  pageSize.value = event.pageSize
  loadData()
}

const handleSortChange = ({ field, order, sortList }) => {
  if (sortList && sortList.length > 0) {
    // 过滤掉无效的排序字段
    const validSorts = sortList
      .filter(sort => sort.field && sort.order && sort.field !== 'null')
      .map(sort => ({ field: sort.field, order: sort.order }));
    
    if (validSorts.length > 0) {
      sortParams.value = validSorts;
    } else {
      sortParams.value = { field: 'id', order: 'asc' };
    }
  } else {
    // 单列排序
    sortParams.value = {
      field: field && field !== 'null' ? field : 'id',
      order: order || 'asc'
    };
  }
  
  currentPage.value = 1; // 排序后回到第一页
  loadData();
};

const getConsequenceClassColor = (consequenceClass) => {
  const colorMap = {
    'Loss-of-function': '#FF5252', 
    'Functional neutral': '#9E9E9E', 
    'Gain-of-function': '#4CAF50', 
    'Dominant negative': '#FF9800',
    'Unknown': '#9C27B0',
  };
  
  const normalized = consequenceClass.toLowerCase();

  for (const [key, value] of Object.entries(colorMap)) {
    if (normalized.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return '#2196F3'; // Default blue
};

// Watch pagination parameters
watch([currentPage, pageSize], () => {
  console.log('[Watch] Page or size changed:', currentPage.value, pageSize.value)
  loadData()
})

// Initialize
onMounted(() => {
  debouncedFetchGeneName();
  debouncedFetchEnsemblId();
  debouncedFetchDatasetId();
  loadData();
  const $table = tableRef.value
  const $toolbar = toolbarRef.value
  if ($table && $toolbar) {
    $table.connect($toolbar)
  }
})

</script>
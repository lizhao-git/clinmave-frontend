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

          <!-- Filter Panel -->
          <v-col cols="12" md="2" v-if="showFilters">
            <v-sheet v-if="showFilters" class="py-6 px-3">
              <v-row>
                <v-col cols="12">
                  <div class="text-body-1 font-weight-bold">Filters</div>
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
                      v-model="filters.datasetId"
                      v-model:search="searchDatasetId"
                      :items="datasetIdOptions"
                      item-title="text"
                      item-value="value"
                      label="Dataset ID"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingDatasetId"
                    >
                    </v-autocomplete>
                  </v-col>

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

                  <v-col cols="12">
                    <v-autocomplete
                      v-model="filters.ensemblId"
                      v-model:search="searchEnsemblId"
                      :items="ensemblIdOptions"
                      item-title="text"
                      item-value="value"
                      label="Ensembl ID"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingEnsemblId"
                    >
                    </v-autocomplete>
                  </v-col>

                  <v-col cols="12">
                    <v-autocomplete
                      v-model="filters.maveTechnique"
                      v-model:search="searchMaveTechnique"
                      :items="maveTechniqueOptions"
                      item-title="text"
                      item-value="value"
                      label="Mave technique"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingMaveTechnique"
                    >
                    </v-autocomplete>
                  </v-col>

                  <v-col cols="12">
                    <v-autocomplete
                      v-model="filters.functionalAssay"
                      v-model:search="searchFunctionalAssay"
                      :items="functionalAssayOptions"
                      item-title="text"
                      item-value="value"
                      label="Function assay"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingFunctionalAssay"
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
          <v-col :cols="showFilters ? 12 : 12" :md="showFilters ? 10 : 12">
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
                <vxe-column field="datasetId" width="140" sortable>

                  <template #header>
                    Dataset ID
                  </template>
                  
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
                
                <vxe-column field="pmid" title="Study ID" min-width="153" align="center">
                  <template #default="{ row }">
                    <div v-if="row">
                      <a :href="`https://pubmed.ncbi.nlm.nih.gov/${row.pmid}`" target="_blank" style="text-decoration: none;">
                        {{ row.pmid ? row.pmid : 'N/A' }}
                      </a>
                      <v-icon small color="primary">mdi-share</v-icon>
                    </div>
                  </template>
                </vxe-column>

                <vxe-column field="geneName" title="Gene name" min-width="120" align="center">
                  
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

                <vxe-column field="ensemblId" title="Ensembl ID" min-width="160" align="center"></vxe-column>

                <vxe-column field="mutagenesisStrategy" title="Mutagenesis strategy" min-width="200" align="center"></vxe-column>
                
                <vxe-column field="maveTechnique" title="Mave technique" min-width="250" align="center"></vxe-column>

                <vxe-column field="functionalAssay" title="Functional assay" min-width="160" align="center"></vxe-column>

                <vxe-column field="experimentModel" title="Experiment model" min-width="150" align="center"></vxe-column>

                <vxe-column field="phenotype" title="Phenotype" min-width="400" align="center"></vxe-column>

                <vxe-column field="varNum" title="#Variants" min-width="120" align="center" sortable></vxe-column>

                <vxe-column field="aaNum" title="#Amino acids" min-width="150" align="center" sortable></vxe-column>

                <vxe-column field="siteNum" title="#Sites" min-width="100" align="center" sortable></vxe-column>

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
    href: '/',
  },
  {
    title: 'Browse',
  },
  {
    title: 'Datasets',
  },
]

// Reactive state for filters
const filters = ref({
  datasetId: null,
  functionalAssay: null,
  geneName: null,
  ensemblId: null,
  mutagenesisStrategy: null,
})


// Reactive state for autocomplete options
const datasetIdOptions = ref([])
const geneNameOptions = ref([])
const ensemblIdOptions = ref([])
const maveTechniqueOptions = ref([])
const functionalAssayOptions = ref([])

// Reactive state for search inputs
const searchDatasetId = ref(null)
const searchGeneName = ref(null)
const searchEnsemblId = ref(null)
const searchMaveTechnique = ref(null)
const searchFunctionalAssay = ref(null)

// Loading states for autocomplete fields
const loadingDatasetId = ref(false)
const loadingGeneName = ref(false)
const loadingEnsemblId = ref(false)
const loadingMaveTechnique = ref(false)
const loadingFunctionalAssay = ref(false)

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

// Computed properties for table columns
const debouncedFetchDatasetId = debounce(fetchDatasetIdOptions, 300)
const debouncedFetchGeneName = debounce(fetchGeneNameOptions, 300)
const debouncedFetchEnsemblId = debounce(fetchEnsemblIdOptions, 300)
const debouncedFetchFunctionalAssay = debounce(fetchFunctionalAssayOptions, 300)
const debouncedFetchMaveTechnique = debounce(fetchMaveTechniqueOptions, 300)

async function fetchDatasetIdOptions(query = '') {
  try {
    loadingDatasetId.value = true;
    const response = await axios.get('/clinmave/api/select/dataset', {
      params: { datasetId: !query ? '' : query },
    });
    datasetIdOptions.value = response.data.map(item => ({
      text: `${item.datasetId}`,
      value: item.datasetId
    }));
  } catch (error) {
    VxeUI.message.error('Failed to load dataset IDs');
    datasetIdOptions.value = [];
  } finally {
    loadingDatasetId.value = false;
  }
}

async function fetchGeneNameOptions(query = '') {
  try {
    loadingGeneName.value = true;
    const response = await axios.get('/clinmave/api/select/dataset', {
      params: { geneName: !query ? '' : query },
    });
    geneNameOptions.value = response.data.map(item => ({
      text: `${item.geneName} (#Datasets: ${item.count})`,
      value: item.geneName
    }));
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
    const response = await axios.get('/clinmave/api/select/dataset', {
      params: { ensemblId: !query ? '' : query },
    });
    ensemblIdOptions.value = response.data.map(item => ({
      text: `${item.ensemblId}`,
      value: item.ensemblId
    }));
  } catch (error) {
    VxeUI.message.error('Failed to load Ensembl IDs');
    ensemblIdOptions.value = [];
  } finally {
    loadingEnsemblId.value = false;
  }
}

async function fetchFunctionalAssayOptions(query = '') {
  try {
    loadingFunctionalAssay.value = true;
    const response = await axios.get('/clinmave/api/select/dataset', {
      params: { functionalAssay: !query ? '' : query },
    });
    functionalAssayOptions.value = response.data.map(item => ({
      text: `${item.functionalAssay} (#Datasets: ${item.count})`,
      value: item.functionalAssay
    }));
  } catch (error) {
    VxeUI.message.error('Failed to load function assay IDs');
    functionalAssayOptions.value = [];
  } finally {
    loadingFunctionalAssay.value = false;
  }
}

async function fetchMaveTechniqueOptions(query = '') {
  try {
    loadingMaveTechnique.value = true;
    const response = await axios.get('/clinmave/api/select/dataset', {
      params: { maveTechnique: !query ? '' : query },
    });
    maveTechniqueOptions.value = response.data.map(item => ({
      text: `${item.maveTechnique} (#Datasets: ${item.count})`,
      value: item.maveTechnique
    }));
  } catch (error) {
    VxeUI.message.error('Failed to load dbSNP IDs');
    maveTechniqueOptions.value = [];
  } finally {
    loadingMaveTechnique.value = false;
  }
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
    const response = await axios.get('/clinmave/api/fetch/table/dataset', { params });
    
    // Verify response structure
    tableData.value = response.data.data || [];
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
  searchDatasetId.value = null;
  searchGeneName.value = null;
  searchEnsemblId.value = null;
  searchMaveTechnique.value = null;
  searchFunctionalAssay.value = null;

  filters.value = { 
    datasetId: null,
    geneName: null, 
    ensemblId: null,
    maveTechnique: null,
    functionalAssay: null
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
    
    sortParams.value = {
      field: field && field !== 'null' ? field : 'id',
      order: order || 'asc'
    };
  }
  
  currentPage.value = 1;
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
  
  return '#2196F3'; 
};

// Watch pagination parameters
watch([currentPage, pageSize], () => {
  console.log('[Watch] Page or size changed:', currentPage.value, pageSize.value)
  loadData()
})

// Initialize
onMounted(() => {
  debouncedFetchDatasetId();
  debouncedFetchGeneName();
  debouncedFetchEnsemblId();
  debouncedFetchFunctionalAssay();
  debouncedFetchMaveTechnique();
  loadData();
  const $table = tableRef.value
  const $toolbar = toolbarRef.value
  if ($table && $toolbar) {
    $table.connect($toolbar)
  }
})

</script>
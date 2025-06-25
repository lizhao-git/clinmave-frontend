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
                      v-model="filters.dbsnpId"
                      v-model:search="searchDbsnpId"
                      :items="dbsnpIdOptions"
                      label="dbSNP ID"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingDbsnpId"
                    >
                    </v-autocomplete>
                  </v-col>
                  
                  <v-col cols="12">
                    <v-autocomplete
                      v-model="filters.geneName"
                      v-model:search="searchGeneName"
                      :items="geneNameOptions"
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
                      v-model="filters.transcriptId"
                      v-model:search="searchTranscriptId"
                      :items="transcriptIdOptions"
                      label="Transcript ID"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingTranscriptId"
                    >
                    </v-autocomplete>
                  </v-col>

                  <v-col cols="12">
                    <v-autocomplete
                      v-model="filters.mutagenesisStrategy"
                      v-model:search="searchMutagenesisStrategy"
                      :items="mutagenesisStrategyOptions"
                      label="Mutagenesis strategy"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingMutagenesisStrategy"
                    >
                    </v-autocomplete>
                  </v-col>

                  <v-col cols="12">
                    <v-autocomplete
                      v-model="filters.molecularConsequence"
                      v-model:search="searchMolecularConsequence"
                      :items="molecularConsequenceOptions"
                      label="Molecular consequence"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingMolecularConsequence"
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
                <vxe-column field="identifier" width="450" sortable>

                  <template #header>
                    Identifier
                  </template>
                  
                  <template #default="{ row }">
                    <a 
                      v-if="row.identifier" 
                      :href="`/clinmave/browse/variant/${encodeURIComponent(row.identifier)}`" 
                      target="_blank"
                      style="text-decoration: none;"
                    >
                      {{ row.identifier }}
                    </a>
                    <span v-else>-</span>
                  </template>

                </vxe-column>

                <vxe-column field="position" title="Position" min-width="180">
                  <template #default="{ row }">
                    <a v-if="row" :href="row.ucscHg38" target="_blank" style="text-decoration: none;">
                      {{ row.chr && row.pos ? `${row.chr}:${row.pos}` : 'N/A' }}
                      <v-icon small color="blue">mdi-share</v-icon>
                    </a>
                  </template>
                </vxe-column>

                <vxe-column field="refalt" title="Ref/Alt" min-width="100">
                  <template #default="{ row }">
                    {{ row.ref && row.alt ? `${row.ref}:${row.alt}` : 'N/A' }}
                  </template>
                </vxe-column>

                <vxe-column field="dbsnpId" title="dbSNP ID" min-width="140" sortable>
                   <template #default="{ row }">
                    <div v-if="row">
                      <span v-if="!row.dbsnpId || row.dbsnpId === 'NA'">-</span>
                      <a v-else :href="row.dbsnpLink" target="_blank" style="text-decoration: none;">
                        {{ row.dbsnpId }}
                        <v-icon small color="blue">mdi-share</v-icon>
                      </a>
                    </div>
                  </template>
                </vxe-column>

                <vxe-column field="geneName" title="Gene name" min-width="100" align="center">
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

                <vxe-column field="molecularConsequence" title="Molecular consequence" min-width="220" align="center" sortable>
                  <template #default="{ row }">
                    <v-chip 
                      v-if="row.molecularConsequence"
                      small
                      dark
                      :color="getMolecularConsequenceColor(row.molecularConsequence)"
                    >
                      {{ row.molecularConsequence }}
                    </v-chip>
                    <span v-else>
                      -
                    </span>
                  </template>
                </vxe-column>
                <vxe-column field="mutagenesisStrategy" title="Mutagenesis strategy" min-width="200" align="center"></vxe-column>
                
                <vxe-column field="pmid" title="Publication" min-width="153" align="center">
                  <template #default="{ row }">
                    <div v-if="row">
                      <a :href="`https://pubmed.ncbi.nlm.nih.gov/${row.pmid}`" target="_blank" style="text-decoration: none;">
                        {{ row.pmid ? row.pmid : 'N/A' }}
                      </a>
                      <v-icon small color="primary">mdi-share</v-icon>
                    </div>
                  </template>
                </vxe-column>
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
    disabled: false,
  },
  {
    title: 'Browse',
    disabled: false,
  },
  {
    title: 'Variants',
    disabled: false,
  },
]

// Reactive state for filters
const filters = ref({
  dbsnpId: null,
  molecularConsequence: null,
  geneName: null,
  transcriptId: null,
  mutagenesisStrategy: null,
})


// Reactive state for autocomplete options
const dbsnpIdOptions = ref([])
const geneNameOptions = ref([])
const transcriptIdOptions = ref([])
const mutagenesisStrategyOptions = ref([])
const molecularConsequenceOptions = ref([])

// Reactive state for search inputs
const searchDbsnpId = ref(null)
const searchGeneName = ref(null)
const searchTranscriptId = ref(null)
const searchMutagenesisStrategy = ref(null)
const searchMolecularConsequence = ref(null)

// Loading states for autocomplete fields
const loadingDbsnpId = ref(false)
const loadingGeneName = ref(false)
const loadingTranscriptId = ref(false)
const loadingMutagenesisStrategy = ref(false)
const loadingMolecularConsequence = ref(false)

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

const debouncedFetchDbsnpId = debounce(fetchDbsnpIdOptions, 300)
const debouncedFetchGeneName = debounce(fetchGeneNameOptions, 300)
const debouncedFetchTranscriptId = debounce(fetchTranscriptIdOptions, 300)
const debouncedFetchMolecularConsequence = debounce(fetchMolecularConsequenceOptions, 300)
const debouncedFetchMutagenesisStrategy = debounce(fetchMutagenesisStrategyOptions, 300)

// Debounced fetch functions for autocomplete options
async function fetchDbsnpIdOptions(query = '') {
  try {
    loadingDbsnpId.value = true;
    const response = await axios.get('/clinmave/api/select/variant', {
      params: { dbsnpId: !query ? '' : query },
    });
    dbsnpIdOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load dbSNP IDs');
    dbsnpIdOptions.value = [];
  } finally {
    loadingDbsnpId.value = false;
  }
}

async function fetchGeneNameOptions(query = '') {
  try {
    loadingGeneName.value = true;
    const response = await axios.get('/clinmave/api/select/variant', {
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

async function fetchTranscriptIdOptions(query = '') {
  try {
    loadingTranscriptId.value = true;
    const response = await axios.get('/clinmave/api/select/variant', {
      params: { transcriptId: !query ? '' : query },
    });
    transcriptIdOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load dbSNP IDs');
    transcriptIdOptions.value = [];
  } finally {
    loadingTranscriptId.value = false;
  }
}

async function fetchMolecularConsequenceOptions(query = '') {
  try {
    loadingMolecularConsequence.value = true;
    const response = await axios.get('/clinmave/api/select/variant', {
      params: { molecularConsequence: !query ? '' : query },
    });
    molecularConsequenceOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load dbSNP IDs');
    molecularConsequenceOptions.value = [];
  } finally {
    loadingMolecularConsequence.value = false;
  }
}

async function fetchMutagenesisStrategyOptions(query = '') {
  try {
    loadingMutagenesisStrategy.value = true;
    const response = await axios.get('/clinmave/api/select/variant', {
      params: { mutagenesisStrategy: !query ? '' : query },
    });
    mutagenesisStrategyOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load dbSNP IDs');
    mutagenesisStrategyOptions.value = [];
  } finally {
    loadingMutagenesisStrategy.value = false;
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
    const response = await axios.get('/clinmave/api/fetch/table/variant', { params });
    
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
  searchDbsnpId.value = null;
  searchGeneName.value = null;
  searchTranscriptId.value = null;
  searchMutagenesisStrategy.value = null;
  searchMolecularConsequence.value = null;

  filters.value = { 
    dbsnpId: null, 
    geneName: null, 
    transcriptId: null,
    mutagenesisStrategy: null,
    molecularConsequence: null
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
      sortParams.value = validSorts; // 存储多列排序
    } else {
      sortParams.value = { field: 'id', order: 'asc' }; // 默认排序
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

const getMolecularConsequenceColor = (molecularConsequence) => {
  const colorMap = {
    'Missense': '#E69F00', 
    'Nonsense': '#D55E00', 
    'Synonymous': '#009E73', 
    'Splice site': '#CC79A7',
    'Stop_lost': '#882255',
    'Intron': '#999999',
    'UTR': '#56B4E9',
    'Frameshift': '#CC0000',
    'ncRNA': '#F0E442',
    'Upstream': '#0072B2',
    'Intergenic': '#AAAAAA',
  };
  
  const normalized = molecularConsequence.toLowerCase();

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

// Watch search inputs for autocomplete
watch(searchDbsnpId, (newVal) => {
  console.log('[Watch] searchDbsnpId:', newVal);
  debouncedFetchDbsnpId(newVal)
})

// Initialize
onMounted(() => {
  debouncedFetchDbsnpId();
  debouncedFetchGeneName();
  debouncedFetchTranscriptId();
  debouncedFetchMolecularConsequence();
  debouncedFetchMutagenesisStrategy();
  loadData();
  const $table = tableRef.value
  const $toolbar = toolbarRef.value
  if ($table && $toolbar) {
    $table.connect($toolbar)
  }
})

</script>
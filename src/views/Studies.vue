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
                      v-model="filters.pmid"
                      v-model:search="searchPmid"
                      :items="pmidOptions"
                      label="PMID"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingPmid"
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
                      v-model="filters.datasetId"
                      v-model:search="searchDatasetId"
                      :items="datasetIdOptions"
                      label="Dataset ID"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingDatasetId"
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

                <vxe-column field="pmid" title="PMID" min-width="154" align="center">
                  <template #default="{ row }">
                    <div v-if="row">
                      <a :href="`https://pubmed.ncbi.nlm.nih.gov/${row.pmid}`" target="_blank" style="text-decoration: none;">
                        {{ row.pmid ? row.pmid : 'N/A' }}
                      </a>
                      <v-icon small color="primary">mdi-share</v-icon>
                    </div>
                  </template>
                </vxe-column>

                <vxe-column field="title" title="Title" min-width="400">
                  <template #default="{ row }">
                    {{ row.title }}
                  </template>
                </vxe-column>

                <vxe-column field="journal" title="Journal" min-width="200" align="center"></vxe-column>

                <vxe-column field="year" title="Year" min-width="100" align="center"></vxe-column>

                <vxe-column field="geneName" title="Gene" min-width="400" align="center">
                  <template #default="{ row }">
                    <span
                      v-for="(id, idx) in splitDatasetIds(row.geneName).slice(0, row.geneShowCount || 10)"
                      :key="idx"
                    >
                      <v-chip
                        color="primary"
                        variant="outlined"
                        class="mr-2 mb-1"
                      >
                        <a :href="'/clinmave/browse/gene/' + id" target="_blank" style="color: #1976d2;font-style: italic;text-decoration: none">{{ id }}</a>
                      </v-chip>
                    </span>

                    <div v-if="splitDatasetIds(row.geneName).length > 5" class="mt-1">
                      <v-btn
                        small
                        text
                        density="compact"
                        color="primary"
                        class="mr-1"
                        @click="expandMore(row, 10)"
                        v-if="row.geneShowCount < splitDatasetIds(row.geneName).length"
                      >
                        +10
                      </v-btn>

                      <v-btn
                        small
                        text
                        color="primary"
                        density="compact"
                        class="mr-1"
                        @click="expandAll(row)"
                        v-if="row.geneShowCount < splitDatasetIds(row.geneName).length"
                      >
                        All
                      </v-btn>

                      <v-btn
                        small
                        text
                        density="compact"
                        color="primary"
                        class="mr-1"
                        @click="collapseMore(row, 10)"
                        v-if="row.geneShowCount > 5"
                      >
                        -10
                      </v-btn>

                      <v-btn
                        small
                        text
                        density="compact"
                        color="primary"
                        @click="collapseAll(row)"
                        v-if="row.geneShowCount > 5"
                      >
                        Collapse
                      </v-btn>
                    </div>

                  </template>
                </vxe-column>

                <vxe-column field="numDataset" title="#Datasets" min-width="100" align="center"></vxe-column>

                <vxe-column field="datasetInfo" title="Dataset ID" min-width="400" align="center">
                  <template #default="{ row }">
                    <span
                      v-for="(id, idx) in splitDatasetIds(row.datasetInfo).slice(0, row.datasetShowCount || 5)"
                      :key="idx"
                    >
                      <v-chip 
                        color="primary"
                        variant="outlined" 
                        class="mr-2 mb-1"
                      >
                        <a
                          :href="'/clinmave/browse/dataset/' + id"
                          target="_blank"
                          style="color: #1976d2; text-decoration: none"
                        >
                          {{ id }}
                        </a>
                      </v-chip>
                    </span>
                    <div v-if="splitDatasetIds(row.datasetInfo).length > 5" class="mt-1">
                      <v-btn
                        small
                        text
                        density="compact"
                        color="primary"
                        class="mr-1"
                        @click="expandMoreDataset(row, 10)"
                        v-if="row.datasetShowCount < splitDatasetIds(row.datasetInfo).length"
                      >
                        +10
                      </v-btn>

                      <v-btn
                        small
                        text
                        color="primary"
                        density="compact"
                        class="mr-1"
                        @click="expandAllDataset(row)"
                        v-if="row.datasetShowCount < splitDatasetIds(row.datasetInfo).length"
                      >
                        All
                      </v-btn>

                      <v-btn
                        small
                        text
                        density="compact"
                        color="primary"
                        class="mr-1"
                        @click="collapseMoreDataset(row, 10)"
                        v-if="row.datasetShowCount > 5"
                      >
                        -10
                      </v-btn>

                      <v-btn
                        small
                        text
                        density="compact"
                        color="primary"
                        @click="collapseAllDataset(row)"
                        v-if="row.datasetShowCount > 5"
                      >
                        Collapse
                      </v-btn>
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
    href: '/',
  },
  {
    title: 'Browse',
  },
  {
    title: 'Studies',
  },
]

// Reactive state for filters
const filters = ref({
  pmid: null,
  geneName: null,
  datasetId: null,
})


// Reactive state for autocomplete options
const pmidOptions = ref([])
const geneNameOptions = ref([])
const datasetIdOptions = ref([])

// Reactive state for search inputs
const searchPmid = ref(null)
const searchGeneName = ref(null)
const searchDatasetId = ref(null)

// Loading states for autocomplete fields
const loadingPmid = ref(false)
const loadingGeneName = ref(false)
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

const debouncedFetchPmid = debounce(fetchPmidOptions, 300)
const debouncedFetchGeneName = debounce(fetchGeneNameOptions, 300)
const debouncedFetchDatasetId = debounce(fetchDatasetIdOptions, 300)

// Debounced fetch functions for autocomplete options
async function fetchPmidOptions(query = '') {
  try {
    loadingPmid.value = true;
    const response = await axios.get('/clinmave/api/select/studies', {
      params: { pmid: !query ? '' : query },
    });
    pmidOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load PMIDs');
    pmidOptions.value = [];
  } finally {
    loadingPmid.value = false;
  }
}

async function fetchGeneNameOptions(query = '') {
  try {
    loadingGeneName.value = true;
    const response = await axios.get('/clinmave/api/select/studies', {
      params: { geneName: !query ? '' : query },
    });
    geneNameOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load Titles');
    geneNameOptions.value = [];
  } finally {
    loadingGeneName.value = false;
  }
}

async function fetchDatasetIdOptions(query = '') {
  try {
    loadingDatasetId.value = true;
    const response = await axios.get('/clinmave/api/select/studies', {
      params: { datasetId: !query ? '' : query },
    });
    datasetIdOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load Titles');
    datasetIdOptions.value = [];
  } finally {
    loadingDatasetId.value = false;
  }
}

function splitDatasetIds(datasetIdStr) {
  if (!datasetIdStr) return [];
  return datasetIdStr.split(';').map(s => s.trim()).filter(Boolean);
}

function expandMore(row, increment = 10) {
  if (!row.geneShowCount) {
    row.geneShowCount = 10;
  }
  row.geneShowCount += increment;
}

function expandAll(row) {
  row.geneShowCount = splitDatasetIds(row.geneName).length;
}

function collapseMore(row, count = 10) {
  if (!row.geneShowCount) {
    row.geneShowCount = 5;
  }
  row.geneShowCount = Math.max(5, row.geneShowCount - count);
}

function collapseAll(row) {
  row.geneShowCount = 5;
}

function expandMoreDataset(row, count = 10) {
  if (!row.datasetShowCount) {
    row.datasetShowCount = 5;
  }
  row.datasetShowCount += count;
}

function expandAllDataset(row) {
  row.datasetShowCount = splitDatasetIds(row.datasetInfo).length;
}

function collapseMoreDataset(row, count = 10) {
  if (!row.datasetShowCount) {
    row.datasetShowCount = 5;
  }
  row.datasetShowCount = Math.max(5, row.datasetShowCount - count);
}

function collapseAllDataset(row) {
  row.datasetShowCount = 5;
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
    const response = await axios.get('/clinmave/api/fetch/table/studysummary', { params });
    console.log('[API Response]', response.data); // Debug API response
    // Verify response structure
    tableData.value = (response.data.data || []).map(row => ({
      ...row,
      geneShowCount: 5,
      datasetShowCount: 5,
    }));
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
  searchPmid.value = null;
  searchGeneName.value = null;
  searchDatasetId.value = null;

  filters.value = { 
    pmid: null, 
    geneName: null, 
    datasetId: null,
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

// Watch pagination parameters
watch([currentPage, pageSize], () => {
  loadData()
})


// Initialize
onMounted(() => {
  debouncedFetchPmid();
  debouncedFetchGeneName();
  debouncedFetchDatasetId();
  loadData();
  const $table = tableRef.value
  const $toolbar = toolbarRef.value
  if ($table && $toolbar) {
    $table.connect($toolbar)
  }
})

</script>
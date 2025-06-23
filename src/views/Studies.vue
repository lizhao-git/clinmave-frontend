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
                      v-model="filters.title"
                      v-model:search="searchTitle"
                      :items="titleOptions"
                      label="Title"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingTitle"
                    >
                    </v-autocomplete>
                  </v-col>

                  <v-col cols="12">
                    <v-autocomplete
                      v-model="filters.journal"
                      v-model:search="searchJournal"
                      :items="journalOptions"
                      label="Journal"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingJournal"
                    >
                    </v-autocomplete>
                  </v-col>

                  <v-col cols="12">
                    <v-autocomplete
                      v-model="filters.year"
                      v-model:search="searchYear"
                      :items="yearOptions"
                      label="Year"
                      variant="outlined"
                      density="compact"
                      clearable
                      :loading="loadingYear"
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
                        class="mr-2"
                      >
                        <a :href="'/browse/gene/' + id" target="_blank" style="color: #1976d2;">{{ id }}</a>
                      </v-chip>
                    </span>

                    <div v-if="splitDatasetIds(row.geneName).length > (row.geneShowCount || 10)" class="mt-1">
                      <v-btn
                        small
                        text
                        color="primary"
                        @click="expandMore(row, 10)"
                        class="mr-1"
                      >
                        +10
                      </v-btn>
                      <v-btn
                        small
                        text
                        color="primary"
                        @click="expandAll(row)"
                      >
                        All
                      </v-btn>
                    </div>

                  </template>
                </vxe-column>

                <vxe-column field="numDataset" title="#Datasets" min-width="100" align="center"></vxe-column>

                <vxe-column field="datasetInfo" title="Dataset ID" min-width="400" align="center">
                  <template #default="{ row }">
                    <span v-for="(id, idx) in splitDatasetIds(row.datasetInfo)" :key="idx">
                      <v-chip 
                        color="primary"
                        variant="outlined" 
                        class="mr-2"
                      >
                        <a :href="'/browse/dataset/' + id" target="_blank" style="color: #1976d2;">{{ id }}</a>
                      </v-chip>
                    </span>
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
    title: 'Studies',
    disabled: false,
  },
]

// Reactive state for filters
const filters = ref({
  pmid: null,
  title: null,
  journal: null,
  year: null,
})


// Reactive state for autocomplete options
const pmidOptions = ref([])
const titleOptions = ref([])
const journalOptions = ref([])
const yearOptions = ref([])

// Reactive state for search inputs
const searchPmid = ref(null)
const searchTitle = ref(null)
const searchJournal = ref(null)
const searchYear = ref(null)

// Loading states for autocomplete fields
const loadingPmid = ref(false)
const loadingTitle = ref(false)
const loadingJournal = ref(false)
const loadingYear = ref(false)

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
const debouncedFetchTitle = debounce(fetchTitleOptions, 300)
const debouncedFetchJournal = debounce(fetchJournalOptions, 300)
const debouncedFetchYear = debounce(fetchYearOptions, 300)

// Debounced fetch functions for autocomplete options
async function fetchPmidOptions(query = '') {
  try {
    loadingPmid.value = true;
    const response = await axios.get('/api/fugedb/select/studies', {
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

async function fetchTitleOptions(query = '') {
  try {
    loadingTitle.value = true;
    const response = await axios.get('/api/fugedb/select/studies', {
      params: { title: !query ? '' : query },
    });
    titleOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load Titles');
    titleOptions.value = [];
  } finally {
    loadingTitle.value = false;
  }
}

async function fetchJournalOptions(query = '') {
  try {
    loadingJournal.value = true;
    const response = await axios.get('/api/fugedb/select/studies', {
      params: { journal: !query ? '' : query },
    });
    journalOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load Journals');
    journalOptions.value = [];
  } finally {
    loadingJournal.value = false;
  }
}

async function fetchYearOptions(query = '') {
  try {
    loadingYear.value = true;
    const response = await axios.get('/api/fugedb/select/studies', {
      params: { year: !query ? '' : query },
    });
    yearOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load Years');
    yearOptions.value = [];
  } finally {
    loadingYear.value = false;
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
    const response = await axios.get('/api/fugedb/fetch/table/studysummary', { params });
    console.log('[API Response]', response.data); // Debug API response
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
  searchPmid.value = null;
  searchTitle.value = null;
  searchJournal.value = null;
  searchYear.value = null;

  filters.value = { 
    pmid: null, 
    title: null, 
    journal: null,
    year: null
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

// Watch search inputs for autocomplete
watch(searchPmid, (newVal) => {
  debouncedFetchPmid(newVal)
})

// Initialize
onMounted(() => {
  debouncedFetchPmid();
  debouncedFetchTitle();
  debouncedFetchJournal();
  debouncedFetchYear();
  loadData();
  const $table = tableRef.value
  const $toolbar = toolbarRef.value
  if ($table && $toolbar) {
    $table.connect($toolbar)
  }
})

</script>
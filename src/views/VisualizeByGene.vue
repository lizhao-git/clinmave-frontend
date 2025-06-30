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
        <!-- Filter Panel 左侧筛选栏，始终显示 -->
        <v-col cols="12" md="2" >
          <v-sheet class="py-6 px-3">
            <v-row>
              <v-col cols="12">
                <div class="text-body-1 font-weight-bold">Filters</div>
                <!-- 这里去掉了切换按钮，左侧筛选栏固定显示 -->
              </v-col>
            </v-row>

            <v-sheet>
              <v-row dense>
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
                    v-model="filters.consequenceClass"
                    v-model:search="searchConsequenceClass"
                    :items="consequenceClassOptions"
                    label="Consequence class"
                    variant="outlined"
                    density="compact"
                    clearable
                    :loading="loadingConsequenceClass"
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

        <!-- Table Content 右侧内容：根据showResults显示/隐藏 -->
        <v-col :cols="showResults ? 12 : 0" :md="showResults ? 10 : 0" v-if="showResults">
          <v-sheet class="pa-3">

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

              <vxe-column field="mutagenesisStrategy" title="Mutagenesis strategy" min-width="200" align="center"></vxe-column>
              
              <vxe-column field="functionAssay" title="Function Assay" min-width="160" align="center"></vxe-column>

              <vxe-column field="experimentModel" title="Experiment Model" min-width="150" align="center"></vxe-column>

              <vxe-column field="phenotype" title="Phenotype" min-width="400" align="center"></vxe-column>

              <vxe-column field="varNum" title="#Variants" min-width="120" align="center" sortable></vxe-column>

              <vxe-column field="aaNum" title="#Amino Acids" min-width="150" align="center" sortable></vxe-column>

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
          <v-divider></v-divider>
          <v-sheet class="pl-4" style="min-height: 320px; position: relative;">
            <template v-if="oncoprintLoading">
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="48"
                ></v-progress-circular>
                <div style="margin-top: 8px; color: #666;">Loading Oncoprint data...</div>
              </div>
            </template>

            <template v-else-if="hasOncoprintData">
              <Oncoprint
                :gene-info="oncoprintMap.geneInfo"
                :domains="oncoprintMap.domains"
                :oncoprint-data="oncoprintMap.oncoprintData"
                height="400"
              />
            </template>

            <template v-else>
              <div class="text-center" style="margin-top: 100px; color: #999;">
                No Oncoprint data available.
              </div>
            </template>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import axios from 'axios'
import { debounce } from 'lodash'

import VxeUI from 'vxe-pc-ui';
import 'vxe-pc-ui/lib/style.css';

import {VXETable} from 'vxe-table'
import 'vxe-table/lib/style.css'

import Oncoprint from '@/components/Visualization/Oncoprint.vue'

const breadcrumbs = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'Visualize',
  },
  {
    title: 'Gene',
  },
]

// Filters 保持不变
const filters = ref({
  geneName: null,
  consequenceClass: null,
})

const geneNameOptions = ref([])
const searchGeneName = ref(null)
const loadingGeneName = ref(false)

const consequenceClassOptions = ref([]);
const searchConsequenceClass = ref(null)
const loadingConsequenceClass = ref(false);

// 新增控制右侧结果显示的变量
const showResults = ref(false);

const oncoprintMap = ref({})
const oncoprintLoading = ref(false)

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
const debouncedFetchConsequenceClass = debounce(fetchConsequenceClassOptions, 300)
const debouncedFetchGeneStructure = debounce(fetchGeneStructure, 300)

const hasOncoprintData = computed(() => {
  return oncoprintMap.value &&
         typeof oncoprintMap.value === 'object' &&
         oncoprintMap.value.geneInfo &&
         Array.isArray(oncoprintMap.value.domains) &&
         Array.isArray(oncoprintMap.value.oncoprintData)
});

async function fetchGeneNameOptions(query = '') {
  try {
    loadingGeneName.value = true;
    const response = await axios.get('/clinmave/api/select/genes', {
      params: { geneName: !query ? '' : query },
    });
    geneNameOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load gene name options');
    geneNameOptions.value = [];
  } finally {
    loadingGeneName.value = false;
  }
}

async function fetchConsequenceClassOptions(query = '') {
  try {
    loadingConsequenceClass.value = true;
    const response = await axios.get('/clinmave/api/select/aminosite', {
      params: { consequenceClass: !query ? '' : query },
    });
    consequenceClassOptions.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load gene name options');
    consequenceClassOptions.value = [];
  } finally {
    loadingConsequenceClass.value = false;
  }
}

async function fetchGeneStructure(query = '') {
  oncoprintLoading.value = true;
  try {
    loadingGeneName.value = true;
    const response = await axios.get('/clinmave/api/visualize/bygene/oncoprint', {
      params: {
        geneName: filters.value.geneName,
        consequenceClass: filters.value.consequenceClass || ''
      },
    });
    oncoprintMap.value = response.data || {};
    console.log('[Oncoprint Map]', oncoprintMap.value);
  } catch (error) {
    VxeUI.message.error('Failed to load oncoprint data');
    oncoprintMap.value = {};
  } finally {
    loadingGeneName.value = false;
    oncoprintLoading.value = false;
  }
}

const loadData = async () => {
  loading.value = true;
  try {
    let sort;

    if (Array.isArray(sortParams.value)) {
      sort = sortParams.value
        .filter(param => param.field && param.order)
        .map(param => `${param.field},${param.order}`)
        .join(',');
    } else {
      sort = sortParams.value.field && sortParams.value.order
        ? `${sortParams.value.field},${sortParams.value.order}`
        : 'id,asc';
    }

    const params = {
      page: currentPage.value - 1,
      size: pageSize.value,
      sort: sort || undefined,
      ...filters.value
    };

    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    const response = await axios.get('/clinmave/api/fetch/table/dataset', { params });
    tableData.value = response.data.data || [];
    totalRecords.value = response.data.totalRows || 0;
  } catch (error) {
    console.error('[API Error]', error);
    tableData.value = [];
    totalRecords.value = 0;
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  currentPage.value = 1;
  loadData();
  debouncedFetchGeneStructure(filters.value.geneName);
  debouncedFetchGeneName();
  debouncedFetchConsequenceClass();
  showResults.value = true; // 显示右侧表格和oncoprint
}

const resetFilters = () => {
  searchGeneName.value = null;
  searchConsequenceClass.value = null;
  filters.value = { 
    geneName: null, 
    consequenceClass: null
  };
  
  currentPage.value = 1;

  loadData();
  showResults.value = false; // 隐藏右侧表格和oncoprint
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
  
  return '#2196F3'; // Default blue
};

watch([currentPage, pageSize], () => {
  loadData()
})

onMounted(() => {
  debouncedFetchGeneName();
  debouncedFetchConsequenceClass();
  // 这里不自动加载表格，表格和oncoprint初始隐藏
  const $table = tableRef.value
  const $toolbar = toolbarRef.value
  if ($table && $toolbar) {
    $table.connect($toolbar)
  }
})
</script>

<style scoped>
/* 可根据需求添加样式 */
</style>

<template>
  <v-main>
    <v-container fluid class="mt-4">
      <v-row>
        <v-col cols="12">
          <v-card flat>
            <v-breadcrumbs :items="breadcrumbs">
              <template v-slot:item="{ item }">
                <v-breadcrumbs-item
                  :disabled="item.disabled"
                  :href="item.href"
                >
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
                    :href="`/browse/dataset/${encodeURIComponent(row.datasetId)}`" 
                    target="_blank"
                    style="text-decoration: none;"
                  >
                    {{ row.datasetId }}
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

          <v-sheet style="min-height: 300px; position: relative;">
            <v-row>
              <v-col cols="12" md="4" sm="12">
                <template v-if="clinVarBinLoading">
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
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
                  />
                </template>

                <template v-else>
                  <div class="text-center" style="margin-top: 100px; color: #999;">
                    No ClinVar data available.
                  </div>
                </template>
              </v-col>

              <v-col cols="12" md="4" sm="12">
                <template v-if="scatterLoading">
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
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
                  />
                </template>

                <template v-else>
                  <div class="text-center" style="margin-top: 100px; color: #999;">
                    No Scatter2d data available.
                  </div>
                </template>
              </v-col>

              <v-col cols="12" md="4" sm="12">
                <template v-if="clinVarBinLoading">
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
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

import Scatter2d from '@/components/Visualization/Scatter2d.vue'
import ClinVarBin from '@/components/Visualization/ClinVarBin.vue'
import ConsequenceDensity from '@/components/Visualization/ConsequenceDensity.vue'

const breadcrumbs = [
  {
    title: 'Home',
    disabled: false,
  },
  {
    title: 'Visualize',
    disabled: false,
  },
  {
    title: 'Dataset',
    disabled: false,
  },
]

// Filters 保持不变
const filters = ref({
  datasetId: null,
})

const datasetIdOptions = ref([])
const searchDatasetId = ref(null)
const loadingDatasetId = ref(false)

// 新增控制右侧结果显示的变量
const showResults = ref(false);

const oncoprintMap = ref({})
const oncoprintLoading = ref(false)

const scatterArray = ref([])
const scatterLoading = ref(false)

const clinVarBinLoading = ref(false)
const ClinVarBinArray = ref([])

const consequenceDensityLoading = ref(false)
const consequenceDensityArray = ref([])
const consequenceArray = ref([])

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

const debouncedFetchDatasetId = debounce(fetchDatasetIdOptions, 300)
const debouncedFetchClinVarBinData = debounce(fetchClinVarBinData, 300)
const debouncedFetchScatterData = debounce(fetchScatterData, 300)
const debouncedFetchConsequenceDensityData = debounce(fetchConsequenceDensityData, 300)

const hasOncoprintData = computed(() => {
  return oncoprintMap.value &&
         typeof oncoprintMap.value === 'object' &&
         oncoprintMap.value.geneInfo &&
         Array.isArray(oncoprintMap.value.domains) &&
         Array.isArray(oncoprintMap.value.oncoprintData)
});

const hasClinVarBinData = computed(() => {
  return Array.isArray(ClinVarBinArray.value) &&
          ClinVarBinArray.value.length > 0 &&
          ClinVarBinArray.value[0].clvGroupCounts &&
          typeof ClinVarBinArray.value[0].clvGroupCounts === 'object' &&
          Object.keys(ClinVarBinArray.value[0].clvGroupCounts).length > 0;
});

const hasScatterData = computed(() => {
  return scatterArray.value &&
         Array.isArray(scatterArray.value) &&
         scatterArray.value.length > 0 &&
         scatterArray.value[0].af !== undefined &&
         scatterArray.value[0].score !== undefined;
})

const hasConsequenceDensityData = computed(() => {
  return consequenceArray.value &&
         Array.isArray(consequenceArray.value) &&
         consequenceArray.value.length > 0;
})

async function fetchDatasetIdOptions(query = '') {
  try {
    loadingDatasetId.value = true;
    const response = await axios.get('/api/fugedb/select/dataset', {
      params: { datasetId: !query ? '' : query },
    });
    datasetIdOptions.value = response.data.map(item => ({
      text: `${item.datasetId}`,
      value: item.datasetId
    }));
  } catch (error) {
    VxeUI.message.error('Failed to load gene name options');
    datasetIdOptions.value = [];
  } finally {
    loadingDatasetId.value = false;
  }
}

async function fetchScatterData(query = '') {
  scatterLoading.value = true;
  try {
    loadingDatasetId.value = true;
    const response = await axios.get('/api/fugedb/visualize/bydataset/scatter', {
      params: { datasetId: !query ? '' : query },
    });
    scatterArray.value = response.data || [];
    console.log('[Scatter Array]', scatterArray);
  } catch (error) {
    VxeUI.message.error('Failed to load oncoprint data');
    scatterArray.value = []
  } finally {
    loadingDatasetId.value = false;
    scatterLoading.value = false;
  }
}

async function fetchClinVarBinData(query = '') {
  clinVarBinLoading.value = true;
  try {
    loadingDatasetId.value = true;
    const response = await axios.get('/api/fugedb/visualize/bydataset/clinvarbin', {
      params: { datasetId: !query ? '' : query },
    });
    ClinVarBinArray.value = response.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load oncoprint data');
    ClinVarBinArray.value = []
  } finally {
    loadingDatasetId.value = false;
    clinVarBinLoading.value = false;
  }
}

async function fetchConsequenceDensityData(query = '') {
  consequenceDensityLoading.value = true;
  try {
    loadingDatasetId.value = true;
    const response = await axios.get('/api/fugedb/visualize/bydataset/consequencedensity', {
      params: { datasetId: !query ? '' : query },
    });
    consequenceArray.value = response.data || [];
    console.log('[Scatter Array]', consequenceArray);
  } catch (error) {
    VxeUI.message.error('Failed to load oncoprint data');
    consequenceArray.value = []
  } finally {
    loadingDatasetId.value = false;
    consequenceDensityLoading.value = false;
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

    const response = await axios.get('/api/fugedb/fetch/table/dataset', { params });
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
  debouncedFetchClinVarBinData(filters.value.datasetId);
  debouncedFetchScatterData(filters.value.datasetId);
  debouncedFetchConsequenceDensityData(filters.value.datasetId);
  loadData();
  showResults.value = true;
}

const resetFilters = () => {
  searchDatasetId.value = null;

  filters.value = { 
    datasetId: null, 
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
  debouncedFetchDatasetId();
  // 这里不自动加载表格，表格和oncoprint初始隐藏
  const $table = tableRef.value
  const $toolbar = toolbarRef.value
  if ($table && $toolbar) {
    $table.connect($toolbar)
  }
})
</script>

<style scoped>

</style>

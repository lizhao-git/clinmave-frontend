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
        
        <!-- Table Content 右侧内容：根据showResults显示/隐藏 -->
        <v-col :cols="showResults ? 12 : 0" :md="showResults ? 10 : 0" v-if="showResults">
          <!-- <v-banner single-line :sticky="false">
            <div style="font-weight: bold;height: 100%;">Tips:&nbsp;</div>
            (1) Use filters to narrow the datasets table by gene, Mutagenesis strategy, experimental model and phenotype;<br>
            (2) Click the ‘Visualize’ button to:<br>
            <v-icon color="black" size="12" class="dot-icon">mdi-circle</v-icon>View the distribution of MAVE functional scores grouped by molecular consequence/Clinvar classification<br>
            <v-icon color="black" size="12" class="dot-icon">mdi-circle</v-icon>Explore the relationship between population allele frequency (gnomAD) and MAVE functional score.
          </v-banner> -->
          <v-banner single-line :sticky="false" class="banner-tips">
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
          </v-banner>

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
              
              <vxe-column field="datasetId" title="#Visualize" min-width="80" align="center">
                <template #default="{ row }">
                  <v-btn
                    color="primary"
                    variant="compact"
                    icon="mdi-eye"
                    @click="VisualizeClicker(row.datasetId)"
                  ></v-btn>
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

          <v-sheet style="min-height: 300px; position: relative;" v-if="showVisualize">
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
                    :titleFlag="true"
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
                    :titleFlag="true"
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
    href: '/',
  },
  {
    title: 'Visualize',
  },
  {
    title: 'Dataset',
  },
]

// Filters 保持不变
const filters = ref({
  geneName: null,
  mutagenesisStrategy: null,
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

// 新增控制右侧结果显示的变量
const showResults = ref(false);
const showVisualize = ref(false);
const highlightedRowId = ref(null)

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
const pageSize = ref(5)
const totalRecords = ref(0)
const loading = ref(false)
const sortParams = ref({
  field: '',
  order: ''
})

const debouncedFetchGeneName = debounce(fetchGeneNameOptions, 300)
const debouncedFetchMutagenesisStrategy = debounce(fetchMutagenesisStrategyOptions, 300)
const debouncedFetchExperimentModel = debounce(fetchExperimentModelOptions, 300)
const debouncedFetchPhenotype = debounce(fetchPhenotypeOptions, 300)
const debouncedFetchClinVarBinData = debounce(fetchClinVarBinData, 300)
const debouncedFetchScatterData = debounce(fetchScatterData, 300)
const debouncedFetchConsequenceDensityData = debounce(fetchConsequenceDensityData, 300)

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

async function fetchMutagenesisStrategyOptions(query = '') {
  try {
    loadingMutagenesisStrategy.value = true;
    const response = await axios.get('/clinmave/api/select/dataset', {
      params: { mutagenesisStrategy: !query ? '' : query },
    });
    mutagenesisStrategyOptions.value = response.data.map(item => ({
      text: `${item.mutagenesisStrategy} (#Datasets: ${item.count})`,
      value: item.mutagenesisStrategy
    }));
  } catch (error) {
    VxeUI.message.error('Failed to load dbSNP IDs');
    mutagenesisStrategyOptions.value = [];
  } finally {
    loadingMutagenesisStrategy.value = false;
  }
}

async function fetchExperimentModelOptions(query = '') {
  try {
    loadingExperimentModel.value = true;
    const response = await axios.get('/clinmave/api/select/dataset', {
      params: { experimentModel: !query ? '' : query },
    });
    experimentModelOptions.value = response.data.map(item => ({
      text: `${item.experimentModel} (#Datasets: ${item.count})`,
      value: item.experimentModel
    }));
  } catch (error) {
    VxeUI.message.error('Failed to load dbSNP IDs');
    experimentModelOptions.value = [];
  } finally {
    loadingExperimentModel.value = false;
  }
}

async function fetchPhenotypeOptions(query = '') {
  try {
    loadingPhenotype.value = true;
    const response = await axios.get('/clinmave/api/select/dataset', {
      params: { phenotype: !query ? '' : query },
    });
    phenotypeOptions.value = response.data.map(item => ({
      text: `${item.phenotype} (#Datasets: ${item.count})`,
      value: item.phenotype
    }));
  } catch (error) {
    VxeUI.message.error('Failed to load dbSNP IDs');
    phenotypeOptions.value = [];
  } finally {
    loadingPhenotype.value = false;
  }
}

async function fetchScatterData(query = '') {
  scatterLoading.value = true;
  try {
    const response = await axios.get('/clinmave/api/visualize/bydataset/scatter', {
      params: { datasetId: !query ? '' : query },
    });
    scatterArray.value = response.data || [];
    console.log('[Scatter Array]', scatterArray);
  } catch (error) {
    VxeUI.message.error('Failed to load oncoprint data');
    scatterArray.value = []
  } finally {
    scatterLoading.value = false;
  }
}

async function fetchClinVarBinData(query = '') {
  clinVarBinLoading.value = true;
  try {
    const response = await axios.get('/clinmave/api/visualize/bydataset/clinvarbin', {
      params: { datasetId: !query ? '' : query },
    });
    ClinVarBinArray.value = response.data || [];
  } catch (error) {
    VxeUI.message.error('Failed to load oncoprint data');
    ClinVarBinArray.value = []
  } finally {
    clinVarBinLoading.value = false;
  }
}

async function fetchConsequenceDensityData(query = '') {
  consequenceDensityLoading.value = true;
  try {
    const response = await axios.get('/clinmave/api/visualize/bydataset/consequencedensity', {
      params: { datasetId: !query ? '' : query },
    });
    consequenceArray.value = response.data || [];
    console.log('[Scatter Array]', consequenceArray);
  } catch (error) {
    VxeUI.message.error('Failed to load oncoprint data');
    consequenceArray.value = []
  } finally {
    consequenceDensityLoading.value = false;
  }
}

const getRowClassName = ({ row }) => {
  if (row.datasetId === highlightedRowId.value) {
    return 'highlighted-row'
  }
  return ''
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
  showResults.value = true;
  showVisualize.value = false;
}

const VisualizeClicker = (datasetId) => {
  highlightedRowId.value = datasetId  // 设置高亮
  showVisualize.value = true;
  debouncedFetchClinVarBinData(datasetId);
  debouncedFetchScatterData(datasetId);
  debouncedFetchConsequenceDensityData(datasetId);
}

const resetFilters = () => {
  showVisualize.value = false;
  showResults.value = false; // 隐藏右侧表格和oncoprint
  searchDatasetId.value = null;
  searchGeneName.value = null;
  searchMutagenesisStrategy.value = null;
  searchExperimentModel.value = null;
  searchPhenotype.value = null;
  
  const filters = ref({
    geneName: null,
    mutagenesisStrategy: null,
    experimentModel: null,
    phenotype: null,
  })
  
  currentPage.value = 1;

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
  debouncedFetchMutagenesisStrategy();
  debouncedFetchExperimentModel();
  debouncedFetchPhenotype();
  // 这里不自动加载表格，表格和oncoprint初始隐藏
  const $table = tableRef.value
  const $toolbar = toolbarRef.value
  if ($table && $toolbar) {
    $table.connect($toolbar)
  }
})
</script>

<style scoped>
.banner-tips {
  align-items: flex-start; /* 保持内容顶部对齐 */
}
.dot-icon {
  vertical-align: middle; /* 图标垂直居中 */
}
</style>

<style>
/* 全局样式，覆盖 vxe-table 的行 class */
.highlighted-row {
  background-color: #E3F2FD !important;
}
</style>
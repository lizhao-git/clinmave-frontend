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

              <vxe-column field="phenotype" title="Phenotype" min-width="400" align="center"></vxe-column>

              <vxe-column field="varNum" title="#Variants" min-width="120" align="center" sortable></vxe-column>

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
              <v-col cols="12" md="3" sm="12">
                <template v-if="RocCurveLoading">
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      size="48"
                    ></v-progress-circular>
                    <div style="margin-top: 8px; color: #666;">Loading Oncoprint data...</div>
                  </div>
                </template>

                <template v-else-if="hasRocCurveData">
                  <RocCurve
                    :scores="RocCurveMap.score"
                    :tags="RocCurveMap.clvGroup"
                  />
                </template>

                <template v-else>
                  <div class="text-center" style="margin-top: 100px; color: #999;">
                    No RocCurve data available.
                  </div>
                </template>
              </v-col>

              <v-col cols="12" md="9" sm="12">
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

                <template v-else-if="hasCompareConsequenceBpxData">
                  <CompareConsequenceBox
                    :data="consequencecomparingboxArray"
                  />
                </template>

                <template v-else>
                  <div class="text-center" style="margin-top: 100px; color: #999;">
                    No Scatter2d data available.
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
import RocCurve from '@/components/analyze/RocCurve.vue'
import CompareConsequenceBox from '@/components/analyze/CompareConsequenceBox.vue'

const breadcrumbs = [
  {
    title: 'Home',
    href: '/',
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

const oncoprintMap = ref({})
const oncoprintLoading = ref(false)

const scatterArray = ref([])
const scatterLoading = ref(false)

const clinVarBinLoading = ref(false)
const ClinVarBinArray = ref([])

const consequenceArray = ref([])
const consequencecomparingboxArray = ref({})


const RocCurveMap = ref({})
const RocCurveLoading = ref(false)

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
const debouncedFetchMutagenesisStrategy = debounce(fetchMutagenesisStrategyOptions, 300)
const debouncedFetchExperimentModel = debounce(fetchExperimentModelOptions, 300)
const debouncedFetchPhenotype = debounce(fetchPhenotypeOptions, 300)
const debouncedFetchCompareConsequenceBox = debounce(fetchCompareConsequenceBox, 300)
const debouncedFetchRocCurve = debounce(fetchRocCurveData, 300)

const hasRocCurveData = computed(() => {
  if (!RocCurveMap.value || typeof RocCurveMap.value !== 'object') return false;

  const score = RocCurveMap.value.score;
  const clvGroup = RocCurveMap.value.clvGroup;

  if (!Array.isArray(score) || !Array.isArray(clvGroup)) return false;
  if (score.length === 0 || clvGroup.length === 0) return false;
  if (score.length !== clvGroup.length) return false;

  const allScoresAreNumbers = score.every(item => typeof item === 'number');
  const allGroupsAreValid = clvGroup.every(item => item === 0 || item === 1);

  return allScoresAreNumbers && allGroupsAreValid;
});

const hasCompareConsequenceBpxData = computed(() => {
  if (!consequencecomparingboxArray.value) return false;
  const d = consequencecomparingboxArray.value; // 你的数据对象，比如响应式对象
  if (!d || typeof d !== 'object') return false;

  // 判断cadd下LOF和GOF数组是否存在且非空
  const lof = d.cadd?.LOF;
  const gof = d.cadd?.GOF;

  return Array.isArray(lof) && lof.length > 0 &&
         Array.isArray(gof) && gof.length > 0;
});

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

async function fetchRocCurveData(query = '') {
  RocCurveLoading.value = true;
  try {
    const response = await axios.get('/clinmave/api/analyze/clinvarauc', {
      params: { datasetId: query || '' },
    });
    RocCurveMap.value = response.data || {};
    console.log('[CompareConsequence Array]', RocCurveMap.value);
  } catch (error) {
    VxeUI.message.error('Failed to load oncoprint data');
    RocCurveMap.value = {}
  } finally {
    RocCurveLoading.value = false;
  }
}

async function fetchCompareConsequenceBox(query = '') {
  scatterLoading.value = true;
  try {
    const response = await axios.get('/clinmave/api/analyze/consequencecomparingbox', {
      params: { datasetId: query || '' },
    });
    consequencecomparingboxArray.value = response.data || {};
    console.log('[CompareConsequence Array]', consequencecomparingboxArray.value);
  } catch (error) {
    VxeUI.message.error('Failed to load oncoprint data');
    consequencecomparingboxArray.value = {}
  } finally {
    scatterLoading.value = false;
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
  showResults.value = true;
  showVisualize.value = false;
}

const VisualizeClicker = (datasetId) => {
  showVisualize.value = true;

  debouncedFetchCompareConsequenceBox(datasetId);
  debouncedFetchRocCurve(datasetId);
}

const resetFilters = () => {
  showVisualize.value = false;
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

</style>

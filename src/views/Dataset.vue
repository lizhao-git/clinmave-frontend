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
                >
                  
                  <span>
                    {{ item.title }}
                  </span>
                </v-breadcrumbs-item>
              </template>
            </v-breadcrumbs>
          </v-card>
        </v-col>
      </v-row>
      
      <v-row class="mt-2" align="stretch">
        <v-col cols="12" md="12">
          <v-card 
            flat
            height="100%"
          >
            <v-card-title class="py-3">
              <v-icon icon="mdi-alert-circle-outline" class="mr-2" color="blue"></v-icon>
              <span class="text-h6 font-weight-bold">Dataset Details</span>
            </v-card-title>
            <v-card-text>
              <v-row>
              <v-col cols="12" sm="6">
                <DensityPlot :size="200" :data="scoreData"
                  :selection-strategy="VariantDensityData.selectionStrategy"
                  :cutoff="VariantDensityData.cutoff" 
                  :score="variantData.score"
                />
              </v-col>
              
            </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2" align="stretch">

        <!-- Table Content -->
        <v-col cols="12">
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

                <vxe-column field="maveTechnique" title="Mave technique" min-width="250" align="center"></vxe-column>

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

          <v-row>
            
          </v-row>
        </v-col>

      </v-row>
    </v-container>
  </v-main>
</template>

<style scoped>
  /* 自定义表格样式：无边框，仅行间分隔线 */
  .v-table.no-border {
    border: none !important;
    background: transparent;
  }
  .v-table.no-border tbody tr {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  }
  .v-table.no-border tbody tr:last-child {
    border-bottom: none;
  }
  .table-row {
    transition: background-color 0.2s ease;
  }
  .table-row:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  /* 字体和颜色 */
  .text-h6 {
    color: #1a3c5e;
  }
  .text-subtitle-1 {
    color: #1a3c5e;
  }
  .text-body-1 {
    color: #2e4b6b;
  }

  /* 表格单元格内边距 */
  td {
    padding: 16px 20px;
  }

  /* 扩展面板标题和背景 */

  .v-expansion-panel-title {
    color: #1a3c5e;
    border-radius: 8px;
    transition: background-color 0.2s ease;
  }
  .v-expansion-panel-title:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
</style>

<script setup>
  import { ref, onMounted, watch, computed} from 'vue';
  import { VxeTable, VxeColumn } from 'vxe-table';
  import { useRoute } from 'vue-router';
  import axios from 'axios';
  import * as d3 from 'd3'

  import { debounce } from 'lodash'

  import VxeUI from 'vxe-pc-ui';
  import 'vxe-pc-ui/lib/style.css';
  import 'vxe-table/lib/style.css';
  import DensityPlot from '@/components/Visualization/DensityPlot.vue';

  // Reactive state for variant details
  const variantData = ref({
    datasetId: null,
    pmid: null,
    mutagenesisStrategy: null,
    functionAssay: null,
    experimentModel: null,
    phenotype: null,
    varNum: null,
    aaNum: null,
    siteNum: null,
    geneName: null,
    clinvarNum: null,
  });
  
  // Reactive state for filters
  const filters = ref({
    dbsnpId: null,
    molecularConsequence: null,
    geneName: null,
    transcriptId: null,
    datasetId: null,
    mutagenesisStrategy: null,
  })

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

  const breadcrumbs = ref([
      {
        title: 'Home',
        icon: 'mdi-home',
        href: '/',
        disabled: false,
      },
      {
        title: 'Browse',
        disabled: false,
      },
      {
        title: 'Datasets',
        disabled: true, 
      },
      {
        title: null,
        icon: 'mdi-information',
        href: '/products/details',
        disabled: true,
      },
    ])
  
  const items = [
      { label: 'Variant Name', value: 'HGNC' },
      { label: 'Gene', value: 'Example Gene' },
      { label: 'Type', value: 'Missense Mutation' },
    ]

  // Reactive state for variant density plot data
  const VariantDensityData = ref({
    score: null,
    selectionStrategy: null,
    description: null,
    cutoff: null,
    label: null,
  });

  // Get the route to extract the identifier
  const route = useRoute();
  
  // Function to fetch variant data
  const fetchVariantData = async () => {
    try {
      const datasetId = route.params.datasetId; // Get identifier from route
      const response = await axios.get(`/clinmave/api/summary/dataset?datasetId=${encodeURIComponent(datasetId)}`);
      
      variantData.value = response.data; // Directly assign API response
      filters.value.datasetId = datasetId;
      console.log('Filters Data:', filters.value);
      // Update the last breadcrumb item with the identifier
      breadcrumbs.value[3].title = variantData.value.datasetId;

      // Update items for the second expansion panel
      items.value = [
        { label: 'Variant Name', value: variantData.value.transcriptId || 'HGNC' },
        { label: 'Gene', value: variantData.value.geneName || 'Example Gene' },
        { label: 'Type', value: variantData.value.consequenceClass || 'Missense Mutation' },
      ];
      
      loadData(); // Load table data after fetching variant data
    } catch (error) {
      console.error('Error fetching variant data:', error);
    }
  };

  const parsedData = computed(() => {
    // Guard clause to handle null or non-string clinvarNum
    if (!variantData.value.clinvarNum || typeof variantData.value.clinvarNum !== 'string') {
      return [];
    }

    const items = variantData.value.clinvarNum
      .split('|')
      .filter(item => item.includes(':')) // Ensure each item has the expected format
      .map(item => {
        const [category, value] = item.split(':');
        return {
          category: category.trim(),
          value: isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10),
        };
      });

    const total = items.reduce((sum, item) => sum + item.value, 0);

    return items.map((item, index) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
      color: getColor(index),
    }));
  });

  const getColor = (index) => {
    const colors = ['pink', 'yellow', 'teal', 'green', 'brown'];
    return colors[index % colors.length];
  };

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
        datasetId: encodeURIComponent(route.params.datasetId),
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

  const fetchVariantDensityData = async () => {
    try {
      
      const response = await axios.get(`/clinmave/api/visualize/density?datasetId=${route.params.datasetId}`);
      VariantDensityData.value = response.data; // Directly assign API response
      console.log("Output variant density data: ", VariantDensityData.value)
    } catch (error) {
      console.error('Error fetching variant density data:', error);
    }
  };

  // Computed property to extract score data
  const scoreData = computed(() => VariantDensityData.value.score ?? []);

  // Fetch data when component is mounted
  onMounted(() => {
    fetchVariantData();
    fetchVariantDensityData();
    loadData();
    const $table = tableRef.value
    const $toolbar = toolbarRef.value
    if ($table && $toolbar) {
      $table.connect($toolbar)
    }
  })

  // Watch pagination parameters
  watch([currentPage, pageSize], () => {
    console.log('[Watch] Page or size changed:', currentPage.value, pageSize.value)
    loadData()
  })


</script>
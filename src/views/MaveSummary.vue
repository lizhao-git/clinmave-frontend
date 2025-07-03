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
      
      <v-row class="mt-2" align="stretch">
        <v-col cols="12" md="12">
          <v-card 
            flat
            height="100%"
          >
            <v-card-title class="py-3">
              <v-icon icon="mdi-alert-circle-outline" class="mr-2" color="blue"></v-icon>
              <span class="text-h6 font-weight-bold">MAVE technique details</span>
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6" sm="12">
                  <v-table density="comfortable" class="no-border">
                    <tbody>

                      <tr>
                        <td class="text-subtitle-1">Mave technique: </td>
                        <td class="text-body-1">{{ maveSummaryData.maveTechnique }}</td>
                      </tr>

                      <tr>
                        <td class="text-subtitle-1">Mutagenesis strategy: </td>
                        <td class="text-body-1">
                          <div v-if="maveSummaryData.mutagenesisStrategy && maveSummaryData.mutagenesisStrategy.split(';').filter(s => s.trim()).length">
                            <v-chip
                              v-for="(strategy, index) in maveSummaryData.mutagenesisStrategy.split(';').filter(s => s.trim())"
                              :key="index"
                              color="primary"
                              class="mr-1"
                              size="small"
                            >
                              {{ strategy.trim() }}
                            </v-chip>
                          </div>
                          <span v-else>——</span>
                        </td>
                      </tr>
                      
                      <tr>
                        <td class="text-subtitle-1">#Datasets: </td>
                        <td class="text-body-1">
                          {{ maveSummaryData.totalDatasets }}
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                  
                </v-col>

                <v-col cols="12" md="6" sm="12">
                  <v-table density="comfortable" class="no-border">
                    <tbody>
                      <tr>
                        <td class="text-subtitle-1">Description: </td>
                        <td class="text-body-1 text-justify">{{ maveSummaryData.description }}</td>
                      </tr>
                      
                    </tbody>
                  </v-table>
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
              
              <vxe-column field="functionalAssay" title="Function Assay" min-width="160" align="center"></vxe-column>

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

  // Reactive state for variant details
  const maveSummaryData = ref({
    maveTechnique: null,
    description: null,
    totalDatasets: null,
    mutagenesisStrategy: null,
  });
  
  const breadcrumbs = ref([
      {
        title: 'Home',
        href: '/',
      },
      {
        title: 'Browse',
        href: '/browse/mave_techniques'
      },
      {
        title: 'Mave techniques',
        href: '/browse/mave_techniques'
      },
      {
        title: null,
      },
    ])
  
  const items = [
      { label: 'Variant Name', value: 'HGNC' },
      { label: 'Gene', value: 'Example Gene' },
      { label: 'Type', value: 'Missense Mutation' },
    ]
  
  const formatScore = (score) => {
    if (score === 'NA' || score == null) return '——';
    const num = parseFloat(score);
    return isNaN(num) ? '——' : num.toPrecision(3);
  };

  // Get the route to extract the identifier
  const route = useRoute();
  
  // Function to fetch variant data
  const fetchMaveSummaryData = async () => {
    try {
      const maveTechnique = route.params.maveTechnique; // Get identifier from route
      const response = await axios.get(`/clinmave/api/summary/mave?maveTechnique=${encodeURIComponent(maveTechnique)}`);
      maveSummaryData.value = response.data; // Directly assign API response

      // Update the last breadcrumb item with the identifier
      breadcrumbs.value[3].title = maveSummaryData.value.maveTechnique;

    } catch (error) {
      console.error('Error fetching variant data:', error);
    }
  };

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
        maveTechnique: route.params.maveTechnique, // Use the gene name from the route
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

  const handlePageChange = (event) => {
    console.log('[Page Change]', event) // Debug event data
    currentPage.value = event.currentPage
    pageSize.value = event.pageSize
    loadData()
  }

  // Watch pagination parameters
  watch([currentPage, pageSize], () => {
    console.log('[Watch] Page or size changed:', currentPage.value, pageSize.value)
    loadData()
  })

  // Fetch data when component is mounted
  onMounted(() => {
    fetchMaveSummaryData();
    loadData();
    const $table = tableRef.value
    const $toolbar = toolbarRef.value
    if ($table && $toolbar) {
      $table.connect($toolbar)
    }
  })
</script>
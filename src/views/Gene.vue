<template>
  <v-main>
    <v-container fluid class="mt-4">

      <v-row>
        <v-col cols="12">
          <v-card 
            flat
          >
            <v-breadcrumbs :items="breadcrumbs">
              <template v-slot:item="{ item, index }">
                <v-breadcrumbs-item>
                  <span :style="{ 'font-style': index === breadcrumbs.length - 1 ? 'italic' : '' }">
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
              <span class="text-h6 font-weight-bold">Gene Details</span>
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6" sm="12">
                  <v-table density="comfortable" class="no-border">
                    <tbody>
                      <tr>
                        <td class="text-subtitle-1 font-weight-bold">Gene: </td>
                        <td class="text-body-1" style="font-style: italic">{{ variantData.geneName }}</td>
                      </tr>
                      <tr>
                        <td class="text-subtitle-1 font-weight-bold">Ensembl ID: </td>
                        <td class="text-body-1"><a :href="variantData.ensemblLink" target="_blank">{{ variantData.ensemblId }}<v-icon small color="primary">mdi-share</v-icon></a></td>
                      </tr>
                      <tr>
                        <td class="text-subtitle-1 font-weight-bold">NCBI ID: </td>
                        <td class="text-body-1"><a :href="variantData.ncbiLink" target="_blank">{{ variantData.ncbiId }}<v-icon small color="primary">mdi-share</v-icon></a></td>
                      </tr>
                      <tr>
                        <td class="text-subtitle-1 font-weight-bold">HGNC ID: </td>
                        <td class="text-body-1"><a :href="variantData.hgncLink" target="_blank">{{ variantData.hgncId }}<v-icon small color="primary">mdi-share</v-icon></a></td>
                      </tr>
                      <tr>
                        <td class="text-subtitle-1 font-weight-bold">UniprotKB ID: </td>
                        <td class="text-body-1"><a :href="variantData.uniprotkbLink" target="_blank">{{ variantData.uniprotkbId }}<v-icon small color="primary">mdi-share</v-icon></a></td>
                      </tr>
                    </tbody>
                  </v-table>
                  <v-divider class="mb-4"></v-divider>
                  <v-chip class="mr-2"><a :href="variantData.omimLink" target="_blank">OMIM</a></v-chip>
                  <v-chip class="mr-2"><a :href="variantData.dicipherLink" target="_blank">DECIPHER</a></v-chip>
                  <v-chip class="mr-2"><a :href="variantData.g2pLink" target="_blank">Gene2Phenotype</a></v-chip>

                  <v-chip class="mr-2"><a :href="variantData.cosmicLink" target="_blank">COSMIC</a></v-chip>
                  <v-chip class="mr-2"><a :href="variantData.clinvarLink" target="_blank">ClinVar</a></v-chip>
                  <v-chip class="mr-2"><a :href="variantData.monarchLink" target="_blank">Monarch Initiative</a></v-chip>

                </v-col>

                <v-col cols="12" md="6" sm="12">
                  <v-table density="comfortable" class="no-border">
                    <tbody>
                      <tr>
                        <td class="text-subtitle-1 font-weight-bold">Full name: </td>
                        <td class="text-body-1 text-justify">{{ variantData.fullName }}</td>
                      </tr>
                      <tr>
                        <td class="text-subtitle-1 font-weight-bold">Gene summary: </td>
                        <td class="text-body-1 text-justify">{{ variantData.geneSummary }}</td>
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
  const variantData = ref({
    geneName: null,
    fullName: null,
    geneSummary: null,
    clinvarId: null,
    clinvarLink: null,
    ensemblId: null,
    ensemblLink: null,
    hgncId: null,
    hgncLink: null,
    ncbiId: null,
    ncbiLink: null,
    cosmicLink: null,
    dicipherLink: null,
    g2pLink: null,
    monarchLink: null,
    omimLink: null,
    uniprotkbId: null,
    uniprotkbLink: null
  });
  
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
        title: 'Genes',
        disabled: true, 
      },
      {
        title: null,
        disabled: true,
        style: { fontStyle: 'italic' },
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
  const fetchVariantData = async () => {
    try {
      const geneName = route.params.geneName; // Get identifier from route
      const response = await axios.get(`/clinmave/api/summary/gene?geneName=${encodeURIComponent(geneName)}`);
      console.log(response.data)
      variantData.value = response.data; // Directly assign API response
      console.log('Variant Data:', variantData.value);


      // Update the last breadcrumb item with the identifier
      breadcrumbs.value[3].title = variantData.value.geneName;

      // Update items for the second expansion panel
      items.value = [
        { label: 'Variant Name', value: variantData.value.transcriptId || 'HGNC' },
        { label: 'Gene', value: variantData.value.geneName || 'Example Gene' },
        { label: 'Type', value: variantData.value.consequenceClass || 'Missense Mutation' },
      ];
    } catch (error) {
      console.error('Error fetching variant data:', error);
    }
  };

  const fetchVariantDensityData = async () => {
    try {
      
      const response = await axios.get(`/clinmave/api/visualize/density?datasetId=${variantData.value.datasetId}`);
      VariantDensityData.value = response.data; // Directly assign API response

    } catch (error) {
      console.error('Error fetching variant density data:', error);
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
        geneName: route.params.geneName, // Use the gene name from the route
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

  watch(
    () => variantData.value?.datasetId,
    (newVal) => {
      if (newVal) {
        fetchVariantDensityData();
      }
    }
  );

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
    fetchVariantData();
    loadData();
    const $table = tableRef.value
    const $toolbar = toolbarRef.value
    if ($table && $toolbar) {
      $table.connect($toolbar)
    }
  })
</script>
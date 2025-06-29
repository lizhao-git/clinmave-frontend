<template>
<v-main>
  <v-container fluid class="mt-4">
    <v-row>
      <v-col cols="12">
        <v-card flat>
          <v-breadcrumbs :items="breadcrumbs">
            <template v-slot:item="{ item }">
              <v-breadcrumbs-item>
                <span>{{ item.title }}</span>
              </v-breadcrumbs-item>
            </template>
          </v-breadcrumbs>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12" md="6">
        <v-row>
          <v-col cols="12" v-if="!isVariantDetailEmpty">
        <v-card flat height="100%">
          <v-card-title class="py-3">
            <v-icon icon="mdi-alert-circle-outline" class="mr-2" color="teal"></v-icon>
            <span class="text-h6 font-weight-bold">Variant Details</span>
          </v-card-title>
          <v-card-text>
            <v-table density="comfortable" class="no-border">
              <tbody>
                <tr>
                  <td class="text-subtitle-1 font-weight-bold">Identifier:</td>
                  <td class="text-body-1">{{ variantData.identifier }}</td>
                </tr>
                <tr>
                  <td class="text-subtitle-1 font-weight-bold">Type and length:</td>
                  <td class="text-body-1">{{ variantData.typeAndLength }}</td>
                </tr>
                <tr>
                  <td class="text-subtitle-1 font-weight-bold">Location:</td>
                  <td class="text-body-1">
                    <a :href="variantData.ucscHg19" target="_blank">{{ variantData.locationHg19 }}</a><br>
                    <a :href="variantData.ucscHg38" target="_blank">{{ variantData.locationHg38 }}</a>
                  </td>
                </tr>
                <tr>
                  <td class="text-subtitle-1 font-weight-bold">Molecular consequence:</td>
                  <td class="text-body-1">
                    <v-chip v-if="variantData.molecularConsequence"
                      :color="getMolecularConsequenceColor(variantData.molecularConsequence || '')"
                      :text="variantData.molecularConsequence || 'N/A'">
                      {{ variantData.molecularConsequence }}
                    </v-chip>
                    <span v-else class="text-grey">--</span>
                  </td>
                </tr>
                <tr>
                  <td class="text-subtitle-1 font-weight-bold">dbSNP ID:</td>
                  <td class="text-body-1">
                    <span v-if="variantData.dbsnpId && variantData.dbsnpId !== 'NA'">
                      {{ variantData.dbsnpId }}
                      <a :href="`https://www.ncbi.nlm.nih.gov/snp/${variantData.dbsnpId}`" target="_blank">[dbSNP]</a>
                    </span>
                    <span v-else>——</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" v-if="!isInSilicoEmpty">
        <v-card flat height="100%">
          <v-card-title>
            <v-icon icon="mdi-dna" class="mr-2" color="primary"></v-icon>
            <span class="text-h6 font-weight-bold">In-silico prediction</span>
          </v-card-title>
          <v-card-text>
           <vxe-table 
                border="inner"
                show-header
                auto-resize
                size="medium"
                class="no-border"
                :data="inSilicoData"
              >
                <vxe-column field="software" title="Software" width="200">
                  <template #default="{ row }">
                    <span class="text-subtitle-1 font-weight-medium">{{ row.software }}</span>
                  </template>
                </vxe-column>
                
                <vxe-column field="score" title="Predicted score" width="150">
                  <template #default="{ row }">
                    <span class="text-body-1">
                      {{ formatScore(row.score) }}
                    </span>
                  </template>
                </vxe-column>
                
                <vxe-column field="classification" title="Calibrated classification" min-width="200">
                  <template #default="{ row }">
                    <span class="text-body-1">
                      {{ row.classification === 'NA' || !row.classification ? '——' : row.classification }}
                    </span>
                  </template>
                </vxe-column>
              </vxe-table>
          </v-card-text>
        </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" v-if="!isTcgaSummaryEmpty">
        <v-card flat height="100%">
          <v-card-title class="py-3">
            <v-icon icon="mdi-atom-variant" class="mr-2" color="primary"></v-icon>
            <span class="text-h6 font-weight-bold">Oncogenic association</span>
          </v-card-title>
          <v-card-text>
            <vxe-table border="inner" show-header auto-resize size="medium" class="no-border"
              :data="variantData.tcgaSummary">
              <vxe-column
                field="cancerType"
                title="Cancer type"
                width="200"
                :formatter="({ cellValue }) => (cellValue ? cellValue.toUpperCase() : '')"
              />
              <vxe-column field="freq" title="Frequency" width="150" />
              <vxe-column field="af" title="AF" min-width="200" />
            </vxe-table>
          </v-card-text>
        </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" v-if="!isClinvarEmpty">
        <v-card flat height="100%">
          <v-card-title class="py-3">
            <v-icon icon="mdi-cactus" class="mr-2" color="teal"></v-icon>
            <span class="text-h6 font-weight-bold">Germline pathogenicity</span>
          </v-card-title>
          <v-card-text>
            <v-table density="comfortable" class="no-border">
              <tbody>
                <tr>
                  <td class="text-subtitle-1 font-weight-bold">
                    <a :href="variantData.clvId" target="_blank">ClinVar:</a>
                  </td>
                  <td class="text-body-1">
                    <v-rating v-if="variantData.clvStar && variantData.clvStar !== 'null'" readonly :length="4"
                      :size="32" :model-value="getStarValue(variantData.clvStar)" active-color="primary" />
                    <span v-else class="text-grey">——</span>
                  </td>
                </tr>
                <tr>
                  <td class="text-subtitle-1 font-weight-bold">Clinical significance:</td>
                  <td class="text-body-1">
                    <v-chip v-if="variantData.clvClinicalsignificance"
                      :text="variantData.clvClinicalsignificance || '--'">
                      {{ variantData.clvClinicalsignificance }}
                    </v-chip>
                    <span v-else class="text-grey">——</span>
                  </td>
                </tr>
                <tr>
                  <td class="text-subtitle-1 font-weight-bold">Review status:</td>
                  <td class="text-body-1">
                    <v-chip v-if="variantData.clvReviewstatus"
                      :text="variantData.clvReviewstatus || '--'">
                      {{ variantData.clvReviewstatus }}
                    </v-chip>
                    <span v-else class="text-grey">——</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
          </v-col>
        </v-row>

        <v-row>
           <v-col cols="12" v-if="!isGadSummaryEmpty">
        <v-card flat height="100%">
          <v-card-title class="py-3">
            <v-icon icon="mdi-account-group" class="mr-2" color="blue"></v-icon>
            <span class="text-h6 font-weight-bold">Population frequency</span>
          </v-card-title>
          <v-card-text>
            <vxe-table 
                  border="inner"
                  show-header
                  auto-resize
                  size="medium"
                  class="no-border"
                  :data="variantData.gadSummary"
                >
                  <!-- <vxe-column field="gadClassification" title="gnomAD classification" width="200">
                    <template #default="{ row }">
                      <span class="text-subtitle-1 font-weight-medium">
                        {{ row.gadClassification === 'NA' || !row.gadClassification ? '——' : row.gadClassification }}
                      </span>
                    </template>
                  </vxe-column> -->
                  
                  <vxe-column field="gadFrequency" title="gnomAD frequency" width="200">
                    <template #default="{ row }">
                      <span class="text-body-1">
                        {{ row.gadFrequency === 'NA' || !row.gadFrequency ? '——' : row.gadFrequency }}
                      </span>
                    </template>
                  </vxe-column>
                  
                  <vxe-column field="gadDescription" title="gnomAD description" min-width="200">
                    <template #default="{ row }">
                      <span class="text-body-1">
                        {{ row.gadDescription === 'NA' || !row.gadDescription ? '——' : row.gadDescription }}
                      </span>
                    </template>
                  </vxe-column>
              </vxe-table>
          </v-card-text>
        </v-card>
            </v-col>
        </v-row>
      </v-col>

      
      <v-col cols="12" md="6" v-if="!isFunctionCurationEmpty">
        <v-card flat height="100%">
          <v-card-title>
            <v-icon icon="mdi-dna" class="mr-2" color="teal"></v-icon>
            <span class="text-h6 font-weight-bold">MAVE score</span>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
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

                  <vxe-column field="dataset" title="Dataset ID" min-width="100" align="center">
                    <template #default="{ row }">
                        <a 
                          v-if="row.geneName" 
                          :href="`/clinmave/browse/dataset/${encodeURIComponent(row.datasetId)}`" 
                          target="_blank"
                          style="text-decoration: none"
                        >
                          {{ row.datasetId }}
                        </a>
                        <span v-else>-</span>
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

                  <vxe-column field="consequenceClass" title="Consequence" min-width="160" align="center">
                    <template #default="{ row }">
                      <v-chip 
                        v-if="row.consequenceClass"
                        small
                        dark
                        :color="getConsequenceClassColor(row.consequenceClass)"
                      >
                        {{ row.consequenceClass }}
                      </v-chip>
                      <span v-else>
                        -
                      </span>
                    </template>
                  </vxe-column>

                  <vxe-column field="maveTechnique" title="Mave technique" min-width="250" align="center"></vxe-column>
                  
                  <vxe-column field="functionalAssay" title="Functional assay" min-width="140" align="center"></vxe-column>

                  <vxe-column field="datasetId" title="" min-width="80" align="center">
                    <template #default="{ row }">
                      <v-btn
                        :color="row.consequenceClass ? 'primary' : 'grey'"
                        variant="compact"
                        :icon="row.consequenceClass ? 'mdi-eye' : 'mdi-cancel'"
                        :disabled="!row.consequenceClass"
                        @click="row.consequenceClass && VisualizeClicker(row.datasetId)"
                      ></v-btn>
                    </template>
                  </vxe-column>

                </vxe-table>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" sm="6">
                <DensityPlot :size="200" :data="scoreData"
                  :selection-strategy="VariantDensityData.selectionStrategy"
                  :cutoff="VariantDensityData.cutoff" 
                  :score="VariantDensityData.pointScore"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-alert border="start" border-color="deep-purple accent-4" variant="outlined" class="mt-4 mb-3"><span>Score: {{ VariantDensityData.pointScore }}</span></v-alert>
                <v-alert border="start" border-color="deep-purple accent-4" variant="outlined"class="mb-3">
                  <span>Functional classification: </span>
                  <v-chip 
                    small
                    dark
                    :color="getConsequenceClassColor(VariantDensityData.consequenceClass)"
                  >
                    {{ VariantDensityData.consequenceClass }}
                  </v-chip>
                </v-alert>
                <v-alert border="start" border-color="deep-purple accent-4" variant="outlined"><span>Description: {{ VariantDensityData.functionalDescription }}</span></v-alert>
              </v-col>
            </v-row>
            <v-divider />
            <v-row>
              <v-col cols="12" sm="6">
                <EffectBar :strength="selectedStrength" :bar-height="12"
                    :labels="['No effects', 'Weak', 'Moderate', 'Strong']"
                    :colors="{ blue: '#1E88E5', purple: '#7B1FA2', text: '#212121', cardBorder: '#B0BEC5', cardBg: '#F5F5F5', strongText: '#D32F2F' }" />
              </v-col>
              
            </v-row>
          </v-card-text>
        </v-card>
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
  import DensityPlot from '@/components/Visualization/densityPlot.vue';
  import EffectBar from '@/components/Visualization/EffectBar.vue';

  // Reactive state for variant details
  const variantData = ref({
    dbsnpId: null,
    identifier: null,
    consequenceClass: null,
    molecularConsequence: null,
    typeAndLength: null,
    locationHg19: null,
    locationHg38: null,
    ucscHg19: null,
    ucscHg38: null,
    datasetId: null,
    score: null,
    cadd: null,
    caddClass: null,
    revel: null,
    revelClass: null,
    metasvm: null,
    metasvmClass: null,
    alphamissense: null,
    alphamissenseClass: null,
    eve: null,
    eveClass: null,
    tcgaSummary: null,
    clvUrl: null,
    clvReviewstatus: null,
    clvClinicalsignificance: null,
    clvStar: null,
  });

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

  // Reactive state for variant density plot data
  const VariantDensityData = ref({
    score: null,
    selectionStrategy: null,
    description: null,
    cutoff: null,
    label: null,
  });
  
  // Reactive state for selected strength (for EffectBar)
  const selectedStrength = ref(null);

  // Computed property to extract score data
  const scoreData = computed(() => VariantDensityData.value.score ?? []);
  console.log("scoreData", scoreData)
  const breadcrumbs = ref([
      {
        title: 'Home',
        href: '/',
        disabled: false,
      },
      {
        title: 'Browse',
        href: '/products',
        disabled: false,
      },
      {
        title: 'Variants',
        href: '/products/details',
        disabled: true, 
      },
      {
        title: null,
        href: '/products/details',
        disabled: true,
      },
    ])
  
  const items = [
      { label: 'Variant Name', value: 'HGNC' },
      { label: 'Gene', value: 'Example Gene' },
      { label: 'Type', value: 'Missense Mutation' },
    ]
  
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
        identifier: route.params.identifier || undefined,
      };

      // Remove empty or undefined params
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });
      
      // Replace with your actual API endpoint
      const response = await axios.get('/clinmave/api/fetch/table/variant', { params });
      console.log('API Response:', response.data);
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

  const formatScore = (score) => {
    if (score === 'NA' || score == null) return '——';
    const num = parseFloat(score);
    return isNaN(num) ? '——' : num.toFixed(3);
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
    return colorMap[molecularConsequence] || '#CCCCCC';
  };

  const getConsequenceClassColor = (consequenceClass) => {
    const colorMap = {
      'Gain-of-function': '#D55E00', 
      'Loss-of-function': '#0072B2',
      'Functional neutral': '#AAAAAA',
    };
    return colorMap[consequenceClass] || '#CCCCCC';
  };

  const getStarValue = (star) => {
    if (!star || star === 'null') return 0;
    const starMap = {
      none: 0,
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
    };
    return starMap[star.toLowerCase()] || 0;
  };

  // 创建计算属性来组织数据
  const inSilicoData = computed(() => [
    {
      software: 'CADD',
      score: variantData.value.cadd,
      classification: variantData.value.caddClass
    },
    {
      software: 'REVEL',
      score: variantData.value.revel,
      classification: variantData.value.revelClass
    },
    {
      software: 'MetaSVM',
      score: variantData.value.metasvm,
      classification: variantData.value.metasvmClass
    },
    {
      software: 'AlphaMissense',
      score: variantData.value.alphamissense,
      classification: variantData.value.alphamissenseClass
    },
    {
      software: 'EVE',
      score: variantData.value.eve,
      classification: variantData.value.eveClass
    }
  ]);
  // Get the route to extract the identifier
  const route = useRoute();
  
  // Function to fetch variant data
  const fetchVariantData = async () => {
    try {
      const identifier = route.params.identifier; // Get identifier from route
      const response = await axios.get(`/clinmave/api/summary/variant?identifier=${encodeURIComponent(identifier)}`);
      variantData.value = response.data; // Directly assign API response
      console.log('Variant Data:', variantData.value);
      
      // Update the last breadcrumb item with the identifier
      breadcrumbs.value[3].title = variantData.value.identifier;

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

  const fetchVariantDensityData = async (identifier, datasetId) => {
    try {
      const response = await axios.get(`/clinmave/api/visualize/density?identifier=${identifier}&datasetId=${datasetId}`);
      VariantDensityData.value = response.data; // Directly assign API response

      // Update selectedStrength based on consequenceClass
      if (VariantDensityData.value.consequenceClass?.includes('neutral')) {
        selectedStrength.value = 'No effects';
      } else if (VariantDensityData.value.consequenceClass?.includes('pathogenic')) {
        selectedStrength.value = 'Moderate';
      } else {
        selectedStrength.value = 'Weak';
      }

    } catch (error) {
      console.error('Error fetching variant density data:', error);
    }
  };

  const isVariantDetailEmpty = computed(() => {
  const d = variantData.value;
    return !d.identifier && !d.typeAndLength && !d.locationHg19 && !d.locationHg38 && !d.molecularConsequence && !d.dbsnpId;
  });
  const isFunctionCurationEmpty = computed(() => {
    return (!variantData.value.score && !variantData.value.consequenceClass && !variantData.value.functionalDescription && (!scoreData.value || scoreData.value.length === 0));
  });
  const isInSilicoEmpty = computed(() => {
    return inSilicoData.value.every(item => !item.score && !item.classification);
  });
  const isTcgaSummaryEmpty = computed(() => {
    return !variantData.value.tcgaSummary || variantData.value.tcgaSummary.length === 0;
  });
  const isClinvarEmpty = computed(() => {
    const d = variantData.value;
    return !d.clvId && !d.clvStar && !d.clvClinicalsignificance && !d.clvReviewstatus;
  });
  const isGadSummaryEmpty = computed(() => {
    return !variantData.value.gadSummary || variantData.value.gadSummary.length === 0;
  });

  const VisualizeClicker = (datasetId) => {
    fetchVariantDensityData(route.params.identifier, datasetId);
  }

  watch(
    () => variantData.value?.datasetId,
    (newVal) => {
      if (newVal) {
        fetchVariantDensityData(route.params.identifier, variantData.value.datasetId);
      }
    }
  );

  // Fetch data when component is mounted
  onMounted(() => {
    fetchVariantData();
    loadData();
    const $table = tableRef.value
    const $toolbar = toolbarRef.value
    if ($table && $toolbar) {
      $table.connect($toolbar)
    }
  });
</script>
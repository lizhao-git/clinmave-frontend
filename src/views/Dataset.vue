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
                  <!-- 自定义图标 -->
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
        <v-col cols="12" sm="12" md="6" lg="6">
          <v-card
            flat
            height="100%"
          >
            <v-card-title class="py-3">
              <v-icon icon="mdi-cactus" class="mr-2" color="teal"></v-icon>
              <span class="text-h6 font-weight-bold">Germeline pathogenicity</span>
            </v-card-title>
            <v-card-text>

              <v-table density="comfortable" class="no-border">
                <tbody>
                  <tr>
                    <td class="text-subtitle-1 font-weight-bold">ClinVar: </td>
                    <td class="text-body-1">{{ variantData.identifier }}</td>
                  </tr>
                  <tr>
                    <td class="text-subtitle-1 font-weight-bold">Classification: </td>
                    <td class="text-body-1">{{ variantData.typeAndLength }}</td>
                  </tr>
                  <tr>
                    <td class="text-subtitle-1 font-weight-bold">Clinical significance: </td>
                    <td class="text-body-1">{{ variantData.location }} <a href="variantData.ucscHg38" target="_blank">[UCSC]</a></td>
                  </tr>
                  <tr>
                    <td class="text-subtitle-1 font-weight-bold">Review status: </td>
                    <td class="text-body-1"><v-chip>{{ variantData.consequenceClass }}</v-chip></td>
                  </tr>
                </tbody>
              </v-table>
              
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="12" md="6" lg="6">
          <v-card
            flat
            height="100%"
          >
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
                  <vxe-column field="gadClassification" title="GAD classification" width="200">
                    <template #default="{ row }">
                      <span class="text-subtitle-1 font-weight-medium">
                        {{ row.gadClassification === 'NA' || !row.gadClassification ? '——' : row.gadClassification }}
                      </span>
                    </template>
                  </vxe-column>
                  
                  <vxe-column field="gadFrequency" title="GAD frequency" width="150">
                    <template #default="{ row }">
                      <span class="text-body-1">
                        {{ row.gadFrequency === 'NA' || !row.gadFrequency ? '——' : row.gadFrequency }}
                      </span>
                    </template>
                  </vxe-column>
                  
                  <vxe-column field="gadDescription" title="GAD description" min-width="200">
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
    typeAndLength: null,
    location: null,
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
  });

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
        title: 'Dataset',
        href: '/products/details',
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
  
  const formatScore = (score) => {
    if (score === 'NA' || score == null) return '——';
    const num = parseFloat(score);
    return isNaN(num) ? '——' : num.toPrecision(3);
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
      const datasetId = route.params.datasetId; // Get datasetId from route
      const response = await axios.get(`/api/fugedb/summary/dataset?datasetId=${encodeURIComponent(datasetId)}`);
      variantData.value = response.data; // Directly assign API response
      console.log('Variant Data:', variantData.value);
      // Update selectedStrength based on consequenceClass
      if (variantData.value.consequenceClass?.includes('neutral')) {
        selectedStrength.value = 'No effects';
      } else if (variantData.value.consequenceClass?.includes('pathogenic')) {
        selectedStrength.value = 'Moderate';
      } else {
        selectedStrength.value = 'Weak';
      }

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

  const fetchVariantDensityData = async () => {
    try {
      
      const response = await axios.get(`/api/fugedb/visualize/density?datasetId=${variantData.value.datasetId}`);
      VariantDensityData.value = response.data; // Directly assign API response

    } catch (error) {
      console.error('Error fetching variant density data:', error);
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

  // Fetch data when component is mounted
  onMounted(() => {
    fetchVariantData();
  });
</script>
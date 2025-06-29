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

            <v-card-text>
              <v-row>
                <v-col cols="12" md="4" sm="12">
                  <MutagenesisProportion />
                </v-col>
                <v-col cols="12" md="4" sm="12">
                  <AcmgGeneDatasets />
                </v-col>
                <v-col cols="12" md="4" sm="12">
                  <AcmgRecommendedGeneVariants />
                </v-col>
              </v-row>
              <v-row>
                <v-col col="12" md="4" sm="12">
                  <NoneAcmgAndVusMorethen1000Datasets />
                </v-col>
                <v-col col="12" md="4" sm="12">
                  <NoneAcmgAndVusMorethen1000Variants />
                </v-col>
                <v-col col="12" md="4" sm="12">
                  <MolecularConsequencePercentageStatistics />
                </v-col>
              </v-row>
              <v-row>
                <v-col col="12" md="4" sm="12">
                  <MaveTechniquePS />
                </v-col>
                <v-col col="12" md="4" sm="12">
                  <MutagenesisStrategyPS />
                </v-col>
                <v-col col="12" md="4" sm="12">
                  <FunctionalAssayPS />
                </v-col>
              </v-row>
              <v-row>
                <v-col col="12" md="4" sm="12">
                  <ExperimentModelDS />
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

  import { debounce } from 'lodash'

  import VxeUI from 'vxe-pc-ui';
  import 'vxe-pc-ui/lib/style.css';
  import 'vxe-table/lib/style.css';
  import MutagenesisProportion from '@/components/stat/MutagenesisProportion.vue';
  import AcmgGeneDatasets from '@/components/stat/AcmgGeneDatasets.vue';
  import AcmgRecommendedGeneVariants from '@/components/stat/AcmgRecommendedGeneVariants.vue'
  import NoneAcmgAndVusMorethen1000Datasets from '@/components/stat/NoneAcmgAndVusMorethen1000Datasets.vue'
  import NoneAcmgAndVusMorethen1000Variants from '@/components/stat/NoneAcmgAndVusMorethen1000Variants.vue'
  import MolecularConsequencePercentageStatistics from '@/components/stat/MolecularConsequencePercentageStatistics.vue'
  import MaveTechniquePS from '@/components/stat/MaveTechniquePS.vue'
  import MutagenesisStrategyPS from '@/components/stat/MutagenesisStrategyPS.vue'
  import FunctionalAssayPS from '@/components/stat/FunctionalAssayPS.vue'
  import ExperimentModelDS from '@/components/stat/ExperimentModelDS.vue'
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
  
  const breadcrumbs = ref([
      {
        title: 'Home',
        icon: 'mdi-home',
        href: '/',
        disabled: false,
      },
      {
        title: 'Statistics',
        disabled: false,
      },
    ])
  
  const items = [
      { label: 'Variant Name', value: 'HGNC' },
      { label: 'Gene', value: 'Example Gene' },
      { label: 'Type', value: 'Missense Mutation' },
    ]

  // Get the route to extract the identifier
  const route = useRoute();
  
  // Function to fetch variant data
  const fetchVariantData = async () => {
    try {
      const datasetId = route.params.datasetId; // Get identifier from route
      const response = await axios.get(`/clinmave/api/summary/dataset?datasetId=${encodeURIComponent(datasetId)}`);
      console.log(response.data)
      variantData.value = response.data; // Directly assign API response

      // Update the last breadcrumb item with the identifier
      breadcrumbs.value[3].title = variantData.value.datasetId;

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


  // Fetch data when component is mounted
  onMounted(() => {
    fetchVariantData();
  })
</script>
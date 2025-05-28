<template>
  <v-main>
    <v-container fluid>

      <v-row>
        <v-col cols="12">
          <v-card 
            flat
          >
            <v-breadcrumbs :items="breadcrumbs">
              <template v-slot:item="{ item }">
                <v-breadcrumbs-item
                  :disabled="item.disabled"
                  :href="item.href"
                >
                  <!-- 自定义图标 -->
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
      
      
      <v-row class="mt-2">
        <v-col cols="12" md="6">
          <v-card 
            flat
          >
            <v-card-title class="py-3">
              <v-icon icon="mdi-dna" class="mr-2" color="teal"></v-icon>
              <span class="text-h6 font-weight-bold">Variant Details</span>
            </v-card-title>
            <v-card-text>
              <v-table density="comfortable" class="no-border">
                <tbody>
                  <tr>
                    <td class="text-subtitle-1 font-weight-bold">Identifier: </td>
                    <td class="text-body-1">NM_017882.3(CLN6):c.679G>A (p.Glu227Lys)</td>
                  </tr>
                  <tr>
                    <td class="text-subtitle-1 font-weight-bold">Type and length: </td>
                    <td class="text-body-1">single nucleotide variant, 1 bp</td>
                  </tr>
                  <tr>
                    <td class="text-subtitle-1 font-weight-bold">Location: </td>
                    <td class="text-body-1">15: 68208397 <a href="">[UCSC]</a></td>
                  </tr>
                  <tr>
                    <td class="text-subtitle-1 font-weight-bold">Molecular consequence: </td>
                    <td class="text-body-1"><v-chip>missense</v-chip></td>
                  </tr>
                  <tr>
                    <td class="text-subtitle-1 font-weight-bold">dbSNP: </td>
                    <td class="text-body-1">rs746753722 <a href="">[dbSNP]</a></td>
                  </tr>
                </tbody>
                </v-table>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card flat>
            <v-card-title>Function curation</v-card-title>
            <v-card-text>
              <!-- List of related studies -->
               <v-row>
                <v-col cols="12" sm="6">
                  <DensityPlot :size="240"/>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <EffectBar
                    :strength="High"
                    :bar-height="12"
                    :labels="['None', 'Low', 'Medium', 'High']"
                    :colors="{
                      blue: '#1E88E5',
                      purple: '#7B1FA2',
                      text: '#212121',
                      cardBorder: '#B0BEC5',
                      cardBg: '#F5F5F5',
                      strongText: '#D32F2F'
                    }"
                  />
                </v-col>
               </v-row>
               <v-sheet>
                
               </v-sheet>
              
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12" sm="12" md="6" lg="6">
          <v-expansion-panels flat>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon icon="mdi-dna" class="mr-2" color="primary"></v-icon>
                <span class="text-h6 font-weight-bold">Variant Details</span>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="comfortable" class="no-border">
                  <tbody>
                    <tr>
                      <td class="text-subtitle-1 font-weight-bold">Software</td>
                      <td class="text-body-1 font-weight-bold">Predicted score</td>
                      <td class="text-body-1 font-weight-bold">Calibrated classification</td>
                    </tr>
                    <tr>
                      <td class="text-subtitle-1 font-weight-medium">CADD</td>
                      <td class="text-body-1">26.1</td>
                      <td class="text-body-1">Supporting pathogenic</td>
                    </tr>
                    <tr>
                      <td class="text-subtitle-1 font-weight-medium">REVEL</td>
                      <td class="text-body-1">0.695</td>
                      <td class="text-body-1">Supporting pathogenic</td>
                    </tr>
                    <tr>
                      <td class="text-subtitle-1 font-weight-medium">MetaSVM</td>
                      <td class="text-body-1">0.802</td>
                      <td class="text-body-1">Supporting pathogenic</td>
                    </tr>
                    <tr>
                      <td class="text-subtitle-1 font-weight-medium">AlphaMissense</td>
                      <td class="text-body-1">0.957</td>
                      <td class="text-body-1">Moderate pathogenic</td>
                    </tr>
                    <tr>
                      <td class="text-subtitle-1 font-weight-medium">EVE</td>
                      <td class="text-body-1">0.823</td>
                      <td class="text-body-1">Moderate pathogenic</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>

        <v-col cols="12" sm="12" md="6" lg="6">
          <v-expansion-panels variant="accordion" flat>
            <v-expansion-panel elevation="0">
              <v-expansion-panel-title class="py-3">
                <v-icon icon="mdi-dna" class="mr-2" color="primary"></v-icon>
                <span class="text-h6 font-weight-bold">Variant Details</span>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="comfortable" class="no-border">
                  <tbody>
                    <tr v-for="(item, index) in items" :key="index" class="table-row">
                      <td class="text-subtitle-1 font-weight-medium">{{ item.label }}</td>
                      <td class="text-body-1">{{ item.value }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
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
import DensityPlot from '@/components/Visualization/densityPlot.vue';
import EffectBar from '@/components/Visualization/EffectBar.vue';
  const breadcrumbs = [
      {
        title: 'Home',
        icon: 'mdi-home',
        href: '/',
        disabled: false,
      },
      {
        title: 'Browse',
        icon: 'mdi-cart',
        href: '/products',
        disabled: false,
      },
      {
        title: 'Variant',
        icon: 'mdi-information',
        href: '/products/details',
        disabled: true, // 禁用此项
      },
    ]
  const items = [
      { label: 'Variant Name', value: 'HGNC' },
      { label: 'Gene', value: 'Example Gene' },
      { label: 'Type', value: 'Missense Mutation' },
    ]
</script>
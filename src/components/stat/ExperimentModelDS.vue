<template>
    <div style="margin-top: 20px; margin-bottom: 10px;">
      <h3 class="text-xl font-bold mb-4 text-gray-800">Experiment Model Associated Datasets Statistics</h3>
      <BarChart :chartData="chartData" :xAxisNameGap="100" :yAxisNameGap="50" chartHeight="500px" />
    </div>
  </template>
  
  <script setup>
  import BarChart from '@/components/Visualization/BarChart.vue';
  
  const chartData = {
    xAxisData: [
      'CD4⁺ T cell', 'E. coli', 'HAP1', 'MCF10A', 
      'HEK293T', 'A375', 'Expi293F', 'MELJUSO', 'Freestyle 293-F',
      'HA1E', 'OVCAR8', 'PC-9', 'A549', 'CHO-K1', 'CRC organoid', 'H1299', 'HCT116', 'HEK293', 'HT29', 'HeLa', 'HepG2', 'NIH3T3', 'embryonic stem cell'
    ],
    yAxisData: [
      1497, 437, 120, 25, 15,
      8, 7, 8, 5, 4,
      4, 4, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1
    ],
    xAxisName: 'experiment model type',
    yAxisName: '#Datasets',
    seriesName: '#Datasets',
    barColor: '#368EE0',
    colors: [
        '#D6893D', // BRCA1
        '#BFAE52', // BRCA2
        '#6DBB90', // PTEN
        '#A8D08E', // HNF1A
        '#7CC3E5', // SMAD3
        '#7CC3E5', // SMAD4
        '#9191E8', // TGFBR1
        '#9191E8', // TGFBR2
        '#E599C5', // VHL
        '#E599C5', // TP53
        '#F0B9B8', // BAC3
        '#B5D098', // MLH1
        '#A0D9D9',  // MSH2
        '#F2C94C', // 亮黄色-1
        '#F6AD55', // 亮黄色-2
        '#38B2AC', // 青绿色-1
        '#4FD1C5', // 青绿色-2
        '#805AD5', // 深紫色-1
        '#9F7AEA', // 浅紫色-1
        '#ED8936', // 橙红色-1
        '#F56565', // 橙红色-2
        '#48BB78', // 草绿色-1
        '#38A169', // 草绿色-2
    ]
  };
  </script>
      
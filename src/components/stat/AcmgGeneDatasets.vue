<template>
    <div style="margin-bottom: 50px;">
      <h3 class="text-xl font-bold mb-4 text-gray-800">ACMG-recommended Gene Datasets</h3>
      <BarChart :chartData="acmgChartData" chartHeight="500px" />
    </div>
  </template>
  
  <script setup>
  import BarChart from '@/components/Visualization/BarChart.vue';
  
  const acmgChartData = {
    xAxisData: [
      'BRCA1', 'BRCA2', 'PTEN', 'HNF1A', 
      'SMAD3', 'SMAD4', 'TGFBR1', 'TGFBR2', 'VHL',
      'TP53', 'BAG3', 'MLH1', 'MSH2'
    ],
    yAxisData: [
      11, 10, 6, 4, 4,
      4, 4, 4, 4, 3,
      1, 1, 1
    ],
    xAxisName: 'ACMG guideline-recommended genes',
    yAxisName: 'Dataset numbers',
    seriesName: '数据集数量',
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
        '#A0D9D9'  // MSH2
    ]
  };
  </script>
      
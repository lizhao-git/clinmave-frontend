<template>
    <div style="margin-bottom: 50px;">
      <h3 class="text-xl font-bold mb-4 text-gray-800">ACMG-recommended Gene Variants</h3>
      <BarChart :chartData="chartData" :yAxisNameGap="50" chartHeight="500px" />
    </div>
  </template>
  
  <script setup>
  import BarChart from '@/components/Visualization/BarChart.vue';
  
  const chartData = {
    xAxisData: [
      'MSH2', 'BRCA2', 'TP53', 'PTEN', 
      'BRCA1', 'HNF1A', 'VHL', 'SMAD3', 'TGFBR2',
      'SMAD4', 'TGFBR1', 'BAG3', 'MLH1'
    ],
    yAxisData: [
      22294, 18361, 18073, 14716, 13534,
      4041, 3015, 2422, 2151, 1994,
      1432, 1260, 258
    ],
    xAxisName: 'ACMG guideline-recommended genes',
    yAxisName: 'Variants numbers',
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
      
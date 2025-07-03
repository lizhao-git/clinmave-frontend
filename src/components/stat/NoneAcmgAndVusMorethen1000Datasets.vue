<template>
    <div style="margin-bottom: 50px;">
      <BarChart :chartData="chartData" chartHeight="500px" />
    </div>
  </template>
  
  <script setup>
  import BarChart from '@/components/Visualization/BarChart.vue';
  
  const chartData = {
    title: 'Non-ACMG genes with OMIM relevance and VUS >1000 in ClinVar gene datasets',
    xAxisData: [
      'EGFR', 'SMARCA4', 'CBL', 'ANK2', 
      'BAP1', 'CHD7', 'CHEK2', 'KMT2A', 'NEB',
      'PCLO', 'SPTAN1', 'WNK1'
    ],
    yAxisData: [
      9, 7, 5, 1, 1,
      1, 1, 1, 1, 1,
      1, 1
    ],
    xAxisName: 'Non-ACMG genes with OMIM relevance and VUS >1000 gene',
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
        '#B5D098'
    ]
  };
  </script>
      
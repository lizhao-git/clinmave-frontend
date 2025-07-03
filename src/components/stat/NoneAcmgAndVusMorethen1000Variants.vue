<template>
    <div style="margin-bottom: 50px;">
      <BarChart :chartData="chartData" :yAxisNameGap="50" chartHeight="500px" />
    </div>
  </template>
  
  <script setup>
  import BarChart from '@/components/Visualization/BarChart.vue';
  
  const chartData = {
    title: 'Non-ACMG genes with OMIM relevance and VUS >1000 in ClinVar gene variants',
    xAxisData: [
      'BAP1', 'CHEK2', 'EGFR', 'SMARCA4', 
      'CBL', 'WNK1', 'ANK2', 'SPTAN1', 'PCLO',
      'NEB', 'KMT2A', 'CHD7'
    ],
    yAxisData: [
      14927, 12283, 9605, 5679, 5473,
      2336, 1808, 1553, 1439, 1378,
      1257, 972
    ],
    xAxisName: 'ACMG guideline-recommended genes',
    yAxisName: '#Variants',
    seriesName: '#Variants',
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
      
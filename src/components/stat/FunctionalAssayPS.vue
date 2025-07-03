<template>
    <div style="margin-bottom: 50px;">
      <PieChart 
        :chartData="molecularConsequenceData" 
        chartHeight="500px"
        :colors="customColors"
        legendPosition="bottom" 
      />
    </div>
  </template>
  
  <script setup>
  import PieChart from '@/components/Visualization/PieChart.vue';

  const customColors = [
    '#368EE0', // Missense
    '#6DBB90', // Synonymous
    '#E599C5', // Nonsense
    '#F0B9B8', // Frameshift
  ];
  
  const molecularConsequenceData = {
    title: 'Functional Assay Percentage Statistics',
    seriesName: '数量',
    seriesData: [
      { value: 2110, name: 'Cellular fitness' },
      { value: 16, name: 'Protein abundance and stability' },
      { value: 13, name: 'Specialized molecular function' },
      { value: 5, name: 'Protein binding' },
    ]
  };
  </script>
      
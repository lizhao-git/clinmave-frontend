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
    '#368EE0',
    '#6DBB90'
  ];
  
  const molecularConsequenceData = {
    title: 'MAVE Technique Percentage Statistics',
    seriesName: '#Datasets',
    seriesData: [
      { value: 1672, name: 'CRISPR-Based Genome Editing  ' },
      { value: 472, name: 'Deep Mutational Scanning  ' }
    ]
  };
  </script>
      
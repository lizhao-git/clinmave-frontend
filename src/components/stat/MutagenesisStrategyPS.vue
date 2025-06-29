<template>
    <div style="margin-bottom: 50px;">
      <h3 class="text-xl font-bold mb-4 text-gray-800">Mutagenesis Strategy Percentage Statistics</h3>
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
    '#B5D098', // UTR
    '#A0D9D9', // Splice site
  ];
  
  const molecularConsequenceData = {
    title: 'Mutagenesis Strategy Percentage Statistics',
    seriesName: '数量',
    seriesData: [
      { value: 1657, name: 'Base editing' },
      { value: 447, name: 'Oligonucleotide synthesis' },
      { value: 24, name: 'Mutagenic PCR' },
      { value: 8, name: 'Saturation genome editing' },
      { value: 7, name: 'Prime editing' },
      { value: 1, name: 'mutagenic PCR' }
    ]
  };
  </script>
      
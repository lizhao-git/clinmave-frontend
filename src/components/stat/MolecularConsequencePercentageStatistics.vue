<template>
    <div style="margin-bottom: 50px;">
      <h3 class="text-xl font-bold mb-4 text-gray-800">Molecular Consequence Percentage Statistics</h3>
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
    '#D6893D', // Stop_lost
  ];
  
  const molecularConsequenceData = {
    title: '',
    seriesName: '#Variants',
    seriesData: [
      { value: 1378955, name: 'Missense' },
      { value: 268383, name: 'Synonymous' },
      { value: 35823, name: 'Nonsense' },
      { value: 2797, name: 'Frameshift' },
      { value: 2439, name: 'UTR' },
      { value: 1872, name: 'Splice site' },
      { value: 176, name: 'Stop_lost' }
    ]
  };
  </script>
      
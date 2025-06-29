<template>
   <div class="chart-container-wrapper">
    <div class="download-btn-container">
      <button class="download-btn" @mouseover="showCard = true" @mouseout="showCard = false">
        <v-icon size="20">mdi-download</v-icon>
      </button>
      <div
        v-show="showCard"
        @mouseover="showCard = true"
        @mouseout="showCard = false"
        class="download-menu"
      >
        <button class="menu-item" @click="downloadChart('svg')">Download SVG</button >
        <button class="menu-item" @click="downloadChart('pdf')">Download PDF</button >
      </div>
    </div>
    <div class="chart-container" ref="chartRef"></div>
  </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, watch } from 'vue';
  import * as echarts from 'echarts';
  
  const props = defineProps({
    chartData: {
      type: Object,
      required: true,
      default: () => ({
        title: '',
        seriesName: '',
        seriesData: []
      })
    },
    chartHeight: {
      type: String,
      default: '400px'
    },
    colors: {
      type: Array,
      default: () => [
        '#368EE0', '#6DBB90', '#E599C5', '#F0B9B8', 
        '#B5D098', '#A0D9D9', '#D6893D', '#BFAE52'
      ]
    },
    legendPosition: {
      type: String,
      default: 'right'
    }
  });
  const showCard = ref(false);
  const chartRef = ref(null);
  let chartInstance = null;
  
  const initChart = () => {
    if (!chartRef.value) return;
    
    chartInstance = echarts.init(chartRef.value);
    
    const option = {
      title: {
        text: props.chartData.title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        textStyle: {
          color: '#333'
        }
      },
      legend: {
        type: 'scroll',
        orient: props.legendPosition === 'right' ? 'vertical' : 'horizontal',
        right: props.legendPosition === 'right' ? 10 : 'auto',
        bottom: props.legendPosition === 'bottom' ? 10 : 'auto',
        left: props.legendPosition === 'left' ? 10 : 'auto',
        top: props.legendPosition === 'top' ? 10 : 'auto',
        data: props.chartData.seriesData.map(item => item.name),
        pageButtonItemGap: 5,
        pageButtonStyle: {
          color: '#666'
        },
        textStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          name: props.chartData.seriesName,
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '55%'],
          data: props.chartData.seriesData,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            formatter: '{b}: {d}%',
            fontStyle: 'normal',
            fontSize: 12
          },
          labelLine: {
            length: 10,
            length2: 20
          }
        }
      ],
      color: props.colors
    };
    
    chartInstance.setOption(option);
  };
  
  const resizeChart = () => {
    if (chartInstance) {
      chartInstance.resize();
    }
  };
  
  onMounted(() => {
    initChart();
    window.addEventListener('resize', resizeChart);
  });
  
  onUnmounted(() => {
    if (chartInstance) {
      window.removeEventListener('resize', resizeChart);
      chartInstance.dispose();
      chartInstance = null;
    }
  });
  
  watch(() => props.chartData, () => {
    if (chartInstance) {
      chartInstance.setOption({
        series: [
          {
            data: props.chartData.seriesData
          }
        ]
      });
    }
  }, { deep: true });
  </script>
  
  <style scoped>
  .chart-container {
    width: 100%;
    height: v-bind(chartHeight);
  }
  .chart-container-wrapper {
    position: relative;
    width: 100%;
    height: 400px; /* 图表高度，可自定义 */
  }

  .download-btn-container {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
  }

  /* 下载按钮样式 */
  .download-btn {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .download-btn i {
    color: #333;
    font-size: 16px;
  }

  /* 下载菜单样式 */
  .download-menu {
    position: absolute;
    top: 28px; /* 按钮高度 + 间距 */
    right: 0;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    padding: 8px 0;
    min-width: 120px;
    z-index: 20;
  }

  .menu-item {
    width: 100%;
    text-align: left;
    padding: 6px 10px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #333;
    transition: background-color 0.2s;
  }

  .menu-item:hover {
    background-color: #f5f5f5;
  }
  </style>
      
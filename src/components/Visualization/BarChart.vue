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
  import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
  import * as echarts from 'echarts';
  import html2pdf from 'html2pdf.js';
  
  const props = defineProps({
    chartData: {
      type: Object,
      required: true
    },
    chartHeight: {
      type: String,
      default: '400px'
    },
    rotateXAxisLabel: {
      type: Number,
      default: 45
    },
    xAxisNameGap: {
      type: Number,
      default: 55
    },
    yAxisNameGap: {
      type: Number,
      default: 30
    }
  });
  const showCard = ref(false);
  const chartRef = ref(null);
  let chartInstance = null;
  
  const initChart = () => {
    if (!chartRef.value) return;
    
    chartInstance = echarts.init(chartRef.value);

    const itemStyle = props.chartData.colors.length 
    ? { color: (params) => props.chartData.colors[params.dataIndex % props.chartData.colors.length] }
    : { color: props.chartData.colors };

    const option = {
      title: {
        text: props.chartData.title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'normal',
          color: 'black'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        textStyle: {
          color: 'black',
          fontFamily: 'Arial'
        }
      },
      grid: {
        left: '5%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: props.chartData.xAxisData,
        nameTextStyle: {
          fontFamily: 'Arial',
          fontSize: 14,        
          fontWeight: 'normal',
        },
        axisLabel: {
          rotate: props.rotateXAxisLabel,
          interval: 0,
          fontSize: 14,
          align: props.rotateXAxisLabel > 0 ? 'right' : 'center'
        },
        axisTick: {
          show: true
        },
        axisLine: {
          lineStyle: {
            color: 'black'
          }
        },
        name: props.chartData.xAxisName,
        nameLocation: 'middle',
        nameGap: props.xAxisNameGap // 调整标题与轴线的距离
      },
      yAxis: {
        type: 'value',
        nameTextStyle: {
          fontFamily: 'Arial',
          fontSize: 14,        
          fontWeight: 'normal',
        },
        axisLabel: {
          fontSize: 14,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: 'black'
          }
        },
        axisTick: {
          show: true
        },
        splitLine: {
          lineStyle: {
            color: '#eee'
          }
        },
        name: props.chartData.yAxisName,
        nameLocation: 'middle',
        nameGap: props.yAxisNameGap // 调整标题与轴线的距离
      },
      series: [
        {
          name: props.chartData.seriesName || '数据',
          type: 'bar',
          data: props.chartData.yAxisData,
          itemStyle: itemStyle,
          barWidth: '60%'
        }
      ]
    };
    
    chartInstance.setOption(option);

    chartInstance.off('click');  // 确保旧的监听被清除
    chartInstance.on('click', (params) => {
    if (params.componentType === 'series') {
      const geneId = params.name; // 假设 xAxis 的 name 是 gene id
      window.open(`/clinmave/browse/gene/${geneId}`, '_blank'); // 在新标签页打开
    }
});
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
        xAxis: {
          data: props.chartData.xAxisData
        },
        yAxis: {
          name: props.chartData.yAxisName
        },
        series: [
          {
            data: props.chartData.yAxisData
          }
        ]
      });
    }
  }, { deep: true });

  const downloadChart = (type) => {
    if (!chartInstance) return;
    
    const fileName = props.chartData.title || 'chart';
    
    if (type === 'svg') {
      // 导出为SVG
      const svgData = chartInstance.getDataURL({
        type: 'svg',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      
      const link = document.createElement('a');
      link.href = svgData;
      link.download = `${fileName}.svg`;
      link.click();
    } else if (type === 'pdf') {
      // 导出为PDF
      nextTick(() => {
        const chartContainer = chartRef.value;
        const opt = {
          margin: 10,
          filename: `${fileName}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        
        html2pdf().from(chartContainer).set(opt).save();
      });
    }
  };
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
      
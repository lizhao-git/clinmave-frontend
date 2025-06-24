<template>
  <v-container>
    <v-card flat>
      <v-card-text>
        <!-- 散点图容器 -->
        <div ref="chartContainer" style="position: relative; width: fit-content;">
          <svg ref="svg" :width="size" :height="size"></svg>

          <!-- 悬浮卡片 -->
          <v-card
            v-if="tooltip.visible"
            class="pa-2"
            elevation="6"
            style="position: absolute; z-index: 10; pointer-events: none; background-color: white;"
            :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
          >
            <table style="font-family: Arial; font-size: 12px; border-collapse: collapse;">
              <tr><td><strong>ID:</strong></td><td>{{ tooltip.data.identifier }}</td></tr>
              <tr><td><strong>Class:</strong></td><td>{{ tooltip.data.class }}</td></tr>
              <tr><td><strong>Score:</strong></td><td>{{ tooltip.data.score }}</td></tr>
              <tr><td><strong>gnomAD AF:</strong></td><td>{{ formatAf(tooltip.data.af) }}</td></tr>
            </table>
          </v-card>
        </div>

        <!-- 图例 -->
        <div class="d-flex justify-center mt-3" :style="{ width: size + 'px' }">
          <div class="d-flex justify-space-around" style="width: 100%;">
            <div v-for="(color, key) in colorMap" :key="key" class="d-flex align-center">
              <div :style="{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color, marginRight: '6px' }"></div>
              <span style="font-family: Arial; font-size: 12px;">{{ key }}</span>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'

// Props
const props = defineProps({
  scatterData: {
    type: Array,
    required: true,
    default: () => [],
  },
  size: {
    type: Number,
    default: 500,
  },
  colorMap: {
    type: Object,
    default: () => ({
      Missense: '#42A5F5',
      Nonsense: '#EF5350',
      Synonymous: '#66BB6A',
    }),
  },
})

const svg = ref(null)
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  data: {},
})

// 格式化 af 为科学计数法字符串
function formatAf(af) {
  return af.toExponential(3); // 保留 3 位有效数字，例如 3.977e-6
}

function drawChart() {
  const margin = { top: 20, right: 20, bottom: 50, left: 50 }
  const width = props.size - margin.left - margin.right
  const height = props.size - margin.top - margin.bottom

  const svgEl = d3.select(svg.value)
  svgEl.selectAll('*').remove()

  const chart = svgEl
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 过滤无效数据
  console.log('Data length:', props.scatterData)
  const validData = props.scatterData.filter(d => d.af > 0 && !isNaN(d.af) && !isNaN(d.score))

  // X 轴：对数比例尺
  const x = d3
    .scaleLog()
    .domain([1e-9, 1]) // 从 10^-9 到 1
    .range([0, width])

  // Y 轴：支持负值
  const y = d3
    .scaleLinear()
    .domain([
      d3.min(validData, (d) => d.score) * 1.1 || -1,
      d3.max(validData, (d) => d.score) * 1.1 || 1,
    ])
    .range([height, 0])

  // X 轴
  chart
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(10, '.0e')) // 科学计数法刻度
    .append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-family', 'Arial')
    .style('font-size', '12px')
    .text('gnomAD genome Allele Frequency')

  // Y 轴
  chart
    .append('g')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -40)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-family', 'Arial')
    .style('font-size', '12px')
    .text('SMuRF Score')

  // 绘制点
  chart
    .selectAll('circle')
    .data(validData)
    .enter()
    .append('circle')
    .attr('cx', (d) => x(d.af))
    .attr('cy', (d) => y(d.score))
    .attr('r', 3)
    .attr('fill', (d) => props.colorMap[d.class] || '#999')
    .on('mouseover', (event, d) => {
      tooltip.value = {
        visible: true,
        x: event.offsetX + 10,
        y: event.offsetY + 10,
        data: d,
      }
    })
    .on('mouseout', () => {
      tooltip.value.visible = false
    })
}

onMounted(drawChart)
watch(() => props.scatterData, drawChart)
</script>
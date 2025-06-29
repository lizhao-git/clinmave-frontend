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
              <tbody>
                <tr><td><strong>ID:</strong></td><td>{{ tooltip.data.identifier }}</td></tr>
                <tr><td><strong>Class:</strong></td><td>{{ tooltip.data.class }}</td></tr>
                <tr><td><strong>Score:</strong></td><td>{{ tooltip.data.score }}</td></tr>
                <tr><td><strong>gnomAD AF:</strong></td><td>{{ formatAf(tooltip.data.af) }}</td></tr>
              </tbody>
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
      'Gain-of-function': '#EF5350',
      'Loss-of-function': '#66BB6A',
      'Functional neutral': '#bcbcbc99',
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
  return af.toExponential(3)
}

// Superscript map for exponent formatting
const superscript = {
  '0': '\u2070',
  '1': '\u00B9',
  '2': '\u00B2',
  '3': '\u00B3',
  '4': '\u2074',
  '5': '\u2075',
  '6': '\u2076',
  '7': '\u2077',
  '8': '\u2078',
  '9': '\u2079',
  '-': '\u207B',
}

// Convert exponent to superscript (e.g. -9 → ⁻⁹)
function toSuperscript(n) {
  return String(n).split('').map(c => superscript[c] || c).join('')
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

  const validData = props.scatterData.filter(d => d.af > 0 && !isNaN(d.af) && !isNaN(d.score))

  // Optimize x-axis domain based on data
  const afValues = validData.map(d => d.af)
  const minAf = d3.min(afValues) / 1.5 // Add padding to minimum
  const maxAf = d3.max(afValues) * 1.5 // Add padding to maximum
  const xDomain = [Math.max(1e-10, minAf), Math.min(1, maxAf)] // Ensure domain is within reasonable bounds

  const x = d3
    .scaleLog()
    .domain(xDomain)
    .range([0, width])

  const y = d3
    .scaleLinear()
    .domain([
      d3.min(validData, (d) => d.score) * 1.1 || -1,
      d3.max(validData, (d) => d.score) * 1.1 || 1,
    ])
    .range([height, 0])

  // 自定义 tick format 为数学格式
  const xAxis = d3.axisBottom(x)
    .ticks(10)
    .tickFormat(d => {
      const log = Math.log10(d)
      if (Number.isInteger(log)) {
        return d === 1 ? '1' : `10${toSuperscript(log)}`
      }
      return ''
    })

  const xAxisG = chart
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)

  // 加长主刻度线（1eX）
  xAxisG.selectAll('.tick line')
    .attr('y2', d => Number.isInteger(Math.log10(d)) ? 10 : 5)

  xAxisG
    .append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-family', 'Arial')
    .style('font-size', '12px')
    .text('gnomAD genome Allele Frequency')

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

  chart
    .selectAll('circle')
    .data(validData)
    .enter()
    .append('circle')
    .attr('cx', d => x(d.af))
    .attr('cy', d => y(d.score))
    .attr('r', 3)
    .attr('fill', d => props.colorMap[d.class] || '#999')
    .on('mouseover', (event, d) => {
      tooltip.value = {
        visible: true,
        x: event.offsetX + 10,
        y: event.offsetY + 10,
        data: d,
      }
    })
    .on('mousemove', (event) => {
      tooltip.value.x = event.offsetX + 10
      tooltip.value.y = event.offsetY + 10
    })
    .on('mouseout', () => {
      tooltip.value.visible = false
    })
}

onMounted(drawChart)
watch(() => props.scatterData, drawChart)
</script>
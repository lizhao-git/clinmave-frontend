<template>
  <v-container class="d-flex justify-center">
    <v-card flat :style="{ width: size + 'px' }">
      <v-card-text class="d-flex flex-column align-center" style="overflow: visible; position: relative;">
        <!-- Chart title -->
        <h4 v-if="titleFlag" class="text-center">
          Scatter plot between gnomAD frequency and functional score
        </h4>

        <!-- Chart container -->
        <div ref="chartContainer" :style="{ width: size + 'px', position: 'relative' }">
          <svg ref="svg" :width="size" :height="size" style="overflow: visible;"></svg>
        </div>

        <!-- Legend -->
        <div class="d-flex justify-center mt-3" :style="{ width: size + 'px' }">
          <div class="d-flex justify-space-around" style="width: 100%;">
            <div v-for="(color, key) in colorMap" :key="key" class="d-flex align-center">
              <svg width="14" height="14" style="margin-right: 7px; flex-shrink: 0;">
                <circle cx="7" cy="7" r="7" :fill="color" />
              </svg>
              <span style="font-family: Arial; font-size: 14px;">{{ key }}</span>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Tooltip rendered at top level -->
    <teleport to="body">
      <div
        v-if="tooltip.visible"
        class="custom-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <table style="font-family: Arial; font-size: 14px; border-collapse: collapse;">
          <tbody>
            <tr><td>Identifier:</td><td>{{ tooltip.data.identifier }}</td></tr>
            <tr><td>Class:</td><td><v-chip density="compact" :color="colorMap[tooltip.data.class] || '#bcbcbc99'">{{ tooltip.data.class }}</v-chip></td></tr>
            <tr><td>Functional score:</td><td>{{ tooltip.data.score }}</td></tr>
            <tr><td style="padding-right: 10px;">gnomAD AF:</td><td>{{ formatAf(tooltip.data.af) }}</td></tr>
          </tbody>
        </table>
      </div>
    </teleport>
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  scatterData: {
    type: Array,
    required: true
  },
  size: {
    type: Number,
    default: 300
  },
  colorMap: {
    type: Object,
    default: () => ({
      'Gain-of-function': '#CC0000',
      'Loss-of-function': '#0072B2',
      'Functional neutral': '#bcbcbc',
    })
  },
  titleFlag: {
    type: Boolean,
    default: false
  }
})

const svg = ref(null)

const tooltip = ref({
  visible: false,
  x: 10,
  y: 10,
  data: {}
})

// Superscript formatter
const superscript = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻'
}
function toSuperscript(n) {
  return String(n).split('').map(c => superscript[c] || c).join('')
}
function formatAf(af) {
  return af.toExponential(3)
}

function drawChart() {
  const margin = { top: 20, right: 0, bottom: 50, left: 60 }
  const width = props.size - margin.left - margin.right
  const height = props.size - margin.top - margin.bottom

  const svgEl = d3.select(svg.value)
  svgEl.selectAll('*').remove()

  const chart = svgEl.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const validData = props.scatterData.filter(d => d.af > 0 && !isNaN(d.af) && !isNaN(d.score))
  const afValues = validData.map(d => d.af)
  const minAf = d3.min(afValues) / 1.5
  const maxAf = d3.max(afValues) * 1.5
  const xDomain = [Math.max(1e-10, minAf), Math.min(1, maxAf)]

  const x = d3.scaleLog().domain(xDomain).range([0, width])
  const y = d3.scaleLinear()
    .domain([
      d3.min(validData, d => d.score) * 1.1 || -1,
      d3.max(validData, d => d.score) * 1.1 || 1
    ])
    .range([height, 0])

  const xAxis = d3.axisBottom(x)
    .ticks(10)
    .tickFormat(d => {
      const log = Math.log10(d)
      return Number.isInteger(log) ? (d === 1 ? '1' : `10${toSuperscript(log)}`) : ''
    })

  const xAxisG = chart.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)

  xAxisG.selectAll('.tick line').attr('y2', d => Number.isInteger(Math.log10(d)) ? 10 : 5)
  xAxisG.append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-family', 'Arial')
    .style('font-size', '14px')
    .text('gnomAD genome Allele Frequency')

  chart.append('g')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -40)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-family', 'Arial')
    .style('font-size', '14px')
    .text('Functional score')

  chart.selectAll('circle')
    .data(validData)
    .enter()
    .append('circle')
    .attr('cx', d => x(d.af))
    .attr('cy', d => y(d.score))
    .attr('r', 3)
    .attr('fill', d => props.colorMap[d.class] || '#999')
    .attr('class', 'scatter-point')
    .on('mouseover', (event, d) => {
      d3.select(event.currentTarget)
        .attr('r', 6)
        .attr('stroke', d => props.colorMap[d.class] || '#999')
        .attr('stroke-width', 1)
        .classed('hovered', true)
      tooltip.value = {
        visible: true,
        x: event.clientX + 10,
        y: event.clientY + 10,
        data: d
      }
    })
    .on('mousemove', event => {
      tooltip.value.x = event.clientX + 10
      tooltip.value.y = event.clientY + 10
    })
    .on('mouseout', (event) => {
      d3.select(event.currentTarget)
        .attr('r', 3)
        .attr('stroke', 'none')
        .classed('hovered', false)
      tooltip.value.visible = false
    })
}

onMounted(drawChart)
watch(() => props.scatterData, drawChart)
</script>

<style scoped>
svg {
  font-family: Arial, sans-serif;
}

.custom-tooltip {
  position: fixed;
  z-index: 99999;
  background-color: white;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.scatter-point {
  transition: all 0.2s ease;
}

.scatter-point.hovered {
  transform: translateY(-2px);
}
</style>
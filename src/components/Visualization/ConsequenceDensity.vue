<template>
  <v-container>
    <!-- Chart title -->
    <v-card-text class="d-flex flex-column">
      <h4 v-if="titleFlag" class="text-center">
        Functional score distribution across molecular consequence categories
      </h4>

      <div ref="chartWrapper" style="position: relative; width: 100%;">
        <svg ref="svg" :height="height"></svg>
      </div>
    </v-card-text>

    <!-- Tooltip rendered globally to avoid being clipped -->
    <teleport to="body">
      <div
        v-if="tooltip.visible"
        class="custom-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <table style="font-family: Arial; font-size: 14px; border-collapse: collapse;">
          <tbody>
            <tr><td>Dataset:</td><td>{{ tooltip.data.dataset }}</td></tr>
            <tr><td>Score:</td><td>{{ tooltip.data.score?.toFixed(2) }}</td></tr>
            <tr><td>Mutation:</td><td>{{ tooltip.data.mutations }}</td></tr>
          </tbody>
        </table>
      </div>
    </teleport>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

// Props
const props = defineProps({
  data: { type: Array, required: true },
  smoothing: { type: Number, default: 0.02 },
  titleFlag: { type: Boolean, default: false }
})

// Mutation categories
const categories = [
  'Synonymous', 'Stop-gained', 'Missense', 'Codon deletion',
  'Frameshift', 'Intron', 'Splice site', 'UTR'
]

// Refs and settings
const svg = ref(null)
const chartWrapper = ref(null)
const rowHeight = 50
const margin = { top: 40, right: 30, bottom: 40, left: 120 }
const height = ref(300)
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  data: {}
})

// Color scale
const colorMap = d3.scaleOrdinal()
  .domain(categories)
  .range(d3.schemeTableau10)

function drawChart(rawData) {
  const containerWidth = chartWrapper.value.clientWidth
  const width = containerWidth

  d3.select(svg.value).selectAll('*').remove()

  const categoryData = categories
    .map(cat => {
      const group = rawData.find(d => d.dataset === cat)
      return group && group.mutations?.length > 0 ? { ...group, dataset: cat } : null
    })
    .filter(Boolean)

  const numRows = categoryData.length
  height.value = margin.top + margin.bottom + rowHeight * numRows

  const svgSel = d3.select(svg.value)
    .attr('width', width)
    .attr('height', height.value)

  const allScores = rawData.flatMap(d => d.mutations.map(m => m.score))
  const x = d3.scaleLinear()
    .domain([d3.min(allScores), d3.max(allScores)])
    .range([margin.left, width - margin.right])

  // X-axis
  const xAxis = d3.axisBottom(x).ticks(8)
  svgSel.append('g')
    .attr('transform', `translate(0, ${height.value - margin.bottom})`)
    .call(xAxis)
    .append('text')
    .attr('x', (width - margin.left - margin.right) / 2 + margin.left)
    .attr('y', 35)
    .attr('text-anchor', 'middle')
    .text('Functional score')
    .style('font-size', '14px')
    .style('fill', 'black')

  // KDE
  const kde = (kernel, X) => V => X.map(x => [x, d3.mean(V, v => kernel(x - v))])
  const epanechnikov = k => v => Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0
  const xTicks = x.ticks(100)

  categoryData.forEach((group, i) => {
    const groupY = margin.top + i * rowHeight + rowHeight / 2

    svgSel.append('text')
      .attr('x', margin.left - 10)
      .attr('y', groupY)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .text(group.dataset)
      .style('font-size', '12px')

    const values = group.mutations.map(d => d.score)
    const density = kde(epanechnikov(props.smoothing), xTicks)(values)
    const maxDensity = d3.max(density, d => d[1])

    const area = d3.area()
      .curve(d3.curveBasis)
      .x(d => x(d[0]))
      .y0(groupY)
      .y1(d => groupY - d[1] * (rowHeight / 2) / maxDensity)

    svgSel.append('path')
      .datum(density)
      .attr('fill', colorMap(group.dataset))
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .attr('d', area)

    // Rug lines with tooltip
    svgSel.selectAll(`.rug-${i}`)
      .data(group.mutations)
      .enter()
      .append('line')
      .attr('x1', d => x(d.score))
      .attr('x2', d => x(d.score))
      .attr('y1', groupY + 5)
      .attr('y2', groupY + 10)
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .on('mouseover', (event, d) => {
        tooltip.value.visible = true
        tooltip.value.data = { ...d, dataset: group.dataset }
        tooltip.value.x = event.clientX + 12
        tooltip.value.y = event.clientY + 12
      })
      .on('mousemove', event => {
        tooltip.value.x = event.clientX + 12
        tooltip.value.y = event.clientY + 12
      })
      .on('mouseleave', () => {
        tooltip.value.visible = false
      })
  })
}

onMounted(() => nextTick(() => drawChart(props.data)))
watch(() => props.data, () => nextTick(() => drawChart(props.data)), { deep: true })
watch(() => props.smoothing, () => nextTick(() => drawChart(props.data)))
</script>

<style scoped>
svg {
  font-family: Arial, sans-serif;
}

.custom-tooltip {
  position: fixed;
  z-index: 9999;
  background-color: white;
  padding: 10px;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}
</style>

<template>
  <v-container>
    <!-- 图表标题 -->
    <v-card-text class="d-flex flex-column">
      <h3 v-if="titleFlag" class="font-weight-bold text-center">
        Scatter plot between gnomAD frequency and functional score
      </h3>
      <div ref="chartWrapper" style="position: relative; width: 100%;">
        <svg ref="svg" :height="height"></svg>
      </div>
    </v-card-text>
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

// Fixed mutation categories
const categories = [
  'Synonymous',
  'Stop-gained',
  'Missense',
  'Codon deletion',
  'Frameshift',
  'Intron',
  'Splice site',
  'UTR'
]

// Refs
const svg = ref(null)
const chartWrapper = ref(null)
const rowHeight = 60
const margin = { top: 60, right: 30, bottom: 40, left: 120 }
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

  // Bottom axis
  const xAxis = d3.axisBottom(x).ticks(8)
  svgSel.append('g')
    .attr('transform', `translate(0, ${height.value - margin.bottom})`)
    .call(xAxis)
    .append('text')
    .attr('x', width - margin.right)
    .attr('y', 35)
    .attr('text-anchor', 'end')
    .text('Functional score')
    .style('font-size', '14px')

  // KDE setup
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

    // Rug lines
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
        tooltip.value.x = event.pageX + 10
        tooltip.value.y = event.pageY + 10
      })
      .on('mousemove', event => {
        tooltip.value.x = event.pageX + 10
        tooltip.value.y = event.pageY + 10
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
</style>

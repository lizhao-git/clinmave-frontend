<template>
  <div ref="chartRef" class="scatter-chart">
    <svg ref="svgRef" :width="totalSize" :height="totalSize" style="overflow: visible;"></svg>
    <!-- Tooltip -->
    <teleport to="body">
      <div
        v-if="tooltip.visible"
        class="custom-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <table style="font-family: Arial; font-size: 14px; border-collapse: collapse;">
          <tbody>
            <tr><td>Identifier:</td><td>{{ tooltip.data.title }}</td></tr>
            <tr><td>Abnormal Proportion:</td><td>{{ tooltip.data.abProp.toFixed(2) }}</td></tr>
            <tr><td>Cumulative Density:</td><td>{{ tooltip.data.cumulative_density.toFixed(2) }}</td></tr>
            <tr><td style="padding-right: 12px;">Mutation Count:</td><td>{{ formatVarNum(tooltip.data.varNum) }}</td></tr>
          </tbody>
        </table>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const chartRef = ref(null)
const svgRef = ref(null)
const tooltip = ref({
  visible: false,
  x: 10,
  y: 10,
  data: {}
})

const totalSize = 400
const margin = { top: 40, right: 80, bottom: 50, left: 50 }
const plotWidth = totalSize - margin.left - margin.right
const plotHeight = plotWidth

function formatVarNum(varNum) {
  return varNum >= 1000 ? varNum.toExponential(3) : varNum.toFixed(0)
}

function preprocessData(data) {
  const sorted = [...data].sort((a, b) => a.varNum - b.varNum)
  const n = sorted.length
  return sorted.map((d, i) => ({
    ...d,
    cumulative_density: (i + 1) / n
  }))
}

function renderScatter() {
  if (!chartRef.value || !props.data.length) return

  const dataset = preprocessData(props.data)

  d3.select(chartRef.value).selectAll('svg').remove()

  const svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', totalSize)
    .attr('height', totalSize)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleLinear()
    .domain(d3.extent(dataset, d => d.varNum))
    .nice()
    .range([0, plotWidth])

  const y = d3.scaleLinear()
    .domain([0, 1])
    .range([plotHeight, 0])

  const color = d3.scaleLinear()
    .domain([0, 0.5, 1])
    .range(['#4575b4', '#f7f7f7', '#d73027'])

  const xAxis = d3.axisBottom(x)
    .ticks(Math.min(10, Math.floor(plotWidth / 50)))
    .tickFormat(d => (d >= 1000 ? d / 1000 + 'k' : d))

  svg.append('g')
    .attr('transform', `translate(0,${plotHeight})`)
    .call(xAxis)
    .call(g => g.selectAll('.tick text').style('font-size', '12px').style('font-family', 'Arial'))
    .call(g => g.select('.domain').attr('stroke', '#333'))

  svg.append('text')
    .attr('x', plotWidth / 2)
    .attr('y', plotHeight + margin.bottom - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .text('Mutation Count')

  svg.append('g')
    .call(d3.axisLeft(y))
    .call(g => g.selectAll('.tick text').style('font-size', '12px').style('font-family', 'Arial'))
    .call(g => g.select('.domain').attr('stroke', '#333'))

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -plotHeight / 2)
    .attr('y', -margin.left + 15)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .text('Cumulative Density')

  svg.selectAll('circle')
    .data(dataset)
    .join('circle')
    .attr('cx', d => x(d.varNum))
    .attr('cy', d => y(d.cumulative_density))
    .attr('r', 4)
    .style('fill', d => color(d.abProp))
    .style('opacity', 0.9)
    .on('mouseover', (event, d) => {
      d3.select(event.currentTarget)
        .attr('r', 6)
        .attr('stroke', d => color(d.abProp))
        .attr('stroke-width', 1)
        .classed('hovered', true)
      tooltip.value = {
        visible: true,
        x: event.clientX + 10,
        y: event.clientY + 10,
        data: d
      }
      console.log('Tooltip data:', tooltip.value)
    })
    .on('mousemove', (event) => {
      tooltip.value.x = event.clientX + 10
      tooltip.value.y = event.clientY + 10
    })
    .on('mouseout', (event) => {
      d3.select(event.currentTarget)
        .attr('r', 4)
        .attr('stroke', 'none')
        .classed('hovered', false)
      tooltip.value.visible = false
    })

  // Legend
  const legendWidth = 12
  const legendHeight = 120
  const legendMargin = 10
  const legendTitleHeight = 20

  const defs = svg.append('defs')
  const linearGradientId = 'legend-gradient'

  const linearGradient = defs.append('linearGradient')
    .attr('id', linearGradientId)
    .attr('x1', '0%').attr('y1', '100%')
    .attr('x2', '0%').attr('y2', '0%')

  linearGradient.selectAll('stop')
    .data([
      { offset: '0%', color: '#4575b4' },
      { offset: '50%', color: '#f7f7f7' },
      { offset: '100%', color: '#d73027' }
    ])
    .join('stop')
    .attr('offset', d => d.offset)
    .attr('stop-color', d => d.color)

  svg.append('text')
    .attr('x', plotWidth + legendMargin + legendWidth / 2)
    .attr('y', (plotHeight - legendHeight) / 2 - 8)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .text('Abnormal proportion')

  svg.append('rect')
    .attr('x', plotWidth + legendMargin)
    .attr('y', (plotHeight - legendHeight) / 2 + legendTitleHeight / 2)
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', `url(#${linearGradientId})`)

  const legendScale = d3.scaleLinear()
    .domain([0, 1])
    .range([(plotHeight + legendHeight) / 2 + legendTitleHeight / 2, (plotHeight - legendHeight) / 2 + legendTitleHeight / 2])

  const legendAxis = d3.axisRight(legendScale)
    .ticks(5)

  svg.append('g')
    .attr('class', 'legend-axis')
    .attr('transform', `translate(${plotWidth + legendMargin + legendWidth},0)`)
    .call(legendAxis)
    .call(g => g.selectAll('.tick text').style('font-size', '12px').style('font-family', 'Arial'))
    .call(g => g.select('.domain').attr('stroke', '#333'))
}

onMounted(() => {
  renderScatter()
})

watch(() => props.data, () => {
  renderScatter()
}, { deep: true })
</script>

<style scoped>
.scatter-chart {
  position: relative;
  width: 400px;
  height: 400px;
  margin: auto;
}

.custom-tooltip {
  position: fixed;
  z-index: 99999;
  background-color: white;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.scatter-point {
  transition: all 0.2s ease;
}

.scatter-point.hovered {
  transform: translateY(-2px);
}
</style>
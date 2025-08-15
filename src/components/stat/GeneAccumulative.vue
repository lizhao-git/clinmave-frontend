<template>
  <div ref="chartRef" class="scatter-chart">
    <teleport to="body">
      <div
        v-if="tooltipVisible"
        class="custom-tooltip"
        :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }"
      >
        <table style="font-family: Arial; font-size: 14px; border-collapse: collapse;">
          <tbody>
            <tr v-for="(item, index) in tooltipContent.data" :key="index">
              <td style="padding-right: 10px;">{{ item.key }}:</td>
              <td>{{ item.value }}</td>
            </tr>
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
const tooltipVisible = ref(false)
const tooltipPosition = ref({ x: 10, y: 10 })
const tooltipContent = ref({ data: [] })

function brightenColor(color, amount = 0.2) {
  const c = d3.hsl(color)
  c.l += (1 - c.l) * amount
  return c.toString()
}

function preprocessData(rawData) {
  const sorted = [...rawData].sort((a, b) => a.oddsPath - b.oddsPath)
  const n = sorted.length
  return sorted.map((d, i) => ({
    ...d,
    cumulative_density: (i + 1) / n
  }))
}

function renderScatter() {
  if (!chartRef.value) return
  if (!props.data.length) return

  const dataset = preprocessData(props.data)

  const totalSize = 400
  const margin = { top: 40, right: 80, bottom: 50, left: 50 }
  const plotWidth = totalSize - margin.left - margin.right
  const plotHeight = plotWidth

  d3.select(chartRef.value).selectAll('svg').remove()

  const svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', totalSize)
    .attr('height', totalSize)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleLinear()
    .domain(d3.extent(dataset, d => d.oddsPath))
    .nice()
    .range([0, plotWidth])

  const y = d3.scaleLinear()
    .domain([0, 1])
    .range([plotHeight, 0])

  // 固定颜色映射
  const color = d3.scaleOrdinal()
    .domain([
      "Unclassified (<2.1)",
      "PS3_supporting (2.1~4.7)",
      "PS3_moderate (4.7~18.7)",
      "PS3_strong (>18.7)"
    ])
    .range(["#b0b0b0", "#4c78a8", "#f28e2b", "#e15759"])

  const xAxis = d3.axisBottom(x)
    .ticks(Math.min(10, Math.floor(plotWidth / 50)))
    .tickFormat(d => d)

  svg.append('g')
    .attr('transform', `translate(0,${plotHeight})`)
    .call(xAxis)

  svg.append('text')
    .attr('x', plotWidth / 2)
    .attr('y', plotHeight + margin.bottom - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .text('Odds of pathogenicity (OddsPath)')

  svg.append('g')
    .call(d3.axisLeft(y))

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -plotHeight / 2)
    .attr('y', -margin.left + 15)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .text('Cumulative Density')

  const circles = svg.selectAll('circle')
    .data(dataset)
    .join('circle')
    .attr('cx', d => x(d.oddsPath))
    .attr('cy', d => y(d.cumulative_density))
    .attr('r', 4)
    .style('fill', d => color(d.classification))
    .style('opacity', 0.9)
    .attr('class', 'mutation-circle')

  circles
    .on('mouseover', function (event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('r', 6)
        .style('fill', brightenColor(color(d.classification)))
        .style('cursor', 'pointer')

      tooltipVisible.value = true
      tooltipPosition.value = {
        x: event.clientX + 10,
        y: event.clientY + 10
      }
      tooltipContent.value = {
        data: [
          { key: 'Gene', value: d.geneName },
          { key: 'Odds Path', value: d.oddsPath },
          { key: 'Classification', value: d.classification }
        ]
      }
    })
    .on('mousemove', function (event) {
      tooltipPosition.value = {
        x: event.clientX + 10,
        y: event.clientY + 10
      }
    })
    .on('mouseout', function () {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('r', 4)
        .style('fill', d => color(d.classification))

      tooltipVisible.value = false
    })

  // legend
  const legendItemSize = 12
  const legendSpacing = 4
  const legendX = plotWidth + margin.right / 2 - 200
  const legendYStart = (plotHeight - (color.domain().length * (legendItemSize + legendSpacing))) / 2

  const legend = svg.append('g')
    .attr('transform', `translate(${legendX}, ${legendYStart})`)

  color.domain().forEach((cls, i) => {
    const legendGroup = legend.append('g')
      .attr('transform', `translate(0, ${i * (legendItemSize + legendSpacing)})`)

    legendGroup.append('rect')
      .attr('width', legendItemSize)
      .attr('height', legendItemSize)
      .attr('fill', color(cls))

    legendGroup.append('text')
      .attr('x', legendItemSize + legendSpacing)
      .attr('y', legendItemSize / 2)
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .text(cls)
  })
}

onMounted(() => {
  renderScatter()
})

watch(() => props.data, () => {
  renderScatter()
})
</script>

<style scoped>
.scatter-chart {
  position: relative;
  width: 400px;
  height: 400px;
  margin: auto;
}

.mutation-circle {
  transition: all 0.15s ease;
}

.custom-tooltip {
  position: fixed;
  z-index: 99999;
  background-color: white;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  transition: opacity 0.15s ease;
}
</style>

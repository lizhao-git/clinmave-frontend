<template>
  <div class="chart-container">
    <!-- 下载按钮组 -->
    <div class="download-menu">

      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="downloadSVG">
            <v-list-item-title>Download SVG</v-list-item-title>
          </v-list-item>
          <v-list-item @click="downloadPDF">
            <v-list-item-title>Download PDF (Hi-Res)</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- 图表 -->
    <svg ref="svgRef" :viewBox="`0 0 ${totalWidth} ${size}`" preserveAspectRatio="xMinYMin meet" />
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import jsPDF from 'jspdf'
import { Canvg } from 'canvg'
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  size: { type: Number, default: 300 },
  legendWidth: { type: Number, default: 60 },
  data: { type: Array, required: true },
  selectionStrategy: { type: String, default: 'both' },
  cutoff: { type: [String, Array], default: '' },
  score: { type: Number, default: null }
})

const totalWidth = computed(() => props.size + props.legendWidth)
const svgRef = ref(null)

// 渲染主图
const renderChart = () => {
  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const margin = { top: 10, right: 10, bottom: 60, left: 60 }
  const width = props.size - margin.left - margin.right
  const height = props.size - margin.top - margin.bottom
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const dataMin = d3.min(props.data)
  const dataMax = d3.max(props.data)
  const rangePadding = 0.5
  const xMin = Math.floor(dataMin - rangePadding)
  const xMax = Math.ceil(dataMax + rangePadding)

  const kernel = epanechnikov(0.5)
  const density = kernelDensityEstimator(kernel, d3.range(xMin, xMax + 0.01, 0.01))(props.data)

  const binWidth = 0.25
  const bins = d3.bin()
    .domain([xMin, xMax])
    .thresholds(d3.range(xMin, xMax + binWidth, binWidth))(props.data)

  bins.forEach(bin => {
    const binWidth = bin.x1 - bin.x0
    bin.density = (bin.length / props.data.length) / binWidth
  })

  const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, width])
  const yScale = d3.scaleLinear().domain([0, 1]).range([height, 0])

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickValues(d3.range(Math.floor(xMin), Math.ceil(xMax) + 1, 1)))
    .call(g => g.selectAll('text').style('font-family', 'Arial').style('font-size', '12px'))

  g.append('g')
    .call(d3.axisLeft(yScale).tickValues([0, 0.2, 0.4, 0.6, 0.8, 1.0]))
    .call(g => g.selectAll('text').style('font-family', 'Arial').style('font-size', '12px'))

  if (props.score !== null && !isNaN(props.score)) {
    const scoreX = xScale(props.score)

    g.append('line')
      .attr('x1', scoreX)
      .attr('x2', scoreX)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')

    g.append('text')
      .attr('x', scoreX)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('fill', '#000')
      .style('font-size', '12px')
      .text(`score: ${props.score}`)
  }

  g.append('text')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 15)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Functional score')

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -margin.left + 15)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Probability density')

  g.append('path')
    .datum(density)
    .attr('d', d3.line()
      .x(d => xScale(d[0]))
      .y(d => yScale(Math.min(d[1], 1)))
      .curve(d3.curveBasis))
    .attr('fill', 'none')
    .attr('stroke', '#1976d2')
    .attr('stroke-width', 2)

  let legendItems = []
  if (props.selectionStrategy === 'both') {
    const cutoffValues = props.cutoff.map(Number)
    const minCutoff = Math.min(...cutoffValues)
    const maxCutoff = Math.max(...cutoffValues)
    legendItems = [
      { label: "LOF", color: "#e41a1c", fill: d3.range(xMin, minCutoff + 0.01, 0.01) },
      { label: "GOF", color: "#1976d2", fill: d3.range(maxCutoff, xMax + 0.01, 0.01) }
    ]
  } else if (props.selectionStrategy === 'positive') {
    legendItems = [{ label: "GOF", color: "#1976d2", fill: d3.range(+props.cutoff, xMax + 0.01, 0.01) }]
  } else if (props.selectionStrategy === 'negative') {
    legendItems = [{ label: "LOF", color: "#e41a1c", fill: d3.range(xMin, +props.cutoff + 0.01, 0.01) }]
  }

  legendItems.forEach(({ color, fill }) => {
    const filledData = density.filter(d => fill.includes(Math.round(d[0] * 100) / 100))
    if (filledData.length > 0) {
      filledData.unshift({ 0: fill[0], 1: 0 })
      filledData.push({ 0: fill.at(-1), 1: 0 })
      g.append('path')
        .datum(filledData)
        .attr('d', d3.area()
          .x(d => xScale(d[0]))
          .y0(yScale(0))
          .y1(d => yScale(Math.min(d[1], 1)))
          .curve(d3.curveBasis))
        .attr('fill', color)
        .attr('opacity', 0.2)
    }
  })

  g.selectAll('rect')
    .data(bins)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.x0) + 1)
    .attr('y', d => yScale(Math.min(d.density, 1)))
    .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 2))
    .attr('height', d => height - yScale(Math.min(d.density, 1)))
    .attr('fill', 'gray')
    .attr('opacity', 0.6)

  const legend = g.append('g')
    .attr('transform', `translate(${width + 10}, 20)`)

  legend.selectAll('.legend-item')
    .data(legendItems)
    .enter()
    .append('g')
    .attr('transform', (d, i) => `translate(0, ${i * 25})`)
    .each(function (d) {
      const item = d3.select(this)
      item.append('rect').attr('width', 18).attr('height', 9)
        .attr('fill', d.color).attr('opacity', 0.2)
      item.append('text').attr('x', 25).attr('y', 9)
        .style('font-size', '12px')
        .text(d.label)
    })
}

function kernelDensityEstimator(kernel, X) {
  return function (V) {
    return X.map(x => [x, d3.mean(V, v => kernel(x - v))])
  }
}
function epanechnikov(h) {
  return x => Math.abs(x /= h) <= 1 ? 0.75 * (1 - x * x) / h : 0
}

const downloadSVG = () => {
  const svg = svgRef.value
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svg)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'chart.svg'
  a.click()
  URL.revokeObjectURL(url)
}

const downloadPDF = async () => {
  const svgElement = svgRef.value
  const svgString = new XMLSerializer().serializeToString(svgElement)

  const scale = 3
  const width = svgElement.clientWidth * scale
  const height = svgElement.clientHeight * scale

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const v = await Canvg.from(ctx, svgString)
  await v.render()

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [width, height] })
  pdf.addImage(imgData, 'PNG', 0, 0, width, height)
  pdf.save('chart.pdf')
}

onMounted(renderChart)
watch(() => [props.data, props.selectionStrategy, props.cutoff, props.score], renderChart, { deep: true })
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}
svg {
  width: 100%;
  height: auto;
  background-color: white;
}
.download-menu {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 4px;
  z-index: 10;
}
</style>

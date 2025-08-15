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
const totalHeight = computed(() => props.size)
const svgRef = ref(null)

const renderChart = () => {
  console.log('Rendering chart with props:', {
    dataLength: props.data.length,
    selectionStrategy: props.selectionStrategy,
    cutoff: props.cutoff,
    score: props.score
  })

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const margin = { top: 10, right: 10, bottom: 75, left: 50 }
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

  const binWidth = 0.2
  const bins = d3.bin()
    .domain([xMin, xMax])
    .thresholds(d3.range(xMin, xMax + binWidth, binWidth))(props.data)

  bins.forEach(bin => {
    const binW = bin.x1 - bin.x0
    bin.density = (bin.length / props.data.length) / binW
  })

  const yMax = Math.max(d3.max(density, d => d[1]), d3.max(bins, d => d.density))
  const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, width])
  const yScale = d3.scaleLinear().domain([0, yMax]).range([height, 0])

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale)
      .tickValues(d3.range(Math.floor(xMin), Math.ceil(xMax) + 1, 2)))
    .call(g => g.selectAll('text')
      .style('font-family', 'Arial')
      .style('font-size', '10px'))

  g.append('g')
    .call(d3.axisLeft(yScale).ticks(3))
    .call(g => g.selectAll('text')
      .style('font-family', 'Arial')
      .style('font-size', '10px'))

  if (props.score !== null && !isNaN(props.score)) {
    const scoreX = xScale(props.score)
    const scoreDensity = density.find(d => Math.abs(d[0] - props.score) < 0.01)?.[1] || 0

    g.append('circle')
      .attr('cx', scoreX)
      .attr('cy', yScale(scoreDensity))
      .attr('r', 4)
      .attr('fill', '#CC0000')

    g.append('text')
      .attr('x', scoreX)
      .attr('y', yScale(scoreDensity) - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#000')
      .style('font-size', '10px')
      .text(`score: ${props.score}`)
  }

  g.append('text')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 45)
    .style('text-anchor', 'middle')
    .style('font-size', '10px')
    .text('Functional score')

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -margin.left + 15)
    .style('text-anchor', 'middle')
    .style('font-size', '10px')
    .text('Probability density')

  g.append('path')
    .datum(density)
    .attr('d', d3.line()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveBasis))
    .attr('fill', 'none')
    .attr('stroke', '#1976d2')
    .attr('stroke-width', 2)

  let legendItems = []
  if (props.selectionStrategy === 'both') {
    const cutoffValues = props.cutoff.map(Number)
    const minCutoff = Math.min(...cutoffValues)
    const maxCutoff = Math.max(...cutoffValues)
    console.log('Cutoff values:', { minCutoff, maxCutoff })
    legendItems = [
      { label: 'Loss-of-function', color: '#0072B2', range: [xMin, minCutoff] },
      { label: 'Gain-of-function', color: '#CC0000', range: [maxCutoff, xMax] }
    ]
  } else if (props.selectionStrategy === 'positive') {
    const cutoff = Number(props.cutoff)
    console.log('Cutoff value:', cutoff)
    legendItems = [{ label: 'Gain-of-function', color: '#CC0000', range: [cutoff, xMax] }]
  } else if (props.selectionStrategy === 'negative') {
    const cutoff = Number(props.cutoff)
    console.log('Cutoff value:', cutoff)
    legendItems = [{ label: 'Loss-of-function', color: '#0072B2', range: [xMin, cutoff] }]
  }

  legendItems.forEach(({ color, range, label }) => {
    const [start, end] = range
    const filledData = density.filter(d => d[0] >= start && d[0] <= end)
    if (filledData.length > 0) {
      const path = d3.path()
      path.moveTo(xScale(start), yScale(0)) // Start at bottom-left
      path.lineTo(xScale(start), yScale(filledData[0][1])) // Vertical line up
      filledData.forEach(d => path.lineTo(xScale(d[0]), yScale(d[1]))) // Follow density curve
      path.lineTo(xScale(end), yScale(filledData[filledData.length - 1][1])) // End at density
      path.lineTo(xScale(end), yScale(0)) // Vertical line down
      path.closePath()

      console.log(`Drawing ${label} area: start=${start}, end=${end}, points=${filledData.length}`)

      g.append('path')
        .attr('d', path)
        .attr('fill', color)
        .attr('opacity', 0.8)
    }
  })

  g.selectAll('rect')
    .data(bins)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.x0) + 0.5)
    .attr('y', d => yScale(d.density))
    .attr('width', d => Math.max(0.5, xScale(d.x1) - xScale(d.x0) - 0.2))
    .attr('height', d => height - yScale(d.density))
    .attr('fill', 'gray')
    .attr('opacity', 0.6)

  const itemHeight = 15
  const rectWidth = 12
  const fontSize = 10
  const legend = g.append('g')
    .attr('transform', `translate(${width / 2 - 60}, ${height + 35})`)

  legend.selectAll('.legend-item')
    .data(legendItems)
    .enter()
    .append('g')
    .attr('transform', (d, i) => `translate(6, ${i * itemHeight + 5})`)
    .each(function (d) {
      const item = d3.select(this)
      item.append('rect')
        .attr('width', rectWidth)
        .attr('height', rectWidth / 2)
        .attr('fill', d.color)
        .attr('opacity', 1)
      item.append('text')
        .attr('x', rectWidth + 6)
        .attr('y', rectWidth / 2 + 1)
        .style('font-size', `${fontSize}px`)
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

<template>
  <div class="chart-container">
    <div class="download-menu">
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text">
            <v-icon>mdi-download</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="downloadSVG">
            <v-list-item-title>Download SVG</v-list-item-title>
          </v-list-item>
          <v-list-item @click="downloadPDF">
            <v-list-item-title>Download PDF</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <svg ref="svgRef" :viewBox="`0 0 ${totalWidth} ${totalHeight}`" preserveAspectRatio="xMinYMin meet" />
  </div>
</template>

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
  right: 10px;
  display: flex;
  gap: 4px;
  z-index: 10;
}
</style>
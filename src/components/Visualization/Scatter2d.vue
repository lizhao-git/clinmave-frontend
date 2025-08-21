<template>
  <v-container class="d-flex justify-center">
    <v-card flat :style="{ width: size + 'px' }">
      <v-card-text class="d-flex flex-column align-center" style="overflow: visible; position: relative;">
        <!-- Title and Help Icon -->
        <div class="title-wrapper">
          <h4 v-if="titleFlag" class="chart-title">
            Scatter plot between gnomAD frequency and functional score
          </h4>
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <div v-bind="props">
                <v-icon style="font-size: 16px;">mdi-help-circle-outline</v-icon>
              </div>
            </template>
            <span>Distance-based scoring method to measure strength tier of functional effect within specific assay. See documentation for further details.</span>
          </v-tooltip>
        </div>

        <!-- Chart container -->
        <div ref="chartContainer" :style="{ width: size + 'px', position: 'relative', 'margin-top': '10px' }">
          <svg ref="svg" :width="size" :height="size" style="overflow: visible;"></svg>
          <!-- Download Button -->
          <div class="download-wrapper" style="position: absolute; top: 5px; right: 5px;">
            <v-btn class="download-btn" variant="text" size="small">
              <v-icon>mdi-download</v-icon>
            </v-btn>
            <v-menu activator="parent">
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
            <tr><td>Classification:</td><td><v-chip density="compact" :color="colorMap[tooltip.data.class] || '#bcbcbc99'">{{ tooltip.data.class }}</v-chip></td></tr>
            <tr><td>Functional score:</td><td>{{ tooltip.data.score }}</td></tr>
            <tr><td style="padding-right: 12px;">gnomAD AF:</td><td>{{ formatAf(tooltip.data.af) }}</td></tr>
          </tbody>
        </table>
      </div>
    </teleport>
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import * as d3 from 'd3'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
      'Functionally normal': '#bcbcbc'
    })
  },
  titleFlag: {
    type: Boolean,
    default: false
  }
})

const svg = ref(null)
const chartContainer = ref(null)

const tooltip = ref({
  visible: false,
  x: 10,
  y: 10,
  data: {}
})

function formatAf(af) {
  return af.toExponential(3)
}

function drawChart() {
  const margin = { top: 20, right: 20, bottom: 50, left: 60 }
  const width = props.size - margin.left - margin.right
  const height = props.size - margin.top - margin.bottom

  const svgEl = d3.select(svg.value)
  svgEl.selectAll('*').remove()

  const chart = svgEl.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const validData = props.scatterData.filter(d => d.af > 0 && !isNaN(d.af) && !isNaN(d.score))
  const afValues = validData.map(d => d.af)
  const minAf = d3.min(afValues) / 1.5 || 1e-10
  const maxAf = d3.max(afValues) * 1.5 || 1
  console.log('X-axis range:', [minAf, maxAf], 'AF values:', afValues)

  // X-axis: Logarithmic scale with major ticks
  const x = d3.scaleLog()
    .domain([minAf, maxAf])
    .range([0, width])

  const xTickValues = [1e-7, 1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1].filter(d => d >= minAf && d <= maxAf)
  const xAxis = d3.axisBottom(x)
    .tickValues(xTickValues)
    .tickFormat(d => `e${Math.log10(d)}`)

  const xAxisG = chart.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .call(g => g.selectAll('.tick line').attr('y2', 6).attr('stroke', 'currentColor'))
    .call(g => g.selectAll('.tick text').style('font-size', '12px').style('font-family', 'Arial'))
    .call(g => g.select('.domain').attr('stroke', '#333'))
  xAxisG.append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-family', 'Arial')
    .style('font-size', '14px')
    .text('gnomAD (V4.1) Allele Frequency')

  // Y-axis: Linear scale with ticks every 0.1
  const yMin = d3.min(validData, d => d.score) * 1.1 || -1
  const yMax = d3.max(validData, d => d.score) * 1.1 || 1
  const y = d3.scaleLinear()
    .domain([yMin, yMax])
    .range([height, 0])
    .nice()

  const yTickStep = 0.1
  const yTicks = d3.range(
    Math.floor(yMin / yTickStep) * yTickStep,
    yMax + yTickStep,
    yTickStep
  ).map(d => Number(d.toFixed(2)))
    .filter(d => d >= yMin && d <= yMax)

  console.log('Y-axis ticks:', yTicks)

  // Ticks with labels, outward ticks only
  const yAxis = d3.axisLeft(y)
    .tickValues(yTicks)
    .tickFormat(d3.format(".1f"))
    .tickSizeInner(0) // No inward grid lines
    .tickSize(6) // Outward ticks (x2="-6" in SVG)
    .tickPadding(4) // Reduced padding to bring labels closer to ticks

  const yAxisG = chart.append('g')
    .call(yAxis)
    .call(g => g.selectAll('.tick line').attr('stroke', 'currentColor').attr('stroke-opacity', 0.8))
    .call(g => g.selectAll('.tick text').style('font-size', '12px').style('font-family', 'Arial'))
    .call(g => g.select('.domain').attr('stroke', '#333'))
  yAxisG.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -40)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle')
    .style('font-family', 'Arial')
    .style('font-size', '14px')
    .text('Functional score')

  // Scatter points
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

const downloadSVG = () => {
  const svgEl = svg.value
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgEl)
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'scatter-plot.svg'
  a.click()
  URL.revokeObjectURL(url)
}

const downloadPDF = async () => {
  try {
    const container = chartContainer.value
    const { clientWidth: width, clientHeight: height } = container
    const canvas = await html2canvas(container, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const doc = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [width, height]
    })
    doc.addImage(imgData, 'PNG', 0, 0, width, height)
    doc.save('scatter-plot.pdf')
  } catch (error) {
    console.error('PDF download failed:', error)
  }
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

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
}

.download-wrapper {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 10;
}

.chart-title {
  font-size: 14px;
  color: #333333;
  text-align: center;
}

.download-btn {
  font-size: 12px;
  text-transform: none;
  color: #333333;
}
</style>
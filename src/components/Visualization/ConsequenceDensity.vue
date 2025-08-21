<template>
  <v-container>
    <v-card-text class="d-flex flex-column">
      <div ref="chartWrapper" style="position: relative; width: 100%; min-height: 400px;">
        <svg ref="svg" :width="width" :height="height"></svg>
        <!-- Download Button -->
        <div class="download-wrapper" style="position: absolute; top: 5px; right: 150px;">
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
        <!-- Tick dropdowns -->
        <div
          v-for="category in categoryDataRef"
          :key="category.dataset"
          class="tick-dropdown"
          :style="getTickDropdownStyle(category.dataset)"
          v-show="activeTickId === category.dataset && isTickDropdownVisible"
          @mouseenter="showTickDropdown(category.dataset)"
          @mouseleave="startHideTickDropdownTimer"
        >
          <div class="tick-dropdown-content">
            <div class="tick-dropdown-item" @click.stop="moveCategoryLeft(category.dataset)">Move Left</div>
            <div class="tick-dropdown-item" @click.stop="moveCategoryRight(category.dataset)">Move Right</div>
            <div class="tick-dropdown-item" @click.stop="sortByMedianScore">Sort by Functional Score</div>
          </div>
        </div>
      </div>
    </v-card-text>

    <teleport to="body">
      <div
        v-if="tooltip.visible"
        class="custom-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <table style="font-family: Arial; font-size: 14px; border-collapse: collapse;">
          <tbody>
            <tr v-if="tooltip.data.dataset"><td>Dataset:</td><td>{{ tooltip.data.dataset }}</td></tr>
            <tr v-if="tooltip.data.meanScore"><td>Mean Score:</td><td>{{ tooltip.data.meanScore?.toFixed(2) }}</td></tr>
            <tr v-if="tooltip.data.scoreRange"><td>Score Range:</td><td>{{ tooltip.data.scoreRange }}</td></tr>
            <tr v-if="tooltip.data.count"><td>Count:</td><td>{{ tooltip.data.count }}</td></tr>
            <tr v-if="tooltip.data.mutation"><td>Mutation:</td><td>{{ tooltip.data.mutation }}</td></tr>
            <tr v-if="tooltip.data.identifier"><td>Identifier:</td><td>{{ tooltip.data.identifier }}</td></tr>
            <tr v-if="tooltip.data.score"><td>Score:</td><td>{{ tooltip.data.score?.toFixed(2) }}</td></tr>
          </tbody>
        </table>
      </div>
    </teleport>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Props
const props = defineProps({
  data: { type: Array, required: true },
  titleFlag: { type: Boolean, default: false }
})

// Mutation categories
const categories = [
  'Synonymous', 'Stop-gained', 'Missense', 'Nonsense', 'Codon deletion',
  'Frameshift', 'Intron', 'Splice site', 'UTR'
]

// Refs and settings
const svg = ref(null)
const chartWrapper = ref(null)
const margin = { top: 40, right: 60, bottom: 100, left: 60 }
const width = ref(200)
const height = ref(400)
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  data: {}
})
const categoryDataRef = ref([])
const isTickDropdownVisible = ref(false)
const activeTickId = ref(null)
const tickTextPositions = ref({})
let hideTickDropdownTimer = null

// Scales and KDE settings
let x = null
let y = null
let yTicksKDE = null
const violinGroup = ref(null)
const jitterGroup = ref(null)
const xAxisGroup = ref(null)
const yAxisGroup = ref(null)

// Color scale
const colorMap = d3.scaleOrdinal()
  .domain(categories)
  .range(d3.schemeTableau10)

// Gaussian kernel for KDE
const gaussianKernel = (x, bandwidth) => {
  return (1 / (bandwidth * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * (x / bandwidth) ** 2)
}

// Silverman's Rule for bandwidth estimation
const silvermanBandwidth = (values) => {
  const n = values.length
  const stdDev = d3.deviation(values)
  const iqr = d3.quantile(values.sort((a, b) => a - b), 0.75) - d3.quantile(values, 0.25)
  const bandwidthFactor = Math.min(stdDev, iqr / 1.34) || 0.1
  return 0.9 * bandwidthFactor * Math.pow(n, -0.2)
}

// KDE with Gaussian kernel
const kde = (values, bandwidth, ticks) => {
  return ticks.map(y => {
    const density = d3.mean(values, v => gaussianKernel(y - v, bandwidth))
    return [y, density]
  })
}

// Tick dropdown functions
function showTickDropdown(dataset) {
  console.log('Showing tick dropdown for:', dataset)
  clearTimeout(hideTickDropdownTimer)
  isTickDropdownVisible.value = true
  activeTickId.value = dataset
}

function startHideTickDropdownTimer() {
  console.log('Starting hide tick dropdown timer')
  clearTimeout(hideTickDropdownTimer)
  hideTickDropdownTimer = setTimeout(() => {
    isTickDropdownVisible.value = false
    activeTickId.value = null
    console.log('Hid tick dropdown')
  }, 200)
}

function getTickDropdownStyle(dataset) {
  const pos = tickTextPositions.value[dataset]
  console.log(`Getting dropdown style for ${dataset}:`, pos)
  if (!pos || !chartWrapper.value) return { display: 'none' }
  
  const dropdownWidth = 140
  const textWidth = 50 // Approximate width of tick text
  return {
    position: 'absolute',
    left: `${pos.x + margin.left - dropdownWidth / 2 + textWidth / 2}px`,
    top: `${pos.y + margin.top + 10}px`,
    zIndex: 10,
  }
}

function moveCategoryLeft(dataset) {
  const index = categoryDataRef.value.findIndex(g => g.dataset === dataset)
  if (index > 0) {
    const [movedItem] = categoryDataRef.value.splice(index, 1)
    categoryDataRef.value.splice(index - 1, 0, movedItem)
    console.log('Moved left:', dataset, 'New order:', categoryDataRef.value.map(d => d.dataset))
    updateChart()
  }
}

function moveCategoryRight(dataset) {
  const index = categoryDataRef.value.findIndex(g => g.dataset === dataset)
  if (index < categoryDataRef.value.length - 1) {
    const [movedItem] = categoryDataRef.value.splice(index, 1)
    categoryDataRef.value.splice(index + 1, 0, movedItem)
    console.log('Moved right:', dataset, 'New order:', categoryDataRef.value.map(d => d.dataset))
    updateChart()
  }
}

function sortByMedianScore() {
  categoryDataRef.value.sort((a, b) => {
    const medianA = d3.median(a.mutations.map(d => d.score)) || 0
    const medianB = d3.median(b.mutations.map(d => d.score)) || 0
    return medianB - medianA
  })
  console.log('Sorted by median score:', categoryDataRef.value.map(d => d.dataset))
  updateChart()
}

function updateChart() {
  if (!x || !y || !violinGroup.value || !jitterGroup.value || !xAxisGroup.value) return

  // Update x scale
  x.domain(categoryDataRef.value.map(d => d.dataset))
  console.log('Updated x domain:', x.domain())

  // Update x-axis
  xAxisGroup.value
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-0.8em')
    .attr('dy', '0.15em')
    .attr('transform', 'rotate(-45)')
    .style('font-size', '12px')
    .style('fill', 'black')
    .style('opacity', 1)
    .each(function(d) {
      const textBox = this.getBBox()
      tickTextPositions.value[d] = {
        x: x(d) + x.bandwidth() / 2,
        y: height.value - margin.bottom
      }
      console.log(`Stored tick position for ${d}:`, tickTextPositions.value[d])
    })
    .on('mouseenter', function(event, d) {
      console.log(`Mouseenter on tick: ${d}`)
      d3.select(this)
        .transition()
        .duration(150)
        .attr('font-weight', 'bold')
        .style('fill', '#1e90ff')
      showTickDropdown(d)
    })
    .on('mouseleave', function() {
      console.log('Mouseleave on tick')
      d3.select(this)
        .transition()
        .duration(150)
        .attr('font-weight', 'normal')
        .style('fill', 'black')
      startHideTickDropdownTimer()
    })

  console.log('X-axis ticks:', xAxisGroup.value.selectAll('.tick').size())
  console.log('tickTextPositions after update:', tickTextPositions.value)

  // Update violin plots
  const violins = violinGroup.value.selectAll('.violin')
    .data(categoryDataRef.value, d => d.dataset)

  violins.exit().remove()

  const violinEnter = violins.enter()
    .append('path')
    .attr('class', 'violin')
    .attr('fill', d => colorMap(d.dataset))
    .attr('stroke', '#333')
    .attr('stroke-width', 1)
    .attr('opacity', 0.8)

  violinEnter.merge(violins)
    .each(function(group) {
      console.log('Rendering violin for:', group.dataset)
      const groupX = x(group.dataset) + x.bandwidth() / 2
      const values = group.mutations.map(d => d.score)
      const bandwidth = silvermanBandwidth(values)
      console.log(`Bandwidth for ${group.dataset}: ${bandwidth}`)
      let density = kde(values, bandwidth, yTicksKDE)
      const maxDensity = d3.max(density, d => d[1]) || 1
      density = density.filter(d => d[1] >= maxDensity * 0.001)
      console.log(`Density for ${group.dataset}:`, density.length, density)

      const area = d3.area()
        .curve(d3.curveCatmullRom)
        .y(d => y(d[0]))
        .x0(d => groupX - (d[1] / maxDensity) * (x.bandwidth() / 2.4))
        .x1(d => groupX + (d[1] / maxDensity) * (x.bandwidth() / 2.4))

      const pathD = area(density)
      console.log(`Path for ${group.dataset}:`, pathD)

      d3.select(this)
        .datum({ ...group, density })
        .attr('d', pathD || '')
        .transition()
        .duration(250)
        .attr('d', pathD || '')
    })

  violinGroup.value.selectAll('.violin')
    .on('mouseover', function(event) {
      const group = d3.select(this).datum()
      console.log('Violin mouseover:', group.dataset)
      d3.select(this)
        .transition()
        .duration(150)
        .attr('stroke-width', 2)
        .attr('stroke', d3.color(colorMap(group.dataset)).darker(0.5))
      tooltip.value.visible = true
      tooltip.value.data = {
        dataset: group.dataset,
        meanScore: d3.mean(group.mutations.map(d => d.score)) || 0,
        scoreRange: `${d3.min(group.mutations.map(d => d.score)).toFixed(2)} to ${d3.max(group.mutations.map(d => d.score)).toFixed(2)}`,
        count: group.mutations.length
      }
      tooltip.value.x = event.clientX + 12
      tooltip.value.y = event.clientY + 12
    })
    .on('mousemove', function(event) {
      tooltip.value.x = event.clientX + 12
      tooltip.value.y = event.clientY + 12
    })
    .on('mouseleave', function() {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('stroke-width', 1)
        .attr('stroke', '#333')
      tooltip.value.visible = false
    })

  // Update jitter points
  const jitters = jitterGroup.value.selectAll('.jitter-group')
    .data(categoryDataRef.value, d => d.dataset)

  jitters.exit().remove()

  const jitterEnter = jitters.enter()
    .append('g')
    .attr('class', 'jitter-group')

  jitterEnter.merge(jitters)
    .each(function(group, i) {
      console.log('Rendering jitter for:', group.dataset)
      const groupX = x(group.dataset) + x.bandwidth() / 2
      const jitterWidth = x.bandwidth() / 4
      console.log(`Jitter ${group.dataset}: points=${group.mutations.length}, jitterWidth=${jitterWidth}, groupX=${groupX}`)

      const circles = d3.select(this)
        .selectAll('circle')
        .data(group.mutations, d => d.identifier)

      circles.exit().remove()

      const circleEnter = circles.enter()
        .append('circle')
        .attr('r', 2)
        .attr('fill', colorMap(group.dataset))
        .attr('opacity', 0.5)

      circleEnter.merge(circles)
        .attr('cx', d => groupX + (Math.random() - 0.5) * jitterWidth)
        .attr('cy', d => y(d.score))

      circleEnter.merge(circles)
        .on('mouseover', function(event, d) {
          console.log('Jitter mouseover:', d)
          d3.select(this)
            .transition()
            .duration(150)
            .attr('r', 3)
            .attr('opacity', 1)
          tooltip.value.visible = true
          tooltip.value.data = {
            mutation: d.mutation,
            score: d.score,
            identifier: d.identifier
          }
          tooltip.value.x = event.clientX + 12
          tooltip.value.y = event.clientY + 12
          console.log('Tooltip data:', tooltip.value.data)
        })
        .on('mousemove', function(event) {
          tooltip.value.x = event.clientX + 12
          tooltip.value.y = event.clientY + 12
        })
        .on('mouseleave', function(event) {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('r', 2)
            .attr('opacity', 0.5)
          tooltip.value.visible = false
        })
    })

  // Update title position
  if (props.titleFlag) {
    d3.select(svg.value)
      .selectAll('.chart-title')
      .attr('x', width.value / 2 - 60)
  }
}

function drawChart(rawData) {
  console.log('Drawing chart with data:', rawData)
  const containerWidth = chartWrapper.value?.clientWidth || 600
  console.log('Container width:', containerWidth)

  d3.select(svg.value).selectAll('*').remove()

  categoryDataRef.value = categories
    .map(cat => {
      const group = rawData.find(d => d.dataset === cat)
      return group && group.mutations?.length >= 5 ? { ...group, dataset: cat } : null
    })
    .filter(Boolean)

  console.log('Filtered category data:', categoryDataRef.value)
  if (categoryDataRef.value.length === 0) {
    console.warn('No valid data to display')
    d3.select(svg.value)
      .append('text')
      .attr('x', width.value / 2)
      .attr('y', height.value / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', 14)
      .attr('fill', '#555')
      .text('No valid data to display')
    return
  }

  // Dynamic chart width
  const violinWidth = 50
  const spacing = 20
  width.value = Math.max(containerWidth, categoryDataRef.value.length * (violinWidth + spacing) - spacing + margin.left + margin.right)
  console.log(`Dynamic width: categories=${categoryDataRef.value.length}, violinWidth=${violinWidth}, spacing=${spacing}, totalWidth=${width.value}`)

  const svgSel = d3.select(svg.value)
    .attr('width', width.value)
    .attr('height', height.value)

  // Add chart title
  if (props.titleFlag) {
    svgSel.append('text')
      .attr('class', 'chart-title')
      .attr('x', width.value / 2)
      .attr('y', margin.top / 2 - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', 'black')
      .text('Functional score distribution across molecular consequence categories')
  }

  // Calculate y-axis range dynamically
  const allScores = categoryDataRef.value.flatMap(d => d.mutations.map(m => m.score))
  const maxScore = Math.max(...allScores)
  const minScore = Math.min(...allScores)
  const range = maxScore - minScore
  const padding = range > 0 ? range * 0.05 : 0.5
  let yMax = maxScore + padding
  let yMin = minScore - padding

  // Optimize range with d3.nice
  y = d3.scaleLinear()
    .domain([yMin, yMax])
    .nice()
  yMax = y.domain()[1]
  yMin = y.domain()[0]
  y.range([height.value - margin.bottom, margin.top])

  // Calculate ticks dynamically with 0.1 or 0.5 step
  const tickStep = range < 2 ? 0.1 : 0.5
  const yTicks = d3.range(yMin, yMax, tickStep).map(d => Number(d.toFixed(2)))
  console.log(`Y axis range: [${yMin.toFixed(2)}, ${yMax.toFixed(2)}], tickStep=${tickStep}, ticks=${yTicks}`)

  // Generate finer yTicks for KDE
  yTicksKDE = d3.range(yMin, yMax, (yMax - yMin) / 200)

  // Y axis (Functional Score)
  const yAxis = d3.axisLeft(y)
    .tickValues(yTicks)
    .tickFormat(d3.format(".1f"))
    .tickSizeOuter(6)
  
  yAxisGroup.value = svgSel.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(yAxis)
    .call(g => g.selectAll('.tick text')
      .style('font-size', '12px')
      .style('fill', 'black'))
  yAxisGroup.value.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -((height.value - margin.top - margin.bottom) / 2 + margin.top))
    .attr('y', -margin.left + 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .attr('fill', 'black')
    .text('Functional Score')

  // X axis (Categories)
  x = d3.scaleBand()
    .domain(categoryDataRef.value.map(d => d.dataset))
    .range([margin.left, margin.left + categoryDataRef.value.length * (violinWidth + spacing) - spacing])
    .paddingInner(spacing / violinWidth)

  console.log(`X scale: bandwidth=${x.bandwidth()}, step=${x.step()}`)

  xAxisGroup.value = svgSel.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${height.value - margin.bottom})`)

  // Create groups for violins and jitters
  violinGroup.value = svgSel.append('g').attr('class', 'violins')
  jitterGroup.value = svgSel.append('g').attr('class', 'jitters')

  // Initial draw
  updateChart()
}

const downloadSVG = () => {
  const svgEl = svg.value
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgEl)
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'violin-plot.svg'
  a.click()
  URL.revokeObjectURL(url)
}

const downloadPDF = async () => {
  try {
    const container = chartWrapper.value
    const downloadWrapper = container.querySelector('.download-wrapper')
    downloadWrapper.style.display = 'none'
    const { clientWidth: width, clientHeight: height } = container
    const canvas = await html2canvas(container, { scale: 2 })
    downloadWrapper.style.display = ''
    const imgData = canvas.toDataURL('image/png')
    const doc = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [width, height]
    })
    doc.addImage(imgData, 'PNG', 0, 0, width, height)
    doc.save('violin-plot.pdf')
  } catch (error) {
    console.error('PDF download failed:', error)
  }
}

onMounted(() => {
  nextTick(() => {
    if (chartWrapper.value && svg.value) {
      drawChart(props.data)
    } else {
      console.error('Chart wrapper or SVG not ready')
    }
  })
})

watch(() => props.data, () => nextTick(() => drawChart(props.data)), { deep: true })
</script>

<style scoped>
svg {
  font-family: Arial, sans-serif;
}

.custom-tooltip {
  position: fixed;
  z-index: 9999;
  background-color: white;
  padding: 12px;
  box-shadow: 0px 2px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.chart-container {
  min-height: 400px;
}

.download-wrapper {
  position: absolute;
  top: 5px;
  right: 150px;
  z-index: 10;
}

.download-btn {
  font-size: 12px;
  text-transform: none;
  color: #333333;
}

.x-axis text {
  fill: black !important;
  opacity: 1 !important;
}

.tick-dropdown {
  position: absolute;
}

.tick-dropdown-content {
  background-color: #ffffff;
  min-width: 140px;
  border: 1px solid #d1d5db;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  pointer-events: auto;
  position: relative;
  z-index: 10;
}

.tick-dropdown-content::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -10px;
  width: 0;
  height: 0;
  border-bottom: 10px solid #ffffff;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  z-index: 11;
}

.tick-dropdown-content::after {
  content: '';
  position: absolute;
  left: 50%;
  top: -11px;
  width: 0;
  height: 0;
  border-bottom: 11px solid #d1d5db;
  border-left: 11px solid transparent;
  border-right: 11px solid transparent;
  z-index: 9;
  transform: translateX(-50%);
}

.tick-dropdown-item {
  color: #1f2937;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.tick-dropdown-item:hover {
  background-color: #f3f4f6;
}
</style>
<template>
  <div class="venn-container" ref="containerRef">
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

    <svg ref="svgRef" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="xMinYMin meet"></svg>

    <teleport to="body">
      <div
        v-if="tooltip.visible"
        class="custom-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <table style="font-family: Arial; font-size: 14px; border-collapse: collapse;">
          <tbody>
            <tr><td>Label:</td><td>{{ tooltip.data.label }}</td></tr>
            <tr><td>Count:</td><td>{{ tooltip.data.value }}</td></tr>
            <tr><td>Percentage:</td><td>{{ tooltip.data.percent }}%</td></tr>
          </tbody>
        </table>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import jsPDF from 'jspdf'
import { Canvg } from 'canvg'
import { ref, reactive, onMounted, watch } from 'vue'

// Define component props
const props = defineProps({
  data: {
    type: Object,
    required: true,
    validator: (data) => {
      const valid = (
        data &&
        data.setA && typeof data.setA.count === 'number' && typeof data.setA.title === 'string' &&
        data.setB && typeof data.setB.count === 'number' && typeof data.setB.title === 'string' &&
        data.intersection && typeof data.intersection.count === 'number' && typeof data.intersection.title === 'string'
      )
      if (!valid) {
        console.error('Prop validation failed:', data)
      }
      return valid
    }
  }
})

// Reactive references
const containerRef = ref(null)
const svgRef = ref(null)
const tooltip = ref({
  visible: false,
  x: 10,
  y: 10,
  data: { label: '', value: 0, percent: 0 }
})

// Chart dimensions
let width = 400
let height = 300

// Color mapping
const colorMap = {
  setA: '#a6cee3', // Set A: Light blue
  setB: '#fdbf6f', // Set B: Light orange
  intersection: '#fb9a99' // Intersection: Light red
}

// Function to brighten color
function brightenColor(color, amount = 0.2) {
  const c = d3.hsl(color)
  c.l += (1 - c.l) * amount
  return c.toString()
}

// Render Venn diagram
function renderChart() {
  if (!containerRef.value || !props.data) {
    console.warn('Container or data is not available:', props.data)
    return
  }

  const { setA, setB, intersection } = props.data
  // Guard against invalid data
  if (!isDataValid()) {
    console.error('Invalid data format:', props.data)
    return
  }

  // Get container dimensions
  const rect = containerRef.value.getBoundingClientRect()
  width = Math.max(200, rect.width)
  height = Math.max(200, rect.height)

  const svgEl = svgRef.value
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  // Set SVG viewBox
  svg.attr('viewBox', `0 0 ${width} ${height}`)
     .attr('width', width)
     .attr('height', height)

  // Calculate total and proportions
  const total = setA.count + setB.count - intersection.count
  const radiusScale = d3.scaleSqrt()
    .domain([0, Math.max(setA.count, setB.count, intersection.count || 1)])
    .range([40, Math.min(width, height) / 2.5])

  // Calculate circle radii
  const rA = radiusScale(setA.count)
  const rB = radiusScale(setB.count)
  const minIntersectionRadius = 15
  const intersectionRadius = Math.max(radiusScale(intersection.count || 0), minIntersectionRadius)

  // Calculate circle centers (adjusted for full visibility)
  const cxA = width / 3
  const cxB = 2 * width / 3
  const cy = height / 2

  console.log(`cxA: ${cxA}, cxB: ${cxB}, rA: ${rA}, rB: ${rB}, intersectionRadius: ${intersectionRadius}`)

  const g = svg.append('g')

  // Define clip paths for intersection
  const defs = svg.append('defs')
  defs.append('clipPath')
    .attr('id', 'clipA')
    .append('circle')
    .attr('cx', cxA)
    .attr('cy', cy)
    .attr('r', rA)

  defs.append('clipPath')
    .attr('id', 'clipB')
    .append('circle')
    .attr('cx', cxB)
    .attr('cy', cy)
    .attr('r', rB)

  // Draw Set A (excluding intersection)
  const circleA = g.append('circle')
    .attr('cx', cxA)
    .attr('cy', cy)
    .attr('r', rA)
    .attr('fill', colorMap.setA)
    .attr('fill-opacity', 0.6)
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')

  // Draw Set B (excluding intersection)
  const circleB = g.append('circle')
    .attr('cx', cxB)
    .attr('cy', cy)
    .attr('r', rB)
    .attr('fill', colorMap.setB)
    .attr('fill-opacity', 0.6)
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')

  // Draw intersection area
  const intersectionArea = g.append('circle')
    .attr('cx', cxA)
    .attr('cy', cy)
    .attr('r', rA)
    .attr('fill', colorMap.intersection)
    .attr('fill-opacity', 0.6)
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .attr('clip-path', 'url(#clipB)')
    .style('cursor', 'pointer')

  // Add interaction behavior
  const areas = [
    {
      element: circleA,
      label: setA.title,
      value: setA.count - intersection.count,
      percent: ((setA.count - intersection.count) / total * 100).toFixed(1)
    },
    {
      element: circleB,
      label: setB.title,
      value: setB.count - intersection.count,
      percent: ((setB.count - intersection.count) / total * 100).toFixed(1)
    },
    {
      element: intersectionArea,
      label: intersection.title,
      value: intersection.count,
      percent: (intersection.count / total * 100).toFixed(1)
    }
  ]

  areas.forEach(area => {
    area.element
      .on('mouseover', function(event) {
        d3.select(this)
          .transition()
          .duration(180)
          .attr('fill', brightenColor(colorMap[area.label === setA.title ? 'setA' : area.label === setB.title ? 'setB' : 'intersection']))
          .attr('fill-opacity', 0.8)
        tooltip.value = {
          visible: true,
          x: event.clientX + 10,
          y: event.clientY + 10,
          data: {
            label: area.label,
            value: area.value,
            percent: area.percent
          }
        }
        console.log('Tooltip data:', tooltip.value)
      })
      .on('mousemove', function(event) {
        tooltip.value.x = event.clientX + 10
        tooltip.value.y = event.clientY + 10
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(180)
          .attr('fill', colorMap[area.label === setA.title ? 'setA' : area.label === setB.title ? 'setB' : 'intersection'])
          .attr('fill-opacity', 0.6)
        tooltip.value.visible = false
      })
  })

  // Add labels
  const labelOffset = 50
  areas.forEach(area => {
    if (parseFloat(area.percent) >= 2) {
      let cx, cyAdjust
      if (area.label === setA.title) {
        cx = cxA - labelOffset
        cyAdjust = cy
      } else if (area.label === setB.title) {
        cx = cxB + labelOffset
        cyAdjust = cy
      } else {
        cx = (cxA + cxB) / 2
        cyAdjust = cy
      }
      const text = g.append('text')
        .attr('x', cx)
        .attr('y', cyAdjust)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#000')
        .style('pointer-events', 'none')
      
      text.append('tspan')
        .attr('x', cx)
        .attr('dy', '-0.3em')
        .text(area.label)
      
      text.append('tspan')
        .attr('x', cx)
        .attr('dy', '1.2em')
        .text(`(${area.percent}%)`)
      
      text.raise()
      console.log(`Label: ${area.label}\n(${area.percent}%)`)
    }
  })
}

// Download SVG
const downloadSVG = () => {
  const svgEl = svgRef.value
  if (!svgEl) {
    console.warn('SVG element not available for download')
    return
  }
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgEl)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'venn-chart.svg'
  a.click()
  URL.revokeObjectURL(url)
}

// Download PDF
const downloadPDF = async () => {
  const svgEl = svgRef.value
  if (!svgEl) {
    console.warn('SVG element not available for download')
    return
  }
  const svgString = new XMLSerializer().serializeToString(svgEl)

  const scale = 3
  const pdfWidth = width * scale
  const pdfHeight = height * scale

  const canvas = document.createElement('canvas')
  canvas.width = pdfWidth
  canvas.height = pdfHeight
  const ctx = canvas.getContext('2d')

  const v = await Canvg.from(ctx, svgString)
  await v.render()
  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF({ orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait', unit: 'pt', format: [pdfWidth, pdfHeight] })
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save('venn-chart.pdf')
}

// Data validation function
function isDataValid() {
  const data = props.data
  const valid = (
    data &&
    data.setA && typeof data.setA.count === 'number' && typeof data.setA.title === 'string' &&
    data.setB && typeof data.setB.count === 'number' && typeof data.setB.title === 'string' &&
    data.intersection && typeof data.intersection.count === 'number' && typeof data.intersection.title === 'string'
  )
  if (!valid) {
    console.error('Invalid data format in render check:', data)
  }
  return valid
}

// Initialize rendering and resize observer
onMounted(() => {
  if (isDataValid()) {
    renderChart()
  }
  let lastW = 0
  let lastH = 0
  const ro = new ResizeObserver(() => {
    const r = containerRef.value.getBoundingClientRect()
    if (r.width !== lastW || r.height !== lastH) {
      lastW = r.width
      lastH = r.height
      if (isDataValid()) {
        renderChart()
      }
    }
  })
  ro.observe(containerRef.value)
})

// Watch for data changes
watch(() => props.data, () => {
  if (isDataValid()) {
    renderChart()
  }
}, { deep: true })
</script>

<style scoped>
.venn-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 300px;
  margin: 0 auto;
}

.custom-tooltip {
  position: fixed;
  z-index: 99999;
  background-color: white;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

svg {
  width: 100%;
  height: 100%;
  display: block;
}

.download-menu {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
}
</style>
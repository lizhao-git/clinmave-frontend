<template>
  <div class="pie-container" ref="containerRef">
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

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  colors: {
    type: Object,
    default: () => ({
      Strong: '#fb9a99',
      Moderate: '#fdbf6f',
      Weak: '#a6cee3',
      Unknown: '#999999'
    })
  }
})

const containerRef = ref(null)
const svgRef = ref(null)
const tooltip = ref({
  visible: false,
  x: 10,
  y: 10,
  data: { label: '', value: 0, percent: 0 }
})

let width = 250
let height = 250

// Brighten color function
function brightenColor(color, amount = 0.2) {
  const c = d3.hsl(color)
  c.l += (1 - c.l) * amount
  return c.toString()
}

// Render pie chart
function renderChart() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  width = Math.max(100, rect.width)
  height = Math.max(100, rect.height)

  const svgEl = svgRef.value
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  svg.attr('viewBox', `0 0 ${width} ${height}`)
     .attr('width', width)
     .attr('height', height)

  const radius = Math.min(width, height) / 2
  const outerR = radius - 30

  const dataEntries = Object.entries(props.data)
  const total = d3.sum(dataEntries, d => d[1])

  const pie = d3.pie().value(d => d[1]).sort(null)
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(outerR)

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)

  const arcs = g.selectAll('path')
    .data(pie(dataEntries))
    .enter()
    .append('path')
    .each(function(d) { this._current = { startAngle: d.startAngle, endAngle: d.startAngle } })
    .attr('fill', d => props.colors[d.data[0]] || '#999999')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .attr('d', d => arcGenerator({ startAngle: d.startAngle, endAngle: d.startAngle }))

  arcs.transition()
    .duration(700)
    .attrTween('d', function(d) {
      const i = d3.interpolate(
        { startAngle: d.startAngle, endAngle: d.startAngle },
        { startAngle: d.startAngle, endAngle: d.endAngle }
      )
      return t => arcGenerator(i(t))
    })
    .on('end', function(d) { this._current = d })

  arcs.on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(180)
        .style('fill', brightenColor(props.colors[d.data[0]] || '#999999', 0.25))
      d3.select(this)
        .transition()
        .duration(300)
        .attrTween('d', function(dd) {
          const ri = d3.interpolateNumber(outerR, outerR * 1.06)
          return t => d3.arc().innerRadius(0).outerRadius(ri(t))(dd)
        })
        .style('filter', 'drop-shadow(3px 3px 6px rgba(0,0,0,0.25))')

      tooltip.value = {
        visible: true,
        x: event.clientX + 10,
        y: event.clientY + 10,
        data: {
          label: d.data[0],
          value: d.data[1],
          percent: ((d.data[1] / total) * 100).toFixed(2)
        }
      }
      console.log('Tooltip data:', tooltip.value)
    })
    .on('mousemove', function(event) {
      tooltip.value.x = event.clientX + 10
      tooltip.value.y = event.clientY + 10
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .transition()
        .duration(180)
        .style('fill', props.colors[d.data[0]] || '#999999')
        .style('filter', 'none')
      d3.select(this)
        .transition()
        .duration(300)
        .attrTween('d', function(dd) {
          const ri = d3.interpolateNumber(outerR * 1.06, outerR)
          return t => d3.arc().innerRadius(0).outerRadius(ri(t))(dd)
        })
      tooltip.value.visible = false
    })

  g.selectAll('text.label')
    .data(pie(dataEntries))
    .enter()
    .filter(d => (d.data[1] / total) * 100 > 5)
    .append('text')
    .attr('class', 'label')
    .attr('transform', d => {
        const [x, y] = arcGenerator.centroid(d);
        const scaleFactor = 0.7; // 调整这个值（例如 0.6、0.8）来控制距离中心的远近
        return `translate(${x * scaleFactor}, ${y * scaleFactor})`;
    })
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('fill', '#000')
    .style('pointer-events', 'none')
    .each(function(d) {
      const text = d3.select(this)
      const cx = arcGenerator.centroid(d)[0]
      const scaleFactor = 0.7;
      text.append('tspan')
        .attr('x', cx * scaleFactor)
        .attr('dy', '-0.4em')
        .text(d.data[0])
      text.append('tspan')
        .attr('x', cx * scaleFactor)
        .attr('dy', '1.1em')
        .text(`(${((d.data[1] / total) * 100).toFixed(1)}%)`)
    })
}

// Download functions
const downloadSVG = () => {
  const svgEl = svgRef.value
  if (!svgEl) return
  const svgString = new XMLSerializer().serializeToString(svgEl)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pie-chart.svg'
  a.click()
  URL.revokeObjectURL(url)
}

const downloadPDF = async () => {
  const svgEl = svgRef.value
  if (!svgEl) return
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
  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [pdfWidth, pdfHeight]
  })
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save('pie-chart.pdf')
}

onMounted(() => {
  renderChart()
  let lastW = 0
  let lastH = 0
  const ro = new ResizeObserver(() => {
    const r = containerRef.value.getBoundingClientRect()
    if (r.width !== lastW || r.height !== lastH) {
      lastW = r.width
      lastH = r.height
      renderChart()
    }
  })
  ro.observe(containerRef.value)
})

watch(() => props.data, () => {
  renderChart()
}, { deep: true })
</script>

<style scoped>
.pie-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  height: 320px;
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
<template>
  <div
    ref="container"
    style="position: relative; user-select: none; display: flex; justify-content: center;"
  >
    <svg ref="svg" :width="computedWidth" :height="height"></svg>
    <div
      id="oncoprintTooltip"
      style="position: absolute; pointer-events: none; background: #222; color: #eee; padding: 5px 8px; border-radius: 4px; font-size: 14px; display: none; z-index: 10;"
    ></div>

    <!-- 控制按钮 -->
    <div
      class="d-flex justify-center"
      style="position: absolute; bottom: 10px; width: 100%; z-index: 20; gap: 6px;"
    >
      <v-btn icon class="ma-1" color="white" elevation="1" @click="zoomOut" title="Zoom Out">
        <v-icon>mdi-magnify-minus</v-icon>
      </v-btn>
      <v-btn icon class="ma-1" color="white" elevation="1" @click="zoomIn" title="Zoom In">
        <v-icon>mdi-magnify-plus</v-icon>
      </v-btn>
      <v-btn icon class="ma-1" color="white" elevation="1" @click="panLeft" title="Pan Left">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-btn icon class="ma-1" color="white" elevation="1" @click="panRight" title="Pan Right">
        <v-icon>mdi-arrow-right</v-icon>
      </v-btn>

      <!-- 只保留PDF导出 -->
      <v-btn icon class="ma-1" color="white" elevation="1" @click="downloadPDF" title="Download PDF">
        <v-icon>mdi-file-pdf-box</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import jsPDF from 'jspdf'
import { Canvg } from 'canvg'

const props = defineProps({
  height: { type: Number, default: 300 },
  geneInfo: {
    type: Object,
    required: true,
    validator: gene => ['geneName', 'uniprotId', 'proteinLength'].every(key => key in gene)
  },
  domains: {
    type: Array,
    default: () => [],
    validator: domains => domains.every(d => ['pfamId', 'pfamName', 'pfamDescription', 'start', 'end'].every(key => key in d))
  },
  oncoprintData: {
    type: Array,
    default: () => [],
    validator: data => data.every(sample => 'sample' in sample && 'mutations' in sample && Array.isArray(sample.mutations))
  }
})

const container = ref(null)
const svg = ref(null)
const computedWidth = ref(1300)
const zoomScale = ref(1)
const zoomOffset = ref(0)

function zoomIn() {
  zoomScale.value = Math.min(zoomScale.value * 1.5, 20)
  const maxOffset = props.geneInfo.proteinLength - props.geneInfo.proteinLength / zoomScale.value
  zoomOffset.value = Math.min(zoomOffset.value, maxOffset)
}
function zoomOut() {
  zoomScale.value = Math.max(zoomScale.value / 1.5, 1)
  zoomOffset.value = Math.min(zoomOffset.value, props.geneInfo.proteinLength - props.geneInfo.proteinLength / zoomScale.value)
}
function panLeft() {
  const step = props.geneInfo.proteinLength / 10 / zoomScale.value
  zoomOffset.value = Math.max(zoomOffset.value - step, 0)
}
function panRight() {
  const step = props.geneInfo.proteinLength / 10 / zoomScale.value
  const maxOffset = props.geneInfo.proteinLength - props.geneInfo.proteinLength / zoomScale.value
  zoomOffset.value = Math.min(zoomOffset.value + step, maxOffset)
}

const updateWidth = () => {
  if (container.value) {
    const parentWidth = container.value.parentElement.getBoundingClientRect().width
    computedWidth.value = Math.min(parentWidth - 20, 1300)
  }
}
let resizeObserver = null
onMounted(() => {
  updateWidth()
  resizeObserver = new ResizeObserver(updateWidth)
  if (container.value) {
    resizeObserver.observe(container.value.parentElement)
  }
  drawTrack()
})
onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})

const pfamColorMap = ref({})
const mutationColorMap = {
  'Gain-of-function': '#8B0000',
  'Loss-of-function': '#169e35',
  'Functional neutral': '#bcbcbc',
  'null': 'white'
}
const colorPalette = ['#ffd92f', '#a6cee3', '#b2df8a', '#fb9a99', '#fdbf6f']

function drawTrack() {
  if (!svg.value) return
  const svgEl = d3.select(svg.value)
  svgEl.selectAll('*').remove()

  const margin = { top: 10, right: 10, bottom: 30, left: 80 }
  const innerWidth = computedWidth.value - margin.left - margin.right
  const innerHeight = props.height - margin.top - margin.bottom
  const g = svgEl.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const totalLength = props.geneInfo.proteinLength
  const windowSize = totalLength / zoomScale.value
  const start = zoomOffset.value
  const end = start + windowSize

  const x = d3.scaleLinear().domain([start + 1, end]).range([0, innerWidth - 100])

  const xAxis = d3.axisBottom(x)
    .tickValues([
      Math.max(start + 1, 1),
      Math.min(end, props.geneInfo.proteinLength)
    ])
    .tickFormat(d => `${Math.round(d)} aa`)

  const yGene = 30
  const geneRectHeight = 20
  const geneX = 0
  const geneWidth = x(end) - x(start + 1)

  g.append('rect')
    .attr('x', geneX)
    .attr('y', yGene)
    .attr('width', geneWidth)
    .attr('height', geneRectHeight)
    .attr('fill', 'white')
    .attr('stroke', 'black')

  const domainGroup = g.selectAll('g.domain')
    .data(props.domains)
    .enter().append('g').attr('class', 'domain')

  domainGroup.append('rect')
    .attr('x', d => x(d.start))
    .attr('y', yGene)
    .attr('width', d => Math.max(x(d.end) - x(d.start), 1))
    .attr('height', geneRectHeight)
    .attr('fill', d => pfamColorMap.value[d.pfamId] || '#888')
    .on('mouseover', (event, d) => showTooltip(event, `Pfam: ${d.pfamId}<br>${d.pfamName}<br>${d.pfamDescription}`))
    .on('mouseout', hideTooltip)

  const occupied = []
  domainGroup.append('text')
    .text(d => d.pfamName)
    .attr('x', d => x((d.start + d.end) / 2))
    .attr('y', function (d) {
      const xCenter = x((d.start + d.end) / 2)
      const textWidth = d.pfamName.length * 6.5
      const labelObj = { start: xCenter - textWidth / 2, end: xCenter + textWidth / 2 }
      let level = 0
      while (occupied.some(o => !(labelObj.end < o.start || labelObj.start > o.end) && o.level === level)) {
        level++
      }
      occupied.push({ ...labelObj, level })
      return yGene + (level % 2 === 0 ? -6 - 12 * level : geneRectHeight + 12 * level)
    })
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .attr('fill', 'black')

  g.append('text')
    .attr('x', -60).attr('y', yGene + geneRectHeight / 2)
    .attr('text-anchor', 'start').attr('font-size', 14)
    .text(props.geneInfo.geneName)

  g.append('text')
    .attr('x', -60).attr('y', yGene + geneRectHeight / 2 + 16)
    .attr('text-anchor', 'start').attr('font-size', 14)
    .text(props.geneInfo.uniprotId)

  const rectHeight = 15
  const gap = 5
  const yStart = yGene + geneRectHeight + 30

  props.oncoprintData.forEach((sample, i) => {
    const y = yStart + i * (rectHeight + gap)
    g.append('text')
      .attr('x', -10).attr('y', y + rectHeight / 2 - 1).attr('dy', '0.35em')
      .attr('text-anchor', 'end').attr('font-size', 12)
      .text(sample.sample)
    g.selectAll(`.mut-${i}`)
      .data(sample.mutations)
      .enter()
      .append('rect')
      .attr('class', `mut-${i}`)
      .attr('x', d => x(d.start))
      .attr('y', y)
      .attr('width', d => Math.max(x(d.end) - x(d.start), 3))
      .attr('height', rectHeight)
      .attr('fill', d => mutationColorMap[d.type] || '#ccc')
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5)
      .on('mouseover', (event, d) => showTooltip(event, `Ref: ${d.ref || ''}<br>${d.type}<br>Position: ${d.start}`))
      .on('mouseout', hideTooltip)
  })

  g.append('g')
    .attr('transform', `translate(0, ${yGene + geneRectHeight + 2})`)
    .call(xAxis)
    .selectAll('text')
    .style('font-size', '14px')

  const legendY = yStart + props.oncoprintData.length * (rectHeight + gap) + 60
  const legend = g.append('g')
    .attr('class', 'mutation-legend')
    .attr('transform', `translate(0, ${legendY})`)

  Object.entries(mutationColorMap).forEach(([type, color], i) => {
    const xOffset = i * 150
    legend.append('rect').attr('x', xOffset).attr('y', 0).attr('width', 15).attr('height', 15).attr('fill', color).attr('stroke', 'black').attr('stroke-width', 0.5)
    legend.append('text').attr('x', xOffset + 20).attr('y', 12).attr('font-size', 14).text(type)
  })
}

function showTooltip(event, htmlContent) {
  const tooltip = container.value.querySelector('#oncoprintTooltip')
  const rect = container.value.getBoundingClientRect()
  tooltip.innerHTML = htmlContent
  tooltip.style.left = `${event.clientX - rect.left + 10}px`
  tooltip.style.top = `${event.clientY - rect.top + 10}px`
  tooltip.style.display = 'inline-block'
}
function hideTooltip() {
  const tooltip = container.value.querySelector('#oncoprintTooltip')
  tooltip.style.display = 'none'
}

// 提升PDF质量时的放大倍数（可调）
const DPI_SCALE = 1

async function downloadPDF() {
  if (!svg.value) return
  const svgEl = svg.value

  const serializer = new XMLSerializer()
  let svgString = serializer.serializeToString(svgEl)

  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  if (!svgString.match(/^<\?xml/)) {
    svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString
  }

  // 目标canvas尺寸，放大 DPI_SCALE 倍
  const width = (svgEl.clientWidth || computedWidth.value) * DPI_SCALE
  const height = (svgEl.clientHeight || props.height) * DPI_SCALE

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  // 放大绘制，先 scale context 再绘制svg
  ctx.scale(DPI_SCALE, DPI_SCALE)

  const v = await Canvg.from(ctx, svgString)
  await v.render()

  // 生成 PDF，单位pt，尺寸对应放大后的canvas尺寸 / DPI_SCALE，保持单位一致
  const pdf = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [width / DPI_SCALE, height / DPI_SCALE]
  })

  // 把canvas按原尺寸导入pdf，pdf尺寸是放大后的尺寸除以DPI_SCALE
  const imgData = canvas.toDataURL('image/png')
  pdf.addImage(imgData, 'PNG', 0, 0, width / DPI_SCALE, height / DPI_SCALE)
  pdf.save(`${props.geneInfo.geneName}_oncoprint.pdf`)
}

watch([
  () => computedWidth.value,
  () => props.height,
  () => props.geneInfo,
  () => props.oncoprintData,
  () => zoomScale.value,
  () => zoomOffset.value
], drawTrack, { deep: true })

watch(() => props.domains, (newDomains) => {
  const map = {}
  const uniquePfamIds = [...new Set(newDomains.map(d => d.pfamId))]
  uniquePfamIds.forEach((id, idx) => {
    map[id] = colorPalette[idx % colorPalette.length]
  })
  pfamColorMap.value = map
  drawTrack()
}, { immediate: true, deep: true })
</script>

<style scoped>
#oncoprintTooltip {
  pointer-events: none;
  background: #222;
  color: #eee;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 14px;
  display: none;
  z-index: 10;
}
</style>

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

    <!-- Download buttons at bottom center -->
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
      <div class="dropdown">
        <v-btn
          icon
          class="ma-1"
          color="white"
          elevation="1"
          title="Download"
          @mouseenter="showDownloadDropdown"
          @mouseleave="hideDownloadDropdown"
        >
          <v-icon>mdi-cloud-download</v-icon>
        </v-btn>
        <div
          class="dropdown-content"
          v-show="isDownloadDropdownVisible"
          @mouseenter="showDownloadDropdown"
          @mouseleave="hideDownloadDropdown"
        >
          <div class="dropdown-item" @click="downloadPDF">PDF</div>
          <div class="dropdown-item" @click="downloadSVG">SVG</div>
        </div>
      </div>
    </div>

    <!-- Sample dropdowns positioned dynamically -->
    <div
      v-for="sample in currentOrder"
      :key="sample.sample"
      class="sample-dropdown"
      :style="getSampleDropdownStyle(sample.sample)"
      v-show="activeSampleId === sample.sample && isSampleDropdownVisible"
      @mouseenter="showSampleDropdown(sample.sample)"
      @mouseleave="startHideSampleDropdownTimer"
    >
      <div class="sample-dropdown-content">
        <div class="sample-dropdown-item" @click.stop="moveRowUp(sample.sample)">Move Up</div>
        <div class="sample-dropdown-item" @click.stop="moveRowDown(sample.sample)">Move Down</div>
        <div class="sample-dropdown-item" @click.stop="sortByMutationCount('Gain-of-function')">Sort by Gain-of-function</div>
        <div class="sample-dropdown-item" @click.stop="sortByMutationCount('Loss-of-function')">Sort by Loss-of-function</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import jsPDF from 'jspdf'
import { Canvg } from 'canvg'

const props = defineProps({
  height: { type: Number, default: 300 },
  geneInfo: {
    type: Object,
    required: true,
    validator: gene =>
      ['geneName', 'uniprotId', 'proteinLength'].every(key => key in gene),
  },
  domains: {
    type: Array,
    default: () => [],
    validator: domains =>
      domains.every(d =>
        ['pfamId', 'pfamName', 'pfamDescription', 'start', 'end'].every(key =>
          key in d
        )
      ),
  },
  oncoprintData: {
    type: Array,
    default: () => [],
    validator: data =>
      data.every(
        sample =>
          'sample' in sample &&
          'mutations' in sample &&
          Array.isArray(sample.mutations)
      ),
  },
})

const container = ref(null)
const svg = ref(null)
const computedWidth = ref(1300)
const zoomScale = ref(1)
const zoomOffset = ref(0)
const isDownloadDropdownVisible = ref(false)
const isSampleDropdownVisible = ref(false)
const activeSampleId = ref(null)
const currentOrder = ref([...props.oncoprintData])
const positionMap = ref(new Map())
const mousePosition = ref({ x: 0, y: 0 })
let hideDropdownTimer = null

function showDownloadDropdown() {
  isDownloadDropdownVisible.value = true
}
function hideDownloadDropdown() {
  isDownloadDropdownVisible.value = false
}

function showSampleDropdown(sampleId) {
  clearTimeout(hideDropdownTimer)
  isSampleDropdownVisible.value = true
  activeSampleId.value = sampleId
}
function startHideSampleDropdownTimer() {
  clearTimeout(hideDropdownTimer)
  hideDropdownTimer = setTimeout(() => {
    isSampleDropdownVisible.value = false
    activeSampleId.value = null
  }, 200)
}

function zoomIn() {
  zoomScale.value = Math.min(zoomScale.value * 1.5, 20)
  const maxOffset =
    props.geneInfo.proteinLength -
    props.geneInfo.proteinLength / zoomScale.value
  zoomOffset.value = Math.min(zoomOffset.value, maxOffset)
}
function zoomOut() {
  zoomScale.value = Math.max(zoomScale.value / 1.5, 1)
  zoomOffset.value = Math.min(
    zoomOffset.value,
    props.geneInfo.proteinLength -
      props.geneInfo.proteinLength / zoomScale.value
  )
}
function panLeft() {
  const step = props.geneInfo.proteinLength / 10 / zoomScale.value
  zoomOffset.value = Math.max(zoomOffset.value - step, 0)
}
function panRight() {
  const step = props.geneInfo.proteinLength / 10 / zoomScale.value
  const maxOffset =
    props.geneInfo.proteinLength -
    props.geneInfo.proteinLength / zoomScale.value
  zoomOffset.value = Math.min(zoomOffset.value + step, maxOffset)
}

function moveRowUp(sampleId) {
  const index = currentOrder.value.findIndex(s => s.sample === sampleId)
  if (index > 0) {
    const temp = currentOrder.value[index]
    currentOrder.value.splice(index, 1)
    currentOrder.value.splice(index - 1, 0, temp)
    updateRowPositions(true)
  }
}

function moveRowDown(sampleId) {
  const index = currentOrder.value.findIndex(s => s.sample === sampleId)
  if (index < currentOrder.value.length - 1) {
    const temp = currentOrder.value[index]
    currentOrder.value.splice(index, 1)
    currentOrder.value.splice(index + 1, 0, temp)
    updateRowPositions(true)
  }
}

function sortByMutationCount(type) {
  currentOrder.value.sort((a, b) => {
    const countA = a.mutations.filter(m => m.type === type).length
    const countB = b.mutations.filter(m => m.type === type).length
    return countB - countA
  })
  updateRowPositions(true)
}

const updateWidth = () => {
  if (container.value) {
    const parentWidth =
      container.value.parentElement.getBoundingClientRect().width
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
  clearTimeout(hideDropdownTimer)
})

const pfamColorMap = ref({})
const mutationColorMap = {
  'Gain-of-function': '#CC0000',
  'Loss-of-function': '#0072B2',
  'Functional neutral': '#bcbcbc',
  null: 'white',
}
const colorPalette = ['#ffd92f', '#a6cee3', '#b2df8a', '#fb9a99', '#fdbf6f']

const sampleTextPositions = ref({})

function getSampleDropdownStyle(sampleId) {
  const pos = sampleTextPositions.value[sampleId]
  if (!pos || !container.value) return { display: 'none' }
  const margin = { top: 50, left: 150 }
  const sampleText = d3.select(svg.value).select(`g[data-id="${sampleId}"] text.sample-label`)
  const textBox = sampleText.node()?.getBBox()
  if (!textBox) return { display: 'none' }
  
  const dropdownWidth = 140
  return {
    position: 'absolute',
    left: `${margin.left - dropdownWidth}px`,
    top: `${pos.y + margin.top - 10}px`,
    zIndex: 20,
  }
}

function updateRowPositions(withTransition = false) {
  const rectHeight = 15
  const gap = 5
  const yStart = 30 + 20 + 40
  currentOrder.value.forEach((sample, i) => {
    const y = yStart + i * (rectHeight + gap)
    const gSel = d3.select(svg.value).select(`g[data-id="${sample.sample}"]`)
    if (withTransition) {
      gSel.transition().duration(300).attr('transform', `translate(0, ${y})`)
    } else {
      gSel.attr('transform', `translate(0, ${y})`)
    }
    positionMap.value.set(sample.sample, y)
    sampleTextPositions.value[sample.sample] = {
      x: -10,
      y: y + rectHeight / 2 - 1,
    }
  })
}

function getMutationCounts(sample) {
  const counts = {
    'Gain-of-function': 0,
    'Loss-of-function': 0,
    'Functional neutral': 0,
  }
  sample.mutations.forEach(m => {
    if (m.type in counts) {
      counts[m.type]++
    }
  })
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  return {
    counts,
    percentages: total > 0 ? {
      'Gain-of-function': (counts['Gain-of-function'] / total) * 100,
      'Loss-of-function': (counts['Loss-of-function'] / total) * 100,
      'Functional neutral': (counts['Functional neutral'] / total) * 100,
    } : {
      'Gain-of-function': 0,
      'Loss-of-function': 0,
      'Functional neutral': 0,
    },
    total
  }
}

function drawTrack() {
  if (!svg.value) return
  const svgEl = d3.select(svg.value)
  svgEl.selectAll('*').remove()

  const margin = { top: 50, right: 200, bottom: 30, left: 150 }
  const innerWidth = computedWidth.value - margin.left - margin.right
  const g = svgEl.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const totalLength = props.geneInfo.proteinLength
  const windowSize = totalLength / zoomScale.value
  const start = zoomOffset.value
  const end = Math.min(start + windowSize, totalLength)

  const x = d3.scaleLinear().domain([start + 1, end]).range([0, innerWidth])
  const tickInterval = totalLength <= 500 ? 100 : 500
  let tickValues = d3.range(Math.ceil((start + 1) / tickInterval) * tickInterval, end, tickInterval)
  if (start <= 1) tickValues = [1, ...tickValues]
  if (end >= totalLength && end <= totalLength + 0.001) tickValues = [...tickValues, totalLength]
  const xAxis = d3
    .axisBottom(x)
    .tickValues(tickValues)
    .tickFormat(d => d === totalLength ? `${Math.round(d)} aa` : Math.round(d))
    .tickSize(6)

  const yGene = 30
  const geneRectHeight = 20
  const geneWidth = x(end) - x(start + 1)
  const baseStrokeWidth = 1
  const scaledStrokeWidth = baseStrokeWidth / zoomScale.value

  g.append('rect')
    .attr('x', x(start + 1))
    .attr('y', yGene)
    .attr('width', Math.max(geneWidth, innerWidth))
    .attr('height', geneRectHeight)
    .attr('fill', 'white')
    .attr('stroke', 'black')
    .attr('stroke-width', scaledStrokeWidth)

  const leftTextX = -margin.left + 100
  g.append('text')
    .text(props.geneInfo.geneName)
    .attr('x', leftTextX)
    .attr('y', yGene + geneRectHeight / 2)
    .attr('text-anchor', 'start')
    .attr('font-size', 14)
    .attr('font-weight', 'bold')

  g.append('text')
    .text(props.geneInfo.uniprotId)
    .attr('x', leftTextX)
    .attr('y', yGene + geneRectHeight + 12)
    .attr('text-anchor', 'start')
    .attr('font-size', 14)
    .attr('fill', '#555')

  const domainGroup = g
    .selectAll('g.domain')
    .data(props.domains)
    .enter()
    .append('g')
    .attr('class', 'domain')

  domainGroup
    .append('rect')
    .attr('x', d => x(d.start))
    .attr('y', yGene)
    .attr('width', d => Math.max(x(d.end) - x(d.start), 1))
    .attr('height', geneRectHeight)
    .attr('fill', d => pfamColorMap.value[d.pfamId] || '#888')
    .attr('stroke', 'black')
    .attr('stroke-width', scaledStrokeWidth)
    .on('mouseover', function (event, d) {
      const fillColor = pfamColorMap.value[d.pfamId] || '#888'
      const darkerColor = d3.color(fillColor).darker(1).toString()
      d3.select(this)
        .transition()
        .duration(150)
        .style('cursor', 'pointer')
        .attr('stroke-width', scaledStrokeWidth * 3)
        .attr('stroke', darkerColor)
      showTooltip(
        event,
        `Pfam: ${d.pfamId}<br>${d.pfamName}<br>${d.pfamDescription}`
      )
    })
    .on('mouseout', function () {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('stroke-width', scaledStrokeWidth)
        .attr('stroke', 'black')
      hideTooltip()
    })

  domainGroup
    .append('text')
    .text(d => d.pfamName)
    .attr('x', d => x((d.start + d.end) / 2))
    .attr('y', yGene + geneRectHeight / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('fill', 'white')
    .attr('pointer-events', 'none')

  const rectHeight = 15
  const gap = 5
  const yStart = yGene + geneRectHeight + 40

  const layerGroup = g.append('g').attr('class', 'oncoprint-layers')
  const barHeight = 15
  const barGap = 2
  const maxBarWidth = 75
  const mutationTypes = ['Gain-of-function', 'Loss-of-function', 'Functional neutral']
  const barScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, maxBarWidth])

  currentOrder.value.forEach((sample, i) => {
    const y = yStart + i * (rectHeight + gap)
    const sampleGroup = layerGroup
      .append('g')
      .attr('class', 'sample-row')
      .attr('data-id', sample.sample)
      .attr('transform', `translate(0, ${y})`)
      .call(
        d3
          .drag()
          .on('start', function () {
            d3.select(this).raise().classed('dragging', true)
            clearTimeout(hideDropdownTimer)
            hideSampleDropdown()
          })
          .on('drag', function (event) {
            d3.select(this).attr('transform', `translate(0, ${event.y})`)
          })
          .on('end', function (event) {
            d3.select(this).classed('dragging', false)
            const draggedId = d3.select(this).attr('data-id')
            const draggedY = event.y

            let closestId = null
            let minDist = Infinity
            positionMap.value.forEach((yPos, id) => {
              if (id === draggedId) return
              const dist = Math.abs(yPos - draggedY)
              if (dist < minDist) {
                minDist = dist
                closestId = id
              }
            })

            if (closestId) {
              const draggedIdx = currentOrder.value.findIndex(
                s => s.sample === draggedId
              )
              const targetIdx = currentOrder.value.findIndex(
                s => s.sample === closestId
              )
              const draggedSample = currentOrder.value.splice(draggedIdx, 1)[0]
              currentOrder.value.splice(targetIdx, 0, draggedSample)
              updateRowPositions(true)
            } else {
              updateRowPositions(true)
            }
          })
      )

    sampleGroup
      .append('text')
      .attr('class', 'sample-label')
      .attr('x', -10)
      .attr('y', rectHeight / 2 - 1)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', 13)
      .text(sample.sample)
      .style('cursor', 'pointer')
      .on('mouseenter', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('font-weight', 'bold')
          .attr('stroke', '#1e90ff')
          .attr('stroke-width', 1)
          .style('fill', '#1e90ff')
        showSampleDropdown(sample.sample)
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('font-weight', 'normal')
          .attr('stroke', 'none')
          .style('fill', 'black')
        startHideSampleDropdownTimer()
      })

    sampleGroup
      .selectAll('rect.mutation-rect')
      .data(sample.mutations)
      .enter()
      .append('rect')
      .attr('class', 'mutation-rect')
      .attr('x', d => x(d.start))
      .attr('y', 0)
      .attr('width', d => Math.max(x(d.end) - x(d.start), 3))
      .attr('height', rectHeight)
      .attr('fill', d => mutationColorMap[d.type] || '#ccc')
      .attr('stroke', 'white')
      .attr('stroke-width', scaledStrokeWidth)
      .attr('opacity', 1)
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .style('cursor', 'pointer')
          .attr('stroke-width', scaledStrokeWidth * 3)
          .attr('stroke', '#1e90ff')
        showTooltip(
          event,
          `Ref: ${d.ref || ''}<br>${d.type}<br>Position: ${d.start}`
        )
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke-width', scaledStrokeWidth)
          .attr('stroke', 'white')
        hideTooltip()
      })

    const { counts, percentages, total } = getMutationCounts(sample)
    const barGroup = sampleGroup.append('g')
      .attr('transform', `translate(${innerWidth + 20}, 0)`)
    
    let currentX = 0
    mutationTypes.forEach((type, index) => {
      const percentage = percentages[type]
      const count = counts[type]
      if (percentage > 0) {
        barGroup.append('rect')
          .attr('x', currentX)
          .attr('y', 0)
          .attr('width', barScale(percentage))
          .attr('height', barHeight)
          .attr('fill', mutationColorMap[type])
          .on('mouseover', function(event) {
            d3.select(this)
              .transition()
              .duration(150)
              .style('cursor', 'pointer')
            showTooltip(event, `${type}: ${count} (${percentage.toFixed(1)}%)`)
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(150)
            hideTooltip()
          })
        currentX += barScale(percentage) + barGap
      }
    })

    sampleTextPositions.value[sample.sample] = {
      x: -10,
      y: y + rectHeight / 2 - 1,
    }
  })

  const axisGroup = g.append('g')
    .attr('transform', `translate(0, ${yGene + geneRectHeight + 3})`)
    .call(xAxis)
  
  axisGroup.selectAll('.tick line, .domain')
    .attr('stroke-width', baseStrokeWidth)
  axisGroup.selectAll('text')
    .style('font-size', '14px')

  const legendY = yStart + currentOrder.value.length * (rectHeight + gap) + 20
  const legend = g.append('g').attr('class', 'mutation-legend').attr('transform', `translate(0, ${legendY})`)
  Object.entries(mutationColorMap)
    .filter(([type]) => type !== "null")
    .forEach(([type, color], i) => {
      const xOffset = i * 150
      legend
        .append('rect')
        .attr('x', xOffset)
        .attr('y', 0)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', color)
        .attr('stroke', 'black')
        .attr('stroke-width', scaledStrokeWidth)
      legend
        .append('text')
        .attr('x', xOffset + 20)
        .attr('y', 12)
        .attr('font-size', 14)
        .text(type)
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

const DPI_SCALE = 2
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

  const width = (svgEl.clientWidth || computedWidth.value) * DPI_SCALE
  const height = (svgEl.clientHeight || props.height) * DPI_SCALE

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.scale(DPI_SCALE, DPI_SCALE)
  const v = await Canvg.from(ctx, svgString)
  await v.render()

  const pdf = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [width / DPI_SCALE, height / DPI_SCALE],
  })
  const imgData = canvas.toDataURL('image/png')
  pdf.addImage(imgData, 'PNG', 0, 0, width / DPI_SCALE, height / DPI_SCALE)
  pdf.save(`${props.geneInfo.geneName}_oncoprint.pdf`)
}

function downloadSVG() {
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

  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.geneInfo.geneName}_oncoprint.svg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

watch(
  [
    () => computedWidth.value,
    () => props.height,
    () => props.geneInfo,
    () => props.oncoprintData,
    () => zoomScale.value,
    () => zoomOffset.value,
  ],
  () => {
    currentOrder.value = [...props.oncoprintData]
    drawTrack()
  },
  { deep: true }
)
watch(
  () => props.domains,
  newDomains => {
    const map = {}
    const uniquePfamIds = [...new Set(newDomains.map(d => d.pfamId))]
    uniquePfamIds.forEach((id, idx) => {
      map[id] = colorPalette[idx % colorPalette.length]
    })
    pfamColorMap.value = map
    drawTrack()
  },
  { immediate: true, deep: true }
)
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

.sample-row.dragging {
  opacity: 0.7;
  cursor: grabbing;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
  min-width: 80px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 20;
  border-radius: 4px;
  overflow: hidden;
}

.dropdown-item {
  color: #000000;
  padding: 8px 12px;
  text-decoration: none;
  text-align: center;
  display: block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 12px;
  margin: 2px;
}

.dropdown-item:hover {
  background-color: #f1f1f1;
}

.sample-dropdown {
  position: absolute;
}

.sample-dropdown-content {
  background-color: #fff;
  min-width: 140px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 20;
  border-radius: 4px;
  overflow: hidden;
  pointer-events: auto;
  position: relative;
}

.sample-dropdown-content::before {
  content: '';
  position: absolute;
  right: -10px; /* Adjusted to account for larger triangle */
  top: 10px; /* Align with vertical center of datasetId text */
  width: 0;
  height: 0;
  border-left: 10px solid #fff; /* Increased from 8px to 10px */
  border-top: 10px solid transparent; /* Increased from 8px to 10px */
  border-bottom: 10px solid transparent; /* Increased from 8px to 10px */
  z-index: 21;
}

.sample-dropdown-item {
  color: #000000;
  padding: 8px 12px;
  text-decoration: none;
  display: block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 12px;
  margin: 2px;
}

.sample-dropdown-item:hover {
  background-color: #f1f1f1;
}
</style>
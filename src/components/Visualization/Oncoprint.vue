<template>
  <div
    ref="container"
    style="position: relative; user-select: none; display: flex; justify-content: center; padding-bottom: 50px;"
  >
    <svg ref="svg" :width="computedWidth" :height="height"></svg>
    <!-- Tooltip rendered at body level -->
    <teleport to="body">
      <div
        v-if="tooltipVisible"
        class="custom-tooltip"
        :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }"
      >
        <!-- Key-value table for Ref, Position, Type, or domain/proportion bar data -->
        <table style="font-family: Arial; font-size: 14px; border-collapse: collapse; margin-bottom: 10px;">
          <tbody>
            <tr v-for="(item, index) in tooltipContent.data" :key="index">
              <td style="padding-right: 10px;">{{ item.key }}:</td>
              <td>
                <v-chip
                  v-if="item.key === 'Type'"
                  density="compact"
                  :color="mutationColorMap[item.value] || '#bcbcbc99'"
                >
                  {{ item.value }}
                </v-chip>
                <span v-else>{{ item.value }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Three-column table for infoData when mutation -->
        <table
          v-if="tooltipContent.isMutationWithInfo && tooltipContent.infoData.length > 0"
          style="font-family: Arial; font-size: 14px; border-collapse: collapse;"
        >
          <thead>
            <tr>
              <th style="font-weight: bold; text-align: center; padding: 5px; border-bottom: 1px solid #ccc;">HGVS.p</th>
              <th style="font-weight: bold; text-align: center; padding: 5px; border-bottom: 1px solid #ccc;">Score</th>
              <th style="font-weight: bold; text-align: center; padding: 5px; border-bottom: 1px solid #ccc;">Classification</th>
              <th style="font-weight: bold; text-align: center; padding: 5px; border-bottom: 1px solid #ccc;">Consequence</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(info, index) in tooltipContent.infoData"
              :key="index"
              :style="index > 0 ? 'border-top: 1px solid #ccc;' : ''"
            >
              <td style="padding: 5px; text-align: center;">{{ info.ref2alt || '' }}</td>
              <td style="padding: 5px; text-align: center;">{{ info.score || '' }}</td>
              <td style="padding: 5px; text-align: center;">
                <v-chip
                  density="compact"
                  :color="mutationColorMap[info.type] || '#bcbcbc99'"
                >
                  {{ info.type }}
                </v-chip>
              </td>
              <td style="padding: 5px; text-align: center;">
                <v-chip
                  density="compact"
                  :color="consequenceColorMap[info.consequence] || '#bcbcbc99'"
                >
                  {{ info.consequence }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </teleport>

    <!-- Download buttons at bottom center -->
    <div
      class="d-flex justify-center"
      style="position: absolute; bottom: 100px; width: 100%; z-index: 0; gap: 6px;"
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
          <div class="dropdown-item" @click="downloadSVG">SVG</div>
          <div class="dropdown-item" @click="downloadPDF">PDF</div>

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
const tooltipVisible = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })
const tooltipContent = ref({
  data: [],
  isMutationWithInfo: false,
  infoData: [],
  mutationType: '',
})
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
  'Functionally normal': '#bcbcbc',
  null: 'white',
}

const consequenceColorMap = {
  'Missense': '#E69F00',
  'Nonsense': '#D55E00',
  'Synonymous': '#009E73',
  'Splice site': '#CC79A7',
  'Stop_lost': '#882255',
  'Intron': '#999999',
  'UTR': '#56B4E9',
  'Frameshift': '#CC0000',
  'ncRNA': '#F0E442',
  'Upstream': '#0072B2',
  'Intergenic': '#AAAAAA',
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
    zIndex: 10, // Above buttons (z-index: 0)
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
    'Functionally normal': 0,
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
      'Functionally normal': (counts['Functionally normal'] / total) * 100,
    } : {
      'Gain-of-function': 33.33,
      'Loss-of-function': 33.33,
      'Functionally normal': 33.34,
    },
    total
  }
}

function manageTooltip({ event, content, show, isMutationWithInfo = false, infoData = [], mutationType = '' }) {
  if (!show) {
    tooltipVisible.value = false
    return
  }

  // Position tooltip near mouse cursor
  const offsetX = 10 // Pixels to the right of cursor
  const offsetY = 10 // Pixels below cursor
  const tooltipEl = container.value?.querySelector('.custom-tooltip')
  const tooltipRect = tooltipEl ? tooltipEl.getBoundingClientRect() : { width: 200, height: 100 } // Fallback dimensions

  let tooltipX = event.clientX + offsetX
  let tooltipY = event.clientY + offsetY

  // Adjust if tooltip would extend beyond viewport
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  if (tooltipX + tooltipRect.width > viewportWidth) {
    tooltipX = event.clientX - tooltipRect.width - offsetX // Position to the left
  }
  if (tooltipY + tooltipRect.height > viewportHeight) {
    tooltipY = event.clientY - tooltipRect.height - offsetY // Position above
  }

  // Ensure tooltip stays within viewport
  tooltipX = Math.max(0, Math.min(tooltipX, viewportWidth - tooltipRect.width))
  tooltipY = Math.max(0, Math.min(tooltipY, viewportHeight - tooltipRect.height))

  tooltipPosition.value = {
    x: tooltipX,
    y: tooltipY
  }

  // Generate tooltip content for key-value table
  const lines = content.split('<br>')
  const data = lines.map(line => {
    const [key, value = ''] = line.split(':').map(s => s.trim())
    return { key, value }
  })

  // Format infoData for three-column table with mutationType
  const formattedInfoData = infoData.map(info => ({
    ref2alt: info.ref2alt || '',
    score: info.score || '',
    type: info.type || '',
    consequence: info.consequence || ''
  }))

  tooltipContent.value = {
    data,
    isMutationWithInfo,
    infoData: formattedInfoData,
    mutationType,
  }

  tooltipVisible.value = true
}

function drawTrack() {
  if (!svg.value) return
  const svgEl = d3.select(svg.value)
  svgEl.selectAll('*').remove()

  const margin = { top: 100, right: 100, bottom: 60, left: 100 }
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

  const leftTextX = -margin.left + 45
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
      manageTooltip({
        event,
        content: `Pfam: ${d.pfamId}<br>Name: ${d.pfamName}<br>Description: ${d.pfamDescription}`,
        show: true,
      })
    })
    .on('mouseout', function () {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('stroke-width', scaledStrokeWidth)
        .attr('stroke', 'black')
      manageTooltip({ show: false })
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
  const barHeight = 13.5
  const barGap = 2
  const maxBarWidth = 50
  const mutationTypes = ['Gain-of-function', 'Loss-of-function', 'Functionally normal']
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
        if (d.type !== null) {
          d3.select(this)
            .transition()
            .duration(150)
            .style('cursor', 'pointer')
            .attr('stroke-width', scaledStrokeWidth * 3)
            .attr('stroke', '#1e90ff')
          const content = `Ref: ${d.ref || ''}<br>Position: ${d.start}<br>Classification: ${d.type}`
          const infoData = (d.info && typeof d.info === 'string')
            ? d.info.split('|').map(entry => {
                const [ref2alt = '', score = '', type = '', consequence = ''] = entry.split(';').map(s => s.trim())
                return { ref2alt, score, type, consequence }
              })
            : []
          manageTooltip({
            event,
            content,
            show: true,
            isMutationWithInfo: true,
            infoData,
            mutationType: d.type,
          })
        }
      })
      .on('mouseout', function (event, d) {
        if (d.type !== null) {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('stroke-width', scaledStrokeWidth)
            .attr('stroke', 'white')
          manageTooltip({ show: false })
        }
      })

    const { counts, percentages, total } = getMutationCounts(sample)
    const barGroup = sampleGroup.append('g')
      .attr('transform', `translate(${innerWidth + 20}, 0)`)
    
    let currentX = 0
    const activeTypes = mutationTypes.filter(type => total > 0 ? percentages[type] > 0 : true)
    const totalGaps = activeTypes.length > 1 ? (activeTypes.length - 1) * barGap : 0
    const totalBarWidth = maxBarWidth - totalGaps
    const typeWidth = total > 0 ? null : totalBarWidth / activeTypes.length

    activeTypes.forEach((type, index) => {
      const percentage = percentages[type]
      const count = counts[type]
      const barWidth = total > 0 ? (percentage / 100) * totalBarWidth : typeWidth
      barGroup.append('rect')
        .attr('x', currentX)
        .attr('y', 0)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr('fill', mutationColorMap[type])
        .attr('stroke', 'black')
        .attr('stroke-width', scaledStrokeWidth)
        .on('mouseover', function(event) {
          d3.select(this)
            .transition()
            .duration(150)
            .style('cursor', 'pointer')
          manageTooltip({
            event,
            content: `Type: ${type}<br>Count: ${count}<br>Percentage: ${percentage.toFixed(1)}%`,
            show: true,
          })
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(150)
          manageTooltip({ show: false })
        })
      currentX += barWidth + (index < activeTypes.length - 1 ? barGap : 0)
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

  const legendY = yStart + currentOrder.value.length * (rectHeight + gap) + 30
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
  background-color: #ffffff;
  min-width: 80px;
  border: 1px solid #d1d5db;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  z-index: 10;
}

.dropdown-item {
  color: #1f2937;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
}

.sample-dropdown {
  position: absolute;
}

.sample-dropdown-content {
  background-color: #ffffff;
  min-width: 140px;
  border: 1px solid #d1d5db;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  pointer-events: auto;
  position: relative;
  z-index: 10;
}

.sample-dropdown-content::before {
  content: '';
  position: absolute;
  right: -10px;
  top: 10px;
  width: 0;
  height: 0;
  border-left: 10px solid #ffffff;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  z-index: 11;
}

.sample-dropdown-content::after {
  content: '';
  position: absolute;
  right: -11px;
  top: 10px;
  width: 0;
  height: 0;
  border-left: 11px solid #d1d5db;
  border-top: 11px solid transparent;
  border-bottom: 11px solid transparent;
  z-index: 9;
}

.sample-dropdown-item {
  color: #1f2937;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.sample-dropdown-item:hover {
  background-color: #f3f4f6;
}

.custom-tooltip {
  position: fixed;
  z-index: 99999;
  background-color: white;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}
</style>
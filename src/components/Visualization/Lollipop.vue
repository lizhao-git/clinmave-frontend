<template>
  <div
    ref="container"
    style="position: relative; user-select: none; display: flex; justify-content: center; padding-bottom: 50px;"
  >
    <svg ref="svg" :width="computedWidth" :height="height" style="overflow: visible;"></svg>
    <div
      class="d-flex justify-center"
      style="position: absolute; bottom: 30px; width: 100%; z-index: 10; gap: 6px;"
    >
      <v-btn icon class="ma-1" color="white" elevation="1" @click="zoomOut" title="Zoom Out" :disabled="!isGeneInfoValid">
        <v-icon>mdi-magnify-minus</v-icon>
      </v-btn>
      <v-btn icon class="ma-1" color="white" elevation="1" @click="zoomIn" title="Zoom In" :disabled="!isGeneInfoValid">
        <v-icon>mdi-magnify-plus</v-icon>
      </v-btn>
      <v-btn icon class="ma-1" color="white" elevation="1" @click="panLeft" title="Pan Left" :disabled="!isGeneInfoValid">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-btn icon class="ma-1" color="white" elevation="1" @click="panRight" title="Pan Right" :disabled="!isGeneInfoValid">
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
          :disabled="!isGeneInfoValid"
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

    <!-- Tooltip rendered at body level -->
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
              <td>
                <v-chip
                  v-if="item.key === 'Class' || item.key === 'Consequence'"
                  density="compact"
                  :color="item.key === 'Class' ? mutationColorMap[item.value] || '#bcbcbc99' : consequenceColorMap[item.value] || '#bcbcbc99'"
                >
                  {{ item.value }}
                </v-chip>
                <span v-else>{{ item.value }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import jsPDF from 'jspdf'
import { Canvg } from 'canvg'

const props = defineProps({
  height: { type: Number, default: 450 },
  geneInfo: {
    type: Object,
    required: true,
    validator: gene =>
      ['geneName', 'uniprotId', 'proteinLength'].every(key => key in gene && gene[key] != null),
  },
  domains: {
    type: Array,
    default: () => [],
    validator: domains =>
      domains.every(d =>
        ['pfamId', 'pfamName', 'pfamDescription', 'start', 'end'].every(key =>
          key in d && d[key] != null
        )
      ),
  },
  mutations: {
    type: Array,
    default: () => [],
    validator: mutations =>
      mutations.every(m =>
        ['score', 'start'].every(key => key in m && m[key] != null)
      ),
  },
})

const container = ref(null)
const svg = ref(null)
const computedWidth = ref(1300)
const zoomScale = ref(1)
const zoomOffset = ref(0)
const isDownloadDropdownVisible = ref(false)
const tooltipVisible = ref(false)
const tooltipPosition = ref({ x: 10, y: 10 })
const tooltipContent = ref({ data: [] })
let hideDropdownTimer = null

const isGeneInfoValid = computed(() => {
  return (
    props.geneInfo &&
    props.geneInfo.geneName != null &&
    props.geneInfo.uniprotId != null &&
    props.geneInfo.proteinLength != null &&
    typeof props.geneInfo.proteinLength === 'number' &&
    props.geneInfo.proteinLength > 0
  )
})

function showDownloadDropdown() {
  if (!isGeneInfoValid.value) return
  clearTimeout(hideDropdownTimer)
  isDownloadDropdownVisible.value = true
}
function hideDownloadDropdown() {
  hideDropdownTimer = setTimeout(() => {
    isDownloadDropdownVisible.value = false
  }, 200)
}

function zoomIn() {
  if (!isGeneInfoValid.value) return
  const oldScale = zoomScale.value
  zoomScale.value = Math.min(zoomScale.value * 1.2, 20)
  const maxOffset = Math.max(0, props.geneInfo.proteinLength - (props.geneInfo.proteinLength - 1) / zoomScale.value)
  zoomOffset.value = Math.min(zoomOffset.value * (zoomScale.value / oldScale), maxOffset)
}

function zoomOut() {
  if (!isGeneInfoValid.value) return
  const oldScale = zoomScale.value
  zoomScale.value = Math.max(zoomScale.value / 1.2, 1)
  const maxOffset = Math.max(0, props.geneInfo.proteinLength - (props.geneInfo.proteinLength - 1) / zoomScale.value)
  zoomOffset.value = Math.min(zoomOffset.value * (zoomScale.value / oldScale), maxOffset)
}

function panLeft() {
  if (!isGeneInfoValid.value) return
  const step = (props.geneInfo.proteinLength - 1) / 10
  zoomOffset.value = Math.max(0, zoomOffset.value - step)
}

function panRight() {
  if (!isGeneInfoValid.value) return
  const step = (props.geneInfo.proteinLength - 1) / 10
  const maxOffset = Math.max(0, props.geneInfo.proteinLength - (props.geneInfo.proteinLength - 1) / zoomScale.value)
  zoomOffset.value = Math.min(zoomOffset.value + step, maxOffset)
}

function updateWidth() {
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
  clearTimeout(hideDropdownTimer)
})

const pfamColorMap = ref({})
const mutationColorMap = {
  'Gain-of-function': '#CC0000',
  'Loss-of-function': '#0072B2',
  'Functionally normal': '#bcbcbc',
  null: '#bcbcbc99',
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

function drawTrack() {
  if (!svg.value) {
    return
  }
  const svgEl = d3.select(svg.value)
  svgEl.selectAll('*').remove()

  const margin = { top: 50, right: 50, bottom: 100, left: 100 }
  const innerWidth = computedWidth.value - margin.left - margin.right
  const innerHeight = props.height - margin.top - margin.bottom
  const g = svgEl.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const totalLength = props.geneInfo.proteinLength
  const windowSize = (totalLength - 1) / zoomScale.value
  const start = Math.max(1, Math.min(zoomOffset.value, totalLength - windowSize))
  const end = Math.min(start + windowSize, totalLength)

  // X-axis from 1 to proteinLength
  const x = d3.scaleLinear().domain([start, end]).range([0, innerWidth])
  const tickInterval = windowSize <= 500 ? 100 : 500
  let tickValues = d3.range(Math.ceil(start / tickInterval) * tickInterval, end + tickInterval, tickInterval)
  if (end >= totalLength - 0.001) tickValues = [...tickValues.filter(d => d <= totalLength), totalLength]
  tickValues = tickValues.filter(d => d >= 1 && d <= totalLength)
  if (tickValues.length === 0 || tickValues[0] > start) tickValues.unshift(Math.ceil(start))
  if (tickValues[tickValues.length - 1] < end && end < totalLength - 0.001) tickValues.push(Math.floor(end))

  const xAxis = d3
    .axisBottom(x)
    .tickValues(tickValues)
    .tickFormat(d => d === totalLength ? `${Math.round(d)} aa` : Math.round(d))
    .tickSize(6)

  const allMutations = props.mutations && Array.isArray(props.mutations) ? props.mutations : []
  const validMutations = allMutations.filter(m => {
    const isValid =
      'start' in m && typeof m.start === 'number' && m.start >= 1 && m.start <= totalLength &&
      'score' in m && !isNaN(parseFloat(m.score))
    if (!isValid) console.warn('Invalid mutation:', m)
    return isValid
  })

  // Dynamically compute y-axis range based on mutation scores
  const scores = validMutations.map(m => parseFloat(m.score))
  let maxScore = scores.length > 0 ? Math.max(...scores, 0) : 0.1
  let minScore = scores.length > 0 ? Math.min(...scores, 0) : -0.1
  let yMax, yMin

  // Adjust y-axis range for small scores
  if (maxScore < 1 && maxScore > 0) {
    yMax = Math.max(0.1, maxScore * 1.1)
  } else {
    yMax = Math.ceil(maxScore + Math.abs(maxScore) * 0.1) || 0.1
  }
  if (minScore > -1 && minScore < 0) {
    yMin = Math.min(-0.3, minScore * 1.1)
  } else {
    yMin = Math.floor(minScore - Math.abs(minScore) * 0.1) || -0.1
  }

  // Define y-axis scales
  const geneRectHeight = 20
  const yAxisHeight = Math.min(innerHeight * 0.24, 80)
  const yPositive = d3.scaleLinear()
    .domain([0, yMax])
    .range([0, -yAxisHeight])
  const yNegative = d3.scaleLinear()
    .domain([0, yMin])
    .range([0, yAxisHeight])

  // Generate dynamic tick values
  let yPositiveTicks, yNegativeTicks
  if (yMax <= 0.1) {
    yPositiveTicks = d3.range(0, yMax + 0.01, yMax / 3).map(d => Number(d.toFixed(2)))
  } else {
    yPositiveTicks = yMax > 0 ? d3.range(0, yMax + 1, Math.ceil(yMax / 3) || 0.1) : [0]
  }
  if (yMin >= -0.3 && yMin < 0) {
    yNegativeTicks = [0, -0.1, -0.2, -0.3]
  } else {
    yNegativeTicks = yMin < 0 ? d3.range(0, yMin - 1, Math.floor(yMin / 3) || -0.1) : [0]
  }

  const yAxisPositive = d3.axisLeft(yPositive)
    .tickValues(yPositiveTicks)
    .tickFormat(yMax <= 0.1 ? d3.format(".2f") : d3.format("d"))
    .tickSizeOuter(6)
  const yAxisNegative = d3.axisLeft(yNegative)
    .tickValues(yNegativeTicks)
    .tickFormat(yMin >= -0.3 ? d3.format(".1f") : d3.format("d"))
    .tickSizeOuter(6)

  const yGene = innerHeight / 2
  const geneWidth = x(end) - x(start)
  const baseStrokeWidth = 0.5
  const scaledStrokeWidth = baseStrokeWidth / zoomScale.value

  // Gene rectangle
  g.append('rect')
    .attr('x', x(start))
    .attr('y', yGene)
    .attr('width', geneWidth)
    .attr('height', geneRectHeight)
    .attr('fill', 'white')
    .attr('stroke', 'black')
    .attr('stroke-width', baseStrokeWidth)

  // Gene name and UniProt ID
  const leftTextX = -margin.left + 45
  g.append('text')
    .text(props.geneInfo.geneName || 'Unknown Gene')
    .attr('x', leftTextX)
    .attr('y', yGene + geneRectHeight / 2)
    .attr('text-anchor', 'start')
    .attr('font-size', 14)
    .attr('font-weight', 'bold')

  g.append('text')
    .text(props.geneInfo.uniprotId || 'Unknown ID')
    .attr('x', leftTextX)
    .attr('y', yGene + geneRectHeight + 12)
    .attr('text-anchor', 'start')
    .attr('font-size', 14)
    .attr('fill', '#555')

  // Domains
  const validDomains = props.domains.filter(d => {
    const isValid =
      ['pfamId', 'pfamName', 'pfamDescription', 'start', 'end'].every(key => key in d && d[key] != null) &&
      typeof d.start === 'number' && d.start >= 1 && d.start <= totalLength &&
      typeof d.end === 'number' && d.end >= d.start && d.end <= totalLength
    if (!isValid) console.warn('Invalid domain:', d)
    return isValid
  }).filter(d => d.end >= start && d.start <= end)

  const domainGroup = g
    .selectAll('g.domain')
    .data(validDomains)
    .enter()
    .append('g')
    .attr('class', 'domain')

  domainGroup
    .append('rect')
    .attr('x', d => x(Math.max(d.start, start)))
    .attr('y', yGene)
    .attr('width', d => {
      const domainWidth = x(Math.min(d.end, end)) - x(Math.max(d.start, start))
      return Math.max(domainWidth, 1)
    })
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
        .attr('stroke-width', scaledStrokeWidth * 2)
        .attr('stroke', darkerColor)
      tooltipVisible.value = true
      tooltipPosition.value = {
        x: event.clientX + 10,
        y: event.clientY + 10
      }
      const content = `Pfam: ${d.pfamId}<br>Name: ${d.pfamName}<br>Description: ${d.pfamDescription}`
      const lines = content.split('<br>')
      const data = lines.map(line => {
        const [key, value = ''] = line.split(':').map(s => s.trim())
        return { key, value }
      })
      tooltipContent.value = { data }
    })
    .on('mouseout', function () {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('stroke-width', scaledStrokeWidth)
        .attr('stroke', 'black')
      tooltipVisible.value = false
    })

  domainGroup
    .append('text')
    .text(d => d.pfamName)
    .attr('x', d => x((Math.max(d.start, start) + Math.min(d.end, end)) / 2))
    .attr('y', yGene + geneRectHeight / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('fill', 'white')
    .attr('pointer-events', 'none')

  // Lollipop plot
  const lollipopPositiveGroup = g.append('g')
    .attr('class', 'lollipop-plot-positive')
    .attr('transform', `translate(0, ${yGene - geneRectHeight * 1.3})`)
  const lollipopNegativeGroup = g.append('g')
    .attr('class', 'lollipop-plot-negative')
    .attr('transform', `translate(0, ${yGene + geneRectHeight * 2 * 1.3})`)

  let renderedCount = 0

  const visibleMutations = validMutations.filter(m => m.start >= start && m.start <= end)

  visibleMutations.forEach((mutation, index) => {
    let xPos = x(mutation.start)
    let score = parseFloat(mutation.score)
    let yPos = score >= 0 ? yPositive(score) : yNegative(score)
    const mutationType = mutation.type || 'Unknown'
    const consequenceClass = mutation.consequence || 'Unknown'
    const lollipopGroup = score >= 0 ? lollipopPositiveGroup : lollipopNegativeGroup

    xPos = Math.max(0, Math.min(innerWidth, xPos))
    yPos = Math.max(-yAxisHeight, Math.min(yAxisHeight, yPos))

    if (isNaN(xPos) || isNaN(yPos)) {
      console.warn(`Skipping mutation ${index}: start=${mutation.start}, xPos=${xPos}, yPos=${yPos} (NaN)`)
      return
    }

    lollipopGroup
      .append('circle')
      .attr('cx', xPos)
      .attr('cy', yPos)
      .attr('r', 3)
      .attr('fill', mutationColorMap[mutation.type] || '#bcbcbc99')
      .attr('fill-opacity', mutationType === 'Functionally normal' ? 0.6 : 1)
      .attr('stroke', 'white')
      .attr('stroke-width', scaledStrokeWidth * 1.5)
      .attr('class', 'mutation-circle')
      .on('mouseover', function (event) {
        d3.select(this)
          .transition()
          .duration(150)
          .style('cursor', 'pointer')
          .attr('r', 6)
          .attr('stroke', mutationColorMap[mutationType] || '#bcbcbc99')
          .attr('stroke-width', scaledStrokeWidth * 3)
        tooltipVisible.value = true
        tooltipPosition.value = {
          x: event.clientX + 10,
          y: event.clientY + 10
        }
        const content = `HGVS.p: ${mutation.ref || ''}<br>Position: ${mutation.start}<br>Score: ${mutation.score}<br>Classification: ${mutationType}<br>Consequence: ${consequenceClass}`
        const lines = content.split('<br>')
        const data = lines.map(line => {
          const [key, value = ''] = line.split(':').map(s => s.trim())
          return { key, value }
        })
        tooltipContent.value = { data }
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
          .attr('r', 3)
          .attr('stroke', 'white')
          .attr('stroke-width', scaledStrokeWidth * 1.5)
        tooltipVisible.value = false
      })

    renderedCount++
  })

  // Y-axis rendering
  g.append('g')
    .attr('transform', `translate(0, ${yGene - geneRectHeight * 1.3})`)
    .call(yAxisPositive)
    .selectAll('.tick line, .domain')
    .attr('stroke-width', baseStrokeWidth)

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -50)
    .attr('x', -(yGene - geneRectHeight * 1.3 - yAxisHeight / 2))
    .attr('dy', '0.71em')
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .text('Score')

  g.append('g')
    .attr('transform', `translate(0, ${yGene + geneRectHeight * 2 * 1.3})`)
    .call(yAxisNegative)
    .selectAll('.tick line, .domain')
    .attr('stroke-width', baseStrokeWidth)

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -50)
    .attr('x', -(yGene + geneRectHeight * 2 * 1.3 + yAxisHeight / 2))
    .attr('dy', '0.71em')
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .text('Score')

  // X-axis rendering
  const axisGroup = g.append('g')
    .attr('transform', `translate(0, ${yGene + geneRectHeight})`)
    .call(xAxis)
  axisGroup.selectAll('.tick line, .domain')
    .attr('stroke-width', baseStrokeWidth)
  axisGroup.selectAll('text')
    .style('font-size', '14px')

  // Legend
  const legendY = innerHeight + 20
  const legend = g.append('g')
    .attr('class', 'mutation-legend')
    .attr('transform', `translate(0, ${legendY})`)
  Object.entries(mutationColorMap)
    .filter(([type]) => type !== 'null')
    .forEach(([type, color], i) => {
      const xOffset = i * 150
      legend
        .append('circle')
        .attr('cx', xOffset + 7)
        .attr('cy', 7)
        .attr('r', 7)
        .attr('fill', color)
        .attr('fill-opacity', type === 'Functionally normal' ? 0.2 : 1)
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

async function downloadPDF() {
  if (!svg.value || !isGeneInfoValid.value) return
  const svgEl = svg.value
  let svgString = new XMLSerializer().serializeToString(svgEl)
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  if (!svgString.match(/^<\?xml/)) {
    svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString
  }

  const width = computedWidth.value * 2
  const height = props.height * 2
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  const v = await Canvg.from(ctx, svgString)
  await v.render()

  const pdf = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [width / 2, height / 2],
  })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width / 2, height / 2)
  pdf.save(`${props.geneInfo?.geneName || 'lollipop'}_lollipop.pdf`)
}

function downloadSVG() {
  if (!svg.value || !isGeneInfoValid.value) return
  const svgEl = svg.value
  let svgString = new XMLSerializer().serializeToString(svgEl)
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
  link.download = `${props.geneInfo?.geneName || 'lollipop'}_lollipop.svg`
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
    () => props.mutations,
    () => zoomScale.value,
    () => zoomOffset.value,
    () => props.domains,
  ],
  () => {
    const map = {}
    const uniquePfamIds = [...new Set(props.domains.map(d => d.pfamId))]
    uniquePfamIds.forEach((id, idx) => {
      map[id] = colorPalette[idx % colorPalette.length]
    })
    pfamColorMap.value = map
    drawTrack()
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.container {
  position: relative;
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 30;
}
.dropdown-item {
  color: #1f2937;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}
.dropdown-item:hover {
  background-color: #f3f4f6;
}
.mutation-circle {
  transition: all 0.2s ease;
}
.mutation-circle:hover {
  transform: translateY(-2px);
}
.custom-tooltip {
  position: fixed;
  z-index: 99999;
  background-color: white;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}
.custom-tooltip table tr {
  height: 12px; /* Increased row spacing */
}
.custom-tooltip table td {
  vertical-align: middle; /* Ensure vertical alignment for chips */
  padding: 4px 0; /* Additional padding for row spacing */
}
</style>
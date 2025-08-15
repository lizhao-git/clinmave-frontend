<template>
  <v-container fluid>
    <div>
      <v-progress-circular
        v-if="isLoading"
        indeterminate
        color="primary"
        class="ma-4"
        :size="50"
      ></v-progress-circular>
      <div id="sankey-chart" ref="sankeyContainer" v-show="!isLoading"></div>
    </div>
  </v-container>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  rawData: {
    type: Array,
    default: () => [
      { gene_name: 'ALK', clinical: 'ClinGen Clinical Actionability genes', disease: 'CGC & GDV genes' },
      { gene_name: 'AKT1', clinical: null, disease: 'Cancer Gene Census (CGC) genes' },
      { gene_name: 'AKT3', clinical: null, disease: 'CGC & GDV genes' },
      { gene_name: 'AHI1', clinical: null, disease: 'ClinGen Gene-Disease Validity (GDV) genes' },
      { gene_name: 'ARIH2', clinical: null, disease: null }
    ]
  }
})

const sankeyContainer = ref(null)
const isLoading = ref(true)

onMounted(() => {
  renderCustomSankey()
})

watch(() => props.rawData, () => {
  isLoading.value = true
  renderCustomSankey()
}, { deep: true })

function renderCustomSankey() {
  // Validate data
  if (!Array.isArray(props.rawData) || props.rawData.length === 0) {
    console.error('Invalid or empty rawData:', props.rawData)
    isLoading.value = false
    return
  }

  const width = 600
  const height = 400
  const nodeWidth = 20
  const padding = 40

  // Clear previous chart
  d3.select(sankeyContainer.value).selectAll('*').remove()

  const svg = d3.select(sankeyContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  // Data preprocessing
  const allGenesCount = props.rawData.length
  const noDiseaseCount = props.rawData.filter(d => d.disease == null).length
  const diseaseCounts = d3.rollups(
    props.rawData.filter(d => d.disease != null),
    v => v.length,
    d => d.disease
  )
  const clinicalCounts = d3.rollups(
    props.rawData.filter(d => d.clinical != null),
    v => v.length,
    d => d.clinical
  )

  const diseaseCategories = diseaseCounts.map(([name]) => name)
  const clinicalCategories = clinicalCounts.map(([name]) => name)

  const diseaseColor = d3.scaleOrdinal()
    .domain(diseaseCategories)
    .range(d3.schemeSet2)

  const clinicalColor = d3.scaleOrdinal()
    .domain(clinicalCategories)
    .range(d3.schemeSet3)

  // Build nodes
  const nodes = []
  nodes.push({ id: 'AllGenes', type: 'gene', value: allGenesCount, linked: allGenesCount - noDiseaseCount })
  diseaseCounts.forEach(([name, count]) => {
    nodes.push({ id: name, type: 'disease', value: count, color: diseaseColor(name) })
  })
  clinicalCounts.forEach(([name, count]) => {
    nodes.push({ id: name, type: 'clinical', value: count, color: clinicalColor(name) })
  })

  // Build links
  const links = []
  diseaseCounts.forEach(([disease, count]) => {
    links.push({ source: 'AllGenes', target: disease, value: count, color: diseaseColor(disease) })
  })
  props.rawData.forEach(item => {
    if (item.disease && item.clinical) {
      links.push({
        source: item.disease,
        target: item.clinical,
        value: 1,
        color: diseaseColor(item.disease)
      })
    }
  })

  const nodeMap = new Map(nodes.map(d => [d.id, d]))

  // Position nodes by column
  const col1 = nodes.filter(d => d.type === 'gene')
  const col2 = nodes.filter(d => d.type === 'disease')
  const col3 = nodes.filter(d => d.type === 'clinical')

  const maxTotal = Math.max(
    d3.sum(col1, d => d.value),
    d3.sum(col2, d => d.value),
    d3.sum(col3, d => d.value)
  )
  const scale = (height - padding * 2) / maxTotal

  const positionColumn = (col, x) => {
    let y = padding
    col.forEach(node => {
      node.x = x
      node.y = y
      node.height = node.value * scale
      y += node.height + 20
    })
  }

  positionColumn(col1, 50)
  positionColumn(col2, 300)
  positionColumn(col3, 550)

  // Merge links into bands
  const bandMap = new Map()
  links.forEach(link => {
    const key = `${link.source}->${link.target}`
    if (!bandMap.has(key)) {
      bandMap.set(key, { source: link.source, target: link.target, value: 0, color: link.color })
    }
    bandMap.get(key).value += link.value
  })
  const bands = Array.from(bandMap.values())

  // Calculate offsets for bands
  const sourceOffsets = new Map()
  const targetOffsets = new Map()

  const linkGroup = svg.append('g').attr('fill', 'none').attr('stroke-opacity', 0.4)

  // Draw bands with two-stage animation
  bands.forEach((band, index) => {
    const source = nodeMap.get(band.source)
    const target = nodeMap.get(band.target)

    const sTotalHeight = source.id === 'AllGenes'
      ? source.height * (source.linked / source.value)
      : source.height

    const sValueBase = source.id === 'AllGenes' ? source.linked : source.value

    const sOffset = sourceOffsets.get(source.id) || 0
    const tOffset = targetOffsets.get(target.id) || 0

    const sHeight = (band.value / sValueBase) * sTotalHeight
    const tHeight = (band.value / target.value) * target.height

    const sy0 = source.id === 'AllGenes'
      ? source.y + (sOffset / source.linked) * sTotalHeight
      : source.y + (sOffset / source.value) * source.height

    const ty0 = target.y + (tOffset / target.value) * target.height

    const x0 = source.x + nodeWidth
    const x1 = source.type === 'gene' ? 300 : 550 // Middle or target x-coordinate
    const y0_top = sy0
    const y0_bottom = sy0 + sHeight
    const y1_top = ty0
    const y1_bottom = ty0 + tHeight

    // Bezier curve parameters
    const curvature = 0.5

    // Generate path for stage 1 (source to middle)
    const generateStage1Path = (progress) => {
      const xi = d3.interpolateNumber(x0, source.type === 'gene' ? 300 : 550)
      const xCurrent = xi(progress)
      const x2 = xi(curvature * progress)
      const x3 = xi((1 - curvature) * progress)
      return `
        M${x0},${y0_top}
        C${x2},${y0_top} ${x3},${y1_top} ${xCurrent},${y1_top}
        L${xCurrent},${y1_bottom}
        C${x3},${y1_bottom} ${x2},${y0_bottom} ${x0},${y0_bottom}
        Z
      `
    }

    // Generate path for stage 2 (middle to target, for disease-to-clinical links)
    const generateStage2Path = (progress) => {
      const xi = d3.interpolateNumber(300, 550)
      const xCurrent = xi(progress)
      const x2 = xi(curvature * progress)
      const x3 = xi((1 - curvature) * progress)
      return `
        M${x0},${y0_top}
        C${x2},${y0_top} ${x3},${y1_top} ${xCurrent},${y1_top}
        L${xCurrent},${y1_bottom}
        C${x3},${y1_bottom} ${x2},${y0_bottom} ${x0},${y0_bottom}
        Z
      `
    }

    // Append path with two-stage animation
    const path = linkGroup.append('path')
      .attr('d', generateStage1Path(0))
      .attr('fill', band.color)
      .attr('fill-opacity', 0.6)
      .attr('stroke', 'none')
      .attr('class', 'sankey-band')

    // Stage 1: Source to middle
    path.transition()
      .duration(800)
      .delay(index * 500) // Delay for sequential animation
      .attrTween('d', () => {
        const interpolator = d3.interpolateNumber(0, 1)
        return t => generateStage1Path(interpolator(t))
      })
      .on('end', () => {
        // Stage 2: Middle to target (only for disease-to-clinical links)
        if (source.type === 'disease') {
          path.transition()
            .duration(800)
            .attrTween('d', () => {
              const interpolator = d3.interpolateNumber(0, 1)
              return t => generateStage2Path(interpolator(t))
            })
        }
      })

    // Hover effect
    path.on('mouseover', function () {
      d3.select(this)
        .attr('fill-opacity', 1)
        .attr('stroke', '#000')
        .attr('stroke-width', 2)
    })
    .on('mouseout', function () {
      d3.select(this)
        .attr('fill-opacity', 0.6)
        .attr('stroke', 'none')
    })

    // Update offsets
    sourceOffsets.set(source.id, sOffset + band.value)
    targetOffsets.set(target.id, tOffset + band.value)
  })

  // Draw nodes
  const nodeGroup = svg.append('g')
  nodeGroup.selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .each(function (d) {
      const g = d3.select(this)
      if (d.id === 'AllGenes') {
        const linkedHeight = d.height * (d.linked / d.value)
        g.append('rect')
          .attr('x', d.x)
          .attr('y', d.y)
          .attr('width', nodeWidth)
          .attr('height', linkedHeight)
          .attr('fill', '#2196f3')
        g.append('rect')
          .attr('x', d.x)
          .attr('y', d.y + linkedHeight)
          .attr('width', nodeWidth)
          .attr('height', d.height - linkedHeight)
          .attr('fill', '#ccc')
      } else {
        g.append('rect')
          .attr('x', d.x)
          .attr('y', d.y)
          .attr('width', nodeWidth)
          .attr('height', d.height)
          .attr('fill', d.color || (d.type === 'disease' ? '#4caf50' : '#ff9800'))
      }
      g.append('text')
        .attr('x', d.x + nodeWidth + 6)
        .attr('y', d.y + d.height / 2)
        .attr('dy', '0.35em')
        .attr('font-size', 12)
        .text(() => `${d.value}`)
    })

  // Legend
  const legendData = [
    ...diseaseCategories.map(c => ({ label: c, color: diseaseColor(c) })),
    ...clinicalCategories.map(c => ({ label: c, color: clinicalColor(c) }))
  ]

  const legend = svg.append('g')
    .attr('transform', `translate(${width - 300}, ${height - padding - legendData.length * 22})`)

  legend.selectAll('rect')
    .data(legendData)
    .enter()
    .append('rect')
    .attr('x', 0)
    .attr('y', (d, i) => i * 22)
    .attr('width', 18)
    .attr('height', 18)
    .attr('fill', d => d.color)

  legend.selectAll('text')
    .data(legendData)
    .enter()
    .append('text')
    .attr('x', 24)
    .attr('y', (d, i) => i * 22 + 9)
    .attr('dy', '0.35em')
    .attr('font-size', 12)
    .text(d => d.label)

  // Hide loading indicator after rendering
  setTimeout(() => {
    isLoading.value = false
  }, bands.length * 500 + 1600) // Account for two stages (800ms each)
}
</script>

<style scoped>
#sankey-chart {
  width: 100%;
  min-height: 400px;
}

.v-progress-circular {
  display: block;
  margin: 20px auto;
}

.sankey-band {
  cursor: pointer;
}
</style>
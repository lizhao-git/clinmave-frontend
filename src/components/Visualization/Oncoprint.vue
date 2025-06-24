<template>
  <div ref="container" style="position: relative; user-select: none;">
    <svg ref="svg" :width="width" :height="height"></svg>
    <div
      id="oncoprintTooltip"
      style="position: absolute; pointer-events: none; background: #222; color: #eee; padding: 5px 8px; border-radius: 4px; font-size: 12px; display: none; z-index: 10;"
    ></div>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  width: { type: Number, default: 1000 },
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
  const innerWidth = props.width - margin.left - margin.right
  const innerHeight = props.height - margin.top - margin.bottom
  const g = svgEl.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleLinear()
    .domain([1, props.geneInfo.proteinLength])
    .range([0, innerWidth - 100])

  const xAxis = d3.axisBottom(x)
    .tickValues([1, props.geneInfo.proteinLength])
    .tickFormat((d, i) => i === 1 ? `${d} aa` : d)

  const yGene = 30
  const geneRectHeight = 20
  const geneX = 0
  const geneWidth = x(props.geneInfo.proteinLength) - x(1)

  g.append('rect')
    .attr('x', geneX)
    .attr('y', yGene)
    .attr('width', geneWidth)
    .attr('height', geneRectHeight)
    .attr('fill', 'white')
    .attr('stroke', 'black')

  const domainGroup = g.selectAll('g.domain')
    .data(props.domains)
    .enter()
    .append('g')
    .attr('class', 'domain')

  domainGroup
    .append('rect')
    .attr('x', d => geneX + x(d.start))
    .attr('y', yGene)
    .attr('width', d => Math.max(x(d.end) - x(d.start), 1))
    .attr('height', geneRectHeight)
    .attr('fill', d => pfamColorMap.value[d.pfamId] || '#888') // fallback color
    .on('mouseover', (event, d) =>
      showTooltip(event, `Pfam: ${d.pfamId}<br>${d.pfamName}<br>${d.pfamDescription}`)
    )
    .on('mouseout', hideTooltip)

  const occupied = []
  domainGroup
    .append('text')
    .text(d => d.pfamName)
    .attr('x', d => geneX + x((d.start + d.end) / 2))
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
    .attr('font-size', 10)
    .attr('fill', 'black')

  g.append('text')
    .attr('x', -60)
    .attr('y', yGene + geneRectHeight / 2 - 8)
    .attr('text-anchor', 'start')
    .attr('font-size', 12)
    .text(props.geneInfo.geneName)

  g.append('text')
    .attr('x', -60)
    .attr('y', yGene + geneRectHeight / 2 + 10)
    .attr('text-anchor', 'start')
    .attr('font-size', 10)
    .text(props.geneInfo.uniprotId)

  const rectHeight = 15
  const gap = 5
  const yStart = yGene + geneRectHeight + 30

  props.oncoprintData.forEach((sample, i) => {
    const y = yStart + i * (rectHeight + gap)

    g.append('text')
      .attr('x', -10)
      .attr('y', y + rectHeight / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', 11)
      .text(sample.sample)

    g.selectAll(`.mut-${i}`)
      .data(sample.mutations)
      .enter()
      .append('rect')
      .attr('class', `mut-${i}`)
      .attr('x', d => geneX + x(d.start))
      .attr('y', y)
      .attr('width', d => Math.max(x(d.end) - x(d.start), 3))
      .attr('height', rectHeight)
      .attr('fill', d => mutationColorMap[d.type] || '#ccc')
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5)
      .on('mouseover', (event, d) => showTooltip(event, `${d.type}<br>${d.start}-${d.end}`))
      .on('mouseout', hideTooltip)
  })

  g.append('g')
    .attr('transform', `translate(0, ${yGene + geneRectHeight + 2})`)
    .call(xAxis)
    .selectAll('text')
    .style('font-size', '10px')

  const legendY = yStart + props.oncoprintData.length * (rectHeight + gap) + 40
  const legendX = 0
  const legendItemWidth = 120
  const mutationTypes = Object.keys(mutationColorMap)

  const legend = g.append('g')
    .attr('class', 'mutation-legend')
    .attr('transform', `translate(${legendX}, ${legendY})`)

  mutationTypes.forEach((type, i) => {
    const xOffset = i * legendItemWidth
    legend.append('rect')
      .attr('x', xOffset)
      .attr('y', 0)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', mutationColorMap[type])
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5)

    legend.append('text')
      .attr('x', xOffset + 20)
      .attr('y', 12)
      .attr('font-size', 11)
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

onMounted(() => {
  drawTrack()
})

watch([() => props.width, () => props.height, () => props.geneInfo, () => props.oncoprintData], drawTrack, { deep: true })

watch(() => props.domains, (newDomains) => {
  const map = {}
  const uniquePfamIds = [...new Set(newDomains.map(d => d.pfamId))]
  uniquePfamIds.forEach((id, idx) => {
    map[id] = colorPalette[idx % colorPalette.length]
  })
  pfamColorMap.value = map

  // 🛠 确保颜色 map 更新后再绘图
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
  font-size: 12px;
  display: none;
  z-index: 10;
}
</style>

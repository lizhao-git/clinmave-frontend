<template>
  <div class="donut-container" ref="containerRef">
    <svg ref="svgRef" width="100%" height="100%"></svg>
    <div
      ref="tooltipRef"
      class="tooltip"
      v-show="tooltipVisible"
      :style="tooltipStyle"
    >
      <strong>{{ tooltipData.label }}</strong><br />
      Count: {{ tooltipData.value }}<br />
      Ratio: {{ tooltipData.percent }}%
    </div>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import { ref, reactive, onMounted, watch } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const containerRef = ref(null)
const svgRef = ref(null)
const tooltipRef = ref(null)
const tooltipVisible = ref(false)
const tooltipStyle = reactive({ left: '0px', top: '0px' })
const tooltipData = reactive({ label: '', value: 0, percent: 0 })

let width = 300
let height = 300

const renderChart = () => {
  if (!containerRef.value) return

  // 获取容器尺寸
  const rect = containerRef.value.getBoundingClientRect()
  width = rect.width
  height = rect.height

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const radius = Math.min(width, height) / 2
  const color = d3.scaleOrdinal(d3.schemeCategory10)
  const total = d3.sum(Object.values(props.data))
  const pie = d3.pie().value(d => d[1])
  const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius - 10)

  const g = svg
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)

  const dataEntries = Object.entries(props.data)

  g.selectAll('path')
    .data(pie(dataEntries))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data[0]))
    .on('mouseover', function (event, d) {
      tooltipData.label = d.data[0]
      tooltipData.value = d.data[1]
      tooltipData.percent = ((d.data[1] / total) * 100).toFixed(2)
      tooltipVisible.value = true
    })
    .on('mousemove', function (event) {
      const bounds = containerRef.value.getBoundingClientRect()
      tooltipStyle.left = event.clientX - bounds.left + 10 + 'px'
      tooltipStyle.top = event.clientY - bounds.top + 10 + 'px'
    })
    .on('mouseout', function () {
      tooltipVisible.value = false
    })

  // 中心文字
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .style('font-size', '14px')
    .text(`Total: ${total}`)
}

onMounted(() => {
  renderChart()

  // ResizeObserver 监听容器变化
  const resizeObserver = new ResizeObserver(() => {
    renderChart()
  })
  resizeObserver.observe(containerRef.value)
})

watch(() => props.data, renderChart, { deep: true })
</script>

<style scoped>
.donut-container {
  position: relative;
}

.tooltip {
  position: absolute;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 10;
  white-space: nowrap;
}
</style>

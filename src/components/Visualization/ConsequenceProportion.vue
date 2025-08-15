<template>
  <div class="donut-container" ref="containerRef">
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

    <!-- 注意：svg 的 viewBox 会在 render 时更新 -->
    <svg ref="svgRef" :viewBox="`0 0 ${width + legendWidth} ${height}`" preserveAspectRatio="xMinYMin meet"></svg>

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
import jsPDF from 'jspdf'
import { Canvg } from 'canvg'
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

let width = 250
let height = 250
const legendWidth = 160 // 右侧留图例宽度

// 颜色映射（按你给的）
const colorMap = {
  'Gain-of-function': '#CC0000',
  'Loss-of-function': '#0072B2',
  'Functional neutral': '#bcbcbc'
}

// brighten helper（同 sunburst 的思路）
function brightenColor(color, amount = 0.2) {
  const c = d3.hsl(color)
  c.l += (1 - c.l) * amount
  return c.toString()
}

// 渲染函数
function renderChart() {
  if (!containerRef.value) return

  // 容器尺寸
  const rect = containerRef.value.getBoundingClientRect()
  // 若容器宽高为0（可能还没插入或样式未生效），使用默认最小值
  width = Math.max(100, rect.width - legendWidth)
  height = Math.max(100, rect.height)

  const svgEl = svgRef.value
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  // 设置 svg 的 viewBox 以便导出时一致
  svg.attr('viewBox', `0 0 ${width + legendWidth} ${height}`)
     .attr('width', width + legendWidth)
     .attr('height', height)

  const radius = Math.min(width, height) / 2
  const innerR = radius * 0.5
  const outerR = radius - 30

  const dataEntries = Object.entries(props.data)
  const total = d3.sum(dataEntries, d => d[1])

  // pie 布局（取消排序以保留原来顺序）
  const pie = d3.pie()
    .value(d => d[1])
    .sort(null)

  // 基本 arc 生成器（使用当前 outerR）
  const arcGenerator = d3.arc()
    .innerRadius(innerR)
    .outerRadius(outerR)

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)

  // ===== Enter animation: 扇区从 0 展开到目标角度 =====
  const arcs = g.selectAll('path')
    .data(pie(dataEntries))
    .enter()
    .append('path')
    .each(function(d) { this._current = { startAngle: d.startAngle, endAngle: d.startAngle } }) // 用于插值起点
    .attr('fill', d => {
      const label = d.data[0]
      return colorMap[label] || '#999999'
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .attr('d', d => {
      // 初始渲染使用角度为0的 arc（start == end）
      const start = { startAngle: d.startAngle, endAngle: d.startAngle }
      return arcGenerator(start)
    })

  // 进入动画：角度从 startAngle -> endAngle 展开
  arcs.transition()
    .duration(700)
    .attrTween('d', function(d) {
      const that = this
      const i = d3.interpolate(
        { startAngle: d.startAngle, endAngle: d.startAngle },
        { startAngle: d.startAngle, endAngle: d.endAngle }
      )
      return function(t) {
        return arcGenerator(i(t))
      }
    })
    .on('end', function(d) { this._current = d })

  // ===== hover 动画：放大 outer radius 并变亮（使用 attrTween 动态生成 arc） =====
  arcs
    .on('mouseover', function(event, d) {
      // bring to front
      d3.select(this).raise()

      // 高亮颜色
      const baseColor = colorMap[d.data[0]] || '#999999'
      d3.select(this)
        .transition()
        .duration(180)
        .style('fill', brightenColor(baseColor, 0.25))

      // 外半径放大动画（attrTween）
      d3.select(this)
        .transition()
        .duration(300)
        .attrTween('d', function(dd) {
          // dd 为原始的 pie datum（包含 startAngle/endAngle）
          // interpolator over outer radius
          const fromR = outerR
          const toR = outerR * 1.06 // 放大 6%
          const ri = d3.interpolateNumber(fromR, toR)
          return function(t) {
            const arcNow = d3.arc()
              .innerRadius(innerR)
              .outerRadius(ri(t))
            return arcNow(dd)
          }
        })
        .style('filter', 'drop-shadow(3px 3px 6px rgba(0,0,0,0.25))')

      // tooltip show
      tooltipData.label = d.data[0]
      tooltipData.value = d.data[1]
      tooltipData.percent = ((d.data[1] / total) * 100).toFixed(2)
      tooltipVisible.value = true
    })
    .on('mousemove', function(event) {
      // tooltip 跟随鼠标（相对于容器）
      const bounds = containerRef.value.getBoundingClientRect()
      tooltipStyle.left = (event.clientX - bounds.left + 10) + 'px'
      tooltipStyle.top = (event.clientY - bounds.top + 10) + 'px'
    })
    .on('mouseout', function(event, d) {
      const baseColor = colorMap[d.data[0]] || '#999999'
      // 恢复颜色
      d3.select(this)
        .transition()
        .duration(180)
        .style('fill', baseColor)
        .style('filter', 'none')

      // 恢复外半径
      d3.select(this)
        .transition()
        .duration(300)
        .attrTween('d', function(dd) {
          const fromR = outerR * 1.06
          const toR = outerR
          const ri = d3.interpolateNumber(fromR, toR)
          return function(t) {
            const arcNow = d3.arc()
              .innerRadius(innerR)
              .outerRadius(ri(t))
            return arcNow(dd)
          }
        })

      tooltipVisible.value = false
    })

  // 中心文字：Total
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .style('font-size', '12px')
    .text(`Total: ${total}`)

  // ===== Legend (右侧) =====
  const legendItems = Object.keys(props.data).map(label => ({
    label,
    color: colorMap[label] || '#999999'
  }))

  const itemHeight = 24
  const rectWidth = 14
  const rectHeight = 10
  const fontSize = 13

  // 计算 legend 起始位置，使 legend 垂直居中
  const legendGroup = svg.append('g')
    .attr('transform', `translate(${width + 8}, ${Math.max(20, (height - legendItems.length * itemHeight) / 2)})`)

  const legendG = legendGroup.selectAll('.legend-item')
    .data(legendItems)
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * itemHeight})`)

  legendG.append('rect')
    .attr('width', rectWidth)
    .attr('height', rectHeight)
    .attr('rx', 2)
    .attr('ry', 2)
    .attr('fill', d => d.color)

  legendG.append('text')
    .attr('x', rectWidth + 8)
    .attr('y', rectHeight / 2 + 4)
    .style('font-size', `${fontSize}px`)
    .text(d => d.label)
}

// 下载 SVG
const downloadSVG = () => {
  const svgEl = svgRef.value
  if (!svgEl) return
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgEl)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'donut-chart.svg'
  a.click()
  URL.revokeObjectURL(url)
}

// 下载 PDF（Canvg -> jsPDF）
const downloadPDF = async () => {
  const svgEl = svgRef.value
  if (!svgEl) return
  const svgString = new XMLSerializer().serializeToString(svgEl)

  // scale for resolution
  const scale = 3
  const pdfWidth = (width + legendWidth) * scale
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
  pdf.save('donut-chart.pdf')
}

// 初次渲染与响应 resize / 数据变化
onMounted(() => {
  // 首次渲染
  renderChart()

  // ResizeObserver：仅在尺寸变化时重绘
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

// 监听数据变化
watch(() => props.data, () => {
  renderChart()
}, { deep: true })
</script>

<style scoped>
.donut-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  height: 320px;
  margin: 0 auto;
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

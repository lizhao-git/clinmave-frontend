<template>
  <div ref="container" class="nature-container">
    <svg ref="svg"></svg>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const container = ref(null)
const svg = ref(null)

const config = {
  barHeight: 10,
  padding: {
    top: 100,
    right: 200,
    bottom: 35,
    left: 200
  },
  fontSize: 12,
  fontFamily: 'Arial',
  colors: {
    blue: '#2196F3',
    purple: '#9C27B0',
    text: '#333333',
    cardBorder: '#e8ecef',
    cardBg: '#ffffff',
    strongText: '#FF0000' // Added red color for Strong text
  },
  labels: ['No effects', 'Weak', 'Moderate', 'Strong'],
  card: {
    minWidth: 120,
    maxWidth: 300,
    padding: { x: 20, y: 16 },
    lineHeight: 1.5,
    radius: 8,
    tailSize: 10,
    bgColor: '#ffffff',
    strokeWidth: 1,
    elevation: 4
  }
}

let resizeObserver = null

const drawScientificBar = () => {
  if (!container.value) return

  const { clientWidth: totalWidth } = container.value
  const { 
    barHeight, 
    padding,
    fontSize,
    fontFamily,
    colors,
    labels,
    card: cardConfig
  } = config

  // 计算核心尺寸
  const chartWidth = totalWidth - padding.left - padding.right
  const chartHeight = barHeight + padding.top + padding.bottom + 30

  // 初始化SVG容器
  const svgEl = d3.select(svg.value)
  svgEl.selectAll('*').remove()
  svgEl.attr('viewBox', `0 0 ${totalWidth} ${chartHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  // 创建颜色渐变
  const gradient = svgEl.append('defs')
    .append('linearGradient')
    .attr('id', 'sciGradient')
    .attr('x1', '0%')
    .attr('x2', '100%')

  gradient.append('stop').attr('offset', '0%').attr('stop-color', colors.blue)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', colors.purple)

  // 绘制渐变条
  svgEl.append('rect')
    .attr('x', padding.left)
    .attr('y', padding.top)
    .attr('width', chartWidth)
    .attr('height', barHeight)
    .attr('rx', 5)
    .style('fill', 'url(#sciGradient)')
    .style('shape-rendering', 'geometricPrecision')

  // 创建比例尺和坐标轴
  const xScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, chartWidth])

  const axis = d3.axisBottom(xScale)
    .tickValues([20, 40, 60, 80])
    .tickSize(5)
    .tickPadding(8)
    .tickFormat((d, i) => labels[i])

  const axisGroup = svgEl.append('g')
    .attr('transform', `translate(${padding.left}, ${padding.top + barHeight + 5})`)
    .style('font-family', fontFamily)
    .style('font-size', `${fontSize}pt`)
    .style('color', colors.text)
    .call(axis)

  // 优化坐标轴样式
  axisGroup.select('.domain')
    .attr('stroke', colors.text)
    .attr('stroke-width', 0.6)
  axisGroup.selectAll('.tick line')
    .attr('stroke', colors.text)
    .attr('stroke-width', 0.6)
    .attr('opacity', 0.8)

  // 创建现代卡片
  const createModernCard = (markPos, textLines) => {
    // 文本测量
    const textMeasurer = svgEl.append('text')
      .style('font-family', fontFamily)
      .style('font-size', `${fontSize}pt`)
      .style('visibility', 'hidden')

    // 计算文本尺寸
    const measurements = textLines.map((text, i) => {
      textMeasurer.text(text)
      if (i === textLines.length - 1) {
        textMeasurer.style('font-size', `${fontSize * 1.2}pt`)
        textMeasurer.style('font-weight', '700')
      }
      const bbox = textMeasurer.node().getBBox()
      return {
        width: bbox.width,
        height: bbox.height * cardConfig.lineHeight
      }
    })
    textMeasurer.remove()

    // 计算卡片尺寸
    const contentWidth = d3.max(measurements, d => d.width)
    const contentHeight = measurements.reduce((acc, curr) => acc + curr.height, 0)
    const cardWidth = Math.min(
      cardConfig.maxWidth,
      Math.max(
        cardConfig.minWidth,
        contentWidth + cardConfig.padding.x * 2
      )
    )
    const cardHeight = contentHeight + cardConfig.padding.y * 2

    // 卡片定位
    const cardX = Math.max(
      padding.left,
      Math.min(
        markPos - cardWidth/2,
        totalWidth - padding.right - cardWidth
      )
    )

    const cardGroup = svgEl.append('g')
      .attr('transform', `translate(${cardX}, ${padding.top - cardHeight - 20})`)

    // 卡片阴影
    cardGroup.append('rect')
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('rx', cardConfig.radius)
      .style('fill', colors.cardBg)
      .style('filter', `drop-shadow(0 ${cardConfig.elevation}px ${cardConfig.elevation*2}px rgba(0,0,0,0.15))`)

    // 卡片边框
    cardGroup.append('rect')
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('rx', cardConfig.radius)
      .style('fill', 'none')
      .style('stroke', colors.cardBorder)
      .style('stroke-width', cardConfig.strokeWidth)

    // 卡片内容
    const contentGroup = cardGroup.append('g')
      .attr('transform', `translate(${cardWidth / 2}, ${cardConfig.padding.y + contentHeight / 2})`) // Center vertically

    let yPos = -contentHeight / 2 // Start from top to center vertically
    textLines.forEach((text, i) => {
      contentGroup.append('text')
        .attr('y', yPos + measurements[i].height / 2) // Adjust for middle alignment
        .attr('text-anchor', 'middle') // Horizontal centering
        .style('dominant-baseline', 'middle') // Vertical centering
        .style('font-family', fontFamily)
        .style('font-size', i === textLines.length - 1 ? `${fontSize * 1.2}pt` : `${fontSize}pt`)
        .style('fill', i === textLines.length - 1 ? colors.strongText : colors.text)
        .style('font-weight', i === textLines.length - 1 ? '700' : '400')
        .text(text)
      yPos += measurements[i].height
    })

    // 连接线
    cardGroup.append('line')
      .attr('x1', cardWidth/2)
      .attr('y1', cardHeight)
      .attr('x2', cardWidth/2)
      .attr('y2', barHeight + padding.top + 10)
      .attr('stroke', colors.purple)
      .attr('stroke-width', cardConfig.strokeWidth)
      .attr('stroke-dasharray', '2,2')

    // 小尾巴指示器
    cardGroup.append('path')
      .attr('d', `M${cardWidth/2 - 6} ${cardHeight} l8 8 l8 -8`)
      .style('fill', colors.cardBg)
      .style('stroke', colors.cardBorder)
      .style('stroke-width', cardConfig.strokeWidth)
  }

  // 在80%位置添加卡片
  createModernCard(
    xScale(80) + padding.left,
    ['Suggested Classification', 'Strong']
  )
}

onMounted(() => {
  drawScientificBar()
  resizeObserver = new ResizeObserver(() => drawScientificBar())
  resizeObserver.observe(container.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.nature-container {
  width: 100%;
  max-width: 1200px;
  margin: 2rem auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

svg {
  width: 100%;
  height: auto;
  min-height: 400px;
}
</style>
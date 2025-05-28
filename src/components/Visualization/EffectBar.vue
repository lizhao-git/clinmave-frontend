<template>
  <div ref="container" class="nature-container">
    <svg ref="svg"></svg>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'

/**
 * A reusable Vue component for rendering a scientific bar chart with a dynamic card.
 * Displays a gradient bar with labeled ticks and a card showing classification strength.
 * @component
 * @example
 * <EffectBar :strength="'Weak'" :bar-height="12" :labels="['None', 'Low', 'Medium', 'High']" />
 */
const props = defineProps({
  /**
   * The strength classification to display in the card.
   * Must be one of the values in the labels array.
   * @type {String}
   * @default 'High'
   */
  strength: {
    type: String,
    default: 'High'
  },
  /**
   * Height of the gradient bar.
   * @type {Number}
   * @default 10
   */
  barHeight: {
    type: Number,
    default: 10
  },
  /**
   * Array of labels for the axis ticks.
   * @type {Array<String>}
   * @default ['No effects', 'Weak', 'Moderate', 'Strong']
   */
  labels: {
    type: Array,
    default: () => ['No effects', 'Weak', 'Moderate', 'Strong'],
    validator: (labels) => labels.length === 4
  },
  /**
   * Colors for the gradient bar, text, and card.
   * @type {Object}
   * @default { blue: '#2196F3', purple: '#9C27B0', text: '#333333', cardBorder: '#e8ecef', cardBg: '#ffffff', strongText: '#FF0000' }
   */
  colors: {
    type: Object,
    default: () => ({
      blue: '#2196F3',
      purple: '#9C27B0',
      text: '#333333',
      cardBorder: '#e8ecef',
      cardBg: '#ffffff',
      strongText: '#FF0000'
    })
  }
})

// Validate strength against labels using a computed property
const isValidStrength = computed(() => props.labels.includes(props.strength))

const container = ref(null)
const svg = ref(null)

const config = {
  padding: {
    top: 10,
    right: 20,
    bottom: 35,
    left: 20
  },
  fontSize: 12,
  fontFamily: 'Arial',
  card: {
    minWidth: 120,
    maxWidth: 150,
    padding: { x: 20, y: 16 },
    lineHeight: 1.5,
    radius: 8,
    tailSize: 10,
    strokeWidth: 1,
    elevation: 4
  }
}

let resizeObserver = null

const drawScientificBar = () => {
  if (!container.value) return

  // Skip rendering if strength is invalid
  if (!isValidStrength.value) {
    console.warn(`Invalid strength value: ${props.strength}. Must be one of: ${props.labels.join(', ')}`)
    return
  }

  const { clientWidth: totalWidth } = container.value
  const { 
    padding,
    fontSize,
    fontFamily,
    card: cardConfig
  } = config

  // 计算核心尺寸
  const chartWidth = totalWidth - padding.left - padding.right
  const chartHeight = props.barHeight + padding.top + padding.bottom + 30

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

  gradient.append('stop').attr('offset', '0%').attr('stop-color', props.colors.blue)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', props.colors.purple)

  // 绘制渐变条
  svgEl.append('rect')
    .attr('x', padding.left)
    .attr('y', padding.top)
    .attr('width', chartWidth)
    .attr('height', props.barHeight)
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
    .tickFormat((d, i) => props.labels[i])

  const axisGroup = svgEl.append('g')
    .attr('transform', `translate(${padding.left}, ${padding.top + props.barHeight + 5})`)
    .style('font-family', fontFamily)
    .style('font-size', `${fontSize}pt`)
    .style('color', props.colors.text)
    .call(axis)

  // 优化坐标轴样式
  axisGroup.select('.domain')
    .attr('stroke', props.colors.text)
    .attr('stroke-width', 0.6)
  axisGroup.selectAll('.tick line')
    .attr('stroke', props.colors.text)
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
      if (i === textLines.length - 1 && text === props.labels[3]) {
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
      .style('fill', props.colors.cardBg)
      .style('filter', `drop-shadow(0 ${cardConfig.elevation}px ${cardConfig.elevation*2}px rgba(0,0,0,0.15))`)

    // 卡片边框
    cardGroup.append('rect')
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('rx', cardConfig.radius)
      .style('fill', 'none')
      .style('stroke', props.colors.cardBorder)
      .style('stroke-width', cardConfig.strokeWidth)

    // 卡片内容
    const contentGroup = cardGroup.append('g')
      .attr('transform', `translate(${cardWidth / 2}, ${cardConfig.padding.y + contentHeight / 2})`)

    let yPos = -contentHeight / 2
    textLines.forEach((text, i) => {
      contentGroup.append('text')
        .attr('y', yPos + measurements[i].height / 2)
        .attr('text-anchor', 'middle')
        .style('dominant-baseline', 'middle')
        .style('font-family', fontFamily)
        .style('font-size', i === textLines.length - 1 && text === props.labels[3] ? `${fontSize * 1.2}pt` : `${fontSize}pt`)
        .style('fill', i === textLines.length - 1 && text === props.labels[3] ? props.colors.strongText : props.colors.text)
        .style('font-weight', i === textLines.length - 1 && text === props.labels[3] ? '700' : '400')
        .text(text)
      yPos += measurements[i].height
    })

    // 连接线
    cardGroup.append('line')
      .attr('x1', cardWidth/2)
      .attr('y1', cardHeight)
      .attr('x2', cardWidth/2)
      .attr('y2', props.barHeight + padding.top + 10)
      .attr('stroke', props.colors.purple)
      .attr('stroke-width', cardConfig.strokeWidth)
      .attr('stroke-dasharray', '2,2')

    // 小尾巴指示器
    cardGroup.append('path')
      .attr('d', `M${cardWidth/2 - 6} ${cardHeight} l8 8 l8 -8`)
      .style('fill', props.colors.cardBg)
      .style('stroke', props.colors.cardBorder)
      .style('stroke-width', cardConfig.strokeWidth)
  }

  // 映射strength到对应的刻度值
  const strengthMap = props.labels.reduce((map, label, i) => {
    map[label] = [20, 40, 60, 80][i]
    return map
  }, {})
  const markPos = xScale(strengthMap[props.strength]) + padding.left
  const cardText = ['Suggested Classification', props.strength]

  // 创建卡片
  createModernCard(markPos, cardText)
}

onMounted(() => {
  drawScientificBar()
  resizeObserver = new ResizeObserver(() => drawScientificBar())
  resizeObserver.observe(container.value)
})

watch([() => props.strength, () => props.barHeight, () => props.labels, () => props.colors], () => {
  drawScientificBar()
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
}

svg {
  width: 100%;
  height: auto;
  min-height: 400px;
}
</style>
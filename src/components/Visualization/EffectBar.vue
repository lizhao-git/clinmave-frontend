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
 * Displays a gradient bar with labeled ticks and a compact card showing classification strength.
 * @component
 * @example
 * <EffectBar :strength="'Weak'" :bar-height="8" :labels="['None', 'Low', 'Medium', 'High']" />
 */
const props = defineProps({
  strength: {
    type: String,
    default: 'Strong'
  },
  barHeight: {
    type: Number,
    default: 8
  },
  labels: {
    type: Array,
    default: () => ['No effects', 'Weak', 'Moderate', 'Strong'],
    validator: (labels) => labels.length === 4
  },
  colors: {
    type: Object,
    default: () => ({
      start: '#4C78A8', // 浅蓝，Nature 风格起始色
      mid: '#F8E08E',   // 浅黄，Nature 风格中间色
      end: '#E06259',   // 珊瑚红，Nature 风格结束色
      text: '#333333',
      cardBorder: '#e8ecef',
      cardBg: '#ffffff',
      strongText: '#E06259'
    })
  }
})

// Validate strength against labels using a computed property
const isValidStrength = computed(() => props.labels.includes(props.strength))

const container = ref(null)
const svg = ref(null)

const config = {
  padding: {
    top: 80,
    right: 20,
    bottom: 35,
    left: 20
  },
  fontSize: 10,
  fontFamily: 'Arial',
  card: {
    minWidth: 100,
    maxWidth: 200,
    padding: { x: 10, y: 8 },
    lineHeight: 1.2,
    radius: 6,
    tailSize: 8,
    strokeWidth: 1,
    elevation: 3
  }
}

let resizeObserver = null

const drawScientificBar = () => {
  if (!container.value) {
    console.warn('Container not found, skipping render')
    return
  }

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
  const gradientId = 'sciGradient'
  const gradient = svgEl.append('defs')
    .append('linearGradient')
    .attr('id', gradientId)
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%')

  // 确保渐变颜色有效
  const safeColors = {
    start: props.colors.start || '#4C78A8',
    mid: props.colors.mid || '#F8E08E',
    end: props.colors.end || '#E06259'
  }

  gradient.append('stop').attr('offset', '0%').attr('stop-color', safeColors.start)
  gradient.append('stop').attr('offset', '50%').attr('stop-color', safeColors.mid)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', safeColors.end)

  // 绘制渐变条
  svgEl.append('rect')
    .attr('x', padding.left)
    .attr('y', padding.top)
    .attr('width', chartWidth)
    .attr('height', props.barHeight)
    .attr('rx', 4)
    .style('fill', `url(#${gradientId})`)
    .style('shape-rendering', 'geometricPrecision')

  // 创建比例尺和坐标轴
  const xScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, chartWidth])

  // 定义标签颜色与渐变对应
  const labelColors = props.labels.map((_, i) => {
    const position = [20, 40, 60, 80][i] / 100 // 归一化到0-1
    if (position <= 0.5) {
      return d3.interpolateRgb(safeColors.start, safeColors.mid)(position / 0.5)
    } else {
      return d3.interpolateRgb(safeColors.mid, safeColors.end)((position - 0.5) / 0.5)
    }
  })

  // 调试标签颜色
  console.log('Label colors:', labelColors)

  const axis = d3.axisBottom(xScale)
    .tickValues([20, 40, 60, 80])
    .tickSize(5)
    .tickPadding(6)
    .tickFormat((d, i) => props.labels[i])

  const axisGroup = svgEl.append('g')
    .attr('transform', `translate(${padding.left}, ${padding.top + props.barHeight + 5})`)
    .style('font-family', fontFamily)
    .style('font-size', `${fontSize}pt`)
    .call(axis)

  // 设置每个标签的颜色
  axisGroup.selectAll('.tick text')
    .style('fill', (d, i) => labelColors[i])

  // 优化坐标轴样式
  axisGroup.select('.domain')
    .attr('stroke', props.colors.text)
    .attr('stroke-width', 0.6)
  axisGroup.selectAll('.tick line')
    .attr('stroke', props.colors.text)
    .attr('stroke-width', 0.6)
    .attr('opacity', 0.8)

  // 映射strength到对应的刻度值
  const strengthMap = props.labels.reduce((map, label, i) => {
    map[label] = [20, 40, 60, 80][i]
    return map
  }, {})
  const markPos = xScale(strengthMap[props.strength]) + padding.left

  // 创建现代卡片
  const createModernCard = (textLines) => {
    // 文本测量
    const textMeasurer = svgEl.append('text')
      .style('font-family', fontFamily)
      .style('font-size', `${fontSize}pt`)
      .style('visibility', 'hidden')

    // 计算文本尺寸
    const measurements = textLines.map((text, i) => {
      textMeasurer.text(text)
      if (i === textLines.length - 1 && text === props.labels[3]) {
        textMeasurer.style('font-size', `${fontSize * 1.1}pt`)
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

    // 计算尾巴的x位置，确保与标签对齐
    let tailX
    const labelIndex = props.labels.indexOf(props.strength)
    if (labelIndex === 0) {
      // None: 尾巴对齐到卡片左边缘
      tailX = cardConfig.padding.x
    } else if (labelIndex === props.labels.length - 1) {
      // High: 尾巴对齐到卡片右边缘
      tailX = cardWidth - cardConfig.padding.x
    } else {
      // 中间值：尾巴居中
      tailX = cardWidth / 2
    }

    // 卡片定位：确保尾巴位于markPos
    const cardX = Math.max(
      padding.left,
      Math.min(
        markPos - tailX,
        totalWidth - padding.right - cardWidth
      )
    )

    const cardGroup = svgEl.append('g')
      .attr('transform', `translate(${cardX}, ${padding.top - cardHeight - 15})`)

    // 卡片阴影
    cardGroup.append('rect')
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('rx', cardConfig.radius)
      .style('fill', props.colors.cardBg)
      .style('filter', `drop-shadow(0 ${cardConfig.elevation}px ${cardConfig.elevation*1.5}px rgba(0,0,0,0.15))`)

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
        .style('font-size', i === textLines.length - 1 && text === props.labels[3] ? `${fontSize * 1.1}pt` : `${fontSize}pt`)
        .style('fill', i === textLines.length - 1 ? labelColors[labelIndex] : props.colors.text)
        .style('font-weight', i === textLines.length - 1 && text === props.labels[3] ? '700' : '400')
        .text(text)
      yPos += measurements[i].height
    })

    // 连接线：从卡片底部尾巴位置到markPos
    cardGroup.append('line')
      .attr('x1', tailX)
      .attr('y1', cardHeight)
      .attr('x2', tailX)
      .attr('y2', props.barHeight + padding.top + 8)
      .attr('stroke', safeColors.end)
      .attr('stroke-width', cardConfig.strokeWidth)
      .attr('stroke-dasharray', '2,2')

    // 小尾巴指示器：定位于尾巴位置
    cardGroup.append('path')
      .attr('d', `M${tailX - 5} ${cardHeight} l6 6 l6 -6`)
      .style('fill', props.colors.cardBg)
      .style('stroke', props.colors.cardBorder)
      .style('stroke-width', cardConfig.strokeWidth)
  }

  // 创建卡片
  createModernCard(['Suggested classification', props.strength])
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
  max-width: 400px;
  background: white;
  border-radius: 8px;
}

svg {
  width: 100%;
  height: auto;
  min-height: 150px;
}

/* 确保 SVG 元素不被外部 CSS 覆盖 */
svg rect {
  fill: url(#sciGradient) !important;
}
</style>
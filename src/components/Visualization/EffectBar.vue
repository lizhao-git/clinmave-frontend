<template>
  <div ref="container" class="nature-container">
    <div class="title-wrapper">
      <span class="chart-title">{{ titleText }}</span>
      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <div v-bind="props">
            <v-icon style="font-size: 16px;">mdi-help-circle-outline</v-icon>
          </div>
        </template>
        <span>Distance-based scoring method to measure strength tier of functional effect within specific assay. See documentation for further details.</span>
      </v-tooltip>
    </div>
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
 * <EffectBar :strength="'Strong'" :bar-height="8" :labels="['No effects', 'Weak', 'Moderate', 'Strong']" />
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
      start: '#4C78A8', // Light blue, Nature style start color
      mid: '#F8E08E',   // Light yellow, Nature style mid color
      end: '#E06259',   // Coral red, Nature style end color
      text: '#333333',
      cardBorder: '#e8ecef',
      cardBg: '#ffffff',
      strongText: '#E06259'
    })
  }
})

// Define title text
const titleText = 'Per-variant functional strength'

// Validate strength against labels
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

  if (!isValidStrength.value) {
    console.warn(`Invalid strength value: ${props.strength}. Must be one of: ${props.labels.join(', ')}`)
    return
  }

  const { clientWidth: totalWidth } = container.value
  const { padding, fontSize, fontFamily, card: cardConfig } = config

  // Calculate core dimensions
  const chartWidth = totalWidth - padding.left - padding.right
  const chartHeight = props.barHeight + padding.top + padding.bottom + 30

  // Initialize SVG container
  const svgEl = d3.select(svg.value)
  svgEl.selectAll('*').remove()
  svgEl
    .attr('viewBox', `0 0 ${totalWidth} ${chartHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  // Create color gradient
  const gradientId = 'sciGradient'
  const gradient = svgEl.append('defs')
    .append('linearGradient')
    .attr('id', gradientId)
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%')

  const safeColors = {
    start: props.colors.start || '#4C78A8',
    mid: props.colors.mid || '#F8E08E',
    end: props.colors.end || '#E06259'
  }

  gradient.append('stop').attr('offset', '0%').attr('stop-color', safeColors.start)
  gradient.append('stop').attr('offset', '50%').attr('stop-color', safeColors.mid)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', safeColors.end)

  // Draw gradient bar
  svgEl.append('rect')
    .attr('x', padding.left)
    .attr('y', padding.top)
    .attr('width', chartWidth)
    .attr('height', props.barHeight)
    .attr('rx', 4)
    .style('fill', `url(#${gradientId})`)
    .style('shape-rendering', 'geometricPrecision')

  // Create scale and axis
  const xScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, chartWidth])

  const labelColors = props.labels.map((_, i) => {
    const position = [20, 40, 60, 80][i] / 100
    if (position <= 0.5) {
      return d3.interpolateRgb(safeColors.start, safeColors.mid)(position / 0.5)
    } else {
      return d3.interpolateRgb(safeColors.mid, safeColors.end)((position - 0.5) / 0.5)
    }
  })

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

  axisGroup.selectAll('.tick text')
    .style('fill', (d, i) => labelColors[i])

  axisGroup.select('.domain')
    .attr('stroke', props.colors.text)
    .attr('stroke-width', 0.6)
  axisGroup.selectAll('.tick line')
    .attr('stroke', props.colors.text)
    .attr('stroke-width', 0.6)
    .attr('opacity', 0.8)

  // Map strength to tick values
  const strengthMap = props.labels.reduce((map, label, i) => {
    map[label] = [20, 40, 60, 80][i]
    return map
  }, {})
  const markPos = xScale(strengthMap[props.strength]) + padding.left

  // Create modern card
  const createModernCard = (textLines) => {
    const textMeasurer = svgEl.append('text')
      .style('font-family', fontFamily)
      .style('font-size', `${fontSize}pt`)
      .style('visibility', 'hidden')

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

    const labelIndex = props.labels.indexOf(props.strength)
    let tailX
    if (labelIndex === 0) {
      tailX = cardConfig.padding.x
    } else if (labelIndex === props.labels.length - 1) {
      tailX = cardWidth - cardConfig.padding.x
    } else {
      tailX = cardWidth / 2
    }

    const cardX = Math.max(
      padding.left,
      Math.min(
        markPos - tailX,
        totalWidth - padding.right - cardWidth
      )
    )

    const cardGroup = svgEl.append('g')
      .attr('transform', `translate(${cardX}, ${padding.top - cardHeight - 15})`)

    cardGroup.append('rect')
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('rx', cardConfig.radius)
      .style('fill', props.colors.cardBg)
      .style('filter', `drop-shadow(0 ${cardConfig.elevation}px ${cardConfig.elevation*1.5}px rgba(0,0,0,0.15))`)

    cardGroup.append('rect')
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('rx', cardConfig.radius)
      .style('fill', 'none')
      .style('stroke', props.colors.cardBorder)
      .style('stroke-width', cardConfig.strokeWidth)

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
        .style('font-weight', '700')
        .text(text)
      yPos += measurements[i].height
    })

    cardGroup.append('line')
      .attr('x1', tailX)
      .attr('y1', cardHeight)
      .attr('x2', tailX)
      .attr('y2', props.barHeight + padding.top + 8)
      .attr('stroke', safeColors.end)
      .attr('stroke-width', cardConfig.strokeWidth)
      .attr('stroke-dasharray', '2,2')

    cardGroup.append('path')
      .attr('d', `M${tailX - 5} ${cardHeight} l6 6 l6 -6`)
      .style('fill', props.colors.cardBg)
      .style('stroke', props.colors.cardBorder)
      .style('stroke-width', cardConfig.strokeWidth)
  }

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
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.chart-title {
  font-weight: bold;
  font-size: 14px;
  color: #333333;
  text-align: center;
}

.question-icon {
  width: 16px;
  height: 16px;
  background: #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  cursor: pointer;
}

svg {
  width: 100%;
  height: auto;
  min-height: 150px;
}

svg rect {
  fill: url(#sciGradient) !important;
}
</style>
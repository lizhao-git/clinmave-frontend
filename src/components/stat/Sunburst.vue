<template>
    <div>
      <div ref="chartRef" class="sunburst-chart"></div>
    </div>
</template>

<script setup>
import * as d3 from 'd3'
import { onMounted, ref } from 'vue'

const chartRef = ref(null)

const data = {
  "name": "root",
  "children": [
    {
      "name": "Deep Mutational Scanning",
      "children": [
        { "name": "Mutagenic PCR", "value": 12 },
        { "name": "Oligonucleotide synthesis", "value": 20 }
      ]
    },
    {
      "name": "CRISPR-Based Genome Editing",
      "children": [
        { "name": "Base editing", "value": 6 },
        { "name": "Prime editing", "value": 3 },
        { "name": "Saturation genome editing", "value": 8 }
      ]
    }
  ]
}

// Nature 风格红蓝配色（手动挑选）
const natureRed = '#D62828'
const natureBlue = '#003049'

// 生成对应浅色函数（降低饱和度，提高亮度）
function lightenColor(color, amount = 0.5) {
  const c = d3.hsl(color)
  c.s *= 0.4
  c.l = Math.min(c.l + (1 - c.l) * amount, 0.95) // 限制亮度避免纯白
  return c.toString()
}

// 生成更亮的颜色用于 hover
function brightenColor(color, amount = 0.2) {
  const c = d3.hsl(color)
  c.l = Math.min(c.l + (1 - c.l) * amount, 0.95) // 限制亮度避免纯白
  return c.toString()
}

function renderSunburst() {
  if (!chartRef.value) return

  const width = 360
  const height = 300
  const radius = Math.min(width, height) / 2

  d3.select(chartRef.value).selectAll('*').remove()

  // legend 相关尺寸
  const legendRectSize = 18
  const legendSpacing = 6
  const legendX = 350  // 从 350 开始绘制 legend

  // 计算 legend 总高度
  let totalLegendHeight = 0
  data.children.forEach(parent => {
    totalLegendHeight += (1 + parent.children.length) * (legendRectSize + legendSpacing)
  })
  totalLegendHeight += legendSpacing * 2

  // svg 高度取图和 legend 最大值
  const svgHeight = Math.max(height, totalLegendHeight)

  const svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', 700)
    .attr('height', svgHeight)
    .style('font-family', 'sans-serif')

  const mainGroup = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const topLevelNames = data.children.map(d => d.name)

  // 自定义颜色映射（红色、蓝色）
  const baseColors = [natureRed, natureBlue]
  const baseColorScale = d3.scaleOrdinal()
    .domain(topLevelNames)
    .range(baseColors)

  function getColorForNode(d) {
    if (d.depth === 1) {
      return baseColorScale(d.data.name)
    }
    if (d.depth > 1) {
      let ancestor = d
      while (ancestor.depth > 1) ancestor = ancestor.parent
      const parentColor = baseColorScale(ancestor.data.name)
      const siblings = ancestor.children
      const index = siblings.indexOf(d)
      const lightnessAmount = 0.4 + 0.4 * (index / Math.max(siblings.length - 1, 1))
      const color = lightenColor(parentColor, lightnessAmount)
      console.log(`Sunburst color for ${d.data.name}:`, color, `lightnessAmount: ${lightnessAmount}`)
      return color
    }
    return '#ccc'
  }

  const root = d3.hierarchy(data)
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value)

  const partition = d3.partition()
    .size([2 * Math.PI, radius])

  partition(root)

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1)

  mainGroup.selectAll('path')
    .data(root.descendants())
    .join('path')
    .attr('display', d => d.depth ? null : 'none')
    .attr('d', arc)
    .style('fill', d => getColorForNode(d))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .on('mouseover', function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .style('fill', brightenColor(getColorForNode(d)))
        .attrTween('d', function(dd) {
          const interpolate = d3.interpolate(dd.y1, dd.y1 * 1.05)
          return function(t) {
            const newD = { ...dd, y1: interpolate(t) }
            return arc(newD)
          }
        })
      tooltip.style('opacity', 1)
        .html(`<strong>${d.data.name}</strong><br/>Value: ${d.value}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY + 10) + 'px')
    })
    .on('mousemove', function (event) {
      tooltip.style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY + 10) + 'px')
    })
    .on('mouseout', function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .style('fill', getColorForNode(d))
        .attrTween('d', function(dd) {
          const interpolate = d3.interpolate(dd.y1 * 1.05, dd.y1)
          return function(t) {
            const newD = { ...dd, y1: interpolate(t) }
            return arc(newD)
          }
        })
      tooltip.style('opacity', 0)
    })

  // 在扇形中间添加数值文字
  mainGroup.selectAll('text')
    .data(root.descendants().filter(d => d.depth))
    .join('text')
    .attr('transform', d => {
      const x = (d.x0 + d.x1) / 2 * 180 / Math.PI - 90
      const y = (d.y0 + d.y1) / 2
      return `rotate(${x}) translate(${y},0)` + (x > 90 ? ' rotate(180)' : '')
    })
    .attr('dy', '0.35em')
    .attr('font-size', 11)
    .attr('fill', d => d.depth === 1 ? '#fff' : '#000')
    .attr('text-anchor', d => {
      const angle = ((d.x0 + d.x1) / 2) * 180 / Math.PI
      return angle > 180 ? 'end' : 'start'
    })
    .text(d => d.value)

  const tooltip = d3.select(chartRef.value)
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('background', 'rgba(0,0,0,0.7)')
    .style('color', '#fff')
    .style('padding', '6px 8px')
    .style('border-radius', '4px')
    .style('font-size', '12px')

  // legend
  let currentY = (svgHeight - totalLegendHeight) / 2

  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${legendX}, ${currentY})`)

  data.children.forEach((parent, pi) => {
    // 父类 legend
    legend.append('rect')
      .attr('x', 0)
      .attr('y', currentY - (svgHeight - totalLegendHeight) / 2)
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .attr('fill', baseColorScale(parent.name))

    legend.append('text')
      .attr('x', legendRectSize + 6)
      .attr('y', currentY - (svgHeight - totalLegendHeight) / 2 + legendRectSize * 0.75)
      .attr('font-weight', 'bold')
      .attr('font-size', 14)
      .attr('fill', '#000')
      .text(parent.name)

    currentY += legendRectSize + legendSpacing

    // 子类 legend
    const parentNode = root.descendants().find(d => d.data.name === parent.name)
    parent.children.forEach((child, ci) => {
      const childNode = parentNode.children.find(d => d.data.name === child.name)
      const childColor = getColorForNode(childNode)
      console.log(`Legend color for ${child.name}:`, childColor)

      legend.append('rect')
        .attr('x', 18)
        .attr('y', currentY - (svgHeight - totalLegendHeight) / 2)
        .attr('width', legendRectSize * 0.8)
        .attr('height', legendRectSize * 0.8)
        .attr('fill', childColor)

      legend.append('text')
        .attr('x', 18 + legendRectSize)
        .attr('y', currentY - (svgHeight - totalLegendHeight) / 2 + legendRectSize * 0.6)
        .attr('font-size', 12)
        .attr('fill', '#444')
        .text(child.name)

      currentY += legendRectSize + legendSpacing
    })

    // 父子之间额外间距
    currentY += legendSpacing * 0.7
  })
}

onMounted(() => {
  renderSunburst()
})
</script>

<style scoped>
.sunburst-chart {
  position: relative;
  width: 400px;
  height: 400px;
  margin-top: 40px;
}

.tooltip {
  pointer-events: none;
  user-select: none;
  position: absolute;
  z-index: 10;
}
</style>
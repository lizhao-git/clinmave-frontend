<template>
  <svg ref="svgRef" :width="totalWidth" :height="size" />
</template>

<script setup>
import * as d3 from 'd3'
import { onMounted, computed, ref } from 'vue'

const props = defineProps({
  size: {
    type: Number,
    default: 300
  },
  legendWidth: {
    type: Number,
    default: 60
  },
})

const totalWidth = computed(() => props.size + props.legendWidth)
const svgRef = ref(null)

onMounted(() => {
  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const margin = { top: 10, right: 10, bottom: 60, left: 60 }
  const width = props.size - margin.left - margin.right
  const height = props.size - margin.top -margin.bottom

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 生成数据
  const xData = d3.range(-4, 4.01, 0.1)
  const yData = xData.map(x => ({
    x,
    y: (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x),
  }))
  const data = Array.from({ length: 1000 }, () => d3.randomNormal()())

  // 分箱处理
  const bins = d3.bin()
    .domain([-4, 4])
    .thresholds(d3.range(-4, 4.1, 0.5))(data)

  bins.forEach(bin => {
    const binWidth = bin.x1 - bin.x0
    bin.density = (bin.length / 1000) / binWidth
  })

  // 比例尺
  const xScale = d3.scaleLinear().domain([-4, 4]).range([0, width])
  const yMax = Math.max(d3.max(yData, d => d.y), d3.max(bins, d => d.density))
  const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([height, 0])

  // 网格样式
  const gridStyle = g => g.selectAll('.tick line')
    .attr('stroke', '#ddd')
    .attr('stroke-dasharray', '4 2')

  // X轴网格
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale)
      .tickSize(-height)
      .tickFormat(''))
    .call(gridStyle)

  // X轴
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .call(g => g.select('.domain')
      .attr('stroke', 'black')
      .attr('stroke-width', 1))
    .call(g => g.selectAll('.tick line')
      .attr('stroke', 'black')
      .attr('stroke-width', 1))
    .call(g => g.selectAll('text')
      .style('font-family', 'Arial')
      .style('font-size', '12px'))

  // Y轴网格
  g.append('g')
    .call(d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat(''))
    .call(gridStyle)

  // Y轴
  g.append('g')
    .call(d3.axisLeft(yScale)
      .tickSize(6))
    .call(g => g.select('.domain')
      .attr('stroke', 'black')
      .attr('stroke-width', 1))
    .call(g => g.selectAll('.tick line')
      .attr('stroke', 'black')
      .attr('stroke-width', 1))
    .call(g => g.selectAll('text')
      .style('font-family', 'Arial')
      .style('font-size', '12px'))

  // 坐标轴标题
  g.append('text')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 15)  // 从-15调整为-5，下移10px
    .style('text-anchor', 'middle')
    .style('font-family', 'Arial')
    .style('font-size', '14px')
    .text('Functional score')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 15)  // 从25调整为15，左移10px
      .style('text-anchor', 'middle')
      .style('font-family', 'Arial')
      .style('font-size', '14px')
      .text('Probability density')

  // 绘制正态曲线
  g.append('path')
    .datum(yData)
    .attr('d', d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveBasis))
    .attr('fill', 'none')
    .attr('stroke', '#1976d2')
    .attr('stroke-width', 2)

  // 添加填充区域（新增代码）
  const thresholdX = 1 // 设置阈值X值
  const fillColor = '#1976d2' // 与曲线颜色一致

  // 创建填充区域数据
  const filledData = yData.filter(d => d.x >= thresholdX)
  // 添加起始点保证路径闭合
  filledData.unshift({ 
    x: thresholdX, 
    y: (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * thresholdX * thresholdX) 
  })
  filledData.push({ x: 4, y: 0 }) // 添加结束点

  // 创建面积生成器
  const area = d3.area()
    .x(d => xScale(d.x))
    .y0(yScale(0)) // 底部到x轴
    .y1(d => yScale(d.y))
    .curve(d3.curveBasis)

  // 绘制填充区域
  g.append('path')
    .datum(filledData)
    .attr('d', area)
    .attr('fill', fillColor)
    .attr('opacity', 0.8)
    .attr('stroke', fillColor)
    .attr('stroke-width', 0.5)

  // 绘制直方图
  g.selectAll('rect')
    .data(bins)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.x0) + 1)
    .attr('y', d => yScale(d.density))
    .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 2))
    .attr('height', d => height - yScale(d.density))
    .attr('fill', 'gray')
    .attr('opacity', 0.6)
  
  // 添加图例（新增代码部分）
  const legend = g.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width}, -30)`)  // 右侧留20px间距
  
    // 填充区域图例项
  const legendItems = [
    { 
      label: "LOF", 
      color: "#e41a1c",  // 新增红色填充
      fill: d3.range(-4, -1.01, 0.1)  // 添加左侧填充区域
    },
    { 
      label: "GOF", 
      color: "#1976d2", 
      fill: d3.range(1, 4.01, 0.1) 
    }
  ]
  
  // 绘制图例项
  legend.selectAll('.legend-item')
    .data(legendItems)
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d,i) => `translate(10, ${35 + i*25})`)
    .each(function(d) {
      const item = d3.select(this)
      // 颜色块
      item.append('rect')
        .attr('width', 18)
        .attr('height', 9)
        .attr('fill', d.color)
        .attr('opacity', 0.2)
        .attr('stroke', d.color)
        .attr('stroke-width', 0.5)
      
      // 文本标签
      item.append('text')
        .attr('x', 25)
        .attr('y', 9)
        .style('font-family', 'Arial')
        .style('font-size', '12px')
        .text(d.label)
    })

  // 为两种基因类型添加填充区域（修改原填充代码）
  legendItems.forEach(({color, fill}) => {
    const filledData = yData.filter(d => fill.includes(d.x))
    filledData.unshift({ 
      x: fill[0], 
      y: (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * fill[0] * fill[0]) 
    })
    filledData.push({ x: fill.slice(-1)[0], y: 0 })

    g.append('path')
      .datum(filledData)
      .attr('d', d3.area()
        .x(d => xScale(d.x))
        .y0(yScale(0))
        .y1(d => yScale(d.y))
        .curve(d3.curveBasis))
      .attr('fill', color)
      .attr('opacity', 0.2)
      .attr('stroke', color)
      .attr('stroke-width', 0.5)
  })
})
</script>

<style scoped>
svg {
  background-color: white;
}
</style>

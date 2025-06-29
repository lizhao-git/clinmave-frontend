<template>
  <v-container>
      <h2 class="mb-4">AUROC 曲线（D3 + Vuetify + Hover Card）</h2>
      <div ref="chart" class="roc-plot" @mousemove="updateTooltipPosition" @mouseleave="hideTooltip"></div>

      <!-- Vuetify tooltip card -->
      <v-card
        v-if="tooltip.visible"
        class="tooltip-card"
        :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
        elevation="8"
        density="compact"
      >
        <v-card-text class="pa-2 text-caption">
          <strong>{{ tooltip.data.name }}</strong><br />
          TP: {{ tooltip.data.TP }}<br />
          FN: {{ tooltip.data.FN }}
        </v-card-text>
      </v-card>
    </v-container>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import * as d3 from 'd3'

const chart = ref(null)

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  data: {}
})

const updateTooltipPosition = (e) => {
  tooltip.x = e.pageX + 10
  tooltip.y = e.pageY - 40
}
const hideTooltip = () => {
  tooltip.visible = false
}

onMounted(() => {
  const margin = { top: 30, right: 40, bottom: 50, left: 60 }
  const width = 300 - margin.left - margin.right
  const height = 300 - margin.top - margin.bottom

  const svg = d3.select(chart.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const data = [
    { fpr: 0.0, tpr: 0.0, name: 'rs1', TP: 0, FN: 10 },
    { fpr: 0.1, tpr: 0.6, name: 'rs2', TP: 6, FN: 4 },
    { fpr: 0.2, tpr: 0.7, name: 'rs3', TP: 7, FN: 3 },
    { fpr: 0.3, tpr: 0.8, name: 'rs4', TP: 8, FN: 2 },
    { fpr: 0.4, tpr: 0.85, name: 'rs5', TP: 8.5, FN: 1.5 },
    { fpr: 0.5, tpr: 0.9, name: 'rs6', TP: 9, FN: 1 },
    { fpr: 0.7, tpr: 0.95, name: 'rs7', TP: 9.5, FN: 0.5 },
    { fpr: 1.0, tpr: 1.0, name: 'rs8', TP: 10, FN: 0 }
  ]

  const x = d3.scaleLinear().domain([0, 1]).range([0, width])
  const y = d3.scaleLinear().domain([0, 1]).range([height, 0])

  // 添加 grid lines - 横线
  svg.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y).ticks(10).tickSize(-width).tickFormat(''))

  // 添加 grid lines - 纵线
  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x).ticks(10).tickSize(-height).tickFormat(''))

  // 坐标轴
  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x))

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + 40)
    .attr('text-anchor', 'middle')
    .text('False Positive Rate')

  svg.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(y))

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -40)
    .attr('text-anchor', 'middle')
    .text('True Positive Rate')

  // 曲线
  const line = d3.line()
    .x(d => x(d.fpr))
    .y(d => y(d.tpr))

  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#1976d2')
    .attr('stroke-width', 2)
    .attr('d', line)

  // 点与 hover 事件
  svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => x(d.fpr))
    .attr('cy', d => y(d.tpr))
    .attr('r', 5)
    .attr('fill', '#1976d2')
    .on('mouseover', (event, d) => {
      tooltip.data = d
      tooltip.visible = true
    })
    .on('mouseout', () => {
      tooltip.visible = false
    })
})
</script>

<style scoped>
.roc-plot {
  position: relative;
  width: 100%;
  max-width: 300px;
}

.grid line {
  stroke: rgb(182, 154, 154);
  stroke-dasharray: 4 4;
  opacity: 0.8;
}

.grid path,
.x-axis path,
.y-axis path {
  stroke: #8c8585;
  stroke-width: 1.5px;
  fill: none;
}

.tooltip-card {
  position: absolute;
  pointer-events: none;
  z-index: 100;
}
</style>
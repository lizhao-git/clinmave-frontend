<template>
  <v-container
    class="d-flex flex-column align-center"
    style="min-height: 300px;"
  >
    <v-card-text
      class="d-flex flex-column align-center"
      style="width: 400px;"
    >
      <h3
        v-if="titleFlag"
        style="color:black; font-family: Arial; font-size: 14px; text-align: center;"
      >
        Receiver Operating Characteristic (ROC) curves analysis between B/LB and P/PL
      </h3>
      <svg
        ref="rocSvg"
        width="400"
        height="400"
        style="min-height: 300px; display: block;"
      ></svg>
      <div
        ref="tooltip"
        class="tooltip"
        style="position: absolute; pointer-events: none; background: white; border: 1px solid #ccc; border-radius: 4px; padding: 6px 8px; font-family: Arial; font-size: 14px; color: black; display: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15);"
      ></div>
    </v-card-text>
  </v-container>
</template>


<script setup>
import { ref, watch, onMounted } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
  scores: {
    type: Array,
    default: () => [2.5, -1.0, 3.2, 1.8, 0.3, -0.5, 2.0, 0.1, 2.8, -1.5]
  },
  tags: {
    type: Array,
    default: () => [1, 0, 1, 1, 0, 0, 1, 0, 1, 0]
  },
  titleFlag: {
    type: Boolean,
    default: false
  }
});

const rocSvg = ref(null);
const tooltip = ref(null);
const aucValue = ref(0);

const drawRocCurve = () => {
  const scores = props.scores;
  const tags = props.tags;
  if (!scores.length || !tags.length || scores.length !== tags.length) return;

  d3.select(rocSvg.value).selectAll('*').remove();

  const rocPoints = computeRoc(tags, scores);
  aucValue.value = computeAuc(rocPoints);

  const width = 300;
  const height = 300;
  const margin = { top: 50, right: 10, bottom: 0, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3.select(rocSvg.value)
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .style('font-family', 'Arial, sans-serif')
    .style('font-size', '14px')
    .style('color', 'black')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, innerWidth]);

  const yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([innerHeight, 0]);

  const line = d3.line()
    .x(d => xScale(d.fpr))
    .y(d => yScale(d.tpr))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(rocPoints)
    .attr('fill', 'none')
    .attr('stroke', '#1f77b4')
    .attr('stroke-width', 2)
    .attr('d', line)
    .attr('stroke-dasharray', '1000')
    .attr('stroke-dashoffset', '1000')
    .transition()
    .duration(1000)
    .attr('stroke-dashoffset', '0');

  // 点和hover tooltip
  const tooltipDiv = d3.select(tooltip.value);

  // 随机猜测线
  svg.append('line')
    .attr('x1', xScale(0))
    .attr('y1', yScale(0))
    .attr('x2', xScale(1))
    .attr('y2', yScale(1))
    .attr('stroke', 'grey')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '5,5');

  // X轴
  svg.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))
    .append('text')
    .attr('fill', 'black')
    .attr('x', innerWidth / 2)
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .text('1-Specificity')
    .style('font-family', 'Arial')
    .style('font-size', '14px');

  // Y轴
  svg.append('g')
    .call(d3.axisLeft(yScale))
    .append('text')
    .attr('fill', 'black')
    .attr('x', -innerHeight / 2)
    .attr('y', -40)
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .text('Sensitivity')
    .style('font-family', 'Arial')
    .style('font-size', '14px');

  // AUC 标签
  svg.append('text')
    .attr('x', innerWidth - 100)
    .attr('y', 30)
    .attr('fill', '#1f77b4')
    .text(`AUC = ${aucValue.value.toFixed(2)}`)
    .style('font-family', 'Arial')
    .style('font-size', '14px');
};

const computeRoc = (tags, scores) => {
  const sorted = scores.map((score, i) => ({ score, tag: tags[i] }))
    .sort((a, b) => b.score - a.score);

  let tp = 0, fp = 0;
  const pos = tags.filter(t => t === 1).length;
  const neg = tags.length - pos;
  const rocPoints = [{ fpr: 0, tpr: 0 }];

  for (const { tag } of sorted) {
    if (tag === 1) tp++;
    else fp++;
    rocPoints.push({
      fpr: neg > 0 ? fp / neg : 0,
      tpr: pos > 0 ? tp / pos : 0
    });
  }
  rocPoints.push({ fpr: 1, tpr: 1 });
  return rocPoints;
};

const computeAuc = (rocPoints) => {
  let auc = 0;
  for (let i = 1; i < rocPoints.length; i++) {
    const prev = rocPoints[i - 1];
    const curr = rocPoints[i];
    auc += (curr.fpr - prev.fpr) * (prev.tpr + curr.tpr) / 2;
  }
  return Math.abs(auc);
};

watch([() => props.scores, () => props.tags], () => {
  drawRocCurve();
});

onMounted(() => {
  drawRocCurve();
});
</script>

<style scoped>
.tooltip {
  pointer-events: none;
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 6px 8px;
  font-family: Arial;
  font-size: 14px;
  color: black;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  display: none;
  white-space: nowrap;
  z-index: 1000;
}
</style>

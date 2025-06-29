<template>
  <v-container>
      <svg ref="rocSvg" width="400" height="400"></svg>
  </v-container>
</template>

<style scoped>

</style>

<script setup>
import { ref, watch, onMounted } from 'vue';
import * as d3 from 'd3';

// Props 定义
const props = defineProps({
  scores: {
    type: Array,
    default: () => [2.5, -1.0, 3.2, 1.8, 0.3, -0.5, 2.0, 0.1, 2.8, -1.5]
  },
  tags: {
    type: Array,
    default: () => [1, 0, 1, 1, 0, 0, 1, 0, 1, 0]
  }
});

// ROC 曲线数据
const rocSvg = ref(null);
const aucValue = ref(0);

// 绘制 ROC 曲线
const drawRocCurve = () => {
  const scores = props.scores;
  const tags = props.tags;
  if (!scores.length || !tags.length || scores.length !== tags.length) return;

  // 清空 SVG
  d3.select(rocSvg.value).selectAll('*').remove();

  // 计算 ROC 曲线
  const rocPoints = computeRoc(tags, scores);
  aucValue.value = computeAuc(rocPoints);

  // SVG 尺寸和边距
  const width = 300;
  const height = 300;
  const margin = { top: 60, right: 20, bottom: 0, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // 创建 SVG
  const svg = d3.select(rocSvg.value)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .style('font-family', 'Arial, sans-serif')
    .style('font-size', '12px');

  // X 轴（FPR）
  const xScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, innerWidth]);

  // Y 轴（TPR）
  const yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([innerHeight, 0]);

  // 绘制 ROC 曲线
  const line = d3.line()
    .x(d => xScale(d.fpr))
    .y(d => yScale(d.tpr))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(rocPoints)
    .attr('fill', 'none')
    .attr('stroke', 'teal')
    .attr('stroke-width', 2)
    .attr('d', line)
    .attr('stroke-dasharray', '1000')
    .attr('stroke-dashoffset', '1000')
    .transition()
    .duration(1000)
    .attr('stroke-dashoffset', '0');

  // 绘制随机猜测线
  svg.append('line')
    .attr('x1', xScale(0))
    .attr('y1', yScale(0))
    .attr('x2', xScale(1))
    .attr('y2', yScale(1))
    .attr('stroke', 'grey')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '5,5');

  // X 轴
  svg.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))
    .append('text')
    .attr('fill', 'black')
    .attr('x', innerWidth / 2)
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .text('1-Specificity');

  // Y 轴
  svg.append('g')
    .call(d3.axisLeft(yScale))
    .append('text')
    .attr('fill', '#1a3c5e')
    .attr('x', -innerHeight / 2)
    .attr('y', -40)
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .text('Sensitivity');

  // 添加 AUC 标签
  svg.append('text')
    .attr('x', innerWidth - 100)
    .attr('y', 30)
    .attr('fill', 'teal')
    .text(`AUC = ${aucValue.value.toFixed(2)}`);
};

// 计算 ROC 曲线点
const computeRoc = (tags, scores) => {
  const sorted = scores.map((score, i) => ({ score, tag: tags[i] }))
    .sort((a, b) => b.score - a.score); // 按分数降序排序

  let tp = 0, fp = 0;
  const pos = tags.filter(t => t === 1).length;
  const neg = tags.length - pos;
  const rocPoints = [{ fpr: 0, tpr: 0 }];

  for (const { score, tag } of sorted) {
    if (tag === 1) {
      tp += 1;
    } else {
      fp += 1;
    }
    rocPoints.push({
      fpr: neg > 0 ? fp / neg : 0,
      tpr: pos > 0 ? tp / pos : 0
    });
  }

  rocPoints.push({ fpr: 1, tpr: 1 });
  return rocPoints;
};

// 计算 AUC
const computeAuc = (rocPoints) => {
  let auc = 0;
  for (let i = 1; i < rocPoints.length; i++) {
    const prev = rocPoints[i - 1];
    const curr = rocPoints[i];
    auc += (curr.fpr - prev.fpr) * (prev.tpr + curr.tpr) / 2;
  }
  return Math.abs(auc); // 确保 AUC 为正
};

// 初始化和 props 变化时绘制
watch([() => props.scores, () => props.tags], () => {
  drawRocCurve();
});

onMounted(() => {
  drawRocCurve();
});
</script>
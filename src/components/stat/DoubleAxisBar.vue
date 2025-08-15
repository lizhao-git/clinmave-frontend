<template>
  <div ref="chartContainer"></div>
  <teleport to="body">
      <v-card flat v-if="tooltip.visible" class="custom-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        <v-card-text>
          <table style="font-family: Arial; font-size: 14px; border-collapse: collapse; width: 100%;">
            <tbody>
              <tr><td>Gene:</td><td>{{ tooltip.data.gene }}</td></tr>
              <tr><td>Dataset DMS:</td><td>{{ tooltip.data.datasetDms }}</td></tr>
              <tr><td>Dataset CRISPR:</td><td>{{ tooltip.data.datasetCrispr }}</td></tr>
              <tr><td>Variant DMS:</td><td>{{ tooltip.data.variantDms }}</td></tr>
              <tr><td>Variant CRISPR:</td><td>{{ tooltip.data.variantCrispr }}</td></tr>
            </tbody>
          </table>
        </v-card-text>
      </v-card>
  </teleport>
</template>

<script setup>
import * as d3 from "d3";
import { onMounted, ref, watch } from "vue";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}) // 默认空对象，防止 Object.keys 报错
  },
  width: {
    type: Number,
    default: 1200
  },
  height: {
    type: Number,
    default: 600
  }
});

const chartContainer = ref(null);
const tooltip = ref({
  visible: false,
  x: 10,
  y: 10,
  data: {}
});

const drawChart = () => {
  // 清空现有 SVG
  d3.select(chartContainer.value).selectAll("*").remove();

  // 数据验证
  if (!props.data || Object.keys(props.data).length === 0) {
    console.warn("No valid data provided for DoubleAxisBar");
    return;
  }

  const margin = { top: 40, right: 60, bottom: 80, left: 100, middle: 60 }; // 左侧 margin 容纳双 Y 轴
  const width = props.width - margin.left - margin.right;
  const height = props.height - margin.top - margin.bottom - margin.middle; // 减去中间间距

  // 准备 dataset 和 variant 数据
  const datasetData = Object.keys(props.data).map((gene) => ({
    gene,
    dms: props.data[gene]?.dataset?.dataset_dms || 0,
    crispr: props.data[gene]?.dataset?.dataset_crispr || 0
  }));

  // 按 dataset 的 dms + crispr 总和降序排序
  datasetData.sort((a, b) => (b.dms + b.crispr) - (a.dms + a.crispr));
  const genes = datasetData.map(d => d.gene);

  // 根据排序后的基因顺序重排 variantData
  const variantData = genes.map((gene) => ({
    gene,
    dms: props.data[gene]?.variant?.var_dms || 0,
    crispr: props.data[gene]?.variant?.var_crispr || 0
  }));

  // 创建 SVG
  const svg = d3
    .select(chartContainer.value)
    .append("svg")
    .attr("width", props.width)
    .attr("height", props.height);

  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // X 轴比例尺
  const xScale = d3
    .scaleBand()
    .domain(genes)
    .range([0, width])
    .padding(0.2);

  // Y 轴比例尺
  const yMaxDataset = d3.max(datasetData, (d) => d.dms + d.crispr) || 1;
  const yMaxVariant = d3.max(variantData, (d) => d.dms + d.crispr) || 1;

  const yScaleDataset = d3
    .scaleLinear()
    .domain([0, yMaxDataset])
    .range([height / 2 - margin.middle / 2, 0]);

  const yScaleVariant = d3
    .scaleLinear()
    .domain([0, yMaxVariant])
    .range([0, height / 2 - margin.middle / 2]);

  const color = d3
    .scaleOrdinal()
    .domain(["dms", "crispr"])
    .range(["#0072B2", "#D55E00"]);

  // 上半部分 - dataset 堆叠
  const datasetStack = d3.stack().keys(["dms", "crispr"])(datasetData);

  chartGroup
    .selectAll(".dataset-layer")
    .data(datasetStack)
    .join("g")
    .attr("class", "dataset-layer")
    .attr("fill", (d) => color(d.key))
    .selectAll("rect")
    .data((d) => d)
    .join("rect")
    .attr("class", (d) => `bar dataset-bar ${d.key}-bar gene-${d.data.gene}`)
    .attr("x", (d) => xScale(d.data.gene))
    .attr("y", (d) => yScaleDataset(d[1]))
    .attr("height", (d) => yScaleDataset(d[0]) - yScaleDataset(d[1]))
    .attr("width", xScale.bandwidth())
    .attr("stroke", "#000") // 添加边框
    .attr("stroke-width", 1)
    .on("mouseover", function (event, d) {
      d3.selectAll(".bar").style("opacity", 0.3);
      d3.selectAll(`.gene-${d.data.gene}`).style("opacity", 1);
      tooltip.value = {
        visible: true,
        x: event.clientX + 10,
        y: event.clientY + 10,
        data: {
          gene: d.data.gene,
          datasetDms: props.data[d.data.gene]?.dataset?.dataset_dms || 0,
          datasetCrispr: props.data[d.data.gene]?.dataset?.dataset_crispr || 0,
          variantDms: props.data[d.data.gene]?.variant?.var_dms || 0,
          variantCrispr: props.data[d.data.gene]?.variant?.var_crispr || 0
        }
      };
    })
    .on("mousemove", (event) => {
      tooltip.value.x = event.clientX + 10;
      tooltip.value.y = event.clientY + 10;
    })
    .on("mouseout", function () {
      d3.selectAll(".bar").style("opacity", 1);
      tooltip.value.visible = false;
    });

  // 下半部分 - variant 堆叠
  const variantStack = d3.stack().keys(["dms", "crispr"])(variantData);

  chartGroup
    .selectAll(".variant-layer")
    .data(variantStack)
    .join("g")
    .attr("class", "variant-layer")
    .attr("fill", (d) => color(d.key))
    .selectAll("rect")
    .data((d) => d)
    .join("rect")
    .attr("class", (d) => `bar variant-bar ${d.key}-bar gene-${d.data.gene}`)
    .attr("x", (d) => xScale(d.data.gene))
    .attr("y", (d) => height / 2 + margin.middle / 2)
    .attr("height", (d) => yScaleVariant(d[1]) - yScaleVariant(d[0]))
    .attr("width", xScale.bandwidth())
    .attr("stroke", "#000") // 添加边框
    .attr("stroke-width", 1)
    .on("mouseover", function (event, d) {
      d3.selectAll(".bar").style("opacity", 0.3);
      d3.selectAll(`.gene-${d.data.gene}`).style("opacity", 1);
      tooltip.value = {
        visible: true,
        x: event.clientX + 10,
        y: event.clientY + 10,
        data: {
          gene: d.data.gene,
          datasetDms: props.data[d.data.gene]?.dataset?.dataset_dms || 0,
          datasetCrispr: props.data[d.data.gene]?.dataset?.dataset_crispr || 0,
          variantDms: props.data[d.data.gene]?.variant?.var_dms || 0,
          variantCrispr: props.data[d.data.gene]?.variant?.var_crispr || 0
        }
      };
    })
    .on("mousemove", (event) => {
      tooltip.value.x = event.clientX + 10;
      tooltip.value.y = event.clientY + 10;
    })
    .on("mouseout", function () {
      d3.selectAll(".bar").style("opacity", 1);
      tooltip.value.visible = false;
    });

  // X 轴（放置在中间间隙中央）
  chartGroup
    .append("g")
    .attr("transform", `translate(0,${height / 2 - margin.middle / 2})`)
    .call(d3.axisBottom(xScale).tickSize(0))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .style("font-size", "12px")
    .style("font-family", "Arial")
    .style("font-style", "italic"); // 基因名斜体

  // 上半部分 Y 轴（#Datasets），左侧，以 5 为间隔
  chartGroup
    .append("g")
    .call(d3.axisLeft(yScaleDataset).ticks(Math.ceil(yMaxDataset / 5)))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 60)
    .attr("x", -(height / 4 - margin.middle / 4))
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("#Datasets");

  // 下半部分 Y 轴（#Variants），左侧偏移 40px，以 10000 为间隔
  chartGroup
    .append("g")
    .attr("transform", `translate(0, ${height / 2 + margin.middle / 2})`)
    .call(
      d3.axisLeft(yScaleVariant)
        .tickValues(d3.range(0, yMaxVariant + 10000, 10000))
        .tickFormat(d3.format("~s"))
    )
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 60)
    .attr("x", -(height / 4 - margin.middle / 4))
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("#Variants");

  // 添加图例 (Legend)
  const legend = svg
    .append("g")
    .attr("transform", `translate(${props.width - margin.right - 100}, ${margin.top})`);

  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", color("dms"))
    .attr("stroke", "#000") // 图例矩形边框
    .attr("stroke-width", 1);

  legend
    .append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .text("DMS")
    .style("font-size", "12px");

  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", 20)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", color("crispr"))
    .attr("stroke", "#000") // 图例矩形边框
    .attr("stroke-width", 1);

  legend
    .append("text")
    .attr("x", 24)
    .attr("y", 29)
    .attr("dy", ".35em")
    .text("CRISPR")
    .style("font-size", "12px");
};

onMounted(drawChart);
watch(
  () => props.data,
  () => {
    drawChart();
  },
  { deep: true }
);
</script>

<style scoped>
svg {
  font-family: Arial, sans-serif;
}
.bar {
  transition: opacity 0.2s;
}
.custom-tooltip {
  position: fixed;
  z-index: 99999;
  max-width: 300px !important; /* 强制限制宽度 */
  background-color: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}
.custom-tooltip table td {
  padding: 3px 3px;
  max-width: 300px; /* 限制单元格宽度 */
}
</style>
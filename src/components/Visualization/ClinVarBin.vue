<template>
  <v-container fluid>
    <v-card flat>
      <v-card-text class="d-flex flex-column">
        <!-- 图表标题 -->
        <h4 v-if="titleFlag" class="text-center">
          Functional score distribution across ClinVar classification categories
        </h4>

        <!-- 图表容器，确保图表在父容器中居中 -->
        <div class="chart-container">
          <div class="chart-inner">
            <svg ref="chart" :height="height + legendHeight"></svg>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import * as d3 from "d3";

export default {
  name: "FunctionScoreBarChart",
  props: {
    inputData: {
      type: Array,
      required: true
    },
    titleFlag: {
      type: Boolean,
      default: false
    },
    height: {
      type: Number,
      default: 300
    },
    barWidth: {
      type: Number,
      default: 10
    }
  },
  data() {
    return {
      width: 0,
      legendHeight: 80,
      margin: { top: 0, right: 0, bottom: 0, left: 60 },
      groupKeys: ["(Likely-) benign", "Uncertain", "Conflicting", "(Likely-) pathogenic"],
      colorMap: d3.scaleOrdinal()
        .domain(["(Likely-) benign", "Uncertain", "Conflicting", "(Likely-) pathogenic"])
        .range(["#2ca02c", "#1f77b4", "#9467bd", "#d62728"]),
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.updateDimensions();
      this.drawChart();
      window.addEventListener('resize', this.updateDimensions);
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateDimensions);
  },
  watch: {
    inputData() {
      this.drawChart();
    },
    width() {
      this.drawChart();
    }
  },
  methods: {
    updateDimensions() {
      const parentWidth = this.$refs.chart.parentElement.clientWidth || 400;
      this.width = Math.max(300, parentWidth);
      const baseMargin = this.width < 600 ? 20 : this.width < 1000 ? 30 : 40;
      this.margin = {
        top: baseMargin + (this.titleFlag ? 10 : 10),
        right: baseMargin,
        bottom: baseMargin + 30,
        left: 50
      };
    },
    getSmartYTicks(maxY) {
      const possibleSteps = [5, 10, 20, 30, 50];
      const maxTicks = 10;
      maxY = Math.max(1, maxY);
      let selectedStep = possibleSteps[0];
      for (const step of possibleSteps) {
        const tickCount = Math.ceil(maxY / step) + 1;
        if (tickCount <= maxTicks) {
          selectedStep = step;
          break;
        }
      }
      const adjustedMaxY = Math.ceil(maxY / selectedStep) * selectedStep;
      const ticks = [];
      for (let i = 0; i <= adjustedMaxY; i += selectedStep) {
        ticks.push(i);
      }
      return { ticks, adjustedMaxY };
    },
    drawChart() {
      if (!this.inputData || !Array.isArray(this.inputData) || this.inputData.length === 0) return;

      const svg = d3.select(this.$refs.chart);
      const { width, height, margin, groupKeys, inputData, colorMap, barWidth, legendHeight } = this;
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      svg.selectAll("*").remove();
      svg.attr("width", width);
      svg.attr("height", height + legendHeight);

      // Step 1: Generate bins
      const scoreRanges = inputData
        .map(d => d.scoreRange)
        .filter(range => typeof range === 'string' && range.includes('-'));

      const bounds = scoreRanges
        .flatMap(range => range.split('-').map(val => parseFloat(val)))
        .filter(val => !isNaN(val));

      const minScore = Math.min(...bounds);
      const maxScore = Math.max(...bounds);
      const binSize = 0.1;
      const extraBins = 5;
      const binCount = Math.ceil((maxScore - minScore) / binSize) + extraBins;
      const extendedMin = minScore - Math.floor(extraBins / 2) * binSize;
      const extendedMax = extendedMin + binCount * binSize;

      const bins = [];
      for (let i = extendedMin; i < extendedMax; i += binSize) {
        const start = parseFloat(i.toFixed(1));
        const end = parseFloat((i + binSize).toFixed(1));
        bins.push(`${start.toFixed(1)}-${end.toFixed(1)}`);
      }

      const dataMap = new Map();
      inputData.forEach(d => {
        const parts = d.scoreRange?.split('-').map(v => parseFloat(v));
        if (!parts || parts.length !== 2 || parts.some(isNaN)) return;
        const formattedRange = `${parts[0].toFixed(1)}-${parts[1].toFixed(1)}`;
        const counts = {};
        groupKeys.forEach(k => counts[k] = Number(d.clvGroupCounts?.[k]) || 0);
        dataMap.set(formattedRange, counts);
      });

      const data = bins.map(scoreRange => {
        const clvGroupCounts = dataMap.get(scoreRange) || {
          "(Likely-) benign": 0,
          Uncertain: 0,
          Conflicting: 0,
          "(Likely-) pathogenic": 0
        };
        return { scoreRange, ...clvGroupCounts };
      });

      const stackData = data.map(d => {
        const row = { scoreRange: d.scoreRange };
        groupKeys.forEach(k => row[k] = d[k]);
        return row;
      });

      const rawMaxY = d3.max(stackData, d => groupKeys.reduce((sum, k) => sum + d[k], 0)) || 1;
      const { ticks, adjustedMaxY } = this.getSmartYTicks(rawMaxY);

      const x = d => {
        const index = bins.indexOf(d);
        return index >= 0 ? index * barWidth : 0;
      };

      const y = d3.scaleLinear()
        .domain([0, adjustedMaxY])
        .nice()
        .range([chartHeight, 0]);

      const xScaleForAxis = d3.scaleBand()
        .domain(bins)
        .range([0, bins.length * barWidth])
        .padding(0);

      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const stack = d3.stack().keys(groupKeys);
      const stackedData = stack(stackData);

      const layers = g.selectAll(".layer")
        .data(stackedData)
        .enter().append("g")
        .attr("fill", d => colorMap(d.key));

      layers.selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.scoreRange))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", barWidth)
        .attr("stroke", "black")             // 边框颜色
        .attr("stroke-width", 0.3);         // 边框宽度（可根据需要调节）


      const majorTicks = bins.filter(bin => {
        const start = parseFloat(bin.split('-')[0]);
        return !isNaN(start) && (start * 10) % 10 === 0;
      });

      g.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .attr("class", "x-axis")
        .call(d3.axisBottom(xScaleForAxis)
          .tickValues(majorTicks)
          .tickFormat(d => parseFloat(d.split('-')[0]).toFixed(1)))  // 保留一位小数
        .selectAll("text")
        .attr("dy", "1.2em")
        .style("font-size", "12px");

      g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).tickValues(ticks).tickFormat(d3.format("d")));

      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
        .text("#Variants");

      if (majorTicks.length > 0) {
        // 横坐标绘制的起点X就是margin.left
        const axisStartX = margin.left;

        // 横坐标绘制的宽度 = bins.length * barWidth
        const axisWidth = bins.length * barWidth;

        // 计算标题居中X坐标
        const axisCenter = axisStartX + axisWidth / 2;

        svg.append("text")
          .attr("x", axisCenter)
          .attr("y", height) // 你之前调好的距离
          .attr("text-anchor", "middle")
          .attr("font-size", 14)
          .text("Functional Score");
      }

      const legend = svg.append("g")
        .attr("transform", `translate(${(width - 300) / 2}, ${height + 20})`);

      groupKeys.forEach((key, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const xPos = col * 150;
        const yPos = row * 25;
        const item = legend.append("g")
          .attr("transform", `translate(${xPos}, ${yPos})`);

        item.append("rect")
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", colorMap(key));

        item.append("text")
          .attr("x", 20)
          .attr("y", 12)
          .attr("font-size", "14px")
          .text(key);
      });

    }
  }
};
</script>

<style scoped>
svg {
  display: block;
  width: 100%;
}
.chart-container {
  width: 100%;
  overflow-x: auto;
  display: flex;
  justify-content: center;
}
.chart-inner {
  display: inline-block;
}
.y-axis path,
.y-axis line,
.x-axis path,
.x-axis line {
  stroke: #333;
  stroke-width: 1;
  shape-rendering: crispEdges;
}
</style>
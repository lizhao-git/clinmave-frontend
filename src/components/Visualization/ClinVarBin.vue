<template>
  <v-container>
    <v-card flat>
      <v-card-text>
        <svg ref="chart" :width="width" :height="height"></svg>
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
    }
  },
  data() {
    return {
      width: 400,
      height: 400,
      margin: { top: 30, right: 30, bottom: 180, left: 60 },
      groupKeys: ["(Likely-) benign", "Uncertain", "Conflicting", "(Likely-) pathogenic"],
      colorMap: d3.scaleOrdinal()
        .domain(["(Likely-) benign", "Uncertain", "Conflicting", "(Likely-) pathogenic"])
        .range(["#2ca02c", "#1f77b4", "#9467bd", "#d62728"]),
    };
  },
  mounted() {
    this.drawChart();
  },
  watch: {
    inputData() {
      this.drawChart();
    }
  },
  methods: {
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
      console.log("输入数据:", this.inputData);
      if (!this.inputData || !Array.isArray(this.inputData)) {
        console.error("无效的输入数据: 期望一个数组");
        return;
      }

      const svg = d3.select(this.$refs.chart);
      const { width, height, margin, groupKeys, inputData, colorMap } = this;
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      svg.selectAll("*").remove();

      // 1. 生成 bins
      const bins = [];
      for (let i = -1.0; i < 4.0; i += 0.1) {
        const start = parseFloat(i.toFixed(1));
        const end = parseFloat((i + 0.1).toFixed(1));
        bins.push(`${start.toFixed(1)}-${end.toFixed(1)}`);
      }

      // 2. 数据映射
      const dataMap = new Map();
      inputData.forEach(d => {
        if (!d.scoreRange || !d.clvGroupCounts) {
          console.warn("无效的数据条目:", d);
          return;
        }
        const parts = d.scoreRange.split('-').map(parseFloat);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const formattedRange = `${parts[0].toFixed(1)}-${parts[1].toFixed(1)}`;
          const counts = {};
          groupKeys.forEach(key => {
            counts[key] = Number(d.clvGroupCounts[key]) || 0;
          });
          dataMap.set(formattedRange, counts);
        }
      });

      // 3. 创建完整数据集
      const data = bins.map(scoreRange => {
        const clvGroupCounts = dataMap.get(scoreRange) || {
          "(Likely-) benign": 0,
          Uncertain: 0,
          Conflicting: 0,
          "(Likely-) pathogenic": 0
        };
        return { scoreRange, ...clvGroupCounts };
      });

      // 4. 准备堆叠数据
      const stackData = data.map(d => {
        const row = { scoreRange: d.scoreRange };
        groupKeys.forEach(key => {
          row[key] = Number(d[key]) || 0;
        });
        return row;
      });

      // 5. 计算最大 Y 值
      const rawMaxY = d3.max(stackData, d => groupKeys.reduce((sum, k) => sum + d[k], 0)) || 1;
      const { ticks, adjustedMaxY } = this.getSmartYTicks(rawMaxY);

      // 6. 创建比例尺
      const x = d3.scaleBand()
        .domain(bins)
        .range([0, chartWidth])
        .padding(0.05);

      const y = d3.scaleLinear()
        .domain([0, adjustedMaxY])
        .nice()
        .range([chartHeight, 0]);

      const stack = d3.stack().keys(groupKeys);
      const stackedData = stack(stackData);

      // 7. 创建图表容器
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // 8. 绘制堆叠柱状图
      const layers = g.selectAll(".layer")
        .data(stackedData)
        .enter().append("g")
        .attr("class", "layer")
        .attr("fill", d => colorMap(d.key));

      layers.selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.scoreRange) || 0)
        .attr("y", d => y(d[1]))
        .attr("height", d => Math.max(0, y(d[0]) - y(d[1])))
        .attr("width", x.bandwidth());

      // 9. 配置横轴刻度
      const majorTickValues = bins.filter((_, i) => {
        const start = parseFloat(_.split('-')[0]);
        return Number.isInteger(start);
      });

      // 10. 添加横轴
      const xAxis = g.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x)
          .tickValues(majorTickValues)
          .tickFormat(d => parseFloat(d.split('-')[0]).toFixed(0)))
        .attr("class", "x-axis");

      xAxis.selectAll("text")
        .style("text-anchor", "middle")
        .attr("dx", "0")
        .attr("dy", "1em")
        .style("font-size", "10px");

      // 11. 添加次要刻度
      g.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x)
          .tickValues(bins)
          .tickFormat("")
          .tickSize(4))
        .attr("class", "minor-axis");

      // 12. 添加纵轴
      g.append("g")
        .call(d3.axisLeft(y)
          .tickValues(ticks)
          .tickFormat(d3.format("d")))
        .attr("class", "y-axis");

      // 13. 添加纵轴标签
      g.append("text")
        .attr("x", -chartHeight / 2)
        .attr("y", -margin.left + 20) // 更靠近纵轴
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
        .text("#SNVs");

      // 14. 添加横轴标签
      g.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight + margin.bottom - 140) // 更靠近横轴
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
        .text("Function Score");

      // 15. 添加横轴最左侧和最右侧标签
      g.append("text")
        .attr("x", x(bins[0]))
        .attr("y", chartHeight + 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text("-1.0");

      g.append("text")
        .attr("x", x(bins[bins.length - 1]) + x.bandwidth())
        .attr("y", chartHeight + 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text("4.0");

      // 16. 添加图例（两排布局）
      const legend = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${chartHeight + margin.top + 60})`);

      groupKeys.forEach((key, i) => {
        const row = Math.floor(i / 2); // 第0行或第1行
        const col = i % 2; // 第0列或第1列
        const xPos = col * 120;
        const yPos = row * 20;
        const legendItem = legend.append("g")
          .attr("transform", `translate(${xPos}, ${yPos})`);

        legendItem.append("rect")
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", colorMap(key));

        legendItem.append("text")
          .attr("x", 20)
          .attr("y", 12)
          .attr("font-size", "12px")
          .text(key);
      });

      // 17. 添加零点中心线
      const zeroBin = bins.find(bin => parseFloat(bin.split('-')[0]) === 0.0);
      if (zeroBin) {
        g.append("line")
          .attr("x1", x(zeroBin) + x.bandwidth() / 2)
          .attr("x2", x(zeroBin) + x.bandwidth() / 2)
          .attr("y1", 0)
          .attr("y2", chartHeight)
          .attr("stroke", "#000")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "5,5");
      }
    }
  }
};
</script>

<style scoped>
.x-axis path, .y-axis path, .x-axis line, .y-axis line {
  stroke: #333;
  stroke-width: 1;
}
.minor-axis line {
  stroke: #ccc;
}
svg {
  display: block;
}
</style>
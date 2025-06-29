<template>
  <v-container style="position: relative;">
    <v-btn
      icon="$download"
      size="x-small"
      color="primary"
      variant="text"
      style="position: absolute; top: 10px; right: 10px;"
      @click="downloadPDF"
    ></v-btn>
    <svg ref="svg" :width="width" :height="height"></svg>
  </v-container>
</template>

<script setup>
import * as d3 from "d3";
import * as jStat from "jstat";
import { ref, watch, onMounted, defineProps } from "vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  width: {
    type: Number,
    default: 800,
  },
  height: {
    type: Number,
    default: 400,
  },
});

const svg = ref(null);
const { data, width, height } = props;

function wilcoxonRankSum(sample1, sample2) {
  try {
    const result = jStat.mannWhitneyU(sample1, sample2, { alternative: "two-sided" });
    return result.p || 1;
  } catch (error) {
    console.warn("jStat Mann-Whitney U test failed:", error.message);
    const all = sample1.concat(sample2).sort((a, b) => a - b);
    const ranks = new Map();
    let currentRank = 1;
    for (let i = 0; i < all.length; i++) {
      if (i > 0 && all[i] !== all[i - 1]) currentRank = i + 1;
      ranks.set(all[i], currentRank);
    }
    const rankSum1 = sample1.reduce((acc, v) => acc + ranks.get(v), 0);
    const n1 = sample1.length;
    const n2 = sample2.length;
    const U1 = rankSum1 - (n1 * (n1 + 1)) / 2;
    const U2 = n1 * n2 - U1;
    const U = Math.min(U1, U2);
    const mu = (n1 * n2) / 2;
    const sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
    const z = (U - mu) / sigma;
    const p = 0.2316419;
    const b1 = 0.319381530;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;
    const t = 1 / (1 + p * Math.abs(z));
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const t5 = t4 * t;
    const pdf = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
    return 2 * (1 - (1 - pdf * (b1 * t + b2 * t2 + b3 * t3 + b4 * t4 + b5 * t5)));
  }
}

function downloadPDF() {
  const svgElement = svg.value;
  html2canvas(svgElement, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [width, height],
    });
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("boxplot.pdf");
  });
}

function drawChart() {
  if (!svg.value) return;
  d3.select(svg.value).selectAll("*").remove();

  const margin = { top: 120, right: 30, bottom: 80, left: 80 };
  const svgSel = d3.select(svg.value).attr("width", width).attr("height", height);

  const tooltip = svgSel
    .append("g")
    .attr("class", "tooltip")
    .style("display", "none");

  tooltip
    .append("rect")
    .attr("fill", "white")
    .attr("fill-opacity", "0.8")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1)
    .attr("rx", 8)
    .style("filter", "drop-shadow(2px 2px 5px rgba(0,0,0,0.2))");

  const tooltipText = tooltip
    .append("text")
    .attr("fill", "black")
    .style("font-size", "14px")
    .attr("dy", "1em");

  const keys = Object.keys(data);
  const plotWidth = (width - margin.left - margin.right) / keys.length;
  const innerHeight = height - margin.top - margin.bottom;

  keys.forEach((key, idx) => {
    const keyG = svgSel
      .append("g")
      .attr("transform", `translate(${margin.left + idx * plotWidth}, ${margin.top})`);

    const lof = data[key].LOF;
    const gof = data[key].GOF;
    const all = lof.concat(gof);
    const yScale = d3.scaleLinear()
      .domain([d3.min(all) * 0.9, d3.max(all) * 1.1])
      .range([innerHeight, 0]);

    const xScale = d3.scaleBand()
      .domain(["LOF", "GOF"])
      .range([0, plotWidth - 50])
      .padding(0.3);

    keyG
      .append("g")
      .call(d3.axisLeft(yScale).ticks(6))
      .append("text")
      .attr("fill", "black")
      .attr("x", -margin.left - 10)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .style("font-size", "12px")
      .text(key);

    keyG
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "middle");

    const colorMap = { LOF: "#1f77b4", GOF: "#ff7f0e" };

    let maxBoxY = Infinity;
    let xMidLOF, xMidGOF;

    ["LOF", "GOF"].forEach(group => {
      const values = data[key][group];
      const sorted = values.slice().sort(d3.ascending);
      const min = d3.min(sorted);
      const max = d3.max(sorted);
      const q1 = d3.quantile(sorted, 0.25);
      const median = d3.quantile(sorted, 0.5);
      const q3 = d3.quantile(sorted, 0.75);
      const q4 = max;
      const iqr = q3 - q1;
      const lowerWhisker = Math.max(min, q1 - 1.5 * iqr);
      const upperWhisker = Math.min(max, q3 + 1.5 * iqr);
      const x = xScale(group);
      const boxWidth = xScale.bandwidth();

      maxBoxY = Math.min(maxBoxY, yScale(upperWhisker));
      if (group === "LOF") xMidLOF = x + boxWidth / 2;
      if (group === "GOF") xMidGOF = x + boxWidth / 2;

      keyG
        .append("rect")
        .attr("x", x)
        .attr("y", yScale(q3))
        .attr("width", boxWidth)
        .attr("height", yScale(q1) - yScale(q3))
        .attr("fill", colorMap[group])
        .attr("opacity", 0.7)
        .on("mouseover", function (event) {
          tooltip.style("display", null);
          const lines = [
            { label: "Group", value: group },
            { label: "Min", value: min.toFixed(3) },
            { label: "Lower Whisker", value: lowerWhisker.toFixed(3) },
            { label: "Q1", value: q1.toFixed(3) },
            { label: "Median", value: median.toFixed(3) },
            { label: "Q3", value: q3.toFixed(3) },
            { label: "Upper Whisker", value: upperWhisker.toFixed(3) },
            { label: "Max", value: max.toFixed(3) },
          ];
          tooltipText.selectAll("*").remove();
          lines.forEach((line, i) => {
            tooltipText
              .append("tspan")
              .attr("x", 10)
              .attr("dy", i === 0 ? 0 : "1.4em")
              .style("font-weight", "bold")
              .text(`${line.label}: `);
            tooltipText
              .append("tspan")
              .text(line.value)
              .style("font-weight", "normal");
          });
          const bbox = tooltipText.node().getBBox();
          tooltip
            .select("rect")
            .attr("x", bbox.x - 5)
            .attr("y", bbox.y - 5)
            .attr("width", bbox.width + 20)
            .attr("height", bbox.height + 10);
        })
        .on("mousemove", function (event) {
          const [mx, my] = d3.pointer(event);
          let tooltipX = mx + margin.left + idx * plotWidth + 15;
          let tooltipY = my + margin.top + 15;
          const bbox = tooltipText.node().getBBox();
          if (tooltipX + bbox.width + 20 > width) {
            tooltipX = mx + margin.left + idx * plotWidth - bbox.width - 20;
          }
          if (tooltipY + bbox.height + 10 > height) {
            tooltipY = my + margin.top - bbox.height - 10;
          }
          tooltip.attr("transform", `translate(${tooltipX}, ${tooltipY})`);
        })
        .on("mouseout", function () {
          tooltip.style("display", "none");
        });

      keyG
        .append("line")
        .attr("x1", x)
        .attr("x2", x + boxWidth)
        .attr("y1", yScale(median))
        .attr("y2", yScale(median))
        .attr("stroke", "black")
        .attr("stroke-width", 2);

      keyG
        .append("line")
        .attr("x1", x + boxWidth / 2)
        .attr("x2", x + boxWidth / 2)
        .attr("y1", yScale(lowerWhisker))
        .attr("y2", yScale(q1))
        .attr("stroke", "black");

      keyG
        .append("line")
        .attr("x1", x + boxWidth / 2)
        .attr("x2", x + boxWidth / 2)
        .attr("y1", yScale(q3))
        .attr("y2", yScale(upperWhisker))
        .attr("stroke", "black");

      keyG
        .append("line")
        .attr("x1", x + boxWidth / 4)
        .attr("x2", x + boxWidth * 3 / 4)
        .attr("y1", yScale(lowerWhisker))
        .attr("y2", yScale(lowerWhisker))
        .attr("stroke", "black");

      keyG
        .append("line")
        .attr("x1", x + boxWidth / 4)
        .attr("x2", x + boxWidth * 3 / 4)
        .attr("y1", yScale(upperWhisker))
        .attr("y2", yScale(upperWhisker))
        .attr("stroke", "black");
    });

    const p = wilcoxonRankSum(lof, gof);
    const pFormatted = p.toExponential(3);
    const yMark = maxBoxY - 10;

    keyG
      .append("line")
      .attr("x1", xMidLOF)
      .attr("x2", xMidGOF)
      .attr("y1", yMark)
      .attr("y2", yMark)
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    keyG
      .append("line")
      .attr("x1", xMidLOF)
      .attr("x2", xMidLOF)
      .attr("y1", yMark)
      .attr("y2", yMark + 6)
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    keyG
      .append("line")
      .attr("x1", xMidGOF)
      .attr("x2", xMidGOF)
      .attr("y1", yMark)
      .attr("y2", yMark + 6)
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    keyG
      .append("text")
      .attr("x", (xMidLOF + xMidGOF) / 2)
      .attr("y", yMark - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(p < 0.05 ? `p=${pFormatted}` : `ns (p=${pFormatted})`);
  });
}

watch(() => data, () => { drawChart(); }, { immediate: true });
onMounted(() => { drawChart(); });
</script>

<style scoped>
.tooltip {
  pointer-events: none;
}
</style>
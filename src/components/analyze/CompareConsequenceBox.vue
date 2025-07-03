<script setup>
import * as d3 from "d3";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ref, watch, onMounted } from "vue";
import * as jStat from "jstat";

const props = defineProps({
  data: { type: Object, required: true },
  width: { type: Number, default: 800 },
  height: { type: Number, default: 360 },
  titleFlag: { type: Boolean, default: false },
});

const svg = ref(null);
const { data, width, height } = props;

function tTest(sample1, sample2) {
  try {
    const n1 = sample1.length;
    const n2 = sample2.length;
    const mean1 = jStat.mean(sample1);
    const mean2 = jStat.mean(sample2);
    const var1 = jStat.variance(sample1, true);
    const var2 = jStat.variance(sample2, true);
    const se = Math.sqrt(var1 / n1 + var2 / n2);
    const t = (mean1 - mean2) / se;
    const df = Math.pow(var1 / n1 + var2 / n2, 2) /
      ((Math.pow(var1 / n1, 2) / (n1 - 1)) + (Math.pow(var2 / n2, 2) / (n2 - 1)));
    const p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
    return p;
  } catch (e) {
    return 1;
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
  d3.select(svg.value.parentNode).selectAll(".custom-tooltip").remove();

  const margin = { top: 30, right: 20, bottom: 60, left: 50 };
  const keys = Object.keys(data);
  const plotWidth = (width - margin.left - margin.right) / keys.length;
  const innerHeight = height - margin.top - margin.bottom;
  const svgSel = d3.select(svg.value);
  const container = svg.value.parentNode;

  const tooltip = d3.select(container)
    .append("div")
    .attr("class", "custom-tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "white")
    .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)")
    .style("font-family", "Arial")
    .style("font-size", "13px")
    .style("padding", "10px")
    .style("display", "none")
    .style("z-index", 100);

  const colorMap = { LOF: "#1f77b4", GOF: "#ff7f0e" };

  // Step 1: compute global max box top Y
  let globalMaxBoxY = Infinity;
  keys.forEach(key => {
    const lof = data[key].LOF;
    const gof = data[key].GOF;
    const all = lof.concat(gof);
    const yScale = d3.scaleLinear()
      .domain([d3.min(all) * 0.9, d3.max(all) * 1.1])
      .range([innerHeight, 0]);

    const q3LOF = d3.quantile(lof.slice().sort(d3.ascending), 0.75);
    const q3GOF = d3.quantile(gof.slice().sort(d3.ascending), 0.75);
    const iqrLOF = q3LOF - d3.quantile(lof.slice().sort(d3.ascending), 0.25);
    const iqrGOF = q3GOF - d3.quantile(gof.slice().sort(d3.ascending), 0.25);

    const maxLOF = Math.min(d3.max(lof), q3LOF + 1.5 * iqrLOF);
    const maxGOF = Math.min(d3.max(gof), q3GOF + 1.5 * iqrGOF);

    const localBoxTopY = Math.min(yScale(maxLOF), yScale(maxGOF));
    globalMaxBoxY = Math.min(globalMaxBoxY, localBoxTopY);
  });

  // Step 2: draw boxplots
  keys.forEach((key, idx) => {
    const groupG = svgSel
      .append("g")
      .attr("transform", `translate(${margin.left + idx * plotWidth}, ${margin.top})`);

    const lof = data[key].LOF;
    const gof = data[key].GOF;
    const all = lof.concat(gof);
    const yScale = d3.scaleLinear()
      .domain([d3.min(all) * 0.9, d3.max(all) * 1.1])
      .range([innerHeight, 0]);
    const xScale = d3.scaleBand().domain(["LOF", "GOF"]).range([0, plotWidth - 40]).padding(0.3);

    groupG.append("g").call(d3.axisLeft(yScale).ticks(5));
    groupG.append("text")
      .attr("transform", `rotate(-90)`)
      .attr("x", -innerHeight / 2)
      .attr("y", -40)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .text(key.toUpperCase());

    let xMidLOF, xMidGOF;

    ["LOF", "GOF"].forEach(group => {
      const values = data[key][group].slice().sort(d3.ascending);
      const q1 = d3.quantile(values, 0.25);
      const median = d3.quantile(values, 0.5);
      const q3 = d3.quantile(values, 0.75);
      const iqr = q3 - q1;
      const min = Math.max(d3.min(values), q1 - 1.5 * iqr);
      const max = Math.min(d3.max(values), q3 + 1.5 * iqr);
      const x = xScale(group);
      const boxWidth = xScale.bandwidth();
      const color = colorMap[group];
      const xMid = x + boxWidth / 2;
      if (group === "LOF") xMidLOF = xMid; else xMidGOF = xMid;

      const boxGroup = groupG.append("g").attr("class", `box-group-${group}`);

      const boxRect = boxGroup.append("rect")
        .attr("x", x)
        .attr("y", yScale(q3))
        .attr("width", boxWidth)
        .attr("height", yScale(q1) - yScale(q3))
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2);

      const medianLine = boxGroup.append("line")
        .attr("x1", x)
        .attr("x2", x + boxWidth)
        .attr("y1", yScale(median))
        .attr("y2", yScale(median))
        .attr("stroke", color)
        .attr("stroke-width", 2);

      const whiskers = [
        { x1: xMid, x2: xMid, y1: yScale(min), y2: yScale(q1) },
        { x1: xMid, x2: xMid, y1: yScale(q3), y2: yScale(max) },
        { x1: x + boxWidth / 4, x2: x + boxWidth * 3 / 4, y1: yScale(min), y2: yScale(min) },
        { x1: x + boxWidth / 4, x2: x + boxWidth * 3 / 4, y1: yScale(max), y2: yScale(max) },
      ];
      whiskers.forEach(w => {
        boxGroup.append("line")
          .attr("x1", w.x1)
          .attr("x2", w.x2)
          .attr("y1", w.y1)
          .attr("y2", w.y2)
          .attr("stroke", color)
          .attr("stroke-width", 1);
      });

      boxGroup.on("mouseover", (event) => {
        boxRect.attr("stroke-width", 3);
        medianLine.attr("stroke-width", 3);
        boxGroup.selectAll("line").attr("stroke-width", 3);
        const containerRect = container.getBoundingClientRect();
        tooltip.html(`
          <table>
            <tr><td>Group: </td><td>${group}</td></tr>
            <tr><td>#Variants: </td><td>${values.length}</td></tr>
            <tr><td>Q1: </td><td>${q1.toFixed(3)}</td></tr>
            <tr><td>Median: </td><td>${median.toFixed(3)}</td></tr>
            <tr><td>Q3: </td><td>${q3.toFixed(3)}</td></tr>
          </table>
        `)
          .style("left", event.clientX - containerRect.left + 10 + "px")
          .style("top", event.clientY - containerRect.top + "px")
          .style("display", "block");
      }).on("mouseout", () => {
        boxRect.attr("stroke-width", 2);
        medianLine.attr("stroke-width", 2);
        boxGroup.selectAll("line").attr("stroke-width", 1);
        tooltip.style("display", "none");
      });

      groupG.selectAll(`.dot-${group}`)
        .data(values)
        .enter()
        .append("circle")
        .attr("cx", () => xMid + (Math.random() - 0.5) * boxWidth * 0.6)
        .attr("cy", d => yScale(d))
        .attr("r", 2.5)
        .attr("fill", color)
        .attr("opacity", 0.7)
        .on("mouseover", function (event, d) {
          d3.select(this).attr("r", 5).attr("opacity", 1);
          const containerRect = container.getBoundingClientRect();
          tooltip.html(`${group}<br/>Value: ${d.toFixed(3)}`)
            .style("left", event.clientX - containerRect.left + 10 + "px")
            .style("top", event.clientY - containerRect.top + "px")
            .style("display", "block");
          event.stopPropagation();
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 2.5).attr("opacity", 0.7);
          tooltip.style("display", "none");
        });
    });

    // draw unified significance line
    const p = tTest(lof, gof);
    const yMark = globalMaxBoxY - 10;
    const pStr = `p=${p.toExponential(2)}`;
    groupG.append("line").attr("x1", xMidLOF).attr("x2", xMidGOF).attr("y1", yMark).attr("y2", yMark).attr("stroke", "black");
    groupG.append("line").attr("x1", xMidLOF).attr("x2", xMidLOF).attr("y1", yMark).attr("y2", yMark + 6).attr("stroke", "black");
    groupG.append("line").attr("x1", xMidGOF).attr("x2", xMidGOF).attr("y1", yMark).attr("y2", yMark + 6).attr("stroke", "black");
    groupG.append("text")
      .attr("x", (xMidLOF + xMidGOF) / 2)
      .attr("y", yMark - 8)
      .attr("text-anchor", "middle")
      .text(pStr)
      .style("font-size", "12px");
  });

  const legend = svgSel.append("g").attr("transform", `translate(${width / 2 - 150}, ${height - 30})`);
  [
    { label: "Functional neutral", key: "LOF", color: colorMap.LOF },
    { label: "Functional altered", key: "GOF", color: colorMap.GOF },
  ].forEach((item, i) => {
    const lg = legend.append("g").attr("transform", `translate(${i * 150}, 0)`);
    lg.append("rect").attr("width", 14).attr("height", 14).attr("fill", item.color);
    lg.append("text").attr("x", 20).attr("y", 12).text(item.label).style("font-size", "14px").style("font-family", "Arial");
  });
}

watch(() => data, () => drawChart(), { immediate: true });
onMounted(() => drawChart());
</script>

<template>
  <v-container class="d-flex justify-center" style="position: relative;">
    <v-card flat style="width: 100%; position: relative;">
      
      <v-card-text class="d-flex flex-column align-center" style="padding-top: 40px;">
        <h3 v-if="titleFlag" class="text-center mb-4" style="font-size: 14px; color:black;">
          Distribution of variant predictive scores among MAVE-defined functional groups
        </h3>
        <div style="width: 100%; position: relative;">
          <svg
            ref="svg"
            :height="height"
            :viewBox="`0 0 ${width} ${height}`"
            preserveAspectRatio="xMidYMid meet"
            style="width: 100%;"
          ></svg>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
svg {
  font-family: Arial, sans-serif;
}
.v-card-text {
  padding: 16px;
}
.custom-tooltip {
  position: absolute;
  background-color: white;
  pointer-events: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  padding: 10px;
  font-size: 14px;
  line-height: 1.4;
  z-index: 1000;
}
</style>

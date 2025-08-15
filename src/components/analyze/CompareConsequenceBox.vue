<template>
  <v-container class="d-flex justify-center" style="position: relative;">
    <v-card flat style="width: 100%; position: relative;">
      <v-card-text class="d-flex flex-column align-center" style="padding-top: 40px;">
        <h3 v-if="titleFlag" class="text-center mb-4" style="font-size: 14px; color:black;">
          Distribution of variant predictive scores among MAVE-defined functional groups
        </h3>
        <div ref="chartWrapper" style="position: relative; width: 100%; min-height: 400px;">
          <svg
            ref="svg"
            :height="height"
            :viewBox="`0 0 ${width} ${height}`"
            preserveAspectRatio="xMidYMid meet"
            style="width: 100%;"
          ></svg>
          <!-- Download Button -->
          <div class="download-wrapper" style="position: absolute; top: 5px; right: 5px;">
            <v-btn class="download-btn" variant="text" size="small">
              <v-icon>mdi-download</v-icon>
            </v-btn>
            <v-menu activator="parent">
              <v-list>
                <v-list-item @click="downloadSVG">
                  <v-list-item-title>Download SVG</v-list-item-title>
                </v-list-item>
                <v-list-item @click="downloadPDF">
                  <v-list-item-title>Download PDF</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

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
  yAxisTitleMap: { type: Object, default: () => ({}) },
});

const svg = ref(null);
const chartWrapper = ref(null);
const { data, width, height, yAxisTitleMap } = props;

// Validate yAxisTitleMap
if (typeof yAxisTitleMap !== 'object' || yAxisTitleMap === null) {
  console.warn("yAxisTitleMap prop is invalid; expected an object, received:", yAxisTitleMap);
}

function wilcoxRankSumTest(sample1, sample2) {
  try {
    // Validate samples
    if (!Array.isArray(sample1) || !Array.isArray(sample2)) {
      throw new Error("Samples must be arrays");
    }
    if (sample1.length === 0 || sample2.length === 0) {
      throw new Error(`Empty sample: Functional altered=${sample1.length}, Functionally normal=${sample2.length}`);
    }
    // Check for non-numeric values
    const invalid1 = sample1.some(v => !isFinite(v) || v === null || v === undefined);
    const invalid2 = sample2.some(v => !isFinite(v) || v === null || v === undefined);
    if (invalid1 || invalid2) {
      throw new Error(`Invalid values in samples: Functional altered=${invalid1}, Functionally normal=${invalid2}`);
    }
    // Log sample details for debugging
    console.log("Sample sizes:", { "Functional altered": sample1.length, "Functionally normal": sample2.length });
    console.log("Sample Functional altered:", sample1);
    console.log("Sample Functionally normal:", sample2);

    // Manual Wilcoxon rank-sum test
    const n1 = sample1.length;
    const n2 = sample2.length;
    // Combine samples with group labels
    const combined = sample1.map(v => ({ value: v, group: 'Functional altered' }))
      .concat(sample2.map(v => ({ value: v, group: 'Functionally normal' })));
    // Sort by value and assign ranks
    combined.sort((a, b) => a.value - b.value);
    let rank = 1;
    for (let i = 0; i < combined.length; i++) {
      let tieCount = 1;
      while (i + 1 < combined.length && combined[i + 1].value === combined[i].value) {
        tieCount++;
        i++;
      }
      const avgRank = rank + (tieCount - 1) / 2;
      for (let j = i - tieCount + 1; j <= i; j++) {
        combined[j].rank = avgRank;
      }
      rank += tieCount;
    }
    // Sum ranks for each group
    const rankSum1 = combined
      .filter(item => item.group === 'Functional altered')
      .reduce((sum, item) => sum + item.rank, 0);
    const rankSum2 = combined
      .filter(item => item.group === 'Functionally normal')
      .reduce((sum, item) => sum + item.rank, 0);
    // Compute U statistics
    const U1 = rankSum1 - (n1 * (n1 + 1)) / 2;
    const U2 = rankSum2 - (n2 * (n2 + 1)) / 2;
    const U = Math.min(U1, U2);
    // Normal approximation for p-value
    const mu = (n1 * n2) / 2;
    // Adjust for ties in variance calculation
    const tieGroups = [];
    let i = 0;
    while (i < combined.length) {
      let count = 1;
      while (i + 1 < combined.length && combined[i + 1].value === combined[i].value) {
        count++;
        i++;
      }
      if (count > 1) tieGroups.push(count);
      i++;
    }
    const tieCorrection = tieGroups.reduce((sum, t) => sum + (t * t * t - t) / 12, 0);
    const sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1 - tieCorrection / (n1 + n2))) / 12);
    const z = (U - mu) / sigma;
    // Two-tailed p-value using normal distribution
    const p = 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));
    console.log("Wilcoxon result:", { U1, U2, U, z, p });
    return p;
  } catch (e) {
    console.error("Wilcoxon rank-sum test failed:", e.message);
    return 1;
  }
}

function downloadSVG() {
  const svgEl = svg.value;
  if (!svgEl) {
    console.error('No SVG element found for download');
    return;
  }
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgEl);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'boxplot.svg';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF() {
  try {
    const container = chartWrapper.value;
    if (!container) {
      console.error('Chart container not found');
      return;
    }
    const downloadWrapper = container.querySelector('.download-wrapper');
    downloadWrapper.style.display = 'none';
    const { clientWidth: width, clientHeight: height } = container;
    html2canvas(container, { scale: 2 }).then(canvas => {
      downloadWrapper.style.display = '';
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save("boxplot.pdf");
    });
  } catch (error) {
    console.error('PDF download failed:', error);
  }
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

  const colorMap = { "Functional altered": "#1f77b4", "Functionally normal": "#ff7f0e" };

  // Step 1: compute global max box top Y
  let globalMaxBoxY = Infinity;
  keys.forEach(key => {
    const functionalAltered = data[key]?.["Functional altered"];
    const functionallyNormal = data[key]?.["Functionally normal"];
    if (!Array.isArray(functionalAltered) || !Array.isArray(functionallyNormal)) {
      console.warn(`Invalid data for key "${key}": Functional altered or Functionally normal is missing or not an array`, { functionalAltered, functionallyNormal });
      return;
    }
    const all = functionalAltered.concat(functionallyNormal);
    const yScale = d3.scaleLinear()
      .domain([d3.min(all) * 0.9, d3.max(all) * 1.1])
      .range([innerHeight, 0]);

    const q3FunctionalAltered = d3.quantile(functionalAltered.slice().sort(d3.ascending), 0.75);
    const q3FunctionallyNormal = d3.quantile(functionallyNormal.slice().sort(d3.ascending), 0.75);
    const iqrFunctionalAltered = q3FunctionalAltered - d3.quantile(functionalAltered.slice().sort(d3.ascending), 0.25);
    const iqrFunctionallyNormal = q3FunctionallyNormal - d3.quantile(functionallyNormal.slice().sort(d3.ascending), 0.25);

    const maxFunctionalAltered = Math.min(d3.max(functionalAltered), q3FunctionalAltered + 1.5 * iqrFunctionalAltered);
    const maxFunctionallyNormal = Math.min(d3.max(functionallyNormal), q3FunctionallyNormal + 1.5 * iqrFunctionallyNormal);

    const localBoxTopY = Math.min(yScale(maxFunctionalAltered), yScale(maxFunctionallyNormal));
    globalMaxBoxY = Math.min(globalMaxBoxY, localBoxTopY);
  });

  // Step 2: draw boxplots
  keys.forEach((key, idx) => {
    const functionalAltered = data[key]?.["Functional altered"];
    const functionallyNormal = data[key]?.["Functionally normal"];
    if (!Array.isArray(functionalAltered) || !Array.isArray(functionallyNormal)) {
      console.warn(`Skipping boxplot for key "${key}": Functional altered or Functionally normal is missing or not an array`, { functionalAltered, functionallyNormal });
      return;
    }

    const groupG = svgSel
      .append("g")
      .attr("transform", `translate(${margin.left + idx * plotWidth}, ${margin.top})`);

    const all = functionalAltered.concat(functionallyNormal);
    const yScale = d3.scaleLinear()
      .domain([d3.min(all) * 0.9, d3.max(all) * 1.1])
      .range([innerHeight, 0]);
    const xScale = d3.scaleBand()
      .domain(["Functionally normal", "Functional altered"])
      .range([0, plotWidth - 40])
      .padding(0.3);

    groupG.append("g").call(d3.axisLeft(yScale).ticks(5));
    const yAxisTitle = yAxisTitleMap[key] || key.toUpperCase();
    if (!yAxisTitleMap[key]) {
      console.warn(`No yAxisTitleMap entry for key "${key}"; using default "${key.toUpperCase()}"`);
    }
    groupG.append("text")
      .attr("transform", `rotate(-90)`)
      .attr("x", -innerHeight / 2)
      .attr("y", -40)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .text(yAxisTitle);

    let xMidFunctionallyNormal, xMidFunctionalAltered;

    ["Functionally normal", "Functional altered"].forEach(group => {
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
      if (group === "Functionally normal") xMidFunctionallyNormal = xMid; else xMidFunctionalAltered = xMid;

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

      boxGroup.selectAll(`.dot-${group}`)
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

    // Draw unified significance line
    const p = wilcoxRankSumTest(functionalAltered, functionallyNormal);
    console.log(`P-value for ${key}:`, p.toExponential(2));
    const yMark = globalMaxBoxY - 10;
    const pStr = `p=${p.toExponential(2)}`;
    groupG.append("line")
      .attr("x1", xMidFunctionallyNormal)
      .attr("x2", xMidFunctionalAltered)
      .attr("y1", yMark)
      .attr("y2", yMark)
      .attr("stroke", "black");
    groupG.append("line")
      .attr("x1", xMidFunctionallyNormal)
      .attr("x2", xMidFunctionallyNormal)
      .attr("y1", yMark)
      .attr("y2", yMark + 6)
      .attr("stroke", "black");
    groupG.append("line")
      .attr("x1", xMidFunctionalAltered)
      .attr("x2", xMidFunctionalAltered)
      .attr("y1", yMark)
      .attr("y2", yMark + 6)
      .attr("stroke", "black");
    groupG.append("text")
      .attr("x", (xMidFunctionallyNormal + xMidFunctionalAltered) / 2)
      .attr("y", yMark - 8)
      .attr("text-anchor", "middle")
      .text(pStr)
      .style("font-size", "12px");
  });

  const legend = svgSel.append("g").attr("transform", `translate(${width / 2 - 200}, ${height - 20})`);
  [
    { label: "Functionally normal", key: "Functionally normal", color: colorMap["Functionally normal"] },
    { label: "Functional altered", key: "Functional altered", color: colorMap["Functional altered"] },
  ].forEach((item, i) => {
    const lg = legend.append("g").attr("transform", `translate(${i * 200}, 0)`);
    lg.append("rect").attr("width", 14).attr("height", 14).attr("fill", item.color);
    lg.append("text").attr("x", 20).attr("y", 12).text(item.label).style("font-size", "14px").style("font-family", "Arial");
  });
}

watch(() => data, () => drawChart(), { immediate: true, deep: true });
watch(() => yAxisTitleMap, () => drawChart(), { deep: true });
onMounted(() => drawChart());
</script>

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
.download-wrapper {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 10;
}
.download-btn {
  font-size: 12px;
  text-transform: none;
  color: #333333;
}
</style>
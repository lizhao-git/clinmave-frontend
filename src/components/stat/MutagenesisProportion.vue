<template>
      <v-container>
        <v-row>
          <v-col>
            <div id="chart-container" style="position: relative; width: 100%; max-width: 600px; margin: auto;">
              <h2>The proportion of datasets with different mutagenesis strategies</h2>
              <svg id="donut-chart"></svg>
              <v-tooltip v-model="tooltip.visible" :style="tooltip.style" color="black">
                {{ tooltip.content }}
              </v-tooltip>
              <div style="position: absolute; top: 0; right: 0;">
                <v-btn icon small @mouseenter="showCard = true" @mouseleave="showCard = false">
                  <v-icon size="20">mdi-download</v-icon>
                </v-btn>
                <v-card
                  v-show="showCard"
                  @mouseenter="showCard = true"
                  @mouseleave="showCard = false"
                  style="position: absolute; top: 30px; right: 0; z-index: 10;"
                >
                  <v-btn text small @click="downloadSVG">Download SVG</v-btn>
                  <v-btn text small @click="downloadPDF">Download PDF</v-btn>
                </v-card>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const tooltip = ref({
  visible: false,
  content: '',
  style: {}
});

const showCard = ref(false);

const chartData = ref([
  { category: 'Base editing', value: 1531 },
  { category: 'Mutagenic PCR', value: 15 },
  { category: 'Oligonucleotide synthesis', value: 438 },
  { category: 'Prime editing', value: 7 },
  { category: 'Saturation genome editing', value: 7 }
]);

const drawChart = () => {
  const width = 500;
  const height = 400;
  const padding = { top: 20, right: 20, bottom: 80, left: 20 }; // Adjusted bottom padding for compact legend
  const radius = Math.min(width, height - padding.bottom) / 2 - 60;
  const total = d3.sum(chartData.value, d => d.value);

  const svg = d3.select('#donut-chart')
    .attr('width', width + padding.left + padding.right)
    .attr('height', height + padding.top + padding.bottom)
    .append('g')
    .attr('transform', `translate(${(width + padding.left + padding.right) / 2}, ${(height + padding.top + padding.bottom - padding.bottom) / 2})`);

  const arc = d3.arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius);

  const pie = d3.pie()
    .sort(null)
    .value(d => d.value);

  const arcs = svg.selectAll('.arc')
    .data(pie(chartData.value))
    .enter()
    .append('g')
    .attr('class', 'arc');

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => d3.schemeCategory10[i % 10])
    .on('mouseover', (event, d) => {
      const percentage = ((d.data.value / total) * 100).toFixed(2);
      tooltip.value.content = `${d.data.category}: ${d.data.value} (${percentage}%)`;
      tooltip.value.visible = true;
      tooltip.value.style = {
        left: `${event.pageX + 10}px`,
        top: `${event.pageY + 10}px`
      };
    })
    .on('mouseout', () => {
      tooltip.value.visible = false;
    });

  // Add legend at the bottom in multiple rows
  const itemsPerRow = 3; // Three items per row for five categories
  const legendWidth = width / itemsPerRow;
  const legend = svg.append('g')
    .attr('transform', `translate(-${width / 2}, ${radius + 30})`); // Centered at bottom

  const legendItems = legend.selectAll('.legend')
    .data(chartData.value)
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', (d, i) => {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      return `translate(${col * legendWidth}, ${row * 20})`; // Compact row spacing
    });

  legendItems.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 14)
    .attr('height', 14)
    .attr('fill', (d, i) => d3.schemeCategory10[i % 10]);

  legendItems.append('text')
    .attr('x', 20)
    .attr('y', 7)
    .attr('dy', '.35em')
    .style('font-size', '11px')
    .text(d => d.category);
};

const downloadSVG = () => {
  const svg = document.getElementById('donut-chart');
  const serializer = new XMLSerializer();
  const source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(svg);
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = 'donut-chart.svg';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};

const downloadPDF = () => {
  html2canvas(document.getElementById('chart-container')).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10, 180, 120);
    pdf.save('donut-chart.pdf');
  });
};

onMounted(() => {
  drawChart();
});
</script>

<style scoped>
#tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px;
  border-radius: 4px;
  pointer-events: none;
  font-size: 12px;
}
</style>
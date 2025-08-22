<template>
  <v-main>
    <v-container fluid class="mt-4">
      <v-row>
        <v-col cols="12">
          <v-card flat>
            <v-breadcrumbs :items="breadcrumbs">
              <template v-slot:item="{ item }">
                <v-breadcrumbs-item
                  :to="item.href"
                  :class="{ 'text-primary': item.href }"
                  link
                >
                  <span>{{ item.title }}</span>
                </v-breadcrumbs-item>
              </template>
            </v-breadcrumbs>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <!-- Sidebar Column -->
        <v-col cols="12" md="2" class="sidebar-col">
          <v-list nav v-model:opened="openGroups">
            <template v-for="(item, index) in sidebarItems" :key="index">
              <v-list-group :value="item.value">
                <template v-slot:activator="{ props }">
                  <v-list-item
                    v-bind="props"
                    :title="item.title"
                    :value="item.value"
                    :active="activeSection === item.value"
                    @click="handleMainTitleClick(item.value)"
                  ></v-list-item>
                </template>
                <v-list-item
                  v-for="(subItem, subIndex) in item.subItems"
                  :key="subIndex"
                  :title="subItem.title"
                  :value="subItem.value"
                  :active="activeSection === subItem.value"
                  class="pl-6"
                  @click="scrollToSubSection(subItem.value)"
                ></v-list-item>
              </v-list-group>
              <v-divider v-if="index < sidebarItems.length - 1" class="my-1"></v-divider>
            </template>
          </v-list>
        </v-col>

        <!-- Main Content Column -->
        <v-col cols="12" md="10">
          <v-alert
            border="end"
            variant="outlined"
            border-color="error"
            class="mb-4"
            id="introduction"
          >
            <h1 class="mt-4 mb-2">Introduction</h1>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinMAVE is a curated database for the clinical application of data from multiplexed assays of variant effect (MAVEs). 
              ClinMAVE bridges the gap between functional effect of variants and their clinical impact by systematically curating MAVE datasets and rigorously transforming the experimental assessment into strength of evidence supporting the pathogenicity classification. 
              ClinMAVE also integrates available variant annotations from public repositories (e.g., <a href="https://www.ncbi.nlm.nih.gov/clinvar/" target="_blank">ClinVar</a> , <a href="https://gnomad.broadinstitute.org/" target="_blank">gnomAD</a>, <a href="https://www.cancer.gov/ccg/research/genome-sequencing/tcga" target="_blank">TCGA</a>) and provides a user-friendly interface to support visualization and analysis modules for further exploration.
            </p>
          </v-alert>

          <v-alert
            border="end"
            variant="outlined"
            border-color="success"
            class="mb-4"
            id="data-collection"
          >
            <h1 class="mt-4 mb-2">Data Collection and Processing</h1>
            <h2 class="mt-2 mb-1" id="data-collection-1">1. Data collection</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinMAVE compiles a comprehensive collection of Multiplexed Assays of Variant Effect (MAVE) studies, encompassing both deep mutational scanning (DMS) and CRISPR-based genome editing techniques.
            </p>
            <h3 class="mt-2 mb-1" id="data-collection-1-1">1.1 Deep mutation scanning MAVE</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              We collected deep mutational scanning data primarily from <a href="https://mavedb.org/" target="_blank">MaveDB</a> , a centralized MAVE repository that rigorously mapped raw MAVE variants to human reference sequence (GRCh38) while preserving the original sequence context. Notably, raw protein-level variants are uniformly mapped to genomic DNA coordinates and deposited in <a href="https://ftp.ensembl.org/pub/current_variation/MaveDB/" target="_blank">Ensembl</a> , enabling the standardized genomic annotation. To ensure data quality and relevance, only datasets with more than 100 variants and an associated peer-reviewed publication or publicly available preprint are retained. This filtering guarantees that included studies meet a minimum threshold of experimental scale, scientific rigor, and transparency.
            </p>
            <h3 class="mt-2 mb-1" id="data-collection-1-2">1.2 CRISPR-based genome editing MAVE</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              For CRISPR-based genome editing datasets, we collect studies primarily through searches on PubMed using the keywords 'high-throughput screening' AND ('base editing', 'prime editing', 'saturation genome editing'). Only datasets that report more than 100 variants are retained to ensure adequate scale. For base-editing studies, the reported protein- or transcript-level changes are mapped to genomic DNA coordinates, rather than relying on guide RNA target sites. For Prime editing and Saturated Genome Editing (SGE) studies, the DNA-level coordinates are directly extracted from the supplementary materials provided with the publications.
            </p>
            <h2 class="mt-2 mb-1" id="data-collection-2">2. Processing</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinMAVE employs a unified variant processing suite designed to standardize and enrich variant-level data across all studies. This suite integrates two key components:
            </p>
            <h3 class="mt-2 mb-1" id="data-collection-2-1">2.1 Variant annotation</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              Variants are mapped to genomic DNA coordinates and annotated using the MANE (Matched Annotation from NCBI and EMBL-EBI) transcript to ensure clinical consistency. Each variant is then formatted according to HGVS (Human Genome Variation Society) nomenclature for structured and interoperable representation.
            </p>
            <h3 class="mt-2 mb-1" id="data-collection-2-2">2.2 External annotation integration</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              To provide biological and clinical context, the pipeline incorporates external annotations from clinically relevant resources, including:
              <ul>
                <li>(1) <a href="https://www.ncbi.nlm.nih.gov/clinvar/" target="_blank">ClinVar</a>: clinical significance interpretations;</li>
                <li>(2) <a href="https://gnomad.broadinstitute.org/" target="_blank">gnomAD</a>: population allele frequencies;</li>
                <li>(3) <a href="https://www.cancer.gov/ccg/research/genome-sequencing/tcga" target="_blank">TCGA</a>: cancer somatic variant frequencies retrieved from <a href="https://www.cbioportal.org/" target="_blank">Cbioportal</a>;</li>
                <li>(4) In silico predictors: scores from variant effect prediction tools such as <a href="https://cadd.gs.washington.edu/" target="_blank">CADD</a>, <a href="https://alphamissense.hegelab.org/" target="_blank">AlphaMissense</a>, and <a href="https://sites.google.com/site/revelgenomics/" target="_blank">REVEL</a>;</li>
                <li>(5) <a href="https://www.ncbi.nlm.nih.gov/snp/" target="_blank">dbSNP</a>: standardized reference IDs that facilitate cross-referencing with external genomic databases.</li>
              </ul>
            </p>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              In addition, in silico predictor scores were translated into ACMG-style pathogenicity classifications based on the recommended thresholds provided by <a href="https://varsome.com/about/resources/germline-implementation/#insilicopredictions" target="_blank">VarSome</a>.
            </p>
            <v-data-table
              :headers="InsilicoCutoffHeader"
              :items="InsilicoCutoffItems"
              :disable-sort="true"
              class="my-5"
              hide-default-footer
            ></v-data-table>
            <h2 class="mt-2 mb-1" id="data-collection-3">3. Software and external resources</h2>
            <v-data-table
              :headers="SoftwareHeader"
              :items="SoftwareItems"
              :disable-sort="true"
              hide-default-footer
              class="my-5"
            ></v-data-table>
          </v-alert>

          <v-alert
            border="end"
            variant="outlined"
            border-color="primary"
            class="mb-4"
            id="data-curation"
          >
            <h1 class="mt-4 mb-2">Data Curation</h1>
            <h2 class="mt-2 mb-1" id="data-curation-1">1. Curation model</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              We curated both quantitative information (e.g., score thresholds used to define functional classification) and qualitative information (e.g., experimental model, phenotype) from published MAVE studies. To standardize the interpretation of functional effects across diverse assays and reporting formats, we applied a structured curation model, as detailed below:
            </p>
            <v-data-table
              :headers="CurationModelHeader"
              :items="CurationModelItems"
              :disable-sort="true"
              hide-default-footer
              class="my-5"
            >
              <template v-slot:item.value="{ item }">
                <div class="chip-container">
                  <v-chip
                    v-for="(func, subIndex) in item.value.split(',')"
                    :key="subIndex"
                    :color="getChipColor()"
                    text-color="white"
                    size="small"
                    variant="tonal"
                    class="mr-1"
                  >
                    {{ func.trim() }}
                  </v-chip>
                </div>
              </template>
            </v-data-table>
            <h2 class="mt-2 mb-1" id="data-curation-2">2. MAVE quantitative calibration</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinMAVE organizes functional data to support variant interpretation using both assay-level and individual variant-level metrics, aligning with ACMG/AMP recommendations for evaluating experimental evidence (Pathogenic Strong criterion 3 [PS3]). To compute this, we define the control sets as follows:
              <ul>
                <li>ClinVar-classified Pathogenic/Likely Pathogenic (P/LP) variants as true positives (TPs); </li>
                <li>ClinVar-classified Benign/Likely Benign (B/LB) variants as true negatives (TNs); </li>
              </ul>
            </p>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              To ensure statistical reliability, we only conduct evidence strength evaluations for datasets that meet the following minimum requirements:
              <ul>
                <li>A total of at least 11 benchmark variants (TPs + TNs ≥ 11); </li>
                <li>At least 4 TPs and 4 TNs, respectively; </li>
              </ul>
            </p>
            <h3 class="mt-2 mb-1" id="data-curation-2-1">2.1 Assay-level strength of evidence:</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              The ClinGen Sequence Variant Interpretation (SVI) Working Group (2022) introduced the use of the Odds of Pathogenicity (OddsPath) to quantify the strength of functional evidence. This approach enables a standardized, quantitative mapping of functional assay results to ACMG/AMP evidence strength levels.
            </p>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              OddsPath is calculated using two ratios:
              <ul>
                <li>P1: The proportion of pathogenic variants (TPs) in the control sets (TPs + TNs);</li>
                <li>•	P2: The proportion of pathogenic variants (TPs) with abnormal functionality (including both LoF and GoF) out of all abnormal variants in control sets.</li>
              </ul>
            </p>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              The OddsPath formula is defined as:
            </p>
            <div v-mathjax>
              $$ \text{OddsPath} = \frac{P_2}{P_1} \cdot \frac{1 - P_1}{1 - P_2} $$
            </div>
            <h3 class="mt-2 mb-1" id="data-curation-2-2">2.2 Per-variant level strength of evidence</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinVar assessed the variant-level strength of pathogenicity under the assumptions that (1) ClinVar-classified Pathogenic/Likely Pathogenic (P/LP) variants (TPs) tend to exhibit greater functional abnormality than B/LB variants (TNs), and (2) the magnitude of functional abnormality can therefore serve as a proxy for pathogenicity. To quantify the degree of pathogenicity for each variant i, ClinVar calculated the difference of its mahalanobis distance between TP and TN variants distribution, denoted as Dist_score i. The distance score was further normalized using hyperbolic tangent function (tanh) with the following formula:
              <div v-mathjax>
                $$ \tanh(x) = \frac{e^x - e^{-x}}{e^x + e^{-x}} $$
              </div>
              <!-- <ul>
                <li>+1 indicates high similarity to pathogenic variants (strong functional abnormality)</li>
                <li>–1 indicates high similarity to benign variants (normal function)</li>
              </ul> -->
            </p>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              The tanh normalization maps the raw Dist_score i into [-1, 1] scale, where values closer to +1 indicate high similarity to pathogenic variants (i.e., strong functional abnormality). MAVE variants classified as functionally abnormal are further assigned levels of evidence strength based on the tanh-normalized distance score:
              <ul>
                <li>Strong if tanh(Dist_score) ≥ 0.95</li>
                <li>Moderate if tanh(Dist_score) ≥ 0.5</li>
                <li>Weak if tanh(Dist_score) < 0.5</li>
              </ul>
            </p>
          </v-alert>

          <v-alert
            border="end"
            variant="outlined"
            border-color="warning"
            class="mb-4"
            id="database-usage"
          >
            <h1 class="mt-4 mb-2">Database Usage</h1>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              The ClinMAVE database provides an interactive platform for browsing, searching, visualizing, analyzing and downloading curated functional evidence from MAVE. The portal is organized into five core modules.
            </p>
            <h2 class="mt-2 mb-1" id="database-usage-2">1. Search Module</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinMAVE offers robust search capabilities to help users efficiently locate relevant functional variant data across genes, variants, and MAVE datasets. Accessible from the homepage, the quick search bar supports intuitive, keyword-based searches. Users can search using:
              <ul>
                <li>Gene symbol (e.g., BRCA1, TP53)</li>
                <li>Gene ID (e.g., ENSG00000139618)</li>
                <li>HGVS-formatted variant notation (e.g., NM_000551.4(VHL):c.263G>A (p.Trp88Ter); BAP1:c.535C>T)</li>
                <li>Dataset ID (e.g., dataset0171;dataset0104)</li>
              </ul>
            </p>
            <h2 class="mt-2 mb-1" id="database-usage-1">2. Browser module</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              The ClinMAVE Browser module offers a flexible, user-friendly interface for navigating curated MAVE datasets. Users can explore data through multiple entry points—ranging from gene- and technique-level overviews to detailed variant-level records—accessible either via the homepage statistics interface or through the dedicated browser bar. The browser provides two main categories of information:
              <ul>
                <li>MAVE Functional Annotation - comprehensive variant-level annotation that integrates cross-assay summaries, assay-specific functional characterization, and supporting validation evidence.</li>
                <li>MAVE Calibration - standardized calibration metrics at two levels:
                  <ul>
                    <li>Assay-level: OddsPath statistics for quantitative assessment of functional assay performance.</li>
                    <li>Variant-level: Functional intensity tiers that classify variants according to the strength and abnormality of functional impact.</li>
                  </ul>
                </li>
              </ul>
            </p>
            <h2 class="mt-2 mb-1" id="database-usage-3">3. Visualization module</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinMAVE provides intuitive and informative visualizations to help users explore functional variant data in both dataset-specific and gene-centric contexts.
            </p>
            <h3 class="mt-2 mb-1" id="database-usage-3-1">3.1 Visualization by Dataset</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              Each MAVE dataset includes interactive plots that integrate functional scores with key biological annotations:
              <ul>
                <li>Interactive lollipop plots show the positional distribution of MAVE functional scores and functional classifications overlaid with domain annotations;</li>
                <li>MAVE score distribution plots, color-coded by molecular consequence (e.g., missense, nonsense, synonymous);</li>
                <li>Scatterplots or violin plots illustrate how variant functional scores correlate with population allele frequency from gnomAD.</li>
              </ul>
            </p>
            <h3 class="mt-2 mb-1" id="database-usage-3-2">3.2 Visualization by Gene</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinMAVE offers comprehensive gene-centric visualizations that map variant effects across the full length of a protein, with integrated domain annotations and support for cross-dataset comparison.
            </p>
            <h2 class="mt-2 mb-1" id="database-usage-4">4. Analysis module</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              The analysis module in ClinMAVE provides tools for evaluating how well functional scores from MAVE experiments align with computational predictions and clinical classifications. This supports benchmarking of variant effect predictors and assessment of functional assay reliability.
            </p>
            <h3 class="mt-2 mb-1" id="database-usage-4-1">4.1 MAVE score vs. in-silico predictors</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              Users can compare MAVE-derived functional scores with widely used in silico predictors. The statistical significance is determined by Wilcoxon test.
            </p>
            <h3 class="mt-2 mb-1" id="database-usage-4-2">4.2 ROC analysis</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinMAVE enables quantitative benchmarking of functional assays by measuring their ability to distinguish clinically classified variants. Receiver Operating Characteristic (ROC) curves are generated to evaluate the ability of MAVE scores to separate (Likely-) pathogenic from (Likely-) benign variants. Dataset with at least 10 benign and pathogenic variants were included in this analysis.
            </p>
            <h2 class="mt-2 mb-1" id="database-usage-4">5. Download module</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              The ClinMAVE download module enables users to obtain curated MAVE metadata as well as detailed variant-level functional classifications.
            </p>
          </v-alert>

          <v-alert
            border="end"
            variant="outlined"
            border-color="teal"
            class="mb-4"
            id="tabular-summary"
          >
            <h1 class="mt-4 mb-2">ClinMAVE Tabular Summary</h1>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              This concise summary highlights how ClinMAVE addresses the critical gaps of MAVE and contributes to improved clinical variant interpretation.
            </p>
            <v-data-table
              :headers="TabularHeader"
              :items="TabularItems"
              :disable-sort="true"
              hide-default-footer
              class="my-5"
            ></v-data-table>
          </v-alert>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<style>
  /* Striped rows */
  .v-data-table__tr:nth-child(even) {
    background-color: #f5f5f5;
  }

  /* Sidebar styling */
  .sidebar-col {
    position: sticky;
    top: 64px; /* Adjust based on your header height */
    height: calc(100vh - 64px); /* Prevent overlap with header and keep within viewport */
    overflow-y: auto; /* Allow scrolling within the sidebar if content overflows */
    background-color: #fafafa;
    border-right: 1px solid #e0e0e0;
  }

  .v-list {
    background-color: transparent;
  }

  .v-list-item--active {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .v-list-item {
    transition: background-color 0.2s ease;
  }

  .v-divider {
    border-color: #e0e0e0;
    border-width: 2px; /* Increased divider width */
  }
</style>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import 'vxe-pc-ui/lib/style.css';
  import 'vxe-table/lib/style.css';

  const breadcrumbs = ref([
    {
      title: 'Home',
      icon: 'mdi-home',
      href: '/',
      disabled: false,
    },
    {
      title: 'Documentation',
      disabled: false,
    },
  ]);

  const sidebarItems = ref([
    {
      title: 'Introduction',
      value: 'introduction',
      subItems: [],
    },
    {
      title: 'Data Collection and Processing',
      value: 'data-collection',
      subItems: [
        { title: '1. Data collection', value: 'data-collection-1' },
        { title: '1.1 Deep mutation scanning MAVE', value: 'data-collection-1-1' },
        { title: '1.2 CRISPR-based genome editing MAVE', value: 'data-collection-1-2' },
        { title: '2. Processing', value: 'data-collection-2' },
        { title: '2.1 Genomic annotation', value: 'data-collection-2-1' },
        { title: '2.2 External Annotation Integration', value: 'data-collection-2-2' },
        { title: '3. Software and external resources', value: 'data-collection-3' },
      ],
    },
    {
      title: 'Data Curation',
      value: 'data-curation',
      subItems: [
        { title: '1. Curation model', value: 'data-curation-1' },
        { title: '2. MAVE quantitative calibration', value: 'data-curation-2' },
        { title: '2.1 Dataset-level strength of evidence', value: 'data-curation-2-1' },
        { title: '2.2 Per-variant level strength of evidence', value: 'data-curation-2-2' },
      ],
    },
    {
      title: 'Database Usage',
      value: 'database-usage',
      subItems: [
        { title: '1. Browse module', value: 'database-usage-1' },
        { title: '2. Search Module', value: 'database-usage-2' },
        { title: '3. Visualization module', value: 'database-usage-3' },
        { title: '3.1 Visualization by Dataset', value: 'database-usage-3-1' },
        { title: '3.2 Visualization by Gene', value: 'database-usage-3-2' },
        { title: '4. Analysis module', value: 'database-usage-4' },
        { title: '4.1 MAVE score vs. In-silico Predictors', value: 'database-usage-4-1' },
        { title: '4.2 Clinical classification analysis', value: 'database-usage-4-2' },
      ],
    },
    {
      title: 'Tabular Summary',
      value: 'tabular-summary',
      subItems: [],
    },
  ]);

  const openGroups = ref(['introduction']); // Initially open the first section
  const activeSection = ref('introduction');
  const isManualClick = ref(false); // Track if last action was a manual click

  const handleMainTitleClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      activeSection.value = sectionId;
      isManualClick.value = true; // Mark as manual click
    }
  };

  const scrollToSubSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update active section and open only the parent group
      const parentSection = sidebarItems.value.find(item => 
        item.subItems.some(sub => sub.value === sectionId)
      );
      if (parentSection) {
        activeSection.value = sectionId;
        openGroups.value = [parentSection.value];
        isManualClick.value = false; // Reset manual click flag
      }
    }
  };

  const updateActiveSection = () => {
    if (isManualClick.value) return; // Skip scroll updates if last action was a manual click

    const sections = sidebarItems.value.flatMap(item => [
      { id: item.value, parent: item.value },
      ...item.subItems.map(subItem => ({ id: subItem.value, parent: item.value })),
    ]);

    let currentSection = sections[0].id;
    let currentParent = sections[0].parent;

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= 100 && rect.top > -element.offsetHeight) {
          currentSection = section.id;
          currentParent = section.parent;
        }
      }
    }

    if (activeSection.value !== currentSection) {
      activeSection.value = currentSection;
      openGroups.value = [currentParent]; // Only keep the current parent open
    }
  };

  onMounted(() => {
    window.addEventListener('scroll', updateActiveSection);
    updateActiveSection();
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', updateActiveSection);
  });

  const InsilicoCutoffHeader = [
    { key: 'software', title: 'Software' },
    { key: 'bstr', title: 'Benign Strong' },
    { key: 'bm', title: 'Benign Moderate' },
    { key: 'bsup', title: 'Beingn Supporting' },
    { key: 'vus', title: 'VUS' },
    { key: 'psup', title: 'Pathogenic Supporting' },
    { key: 'pmod', title: 'Pathogenic Moderate' },
    { key: 'pstr', title: 'Pathogenic Strong' },
  ];

  const InsilicoCutoffItems = [
    {
      software: 'AlphaMissense',
      bstr: '<= 0.0853',
      bm: '<= 0.166',
      bsup: '<= 0.316',
      vus: '/',
      psup: '>= 0.787',
      pmod: '>= 0.956',
      pstr: '>= 0.994',
    },
    {
      software: 'CADD',
      bstr: '<= 16.1',
      bm: '<= 22',
      bsup: '<= 23.2',
      vus: '/',
      psup: '>= 25.6',
      pmod: '>= 28.8',
      pstr: '>= 33',
    },
    {
      software: 'EVE',
      bstr: '/',
      bm: '<= 0.162',
      bsup: '<= 0.255',
      vus: '/',
      psup: '>= 0.603',
      pmod: '>= 0.723',
      pstr: '>= 0.905',
    },
    {
      software: 'MetaSVM',
      bstr: '/',
      bm: '<= -0.677',
      bsup: '<= -0.286',
      vus: '/',
      psup: '>= 0.794',
      pmod: '>= 0.901',
      pstr: '/',
    },
    {
      software: 'REVEL',
      bstr: '<= 0.133',
      bm: '<= 0.351',
      bsup: '<= 0.471',
      vus: '/',
      psup: '>= 0.685',
      pmod: '>= 0.798',
      pstr: '>= 0.946',
    },
    {
      software: 'Polyphen2',
      bstr: '<= -1.04',
      bm: '<= 1.08',
      bsup: '<= 3.58',
      vus: '/',
      psup: '>= 7.52',
      pmod: '>= 9.88',
      pstr: '/',
    },
  ];

  const SoftwareHeader = [
    { key: 'software', title: 'Software/Database' },
    { key: 'version', title: 'Version' },
  ];

  const SoftwareItems = [
    { software: 'VEP', version: 'V114.2' },
    // { software: 'ANNOVAR', version: 'V2.3.0' },
    { software: 'MANE', version: 'GRCh38 v1.4' },
    { software: 'dbSNP', version: 'dbSNP156' },
    { software: 'gnomAD', version: 'V4.1' },
    { software: 'AlphaMissense', version: 'dbNSFP v4.7a' },
    { software: 'CADD', version: 'dbNSFP v4.7a' },
    { software: 'MetaSVM', version: 'dbNSFP v4.7a' },
    { software: 'REVEL', version: 'dbNSFP v4.7a' },
    { software: 'Polyphen2', version: 'dbNSFP v4.7a' },
    { software: 'Cbioportal', version: 'Accessed on 2025/05/22' },
    { software: 'Varsome', version: 'Accessed on 2025/05/12' },
    // { software: 'EVE', version: 'dbNSFP v4.7a' },
  ];

  const CurationModelHeader = [
    { key: 'datatype', title: 'Data type' },
    { key: 'description', title: 'Description' },
    { key: 'value', title: 'Value' },
  ];

  const CurationModelItems = [
    {
      datatype: 'Gene',
      description: 'Gene identifier',
      value: 'e.g. BRCA1',
    },
    {
      datatype: 'Functional score',
      description: 'Quantification of the functional impact of a specific genetic variant',
      value: 'e.g. 0.34',
    },
    {
      datatype: 'Functional classification',
      description: 'Controlled vocabulary',
      value: 'Loss-of-function, Gain-of-function, Functionally normal',
    },
    {
      datatype: 'MAVE technique',
      description: 'Controlled vocabulary',
      value: 'Deep mutational scanning, CRISPR-based genome editing',
    },
    {
      datatype: 'Mutagenesis strategy',
      description: 'Controlled vocabulary',
      value: 'Prime editing, Base editing, Saturation genome editing, Oligonucleotide synthesis, Mutagenic PCR',
    },
    // {
    //   datatype: 'Functional assay',
    //   description: 'Controlled vocabulary',
    //   value: 'Protein abundance and stability,Protein binding,Specialized molecular function,Cellular fitness',
    // },
    {
      datatype: 'Experiment model',
      description: 'The cell types used to perform MAVE',
      value: 'e.g. HAP1',
    },
    {
      datatype: 'Phenotype',
      description: 'The specific biological outcome measured by a MAVE experiment',
      value: 'e.g. MLH1 mediated mismatch repair function',
    },
    {
      datatype: 'Direction of Effect',
      description: 'How a variant alters the measured phenotype relative to the wild-type or reference allele',
      value: 'e.g. diminished, enhanced',
    },
  ];

  const getChipColor = () => {
    const colors = ['green', 'blue', 'purple', 'orange', 'teal', 'pink', 'cyan', 'indigo'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const TabularHeader = [
    { key: 'gap', title: 'Gap In MAVE Field' },
    { key: 'how', title: 'How ClinMAVE Improves' },
    { key: 'contribution', title: 'The Contribution of ClinMAVE on Clinical Application' },
  ];

  const TabularItems = [
    {
      gap: 'Lack of standardized variant-level annotations',
      how: 'Provides DNA-level annotations and HGVS nomenclature',
      contribution: 'Enables variant look-up and cross-referencing with clinically relevant resources and databases.',
    },
    {
      gap: 'Missing metadata about assay validation, controls, and reproducibility',
      how: 'Includes structured metadata such as assay system, validation status, strength of effect, and reproducibility',
      contribution: 'Supports functional annotation and clinical evidence grading in alignment with ClinGen SVI guidance',
    },
    {
      gap: 'Lack of harmonization across studies',
      how: 'Curates studies using a unified schema, applying consistent criteria for variant effect strength',
      contribution: 'Facilitates cross-study comparison and evidence aggregation',
    },
    {
      gap: 'Poor data discoverability and inconsistent nomenclature',
      how: 'Standardizes gene/variant identifiers, links to ClinVar, gnomAD, and other clinical databases',
      contribution: 'Improves interoperability and searchability for clinicians and labs',
    },
    {
      gap: 'Limited accessibility for clinical users',
      how: 'Offers user-friendly query tools, interactive visualization, and ACMG-ready evidence summaries',
      contribution: 'Makes functional data directly interpretable and usable in clinical variant assessment',
    },
  ];
</script>
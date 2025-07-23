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
              ClinMAVE also integrates available variant annotations from public repositories (e.g., <a href="https://www.ncbi.nlm.nih.gov/clinvar" target="_blank">ClinVar</a>, <a href="https://gnomad.broadinstitute.org/" target="_blank">gnomAD</a>, <a href="" target="_blank">TCGA</a>) and provides a user-friendly interface to support visualization and analysis modules for further exploration. 
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
              ClinMAVE compiles a comprehensive collection of Multiplexed Assays of Variant Effect (MAVE) studies, encompassing both deep mutational scanning and CRISPR-based genome editing techniques.
            </p>
            <h3 class="mt-2 mb-1" id="data-collection-1-1">1.1 Deep mutation scanning MAVE</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              We collected deep mutational scanning data primarily from MAVEdb, a centralized repository of multiplexed functional assay results. Notably, raw protein-level variants are uniformly mapped to genomic DNA coordinates by Ensembl, enabling standardized genomic annotation for downstream analyses. To ensure data quality and relevance, only datasets with more than 100 variants and an associated peer-reviewed publication or publicly available preprint are retained. This filtering guarantees that included studies meet a minimum threshold of experimental scale, scientific rigor, and transparency.
            </p>
            <h3 class="mt-2 mb-1" id="data-collection-1-2">1.2 CRISPR-based genome editing MAVE</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              For CRISPR-based genome editing datasets, we collect studies primarily through searches in PubMed. Only datasets that report more than 100 variants are retained to ensure adequate scale. For base-editing studies, the reported protein- or transcript-level changes are mapped to genomic DNA coordinates, rather than relying on guide RNA target sites. For Prime editing and Saturated Genome Editing (SGE) studies, the DNA-level coordinates are directly extracted from the supplementary materials provided with the publications.
            </p>
            <h2 class="mt-2 mb-1" id="data-collection-2">2. Processing</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinMAVE employs a unified variant processing suite designed to standardize and enrich variant-level data across all studies. This suite integrates two key components:
            </p>
            <h3 class="mt-2 mb-1" id="data-collection-2-1">2.1 Genomic annotation</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              Variants are mapped to genomic DNA coordinates and annotated using the MANE (Matched Annotation from NCBI and EMBL-EBI) transcript to ensure clinical consistency. Each variant is then formatted according to HGVS (Human Genome Variation Society) nomenclature for structured and interoperable representation.
            </p>
            <h3 class="mt-2 mb-1" id="data-collection-2-2">2.2 External Annotation Integration</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              To provide biological and clinical context, the pipeline incorporates external annotations from clinical relevant resources, including:
              <ul>
                <li>(1) ClinVar: clinical significance interpretations;</li>
                <li>(2) gnomAD: population allele frequencies;</li>
                <li>(3) TCGA: Somatic variant frequencies from cancer cohorts;</li>
                <li>(4) In silico predictors: Scores from variant effect prediction tools such as CADD, EVE, and REVEL;</li>
                <li>(5) dbSNP: standardized reference IDs that facilitate cross-referencing with external genomic databases.</li>
              </ul>
            </p>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              In addition, in silico predictor scores were translated into ACMG-style pathogenicity classifications based on the recommended thresholds provided by VarSome.
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
              ClinMAVE organizes functional data to support variant interpretation at both the dataset level and the individual variant level, aligning with ACMG/AMP recommendations for evaluating experimental evidence (e.g., PS3/BS3 criteria). To compute this, we define the control sets as follows:
              <ul>
                <li>Clinvar-classified Pathogenic/Likely Pathogenic (P/LP) variants as true positives (TPs); </li>
                <li>Clinvar-classified Benign/Likely Benign (B/LB) variants as true negatives (TNs); </li>
              </ul>
            </p>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              To ensure statistical reliability, we only conduct evidence strength evaluations for datasets that meet the following minimum requirements:
              <ul>
                <li>A total of at least 11 benchmark variants (TPs + TNs ≥ 11); </li>
                <li>At least 4 TPs and 4 TNs, respectively;</li>
              </ul>
            </p>
            <h3 class="mt-2 mb-1" id="data-curation-2-1">2.1 Dataset-level strength of evidence</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              The ClinGen Sequence Variant Interpretation (SVI) Working Group (2022) introduced the use of the Odds of Pathogenicity (OddsPath) to quantify the strength of functional evidence at the dataset level. This approach enables a standardized, quantitative mapping of functional assay results to ACMG/AMP evidence strength levels (e.g., PS3/BS3). 
            </p>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              OddsPath is calculated using two conditional probabilities:
              <ul>
                <li>P1: The proportion of pathogenic variants (TPs) in the control sets (TPs + TNs);</li>
                <li>P2: The proportion of pathogenic variants (TPs) with abnormal functionality (including both loss-of-function and gain-of-function) out of all abnormal variants.</li>
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
              ClinMAVE assigns functional evidence strength at the per-variant level by quantifying how similar a variant’s functional score is to known pathogenic (TP) and benign (TN) variants within the same dataset. This is achieved using a distance–based scoring method, which accounts for score distribution and variance. Each variant’s score is transformed into a normalized "distance_score" on a [–1, 1] scale, where:
              <ul>
                <li>+1 indicates high similarity to pathogenic variants (strong functional abnormality)</li>
                <li>–1 indicates high similarity to benign variants (normal function)</li>
              </ul>
            </p>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              For datasets eligible for ACMG-style strength scaling, variants classified as functionally abnormal are assigned one of the following evidence levels:
              <ul>
                <li>Strong: distance_score ≥ 0.9</li>
                <li>Moderate: distance_score ≥ 0.75</li>
                <li>Weak: distance_score < 0.75</li>
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
              The ClinMAVE database provides an interactive platform for browsing, searching, visualizing, and analyzing curated functional evidence from MAVE. The portal is organized into four core modules.
            </p>
            <h2 class="mt-2 mb-1" id="database-usage-1">1. Browse module</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              The Browser Module in ClinMAVE provides a flexible and user-friendly interface for navigating curated MAVE datasets. Users can explore data through multiple entry points—from gene- and technique-level overviews to detailed variant-level records—using either the homepage search bar or the dedicated browser interface.
            </p>
            <h2 class="mt-2 mb-1" id="database-usage-2">2. Search Module</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinMAVE offers robust search capabilities to help users efficiently locate relevant functional variant data across genes, variants, and MAVE techniques. Accessible from the homepage, the quick search bar supports intuitive, keyword-based searches. Users can search using:
              <ul>
                <li>Gene symbol (e.g., BRCA1, TP53)</li>
                <li>Gene ID (e.g., Ensembl Gene ID)</li>
                <li>HGVS-formatted variant notation (e.g., NM_000059.3:c.4035del)</li>
                <li>MAVE technique (e.g., "deep mutational scanning", "CRISPR-based genome editing")</li>
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
                <li>MAVE score distribution plots, color-coded by: (1). molecular consequence (e.g., missense, nonsense, synonymous); (2). ClinVar classification (e.g., pathogenic, benign, VUS).</li>
                <li>Scatterplots or violin plots illustrate how variant functional scores correlate with population allele frequency from gnomAD.</li>
              </ul>
            </p>
            <h3 class="mt-2 mb-1" id="database-usage-3-2">3.2 Visualization by Gene</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinMAVE offers comprehensive gene-centric visualizations that map variant effects across the full length of a protein, with integrated domain annotations and support for cross-dataset comparison.
            </p>
            <h2 class="mt-2 mb-1" id="database-usage-4">4. Analysis module</h2>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              The Analysis Module in ClinMAVE provides tools for evaluating how well functional scores from MAVE experiments align with computational predictions and clinical classifications. This supports benchmarking of variant effect predictors and assessment of functional assay reliability.
            </p>
            <h3 class="mt-2 mb-1" id="database-usage-4-1">4.1 MAVE score vs. In-silico Predictors</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              Users can compare MAVE-derived functional scores with widely used in silico predictors.
            </p>
            <h3 class="mt-2 mb-1" id="database-usage-4-2">4.2 Clinical classification analysis</h3>
            <p style="line-height: 1.7; text-indent: 2em; text-align: justify;">
              ClinMAVE enables quantitative benchmarking of functional assays by measuring their ability to distinguish clinically classified variants. Receiver Operating Characteristic (ROC) curves are generated to evaluate the ability of MAVE scores to separate (Likely-) pathogenic from (Likely-) benign variants.
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
    { software: 'ANNOVAR', version: 'V2.3.0' },
    { software: 'MANE', version: 'GRCh38 v1.4' },
    { software: 'dbSNP', version: 'avSNP150' },
    { software: 'gnomAD', version: 'V2.1.1' },
    { software: 'AlphaMissense', version: 'dbNSFP v4.7a' },
    { software: 'CADD', version: 'dbNSFP v4.7a' },
    { software: 'EVE', version: 'dbNSFP v4.7a' },
    { software: 'MetaSVM', version: 'dbNSFP v4.7a' },
    { software: 'REVEL', version: 'dbNSFP v4.7a' },
    { software: 'Polyphen2', version: 'dbNSFP v4.7a' },
    { software: 'Cbioportal', version: 'Accessed on 2025/05/22' },
    { software: 'Varsome', version: 'Accessed on 2025/05/12' },
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
      value: 'BRCA1',
    },
    {
      datatype: 'Functional score',
      description: 'Quantification of the functional impact of a specific genetic variant',
      value: '0.34',
    },
    {
      datatype: 'Functional classification',
      description: 'Controlled vocabulary',
      value: 'Loss-of-function, Gain-of-function, Functional neutral',
    },
    {
      datatype: 'MAVE technique',
      description: 'Controlled vocabulary',
      value: 'Deep mutational scanning,CRISPR-based genome editing',
    },
    {
      datatype: 'Mutagenesis strategy',
      description: 'Controlled vocabulary',
      value: 'Prime editing,Base editing,Saturation genome editing,Oligonucleotide synthesis,Mutagenic PCR',
    },
    {
      datatype: 'Functional assay',
      description: 'Controlled vocabulary',
      value: 'Protein abundance and stability,Protein binding,Specialized molecular function,Cellular fitness',
    },
    {
      datatype: 'Experiment model',
      description: 'The cell types used to perform MAVE',
      value: 'HAP1',
    },
    {
      datatype: 'Phenotype',
      description: 'The specific biological outcome measured by a MAVE experiment',
      value: 'MLH1 mediated mismatch repair function',
    },
    {
      datatype: 'Direction of Effect',
      description: 'how a variant alters the measured phenotype relative to the wild-type or reference allele',
      value: 'diminished, enhanced',
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
      how: 'ClinMAVE provides DNA-level annotations, mapping functional data to specific genomic coordinates and HGVS nomenclature',
      contribution: 'Enables variant look-up and direct ACMG/AMP PS3/BS3 application',
    },
    {
      gap: 'Missing metadata about assay validation, controls, and reproducibility',
      how: 'ClinMAVE includes structured metadata such as assay system, validation status, strength of effect, and reproducibility',
      contribution: 'Supports evidence grading (e.g., strong/moderate/supporting) per Brnich et al. and ClinGen SVI guidance',
    },
    {
      gap: 'Poor data discoverability and inconsistent nomenclature',
      how: 'ClinMAVE standardizes gene/variant identifiers, links to ClinVar, gnomAD, and other clinical databases',
      contribution: 'Improves interoperability and searchability for clinicians and labs',
    },
    {
      gap: 'Lack of harmonization across studies',
      how: 'ClinMAVE curates studies using a unified schema, applying consistent criteria for variant effect strength and significance',
      contribution: 'Facilitates cross-study comparison and evidence aggregation',
    },
    {
      gap: 'Limited accessibility for clinical users',
      how: 'ClinMAVE offers user-friendly query tools, interactive visualization, and ACMG-ready evidence summaries',
      contribution: 'Makes functional data directly usable in variant curation workflows',
    },
  ];
</script>
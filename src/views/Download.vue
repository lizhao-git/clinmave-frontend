<template>
  <v-main>
    <v-container fluid class="mt-4">
      <!-- Breadcrumbs -->
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

      <!-- Download Form -->
      <v-row justify="center">
        <v-col cols="12" md="8">

          <v-sheet>
            <v-data-table
              :headers="headers"
              :items="items"
              class="elevation-1"
              :items-per-page="10"
            >
              <template v-slot:top>
                <v-toolbar flat>
                  <v-toolbar-title>ClinMAVE Data Summary</v-toolbar-title>
                </v-toolbar>
              </template>

              <!-- 自定义文件列 -->
              <template v-slot:item.files="{ item }">
                <a :href="item.fileUrl" target="_blank" download>
                  {{ item.files }}
                </a>
              </template>
            </v-data-table>
          </v-sheet>
          
          <v-sheet class="pa-6 mt-4" elevation="2">
            <h2 class="text-h5 mb-4">Retrieve variants by Gene</h2>
            <v-form @submit.prevent="downloadCSV">
              <v-autocomplete
                v-model="geneName"
                v-model:search="searchGeneName"
                :items="geneNameOptions"
                item-title="text"
                item-value="value"
                label="Gene Name"
                variant="outlined"
                density="compact"
                clearable
                :loading="loadingGeneName"
                :error-messages="errorMessage"
                placeholder="Enter gene name (e.g., BAP1)"
                @update:search="debouncedFetchGeneName"
              ></v-autocomplete>
              <v-btn
                type="submit"
                color="#091C2B"
                dark
                class="mt-4"
                :loading="loading"
                :disabled="!geneName || loading"
              >
                Download CSV
              </v-btn>
            </v-form>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- Feedback Alerts -->
      <v-row justify="center" class="mt-4">
        <v-col cols="12" md="8">
          <v-alert
            v-if="successMessage"
            type="success"
            dismissible
            @input="successMessage = ''"
          >
            {{ successMessage }}
          </v-alert>
          <v-alert
            v-if="errorMessage"
            type="error"
            dismissible
            @input="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';
import { debounce } from 'lodash';

// Breadcrumbs
const breadcrumbs = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'Download',
  },
];

// State
const geneName = ref('');
const searchGeneName = ref(null);
const geneNameOptions = ref([]);
const loadingGeneName = ref(false);
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Debounced fetch function for geneName autocomplete
const debouncedFetchGeneName = debounce(async () => {
  try {
    loadingGeneName.value = true;
    const params = { term: 'geneName', search: searchGeneName.value || '' };
    const response = await axios.get('/clinmave/api/select/variant', { params });
    geneNameOptions.value = response.data.result.map(item => ({
      text: `${item.geneName} (#Entries: ${item.count})`,
      value: item.geneName,
    }));
  } catch (error) {
    errorMessage.value = 'Failed to load gene name options';
    console.error('[Fetch GeneName Error]', error);
    geneNameOptions.value = [];
  } finally {
    loadingGeneName.value = false;
  }
}, 300);

const headers = [
  { title: 'Description', key: 'description' },
  { title: 'Details', key: 'details' },
  { title: 'Format', key: 'format' },
  { title: 'Files', key: 'files' },
]

const items = [
  {
    description: 'Publications Information',
    details: 'A detailed description of all publications collected in ClinMAVE',
    format: 'xlsx',
    files: 'combined.study.summary.xlsx',
    fileUrl: '/clinmave/files/combined.study.summary.xlsx'
  },
  {
    description: 'Gene Annotation',
    details: 'A detailed description of all genes curated in ClinMAVE',
    format: 'xlsx',
    files: 'combined.gene.xlsx',
    fileUrl: '/clinmave/files/combined.gene.xlsx'
  },
  {
    description: 'Dataset Information',
    details: 'A detailed description of curated dataset metadata and analytical results in ClinMAVE',
    format: 'xlsx',
    files: 'combined.dataset.summary.xlsx',
    fileUrl: '/clinmave/files/combined.dataset.summary.xlsx'
  },
  {
    description: 'MAVE Information',
    details: 'A detailed description of MAVE techniques in ClinMAVE',
    format: 'xlsx',
    files: 'combined.mave.summary.xlsx',
    fileUrl: '/clinmave/files/combined.mave.summary.xlsx'
  }
]

// Methods
const downloadCSV = async () => {
  if (!geneName.value || geneName.value.trim() === '') {
    errorMessage.value = 'Please select a valid gene name';
    return;
  }

  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    const response = await axios.get('/clinmave/api/download/variants', {
      params: { geneName: geneName.value.trim() },
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `variants_${geneName.value.trim()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    successMessage.value = `Successfully downloaded variants_${geneName.value.trim()}.csv`;
  } catch (error) {
    if (error.response) {
      // Handle specific HTTP errors
      if (error.response.status === 400) {
        errorMessage.value = 'Gene name is required and must be a non-empty string';
      } else if (error.response.status === 404) {
        errorMessage.value = `No variants found for gene: ${geneName.value}`;
      } else {
        errorMessage.value = 'Failed to download CSV. Please try again later.';
      }
    } else {
      errorMessage.value = 'An unexpected error occurred. Please try again.';
    }
    console.error('[Download CSV Error]', error);
  } finally {
    loading.value = false;
  }
};

const clearMessages = () => {
  successMessage.value = '';
  errorMessage.value = '';
};

// Watch search input to trigger debounced fetch
watch(searchGeneName, () => {
  debouncedFetchGeneName();
});

// Initialize gene name options
debouncedFetchGeneName();
</script>

<style scoped>
.v-sheet {
  border-radius: 8px;
}
</style>
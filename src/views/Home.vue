<template>
  <!-- Main -->
  <v-main>
    <v-container fluid>
      <!-- Hero -->
      <v-row class="mt-1" align="stretch">
        <v-col cols="6" sm="6">
          <v-card
            class="py-4"
            height="100%"
            :rounded="defaultRounded"
            :variant="defaultCardVariant"
          >
            <template #title>
              <h2 class="text-h5 font-weight-bold text-center">Welcome to ClinMAVE</h2>
            </template>

            <v-card-text class="text-center" style="font-size: 15px">
              A curated database of Multiplexed Assays of Variant Effect (MAVE) studies, providing
              variant-level functional annotations to support genetic variant interpretation,
              diagnostic decision-making, and exploration of genotype-phenotype relationships in
              diseases.
            </v-card-text>

            <v-divider class="mx-4 mb-1" />

            <v-card-text>
              <!-- v-autocomplete search -->
              <v-autocomplete
                ref="searchInput"
                v-model="filters.datasetId"
                v-model:search="searchDatasetId"
                :items="datasetIdOptions"
                :loading="loadingDatasetId"
                item-title="text"
                item-value="value"
                return-object
                placeholder="Search by Variant, Gene or Dataset"
                variant="solo"
                density="comfortable"
                append-inner-icon="mdi-magnify"
                menu-icon=""
                hide-no-data
                hide-selected
                @update:search="debouncedFetchDatasetId"
                @focus="handleInputFocus"
              >
                <!-- Selected chip -->
                <template #selection="{ item }">
                  <v-chip
                    v-if="item"
                    :color="getCategoryColor(item.raw?.category ?? item.category)"
                    text-color="white"
                    label
                    size="small"
                    closable
                    :prepend-icon="getCategoryIcon(item.raw?.category ?? item.category)"
                    @click:close="filters.datasetId = null"
                  >
                    {{ item.raw?.text ?? item.title ?? item.text }}
                    <span class="ml-2">({{ item.raw?.category ?? item.category ?? 'Unknown' }})</span>
                  </v-chip>
                </template>

                <!-- Dropdown option -->
                <template #item="{ props, item }">
                  <v-list-item
                    v-bind="props"
                    :prepend-icon="getCategoryIcon(item.raw?.category ?? item.category)"
                    :subtitle="item.raw?.category ?? item.category ?? 'Unknown'"
                    :title="item.raw?.text ?? item.title ?? item.text"
                    :style="{ color: getCategoryColor(item.raw?.category ?? item.category) }"
                    @click="onSelectItem(item)"
                    class="hover-highlight"
                  ></v-list-item>
                </template>
              </v-autocomplete>

              <span class="mx-4">
                e.g.
                <a
                  href="/clinmave/browse/variant/NM_007294.4(BRCA1):c.5408G>A (p.Gly1803Asp)"
                  class="text-decoration-none"
                >
                  NM_007294.4(BRCA1):c.5408G>A (p.Gly1803Asp) </a
                >,
                <a href="/clinmave/browse/dataset/dataset0153" class="text-decoration-none"
                  >dataset0153</a
                >,
                <a href="/clinmave/browse/gene/BRCA1" class="text-decoration-none">BRCA1</a>
              </span>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right column: Statistics -->
        <v-col>
          <v-row>
            <v-col cols="12" md="12">
              <v-card flat class="pa-4" height="100%">
                <v-card-title class="text-h5">Statistics</v-card-title>
                <v-row>
                  <v-col v-for="(item, index) in stats" :key="index" cols="12" sm="4">
                    <v-card :href="item.link" class="pa-1" flat link min-height="100">
                      <v-sheet class="pt-2" color="transparent">
                        <div class="d-flex align-center justify-center text-h5">
                          <template v-if="item.iconType === 'mdi'">
                            <v-icon :color="item.color" :size="item.iconWidth || '30'">{{
                              item.icon
                            }}</v-icon>
                          </template>
                          <template v-else-if="item.iconType === 'svg'">
                            <img
                              :src="item.icon"
                              :style="{
                                width: item.iconWidth || '40px',
                                height: item.iconHeight || '40px',
                              }"
                              alt="Custom SVG Icon"
                            />
                          </template>
                          <span class="ml-2">{{ item.count.toLocaleString() }}</span>
                        </div>
                        <v-divider class="my-1 mx-2" />
                        <div class="text-h6 text-center">{{ item.label }}</div>
                      </v-sheet>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-divider class="mx-12 my-3" />

      <!-- Pipeline & Right rail -->
      <v-row class="mt-1" align="stretch">
        <v-col cols="12" md="8" lg="8" sm="12">
          <v-img src="/clinmave/images/pipeline.png" contain />
        </v-col>

        <v-col cols="12" md="4" lg="4" sm="12" class="d-flex flex-column fill-height">
          <div class="d-flex flex-column justify-space-between fill-height">
            <!-- How to cite -->
            <v-row>
              <v-col class="fill-height">
                <v-card
                  class="py-4 fill-height"
                  :rounded="defaultRounded"
                  :variant="defaultCardVariant"
                >
                  <template #title>
                    <v-icon start class="mr-2" color="primary">mdi-lead-pencil</v-icon>
                    How to cite
                  </template>
                  <v-card-text>
                    <span>
                      ClinMAVE: a curated database for clinical application of data from multiplexed
                      assays of variant effect (MAVEs).
                      <span class="italic">Nucleic Acids Research</span> 2026, in preparation.
                    </span>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-divider class="my-5"></v-divider>

            <!-- News -->
            <v-row>
              <v-col class="fill-height">
                <v-card
                  class="py-4 d-flex flex-column fill-height"
                  :rounded="defaultRounded"
                  :variant="defaultCardVariant"
                >
                  <template #title>
                    <v-icon start class="mr-2" color="primary"
                      >mdi-message-text-clock-outline</v-icon
                    >
                    News
                  </template>
                  <v-card-text class="flex-grow-1 overflow-y-auto">
                    <div class="mb-4" v-for="nnew in nnews" :key="nnew.time">
                      <div class="font-weight-normal">
                        <strong>{{ nnew.from }}</strong> @{{ nnew.time }}
                      </div>
                      <div>{{ nnew.message }}</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-divider class="my-5"></v-divider>

            <!-- Related Resources -->
            <v-row>
              <v-col class="fill-height">
                <v-card
                  class="py-4 fill-height"
                  :rounded="defaultRounded"
                  :variant="defaultCardVariant"
                >
                  <template #title>
                    <v-icon start class="mr-2" color="primary">mdi-puzzle-outline</v-icon>
                    Related resources
                  </template>
                  <v-card-text>
                    <v-chip class="mr-2" color="primary"
                      ><a href="https://gnomad.broadinstitute.org" target="_blank"
                        >gnomAD</a
                      ></v-chip
                    >
                    <v-chip class="mr-2" color="primary"
                      ><a href="https://www.ncbi.nlm.nih.gov/clinvar" target="_blank"
                        >ClinVar</a
                      ></v-chip
                    >
                    <v-chip class="mr-2" color="primary"
                      ><a href="https://www.mavedb.org" target="_blank">MAVEDB</a></v-chip
                    >
                    <v-chip class="mr-2" color="primary"
                      ><a href="https://www.acmg.net" target="_blank">ACMG</a></v-chip
                    >
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-divider class="my-5"></v-divider>

            <v-row>
              <v-col>
                <v-card :variant="defaultCardVariant">
                  <v-card-text>
                    To get the best experience, please visit us using the latest version of Google
                    Chrome, Microsoft Edge or Firefox.
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { debounce } from 'lodash'

const router = useRouter()

const defaultRounded = 'sm'
const defaultCardVariant = 'flat'

/** state */
const filters = ref({ datasetId: null })
const searchDatasetId = ref('')
const datasetIdOptions = ref([])
const loadingDatasetId = ref(false)
const defaultOptionsCache = ref(null)
const HomeStatMap = ref({})

/** category color map + helpers */
const categoryColorMap = {
  'Gene Name': 'green',
  'Gene ID': 'green',
  'Dataset ID': 'blue',
  Identifier: 'purple',
  Study: 'orange',
  'Ensembl ID': 'indigo',
}
function getCategoryColor(category) {
  const key = (category || '').trim()
  const color = categoryColorMap[key] || 'grey'
  console.log(`Category: "${key}", Color: "${color}"`) // Debug log
  return color
}

/** category icon map */
const categoryIconMap = {
  'Gene Name': 'mdi-dna',
  'Gene ID': 'mdi-dna',
  'Dataset ID': 'mdi-folder-open-outline',
  Identifier: 'mdi-tag',
  Study: 'mdi-book-open-page-variant',
  'Ensembl ID': 'mdi-database',
}
function getCategoryIcon(category) {
  const key = (category || '').trim()
  return categoryIconMap[key] || 'mdi-help-circle'
}

/** events */
function handleInputFocus() {
  debouncedFetchDatasetId(searchDatasetId.value)
}

function onSelectItem(slotItem) {
  const raw = slotItem?.raw ?? slotItem
  if (!raw || !raw.value) return

  filters.value.datasetId = raw
  searchDatasetId.value = ''
  datasetIdOptions.value = []

  const encoded = encodeURIComponent(raw.value)
  const category = (raw.category || '').trim()

  if (category === 'Gene Name' || category === 'Gene ID') {
    router.push(`/browse/gene/${encoded}`)
  } else if (category === 'Dataset ID') {
    router.push(`/browse/dataset/${encoded}`)
  } else if (category === 'Identifier') {
    router.push(`/browse/variant/${encoded}`)
  } else if (category === 'Study') {
    router.push(`/browse/study/${encoded}`)
  }
}

/** data fetching */
async function fetchDatasetIdOptions(query = '') {
  try {
    if (query === '' && defaultOptionsCache.value) {
      datasetIdOptions.value = defaultOptionsCache.value
      loadingDatasetId.value = false
      return
    }

    loadingDatasetId.value = true
    datasetIdOptions.value = []

    const { data } = await axios.get('/clinmave/api/select/all', {
      params: { entry: query },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })

    const mapped = (data || []).map((it) => {
      const category = (it?.category || 'Unknown').trim()
      return {
        text: it?.text || '',
        value: it?.target || '',
        category,
      }
    })

    datasetIdOptions.value = mapped
    if (query === '') defaultOptionsCache.value = mapped

    // Debug: Log the categories to verify
    console.log('Dataset ID Options Categories:', mapped.map(item => item.category))
  } catch (error) {
    console.error('Error fetching dataset options:', error)
    datasetIdOptions.value = []
  } finally {
    loadingDatasetId.value = false
  }
}
const debouncedFetchDatasetId = debounce(fetchDatasetIdOptions, 120)

async function fetchHomeStat() {
  try {
    const { data } = await axios.get('/clinmave/api/stat/homestat', {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
    HomeStatMap.value = data || {}
  } catch {
    HomeStatMap.value = {}
  }
}

onMounted(() => {
  fetchHomeStat()
})

/** derived */
const stats = computed(() => [
  {
    label: 'Variants',
    count: HomeStatMap.value.variantCount || 0,
    icon: '/clinmave/images/variant.svg',
    iconType: 'svg',
    iconWidth: '40px',
    iconHeight: '40px',
    color: 'teal',
    link: '/clinmave/browse/variants',
  },
  {
    label: 'Genes',
    count: HomeStatMap.value.geneCount || 0,
    icon: '/clinmave/images/gene.svg',
    iconType: 'svg',
    iconWidth: '40px',
    iconHeight: '40px',
    color: 'red',
    link: '/clinmave/browse/genes',
  },
  {
    label: 'Datasets',
    count: HomeStatMap.value.datasetCount || 0,
    icon: 'mdi-folder-open-outline',
    iconType: 'mdi',
    iconWidth: '40px',
    iconHeight: '40px',
    color: 'blue',
    link: '/clinmave/browse/datasets',
  },
  {
    label: 'Studies',
    count: HomeStatMap.value.studyCount || 0,
    icon: 'mdi-book-open-page-variant',
    iconType: 'mdi',
    iconWidth: '40px',
    iconHeight: '40px',
    color: 'blue',
    link: '/clinmave/browse/studies',
  },
  {
    label: 'MAVE techniques',
    count: 2,
    icon: '/clinmave/images/mave.svg',
    iconType: 'svg',
    iconWidth: '40px',
    iconHeight: '40px',
    color: 'orange',
    link: '/clinmave/browse/mave_techniques',
  },
])

/** news */
const nnews = [
  {
    time: '2025-06-28',
    from: 'ClinMAVE',
    message: 'ClinMAVE is now available for public use.',
    color: 'green',
  },
]
</script>

<style scoped>
.hover-highlight:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.v-divider {
  border-color: rgba(0, 0, 0, 0.12);
}

.v-chip {
  margin-left: 4px;
  margin-right: 4px;
}

/* Hide the dropdown arrow in v-autocomplete */
.v-field__append-inner {
  display: none !important;
}
</style>
<template>
    <!-- Main -->
    <v-main>
      <v-container fluid>
        <!-- Hero -->
        <v-row class="mt-1" align="strength">
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
              <v-card-text class="text-center">
                ClinMAVE is a comprehensive knowledgebase based totally on manual curation of cancer metabolic literature, providing high quality metabolite associations, online visualizing networks, and other effective tools for cancer or metabonomics researches.
              </v-card-text>
              <v-divider class="mx-4 mb-1" />
              <v-card-text>
                <v-autocomplete
                  :items="items"
                  append-inner-icon="mdi-microphone"
                  class="mx-auto"
                  density="comfortable"
                  menu-icon=""
                  placeholder="Search Google or type a URL"
                  prepend-inner-icon="mdi-magnify"
                  theme="light"
                  variant="solo"
                  auto-select-first
                  item-props
                  rounded
                ></v-autocomplete>

                <span class="mx-4">
                  e.g. 
                  <a href="/browse/variant/NM_000219(KCNE1):c.384C>T (p.Ser128Ser)" class="text-decoration-none">NM_000219(KCNE1):c.384C>T (p.Ser128Ser)</a>,
                  <a href="/browse/dataset/dataset4517" class="text-decoration-none">dataset4517</a>,
                  <a href="/browse/gene/BRCA1" class="text-decoration-none">BRCA1</a>,
                </span>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col>
            <v-row>
              <v-col cols="12" md="12">
                <v-card 
                  flat 
                  class="pa-4"
                  height="100%"
                >
                  <v-card-title class="text-h5">Statistics</v-card-title>
                  <v-row>
                    <v-col
                      v-for="(item, index) in stats"
                      :key="index"
                      cols="12"
                      sm="4"
                    >
                      <v-card
                        :href="item.link"
                        class="pa-3"
                        flat
                        link
                        min-height="140"
                      >
                        <v-sheet class="pt-2" color="transparent">
                          <div class="text-h4 d-flex align-center justify-center">
                            <v-icon :color="item.color" size="36">{{ item.icon }}</v-icon>
                            <span class="ml-2">{{ item.count.toLocaleString() }}</span>
                          </div>
                          <v-divider class="my-1 mx-2" />
                          <div class="text-h5 text-center">{{ item.label }}</div>
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
        <v-row>
          <v-col cols="4" sm="4">
            <v-card
              class="py-4"
              :rounded="defaultRounded"
              :variant="defaultCardVariant"
              height="200px"
            >
              <template #title>
                <v-icon start class="mr-2" color="primary">mdi-egg-easter</v-icon>
                How to site
              </template>
              <v-card-text>
                <span>ClinMAVE: A database for xxxxxx. Nucleic Acids Research 2025, <br>
                  [PMID=<a href="https://pubmed.ncbi.nlm.nih.gov/37027007" target="_blank">37027007</a>] <br>
                  [OpenLBID=<a href="" target="_blank">OLB-PM-37027007</a>] <br>
                  [DOI=<a href="https://doi.org/10.1158/1541-7786.MCR-22-0909" target="_blank">10.1158/1541-7786.MCR-22-0909</a>]
                </span>
              </v-card-text>
            </v-card>
          </v-col>
          <v-divider class="my-8" vertical />
          <v-col cols="4" sm="4">
            <v-card
              class="py-4 d-flex flex-column"
              :rounded="defaultRounded"
              :variant="defaultCardVariant"
              height="200px"
            >
              <template #title>
                <v-icon start class="mr-2" color="primary">mdi-google-downasaur</v-icon>
                News
              </template>
              <v-card-text class="flex-grow-1 overflow-y-auto">
                <v-timeline>
                  <v-timeline-item
                    v-for="nnew in nnews"
                    :key="nnew.time"
                    :dot-color="nnew.color"
                    size="x-small"
                    side="end"
                  >
                    <div class="mb-4">
                      <div class="font-weight-normal">
                        <strong>{{ nnew.from }}</strong> @{{nnew.time}}
                      </div>

                      <div>{{ nnew.message }}</div>
                    </div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
            </v-card>
          </v-col>
          <v-divider class="my-8" vertical />
          <v-col cols="4" sm="4">
            <v-card
              class="py-4"
              :rounded="defaultRounded"
              :variant="defaultCardVariant"
              height="200px"
            >
              <template #title>
                <v-icon start class="mr-2" color="primary">mdi-halloween</v-icon>
                Related resources
              </template>
              <v-card-text>

              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-card
            :variant="defaultCardVariant"
          >
            <v-card-text>
              To get the best experience, please visit us using the latest version of Google Chrome, Microsoft Edge or Firefox.
            </v-card-text>
          </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
</template>

<script setup>
  const defaultRounded = 'sm'
  const defaultCardVariant = 'flat'
  const stats = [
    {
      label: 'Variants',
      count: 1958105,
      icon: 'mdi-chemical-weapon',
      color: 'teal',
      link: '/browse/variants',
    },
    {
      label: 'Datasets',
      count: 1998,
      icon: 'mdi-ballot-outline',
      color: 'purple',
      link: '/browse/datasets',
    },
    {
      label: 'Mutagenesis strategies',
      count: 5,
      icon: 'mdi-flask-empty-outline',
      color: 'orange',
      link: '/browse/mutagenesis_strategies',
    },
    {
      label: 'Genes',
      count: 799,
      icon: 'mdi-butterfly-outline',
      color: 'red',
      link: '/browse/genes',
    },
    {
      label: 'Studies',
      count: 32,
      icon: 'mdi-book-open-page-variant',
      color: 'blue',
      link: '/browse/studies',
    },
  ]
  const nnews = [
    {
      time: '2023-10-01',
      from: 'ClinMAVE',
      message: 'ClinMAVE is now available for public use.',
      color: 'green',
    },
    {
      time: '2023-09-15',
      from: 'ClinMAVE',
      message: 'ClinMAVE is now available for public use.',
      color: 'blue',
    },
    {
      time: '2023-08-30',
      from: 'ClinMAVE',
      message: 'ClinMAVE is now available for public use.',
      color: 'red',
    },
  ]
</script>
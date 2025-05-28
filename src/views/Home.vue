<template>
    <!-- Main -->
    <v-main>
      <v-container fluid>
        <!-- Hero -->
        <v-row class="mt-1">
          <v-col cols="6" sm="6">
            <v-card
              class="py-4"
              :rounded="defaultRounded"
              :variant="defaultCardVariant"
            >
              <template #title>
                <h2 class="text-h5 font-weight-bold text-center">Welcome to FUGEDB</h2>
              </template>
              <v-card-text class="text-center">
                MACdb is a comprehensive knowledgebase based totally on manual curation of cancer metabolic literature, providing high quality metabolite associations, online visualizing networks, and other effective tools for cancer or metabonomics researches.
              </v-card-text>
              <v-divider class="mx-4 mb-1" />
              <v-card-text>
                <v-input>
                  <v-text-field
                    class="mx-4"
                    label="Search"
                    prepend-inner-icon="mdi-magnify"
                    hide-details
                  />
                  <v-btn
                    class="mx-4"
                    :variant="defaultCardVariant"
                    prepend-icon="mdi-magnify" />
                </v-input>

                <span class="mx-4">e.g. </span>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col>
            <v-row>
              <v-col cols="12" md="12">
                <v-card flat class="pa-4">
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
                <span>MACdb: A curated knowledgebase for metabolic associations across human cancers. Molecular Cancer Res 2023, <br>
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
          <v-card
            :variant="defaultCardVariant"
          >
            <v-card-text>
              To get the best experience, please visit us using the latest version of Google Chrome, Microsoft Edge or Firefox.
            </v-card-text>
          </v-card>
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
      count: 40710,
      icon: 'mdi-chemical-weapon',
      color: 'teal',
      link: '/macdb/browse_association',
    },
    {
      label: 'Studies',
      count: 5405,
      icon: 'mdi-ballot-outline',
      color: 'purple',
      link: '/macdb/browse_association',
    },
    {
      label: 'Experiments',
      count: 269,
      icon: 'mdi-flask-empty-outline',
      color: 'orange',
      link: '/macdb/browse_trait',
    },
    {
      label: 'Consequences',
      count: 26,
      icon: 'mdi-butterfly-outline',
      color: 'red',
      link: '/macdb/browse_study',
    },
    {
      label: 'Publications',
      count: 153,
      icon: 'mdi-book-open-page-variant',
      color: 'blue',
      link: '/macdb/browse_study',
    },
  ]
  const nnews = [
    {
      time: '2023-10-01',
      from: 'FUGEDB',
      message: 'FUGEDB is now available for public use.',
      color: 'green',
    },
    {
      time: '2023-09-15',
      from: 'FUGEDB',
      message: 'FUGEDB is now available for public use.',
      color: 'blue',
    },
    {
      time: '2023-08-30',
      from: 'FUGEDB',
      message: 'FUGEDB is now available for public use.',
      color: 'red',
    },
  ]
</script>
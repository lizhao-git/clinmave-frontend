<template>
  <v-main>
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <v-card flat>
            <v-breadcrumbs :items="breadcrumbs">
              <template v-slot:item="{ item }">
                <v-breadcrumbs-item
                  :disabled="item.disabled"
                  :href="item.href"
                >
                  <span>
                    <v-icon v-if="item.icon" :icon="item.icon" left></v-icon>
                    {{ item.title }}
                  </span>
                </v-breadcrumbs-item>
              </template>
            </v-breadcrumbs>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <!-- Filter Panel -->
        <v-col cols="12" md="2" v-if="showFilters">
          <v-sheet class="py-6 px-3">
            <v-row>
              <v-col cols="12">
                <div class="text-body-1 font-weight-bold">Filters</div>
                <v-btn 
                  size="small" 
                  dark 
                  color="#091C2B" 
                  class="float-end" 
                  @click="toggleFilters"
                >
                  <span>{{ showFilters ? 'Hide' : 'Show' }}</span>
                  <v-icon small>{{ showFilters ? 'mdi-chevron-double-left' : 'mdi-chevron-double-right' }}</v-icon>
                </v-btn>
              </v-col>
            </v-row>
            <v-sheet>
              <v-row dense>
                <v-col cols="12">
                  <v-autocomplete
                    v-model="filters.pmid"
                    v-model:search="searchPmid"
                    :items="pmidOptions"
                    label="PMID"
                    clearable
                    density="compact"
                    :loading="loadingPmid"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12">
                  <v-autocomplete
                    v-model="filters.title"
                    v-model:search="searchTitle"
                    :items="titleOptions"
                    label="Title"
                    clearable
                    density="compact"
                    :loading="loadingTitle"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12">
                  <v-autocomplete
                    v-model="filters.journal"
                    v-model:search="searchJournal"
                    :items="journalOptions"
                    label="Journal"
                    clearable
                    density="compact"
                    :loading="loadingJournal"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12">
                  <v-autocomplete
                    v-model="filters.year"
                    v-model:search="searchYear"
                    :items="yearOptions"
                    label="Year"
                    clearable
                    density="compact"
                    :loading="loadingYear"
                  ></v-autocomplete>
                </v-col>
              </v-row>
              <v-row dense>
                <v-spacer></v-spacer>
                <v-col cols="10" class="text-right">
                  <v-btn size="small" dark color="#091C2B" @click="applyFilters" class="mr-2">Apply</v-btn>
                  <v-btn size="small" dark color="#091C2B" @click="resetFilters">Reset</v-btn>
                </v-col>
              </v-row>
            </v-sheet>
          </v-sheet>
        </v-col>
        <!-- Table Content -->
        <v-col :cols="showFilters ? 12 : 12" :md="showFilters ? 10 : 12">
          <v-sheet class="pa-3">
            <v-btn 
              v-if="!showFilters"
              size="small" 
              dark 
              color="#091C2B" 
              class="mb-3"
              @click="toggleFilters"
            >
              <span>Show Filters</span>
              <v-icon small>mdi-chevron-double-right</v-icon>
            </v-btn>
            <!-- Table -->
            <vxe-toolbar ref="toolbarRef" export custom></vxe-toolbar>
            <vxe-pager
              :current-page.sync="currentPage"
              :page-size.sync="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="totalRecords"
              :layouts="['Home', 'PrevPage', 'JumpNumber', 'NextPage', 'End', 'Sizes', 'Total']"
              @page-change="handlePageChange"
            ></vxe-pager>
            <vxe-table
              ref="tableRef"
              :export-config="{}"
              :column-config="{ resizable: true }"
              :data="tableData"
              stripe
              round
              :loading="loading"
              :pager-config="{ currentPage, pageSize, total: totalRecords }"
              @sort-change="handleSortChange"
            >
              <vxe-column field="pmid" title="PMID" min-width="120" sortable>
                <template #default="{ row }">
                  <a 
                    v-if="row.pmid" 
                    :href="row.pmid_link || `https://pubmed.ncbi.nlm.nih.gov/${row.pmid}`" 
                    target="_blank"
                    style="text-decoration: none;"
                  >
                    {{ row.pmid }}
                    <v-icon small color="blue">mdi-share</v-icon>
                  </a>
                  <span v-else>-</span>
                </template>
              </vxe-column>
              <vxe-column field="title" title="Title" min-width="250"></vxe-column>
              <vxe-column field="journal" title="Journal" min-width="180"></vxe-column>
              <vxe-column field="year" title="Year" min-width="80"></vxe-column>
            </vxe-table>
            <vxe-pager
              :current-page.sync="currentPage"
              :page-size.sync="pageSize"
              :total="totalRecords"
              :layouts="['Home', 'PrevPage', 'JumpNumber', 'NextPage', 'End', 'Sizes', 'Total']"
              @page-change="handlePageChange"
            ></vxe-pager>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import { debounce } from 'lodash'

const breadcrumbs = [
  {
    title: 'Home',
    icon: 'mdi-home',
    href: '/',
    disabled: false,
  },
  {
    title: 'Browse',
    icon: 'mdi-cart',
    href: '/browse',
    disabled: false,
  },
  {
    title: 'publication',
    icon: 'mdi-information',
    href: '/browse/publication',
    disabled: true,
  },
]

// 过滤器
const filters = ref({
  pmid: '',
  title: '',
  journal: '',
  year: ''
})

const showFilters = ref(true)
const toolbarRef = ref()
const tableRef = ref()
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)
const loading = ref(false)
const sortParams = ref({
  field: '',
  order: ''
})

// 下拉选项相关
const pmidOptions = ref([])
const titleOptions = ref([])
const journalOptions = ref([])
const yearOptions = ref([])

const searchPmid = ref('')
const searchTitle = ref('')
const searchJournal = ref('')
const searchYear = ref('')

const loadingPmid = ref(false)
const loadingTitle = ref(false)
const loadingJournal = ref(false)
const loadingYear = ref(false)

// 动态获取下拉选项
const fetchPmidOptions = debounce(async (query = '') => {
  loadingPmid.value = true
  try {
    const res = await axios.get('/api/fugedb/select', { params: { pmid: query } })
    pmidOptions.value = Array.isArray(res.data) ? res.data : res.data.data || []
  } catch {
    pmidOptions.value = []
  } finally {
    loadingPmid.value = false
  }
}, 300)

const fetchTitleOptions = debounce(async (query = '') => {
  loadingTitle.value = true
  try {
    const res = await axios.get('/api/fugedb/select', { params: { title: query } })
    titleOptions.value = Array.isArray(res.data) ? res.data : res.data.data || []
  } catch {
    titleOptions.value = []
  } finally {
    loadingTitle.value = false
  }
}, 300)

const fetchJournalOptions = debounce(async (query = '') => {
  loadingJournal.value = true
  try {
    const res = await axios.get('/api/fugedb/select', { params: { journal: query } })
    journalOptions.value = Array.isArray(res.data) ? res.data : res.data.data || []
  } catch {
    journalOptions.value = []
  } finally {
    loadingJournal.value = false
  }
}, 300)

const fetchYearOptions = debounce(async (query = '') => {
  loadingYear.value = true
  try {
    const res = await axios.get('/api/fugedb/select', { params: { year: query } })
    yearOptions.value = Array.isArray(res.data) ? res.data : res.data.data || []
  } catch {
    yearOptions.value = []
  } finally {
    loadingYear.value = false
  }
}, 300)

// 监听输入动态请求
watch(searchPmid, (val) => fetchPmidOptions(val))
watch(searchTitle, (val) => fetchTitleOptions(val))
watch(searchJournal, (val) => fetchJournalOptions(val))
watch(searchYear, (val) => fetchYearOptions(val))

onMounted(() => {
  fetchPmidOptions()
  fetchTitleOptions()
  fetchJournalOptions()
  fetchYearOptions()
  loadData()
  const $table = tableRef.value
  const $toolbar = toolbarRef.value
  if ($table && $toolbar) {
    $table.connect($toolbar)
  }
})

// 数据加载
const loadData = async () => {
  loading.value = true
  try {
    let sort = sortParams.value.field && sortParams.value.order
      ? `${sortParams.value.field},${sortParams.value.order}`
      : 'pmid,asc'
    const params = {
      page: currentPage.value - 1,
      size: pageSize.value,
      sort: sort || undefined,
      ...filters.value
    }
    // 去除空参数
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key]
      }
    })
    // TODO: 替换为实际API
    const response = await axios.get('/api/fugedb/fetch/table/publication', { params })
    tableData.value = response.data.data || []
    totalRecords.value = response.data.totalRows || 0

    // // 临时假数据
    // tableData.value = [
    //   {
    //     pmid: '123456',
    //     pmid_link: 'https://pubmed.ncbi.nlm.nih.gov/123456/',
    //     title: '示例文献1',
    //     journal: '科学杂志',
    //     year: 2023
    //   },
    //   {
    //     pmid: '654321',
    //     pmid_link: 'https://pubmed.ncbi.nlm.nih.gov/654321/',
    //     title: '示例文献2',
    //     journal: '自然杂志',
    //     year: 2022
    //   }
    // ]
    // totalRecords.value = 2
  } catch (error) {
    tableData.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const applyFilters = () => {
  currentPage.value = 1
  loadData()
}

const resetFilters = () => {
  filters.value = { pmid: '', title: '', journal: '', year: '' }
  currentPage.value = 1
  loadData()
}

const handlePageChange = (event) => {
  currentPage.value = event.currentPage
  pageSize.value = event.pageSize
  loadData()
}

const handleSortChange = ({ field, order }) => {
  sortParams.value = {
    field: field || 'pmid',
    order: order || 'asc'
  }
  currentPage.value = 1
  loadData()
}

watch([currentPage, pageSize], () => {
  loadData()
})
</script>
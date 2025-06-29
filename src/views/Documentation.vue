<template>
  <v-main>
    <v-container fluid class="mt-4">

      <v-row>
        <v-col cols="12">
          <v-card 
            flat
          >
            <v-breadcrumbs :items="breadcrumbs">
              <template v-slot:item="{ item }">
                <v-breadcrumbs-item
                >
                  
                  <span>
                    {{ item.title }}
                  </span>
                </v-breadcrumbs-item>
              </template>
            </v-breadcrumbs>
          </v-card>
        </v-col>
      </v-row>
      <!-- <v-row>
        <v-col cols="12">
          <aside>
            <div>
              <h3>文档目录</h3>
              <button @click="toggleSidebar">
                <i></i>
              </button>
            </div>
            
            <ul>
              <li v-for="(section, secIdx) in documentSections">
                <div @click="toggleSection(secIdx)">
                  <span>{{ section.title }}</span>
                  <i></i>
                </div>
                <ul>
                  <li v-for="(subSection, subIdx) in section.subSections" :key="subIdx">
                    <a href="#" @click.prevent="navigateToPage(subSection.page)">
                      <span>{{ subSection.title }}</span>
                      <span>{{ subSection.page }}</span>
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </aside>
        </v-col>
        
      </v-row> -->
      <div style="display: flex;flex-direction: row;justify-content: center;align-items: center;">
        
        <!-- PDF预览区域 -->
        <main>
          <div>
            <div>
              <button @click="prevPage" :disabled="currentPage === 1">
                上一页
              </button>
              <button @click="nextPage" :disabled="currentPage === totalPages">
                下一页
              </button>
              <span>
                第 <span>{{ currentPage }}</span> 页，共 <span>{{ totalPages }}</span> 页
              </span>
            </div>
          </div>
          
          <div ref="pdfContainer">
            <div v-if="loading">
              <div></div>
            </div>
            
            <div v-if="pdfLoadError">
              <div>
                <i></i>
              </div>
              <h3>PDF加载失败</h3>
              <p >{{ pdfLoadError }}</p>
              <button @click="reloadPdf">
                <i></i>重新加载
              </button>
            </div>
            
            <div ref="pdfViewer">
              <!-- PDF页面将在这里动态渲染 -->
            </div>
          </div>
        </main>
      </div>

    </v-container>
  </v-main>
</template>

<style scoped>
  /* 自定义表格样式：无边框，仅行间分隔线 */
  .v-table.no-border {
    border: none !important;
    background: transparent;
  }
  .v-table.no-border tbody tr {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  }
  .v-table.no-border tbody tr:last-child {
    border-bottom: none;
  }
  .table-row {
    transition: background-color 0.2s ease;
  }
  .table-row:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  /* 字体和颜色 */
  .text-h6 {
    color: #1a3c5e;
  }
  .text-subtitle-1 {
    color: #1a3c5e;
  }
  .text-body-1 {
    color: #2e4b6b;
  }

  /* 表格单元格内边距 */
  td {
    padding: 16px 20px;
  }

  /* 扩展面板标题和背景 */

  .v-expansion-panel-title {
    color: #1a3c5e;
    border-radius: 8px;
    transition: background-color 0.2s ease;
  }
  .v-expansion-panel-title:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
  /* 自定义样式 */
.pdf-container {
  overflow: auto;
}

.pdf-viewer {
  transition: transform 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.toc-item {
  cursor: pointer;
}

.toc-item:hover {
  background-color: #f0f0f0;
}

.sidebar-collapsed {
  width: 4rem !important;
  transition: width 0.3s ease;
}

.sidebar-collapsed .toc-text {
  display: none;
}

/* 导航栏高亮样式 */
.active-section {
  background-color: #e8f0fe !important;
  color: #1a73e8;
  font-weight: 500;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>

<script setup>
  import { ref, onMounted, watch, computed, nextTick, toRaw} from 'vue';
  import * as pdfjsLib from 'pdfjs-dist';
  // import workerSrc from 'pdfjs-dist/build/pdf.worker.min?url';
  import 'pdfjs-dist/web/pdf_viewer.css'
  import { VxeTable, VxeColumn } from 'vxe-table';
  import { useRoute } from 'vue-router';
  import axios from 'axios';
  import * as d3 from 'd3'
  
  // 配置PDF.js（使用3.4.120版本确保兼容性）
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

  import { debounce } from 'lodash'

  import VxeUI from 'vxe-pc-ui';
  import 'vxe-pc-ui/lib/style.css';
  import 'vxe-table/lib/style.css';
  // Reactive state for variant details
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
    ])

const pdfContainer = ref(null)
const pdfViewer = ref(null)
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(0)
const zoom = ref(1.5)
const sidebarCollapsed = ref(false)
const pdfLoadError = ref(null)
const pdfDocument = ref(null)

// PDF文件路径（指向Document-V1.pdf）
const pdfUrl = './src/assets/Document-V1.pdf'

// 基于Document-V1.pdf内容构建的目录结构（根据文档段落内容手动映射页面）
const documentSections = ref([
  {
    id: 1,
    title: '1. 引言 (Introduction)',
    expanded: true,
    page: 1,
    subSections: []
  },
  {
    id: 2,
    title: '2. 数据收集与处理 (Data Collection and Processing)',
    expanded: false,
    page: 3,
    subSections: [
      { id: 21, title: '2.1 数据收集 (Data collection)', page: 3 },
      { id: 22, title: '2.2 数据处理 (Processing)', page: 8 },
      { id: 23, title: '2.3 软件和外部资源 (Software and external resources)', page: 12 }
    ]
  },
  {
    id: 3,
    title: '3. 数据策划 (Data Curation)',
    expanded: false,
    page: 14,
    subSections: [
      { id: 31, title: '3.1 策划模型 (Curation model)', page: 14 },
      { id: 32, title: '3.2 MAVE定量校准 (MAVE quantitative calibration)', page: 15 }
    ]
  },
  {
    id: 4,
    title: '4. 数据库使用 (Database Usage)',
    expanded: false,
    page: 18,
    subSections: [
      { id: 41, title: '4.1 浏览模块 (Browser module)', page: 18 },
      { id: 42, title: '4.2 搜索模块 (Search Module)', page: 19 },
      { id: 43, title: '4.3 可视化模块 (Visualization module)', page: 20 },
      { id: 44, title: '4.4 分析模块 (Analysis module)', page: 22 }
    ]
  }
])

// 加载PDF文件
const loadPdf = async () => {
  try {
    loading.value = true
    pdfLoadError.value = null
    
    // 验证PDF路径
    if (!pdfUrl) {
      throw new Error('未设置Document-V1.pdf路径')
    }
    
    // 加载PDF文档
    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      disableFontFace: true, // 禁用字体加载以提高兼容性
      verbosity: pdfjsLib.VerbosityLevel.ERRORS // 只显示错误信息
    })
    
    pdfDocument.value = await loadingTask.promise
    totalPages.value = pdfDocument.value.numPages
    
    // 渲染第一页
    await renderPage(1)
    
    loading.value = false
  } catch (error) {
    console.error('PDF加载错误:', error)
    pdfLoadError.value = error.message || '无法加载Document-V1.pdf'
    loading.value = false
  }
}

// 渲染PDF页面
const renderPage = async (pageNum) => {
  if (!pdfDocument.value) return
  
  try {
    const page = await toRaw(pdfDocument.value).getPage(pageNum)
    const viewport = page.getViewport({ scale: zoom.value })
    
    // 创建画布
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    // 添加页码指示器
    const pageIndicator = document.createElement('div')
    pageIndicator.className = 'text-center text-gray-500 text-sm py-2 bg-gray-50'
    pageIndicator.textContent = `第 ${pageNum} 页`
    
    // 清空并添加新内容
    if (pdfViewer.value) {
      pdfViewer.value.innerHTML = ''
      pdfViewer.value.appendChild(canvas)
      pdfViewer.value.appendChild(pageIndicator)
    }
    
    // 渲染页面
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }
    
    await page.render(renderContext).promise
    currentPage.value = pageNum
    
    // 更新导航栏高亮状态
    updateNavHighlight()
  } catch (error) {
    console.error('页面渲染错误:', error)
    pdfLoadError.value = `第${pageNum}页渲染失败: ${error.message}`
  }
}

// 导航到指定页面
const navigateToPage = async (pageNum) => {
  if (pageNum < 1 || pageNum > totalPages.value) return
  
  try {
    loading.value = true
    
    // 确保PDF已加载
    if (!pdfDocument.value) {
      await loadPdf()
    }
    
    await renderPage(pageNum)
    
    // 平滑滚动到视图中心
    await nextTick()
    if (pdfViewer.value) {
      pdfViewer.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    
    loading.value = false
  } catch (error) {
    console.error('页面导航错误:', error)
    pdfLoadError.value = `导航到第${pageNum}页失败: ${error.message}`
    loading.value = false
  }
}

// 更新导航栏高亮状态
const updateNavHighlight = () => {
  // 重置所有章节高亮
  documentSections.value.forEach(section => {
    section.active = false
    section.subSections.forEach(sub => {
      sub.active = false
    })
  })
  
  // 找到当前页面对应的章节
  let matchedSection = null
  documentSections.value.forEach(section => {
    if (section.page === currentPage.value) {
      section.active = true
      matchedSection = section
    } else {
      section.subSections.forEach(sub => {
        if (sub.page === currentPage.value) {
          sub.active = true
          matchedSection = section
        }
      })
    }
  })
  
  // 如果找到匹配的章节，则展开它
  if (matchedSection && !matchedSection.expanded) {
    matchedSection.expanded = true
  }
}

// 重新加载PDF
const reloadPdf = () => {
  pdfDocument.value = null
  loadPdf()
}

// 生命周期钩子
onMounted(() => {
  nextTick(() => {
    loadPdf()
  })
})

// 切换侧边栏展开/折叠状态
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 切换章节展开/折叠状态
const toggleSection = (index) => {
  documentSections.value[index].expanded = !documentSections.value[index].expanded
}

// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    navigateToPage(currentPage.value - 1)
  }
}

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    navigateToPage(currentPage.value + 1)
  }
}

// 放大
const zoomIn = () => {
  zoom.value = Math.min(zoom.value + 0.1, 2.0)
  navigateToPage(currentPage.value)
}

// 缩小
const zoomOut = () => {
  zoom.value = Math.max(zoom.value - 0.1, 0.5)
  navigateToPage(currentPage.value)
}

// 重置缩放
const resetZoom = () => {
  zoom.value = 1
  navigateToPage(currentPage.value)
}
  
</script>
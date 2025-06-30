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

      <div style="margin-top: 20px;">
        <div v-if="loading">
          <div></div>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="error">
          <p><i></i>{{ error }}</p>
          <button @click="retry">
            重试
          </button>
        </div>
        <div v-else v-html="htmlContent"></div>
        <!-- <div v-else class="htm-content">
          <iframe
            ref="iframeRef"
            :srcdoc="htmlContent"
            :sandbox="sandboxOptions"
            class="html-frame"
            style="width: 100%; height: calc(100vh - 273px); border: none;"
            @load="handleLoad"
            @error="handleError"
          ></iframe>
        </div> -->
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

</style>

<script setup>
  import { ref, onMounted, watch, computed } from 'vue';
  import { VxeTable, VxeColumn } from 'vxe-table';
  import { useRoute } from 'vue-router';
  import axios from 'axios';
  import * as d3 from 'd3'

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

  // 组件内部状态
  const iframeRef = ref(null)
  const loading = ref(true)
  const error = ref('')
  const htmlContent = ref('')

  // 组件props
  const props = defineProps({
    // 默认HTML内容
    defaultHtml: {
      type: String,
      default: `
        <div style="padding: 20px; text-align: center;">
          <h3>HTML内容示例</h3>
          <p>这是一个默认的HTML内容展示</p>
        </div>
      `
    },
    // 是否允许用户编辑HTML
    editable: {
      type: Boolean,
      default: false
    },
    // 沙箱选项
    sandbox: {
      type: String,
      default: 'allow-same-origin allow-scripts'
    }
  })

  // 计算属性 - 沙箱选项
  const sandboxOptions = computed(() => {
    // 如果允许编辑，则添加allow-modals以支持alert/confirm
    if (props.editable) {
      return props.sandbox + ' allow-modals'
    }
    return props.sandbox
  })

  // 初始化
  onMounted(() => {
    initViewer()
  })

  // 初始化查看器
  const initViewer = async () => {
    loading.value = true
    error.value = ''
    
    try {
      // 设置默认HTML内容
      const response = await fetch('/clinmave/files/Document-V1.htm')
      const buffer = await response.arrayBuffer()
    
      // 强制解码
      const decoder = new TextDecoder('GBK') // 或者使用 'utf-8' 根据实际情况
      htmlContent.value = decoder.decode(buffer).replace(
        /src="(Document-V1\.files\/[^"]+)"/g, 
        `src="./images/image.png" style="position: relative; left: 45%; filter: opacity(1) drop-shadow(0 0 0 transparent); mix-blend-mode: multiply;"` // 替换图片路径
      )
      // htmlContent.value = await response.text() || props.defaultHtml
      
      // 如果需要从本地存储或其他地方加载HTML，可以在这里处理
      // 例如: const savedHtml = localStorage.getItem('customHtml')
      // if (savedHtml) htmlContent.value = savedHtml
      
      loading.value = false
    } catch (e) {
      handleError(e)
    }
  }

  // 处理加载完成事件
  const handleLoad = () => {
    loading.value = false
    // 可以在这里执行iframe加载完成后的操作
  }

  // 处理错误
  const handleError = (err) => {
    loading.value = false
    error.value = err.message || '加载HTML内容时出错'
    console.error('HTM加载错误:', err)
  }

  // 重试加载
  const retry = () => {
    initViewer()
  }

  // 如果允许编辑，提供编辑功能
  const editHtml = () => {
    if (!props.editable) return
    
    const newHtml = prompt('编辑HTML内容:', htmlContent.value)
    if (newHtml !== null) {
      htmlContent.value = newHtml
      // 如果需要保存编辑内容，可以在这里处理
      // 例如: localStorage.setItem('customHtml', newHtml)
    }
  }
  
</script>
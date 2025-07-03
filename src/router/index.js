import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Variant from '@/views/Variant.vue'
import Variants from '@/views/Variants.vue'
import datasets from '@/views/Datasets.vue'
import Dataset from '@/views/Dataset.vue'
import genes from '@/views/Genes.vue'
import studies from '@/views/Studies.vue'
import gene from '@/views/Gene.vue'
import VisualizeByGene from '@/views/VisualizeByGene.vue' 
import Statistics from '@/views/Statistics.vue'
import DocumentationHtm from '@/views/Documentation.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/browse/variant/:identifier',
      name: 'variant',
      component: Variant,
    },
    {
      path: '/browse/variants',
      name: 'variants',
      component: Variants,
    },
    {
      path: '/browse/datasets',
      name: 'datasets',
      component: datasets,
    },
    {
      path: '/browse/dataset/:datasetId',
      name: 'dataset',
      component: Dataset,
    },
    {
      path: '/browse/genes',
      name: 'genes',
      component: genes,
    },
    {
      path: '/browse/gene/:geneName',
      name: 'gene',
      component: gene,
    },
    {
      path: '/browse/mave_techniques',
      name: 'mave_techniques',
      component: () => import('@/views/MaveTechniques.vue'),
    },
    {
      path: '/browse/mave_techniques/:maveTechnique',
      name: 'mave_summary',
      component: () => import('@/views/MaveSummary.vue'),
    },
    {
      path: '/browse/studies',
      name: 'studies',
      component: studies,
    },
    {
      path: '/visualize/gene',
      name: 'VisualizeByGene',
      component: VisualizeByGene,
    },
    {
      path: '/visualize/dataset',
      name: 'VisualizeByDataset',
      component: () => import('@/views/VisualizeByDataset.vue'),
    },
    {
      path: '/analysis/dataset',
      name: 'AnalysisByDataset',
      component: () => import('@/views/AnalysisByDataset.vue'),
    },
    {
      path: '/statistics',
      name: 'Statistics',
      component: Statistics,
    },
    {
      path: '/document',
      name: 'Documentation-htm',
      component: DocumentationHtm,
    }
  ],
})

export default router

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
       meta: {
        title: 'ClinMAVE-Home'
      }
    },
    {
      path: '/browse/variant/:identifier',
      name: 'variant',
      component: Variant,
      meta: {
        title: 'ClinMAVE-Variant'
      }
    },
    {
      path: '/browse/variants',
      name: 'variants',
      component: Variants,
      meta: {
        title: 'ClinMAVE-Browse-Variants'
      }
    },
    {
      path: '/browse/datasets',
      name: 'datasets',
      component: datasets,
      meta: {
        title: 'ClinMAVE-Browse-Datasets'
      }
    },
    {
      path: '/browse/dataset/:datasetId',
      name: 'dataset',
      component: Dataset,
      meta: {
        title: 'ClinMAVE-Dataset'
      }
    },
    {
      path: '/browse/genes',
      name: 'genes',
      component: genes,
      meta: {
        title: 'ClinMAVE-Browse-Genes'
      }
    },
    {
      path: '/browse/gene/:geneName',
      name: 'gene',
      component: gene,
      meta: {
        title: 'ClinMAVE-Gene'
      }
    },
    {
      path: '/browse/mave_techniques',
      name: 'mave_techniques',
      component: () => import('@/views/MaveTechniques.vue'),
      meta: {
        title: 'ClinMAVE-Browse-Mave Techniques'
      }
    },
    {
      path: '/browse/mave_techniques/:maveTechnique',
      name: 'mave_summary',
      component: () => import('@/views/MaveSummary.vue'),
      meta: {
        title: 'ClinMAVE-MAVE Technique'
      }
    },
    {
      path: '/browse/studies',
      name: 'studies',
      component: studies,
      meta: {
        title: 'ClinMAVE-Browse-Studies'
      }
    },
    {
      path: '/visualize/gene',
      name: 'VisualizeByGene',
      component: VisualizeByGene,
      meta: {
        title: 'ClinMAVE-Visualize-Gene'
      }
    },
    {
      path: '/visualize/dataset',
      name: 'VisualizeByDataset',
      component: () => import('@/views/VisualizeByDataset.vue'),
      meta: {
        title: 'ClinMAVE-Visualize-Dataset'
      }
    },
    {
      path: '/analysis/dataset',
      name: 'AnalysisByDataset',
      component: () => import('@/views/AnalysisByDataset.vue'),
      meta: {
        title: 'ClinMAVE-Analysis-Dataset'
      }
    },
    {
      path: '/statistics',
      name: 'Statistics',
      component: Statistics,
      meta: {
        title: 'ClinMAVE-Statistics'
      }
    },
    {
      path: '/document',
      name: 'Documentation-htm',
      component: DocumentationHtm,
      meta: {
        title: 'ClinMAVE-Document'
      }
    }
  ],
})

export default router

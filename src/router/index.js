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
import VisualizeByDataset from '@/views/VisualizeByDataset.vue'
// import ENCODESearch from '@/views/ENCODESearch.vue'
import Statistics from '@/views/Statistics.vue'
import Documentation from '@/views/Documentation.vue'
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
      path: '/browse/mutagenesis_strategies',
      name: 'mutagenesis_strategies',
      component: () => import('@/views/MutagenesisStrategies.vue'),
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
    // {
    //   path: '/encode',
    //   name: 'ENCODESearch',
    //   component: ENCODESearch,
    // },
    {
      path: '/statistics',
      name: 'Statistics',
      component: Statistics,
    },
    {
      path: '/document',
      name: 'Documentation',
      component: Documentation,
    }
  ],
})

export default router

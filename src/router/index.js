import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import VariantPage from '@/views/VariantPage.vue'
import ScoreDensity from '@/views/ScoreDensity.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/variant',
      name: 'variant',
      component: VariantPage,
    },
    {
      path: '/density',
      name: 'density',
      component: ScoreDensity,
    },
    {
      path: '/downloads',
      name: 'downloads',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/Downloads.vue'),
    },
  ],
})

export default router

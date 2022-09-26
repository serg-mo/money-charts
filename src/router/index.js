import { createRouter, createWebHistory } from 'vue-router'
import DndView from '../views/DndView.vue'
import ChartView from '../views/ChartView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DndView
    },
    {
      path: '/chart',
      name: 'chart',
      component: ChartView
    }
  ]
})

export default router

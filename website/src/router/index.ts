import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ServiceDetailView from '@/views/ServiceDetailView.vue'
import NosotrosView from '@/views/NosotrosView.vue'
import ContactoView from '@/views/ContactoView.vue'
import CatalogoView from '@/views/CatalogoView.vue'
import CatalogoProductoView from '@/views/CatalogoProductoView.vue'
import PruebaView from '@/views/PruebaView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/nosotros',
      name: 'nosotros',
      component: NosotrosView,
    },
    {
      path: '/contacto',
      name: 'contacto',
      component: ContactoView,
    },
    {
      path: '/servicios/:slug',
      name: 'service-detail',
      component: ServiceDetailView,
    },
    {
      path: '/catalogo',
      name: 'catalogo',
      component: CatalogoView,
    },
    {
      path: '/prueba',
      name: 'prueba',
      component: PruebaView,
    },
    {
      path: '/catalogo/:slug',
      name: 'catalogo-producto',
      component: CatalogoProductoView,
    },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth', top: 80 }
    }
    return { top: 0, behavior: 'smooth' }
  },
})

export default router

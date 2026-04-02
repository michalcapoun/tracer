import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
    { path: '/', component: HomeView },
    { path: '/trip/new', component: () => import('../views/NewTripView.vue') },
    { path: '/trip/:id', component: () => import('../views/TripView.vue') },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.public) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return '/login'
})

export default router

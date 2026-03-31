import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: '/trip/new', component: () => import('../views/NewTripView.vue') },
    { path: '/trip/:id', component: () => import('../views/TripView.vue') },
  ],
})

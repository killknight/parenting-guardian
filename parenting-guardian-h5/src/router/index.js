import { createRouter, createWebHashHistory } from 'vue-router'
import { useAppStore } from '../store'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/location',
    name: 'Location',
    component: () => import('../views/Location.vue')
  },
  {
    path: '/control',
    name: 'Control',
    component: () => import('../views/Control.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue')
  },
  {
    path: '/alert',
    name: 'Alert',
    component: () => import('../views/Alert.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const store = useAppStore()
  const publicPages = ['/login', '/register']
  if (!publicPages.includes(to.path) && !store.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router

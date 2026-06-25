<template>
  <div class="app-wrapper">
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-content">
        <router-view />
        <div class="bottom-nav" v-if="showNav">
          <div 
            v-for="item in navList" 
            :key="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            @click="goTo(item.path)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from './store'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const navList = computed(() => {
  const parentNav = [
    { path: '/home', name: '首页', icon: '🏠' },
    { path: '/location', name: '位置', icon: '📍' },
    { path: '/control', name: '控制', icon: '🎛️' },
    { path: '/settings', name: '我的', icon: '⚙️' }
  ]
  const childNav = [
    { path: '/home', name: '首页', icon: '🏠' },
    { path: '/location', name: '位置', icon: '📍' },
    { path: '/alert', name: '求助', icon: '🆘' },
    { path: '/settings', name: '我的', icon: '⚙️' }
  ]
  return store.isParent ? parentNav : childNav
})

const showNav = computed(() => {
  return store.isLoggedIn && !['/login', '/register'].includes(route.path)
})

const isActive = (path) => route.path === path

const goTo = (path) => router.push(path)
</script>

<style scoped>
.app-wrapper {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1a1a1a;
  padding: 20px;
}
</style>

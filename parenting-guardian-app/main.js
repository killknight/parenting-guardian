/**
 * 亲子守护 - 应用入口文件
 */
import App from './App.vue'
import store from './store'

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  return {
    app
  }
}
// #endif

// #ifndef VUE3
const app = Vue.createApp(App)
app.use(store)
app.mount('#app')
// #endif

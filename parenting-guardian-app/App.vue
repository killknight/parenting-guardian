<template>
  <view class="app">
    <!-- #ifdef VUE3 -->
    <slot />
    <!-- #endif -->
    <!-- #ifndef VUE3 -->
    <slot name="default"></slot>
    <!-- #endif -->
  </view>
</template>

<script>
/**
 * 亲子守护 App 主组件
 */
export default {
  onLaunch() {
    console.log('App Launch')
    this.initApp()
  },
  onShow() {
    console.log('App Show')
    // 检查登录状态
    this.checkLoginStatus()
  },
  onHide() {
    console.log('App Hide')
  },
  methods: {
    // 初始化应用
    initApp() {
      // 获取本地存储的用户信息
      const userInfo = uni.getStorageSync('userInfo')
      const token = uni.getStorageSync('token')

      if (userInfo && token) {
        // 已登录，更新 store
        this.$store.commit('SET_USER_INFO', userInfo)
        this.$store.commit('SET_TOKEN', token)
      }

      // 检查角色
      const role = uni.getStorageSync('userRole')
      if (role) {
        this.$store.commit('SET_ROLE', role)
      }
    },

    // 检查登录状态
    checkLoginStatus() {
      const token = uni.getStorageSync('token')
      if (!token) {
        // 未登录，跳转到登录页
        uni.reLaunch({
          url: '/pages/login/login'
        })
      }
    }
  }
}
</script>

<style lang="scss">
@import '@/common/css/common.scss';
.app {
  width: 100%;
  height: 100%;
}
</style>

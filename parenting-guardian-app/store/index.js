/**
 * Vue 3 Store 状态管理
 */
import { createStore } from 'vuex'

const store = createStore({
  state: {
    // 用户信息
    userInfo: null,
    // 登录令牌
    token: null,
    // 用户角色: PARENT / CHILD
    role: null,
    // 绑定的孩子列表（家长端）
    children: [],
    // 当前选中的孩子
    currentChild: null,
    // 设备信息
    deviceInfo: null,
    // 应用设置
    settings: {
      locationInterval: 60000,      // 位置上报间隔（默认60秒）
      pollInterval: 60000,         // 指令轮询间隔（默认60秒）
    }
  },

  mutations: {
    // 设置用户信息
    SET_USER_INFO(state, userInfo) {
      state.userInfo = userInfo
      uni.setStorageSync('userInfo', userInfo)
    },

    // 设置令牌
    SET_TOKEN(state, token) {
      state.token = token
      uni.setStorageSync('token', token)
    },

    // 设置角色
    SET_ROLE(state, role) {
      state.role = role
      uni.setStorageSync('userRole', role)
    },

    // 设置孩子列表
    SET_CHILDREN(state, children) {
      state.children = children
    },

    // 设置当前孩子
    SET_CURRENT_CHILD(state, child) {
      state.currentChild = child
      uni.setStorageSync('currentChild', child)
    },

    // 设置设备信息
    SET_DEVICE_INFO(state, deviceInfo) {
      state.deviceInfo = deviceInfo
    },

    // 更新设置
    UPDATE_SETTINGS(state, settings) {
      state.settings = { ...state.settings, ...settings }
      uni.setStorageSync('appSettings', state.settings)
    },

    // 清除登录信息
    CLEAR_LOGIN(state) {
      state.userInfo = null
      state.token = null
      state.role = null
      state.children = []
      state.currentChild = null
      uni.removeStorageSync('userInfo')
      uni.removeStorageSync('token')
      uni.removeStorageSync('userRole')
      uni.removeStorageSync('currentChild')
    }
  },

  getters: {
    // 是否已登录
    isLoggedIn: state => !!state.token,
    // 是否是家长
    isParent: state => state.role === 'PARENT',
    // 是否是孩子
    isChild: state => state.role === 'CHILD',
    // 获取用户ID
    userId: state => state.userInfo?._id,
    // 获取孩子ID
    childId: state => state.currentChild?._id || state.userInfo?._id
  },

  actions: {
    // 登录
    async login({ commit }, { phone, password }) {
      try {
        const res = await uniCloud.callFunction({
          name: 'auth',
          data: {
            action: 'login',
            data: { phone, password }
          }
        })

        if (res.result.success) {
          commit('SET_TOKEN', res.result.data.token)
          commit('SET_USER_INFO', res.result.data)
          commit('SET_ROLE', res.result.data.role)
          return { success: true, data: res.result.data }
        } else {
          return { success: false, error: res.result.error }
        }
      } catch (e) {
        return { success: false, error: e.message }
      }
    },

    // 登出
    logout({ commit }) {
      commit('CLEAR_LOGIN')
      uni.reLaunch({ url: '/pages/login/login' })
    },

    // 选择孩子
    selectChild({ commit, state }, child) {
      commit('SET_CURRENT_CHILD', child)
      // 如果是孩子端，切换设备
      if (state.role === 'CHILD') {
        // 更新本地设备信息
        commit('SET_DEVICE_INFO', { userId: child._id })
      }
    }
  }
})

export default store

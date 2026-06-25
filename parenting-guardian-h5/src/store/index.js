import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    userInfo: null,
    token: '',
    role: 'parent',
    isLoggedIn: false,
    currentChild: {
      _id: 'child_001',
      nickname: '小明',
      phone: '138****8888'
    },
    mockData: {
      todayUsage: {
        totalDuration: 7200,
        unlockCount: 35,
        screenOnTime: 5400
      },
      appRanking: [
        { packageName: 'com.tencent.mm', appName: '微信', duration: 3600 },
        { packageName: 'com.ss.android.ugc.aweme', appName: '抖音', duration: 2400 },
        { packageName: 'com.tencent.qq', appName: 'QQ', duration: 1800 },
        { packageName: 'com.tencent.tmgp.sgame', appName: '王者荣耀', duration: 1200 },
        { packageName: 'com.baidu.searchbox', appName: '百度', duration: 600 }
      ],
      currentApp: '微信',
      currentAddress: '北京市朝阳区建国路88号',
      lastLocationTime: Date.now() - 120000,
      childOnline: true,
      unreadAlertCount: 2,
      guardianName: '爸爸',
      commands: [
        { _id: 'cmd1', type: 'lock', status: 'executed', createTime: Date.now() - 3600000, duration: 1800, message: '该休息了' },
        { _id: 'cmd2', type: 'unlock', status: 'executed', createTime: Date.now() - 1800000 }
      ],
      locationHistory: [
        { latitude: 39.9042, longitude: 116.4074, timestamp: Date.now() - 7200000, address: '学校' },
        { latitude: 39.9142, longitude: 116.4174, timestamp: Date.now() - 3600000, address: '回家路上' },
        { latitude: 39.9082, longitude: 116.4084, timestamp: Date.now() - 120000, address: '北京市朝阳区建国路88号' }
      ],
      alerts: [
        { _id: 'a1', type: 'sos', title: '紧急求助', content: '孩子发送了紧急求助', createTime: Date.now() - 600000, readStatus: false },
        { _id: 'a2', type: 'geofence_out', title: '离开围栏', content: '孩子离开了学校围栏', createTime: Date.now() - 3600000, readStatus: false }
      ],
      settings: {
        pollInterval: 60,
        autoReportLocation: true,
        foregroundService: true,
        appMonitor: true
      }
    }
  }),
  getters: {
    isParent: (state) => state.role === 'parent',
    isChild: (state) => state.role === 'child'
  },
  actions: {
    login(role) {
      this.role = role
      this.isLoggedIn = true
      this.userInfo = {
        _id: role === 'parent' ? 'parent_001' : 'child_001',
        phone: '138****8888',
        nickname: role === 'parent' ? '家长' : '小明',
        role: role
      }
    },
    logout() {
      this.isLoggedIn = false
      this.userInfo = null
      this.token = ''
    },
    setRole(role) {
      this.role = role
    }
  }
})

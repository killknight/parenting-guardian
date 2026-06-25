<template>
  <view class="home-page">
    <!-- 家长端首页 -->
    <view v-if="isParent" class="parent-home">
      <!-- 头部 -->
      <view class="home-header">
        <view class="header-left">
          <text class="child-name">{{ currentChild?.nickname || '孩子' }}</text>
          <text class="child-status">
            <text class="status-dot" :class="{ online: childOnline }"></text>
            {{ childOnline ? '在线' : '离线' }}
          </text>
        </view>
        <view class="header-right">
          <text class="alert-badge" v-if="unreadAlertCount > 0">{{ unreadAlertCount }}</text>
          <text class="icon-btn" @tap="goAlert">🔔</text>
        </view>
      </view>

      <!-- 概览卡片 -->
      <view class="overview-cards">
        <view class="overview-card">
          <view class="card-icon">📱</view>
          <view class="card-info">
            <text class="card-value">{{ formatDuration(todayUsage.totalDuration) }}</text>
            <text class="card-label">今日使用时长</text>
          </view>
        </view>
        <view class="overview-card">
          <view class="card-icon">🔓</view>
          <view class="card-info">
            <text class="card-value">{{ todayUsage.unlockCount || 0 }}</text>
            <text class="card-label">解锁次数</text>
          </view>
        </view>
        <view class="overview-card">
          <view class="card-icon">⚡</view>
          <view class="card-info">
            <text class="card-value">{{ currentApp || '无' }}</text>
            <text class="card-label">正在使用</text>
          </view>
        </view>
      </view>

      <!-- 位置卡片 -->
      <view class="location-card card" @tap="goLocation">
        <view class="card-title">
          <text>📍 当前位置</text>
          <text class="refresh-time">{{ relativeTime(lastLocationTime) }}</text>
        </view>
        <view class="location-info">
          <text class="location-address">{{ currentAddress || '正在获取...' }}</text>
          <text class="location-status" :class="{ online: childOnline }">
            {{ childOnline ? '实时定位中' : '设备离线' }}
          </text>
        </view>
      </view>

      <!-- 应用使用排行 -->
      <view class="usage-card card">
        <view class="card-title">
          <text>📊 今日应用使用</text>
          <text class="more-btn" @tap="goUsageDetail">查看详情 ></text>
        </view>
        <view class="app-list" v-if="appRanking.length > 0">
          <view
            class="app-item"
            v-for="(app, index) in appRanking"
            :key="app.packageName"
          >
            <view class="app-rank">{{ index + 1 }}</view>
            <view class="app-icon">{{ getAppIcon(app.appName) }}</view>
            <view class="app-info">
              <text class="app-name">{{ app.appName }}</text>
              <view class="app-progress">
                <view
                  class="progress-bar"
                  :style="{ width: getProgressWidth(app.duration) + '%' }"
                  :class="getProgressClass(index)"
                ></view>
              </view>
            </view>
            <view class="app-duration">{{ formatDurationShort(app.duration) }}</view>
          </view>
        </view>
        <view class="empty" v-else>
          <text class="empty-text">暂无数据</text>
        </view>
      </view>

      <!-- 快捷操作 -->
      <view class="quick-actions">
        <view class="action-item danger" @tap="quickLock">
          <text class="action-icon">🚫</text>
          <text class="action-text">一键锁屏</text>
        </view>
        <view class="action-item" @tap="goControl">
          <text class="action-icon">🎛️</text>
          <text class="action-text">远程控制</text>
        </view>
      </view>
    </view>

    <!-- 孩子端首页 -->
    <view v-else class="child-home">
      <!-- 头部 -->
      <view class="home-header child-header">
        <view class="header-left">
          <text class="user-name">{{ userInfo?.nickname || '孩子' }}</text>
          <text class="guardian-info">已绑定家长：{{ guardianName || '爸爸' }}</text>
        </view>
        <view class="sos-btn" @tap="handleSOS">
          <text>SOS</text>
        </view>
      </view>

      <!-- 使用统计卡片 -->
      <view class="usage-card card">
        <view class="card-title">📊 今日使用情况</view>
        <view class="child-usage">
          <view class="usage-circle">
            <text class="usage-value">{{ formatDuration(todayUsage.totalDuration) }}</text>
            <text class="usage-label">今日使用时长</text>
          </view>
        </view>
      </view>

      <!-- 使用排行 -->
      <view class="app-card card">
        <view class="card-title">📱 使用排行</view>
        <view class="app-list" v-if="appRanking.length > 0">
          <view
            class="app-item"
            v-for="(app, index) in appRanking.slice(0, 3)"
            :key="app.packageName"
          >
            <text class="app-rank">{{ index + 1 }}</text>
            <text class="app-name">{{ app.appName }}</text>
            <text class="app-duration">{{ formatDurationShort(app.duration) }}</text>
          </view>
        </view>
        <view class="empty" v-else>
          <text class="empty-text">今日还未使用手机</text>
        </view>
      </view>

      <!-- 限额提醒 -->
      <view class="limit-card card" v-if="limitWarning">
        <view class="limit-header">
          <text class="limit-icon">⚠️</text>
          <text class="limit-title">家长设置的应用限额</text>
        </view>
        <view class="limit-info">
          <text class="limit-app">{{ limitWarning.appName }}</text>
          <text class="limit-remaining">剩余 {{ formatDuration(limitWarning.remaining * 60) }}</text>
        </view>
        <view class="limit-progress">
          <view class="progress">
            <view
              class="progress-bar progress-warning"
              :style="{ width: limitWarning.percent + '%' }"
            ></view>
          </view>
        </view>
      </view>

      <!-- 温馨提示 -->
      <view class="tips-card card">
        <text class="tips-icon">💡</text>
        <text class="tips-text">{{ tips }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import {
  getDailyUsage,
  getUsageRanking,
  getCurrentLocation,
  getChildren,
  sendLockCommand,
  sendSOS,
  getAlertList,
  readAlert
} from '@/api/index.js'
import { formatDuration, formatDurationShort, relativeTime, getToday } from '@/utils/index.js'

export default {
  data() {
    return {
      todayUsage: {
        totalDuration: 0,
        unlockCount: 0,
        screenOnTime: 0
      },
      appRanking: [],
      currentApp: '',
      currentAddress: '',
      lastLocationTime: null,
      childOnline: false,
      guardianName: '',
      limitWarning: null,
      unreadAlertCount: 0,
      tips: '适当休息，保护视力哦~',
      refreshTimer: null
    }
  },

  computed: {
    ...mapState(['userInfo', 'currentChild']),
    ...mapGetters(['isParent', 'isChild', 'userId', 'childId']),
    currentChild() {
      return this.$store.state.currentChild || this.userInfo
    }
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    // 开始定时刷新
    this.startRefresh()
  },

  onHide() {
    this.stopRefresh()
  },

  onPullDownRefresh() {
    this.loadData().finally(() => {
      uni.stopPullDownRefresh()
    })
  },

  methods: {
    // 加载数据
    async loadData() {
      if (this.isParent) {
        await this.loadParentData()
      } else {
        await this.loadChildData()
      }
    },

    // 加载家长端数据
    async loadParentData() {
      const childId = this.currentChild?._id
      if (!childId) return

      try {
        // 获取今日使用统计
        const [usageRes, rankingRes, locationRes, alertRes] = await Promise.all([
          getDailyUsage(getToday(), childId),
          getUsageRanking(getToday(), childId, 5),
          getCurrentLocation(childId),
          getAlertList()
        ])

        if (usageRes.success) {
          this.todayUsage = usageRes.data || {}
        }

        if (rankingRes.success) {
          this.appRanking = rankingRes.data || []
        }

        if (locationRes.success && locationRes.data) {
          this.currentAddress = locationRes.data.address
          this.lastLocationTime = locationRes.data.timestamp
          this.childOnline = locationRes.data.isOnline
        }

        if (alertRes.success) {
          const unreadList = (alertRes.data || []).filter(a => !a.isRead)
          this.unreadAlertCount = unreadList.length
        }
      } catch (e) {
        console.error('加载家长数据失败:', e)
      }
    },

    // 加载孩子端数据
    async loadChildData() {
      try {
        const [usageRes, rankingRes] = await Promise.all([
          getDailyUsage(getToday()),
          getUsageRanking(getToday(), null, 5)
        ])

        if (usageRes.success) {
          this.todayUsage = usageRes.data || {}
        }

        if (rankingRes.success) {
          this.appRanking = rankingRes.data || []
        }
      } catch (e) {
        console.error('加载孩子数据失败:', e)
      }
    },

    // 开始刷新
    startRefresh() {
      this.refreshTimer = setInterval(() => {
        if (this.isParent) {
          this.refreshChildStatus()
        }
      }, 60000) // 每分钟刷新一次
    },

    // 停止刷新
    stopRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },

    // 刷新孩子状态
    async refreshChildStatus() {
      if (!this.isParent) return

      const childId = this.currentChild?._id
      if (!childId) return

      try {
        const [locationRes, usageRes] = await Promise.all([
          getCurrentLocation(childId),
          getDailyUsage(getToday(), childId)
        ])

        if (locationRes.success && locationRes.data) {
          this.childOnline = locationRes.data.isOnline
          this.lastLocationTime = locationRes.data.timestamp
          this.currentAddress = locationRes.data.address
        }

        if (usageRes.success) {
          this.todayUsage = usageRes.data || {}
        }
      } catch (e) {
        console.error('刷新状态失败:', e)
      }
    },

    // 格式化时长
    formatDuration(seconds) {
      return formatDuration(seconds)
    },

    // 格式化时长（短）
    formatDurationShort(seconds) {
      return formatDurationShort(seconds)
    },

    // 相对时间
    relativeTime(time) {
      return relativeTime(time)
    },

    // 获取应用图标
    getAppIcon(appName) {
      const iconMap = {
        '微信': '💬',
        'QQ': '📱',
        '抖音': '🎵',
        '快手': '🎬',
        '王者荣耀': '🎮',
        '和平精英': '🔫',
        '百度': '🔍',
        '淘宝': '🛒',
        '京东': '📦',
        '支付宝': '💰'
      }
      return iconMap[appName] || '📱'
    },

    // 获取进度条宽度
    getProgressWidth(duration) {
      if (!this.appRanking.length) return 0
      const maxDuration = this.appRanking[0]?.duration || 1
      return Math.min((duration / maxDuration) * 100, 100)
    },

    // 获取进度条颜色
    getProgressClass(index) {
      const colors = ['progress-primary', 'progress-warning', 'progress-success', 'progress-danger']
      return colors[index % colors.length]
    },

    // 跳转到位置页面
    goLocation() {
      uni.switchTab({
        url: '/pages/location/index'
      })
    },

    // 跳转到使用详情
    goUsageDetail() {
      uni.navigateTo({
        url: '/pages/home/usage-detail'
      })
    },

    // 跳转到远程控制
    goControl() {
      uni.switchTab({
        url: '/pages/control/index'
      })
    },

    // 跳转到告警页面
    goAlert() {
      uni.navigateTo({
        url: '/pages/alert/index'
      })
    },

    // 快捷锁屏
    async quickLock() {
      const childId = this.currentChild?._id
      if (!childId) return

      uni.showModal({
        title: '确认锁屏',
        content: '确定要锁定孩子的设备吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '发送中...' })
              const result = await sendLockCommand(childId, 1800, '家长要求你休息一下')
              uni.hideLoading()

              if (result.success) {
                uni.showToast({ title: '锁屏已发送', icon: 'success' })
              } else {
                uni.showToast({ title: result.error || '发送失败', icon: 'none' })
              }
            } catch (e) {
              uni.hideLoading()
              uni.showToast({ title: '网络错误', icon: 'none' })
            }
          }
        }
      })
    },

    // 发起SOS
    async handleSOS() {
      uni.showModal({
        title: '紧急求助',
        content: '确定要向家长发送紧急求助吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '发送中...' })
              // 获取当前位置
              const location = await new Promise((resolve) => {
                uni.getLocation({
                  type: 'gcj02',
                  success: (loc) => resolve(loc),
                  fail: () => resolve(null)
                })
              })

              const result = await sendSOS({
                latitude: location?.latitude,
                longitude: location?.longitude,
                address: location?.address || ''
              })
              uni.hideLoading()

              if (result.success) {
                uni.showToast({ title: '求助已发送', icon: 'success' })
              } else {
                uni.showToast({ title: result.error || '发送失败', icon: 'none' })
              }
            } catch (e) {
              uni.hideLoading()
              uni.showToast({ title: '网络错误', icon: 'none' })
            }
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding-bottom: env(safe-area-inset-bottom);
}

/* ============ 通用头部 ============ */
.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 40rpx;
  background-color: #FFFFFF;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.child-name, .user-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #333333;
}

.child-status {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: #CCCCCC;
  margin-right: 8rpx;
}

.status-dot.online {
  background-color: #4CD964;
}

.header-right {
  position: relative;
}

.alert-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 32rpx;
  height: 32rpx;
  background-color: #FF3B30;
  color: #FFFFFF;
  font-size: 22rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.icon-btn {
  font-size: 48rpx;
}

/* ============ 概览卡片 ============ */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  padding: 30rpx 40rpx;
}

.overview-card {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.card-info {
  text-align: center;
}

.card-value {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  white-space: nowrap;
}

.card-label {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 8rpx;
}

/* ============ 通用卡片 ============ */
.card {
  margin: 0 40rpx 30rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.more-btn {
  font-size: 24rpx;
  color: #007AFF;
}

.refresh-time {
  font-size: 22rpx;
  color: #999999;
  font-weight: normal;
}

/* ============ 位置卡片 ============ */
.location-card {
  .location-info {
    margin-top: 20rpx;
  }

  .location-address {
    display: block;
    font-size: 28rpx;
    color: #333333;
    margin-bottom: 10rpx;
  }

  .location-status {
    font-size: 24rpx;
    color: #999999;
  }

  .location-status.online {
    color: #4CD964;
  }
}

/* ============ 应用列表 ============ */
.app-list {
  margin-top: 20rpx;
}

.app-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F0F0F0;

  &:last-child {
    border-bottom: none;
  }
}

.app-rank {
  width: 40rpx;
  height: 40rpx;
  background-color: #F5F5F5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #666666;
  margin-right: 20rpx;
}

.app-rank:nth-child(1) {
  background-color: #FFD700;
  color: #FFFFFF;
}

.app-rank:nth-child(2) {
  background-color: #C0C0C0;
  color: #FFFFFF;
}

.app-rank:nth-child(3) {
  background-color: #CD7F32;
  color: #FFFFFF;
}

.app-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.app-info {
  flex: 1;
  min-width: 0;
}

.app-name {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 10rpx;
}

.app-progress {
  height: 8rpx;
  background-color: #F0F0F0;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 4rpx;
  transition: width 0.3s;
}

.app-duration {
  font-size: 26rpx;
  color: #666666;
  margin-left: 20rpx;
  white-space: nowrap;
}

/* ============ 快捷操作 ============ */
.quick-actions {
  display: flex;
  gap: 30rpx;
  padding: 30rpx 40rpx;
}

.action-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  transition: all 0.3s;

  &:active {
    transform: scale(0.95);
  }
}

.action-item.danger {
  background-color: #FFF0F0;
}

.action-icon {
  font-size: 56rpx;
  margin-bottom: 16rpx;
}

.action-text {
  font-size: 28rpx;
  color: #333333;
}

.action-item.danger .action-text {
  color: #FF3B30;
}

/* ============ 孩子端样式 ============ */
.child-header {
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  color: #FFFFFF;
}

.child-header .child-name {
  color: #FFFFFF;
}

.guardian-info {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

.sos-btn {
  width: 100rpx;
  height: 100rpx;
  background-color: #FF3B30;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  color: #FFFFFF;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 20rpx rgba(255, 59, 48, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
}

.child-usage {
  display: flex;
  justify-content: center;
  padding: 40rpx 0;
}

.usage-circle {
  width: 280rpx;
  height: 280rpx;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
}

.usage-value {
  font-size: 56rpx;
  font-weight: bold;
}

.usage-label {
  font-size: 26rpx;
  margin-top: 10rpx;
  opacity: 0.8;
}

.limit-card {
  background-color: #FFF9E6;
  border: 2rpx solid #FFE4B5;
}

.limit-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.limit-icon {
  font-size: 36rpx;
  margin-right: 10rpx;
}

.limit-title {
  font-size: 28rpx;
  color: #FF9500;
}

.limit-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.limit-app {
  font-size: 28rpx;
  color: #333333;
}

.limit-remaining {
  font-size: 26rpx;
  color: #FF9500;
}

.limit-progress {
  .progress {
    height: 12rpx;
    background-color: rgba(255, 149, 0, 0.2);
    border-radius: 6rpx;
    overflow: hidden;
  }
}

.tips-card {
  display: flex;
  align-items: center;
  background-color: #F0F9FF;
  padding: 30rpx;
}

.tips-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.tips-text {
  font-size: 26rpx;
  color: #007AFF;
  flex: 1;
}

.empty {
  display: flex;
  justify-content: center;
  padding: 60rpx 0;
}

.empty-text {
  font-size: 26rpx;
  color: #999999;
}
</style>

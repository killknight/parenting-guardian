<template>
  <div class="home-page page">
    <!-- 家长端首页 -->
    <div v-if="isParent" class="parent-home">
      <div class="home-header">
        <div class="header-left">
          <div class="child-name">{{ currentChild?.nickname || '孩子' }}</div>
          <div class="child-status">
            <span class="status-dot" :class="{ online: mockData.childOnline }"></span>
            {{ mockData.childOnline ? '在线' : '离线' }}
          </div>
        </div>
        <div class="header-right">
          <span class="alert-badge" v-if="mockData.unreadAlertCount > 0">{{ mockData.unreadAlertCount }}</span>
          <span class="icon-btn">🔔</span>
        </div>
      </div>

      <div class="overview-cards">
        <div class="overview-card">
          <div class="card-icon">📱</div>
          <div class="card-info">
            <div class="card-value">{{ formatDuration(mockData.todayUsage.totalDuration) }}</div>
            <div class="card-label">今日使用时长</div>
          </div>
        </div>
        <div class="overview-card">
          <div class="card-icon">🔓</div>
          <div class="card-info">
            <div class="card-value">{{ mockData.todayUsage.unlockCount || 0 }}</div>
            <div class="card-label">解锁次数</div>
          </div>
        </div>
        <div class="overview-card">
          <div class="card-icon">⚡</div>
          <div class="card-info">
            <div class="card-value">{{ mockData.currentApp || '无' }}</div>
            <div class="card-label">正在使用</div>
          </div>
        </div>
      </div>

      <div class="card location-card">
        <div class="card-title">
          <span>📍 当前位置</span>
          <span class="refresh-time">{{ relativeTime(mockData.lastLocationTime) }}</span>
        </div>
        <div class="location-info">
          <div class="location-address">{{ mockData.currentAddress }}</div>
          <div class="location-status" :class="{ online: mockData.childOnline }">
            {{ mockData.childOnline ? '实时定位中' : '设备离线' }}
          </div>
        </div>
      </div>

      <div class="card usage-card">
        <div class="card-title">
          <span>📊 今日应用使用</span>
          <span class="more-btn">查看详情 ></span>
        </div>
        <div class="app-list">
          <div class="app-item" v-for="(app, index) in mockData.appRanking" :key="app.packageName">
            <div class="app-rank" :class="getRankClass(index)">{{ index + 1 }}</div>
            <div class="app-icon">{{ getAppIcon(app.appName) }}</div>
            <div class="app-info">
              <div class="app-name">{{ app.appName }}</div>
              <div class="app-progress">
                <div class="progress-bar" :style="{ width: getProgressWidth(app.duration) + '%' }" :class="getProgressClass(index)"></div>
              </div>
            </div>
            <div class="app-duration">{{ formatDurationShort(app.duration) }}</div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <div class="action-item danger" @click="quickLock">
          <div class="action-icon">🚫</div>
          <div class="action-text">一键锁屏</div>
        </div>
        <div class="action-item">
          <div class="action-icon">🎛️</div>
          <div class="action-text">远程控制</div>
        </div>
      </div>
    </div>

    <!-- 孩子端首页 -->
    <div v-else class="child-home">
      <div class="home-header child-header">
        <div class="header-left">
          <div class="user-name">{{ store.userInfo?.nickname || '孩子' }}</div>
          <div class="guardian-info">已绑定家长：{{ mockData.guardianName }}</div>
        </div>
        <div class="sos-btn" @click="handleSOS">SOS</div>
      </div>

      <div class="card usage-card">
        <div class="card-title">📊 今日使用情况</div>
        <div class="child-usage">
          <div class="usage-circle">
            <div class="usage-value">{{ formatDuration(mockData.todayUsage.totalDuration) }}</div>
            <div class="usage-label">今日使用时长</div>
          </div>
        </div>
      </div>

      <div class="card app-card">
        <div class="card-title">📱 使用排行</div>
        <div class="app-list">
          <div class="app-item" v-for="(app, index) in mockData.appRanking.slice(0, 3)" :key="app.packageName">
            <div class="app-rank-small" :class="getRankClass(index)">{{ index + 1 }}</div>
            <div class="app-name">{{ app.appName }}</div>
            <div class="app-duration">{{ formatDurationShort(app.duration) }}</div>
          </div>
        </div>
      </div>

      <div class="tips-card card">
        <span class="tips-icon">💡</span>
        <span class="tips-text">适当休息，保护视力哦~</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../store'

const store = useAppStore()

const isParent = computed(() => store.isParent)
const currentChild = computed(() => store.currentChild)
const mockData = computed(() => store.mockData)

const formatDuration = (seconds) => {
  if (!seconds) return '0分钟'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

const formatDurationShort = (seconds) => {
  if (!seconds) return '0'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h${minutes}m`
  return `${minutes}m`
}

const relativeTime = (timestamp) => {
  if (!timestamp) return ''
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

const getAppIcon = (appName) => {
  const iconMap = {
    '微信': '💬', '抖音': '🎵', 'QQ': '📱', '王者荣耀': '🎮',
    '百度': '🔍', '淘宝': '🛒'
  }
  return iconMap[appName] || '📱'
}

const getProgressWidth = (duration) => {
  if (!mockData.value.appRanking.length) return 0
  const maxDuration = mockData.value.appRanking[0]?.duration || 1
  return Math.min((duration / maxDuration) * 100, 100)
}

const getProgressClass = (index) => {
  const classes = ['progress-primary', 'progress-warning', 'progress-success', 'progress-danger']
  return classes[index % classes.length]
}

const getRankClass = (index) => {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return ''
}

const quickLock = () => {
  alert('锁屏指令已发送')
}

const handleSOS = () => {
  if (confirm('确定要发送紧急求助吗？')) {
    alert('紧急求助已发送')
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100%;
  background: #F5F5F5;
  padding-bottom: 70px;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #fff;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.child-name, .user-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.child-status {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ccc;
  margin-right: 4px;
}

.status-dot.online {
  background: #4CD964;
}

.header-right {
  position: relative;
}

.alert-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 16px;
  height: 16px;
  background: #FF3B30;
  color: #fff;
  font-size: 11px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.icon-btn {
  font-size: 24px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 15px 20px;
}

.overview-card {
  background: #fff;
  border-radius: 12px;
  padding: 15px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.card-info {
  text-align: center;
}

.card-value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
}

.card-label {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.card {
  margin: 0 20px 15px;
  background: #fff;
  border-radius: 16px;
  padding: 15px;
}

.card-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.refresh-time {
  font-size: 11px;
  color: #999;
  font-weight: normal;
}

.more-btn {
  font-size: 12px;
  color: #007AFF;
}

.location-info {
  margin-top: 8px;
}

.location-address {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.location-status {
  font-size: 12px;
  color: #999;
}

.location-status.online {
  color: #4CD964;
}

.app-list {
  margin-top: 10px;
}

.app-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.app-item:last-child {
  border-bottom: none;
}

.app-rank {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  margin-right: 10px;
}

.app-rank.rank-gold {
  background: #FFD700;
  color: #fff;
}

.app-rank.rank-silver {
  background: #C0C0C0;
  color: #fff;
}

.app-rank.rank-bronze {
  background: #CD7F32;
  color: #fff;
}

.app-rank-small {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #666;
  margin-right: 10px;
}

.app-icon {
  font-size: 20px;
  margin-right: 10px;
}

.app-info {
  flex: 1;
  min-width: 0;
}

.app-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
}

.app-progress {
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.progress-primary { background: #007AFF; }
.progress-warning { background: #FF9500; }
.progress-success { background: #4CD964; }
.progress-danger { background: #FF3B30; }

.app-duration {
  font-size: 13px;
  color: #666;
  margin-left: 10px;
  white-space: nowrap;
}

.quick-actions {
  display: flex;
  gap: 15px;
  padding: 15px 20px;
}

.action-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80px;
  background: #fff;
  border-radius: 16px;
}

.action-item.danger {
  background: #FFF0F0;
}

.action-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.action-text {
  font-size: 14px;
  color: #333;
}

.action-item.danger .action-text {
  color: #FF3B30;
}

/* 孩子端样式 */
.child-header {
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
}

.child-header .child-name {
  color: #fff;
}

.guardian-info {
  font-size: 12px;
  color: rgba(255,255,255,0.8);
  margin-top: 4px;
}

.sos-btn {
  width: 50px;
  height: 50px;
  background: #FF3B30;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,59,48,0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255,59,48,0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,59,48,0); }
}

.child-usage {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.usage-circle {
  width: 140px;
  height: 140px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.usage-value {
  font-size: 28px;
  font-weight: bold;
}

.usage-label {
  font-size: 13px;
  margin-top: 5px;
  opacity: 0.8;
}

.tips-card {
  display: flex;
  align-items: center;
  background: #F0F9FF;
}

.tips-icon {
  font-size: 18px;
  margin-right: 8px;
}

.tips-text {
  font-size: 13px;
  color: #007AFF;
  flex: 1;
}
</style>

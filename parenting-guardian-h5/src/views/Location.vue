<template>
  <div class="location-page page">
    <div class="page-header">
      <div class="header-title">📍 位置守护</div>
    </div>

    <div class="map-placeholder">
      <div class="map-content">
        <div class="current-location">
          <div class="location-icon">📍</div>
          <div class="location-text">{{ mockData.currentAddress }}</div>
        </div>
        <div class="map-note">地图展示区域</div>
      </div>
    </div>

    <div class="location-list">
      <div class="list-title">📋 位置历史</div>
      <div class="location-item" v-for="(loc, index) in mockData.locationHistory" :key="index">
        <div class="item-time">{{ formatTime(loc.timestamp) }}</div>
        <div class="item-content">
          <div class="item-address">{{ loc.address }}</div>
          <div class="item-coords">{{ loc.latitude.toFixed(4) }}, {{ loc.longitude.toFixed(4) }}</div>
        </div>
      </div>
    </div>

    <div class="status-bar">
      <div class="status-item" :class="{ online: mockData.childOnline }">
        <span class="status-dot"></span>
        {{ mockData.childOnline ? '设备在线' : '设备离线' }}
      </div>
      <div class="status-time">更新于 {{ relativeTime(mockData.lastLocationTime) }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../store'

const store = useAppStore()
const mockData = computed(() => store.mockData)

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const relativeTime = (timestamp) => {
  if (!timestamp) return ''
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  return `${Math.floor(minutes / 60)}小时前`
}
</script>

<style scoped>
.location-page {
  min-height: 100%;
  background: #F5F5F5;
  padding-bottom: 70px;
}

.page-header {
  padding: 15px 20px;
  background: #fff;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.map-placeholder {
  margin: 15px 20px;
  height: 200px;
  background: linear-gradient(135deg, #e8f4ea 0%, #e8f0f5 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-content {
  text-align: center;
}

.current-location {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
}

.location-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.location-text {
  font-size: 14px;
  color: #333;
  padding: 0 20px;
}

.map-note {
  font-size: 12px;
  color: #999;
}

.location-list {
  margin: 0 20px 15px;
  background: #fff;
  border-radius: 16px;
  padding: 15px;
}

.list-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.location-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.location-item:last-child {
  border-bottom: none;
}

.item-time {
  width: 50px;
  font-size: 12px;
  color: #999;
}

.item-content {
  flex: 1;
}

.item-address {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.item-coords {
  font-size: 11px;
  color: #999;
}

.status-bar {
  margin: 0 20px;
  padding: 12px 15px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #999;
}

.status-item .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ccc;
  margin-right: 6px;
}

.status-item.online {
  color: #4CD964;
}

.status-item.online .status-dot {
  background: #4CD964;
}

.status-time {
  font-size: 11px;
  color: #999;
}
</style>

<template>
  <div class="alert-page page">
    <div class="page-header">
      <div class="header-title">🆘 紧急求助</div>
    </div>

    <div class="sos-button" @click="handleSOS">
      <div class="sos-inner">
        <div class="sos-text">SOS</div>
        <div class="sos-hint">长按发送求助</div>
      </div>
    </div>

    <div class="alert-history">
      <div class="history-title">📋 求助历史</div>
      <div class="history-list">
        <div class="history-item" v-for="alert in mockData.alerts" :key="alert._id">
          <div class="item-icon">
            {{ alert.type === 'sos' ? '🆘' : alert.type === 'geofence_out' ? '📍' : '⚠️' }}
          </div>
          <div class="item-content">
            <div class="item-title">{{ alert.title }}</div>
            <div class="item-desc">{{ alert.content }}</div>
            <div class="item-time">{{ formatTime(alert.createTime) }}</div>
          </div>
          <div class="item-status" :class="alert.readStatus ? 'read' : 'unread'">
            {{ alert.readStatus ? '已读' : '未读' }}
          </div>
        </div>
      </div>
    </div>

    <div class="alert-note">
      <div class="note-icon">💡</div>
      <div class="note-content">
        当孩子遇到紧急情况时，长按SOS按钮即可向家长发送求助信息，包含当前位置。
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../store'

const store = useAppStore()
const mockData = computed(() => store.mockData)

const handleSOS = () => {
  if (confirm('确定要发送紧急求助吗？')) {
    alert('紧急求助已发送！')
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}
</script>

<style scoped>
.alert-page {
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

.sos-button {
  margin: 30px 60px;
  height: 180px;
  background: linear-gradient(135deg, #FF3B30 0%, #FF6B6B 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 30px rgba(255, 59, 48, 0.4);
  cursor: pointer;
  animation: pulse-sos 2s infinite;
}

@keyframes pulse-sos {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.sos-inner {
  text-align: center;
  color: #fff;
}

.sos-text {
  font-size: 48px;
  font-weight: bold;
  letter-spacing: 4px;
}

.sos-hint {
  font-size: 13px;
  margin-top: 8px;
  opacity: 0.9;
}

.alert-history {
  margin: 20px 20px;
  background: #fff;
  border-radius: 16px;
  padding: 15px;
}

.history-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.history-item:last-child {
  border-bottom: none;
}

.item-icon {
  font-size: 24px;
  margin-right: 12px;
}

.item-content {
  flex: 1;
}

.item-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.item-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.item-time {
  font-size: 11px;
  color: #999;
}

.item-status {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 8px;
  height: fit-content;
}

.item-status.unread {
  background: #FFE8E8;
  color: #FF3B30;
}

.item-status.read {
  background: #f5f5f5;
  color: #999;
}

.alert-note {
  margin: 20px;
  padding: 15px;
  background: #F0F9FF;
  border-radius: 12px;
  display: flex;
}

.note-icon {
  font-size: 18px;
  margin-right: 10px;
}

.note-content {
  flex: 1;
  font-size: 13px;
  color: #007AFF;
  line-height: 1.6;
}
</style>

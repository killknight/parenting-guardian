<template>
  <div class="control-page page">
    <div class="page-header">
      <div class="header-title">🎛️ 远程控制</div>
    </div>

    <div class="control-card lock-card" @click="handleLock">
      <div class="card-icon">🚫</div>
      <div class="card-info">
        <div class="card-title">远程锁屏</div>
        <div class="card-desc">立即锁定孩子设备</div>
      </div>
      <div class="card-arrow">→</div>
    </div>

    <div class="control-card unlock-card" @click="handleUnlock">
      <div class="card-icon">🔓</div>
      <div class="card-info">
        <div class="card-title">解除锁屏</div>
        <div class="card-desc">允许孩子使用设备</div>
      </div>
      <div class="card-arrow">→</div>
    </div>

    <div class="command-history">
      <div class="history-title">📋 指令历史</div>
      <div class="history-list">
        <div class="history-item" v-for="cmd in mockData.commands" :key="cmd._id">
          <div class="item-left">
            <span class="cmd-icon">{{ cmd.type === 'lock' ? '🚫' : '🔓' }}</span>
            <div class="item-info">
              <div class="item-type">{{ cmd.type === 'lock' ? '锁屏' : '解锁' }}</div>
              <div class="item-time">{{ formatTime(cmd.createTime) }}</div>
            </div>
          </div>
          <div class="item-status" :class="cmd.status">{{ getStatusText(cmd.status) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../store'

const store = useAppStore()
const mockData = computed(() => store.mockData)

const handleLock = () => {
  const duration = prompt('请输入锁屏时长（分钟）：', '30')
  if (duration) {
    alert(`锁屏指令已发送，将锁定 ${duration} 分钟`)
  }
}

const handleUnlock = () => {
  if (confirm('确定要解除锁屏吗？')) {
    alert('解锁指令已发送')
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const getStatusText = (status) => {
  const map = {
    pending: '待执行',
    executed: '已完成',
    failed: '失败'
  }
  return map[status] || status
}
</script>

<style scoped>
.control-page {
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

.control-card {
  margin: 15px 20px;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
}

.card-icon {
  font-size: 36px;
  margin-right: 15px;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 13px;
  color: #999;
}

.card-arrow {
  font-size: 18px;
  color: #ccc;
}

.lock-card:active {
  background: #FFF0F0;
}

.unlock-card:active {
  background: #F0FFF4;
}

.command-history {
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
  gap: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.history-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  align-items: center;
}

.cmd-icon {
  font-size: 24px;
  margin-right: 12px;
}

.item-type {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.item-time {
  font-size: 11px;
  color: #999;
}

.item-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
  background: #f5f5f5;
  color: #666;
}

.item-status.executed {
  background: #E8F8F0;
  color: #4CD964;
}

.item-status.failed {
  background: #FFE8E8;
  color: #FF3B30;
}
</style>

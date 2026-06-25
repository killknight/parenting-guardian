<template>
  <div class="settings-page page">
    <div class="page-header">
      <div class="header-title">⚙️ 设置</div>
    </div>

    <div class="settings-section">
      <div class="section-title">通用设置</div>
      <div class="setting-item">
        <div class="item-left">
          <span class="item-icon">🔄</span>
          <span class="item-label">轮询频率</span>
        </div>
        <div class="item-right">
          <select v-model="settings.pollInterval" class="select-input">
            <option :value="30">30秒</option>
            <option :value="60">1分钟</option>
            <option :value="300">5分钟</option>
          </select>
        </div>
      </div>
      <div class="setting-item">
        <div class="item-left">
          <span class="item-icon">📍</span>
          <span class="item-label">自动上报位置</span>
        </div>
        <div class="item-right">
          <input type="checkbox" v-model="settings.autoReportLocation" class="checkbox" />
        </div>
      </div>
    <div class="setting-item">
        <div class="item-left">
          <span class="item-icon">📱</span>
          <span class="item-label">应用使用监控</span>
        </div>
        <div class="item-right">
          <input type="checkbox" v-model="settings.appMonitor" class="checkbox" />
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-title">设备管理</div>
      <div class="setting-item">
        <div class="item-left">
          <span class="item-icon">🔔</span>
          <span class="item-label">设备管理员</span>
        </div>
        <div class="item-right">
          <span class="status-badge active">已激活</span>
        </div>
      </div>
      <div class="setting-item">
        <div class="item-left">
          <span class="item-icon">🛡️</span>
          <span class="item-label">前台服务</span>
        </div>
        <div class="item-right">
          <span class="status-badge active">运行中</span>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-title">账号</div>
      <div class="setting-item">
        <div class="item-left">
          <span class="item-icon">👤</span>
          <span class="item-label">当前角色</span>
        </div>
        <div class="item-right">
          <span class="role-tag">{{ isParent ? '👨 家长' : '👦 孩子' }}</span>
        </div>
      </div>
      <div class="setting-item" @click="switchRole">
        <div class="item-left">
          <span class="item-icon">🔄</span>
          <span class="item-label">切换角色</span>
        </div>
        <div class="item-right">
          <span class="arrow">→</span>
        </div>
      </div>
      <div class="setting-item logout" @click="handleLogout">
        <div class="item-left">
          <span class="item-icon">🚪</span>
          <span class="item-label">退出登录</span>
        </div>
        <div class="item-right">
          <span class="arrow">→</span>
        </div>
      </div>
    </div>

    <div class="app-info">
      <div class="app-name">亲子守护</div>
      <div class="app-version">版本 1.0.0</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../store'

const router = useRouter()
const store = useAppStore()

const settings = ref({
  pollInterval: 60,
  autoReportLocation: true,
  appMonitor: true
})

const isParent = computed(() => store.isParent)

const switchRole = () => {
  const newRole = isParent.value ? 'child' : 'parent'
  store.setRole(newRole)
  alert(`已切换为${newRole === 'parent' ? '家长' : '孩子'}模式`)
}

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    store.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.settings-page {
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

.settings-section {
  margin: 15px 20px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}

.section-title {
  font-size: 13px;
  color: #999;
  padding: 15px 15px 8px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 15px;
  border-bottom: 1px solid #f5f5f5;
}

.setting-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  align-items: center;
}

.item-icon {
  font-size: 18px;
  margin-right: 12px;
}

.item-label {
  font-size: 15px;
  color: #333;
}

.item-right {
  display: flex;
  align-items: center;
}

.select-input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
}

.checkbox {
  width: 20px;
  height: 20px;
  accent-color: #007AFF;
}

.status-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
  background: #f5f5f5;
  color: #999;
}

.status-badge.active {
  background: #E8F8F0;
  color: #4CD964;
}

.role-tag {
  font-size: 13px;
  color: #007AFF;
}

.arrow {
  font-size: 16px;
  color: #ccc;
}

.setting-item.logout .item-label {
  color: #FF3B30;
}

.app-info {
  text-align: center;
  padding: 30px 0;
}

.app-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.app-version {
  font-size: 12px;
  color: #999;
}
</style>

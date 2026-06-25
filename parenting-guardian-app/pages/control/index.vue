<template>
  <view class="control-page">
    <!-- 家长端：远程控制 -->
    <view v-if="isParent" class="parent-control">
      <!-- 设备状态 -->
      <view class="device-status card">
        <view class="status-header">
          <text class="child-name">{{ currentChild?.nickname || '孩子' }} 的设备</text>
          <text class="status-badge" :class="{ online: deviceOnline }">
            {{ deviceOnline ? '在线' : '离线' }}
          </text>
        </view>
        <view class="status-info">
          <text class="device-name">{{ deviceInfo?.deviceName || '未知设备' }}</text>
          <text class="last-online">最后在线: {{ relativeTime(lastOnline) }}</text>
        </view>
      </view>

      <!-- 锁屏控制 -->
      <view class="lock-control card">
        <view class="control-title">🚫 一键锁屏</view>
        <view class="lock-options">
          <view
            class="lock-option"
            :class="{ active: lockDuration === 900 }"
            @tap="lockDuration = 900"
          >
            <text class="option-time">15分钟</text>
          </view>
          <view
            class="lock-option"
            :class="{ active: lockDuration === 1800 }"
            @tap="lockDuration = 1800"
          >
            <text class="option-time">30分钟</text>
          </view>
          <view
            class="lock-option"
            :class="{ active: lockDuration === 3600 }"
            @tap="lockDuration = 3600"
          >
            <text class="option-time">1小时</text>
          </view>
          <view
            class="lock-option"
            :class="{ active: lockDuration === 0 }"
            @tap="showCustomLock"
          >
            <text class="option-time">自定义</text>
          </view>
        </view>
        <view class="lock-message">
          <input
            class="message-input"
            v-model="lockMessage"
            placeholder="给孩子的留言（可选）"
            maxlength="50"
          />
        </view>
        <button class="btn btn-danger btn-block" @tap="handleLock">
          发送锁屏指令
        </button>
      </view>

      <!-- 解锁控制 -->
      <view class="unlock-control card">
        <view class="control-title">🔓 解锁设备</view>
        <view class="unlock-hint">
          <text>解除当前锁屏状态，让孩子可以正常使用设备</text>
        </view>
        <button class="btn btn-success btn-block" @tap="handleUnlock">
          立即解锁
        </button>
      </view>

      <!-- 应用限额 -->
      <view class="app-limit card">
        <view class="control-title">
          <text>📱 应用限额</text>
          <text class="add-btn" @tap="showAddLimit">+ 添加</text>
        </view>
        <view class="limit-list" v-if="limitList.length > 0">
          <view
            class="limit-item"
            v-for="item in limitList"
            :key="item._id"
          >
            <view class="limit-info">
              <text class="app-name">{{ item.appName }}</text>
              <text class="limit-value">{{ item.dailyLimit }}分钟/天</text>
            </view>
            <view class="limit-status">
              <switch
                :checked="item.enabled"
                @change="toggleLimit(item)"
                color="#007AFF"
              />
            </view>
          </view>
        </view>
        <view class="empty" v-else>
          <text class="empty-text">暂无应用限额</text>
        </view>
      </view>
    </view>

    <!-- 孩子端：控制功能（锁定状态显示） -->
    <view v-else class="child-control">
      <!-- 当前状态 -->
      <view class="status-card card">
        <view class="current-status" v-if="isLocked">
          <text class="status-icon">🚫</text>
          <text class="status-text">设备已锁定</text>
          <text class="lock-reason">{{ lockInfo?.message || '家长要求休息' }}</text>
          <text class="remaining-time">剩余 {{ formatRemainingTime() }}</text>
        </view>
        <view class="current-status" v-else>
          <text class="status-icon">✅</text>
          <text class="status-text">设备正常使用中</text>
        </view>
      </view>

      <!-- 我的限额 -->
      <view class="my-limits card">
        <view class="card-title">📋 我的应用限额</view>
        <view class="limit-list" v-if="myLimits.length > 0">
          <view class="limit-item" v-for="item in myLimits" :key="item._id">
            <text class="app-name">{{ item.appName }}</text>
            <text class="limit-progress">
              剩余 {{ formatDuration(item.remaining * 60) }}
            </text>
          </view>
        </view>
        <view class="empty" v-else>
          <text class="empty-text">暂无应用限额</text>
        </view>
      </view>
    </view>

    <!-- 添加限额弹窗 -->
    <uni-popup ref="addLimitPopup" type="bottom">
      <view class="add-limit-popup">
        <view class="popup-header">
          <text class="popup-title">添加应用限额</text>
          <text class="popup-close" @tap="closeAddLimit">✕</text>
        </view>
        <view class="popup-form">
          <view class="form-item">
            <text class="form-label">选择应用</text>
            <view class="app-selector">
              <view
                class="app-option"
                :class="{ active: newLimit.packageName === app.packageName }"
                v-for="app in installedApps"
                :key="app.packageName"
                @tap="selectApp(app)"
              >
                <text class="app-icon">{{ getAppIcon(app.appName) }}</text>
                <text class="app-name">{{ app.appName }}</text>
              </view>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">每日限额（分钟）</text>
            <view class="limit-selector">
              <view
                class="limit-option"
                :class="{ active: newLimit.dailyLimit === 30 }"
                @tap="newLimit.dailyLimit = 30"
              >
                30分钟
              </view>
              <view
                class="limit-option"
                :class="{ active: newLimit.dailyLimit === 60 }"
                @tap="newLimit.dailyLimit = 60"
              >
                1小时
              </view>
              <view
                class="limit-option"
                :class="{ active: newLimit.dailyLimit === 120 }"
                @tap="newLimit.dailyLimit = 120"
              >
                2小时
              </view>
              <view
                class="limit-option"
                :class="{ active: newLimit.dailyLimit === 180 }"
                @tap="newLimit.dailyLimit = 180"
              >
                3小时
              </view>
            </view>
          </view>
        </view>
        <button class="btn btn-primary btn-block" @tap="handleAddLimit">
          确 定
        </button>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import {
  sendLockCommand,
  sendUnlockCommand,
  setAppLimit,
  getCommandHistory,
  UsageStatsPlugin
} from '@/api/index.js'
import { showLoading, hideLoading, showError, showSuccess, showConfirm } from '@/utils/index.js'

export default {
  data() {
    return {
      lockDuration: 1800,
      lockMessage: '',
      deviceOnline: false,
      deviceInfo: null,
      lastOnline: null,
      limitList: [],
      myLimits: [],
      installedApps: [],
      isLocked: false,
      lockInfo: null,
      lockTimer: null,
      newLimit: {
        packageName: '',
        appName: '',
        dailyLimit: 60
      }
    }
  },

  computed: {
    ...mapState(['currentChild']),
    ...mapGetters(['isParent', 'isChild', 'childId']),
    currentChild() {
      return this.$store.state.currentChild || this.userInfo
    }
  },

  onLoad() {
    if (this.isParent) {
      this.loadDeviceInfo()
      this.loadLimits()
    } else {
      this.loadMyLimits()
      this.checkLockStatus()
      this.startLockTimer()
    }
  },

  onShow() {
    if (this.isChild) {
      this.checkLockStatus()
    }
  },

  onUnload() {
    if (this.lockTimer) {
      clearInterval(this.lockTimer)
    }
  },

  methods: {
    // 加载设备信息
    async loadDeviceInfo() {
      const childId = this.currentChild?._id
      if (!childId) return

      try {
        // 简化实现，实际应调用 API
        this.deviceOnline = true
        this.lastOnline = Date.now()
        this.deviceInfo = {
          deviceName: '华为 Mate 40'
        }
      } catch (e) {
        console.error('加载设备信息失败:', e)
      }
    },

    // 加载限额列表
    async loadLimits() {
      // 简化实现
      this.limitList = []
    },

    // 加载我的限额
    async loadMyLimits() {
      // 简化实现
      this.myLimits = []
    },

    // 检查锁屏状态
    async checkLockStatus() {
      try {
        const res = await getCommandHistory()
        if (res.success && res.data) {
          const pendingLock = res.data.find(
            cmd => cmd.cmdType === 'LOCK' && cmd.status === 'EXECUTED'
          )
          if (pendingLock) {
            this.isLocked = true
            this.lockInfo = pendingLock.cmdData
          }
        }
      } catch (e) {
        console.error('检查锁屏状态失败:', e)
      }
    },

    // 启动锁屏计时器
    startLockTimer() {
      this.lockTimer = setInterval(() => {
        if (this.lockInfo) {
          this.lockInfo.remaining =
            this.lockInfo.remaining - 1 > 0 ? this.lockInfo.remaining - 1 : 0
          if (this.lockInfo.remaining <= 0) {
            this.isLocked = false
            this.lockInfo = null
          }
        }
      }, 1000)
    },

    // 显示自定义锁屏
    showCustomLock() {
      uni.showModal({
        title: '自定义锁屏时长',
        editable: true,
        placeholderText: '输入分钟数',
        success: (res) => {
          if (res.confirm && res.content) {
            const minutes = parseInt(res.content)
            if (minutes > 0) {
              this.lockDuration = minutes * 60
            }
          }
        }
      })
    },

    // 执行锁屏
    async handleLock() {
      const childId = this.currentChild?._id
      if (!childId) return

      const confirmed = await showConfirm('确认锁屏', '确定要锁定孩子的设备吗？')
      if (!confirmed) return

      try {
        showLoading('发送中...')
        const res = await sendLockCommand(childId, this.lockDuration, this.lockMessage)
        hideLoading()

        if (res.success) {
          showSuccess('锁屏指令已发送')
          this.lockMessage = ''
        } else {
          showError(res.error || '发送失败')
        }
      } catch (e) {
        hideLoading()
        showError('网络错误')
      }
    },

    // 执行解锁
    async handleUnlock() {
      const childId = this.currentChild?._id
      if (!childId) return

      const confirmed = await showConfirm('确认解锁', '确定要解锁孩子的设备吗？')
      if (!confirmed) return

      try {
        showLoading('发送中...')
        const res = await sendUnlockCommand(childId)
        hideLoading()

        if (res.success) {
          showSuccess('解锁成功')
        } else {
          showError(res.error || '发送失败')
        }
      } catch (e) {
        hideLoading()
        showError('网络错误')
      }
    },

    // 显示添加限额
    async showAddLimit() {
      try {
        // 获取已安装应用
        const res = await UsageStatsPlugin.getInstalledApps()
        if (res && res.appList) {
          this.installedApps = res.appList
        }
      } catch (e) {
        console.error('获取应用列表失败:', e)
      }
      this.$refs.addLimitPopup.open()
    },

    // 关闭添加限额
    closeAddLimit() {
      this.$refs.addLimitPopup.close()
      this.newLimit = {
        packageName: '',
        appName: '',
        dailyLimit: 60
      }
    },

    // 选择应用
    selectApp(app) {
      this.newLimit.packageName = app.packageName
      this.newLimit.appName = app.appName
    },

    // 添加限额
    async handleAddLimit() {
      if (!this.newLimit.packageName) {
        showError('请选择应用')
        return
      }

      const childId = this.currentChild?._id
      if (!childId) return

      try {
        showLoading('添加中...')
        const res = await setAppLimit(
          childId,
          this.newLimit.packageName,
          this.newLimit.appName,
          this.newLimit.dailyLimit
        )
        hideLoading()

        if (res.success) {
          showSuccess('添加成功')
          this.closeAddLimit()
          this.loadLimits()
        } else {
          showError(res.error || '添加失败')
        }
      } catch (e) {
        hideLoading()
        showError('网络错误')
      }
    },

    // 切换限额
    async toggleLimit(item) {
      item.enabled = !item.enabled
      // 调用 API 更新
    },

    // 格式化剩余时间
    formatRemainingTime() {
      if (!this.lockInfo || !this.lockInfo.remaining) return '0:00'
      const minutes = Math.floor(this.lockInfo.remaining / 60)
      const seconds = this.lockInfo.remaining % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    },

    // 相对时间
    relativeTime(time) {
      if (!time) return '未知'
      const diff = Date.now() - new Date(time).getTime()
      const minutes = Math.floor(diff / 60000)
      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}小时前`
      return `${Math.floor(hours / 24)}天前`
    },

    // 获取应用图标
    getAppIcon(appName) {
      const iconMap = {
        '微信': '💬',
        'QQ': '📱',
        '抖音': '🎵',
        '王者荣耀': '🎮'
      }
      return iconMap[appName] || '📱'
    },

    // 格式化时长
    formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      if (hours > 0) return `${hours}小时${minutes}分`
      return `${minutes}分钟`
    }
  }
}
</script>

<style lang="scss" scoped>
.control-page {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding-bottom: env(safe-area-inset-bottom);
}

.card {
  margin: 30rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx;
}

/* ============ 设备状态 ============ */
.device-status {
  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
  }

  .child-name {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
  }

  .status-badge {
    padding: 6rpx 16rpx;
    background-color: #F5F5F5;
    color: #999999;
    font-size: 24rpx;
    border-radius: 20rpx;
  }

  .status-badge.online {
    background-color: #F0FFF4;
    color: #4CD964;
  }

  .status-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .device-name {
    font-size: 28rpx;
    color: #666666;
  }

  .last-online {
    font-size: 24rpx;
    color: #999999;
  }
}

/* ============ 控制标题 ============ */
.control-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-btn {
  font-size: 28rpx;
  color: #007AFF;
  font-weight: normal;
}

/* ============ 锁屏选项 ============ */
.lock-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.lock-option {
  height: 80rpx;
  background-color: #F5F5F5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.lock-option.active {
  background-color: rgba(255, 59, 48, 0.1);
  border: 2rpx solid #FF3B30;
}

.option-time {
  font-size: 26rpx;
  color: #666666;
}

.lock-option.active .option-time {
  color: #FF3B30;
}

.lock-message {
  margin-bottom: 24rpx;
}

.message-input {
  height: 88rpx;
  background-color: #F5F5F5;
  border-radius: 16rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}

/* ============ 解锁提示 ============ */
.unlock-hint {
  background-color: #F5F5F5;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;

  text {
    font-size: 26rpx;
    color: #666666;
  }
}

/* ============ 限额列表 ============ */
.limit-list {
  .limit-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #F0F0F0;

    &:last-child {
      border-bottom: none;
    }
  }

  .limit-info {
    flex: 1;
  }

  .app-name {
    display: block;
    font-size: 28rpx;
    color: #333333;
    margin-bottom: 8rpx;
  }

  .limit-value {
    font-size: 24rpx;
    color: #999999;
  }
}

/* ============ 孩子端状态 ============ */
.current-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
}

.status-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.status-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 16rpx;
}

.lock-reason {
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 20rpx;
}

.remaining-time {
  font-size: 48rpx;
  font-weight: bold;
  color: #FF3B30;
}

/* ============ 添加限额弹窗 ============ */
.add-limit-popup {
  background-color: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  max-height: 80vh;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.popup-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333333;
}

.popup-close {
  font-size: 40rpx;
  color: #999999;
  padding: 10rpx;
}

.form-item {
  margin-bottom: 30rpx;

  .form-label {
    display: block;
    font-size: 28rpx;
    color: #333333;
    margin-bottom: 16rpx;
  }
}

.app-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  max-height: 400rpx;
  overflow-y: auto;
}

.app-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background-color: #F5F5F5;
  border-radius: 12rpx;
  transition: all 0.3s;
}

.app-option.active {
  background-color: rgba(0, 122, 255, 0.1);
  border: 2rpx solid #007AFF;
}

.app-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
}

.app-name {
  font-size: 24rpx;
  color: #666666;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.limit-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.limit-option {
  height: 80rpx;
  background-color: #F5F5F5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #666666;
}

.limit-option.active {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  border: 2rpx solid #007AFF;
}

.empty {
  display: flex;
  justify-content: center;
  padding: 40rpx 0;
}

.empty-text {
  font-size: 26rpx;
  color: #999999;
}
</style>

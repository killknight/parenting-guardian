<template>
  <view class="settings-page">
    <!-- 用户信息 -->
    <view class="user-info card">
      <view class="avatar-wrapper">
        <text class="avatar">{{ userInfo?.nickname?.[0] || '?' }}</text>
      </view>
      <view class="user-detail">
        <text class="nickname">{{ userInfo?.nickname || '未登录' }}</text>
        <text class="phone">{{ formatPhone(userInfo?.phone) }}</text>
      </view>
      <text class="role-tag" :class="isParent ? 'parent' : 'child'">
        {{ isParent ? '家长' : '孩子' }}
      </text>
    </view>

    <!-- 家长端菜单 -->
    <view v-if="isParent" class="menu-section">
      <view class="menu-title">孩子管理</view>
      <view class="menu-list">
        <view class="menu-item" @tap="goChildrenList">
          <text class="menu-icon">👨‍👩‍👧</text>
          <text class="menu-text">已绑定的孩子</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @tap="goBinding">
          <text class="menu-icon">➕</text>
          <text class="menu-text">添加孩子</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 孩子端菜单 -->
    <view v-if="isChild" class="menu-section">
      <view class="menu-title">绑定管理</view>
      <view class="menu-list">
        <view class="menu-item" @tap="showBindingCode">
          <text class="menu-icon">🔗</text>
          <text class="menu-text">我的绑定码</text>
          <text class="menu-value">{{ bindingCode || '未绑定' }}</text>
        </view>
        <view class="menu-item" @tap="unbindParent">
          <text class="menu-icon">❌</text>
          <text class="menu-text">解除绑定</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 同步设置 -->
    <view v-if="isChild" class="menu-section">
      <view class="menu-title">同步设置</view>
      <view class="menu-list">
        <view class="menu-item">
          <text class="menu-icon">📍</text>
          <text class="menu-text">位置上报频率</text>
          <picker
            :value="locationIndex"
            :range="intervalOptions"
            range-key="label"
            @change="onLocationIntervalChange"
          >
            <text class="menu-value">{{ locationInterval.label }}</text>
          </picker>
        </view>
        <view class="menu-item">
          <text class="menu-icon">🔔</text>
          <text class="menu-text">指令轮询频率</text>
          <picker
            :value="pollIndex"
            :range="intervalOptions"
            range-key="label"
            @change="onPollIntervalChange"
          >
            <text class="menu-value">{{ pollInterval.label }}</text>
          </picker>
        </view>
      </view>
      <view class="menu-hint">
        <text>💡 频率越高响应越快，但耗电越多。息屏时会自动降低频率。</text>
      </view>
    </view>

    <!-- 通用设置 -->
    <view class="menu-section">
      <view class="menu-title">通用设置</view>
      <view class="menu-list">
        <view class="menu-item">
          <text class="menu-icon">🔔</text>
          <text class="menu-text">消息通知</text>
          <switch :checked="notifyEnabled" @change="onNotifyChange" color="#007AFF" />
        </view>
        <view class="menu-item" @tap="goAbout">
          <text class="menu-icon">ℹ️</text>
          <text class="menu-text">关于我们</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @tap="goHelp">
          <text class="menu-icon">❓</text>
          <text class="menu-text">帮助与反馈</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 紧急联系电话（孩子端） -->
    <view v-if="isChild" class="menu-section">
      <view class="menu-title">紧急联系</view>
      <view class="menu-list">
        <view class="menu-item" @tap="setEmergencyPhone">
          <text class="menu-icon">📞</text>
          <text class="menu-text">紧急联系电话</text>
          <text class="menu-value">{{ emergencyPhone || '未设置' }}</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="btn btn-default btn-block" @tap="handleLogout">
        退出登录
      </button>
    </view>

    <!-- 版本信息 -->
    <view class="version-info">
      <text>亲子守护 v1.0.0</text>
    </view>
  </view>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { logout as apiLogout, unbind as apiUnbind, setEmergencyPhone as apiSetEmergencyPhone } from '@/api/index.js'
import { showLoading, hideLoading, showError, showSuccess, showConfirm } from '@/utils/index.js'

export default {
  data() {
    return {
      bindingCode: '',
      emergencyPhone: '',
      notifyEnabled: true,
      locationIndex: 1,
      pollIndex: 1,
      intervalOptions: [
        { label: '30秒', value: 30000 },
        { label: '1分钟', value: 60000 },
        { label: '5分钟', value: 300000 }
      ]
    }
  },

  computed: {
    ...mapState(['userInfo', 'settings']),
    ...mapGetters(['isParent', 'isChild']),
    locationInterval() {
      return this.intervalOptions[this.locationIndex]
    },
    pollInterval() {
      return this.intervalOptions[this.pollIndex]
    }
  },

  onLoad() {
    this.loadSettings()
  },

  methods: {
    // 加载设置
    loadSettings() {
      if (this.settings.locationInterval) {
        const index = this.intervalOptions.findIndex(
          opt => opt.value === this.settings.locationInterval
        )
        if (index >= 0) this.locationIndex = index
      }

      if (this.settings.pollInterval) {
        const index = this.intervalOptions.findIndex(
          opt => opt.value === this.settings.pollInterval
        )
        if (index >= 0) this.pollIndex = index
      }

      if (this.userInfo) {
        this.emergencyPhone = this.userInfo.emergencyPhone
      }
    },

    // 格式化手机号
    formatPhone(phone) {
      if (!phone) return ''
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    },

    // 跳转到孩子列表
    goChildrenList() {
      uni.navigateTo({
        url: '/pages/settings/children-list'
      })
    },

    // 跳转到添加孩子
    goBinding() {
      uni.navigateTo({
        url: '/pages/settings/binding'
      })
    },

    // 显示绑定码
    showBindingCode() {
      // TODO: 获取当前绑定码
      uni.showModal({
        title: '我的绑定码',
        content: '请让家长扫码绑定',
        showCancel: false
      })
    },

    // 解除绑定
    async unbindParent() {
      const confirmed = await showConfirm('解除绑定', '确定要解除与家长的绑定吗？')
      if (!confirmed) return

      try {
        showLoading('处理中...')
        const res = await apiUnbind()
        hideLoading()

        if (res.success) {
          showSuccess('已解除绑定')
          // 重新加载数据
        } else {
          showError(res.error || '解除失败')
        }
      } catch (e) {
        hideLoading()
        showError('网络错误')
      }
    },

    // 位置间隔变化
    onLocationIntervalChange(e) {
      this.locationIndex = e.detail.value
      this.$store.commit('UPDATE_SETTINGS', {
        locationInterval: this.intervalOptions[this.locationIndex].value
      })
      showSuccess('设置已保存')
    },

    // 轮询间隔变化
    onPollIntervalChange(e) {
      this.pollIndex = e.detail.value
      this.$store.commit('UPDATE_SETTINGS', {
        pollInterval: this.intervalOptions[this.pollIndex].value
      })
      showSuccess('设置已保存')
    },

    // 通知开关
    onNotifyChange(e) {
      this.notifyEnabled = e.detail.value
      // TODO: 保存设置
    },

    // 设置紧急电话
    setEmergencyPhone() {
      uni.showModal({
        title: '设置紧急联系电话',
        editable: true,
        placeholderText: '请输入家长手机号',
        success: async (res) => {
          if (res.confirm && res.content) {
            try {
              showLoading('保存中...')
              const result = await apiSetEmergencyPhone(res.content)
              hideLoading()

              if (result.success) {
                this.emergencyPhone = res.content
                showSuccess('设置成功')
              } else {
                showError(result.error || '设置失败')
              }
            } catch (e) {
              hideLoading()
              showError('网络错误')
            }
          }
        }
      })
    },

    // 跳转到关于
    goAbout() {
      uni.navigateTo({
        url: '/pages/settings/about'
      })
    },

    // 跳转到帮助
    goHelp() {
      uni.navigateTo({
        url: '/pages/settings/help'
      })
    },

    // 退出登录
    async handleLogout() {
      const confirmed = await showConfirm('退出登录', '确定要退出登录吗？')
      if (!confirmed) return

      try {
        await apiLogout()
      } catch (e) {
        // 忽略错误
      }

      this.$store.dispatch('logout')
    }
  }
}
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding-bottom: env(safe-area-inset-bottom);
}

/* ============ 用户信息 ============ */
.user-info {
  display: flex;
  align-items: center;
  margin: 30rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx;
}

.avatar-wrapper {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.avatar {
  font-size: 48rpx;
  color: #FFFFFF;
  font-weight: bold;
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 34rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 8rpx;
}

.phone {
  font-size: 26rpx;
  color: #999999;
}

.role-tag {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.role-tag.parent {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.role-tag.child {
  background-color: rgba(76, 217, 100, 0.1);
  color: #4CD964;
}

/* ============ 菜单区块 ============ */
.menu-section {
  margin: 0 30rpx 30rpx;
}

.menu-title {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 16rpx;
  padding-left: 10rpx;
}

.menu-list {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #F0F0F0;

  &:last-child {
    border-bottom: none;
  }
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
}

.menu-value {
  font-size: 28rpx;
  color: #999999;
  margin-right: 10rpx;
}

.menu-arrow {
  font-size: 28rpx;
  color: #CCCCCC;
}

.menu-hint {
  padding: 16rpx 20rpx;
  background-color: #F5F9FF;
  border-radius: 0 0 20rpx 20rpx;

  text {
    font-size: 24rpx;
    color: #007AFF;
  }
}

/* ============ 退出登录 ============ */
.logout-section {
  padding: 60rpx 30rpx 30rpx;
}

.logout-section .btn {
  background-color: #FFFFFF;
  color: #FF3B30;
  border: none;
}

/* ============ 版本信息 ============ */
.version-info {
  text-align: center;
  padding: 30rpx 0;

  text {
    font-size: 24rpx;
    color: #CCCCCC;
  }
}
</style>

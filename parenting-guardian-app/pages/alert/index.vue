<template>
  <view class="alert-page">
    <view class="alert-list" v-if="alertList.length > 0">
      <view
        class="alert-item card"
        :class="{ unread: !item.isRead }"
        v-for="item in alertList"
        :key="item._id"
        @tap="handleAlert(item)"
      >
        <view class="alert-icon" :class="getAlertClass(item.alertType)">
          {{ getAlertIcon(item.alertType) }}
        </view>
        <view class="alert-content">
          <view class="alert-header">
            <text class="alert-title">{{ item.title }}</text>
            <text class="alert-time">{{ relativeTime(item.createTime) }}</text>
          </view>
          <text class="alert-text">{{ item.content }}</text>
          <view class="alert-meta" v-if="item.address">
            <text class="alert-location">📍 {{ item.address }}</text>
          </view>
        </view>
        <view class="alert-dot" v-if="!item.isRead"></view>
      </view>
    </view>

    <view class="empty" v-else>
      <text class="empty-icon">🔔</text>
      <text class="empty-text">暂无告警消息</text>
    </view>
  </view>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { getAlertList, readAlert } from '@/api/index.js'
import { relativeTime } from '@/utils/index.js'

export default {
  data() {
    return {
      alertList: []
    }
  },

  computed: {
    ...mapGetters(['isParent', 'childId'])
  },

  onLoad() {
    this.loadAlerts()
  },

  onShow() {
    this.loadAlerts()
  },

  onPullDownRefresh() {
    this.loadAlerts().finally(() => {
      uni.stopPullDownRefresh()
    })
  },

  methods: {
    // 加载告警列表
    async loadAlerts() {
      try {
        const res = await getAlertList()
        if (res.success) {
          this.alertList = res.data || []
        }
      } catch (e) {
        console.error('加载告警失败:', e)
      }
    },

    // 获取告警图标
    getAlertIcon(type) {
      const iconMap = {
        'SOS': '🆘',
        'USAGE_OVERTIME': '⏰',
        'NIGHT_USAGE': '🌙',
        'GEOFENCE': '📍',
        'UNINSTALL': '⚠️',
        'GEOFENCE_ENTER': '➡️',
        'GEOFENCE_EXIT': '⬅️'
      }
      return iconMap[type] || '🔔'
    },

    // 获取告警样式
    getAlertClass(type) {
      const classMap = {
        'SOS': 'danger',
        'USAGE_OVERTIME': 'warning',
        'NIGHT_USAGE': 'warning',
        'GEOFENCE': 'info',
        'UNINSTALL': 'danger'
      }
      return classMap[type] || 'info'
    },

    // 处理告警点击
    async handleAlert(item) {
      // 标记已读
      if (!item.isRead) {
        try {
          await readAlert(item._id)
          item.isRead = true
        } catch (e) {
          console.error('标记已读失败:', e)
        }
      }

      // SOS 告警处理
      if (item.alertType === 'SOS') {
        uni.showModal({
          title: '紧急求助',
          content: `${item.title}\n\n${item.content}\n\n位置: ${item.address || '未知'}`,
          confirmText: '查看位置',
          cancelText: '关闭',
          success: (res) => {
            if (res.confirm && item.latitude && item.longitude) {
              uni.openLocation({
                latitude: item.latitude,
                longitude: item.longitude,
                name: item.title,
                address: item.address
              })
            }
          }
        })
      }
    },

    // 相对时间
    relativeTime(time) {
      return relativeTime(time)
    }
  }
}
</script>

<style lang="scss" scoped>
.alert-page {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding: 30rpx;
}

.alert-list {
  .alert-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 20rpx;
    position: relative;

    &.unread {
      background-color: #F0F9FF;
    }

    &:active {
      opacity: 0.8;
    }
  }
}

.alert-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.alert-icon.danger {
  background-color: rgba(255, 59, 48, 0.1);
}

.alert-icon.warning {
  background-color: rgba(255, 149, 0, 0.1);
}

.alert-icon.info {
  background-color: rgba(0, 122, 255, 0.1);
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.alert-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.alert-time {
  font-size: 22rpx;
  color: #999999;
}

.alert-text {
  display: block;
  font-size: 26rpx;
  color: #666666;
  line-height: 1.5;
  margin-bottom: 8rpx;
}

.alert-meta {
  .alert-location {
    font-size: 22rpx;
    color: #999999;
  }
}

.alert-dot {
  position: absolute;
  top: 30rpx;
  right: 30rpx;
  width: 16rpx;
  height: 16rpx;
  background-color: #FF3B30;
  border-radius: 50%;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}
</style>

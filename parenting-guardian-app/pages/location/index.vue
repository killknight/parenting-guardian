<template>
  <view class="location-page">
    <!-- 家长端：位置守护 -->
    <view v-if="isParent" class="parent-location">
      <!-- 地图区域 -->
      <view class="map-container">
        <map
          id="locationMap"
          class="map"
          :latitude="currentLocation.latitude"
          :longitude="currentLocation.longitude"
          :scale="mapScale"
          :markers="markers"
          :covers="covers"
          show-location
        ></map>

        <!-- 刷新按钮 -->
        <view class="refresh-btn" @tap="refreshLocation">
          <text>🔄</text>
        </view>
      </view>

      <!-- 位置信息 -->
      <view class="location-info-card">
        <view class="info-header">
          <text class="child-name">{{ currentChild?.nickname || '孩子' }}</text>
          <text class="update-time">{{ relativeTime(lastUpdateTime) }}</text>
        </view>
        <view class="info-detail">
          <text class="address">{{ currentAddress || '正在获取位置...' }}</text>
          <view class="location-status">
            <text class="status-dot" :class="{ online: isOnline }"></text>
            <text class="status-text">{{ isOnline ? '实时定位中' : '设备离线' }}</text>
          </view>
        </view>
        <view class="location-meta">
          <view class="meta-item">
            <text class="meta-label">定位方式</text>
            <text class="meta-value">{{ locationType }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-label">精度</text>
            <text class="meta-value">{{ accuracy }}m</text>
          </view>
        </view>
      </view>

      <!-- 安全围栏 -->
      <view class="geofence-section">
        <view class="section-header">
          <text class="section-title">⚠️ 安全围栏</text>
          <text class="add-btn" @tap="showAddGeofence">+ 添加</text>
        </view>
        <view class="geofence-list" v-if="geofenceList.length > 0">
          <view
            class="geofence-item"
            v-for="fence in geofenceList"
            :key="fence._id"
          >
            <view class="fence-icon">{{ getFenceIcon(fence.name) }}</view>
            <view class="fence-info">
              <text class="fence-name">{{ fence.name }}</text>
              <text class="fence-radius">半径 {{ fence.radius }}m</text>
            </view>
            <view class="fence-status">
              <text class="status-badge" :class="{ safe: fence.currentStatus === 'INSIDE' }">
                {{ fence.currentStatus === 'INSIDE' ? '安全' : '离开' }}
              </text>
            </view>
          </view>
        </view>
        <view class="empty" v-else>
          <text class="empty-text">暂无安全区域</text>
          <text class="empty-hint">添加家和学校等安全区域</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-bar">
        <view class="action-btn" @tap="navigateTo">
          <text class="action-icon">🗺️</text>
          <text class="action-text">导航</text>
        </view>
        <view class="action-btn" @tap="viewTrajectory">
          <text class="action-icon">📍</text>
          <text class="action-text">轨迹</text>
        </view>
        <view class="action-btn" @tap="callChild">
          <text class="action-icon">📞</text>
          <text class="action-text">打电话</text>
        </view>
      </view>
    </view>

    <!-- 孩子端：显示提示 -->
    <view v-else class="child-location">
      <view class="child-tips">
        <text class="tips-icon">👀</text>
        <text class="tips-title">位置守护中</text>
        <text class="tips-text">家长正在守护你的安全</text>
      </view>
    </view>

    <!-- 添加围栏弹窗 -->
    <uni-popup ref="addGeofencePopup" type="bottom">
      <view class="add-geofence-popup">
        <view class="popup-header">
          <text class="popup-title">添加安全区域</text>
          <text class="popup-close" @tap="closeAddGeofence">✕</text>
        </view>
        <view class="popup-form">
          <view class="form-item">
            <text class="form-label">区域名称</text>
            <input
              class="form-input"
              v-model="newFence.name"
              placeholder="如：家、学校"
            />
          </view>
          <view class="form-item">
            <text class="form-label">半径范围</text>
            <view class="radius-selector">
              <view
                class="radius-option"
                :class="{ active: newFence.radius === 100 }"
                @tap="newFence.radius = 100"
              >
                100m
              </view>
              <view
                class="radius-option"
                :class="{ active: newFence.radius === 200 }"
                @tap="newFence.radius = 200"
              >
                200m
              </view>
              <view
                class="radius-option"
                :class="{ active: newFence.radius === 300 }"
                @tap="newFence.radius = 300"
              >
                300m
              </view>
              <view
                class="radius-option"
                :class="{ active: newFence.radius === 500 }"
                @tap="newFence.radius = 500"
              >
                500m
              </view>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">告警设置</text>
            <view class="alert-options">
              <label class="alert-option">
                <checkbox value="in" v-model="newFence.alertIn" color="#007AFF" />
                <text>进入告警</text>
              </label>
              <label class="alert-option">
                <checkbox value="out" v-model="newFence.alertOut" color="#007AFF" />
                <text>离开告警</text>
              </label>
            </view>
          </view>
        </view>
        <button class="btn btn-primary btn-block" @tap="handleAddGeofence">
          确 定
        </button>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import {
  getCurrentLocation,
  getLocationHistory,
  createGeofence,
  getGeofenceList
} from '@/api/index.js'
import { relativeTime, showLoading, hideLoading, showError, showSuccess } from '@/utils/index.js'

export default {
  data() {
    return {
      mapScale: 16,
      currentLocation: {
        latitude: 39.908823,
        longitude: 116.397470,
        address: '',
        accuracy: 0,
        locationType: 'GPS'
      },
      lastUpdateTime: null,
      isOnline: false,
      currentAddress: '',
      locationType: 'GPS',
      accuracy: 0,
      geofenceList: [],
      markers: [],
      covers: [],
      newFence: {
        name: '',
        radius: 200,
        alertIn: true,
        alertOut: true
      }
    }
  },

  computed: {
    ...mapState(['currentChild']),
    ...mapGetters(['isParent']),
    currentChild() {
      return this.$store.state.currentChild || this.userInfo
    }
  },

  onLoad() {
    if (this.isParent) {
      this.loadLocation()
      this.loadGeofences()
    }
  },

  onShow() {
    if (this.isParent) {
      this.startAutoRefresh()
    }
  },

  onHide() {
    this.stopAutoRefresh()
  },

  methods: {
    // 加载位置
    async loadLocation() {
      const childId = this.currentChild?._id
      if (!childId) return

      try {
        showLoading('加载中...')
        const res = await getCurrentLocation(childId)
        hideLoading()

        if (res.success && res.data) {
          const location = res.data
          this.currentLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address || ''
          }
          this.currentAddress = location.address || '未知位置'
          this.lastUpdateTime = location.timestamp
          this.isOnline = location.isOnline !== false
          this.locationType = location.locationType || 'GPS'
          this.accuracy = Math.round(location.accuracy || 0)

          // 更新地图标记
          this.markers = [{
            id: 1,
            latitude: location.latitude,
            longitude: location.longitude,
            width: 50,
            height: 50,
            iconPath: '/static/images/marker.png',
            callout: {
              content: this.currentChild?.nickname || '孩子',
              color: '#333333',
              fontSize: 14,
              borderRadius: 10,
              bgColor: '#FFFFFF',
              padding: 10,
              display: 'ALWAYS'
            }
          }]
        }
      } catch (e) {
        hideLoading()
        console.error('加载位置失败:', e)
      }
    },

    // 刷新位置
    refreshLocation() {
      this.loadLocation()
    },

    // 开始自动刷新
    startAutoRefresh() {
      this.refreshTimer = setInterval(() => {
        this.loadLocation()
      }, 30000) // 每30秒刷新
    },

    // 停止自动刷新
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },

    // 加载围栏列表
    async loadGeofences() {
      const childId = this.currentChild?._id
      if (!childId) return

      try {
        const res = await getGeofenceList(childId)
        if (res.success) {
          this.geofenceList = res.data || []
        }
      } catch (e) {
        console.error('加载围栏失败:', e)
      }
    },

    // 获取围栏图标
    getFenceIcon(name) {
      const iconMap = {
        '家': '🏠',
        '家': '🏠',
        '学校': '🏫',
        '学校': '🏫',
        '公司': '🏢'
      }
      return iconMap[name] || '📍'
    },

    // 显示添加围栏
    showAddGeofence() {
      this.$refs.addGeofencePopup.open()
    },

    // 关闭添加围栏
    closeAddGeofence() {
      this.$refs.addGeofencePopup.close()
      this.newFence = {
        name: '',
        radius: 200,
        alertIn: true,
        alertOut: true
      }
    },

    // 添加围栏
    async handleAddGeofence() {
      if (!this.newFence.name) {
        showError('请输入区域名称')
        return
      }

      const childId = this.currentChild?._id
      if (!childId) return

      try {
        showLoading('添加中...')
        const res = await createGeofence({
          childId,
          name: this.newFence.name,
          latitude: this.currentLocation.latitude,
          longitude: this.currentLocation.longitude,
          radius: this.newFence.radius,
          alertIn: this.newFence.alertIn,
          alertOut: this.newFence.alertOut
        })
        hideLoading()

        if (res.success) {
          showSuccess('添加成功')
          this.closeAddGeofence()
          this.loadGeofences()
        } else {
          showError(res.error || '添加失败')
        }
      } catch (e) {
        hideLoading()
        showError('网络错误')
      }
    },

    // 导航
    navigateTo() {
      uni.openLocation({
        latitude: this.currentLocation.latitude,
        longitude: this.currentLocation.longitude,
        name: this.currentChild?.nickname || '孩子位置',
        address: this.currentAddress
      })
    },

    // 查看轨迹
    viewTrajectory() {
      const childId = this.currentChild?._id
      uni.navigateTo({
        url: `/pages/location/trajectory?childId=${childId}`
      })
    },

    // 打电话
    callChild() {
      const phone = this.currentChild?.emergencyPhone
      if (phone) {
        uni.makePhoneCall({
          phoneNumber: phone
        })
      } else {
        showError('未设置紧急联系电话')
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
.location-page {
  min-height: 100vh;
  background-color: #F5F5F5;
}

/* ============ 地图 ============ */
.map-container {
  position: relative;
  height: 500rpx;
}

.map {
  width: 100%;
  height: 100%;
}

.refresh-btn {
  position: absolute;
  right: 30rpx;
  bottom: 30rpx;
  width: 80rpx;
  height: 80rpx;
  background-color: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

/* ============ 位置信息卡片 ============ */
.location-info-card {
  margin: -60rpx 30rpx 30rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.child-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
}

.update-time {
  font-size: 24rpx;
  color: #999999;
}

.info-detail {
  margin-bottom: 20rpx;
}

.address {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 12rpx;
}

.location-status {
  display: flex;
  align-items: center;
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

.status-text {
  font-size: 24rpx;
  color: #999999;
}

.location-meta {
  display: flex;
  gap: 40rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F0F0F0;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 22rpx;
  color: #999999;
  margin-bottom: 8rpx;
}

.meta-value {
  font-size: 26rpx;
  color: #333333;
}

/* ============ 安全围栏 ============ */
.geofence-section {
  margin: 0 30rpx 30rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.add-btn {
  font-size: 28rpx;
  color: #007AFF;
}

.geofence-list {
  .geofence-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #F0F0F0;

    &:last-child {
      border-bottom: none;
    }
  }
}

.fence-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.fence-info {
  flex: 1;
}

.fence-name {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 8rpx;
}

.fence-radius {
  font-size: 24rpx;
  color: #999999;
}

.status-badge {
  padding: 6rpx 16rpx;
  background-color: #FFF0F0;
  color: #FF3B30;
  font-size: 22rpx;
  border-radius: 20rpx;
}

.status-badge.safe {
  background-color: #F0FFF4;
  color: #4CD964;
}

/* ============ 操作按钮 ============ */
.action-bar {
  display: flex;
  justify-content: space-around;
  padding: 30rpx 0;
  background-color: #FFFFFF;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
}

.action-text {
  font-size: 24rpx;
  color: #666666;
}

/* ============ 孩子端 ============ */
.child-location {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #F5F5F5 0%, #FFFFFF 100%);
}

.child-tips {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.tips-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.tips-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 16rpx;
}

.tips-text {
  font-size: 28rpx;
  color: #999999;
}

/* ============ 添加围栏弹窗 ============ */
.add-geofence-popup {
  background-color: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
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

.popup-form {
  .form-item {
    margin-bottom: 30rpx;
  }

  .form-label {
    display: block;
    font-size: 28rpx;
    color: #333333;
    margin-bottom: 16rpx;
  }

  .form-input {
    height: 88rpx;
    background-color: #F5F5F5;
    border-radius: 16rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
  }
}

.radius-selector {
  display: flex;
  gap: 20rpx;
}

.radius-option {
  flex: 1;
  height: 80rpx;
  background-color: #F5F5F5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666666;
}

.radius-option.active {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  border: 2rpx solid #007AFF;
}

.alert-options {
  display: flex;
  gap: 40rpx;
}

.alert-option {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  color: #333333;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.empty-hint {
  font-size: 24rpx;
  color: #CCCCCC;
  margin-top: 8rpx;
}
</style>

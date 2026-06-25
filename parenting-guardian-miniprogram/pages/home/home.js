const app = getApp();

Page({
  data: {
    isOnline: true,
    lastUpdate: '刚刚',
    todayStats: {
      screenTime: '2h 35m',
      appCount: 12,
      locationUpdate: '5分钟前',
      alertCount: 0
    },
    deviceInfo: {
      model: '小米 Redmi K60',
      battery: 78,
      signal: '良好'
    }
  },

  onLoad() {
    this.refreshData();
    this.startPolling();
  },

  onUnload() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
  },

  refreshData() {
    const token = app.globalData.token;
    if (!token) return;

    wx.request({
      url: `${app.globalData.serverUrl}/api/parent/device-status`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            isOnline: res.data.isOnline,
            lastUpdate: res.data.lastUpdate || '刚刚',
            todayStats: res.data.todayStats || this.data.todayStats,
            deviceInfo: res.data.deviceInfo || this.data.deviceInfo
          });
        }
      }
    });
  },

  startPolling() {
    this.pollingTimer = setInterval(() => {
      this.refreshData();
    }, 30000);
  },

  goToControl() {
    wx.navigateTo({
      url: '/pages/control/control'
    });
  },

  goToLocation() {
    wx.switchTab({
      url: '/pages/location/location'
    });
  },

  goToUsage() {
    wx.navigateTo({
      url: '/pages/usage/usage'
    });
  },

  sendAlert() {
    wx.showModal({
      title: '发送提醒',
      content: '确定要向孩子手机发送提醒吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '已发送',
            icon: 'success'
          });
        }
      }
    });
  }
});
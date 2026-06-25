const app = getApp();

Page({
  data: {
    isLocked: false,
    dailyLimit: 4,
    timeRange: '08:00-21:00',
    startTime: '08:00',
    endTime: '21:00',
    allowedAppCount: 15,
    appLimitEnabled: true,
    operationLog: [
      { action: '解锁设备', time: '今天 08:30', type: 'unlock' },
      { action: '锁定设备', time: '今天 07:00', type: 'lock' },
      { action: '设置使用时长为4小时', time: '昨天 22:00', type: 'limit' }
    ]
  },

  onLoad() {
    this.loadDeviceStatus();
  },

  loadDeviceStatus() {
    const token = app.globalData.token;
    if (!token) return;

    wx.request({
      url: `${app.globalData.serverUrl}/api/parent/device-control/status`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            isLocked: res.data.isLocked,
            dailyLimit: res.data.dailyLimit || 4,
            startTime: res.data.startTime || '08:00',
            endTime: res.data.endTime || '21:00'
          });
        }
      }
    });
  },

  lockDevice() {
    wx.showModal({
      title: '确认锁定',
      content: '确定要锁定孩子手机吗？锁定后孩子将无法使用手机。',
      success: (res) => {
        if (res.confirm) {
          this.executeLock(true);
        }
      }
    });
  },

  unlockDevice() {
    wx.showModal({
      title: '确认解锁',
      content: '确定要解锁孩子手机吗？孩子将可以正常使用手机。',
      success: (res) => {
        if (res.confirm) {
          this.executeLock(false);
        }
      }
    });
  },

  executeLock(locked) {
    const token = app.globalData.token;
    if (!token) return;

    wx.request({
      url: `${app.globalData.serverUrl}/api/parent/device-control/lock`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { locked },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ isLocked: locked });
          wx.showToast({
            title: locked ? '已锁定' : '已解锁',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: '操作失败',
            icon: 'none'
          });
        }
      }
    });
  },

  onDailyLimitChange(e) {
    this.setData({ dailyLimit: e.detail.value });
    this.updateLimit();
  },

  onStartTimeChange(e) {
    this.setData({
      startTime: e.detail.value,
      timeRange: `${e.detail.value}-${this.data.endTime}`
    });
    this.updateLimit();
  },

  onEndTimeChange(e) {
    this.setData({
      endTime: e.detail.value,
      timeRange: `${this.data.startTime}-${e.detail.value}`
    });
    this.updateLimit();
  },

  onAppLimitChange(e) {
    this.setData({ appLimitEnabled: e.detail.value });
    this.updateLimit();
  },

  updateLimit() {
    const token = app.globalData.token;
    if (!token) return;

    wx.request({
      url: `${app.globalData.serverUrl}/api/parent/device-control/limit`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        dailyLimit: this.data.dailyLimit,
        startTime: this.data.startTime,
        endTime: this.data.endTime,
        appLimitEnabled: this.data.appLimitEnabled
      }
    });
  }
});
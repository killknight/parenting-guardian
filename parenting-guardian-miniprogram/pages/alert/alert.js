const app = getApp();

Page({
  data: {
    alertSettings: {
      lowBattery: true,
      outOfRange: true,
      appTimeout: false,
      deviceOffline: true
    },
    alertHistory: [
      { type: 'geo', title: '离开安全区域', desc: '孩子离开学校范围', time: '今天 16:30' },
      { type: 'battery', title: '电量低提醒', desc: '孩子手机电量低于20%', time: '今天 14:20' },
      { type: 'geo', title: '进入安全区域', desc: '孩子到达学校', time: '今天 07:50' }
    ]
  },

  onLoad() {
    this.loadAlertSettings();
  },

  loadAlertSettings() {
    const token = app.globalData.token;
    if (!token) return;

    wx.request({
      url: `${app.globalData.serverUrl}/api/parent/alert-settings`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            alertSettings: res.data.alertSettings || this.data.alertSettings
          });
        }
      }
    });
  },

  sendEmergencyAlert() {
    wx.showModal({
      title: '紧急求助',
      content: '确定要发送紧急求助通知给孩子吗？',
      success: (res) => {
        if (res.confirm) {
          const token = app.globalData.token;
          if (!token) return;

          wx.request({
            url: `${app.globalData.serverUrl}/api/parent/alert/emergency`,
            method: 'POST',
            header: {
              'Authorization': `Bearer ${token}`
            },
            success: (res) => {
              if (res.statusCode === 200) {
                wx.showToast({
                  title: '已发送求助',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: '发送失败',
                  icon: 'none'
                });
              }
            }
          });
        }
      }
    });
  },

  onSettingChange(e) {
    const type = e.currentTarget.dataset.type;
    const value = e.detail.value;
    this.setData({
      [`alertSettings.${type}`]: value
    });

    const token = app.globalData.token;
    if (!token) return;

    wx.request({
      url: `${app.globalData.serverUrl}/api/parent/alert-settings`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        type,
        value
      }
    });
  }
});
const app = getApp();

Page({
  data: {
    userInfo: {
      nickname: '家长用户',
      phone: '138****8888',
      avatar: '/images/avatar.png'
    }
  },

  onLoad() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    const token = app.globalData.token;
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.request({
      url: `${app.globalData.serverUrl}/api/user/info`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            userInfo: res.data.userInfo || this.data.userInfo
          });
        }
      }
    });
  },

  manageDevice() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  addDevice() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  notificationSettings() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  securitySettings() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  privacySettings() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  checkUpdate() {
    wx.showToast({ title: '已是最新版本', icon: 'success' });
  },

  viewAgreement() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  viewPrivacy() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          app.globalData.token = null;
          app.globalData.userInfo = null;
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
});
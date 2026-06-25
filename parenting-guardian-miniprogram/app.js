// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    userRole: 'parent',
    serverUrl: 'https://env-00jy6g81zqkm.cloud.alipay.com'
  },
  onLaunch() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
    }
  }
})
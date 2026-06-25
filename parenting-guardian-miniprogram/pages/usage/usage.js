const app = getApp();

Page({
  data: {
    todayStats: {
      totalTime: '2h 35m',
      appCount: 12
    },
    weekData: [
      { day: '周一', time: '3h', height: 90 },
      { day: '周二', time: '2h', height: 60 },
      { day: '周三', time: '4h', height: 120 },
      { day: '周四', time: '2h', height: 60 },
      { day: '周五', time: '3h', height: 90 },
      { day: '周六', time: '5h', height: 150 },
      { day: '周日', time: '2h', height: 60 }
    ],
    appUsageList: [
      { name: '王者荣耀', duration: '1h 20m', percent: 85, icon: '/images/game.png' },
      { name: '抖音', duration: '45m', percent: 55, icon: '/images/video.png' },
      { name: '微信', duration: '30m', percent: 35, icon: '/images/wechat.png' },
      { name: 'QQ', duration: '15m', percent: 18, icon: '/images/qq.png' },
      { name: '淘宝', duration: '10m', percent: 12, icon: '/images/shop.png' }
    ],
    categoryStats: [
      { name: '游戏', time: '1h 20m', color: '#FF6B6B' },
      { name: '社交', time: '45m', color: '#4A90E2' },
      { name: '视频', time: '45m', color: '#67B26F' },
      { name: '学习', time: '30m', color: '#F6D365' }
    ]
  },

  onLoad() {
    this.loadUsageData();
  },

  loadUsageData() {
    const token = app.globalData.token;
    if (!token) return;

    wx.request({
      url: `${app.globalData.serverUrl}/api/parent/usage-stats`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            todayStats: res.data.todayStats || this.data.todayStats,
            appUsageList: res.data.appUsageList || this.data.appUsageList,
            weekData: res.data.weekData || this.data.weekData
          });
        }
      }
    });
  },

  viewAll() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  }
});
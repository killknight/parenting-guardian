const app = getApp();

Page({
  data: {
    latitude: 39.908823,
    longitude: 116.397470,
    address: '北京市朝阳区建国门外大街1号',
    gpsType: 'GPS + 网络',
    accuracy: '±15米',
    updateTime: '刚刚',
    trailCount: 5,
    trailList: [
      { address: '家', time: '08:30' },
      { address: '北京四中', time: '12:00' },
      { address: '麦当劳', time: '12:30' },
      { address: '学校', time: '14:00' },
      { address: '家', time: '18:00' }
    ],
    markers: []
  },

  onLoad() {
    this.setMarkers();
    this.refreshLocation();
  },

  setMarkers() {
    const markers = [{
      id: 1,
      latitude: this.data.latitude,
      longitude: this.data.longitude,
      width: 40,
      height: 40,
      iconPath: '/images/child-location.png'
    }];
    this.setData({ markers });
  },

  refreshLocation() {
    const token = app.globalData.token;
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.request({
      url: `${app.globalData.serverUrl}/api/parent/location`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            latitude: res.data.latitude || this.data.latitude,
            longitude: res.data.longitude || this.data.longitude,
            address: res.data.address || this.data.address,
            updateTime: '刚刚',
            trailList: res.data.trailList || this.data.trailList
          });
          this.setMarkers();
        }
      },
      fail: () => {
        wx.showToast({ title: '获取位置失败', icon: 'none' });
      }
    });
  }
});
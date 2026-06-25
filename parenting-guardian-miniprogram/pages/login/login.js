const app = getApp();

Page({
  data: {
    phone: '',
    password: '',
    smsCode: '',
    loginType: 'password',
    userRole: 'parent',
    countdown: 0
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onSmsCodeInput(e) {
    this.setData({ smsCode: e.detail.value });
  },

  selectRole(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({ userRole: role });
  },

  switchLoginType() {
    const newType = this.data.loginType === 'password' ? 'sms' : 'password';
    this.setData({ loginType: newType });
  },

  sendSmsCode() {
    if (this.data.countdown > 0) return;
    if (!this.data.phone || this.data.phone.length !== 11) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return;
    }

    wx.request({
      url: `${app.globalData.serverUrl}/api/auth/send-sms`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { phone: this.data.phone },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: '验证码已发送', icon: 'success' });
          this.startCountdown();
        } else {
          wx.showToast({ title: '发送失败', icon: 'none' });
        }
      }
    });
  },

  startCountdown() {
    this.setData({ countdown: 60 });
    const timer = setInterval(() => {
      const countdown = this.data.countdown - 1;
      if (countdown <= 0) {
        clearInterval(timer);
      }
      this.setData({ countdown });
    }, 1000);
  },

  doLogin() {
    const { phone, password, smsCode, loginType, userRole } = this.data;

    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return;
    }

    if (loginType === 'password' && !password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    if (loginType === 'sms' && (!smsCode || smsCode.length !== 6)) {
      wx.showToast({ title: '请输入6位验证码', icon: 'none' });
      return;
    }

    wx.request({
      url: `${app.globalData.serverUrl}/api/auth/login`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        phone,
        password: loginType === 'password' ? password : undefined,
        smsCode: loginType === 'sms' ? smsCode : undefined,
        role: userRole
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.token) {
          app.globalData.token = res.data.token;
          app.globalData.userRole = userRole;
          wx.setStorageSync('token', res.data.token);
          wx.setStorageSync('userRole', userRole);
          
          wx.showToast({ title: '登录成功', icon: 'success' });
          setTimeout(() => {
            wx.switchTab({ url: '/pages/home/home' });
          }, 1000);
        } else {
          wx.showToast({ title: res.data.message || '登录失败', icon: 'none' });
        }
      }
    });
  },

  // 微信一键登录
  wechatLogin() {
    wx.showLoading({ title: '登录中...', mask: true });

    wx.login({
      success: (res) => {
        if (res.code) {
          // 获取用户信息
          wx.getUserProfile({
            desc: '用于完善会员资料',
            success: (userRes) => {
              const userInfo = userRes.userInfo;
              this.doWechatLogin(res.code, userInfo);
            },
            fail: () => {
              // 用户拒绝授权，仍用code登录
              this.doWechatLogin(res.code, null);
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({ title: '微信登录失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      }
    });
  },

  doWechatLogin(code, userInfo) {
    wx.request({
      url: `${app.globalData.serverUrl}/api/auth/wechat-login`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        code,
        userInfo: userInfo || undefined,
        role: this.data.userRole
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data.token) {
          app.globalData.token = res.data.token;
          app.globalData.userRole = res.data.role || this.data.userRole;
          wx.setStorageSync('token', res.data.token);
          wx.setStorageSync('userRole', res.data.role || this.data.userRole);
          
          wx.showToast({ title: '登录成功', icon: 'success' });
          setTimeout(() => {
            wx.switchTab({ url: '/pages/home/home' });
          }, 1000);
        } else {
          wx.showToast({ title: res.data.message || '登录失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
});
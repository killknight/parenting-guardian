<template>
  <view class="login-page">
    <!-- Logo 区域 -->
    <view class="logo-area">
      <view class="logo-wrapper">
        <text class="logo-icon">👨‍👩‍👧</text>
      </view>
      <text class="app-name">亲子守护</text>
      <text class="app-slogan">守护孩子健康成长</text>
    </view>

    <!-- 登录表单 -->
    <view class="form-area">
      <!-- 手机号 -->
      <view class="form-item">
        <view class="input-wrap">
          <text class="input-icon">📱</text>
          <input
            type="number"
            v-model="phone"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </view>
      </view>

      <!-- 密码 -->
      <view class="form-item" v-if="loginType === 'password'">
        <view class="input-wrap">
          <text class="input-icon">🔒</text>
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="请输入密码"
          />
          <text class="password-toggle" @tap="showPassword = !showPassword">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </text>
        </view>
      </view>

      <!-- 验证码 -->
      <view class="form-item" v-if="loginType === 'code'">
        <view class="input-wrap">
          <text class="input-icon">🔢</text>
          <input
            type="number"
            v-model="code"
            placeholder="请输入验证码"
            maxlength="6"
          />
          <text
            class="code-btn"
            :class="{ disabled: countdown > 0 }"
            @tap="sendCode"
          >
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </text>
        </view>
      </view>

      <!-- 切换登录方式 -->
      <view class="login-type-toggle">
        <text @tap="toggleLoginType">
          {{ loginType === 'password' ? '验证码登录' : '密码登录' }}
        </text>
      </view>

      <!-- 登录按钮 -->
      <button class="btn btn-primary btn-block mt-20" @tap="handleLogin">
        登 录
      </button>

      <!-- 注册链接 -->
      <view class="register-link">
        <text class="text-gray">还没有账号？</text>
        <text class="text-primary" @tap="goRegister">立即注册</text>
      </view>
    </view>

    <!-- 角色选择弹窗 -->
    <uni-popup ref="rolePopup" type="center">
      <view class="role-popup">
        <view class="popup-title">选择您的角色</view>
        <view class="role-list">
          <view
            class="role-item"
            :class="{ active: selectedRole === 'PARENT' }"
            @tap="selectedRole = 'PARENT'"
          >
            <text class="role-icon">👨</text>
            <text class="role-name">家长</text>
            <text class="role-desc">守护孩子，远程管理</text>
          </view>
          <view
            class="role-item"
            :class="{ active: selectedRole === 'CHILD' }"
            @tap="selectedRole = 'CHILD'"
          >
            <text class="role-icon">👦</text>
            <text class="role-name">孩子</text>
            <text class="role-desc">被家长守护，健康成长</text>
          </view>
        </view>
        <button class="btn btn-primary btn-block" @tap="confirmRole">
          确 定
        </button>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { login, sendCode } from '@/api/index.js'
import { validatePhone, showLoading, hideLoading, showError, showSuccess } from '@/utils/index.js'

export default {
  data() {
    return {
      phone: '',
      password: '',
      code: '',
      loginType: 'password', // password / code
      showPassword: false,
      countdown: 0,
      selectedRole: 'PARENT',
      isRegistering: false // 是否是注册流程
    }
  },

  methods: {
    // 切换登录方式
    toggleLoginType() {
      this.loginType = this.loginType === 'password' ? 'code' : 'password'
    },

    // 发送验证码
    async sendCode() {
      if (this.countdown > 0) return

      if (!validatePhone(this.phone)) {
        showError('请输入正确的手机号')
        return
      }

      try {
        showLoading('发送中...')
        const res = await sendCode(this.phone)
        hideLoading()

        if (res.success) {
          showSuccess('验证码已发送')
          this.countdown = 60
          const timer = setInterval(() => {
            this.countdown--
            if (this.countdown <= 0) {
              clearInterval(timer)
            }
          }, 1000)
        } else {
          showError(res.error || '发送失败')
        }
      } catch (e) {
        hideLoading()
        showError('网络错误')
      }
    },

    // 登录
    async handleLogin() {
      if (!validatePhone(this.phone)) {
        showError('请输入正确的手机号')
        return
      }

      if (this.loginType === 'password' && !this.password) {
        showError('请输入密码')
        return
      }

      if (this.loginType === 'code' && !this.code) {
        showError('请输入验证码')
        return
      }

      try {
        showLoading('登录中...')
        const res = await login(this.phone, this.loginType === 'password' ? this.password : this.code)
        hideLoading()

        if (res.success) {
          // 保存用户信息
          this.$store.commit('SET_USER_INFO', res.data)
          this.$store.commit('SET_TOKEN', res.data.token)
          this.$store.commit('SET_ROLE', res.data.role)

          // 检查是否已选择角色
          if (!res.data.role) {
            // 需要选择角色
            this.$refs.rolePopup.open()
          } else {
            // 已选择角色，跳转到首页
            this.goHome()
          }
        } else {
          showError(res.error || '登录失败')
        }
      } catch (e) {
        hideLoading()
        showError('网络错误')
      }
    },

    // 确认角色选择
    confirmRole() {
      this.$store.commit('SET_ROLE', this.selectedRole)
      this.$refs.rolePopup.close()
      this.goHome()
    },

    // 跳转到注册页
    goRegister() {
      uni.navigateTo({
        url: '/pages/login/register'
      })
    },

    // 跳转到首页
    goHome() {
      // 根据角色跳转到不同首页
      const role = this.$store.getters.role || 'PARENT'
      uni.switchTab({
        url: '/pages/home/index'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%);
  padding: 0 60rpx;
}

.logo-area {
  padding-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-wrapper {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 122, 255, 0.3);
}

.logo-icon {
  font-size: 80rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #333333;
  margin-top: 30rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: #999999;
  margin-top: 10rpx;
}

.form-area {
  margin-top: 80rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.input-wrap {
  display: flex;
  align-items: center;
  height: 100rpx;
  background-color: #FFFFFF;
  border-radius: 50rpx;
  padding: 0 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.input-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.input-wrap input {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
}

.password-toggle {
  font-size: 36rpx;
  padding: 10rpx;
}

.code-btn {
  font-size: 26rpx;
  color: #007AFF;
  white-space: nowrap;
}

.code-btn.disabled {
  color: #CCCCCC;
}

.login-type-toggle {
  text-align: right;
  padding: 20rpx 0;
}

.login-type-toggle text {
  color: #007AFF;
  font-size: 26rpx;
}

.register-link {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40rpx;
  gap: 10rpx;
}

/* 角色选择弹窗 */
.role-popup {
  width: 600rpx;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx;
}

.popup-title {
  font-size: 36rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40rpx;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.role-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx;
  border: 4rpx solid #EEEEEE;
  border-radius: 16rpx;
  transition: all 0.3s;
}

.role-item.active {
  border-color: #007AFF;
  background-color: rgba(0, 122, 255, 0.05);
}

.role-icon {
  font-size: 80rpx;
  margin-bottom: 10rpx;
}

.role-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.role-desc {
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
}
</style>

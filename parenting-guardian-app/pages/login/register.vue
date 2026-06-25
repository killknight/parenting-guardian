<template>
  <view class="register-page">
    <!-- 标题 -->
    <view class="header">
      <text class="page-title">注册账号</text>
      <text class="page-subtitle">创建一个新账号开始守护之旅</text>
    </view>

    <!-- 注册表单 -->
    <view class="form-area">
      <!-- 角色选择 -->
      <view class="form-item">
        <view class="form-label">我是</view>
        <view class="role-select">
          <view
            class="role-option"
            :class="{ active: role === 'PARENT' }"
            @tap="role = 'PARENT'"
          >
            <text class="role-icon">👨</text>
            <text class="role-text">家长</text>
          </view>
          <view
            class="role-option"
            :class="{ active: role === 'CHILD' }"
            @tap="role = 'CHILD'"
          >
            <text class="role-icon">👦</text>
            <text class="role-text">孩子</text>
          </view>
        </view>
      </view>

      <!-- 昵称 -->
      <view class="form-item">
        <view class="input-wrap">
          <text class="input-icon">👤</text>
          <input
            v-model="nickname"
            placeholder="请输入昵称"
            maxlength="20"
          />
        </view>
      </view>

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

      <!-- 验证码 -->
      <view class="form-item">
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
            @tap="handleSendCode"
          >
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </text>
        </view>
      </view>

      <!-- 密码 -->
      <view class="form-item">
        <view class="input-wrap">
          <text class="input-icon">🔒</text>
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="请设置密码（6位以上）"
          />
          <text class="password-toggle" @tap="showPassword = !showPassword">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </text>
        </view>
      </view>

      <!-- 确认密码 -->
      <view class="form-item">
        <view class="input-wrap">
          <text class="input-icon">🔐</text>
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="confirmPassword"
            placeholder="请确认密码"
          />
        </view>
      </view>

      <!-- 服务协议 -->
      <view class="agreement">
        <radio-group @change="agreeChange">
          <label class="agreement-label">
            <radio value="1" :checked="agreed" color="#007AFF" />
            <text class="text-gray">我已阅读并同意</text>
            <text class="text-primary" @tap.stop="showAgreement('user')">《用户协议》</text>
            <text class="text-gray">和</text>
            <text class="text-primary" @tap.stop="showAgreement('privacy')">《隐私政策》</text>
          </label>
        </radio-group>
      </view>

      <!-- 注册按钮 -->
      <button
        class="btn btn-primary btn-block"
        :disabled="!canRegister"
        @tap="handleRegister"
      >
        注 册
      </button>

      <!-- 返回登录 -->
      <view class="back-login" @tap="goBack">
        <text class="text-gray">已有账号？</text>
        <text class="text-primary">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script>
import { register, sendCode } from '@/api/index.js'
import { validatePhone, showLoading, hideLoading, showError, showSuccess } from '@/utils/index.js'

export default {
  data() {
    return {
      role: 'PARENT',
      nickname: '',
      phone: '',
      code: '',
      password: '',
      confirmPassword: '',
      showPassword: false,
      countdown: 0,
      agreed: false
    }
  },

  computed: {
    canRegister() {
      return (
        this.nickname &&
        validatePhone(this.phone) &&
        this.code.length === 6 &&
        this.password.length >= 6 &&
        this.password === this.confirmPassword &&
        this.agreed
      )
    }
  },

  methods: {
    // 同意协议
    agreeChange(e) {
      this.agreed = e.detail.value.includes('1')
    },

    // 发送验证码
    async handleSendCode() {
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

    // 注册
    async handleRegister() {
      if (!this.canRegister) return

      try {
        showLoading('注册中...')
        const res = await register(
          this.phone,
          this.password,
          this.code,
          this.role,
          this.nickname
        )
        hideLoading()

        if (res.success) {
          showSuccess('注册成功')
          // 保存用户信息
          this.$store.commit('SET_USER_INFO', res.data)
          this.$store.commit('SET_TOKEN', res.data.token)
          this.$store.commit('SET_ROLE', res.data.role)

          // 跳转到首页
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/home/index'
            })
          }, 1500)
        } else {
          showError(res.error || '注册失败')
        }
      } catch (e) {
        hideLoading()
        showError('网络错误')
      }
    },

    // 显示协议
    showAgreement(type) {
      uni.navigateTo({
        url: `/pages/login/agreement?type=${type}`
      })
    },

    // 返回登录
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding: 40rpx 60rpx;
}

.header {
  padding: 40rpx 0;
}

.page-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333333;
}

.page-subtitle {
  display: block;
  font-size: 28rpx;
  color: #999999;
  margin-top: 10rpx;
}

.form-area {
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 20rpx;
}

.role-select {
  display: flex;
  gap: 20rpx;
}

.role-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx;
  border: 4rpx solid #EEEEEE;
  border-radius: 16rpx;
  transition: all 0.3s;
}

.role-option.active {
  border-color: #007AFF;
  background-color: rgba(0, 122, 255, 0.05);
}

.role-icon {
  font-size: 60rpx;
  margin-bottom: 10rpx;
}

.role-text {
  font-size: 28rpx;
  color: #333333;
}

.input-wrap {
  display: flex;
  align-items: center;
  height: 96rpx;
  background-color: #F5F5F5;
  border-radius: 48rpx;
  padding: 0 30rpx;
}

.input-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.input-wrap input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
}

.code-btn {
  font-size: 26rpx;
  color: #007AFF;
  white-space: nowrap;
}

.code-btn.disabled {
  color: #CCCCCC;
}

.password-toggle {
  font-size: 32rpx;
  padding: 10rpx;
}

.agreement {
  margin: 30rpx 0;
}

.agreement-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 24rpx;
}

.back-login {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10rpx;
  margin-top: 40rpx;
}
</style>

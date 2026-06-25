<template>
  <div class="login-page page">
    <div class="logo-area">
      <div class="logo-wrapper">
        <span class="logo-icon">👨‍👩‍👧</span>
      </div>
      <div class="app-name">亲子守护</div>
      <div class="app-slogan">守护孩子健康成长</div>
    </div>

    <div class="form-area">
      <div class="form-item">
        <div class="input-wrap">
          <span class="input-icon">📱</span>
          <input
            type="tel"
            v-model="phone"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </div>
      </div>

      <div class="form-item" v-if="loginType === 'password'">
        <div class="input-wrap">
          <span class="input-icon">🔒</span>
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="请输入密码"
          />
          <span class="password-toggle" @click="showPassword = !showPassword">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </span>
        </div>
      </div>

      <div class="form-item" v-else>
        <div class="input-wrap">
          <span class="input-icon">🔢</span>
          <input
            type="tel"
            v-model="code"
            placeholder="请输入验证码"
            maxlength="6"
          />
          <span
            class="code-btn"
            :class="{ disabled: countdown > 0 }"
            @click="sendCode"
          >
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </span>
        </div>
      </div>

      <div class="login-type-toggle" @click="toggleLoginType">
        {{ loginType === 'password' ? '验证码登录' : '密码登录' }}
      </div>

      <button class="btn btn-primary btn-block mt-20" @click="handleLogin">
        登 录
      </button>

      <div class="register-link">
        <span class="text-gray">还没有账号？</span>
        <span class="text-primary" @click="goRegister">立即注册</span>
      </div>
    </div>

    <div class="role-select mt-30">
      <div class="role-title">演示角色（直接选择进入）</div>
      <div class="role-buttons">
        <button class="role-btn parent" @click="demoLogin('parent')">
          👨 家长端
        </button>
        <button class="role-btn child" @click="demoLogin('child')">
          👦 孩子端
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../store'

const router = useRouter()
const store = useAppStore()

const phone = ref('')
const password = ref('')
const code = ref('')
const loginType = ref('password')
const showPassword = ref(false)
const countdown = ref(0)

const toggleLoginType = () => {
  loginType.value = loginType.value === 'password' ? 'code' : 'password'
}

const sendCode = () => {
  if (countdown.value > 0) return
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

const handleLogin = () => {
  demoLogin('parent')
}

const demoLogin = (role) => {
  store.login(role)
  router.push('/home')
}

const goRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-page {
  min-height: 100%;
  background: linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%);
  padding: 0 30px;
}

.logo-area {
  padding-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-wrapper {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.logo-icon {
  font-size: 40px;
}

.app-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-top: 15px;
}

.app-slogan {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

.form-area {
  margin-top: 40px;
}

.form-item {
  margin-bottom: 15px;
}

.input-wrap {
  display: flex;
  align-items: center;
  height: 50px;
  background-color: #FFFFFF;
  border-radius: 25px;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.input-icon {
  font-size: 20px;
  margin-right: 10px;
}

.input-wrap input {
  flex: 1;
  height: 100%;
  font-size: 15px;
}

.password-toggle {
  font-size: 18px;
  padding: 5px;
  cursor: pointer;
}

.code-btn {
  font-size: 13px;
  color: #007AFF;
  white-space: nowrap;
  cursor: pointer;
}

.code-btn.disabled {
  color: #CCCCCC;
}

.login-type-toggle {
  text-align: right;
  padding: 10px 0;
  color: #007AFF;
  font-size: 13px;
  cursor: pointer;
}

.register-link {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 5px;
  font-size: 14px;
}

.role-select {
  text-align: center;
}

.role-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 15px;
}

.role-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.role-btn {
  flex: 1;
  height: 50px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.role-btn.parent {
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  color: #fff;
}

.role-btn.child {
  background: linear-gradient(135deg, #FF9500 0%, #FF3B30 100%);
  color: #fff;
}

.role-btn:active {
  transform: scale(0.95);
}
</style>

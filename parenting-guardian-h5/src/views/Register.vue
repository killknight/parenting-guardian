<template>
  <div class="register-page page">
    <div class="header">
      <span class="back" @click="goBack">←</span>
      <span class="title">注册</span>
      <span class="placeholder"></span>
    </div>

    <div class="form-area">
      <div class="form-item">
        <div class="input-wrap">
          <span class="input-icon">📱</span>
          <input type="tel" v-model="phone" placeholder="请输入手机号" maxlength="11" />
        </div>
      </div>

      <div class="form-item">
        <div class="input-wrap">
          <span class="input-icon">🔢</span>
          <input type="tel" v-model="code" placeholder="请输入验证码" maxlength="6" />
          <span class="code-btn" :class="{ disabled: countdown > 0 }" @click="sendCode">
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </span>
        </div>
      </div>

      <div class="form-item">
        <div class="input-wrap">
          <span class="input-icon">🔒</span>
          <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="设置密码（6位以上）" />
          <span class="password-toggle" @click="showPassword = !showPassword">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </span>
        </div>
      </div>

      <button class="btn btn-primary btn-block mt-20" @click="handleRegister">立即注册</button>
    </div>

    <div class="demo-note mt-30">
      <div class="note-title">演示说明</div>
      <div class="note-content">
        注册页面用于新用户创建账号。演示版本可选择角色直接进入体验。
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
const code = ref('')
const password = ref('')
const showPassword = ref(false)
const countdown = ref(0)

const sendCode = () => {
  if (countdown.value > 0) return
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

const handleRegister = () => {
  store.login('parent')
  router.push('/home')
}

const goBack = () => router.back()
</script>

<style scoped>
.register-page {
  min-height: 100%;
  background: #F5F5F5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #fff;
}

.back {
  font-size: 24px;
  cursor: pointer;
}

.title {
  font-size: 17px;
  font-weight: 600;
}

.placeholder {
  width: 24px;
}

.form-area {
  padding: 30px 20px;
}

.form-item {
  margin-bottom: 15px;
}

.input-wrap {
  display: flex;
  align-items: center;
  height: 50px;
  background: #fff;
  border-radius: 25px;
  padding: 0 20px;
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
  cursor: pointer;
}

.code-btn {
  font-size: 13px;
  color: #007AFF;
  cursor: pointer;
}

.code-btn.disabled {
  color: #ccc;
}

.demo-note {
  padding: 20px;
  background: #fff;
  margin: 0 20px;
  border-radius: 12px;
}

.note-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.note-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}
</style>

<template>
  <div class="login-modal-overlay" @click.self="handleClose">
    <div class="login-modal">
      <button class="close-btn" @click="handleClose" aria-label="关闭">
        <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
          <path d="M3 3 L15 15 M15 3 L3 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>

      <!-- 登录表单 -->
      <div v-if="!isRegister && !isForgotPassword" class="login-panel">
        <div class="login-brand">
          <img src="/favicon256.png" class="brand-icon" />
        </div>
        <h2 class="login-title">登录</h2>
        <p class="login-subtitle">完成登录后，你的场景将自动保存。</p>

        <div class="login-form">
          <div class="form-item">
            <label for="email">邮箱</label>
            <input type="email" id="email" v-model="email" placeholder="your@email.com" />
          </div>
          <div class="form-item">
            <label for="password">密码</label>
            <input type="password" id="password" v-model="password" placeholder="请输入密码" />
            <button class="forgot-link" @click="toggleForgotPassword">忘记密码？</button>
          </div>
          <div class="error-message" v-if="errorMsg">{{ errorMsg }}</div>
          <button class="btn-primary" @click="handleLogin">登录并保存</button>
        </div>

        <div class="login-switch">
          <span>还没有账户？</span>
          <button class="switch-btn" @click="goRegister">注册</button>
        </div>
      </div>

      <!-- 注册表单 -->
      <div v-else-if="isRegister" class="login-panel">
        <div class="login-brand">
          <img src="/favicon256.png" class="brand-icon" />
        </div>
        <h2 class="login-title">注册账号</h2>
        <p class="login-subtitle">注册后，你的场景将自动保存。</p>

        <div class="login-form">
          <div class="form-item">
            <label for="reg-email">邮箱</label>
            <input type="email" id="reg-email" v-model="email" placeholder="your@email.com" />
          </div>
          <div class="form-item">
            <label for="reg-password">密码</label>
            <input type="password" id="reg-password" v-model="password" placeholder="请输入密码（至少6位）" />
          </div>
          <div class="form-item">
            <label for="reg-confirmPassword">确认密码</label>
            <input type="password" id="reg-confirmPassword" v-model="confirmPassword" placeholder="请再次输入密码" />
          </div>
          <div class="form-item">
            <label for="reg-captcha">验证码</label>
            <div class="captcha-container">
              <input type="text" id="reg-captcha" v-model="captcha" placeholder="请输入6位验证码" />
              <button class="captcha-btn" :disabled="!canSendCaptcha || countdown > 0" @click="sendRegisterCaptcha">
                {{ countdown > 0 ? `${countdown}秒后重发` : '发送验证码' }}
              </button>
            </div>
          </div>
          <div class="error-message" v-if="errorMsg">{{ errorMsg }}</div>
          <button class="btn-primary" @click="handleRegister">注册</button>
        </div>

        <div class="login-switch">
          <span>已有账号？</span>
          <button class="switch-btn" @click="backToLogin">立即登录</button>
        </div>
      </div>

      <!-- 忘记密码表单 -->
      <div v-else-if="isForgotPassword" class="login-panel">
        <div class="login-brand">
          <img src="/favicon256.png" class="brand-icon" />
        </div>
        <h2 class="login-title">重置密码</h2>
        <p class="login-subtitle">通过邮箱验证码重置你的登录密码。</p>

        <div class="login-form">
          <div class="form-item">
            <label for="reset-email">邮箱</label>
            <input type="email" id="reset-email" v-model="email" placeholder="your@email.com" />
          </div>
          <div class="form-item">
            <label for="reset-password">新密码</label>
            <input type="password" id="reset-password" v-model="password" placeholder="请输入新密码（至少6位）" />
          </div>
          <div class="form-item">
            <label for="reset-confirmPassword">确认密码</label>
            <input type="password" id="reset-confirmPassword" v-model="confirmPassword" placeholder="请再次输入密码" />
          </div>
          <div class="form-item">
            <label for="reset-captcha">验证码</label>
            <div class="captcha-container">
              <input type="text" id="reset-captcha" v-model="captcha" placeholder="请输入8位验证码" />
              <button class="captcha-btn" :disabled="!canSendCaptcha || countdown > 0"
                @click="sendResetPasswordCaptcha">
                {{ countdown > 0 ? `${countdown}秒后重发` : '发送验证码' }}
              </button>
            </div>
          </div>
          <div class="error-message" v-if="errorMsg">{{ errorMsg }}</div>
          <button class="btn-primary" @click="handleResetPassword">重置密码</button>
        </div>

        <div class="login-switch">
          <span>想起密码了？</span>
          <button class="switch-btn" @click="backToLogin">立即登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from 'axios';
import { ref, computed } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'login', email: string, password: string): void
}>()

const isRegister = ref(false)
const isForgotPassword = ref(false)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const captcha = ref('')
const errorMsg = ref('')
const countdown = ref(0)

const validateEmail = (emailStr: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(emailStr)
}

const validateConfirmPassword = (): boolean => {
  if (!confirmPassword.value) {
    errorMsg.value = '请确认密码'
    return false
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致'
    return false
  }
  return true
}

const validateCaptcha = (length: number): boolean => {
  if (!captcha.value) {
    errorMsg.value = '请输入验证码'
    return false
  }
  if (captcha.value.length !== length) {
    errorMsg.value = `验证码必须是${length}位数字`
    return false
  }
  return true
}

const canSendCaptcha = computed(() => {
  return validateEmail(email.value) && email.value.trim() !== ''
})

const handleClose = () => {
  resetForm()
  emit('close')
}

const goRegister = () => {
  resetForm()
  isRegister.value = true
  isForgotPassword.value = false
}

const backToLogin = () => {
  resetForm()
  isRegister.value = false
  isForgotPassword.value = false
}

const toggleForgotPassword = () => {
  resetForm()
  isRegister.value = false
  isForgotPassword.value = true
}

const resetForm = () => {
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  captcha.value = ''
  errorMsg.value = ''
  countdown.value = 0
}

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const sendRegisterCaptcha = async () => {
  if (!canSendCaptcha.value) {
    errorMsg.value = '请输入有效的邮箱地址'
    return
  }

  const result = await axios.post('https://api.studying1v1.com/video/register/sentEmailCode', {
    email: email.value,
  })
  if (result.status === 200) {
    if (result.data.success) {
      alert(result.data.message)
    } else {
      errorMsg.value = result.data.msg
      alert(result.data.message)
      return
    }
  }
  console.log('发送注册验证码结果:', result)

  startCountdown()
}

const sendResetPasswordCaptcha = async () => {
  if (!canSendCaptcha.value) {
    errorMsg.value = '请输入有效的邮箱地址'
    return
  }

  const result = await axios.post('https://api.studying1v1.com/video/resetPassword/sendEmailCode', {
    email: email.value,
  })
  if (result.status === 200) {
    if (result.data.success) {
      alert(result.data.message)
    } else {
      errorMsg.value = result.data.msg
      alert(result.data.message)
      return
    }
  }
  console.log('发送重置密码验证码结果:', result)

  startCountdown()
}

const handleRegister = async () => {
  if (!email.value.trim()) {
    errorMsg.value = '请输入邮箱'
    return
  }
  if (!validateEmail(email.value)) {
    errorMsg.value = '请输入有效的邮箱地址'
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return
  }
  if (password.value.length < 6) {
    errorMsg.value = '密码长度至少为6位'
    return
  }
  if (!validateConfirmPassword()) return
  if (!validateCaptcha(6)) return
  errorMsg.value = ''

  const { default: md5 } = await import('md5')
  const result = await axios.post('https://api.studying1v1.com/video/register/register', {
    email: email.value,
    password: md5(password.value),
    captcha: captcha.value,
  })

  console.log('注册结果:', result)
  if (result.status === 200) {
    if (result.data.success) {
      alert(result.data.message)
      backToLogin()
    } else {
      errorMsg.value = result.data.msg
      alert(result.data.message)
    }
  }
}

const handleResetPassword = async () => {
  if (!email.value.trim()) {
    errorMsg.value = '请输入邮箱'
    return
  }
  if (!validateEmail(email.value)) {
    errorMsg.value = '请输入有效的邮箱地址'
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return
  }
  if (password.value.length < 6) {
    errorMsg.value = '密码长度至少为6位'
    return
  }
  if (!validateConfirmPassword()) return
  if (!validateCaptcha(8)) return
  errorMsg.value = ''

  const { default: md5 } = await import('md5')

  const result = await axios.post('https://api.studying1v1.com/video/resetPassword/submit', {
    email: email.value,
    newPassword: md5(password.value),
    captcha: captcha.value,
  })

  console.log('修改密码结果:', result)
  if (result.status === 200) {
    if (result.data.success) {
      alert(result.data.message)
      backToLogin()
    } else {
      errorMsg.value = result.data.msg
      alert(result.data.message)
    }
  }
}

const handleLogin = async () => {
  if (!email.value.trim()) {
    errorMsg.value = '请输入邮箱'
    return
  }
  if (!validateEmail(email.value)) {
    errorMsg.value = '请输入有效的邮箱地址'
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return
  }
  if (password.value.length < 6) {
    errorMsg.value = '密码长度至少为6位'
    return
  }
  errorMsg.value = ''

  const { default: md5 } = await import('md5')

  const result = await axios.post('https://api.studying1v1.com/video/login', {
    email: email.value,
    password: md5(password.value),
  })
  if (result.status === 200) {
    if (result.data.result) {
      localStorage.setItem('token', result.data.token)
      emit('login', email.value, password.value)
      window.gtag('event', 'loginFinish', { result: true })
    } else {
      errorMsg.value = result.data.msg
      alert(result.data.message)
    }
  }
  console.log('登录结果:', result)
}
</script>

<style scoped>
.login-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 24px;
}

.login-modal {
  position: relative;
  background: #fff;
  border-radius: 8px;
  width: 388px;
  max-width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
}

.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 26px;
  height: 26px;
  border: 1.5px solid #e6e6ea;
  border-radius: 4px;
  background: rgb(247, 247, 245);
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: border-color 0.2s, color 0.2s;
}

.close-btn:hover {
  border-color: #cfcfd6;
  color: #1d1d1f;
}

.login-panel {
  text-align: center;
}

.login-brand {
  display: flex;
  justify-content: center;
}

.brand-icon {
  width: 54px;
  display: block;
}

.login-title {
  margin: 20px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: 1px;
}

.login-subtitle {
  margin: 5px 0 0;
  font-size: 12px;
  color: rgb(104, 107, 112);
}

.login-form {
  margin-top: 24px;
  text-align: left;
}

.form-item {
  margin-bottom: 14px;
}

.form-item label {
  display: block;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #1d1d1f;
}

.form-item input {
  width: 100%;
  height: 38px;
  padding: 0px 12px;
  background: rgb(255, 255, 255);
  border: 1px solid rgb(232, 232, 229);
  border-radius: 4px;
  font-size: 13px;
  color: rgb(23, 24, 26);
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
}

.form-item input::placeholder {
  color: #b5b5bd;
}

.form-item input:focus {
  outline: none;
  border-color: #7b6cff;
}

.captcha-container {
  display: flex;
  gap: 12px;
}

.captcha-container input {
  flex: 1;
  min-width: 0;
}

.captcha-btn {
  height: 38px;
  padding: 0 18px;
  border: 1.5px solid #7b6cff;
  border-radius: 4px;
  background: #fff;
  color: #7b6cff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, opacity 0.2s;
}

.captcha-btn:hover:not(:disabled) {
  background: #f3f1ff;
}

.captcha-btn:disabled {
  border-color: #e6e6ea;
  color: #b5b5bd;
  cursor: not-allowed;
}

.forgot-link {
  display: block;
  margin: 10px 2px 0 0;
  padding: 0;
  background: none;
  border: none;
  text-align: right;
  font-size: 13px;
  color: #59595e;
  cursor: pointer;
}

.forgot-link:hover {
  color: #7b6cff;
}

.error-message {
  color: #f56c6c;
  font-size: 13px;
  margin: -6px 0 14px;
}

.btn-primary {
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 4px;
  background: #7b6cff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.btn-primary:hover {
  background: #6a59f0;
}

.btn-primary:active {
  transform: scale(0.99);
}

.login-switch {
  margin-top: 28px;
  text-align: center;
  font-size: 15px;
  color: #9a9aa2;
}

.switch-btn {
  background: none;
  border: none;
  color: #7b6cff;
  cursor: pointer;
  padding: 0;
  margin-left: 6px;
  font-size: 15px;
  font-weight: 600;
}

.switch-btn:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .login-modal {
    padding: 28px 24px 32px;
    border-radius: 16px;
  }

  .login-title {
    font-size: 24px;
  }

  .login-subtitle {
    font-size: 14px;
  }
}
</style>

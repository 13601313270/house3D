<template>
  <div class="login-modal-overlay" @click.self="handleClose">
    <div class="login-modal">
      <!-- 登录表单 -->
      <div v-if="!isRegister && !isForgotPassword">
        <div class="login-header">
          <h2>登录</h2>
          <button class="close-btn" @click="handleClose">&times;</button>
        </div>
        <div class="login-content">
          <div class="form-item">
            <label for="email">邮箱</label>
            <input type="email" id="email" v-model="email" placeholder="请输入邮箱" />
          </div>
          <div class="form-item">
            <label for="password">密码</label>
            <input type="password" id="password" v-model="password" placeholder="请输入密码" />
          </div>
          <div class="error-message" v-if="errorMsg">{{ errorMsg }}</div>
        </div>
        <div class="login-footer">
          <button class="btn-cancel" @click="handleClose">取消</button>
          <button class="btn-login" @click="handleLogin">登录</button>
        </div>
        <div class="login-switch">
          <span>还没有账号？</span>
          <button class="switch-btn" @click="toggleMode">立即注册</button>
        </div>
        <div class="forgot-password">
          <button class="forgot-btn" @click="toggleForgotPassword">忘记密码？</button>
        </div>
      </div>

      <!-- 注册表单 -->
      <div v-else-if="isRegister">
        <div class="login-header">
          <h2>注册</h2>
          <button class="close-btn" @click="handleClose">&times;</button>
        </div>
        <div class="login-content">
          <div class="form-item">
            <label for="email">邮箱</label>
            <input type="email" id="email" v-model="email" placeholder="请输入邮箱" />
          </div>
          <div class="form-item">
            <label for="password">密码</label>
            <input type="password" id="password" v-model="password" placeholder="请输入密码" />
          </div>
          <div class="form-item">
            <label for="confirmPassword">确认密码</label>
            <input type="password" id="confirmPassword" v-model="confirmPassword" placeholder="请再次输入密码" />
          </div>
          <div class="form-item">
            <label for="captcha">验证码</label>
            <div class="captcha-container">
              <input type="text" id="captcha" v-model="captcha" placeholder="请输入验证码" />
              <button class="captcha-btn" :disabled="!canSendCaptcha || countdown > 0" @click="sendRegisterCaptcha">
                {{ countdown > 0 ? `${countdown}秒` : '发送验证码' }}
              </button>
            </div>
          </div>
          <div class="error-message" v-if="errorMsg">{{ errorMsg }}</div>
        </div>
        <div class="login-footer">
          <button class="btn-cancel" @click="handleClose">取消</button>
          <button class="btn-login" @click="handleRegister">注册</button>
        </div>
        <div class="login-switch">
          <span>已有账号？</span>
          <button class="switch-btn" @click="toggleMode">立即登录</button>
        </div>
      </div>

      <!-- 忘记密码表单 -->
      <div v-else-if="isForgotPassword">
        <div class="login-header">
          <h2>忘记密码</h2>
          <button class="close-btn" @click="handleClose">&times;</button>
        </div>
        <div class="login-content">
          <div class="form-item">
            <label for="email">邮箱</label>
            <input type="email" id="email" v-model="email" placeholder="请输入邮箱" />
          </div>
          <div class="form-item">
            <label for="password">新密码</label>
            <input type="password" id="password" v-model="password" placeholder="请输入新密码" />
          </div>
          <div class="form-item">
            <label for="confirmPassword">确认密码</label>
            <input type="password" id="confirmPassword" v-model="confirmPassword" placeholder="请再次输入密码" />
          </div>
          <div class="form-item">
            <label for="captcha">验证码</label>
            <div class="captcha-container">
              <input type="text" id="captcha" v-model="captcha" placeholder="请输入验证码" />
              <button class="captcha-btn" :disabled="!canSendCaptcha || countdown > 0"
                @click="sendResetPasswordCaptcha">
                {{ countdown > 0 ? `${countdown}秒` : '发送验证码' }}
              </button>
            </div>
          </div>
          <div class="error-message" v-if="errorMsg">{{ errorMsg }}</div>
        </div>
        <div class="login-footer">
          <button class="btn-cancel" @click="handleClose">取消</button>
          <button class="btn-login" @click="handleResetPassword">修改密码</button>
        </div>
        <div class="login-switch">
          <span>想起密码了？</span>
          <button class="switch-btn" @click="toggleMode">立即登录</button>
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

const toggleMode = () => {
  resetForm()
  isRegister.value = !isRegister.value
  isForgotPassword.value = false
}

const toggleForgotPassword = () => {
  resetForm()
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

  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
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

  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const handleRegister = async () => {
  console.log('email.value', 0)
  if (!email.value.trim()) {
    console.log('email.value', 1)
    errorMsg.value = '请输入邮箱'
    return
  }
  if (!validateEmail(email.value)) {
    console.log('email.value', 2)
    errorMsg.value = '请输入有效的邮箱地址'
    return
  }
  if (!password.value) {
    console.log('email.value', 3)
    errorMsg.value = '请输入密码'
    return
  }
  if (password.value.length < 6) {
    console.log('email.value', 4)
    errorMsg.value = '密码长度至少为6位'
    return
  }
  if (!validateConfirmPassword()) return
  if (!validateCaptcha(6)) return
  console.log('email.value', 5)
  errorMsg.value = ''

  console.log('email.value', 5.1)
  const { default: md5 } = await import('md5')
  console.log('email.value', 6)
  const result = await axios.post('https://api.studying1v1.com/video/register/register', {
    email: email.value,
    password: md5(password.value),
    captcha: captcha.value,
  })

  console.log('注册结果:', result)
  if (result.status === 200) {
    if (result.data.success) {
      alert(result.data.message)
      isRegister.value = false
      resetForm()
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
      isForgotPassword.value = false
      resetForm()
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.login-modal {
  background: #fff;
  border-radius: 8px;
  width: 360px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.login-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.login-content {
  padding: 20px;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #666;
}

.form-item input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-item input:focus {
  outline: none;
  border-color: #409eff;
}

.captcha-container {
  display: flex;
  gap: 12px;
}

.captcha-container input {
  flex: 1;
}

.captcha-btn {
  padding: 0 16px;
  height: 36px;
  border: 1px solid #409eff;
  border-radius: 4px;
  background: #fff;
  color: #409eff;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.captcha-btn:hover:not(:disabled) {
  background: #f0f5ff;
}

.captcha-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 8px;
}

.login-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.login-footer button {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.btn-cancel {
  background: #fff;
  border: 1px solid #dcdfe6;
  color: #606266;
}

.btn-cancel:hover {
  border-color: #c0c4cc;
}

.btn-login {
  background: #409eff;
  color: #fff;
}

.btn-login:hover {
  background: #66b1ff;
}

.login-switch {
  padding: 12px 20px;
  text-align: center;
  font-size: 14px;
  color: #666;
  border-top: 1px solid #eee;
}

.switch-btn {
  background: none;
  border: none;
  color: #409eff;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
}

.switch-btn:hover {
  text-decoration: underline;
}

.forgot-password {
  padding: 8px 20px;
  text-align: center;
}

.forgot-btn {
  background: none;
  border: none;
  color: #409eff;
  cursor: pointer;
  padding: 0;
  font-size: 13px;
}

.forgot-btn:hover {
  text-decoration: underline;
}
</style>

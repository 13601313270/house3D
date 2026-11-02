// Landing page entry: 挂载 Login + ShowVipModal 壳组件
import { createApp, h, ref, onMounted, onBeforeUnmount } from 'vue'
import Login from './components/Login.vue'
import ShowVipModal from './components/showVipModal.vue'
import store from './store'

console.log('[welcome.ts] start')

createApp({
  setup() {
    const showLogin = ref(false)
    const showVip = ref(false)

    const hasToken = () => !!localStorage.getItem('token')

    const openLogin = () => {
      console.log('[welcome.ts] openLogin')
      showLogin.value = true
    }
    const closeLogin = () => {
      console.log('[welcome.ts] closeLogin')
      showLogin.value = false
    }
    const openVip = () => {
      console.log('[welcome.ts] openVip')
      showVip.value = true
    }
    const closeVip = () => {
      console.log('[welcome.ts] closeVip')
      showVip.value = false
    }

    // 登录成功：补载 userInfo → 弹 VipModal
    const onLoginSuccess = async () => {
      console.log('[welcome.ts] login success → fetch userInfo')
      try {
        const { default: request } = await import('./utils/request')
        const res = await request.get('/video/user/info')
        if (res.status === 200 && res.data) {
          store.dispatch('main/setUserInfo', res.data)
        }
      } catch (e) {
        console.warn('[welcome.ts] fetch userInfo failed', e)
      }
      showLogin.value = false
      openVip()
    }

    onMounted(() => {
      console.log('[welcome.ts] ✅ mounted')

      // 1. 兼容老事件
      window.addEventListener('show-home-login', openLogin)

      // 2. CTA: 登录态 → VipModal；未登录 → Login
      const ctas = document.querySelectorAll('.double11-cta')
      console.log('[welcome.ts] found .double11-cta:', ctas.length)
      ctas.forEach(el => {
        el.addEventListener('click', () => {
          console.log('[welcome.ts] CTA click, hasToken:', hasToken())
          if (hasToken()) {
            // 预加载 userInfo 到 store（供 ShowVipModal 内部 handlePay 使用）
            import('./utils/request').then(async ({ default: request }) => {
              try {
                const res = await request.get('/video/user/info')
                if (res.status === 200 && res.data) {
                  store.dispatch('main/setUserInfo', res.data)
                }
              } catch {}
            })
            openVip()
          } else {
            openLogin()
          }
        })
      })
    })

    onBeforeUnmount(() => {
      window.removeEventListener('show-home-login', openLogin)
    })

    return () => {
      return h('div', [
        showLogin.value ? h(Login, { onClose: closeLogin, onLogin: onLoginSuccess }) : null,
        showVip.value ? h(ShowVipModal, { onClose: closeVip }) : null,
      ].filter(Boolean))
    }
  },
}).use(store).mount('#homeLoginMount')

console.log('[welcome.ts] ✅ app created')

<template>
  <div class="buySuccess">
    <div v-if="status === 'loading'" class="loadingState">
      <div class="spinner"></div>
      <div class="loadingText">正在验证支付状态...</div>
    </div>
    <div v-else-if="status === 'success'" class="successState">
      <div class="successIcon"></div>
      <div class="successTitle">购买成功</div>
      <div class="successDesc">您的订单已成功支付，感谢您的支持！</div>
      <div class="orderInfo">
        <span class="label">订单号：</span>
        <span class="value">{{ outTradeNo }}</span>
      </div>
      <button class="backButton" @click="closePage">关闭页面</button>
    </div>
    <div v-else-if="status === 'failure'" class="failureState">
      <div class="failureIcon"></div>
      <div class="failureTitle">支付验证失败</div>
      <div class="failureDesc">{{ errorMsg }}</div>
      <button class="retryButton" @click="checkPayment">重新验证</button>
      <button class="backButton" @click="closePage">关闭页面</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import service from '@/utils/request'

type Status = 'loading' | 'success' | 'failure'

const route = useRoute()
const router = useRouter()

const status = ref<Status>('loading')
const errorMsg = ref('')

const outTradeNo = ref('')

const extractParams = () => {
  const query = route.query
  if (query.out_trade_no) {
    outTradeNo.value = String(query.out_trade_no)
  } else {
    const urlParams = new URLSearchParams(window.location.search)
    const param = urlParams.get('out_trade_no')
    if (param) {
      outTradeNo.value = param
    }
  }
}

const checkPayment = async () => {
  status.value = 'loading'
  errorMsg.value = ''

  if (!outTradeNo.value) {
    status.value = 'failure'
    errorMsg.value = '缺少订单号参数'
    return
  }

  try {
    const { data } = await service.get('/video/alipay/checkIsPay', {
      params: {
        out_trade_no: outTradeNo.value
      }
    })
    console.log('data---0', data)
    if (data && data.status && data.isPay) {
      status.value = 'success'
    } else {
      status.value = 'failure'
      errorMsg.value = data?.msg || '支付状态验证失败'
    }
  } catch (error: any) {
    status.value = 'failure'
    errorMsg.value = error?.response?.data?.message || '网络请求失败，请稍后重试'
  }
}

const closePage = () => {
  window.close()
}

onMounted(() => {
  extractParams()
  checkPayment()
})
</script>
<style scoped lang="less">
.buySuccess {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 40px;

  .loadingState {
    display: flex;
    flex-direction: column;
    align-items: center;

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e0e0e0;
      border-top-color: #1677ff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loadingText {
      margin-top: 20px;
      font-size: 16px;
      color: #666;
    }
  }

  .successState {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: white;
    padding: 48px 32px;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);

    .successIcon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
      position: relative;
      margin-bottom: 24px;

      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: white;
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
      }
    }

    .successTitle {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }

    .successDesc {
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }

    .orderInfo {
      font-size: 14px;
      color: #999;
      margin-bottom: 24px;

      .label {
        margin-right: 8px;
      }

      .value {
        font-weight: bold;
        color: #333;
      }
    }

    .backButton {
      padding: 12px 48px;
      background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
      color: white;
      font-size: 16px;
      font-weight: bold;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
    }
  }

  .failureState {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: white;
    padding: 48px 32px;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);

    .failureIcon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
      position: relative;
      margin-bottom: 24px;

      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: white;
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E");
      }
    }

    .failureTitle {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }

    .failureDesc {
      font-size: 14px;
      color: #ff4d4f;
      margin-bottom: 24px;
    }

    .retryButton {
      padding: 12px 32px;
      background: white;
      color: #1677ff;
      font-size: 16px;
      font-weight: bold;
      border: 2px solid #1677ff;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 12px;

      &:hover {
        background: #e6f4ff;
      }
    }

    .backButton {
      padding: 12px 32px;
      background: #f5f5f5;
      color: #666;
      font-size: 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #e8e8e8;
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
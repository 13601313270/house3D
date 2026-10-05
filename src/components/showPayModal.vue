<template>
  <teleport to="#teleport">
    <div class="showPayModal" @click.self="closeModal">
      <div class="showPayModalInner">
        <div class="header">
          <div class="headerTexts">
            <div class="title">{{ t('pay.title') }}</div>
            <div class="subtitle">{{ t('pay.subtitle') }}</div>
          </div>
          <button class="closeBtn" @click="closeModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div v-if="checkStatus === 'checking'" class="checkingState">
          <div class="spinner"></div>
          <div class="checkingText">{{ t('pay.checking') }}</div>
        </div>
        <div v-else-if="checkStatus === 'unpaid'" class="unpaidState">
          <div class="unpaidIcon"></div>
          <div class="unpaidText">{{ t('pay.unpaid') }}</div>
          <button class="retryButton" @click="checkPaymentStatus">{{ t('pay.retry') }}</button>
          <button class="cancelButton" @click="closeModal">{{ t('pay.cancel') }}</button>
        </div>
        <div v-else>
          <div class="currentRow">
            <span class="currentLabel">{{ t('pay.currentCredits') }}</span>
            <span class="currentValue">{{ currentCredits }}</span>
          </div>

          <div class="amountList">
            <div v-for="opt in options" :key="opt.amount" class="amountItem"
              :class="{ active: selectedAmount === opt.amount }" @click="selectedAmount = opt.amount">
              <div class="radio" :class="{ checked: selectedAmount === opt.amount }">
                <div v-if="selectedAmount === opt.amount" class="radioDot"></div>
              </div>
              <div class="itemLeft">
                <span class="itemCredits">{{ opt.credits.toLocaleString() }}{{ t('pay.credits') }}</span>
                <span v-if="opt.recommend" class="recommendTag">{{ t('pay.recommend') }}</span>
              </div>
              <div class="itemPrice">¥{{ opt.amount }}</div>
            </div>
          </div>

          <div class="previewRow">
            <div class="previewLine">
              <span class="previewLabel">{{ t('pay.afterPurchase') }}</span>
              <span class="previewValue plus">+{{ purchaseCredits.toLocaleString() }} {{ t('pay.credits') }}</span>
            </div>
            <div class="previewLine">
              <span class="previewLabel">{{ t('pay.balance') }}</span>
              <span class="previewValue">{{ finalCredits.toLocaleString() }} {{ t('pay.credits') }}</span>
            </div>
          </div>

          <button class="buyButton" @click="handlePay('alipay')">
            {{ t('pay.buyNow') }} · ¥{{ selectedAmount }}
          </button>
          <div class="footer">{{ t('pay.footer') }}</div>
        </div>
      </div>
    </div>
  </teleport>
</template>
<script setup lang="ts">
import { Store } from '@/store';
import message from '@/utils/message';
import request from '@/utils/request';
import { computed, onUnmounted, ref } from 'vue'
import { useStore } from 'vuex';
import { t } from '@/i18n';

const store = useStore<Store>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'paySuccess'): void
}>()

interface Option {
  amount: number
  credits: number
  recommend?: boolean
}

const options: Option[] = [
  { amount: 10, credits: 100 },
  { amount: 50, credits: 500 },
  { amount: 100, credits: 1000, recommend: true },
]

const selectedAmount = ref(100)
const orderId = ref<number | null>(null)
const checkStatus = ref<'idle' | 'checking' | 'unpaid'>('idle')

const currentCredits = computed(() => {
  const ui = store.state.main.userInfo as any
  return ui?.money ?? 0
})

const purchaseCredits = computed(() => selectedAmount.value * 10)
const finalCredits = computed(() => currentCredits.value + purchaseCredits.value)

const closeModal = () => {
  emit('close')
}

const handleFocus = async () => {
  if (orderId.value) {
    checkPaymentStatus()
  }
}

const checkPaymentStatus = async () => {
  if (!orderId.value) return
  checkStatus.value = 'checking'

  try {
    const { data } = await request.get('/video/alipay/checkIsPay', {
      params: {
        out_trade_no: orderId.value
      }
    })

    if (data && data.status && data.isPay) {
      message.success(t('pay.success'))
      emit('paySuccess')
    } else {
      checkStatus.value = 'unpaid'
    }
  } catch (error: any) {
    console.error('checkPaymentStatus error', error)
    checkStatus.value = 'unpaid'
  }
}

const handlePay = async (payType: 'alipay' | 'wechat') => {
  const userInfo = store.state.main.userInfo
  if (userInfo && (userInfo as any).id) {
    if (payType === 'alipay') {
      const res = await request.get('https://api.studying1v1.com/video/alipay/createOrder?uid=' + (userInfo as any).id + '&price=' + selectedAmount.value)
      orderId.value = res.data as number;
      window.open('https://api.studying1v1.com/video/alipay/pay?orderId=' + orderId.value, '_blank')
      checkStatus.value = 'checking'
    }
  }
}

onUnmounted(() => {
  window.removeEventListener('focus', handleFocus)
})

window.addEventListener('focus', handleFocus)
</script>
<style scoped lang="less">
.showPayModal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;

  .showPayModalInner {
    width: 420px;
    background: white;
    border-radius: 16px;
    padding: 28px;
    position: relative;

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;

      .headerTexts {
        .title {
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .subtitle {
          font-size: 13px;
          color: #888;
        }
      }

      .closeBtn {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        position: absolute;
        top: 14px;
        right: 14px;
        width: 26px;
        height: 26px;
        background: rgb(247, 247, 245);
        border: 1px solid rgb(232, 232, 229);
        border-radius: 3px;
        color: rgb(104, 107, 112);
        cursor: pointer;
        font-family: inherit;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: #e8e8e8;
          color: #666;
        }
      }
    }

    .currentRow {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: #f7f7f8;
      border-radius: 4px;
      margin-bottom: 14px;

      .currentLabel {
        font-size: 14px;
        color: #666;
      }

      .currentValue {
        font-size: 18px;
        font-weight: 600;
        color: #1a1a1a;
      }
    }

    .amountList {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;

      .amountItem {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 11px 14px;
        background: rgb(255, 255, 255);
        border: 1px solid rgb(232, 232, 229);
        border-radius: 4px;
        cursor: pointer;
        font-family: inherit;
        transition: 0.1s;
        position: relative;

        &:hover {
          border-color: #ddd;
        }

        &.active {
          border-color: #7c5cfc;
          background: #f4f1ff;
        }

        .radio {
          width: 16px;
          height: 16px;
          margin-right: 12px;
          border-radius: 50%;
          border: 2px solid rgb(216, 216, 213);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          &.checked {
            border-color: #7c5cfc;

            .radioDot {
              width: 10px;
              height: 10px;
              background: #7c5cfc;
              border-radius: 50%;
            }
          }
        }

        .itemLeft {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;

          .itemCredits {
            font-size: 15px;
            font-weight: 500;
            color: #333;
          }

          .recommendTag {
            font-size: 11px;
            color: #fff;
            background: #7c5cfc;
            padding: 2px 6px;
            border-radius: 4px;
            line-height: 1.4;
          }
        }

        .itemPrice {
          font-size: 15px;
          color: #666;
        }

        &.active .itemPrice {
          color: #7c5cfc;
          font-weight: 600;
        }
      }
    }

    .previewRow {
      padding: 10px 12px;
      background: rgb(247, 247, 245);
      border: 1px solid rgb(232, 232, 229);
      border-radius: 4px;
      margin-bottom: 16px;

      .previewLine {
        display: flex;
        justify-content: space-between;
        align-items: center;

        &+.previewLine {
          margin-top: 6px;
        }

        .previewLabel {
          font-size: 13px;
          color: #888;
        }

        .previewValue {
          font-size: 14px;
          font-weight: 600;
          color: #333;

          &.plus {
            // color: #7c5cfc;
          }
        }
      }
    }

    .buyButton {
      width: 100%;
      height: 40px;
      background: rgb(99, 91, 255);
      color: rgb(255, 255, 255);
      border-width: medium;
      border-style: none;
      border-color: currentcolor;
      border-image: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      opacity: 1;
      transition: opacity 0.15s;

      &:hover {
        background: #6a4ce0;
      }

      &:active {
        transform: scale(0.99);
      }
    }

    .footer {
      font-size: 10px;
      color: rgb(154, 157, 162);
      text-align: center;
      margin-top: 8px;
    }

    .checkingState {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0;

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e0e0e0;
        border-top-color: #7c5cfc;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .checkingText {
        margin-top: 16px;
        font-size: 14px;
        color: #666;
      }
    }

    .unpaidState {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 0;

      .unpaidIcon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
        position: relative;
        margin-bottom: 16px;

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          background: white;
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E");
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E");
        }
      }

      .unpaidText {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        margin-bottom: 24px;
      }

      .retryButton {
        width: 100%;
        padding: 12px;
        background: #7c5cfc;
        color: white;
        font-size: 16px;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        margin-bottom: 12px;
        transition: all 0.2s;

        &:hover {
          background: #6a4ce0;
        }
      }

      .cancelButton {
        width: 100%;
        padding: 12px;
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
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

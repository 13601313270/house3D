<template>
  <teleport to="#teleport">
    <div class="showPayModal" @click.self="closeModal">
      <div class="showPayModalInner">
        <div class="title">-</div>
        <div v-if="checkStatus === 'checking'" class="checkingState">
          <div class="spinner"></div>
          <div class="checkingText">正在验证支付状态...</div>
        </div>
        <div v-else-if="checkStatus === 'unpaid'" class="unpaidState">
          <div class="unpaidIcon"></div>
          <div class="unpaidText">支付未完成</div>
          <button class="retryButton" @click="checkPaymentStatus">重新验证</button>
          <button class="cancelButton" @click="closeModal">取消</button>
        </div>
        <div v-else>
          <div class="amountSection">
            <div class="sectionTitle">选择金额</div>
            <div class="amountList">
              <div v-for="amount in amounts" :key="amount" class="amountItem"
                :class="{ active: selectedAmount === amount }" @click="selectedAmount = amount">
                <div class="amountText">¥ {{ amount }}</div>
                <div class="coinInfo">
                  <img src="/money.png" class="coinIcon" />
                  <span class="coinText">{{ amount * 10 }}积分</span>
                </div>
              </div>
            </div>
          </div>
          <div class="paySection">
            <div class="sectionTitle">支付方式</div>
            <div class="payList">
              <div class="payItem" :class="{ active: selectedPay === 'alipay' }" @click="handlePay('alipay')">
                <div class="payIcon">
                  <img src="https://gw.alipayobjects.com/mdn/rms_9e4c39/afts/img/A*Qys_QIJfGPgAAAAAAAAAAAAAARQnAQ"
                    alt="支付宝" />
                </div>
              </div>
            </div>
          </div>
          <img src="/fa29cde1.png" class="headImg" />
        </div>
      </div>
    </div>
  </teleport>
</template>
<script setup lang="ts">
import { Store } from '@/store';
import message from '@/utils/message';
import request from '@/utils/request';
import { onUnmounted, ref } from 'vue'
import { useStore } from 'vuex';

const store = useStore<Store>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'paySuccess'): void
}>()

const amounts = [10, 50, 100, 200]
const selectedAmount = ref(50)
const selectedPay = ref<'alipay' | 'wechat'>('wechat')
const orderId = ref<number | null>(null)
const checkStatus = ref<'idle' | 'checking' | 'unpaid'>('idle')

const closeModal = () => {
  emit('close')
}

const handleFocus = async () => {
  console.log('aaa', 1)
  console.log('aaa', 2)
  if (orderId.value) {
    console.log('aaa', 3)
    checkPaymentStatus()
  }
}

const checkPaymentStatus = async () => {
  console.log('aaa', 4)
  if (!orderId.value) return
  console.log('aaa', 5)
  checkStatus.value = 'checking'

  try {
    console.log('aaa', 3)
    const { data } = await request.get('/video/alipay/checkIsPay', {
      params: {
        out_trade_no: orderId.value
      }
    })
    console.log('checkPaymentStatus data', data)

    if (data && data.status && data.isPay) {
      message.success('支付成功！')
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
  if (userInfo && userInfo.id) {
    if (payType === 'alipay') {
      const res = await request.get('https://api.studying1v1.com/video/alipay/createOrder?uid=' + userInfo.id + '&price=' + selectedAmount.value)
      orderId.value = res.data as number;
      console.log('orderId', orderId.value)
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
    width: 360px;
    background: white;
    border-radius: 12px;
    padding: 24px;
    position: relative;
    margin-top: 80px;

    .title {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 24px;
    }

    .sectionTitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 12px;
    }

    .amountSection {
      margin-bottom: 24px;

      .amountList {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;

        .amountItem {
          width: calc(47%);
          height: 100px;
          padding: 10px 0;
          text-align: center;
          border: 2px solid #eee;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;

          .amountText {
            font-size: 24px;
            color: #333;
            font-weight: bold;
          }

          .coinInfo {
            display: flex;
            align-items: center;
            gap: 2px;

            .coinIcon {
              width: 12px;
              height: 12px;
            }

            .coinText {
              font-size: 16px;
              color: #999;
            }
          }

          &:hover {
            border-color: #1677ff;

            .amountText {
              color: #1677ff;
            }

            .coinText {
              color: #1677ff;
            }
          }

          &.active {
            border-color: #1677ff;
            background-color: #e6f4ff;

            .amountText {
              color: #1677ff;
            }

            .coinText {
              color: #1677ff;
            }
          }
        }
      }
    }

    .paySection {
      margin-bottom: 24px;

      .payList {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .payItem {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 2px solid #eee;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            border-color: #1677ff;
          }

          &.active {
            border-color: #1677ff;
            background-color: #e6f4ff;
          }

          .payIcon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            margin-right: 12px;

            >img {
              height: 40px;
              object-fit: cover;
            }

            // &.alipay {
            //   background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
            //   position: relative;

            //   &::before {
            //     content: '';
            //     position: absolute;
            //     top: 50%;
            //     left: 50%;
            //     transform: translate(-50%, -50%);
            //     width: 24px;
            //     height: 24px;
            //     background: white;
            //     mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E");
            //     -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E");
            //   }
            // }

            // &.wechat {
            //   background: linear-gradient(135deg, #07c160 0%, #10b981 100%);
            //   position: relative;

            //   &::before {
            //     content: '';
            //     position: absolute;
            //     top: 50%;
            //     left: 50%;
            //     transform: translate(-50%, -50%);
            //     width: 24px;
            //     height: 24px;
            //     background: white;
            //     mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E");
            //     -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E");
            //   }
            // }
          }

          // .payName {
          //   flex: 1;
          //   font-size: 16px;
          //   color: #333;
          // }

          .checkIcon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: #1677ff;
            position: relative;

            &::before {
              content: '';
              position: absolute;
              top: 6px;
              left: 6px;
              width: 6px;
              height: 10px;
              border: solid white;
              border-width: 0 2px 2px 0;
              transform: rotate(45deg);
            }
          }
        }
      }
    }

    .payButton {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
      color: white;
      font-size: 18px;
      font-weight: bold;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0);
      }
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
        border-top-color: #1677ff;
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
        background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
        color: white;
        font-size: 16px;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        margin-bottom: 12px;
        transition: all 0.2s;

        &:hover {
          opacity: 0.9;
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

    .headImg {
      width: 250px;
      position: absolute;
      top: -151px;
      left: 80px;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
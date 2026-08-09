<template>
  <teleport to="#teleport">
    <div class="showVipModal" @click.self="closeModal">
      <div class="showVipModalInner">
        <div class="title">解锁专业版</div>
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
          <div class="vipSection">
            <div class="sectionTitle">
              <span>选择套餐</span>
              <span class="desc">(价格锁定12个月)</span>
            </div>
            <div class="vipList">
              <div class="vipItem" :class="{ active: selectedVip === item.id, recommend: item.recommend }"
                v-for="item in vipPrices" :key="item.id" @click="selectedVip = item.id">
                <div class="recommendTag" v-if="item.recommend">推荐</div>
                <div class="vipBadge">{{ item.title }}</div>
                <div class="vipPrice">
                  <span class="currency">¥</span>
                  <span class="amount">{{ item.price }}</span>
                  <span class="unit">/{{ item.priceUnit }}</span>
                </div>
                <div class="vipDesc">尊享<span class="number">{{ item.date }}</span>天专业版权益</div>
                <div class="vipGiveMoney">
                  <img src="money.png" />
                  <div>包含<span class="number">{{ item.giveMoney }}</span>金币</div>
                </div>
                <div class="checkMark" v-if="selectedVip === item.id">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="vipSection">
            <div class="sectionTitle">专业版权益</div>
            <div>
              <vip-benefits />
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
                <div class="payName"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
<script setup lang="ts">
import { Store } from '@/store';
import message from '@/utils/message';
import request from '@/utils/request';
import { onMounted, onUnmounted, ref } from 'vue'
import { useStore } from 'vuex';
import VipBenefits from './VipBenefits.vue';

const store = useStore<Store>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'paySuccess'): void
}>()

const vipPrices = ref<Array<{
  id: string,
  title: string,
  date: number,
  price: number,
  giveMoney: number,
  priceUnit: string,
  recommend?: true,
}>>([])

onMounted(async () => {
  request.get('https://api.studying1v1.com/video/vipTypeList').then(res => {
    if (res.data) {
      vipPrices.value = res.data;
      console.log('sssssss', vipPrices)
      let isFindRecommend = false;
      Object.keys(res.data).forEach(key => {
        if (res.data[key].recommend) {
          selectedVip.value = key
          isFindRecommend = true;
        }
      })
      if (!isFindRecommend) {
        selectedVip.value = Object.keys(res.data)[0];
      }
    }
  })
})

const selectedVip = ref<string>('yearly')
const selectedPay = ref<'alipay' | 'wechat'>('alipay')
const orderId = ref<number | null>(null)
const checkStatus = ref<'idle' | 'checking' | 'unpaid'>('idle')

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
    console.log('checkVipPaymentStatus data', data)

    if (data && data.status && data.isPay) {
      message.success('专业版权益购买成功！')
      emit('paySuccess')
    } else {
      checkStatus.value = 'unpaid'
    }
  } catch (error: any) {
    console.error('checkVipPaymentStatus error', error)
    checkStatus.value = 'unpaid'
  }
}

const handlePay = async (payType: 'alipay' | 'wechat') => {
  const userInfo = store.state.main.userInfo
  if (userInfo && userInfo.id) {
    if (payType === 'alipay') {
      const res = await request.get('https://api.studying1v1.com/video/alipay/createVipOrder?uid=' + userInfo.id + '&vipType=' + selectedVip.value)
      if (res.data) {
        orderId.value = res.data as number;
        console.log('vip orderId', orderId.value)
        window.open('https://api.studying1v1.com/video/alipay/pay?orderId=' + orderId.value, '_blank')
        checkStatus.value = 'checking'
      }
    }
  }
}

onUnmounted(() => {
  window.removeEventListener('focus', handleFocus)
})

window.addEventListener('focus', handleFocus)
</script>
<style scoped lang="less">
.showVipModal {
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

  .showVipModalInner {
    width: 500px;
    background: white;
    border-radius: 12px;
    padding: 24px;
    position: relative;
    margin-top: 20px;

    .title {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #e6c06b 0%, #d4a74a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .sectionTitle {
      font-size: 16px;
      color: #666;
      margin-bottom: 12px;

      .desc {
        margin-left: 12px;
        color: #666;
        font-size: 14px;
      }
    }

    .vipSection {
      margin-bottom: 24px;

      .vipList {
        display: flex;
        gap: 12px;

        .vipItem {
          flex: 1;
          padding: 16px 12px;
          border: 2px solid #eee;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;

          &.recommend {
            background: linear-gradient(135deg, #fff8e6 0%, #fff0cc 100%);
            border-color: #fff1c4;

            .recommendTag {
              position: absolute;
              top: -10px;
              right: -6px;
              background: linear-gradient(135deg, #ff9a3c 0%, #ff7e1f 100%);
              color: white;
              font-size: 10px;
              padding: 2px 8px;
              border-radius: 10px;
              font-weight: bold;
            }
          }

          .vipBadge {
            font-size: 14px;
            font-weight: bold;
            color: #999;
            margin-bottom: 8px;
          }

          .vipPrice {
            display: flex;
            align-items: baseline;
            margin-bottom: 6px;

            .currency {
              font-size: 14px;
              color: #e63946;
              font-weight: bold;
            }

            .amount {
              font-size: 32px;
              color: #e63946;
              font-weight: bold;
              line-height: 1;
            }

            .unit {
              font-size: 12px;
              color: #999;
              margin-left: 2px;
            }
          }

          .vipDesc {
            font-size: 14px;
            color: #666;
            margin-bottom: 4px;

            .number {
              font-size: 16px;
              color: #e63946;
              margin: 0 4px;
              font-weight: bold;
            }
          }

          .vipGiveMoney {
            font-size: 14px;
            color: #666;
            display: flex;
            align-items: center;
            margin-top: 6px;

            >img {
              margin-right: 4px;
              width: 18px;
            }

            .number {
              font-size: 16px;
              color: #e63946;
              margin: 0 4px;
              font-weight: bold;
            }
          }

          .vipSave {
            font-size: 10px;
            color: #ff7e1f;
            background: #fff0e6;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 4px;
          }

          .checkMark {
            position: absolute;
            top: 6px;
            left: 6px;
            width: 20px;
            height: 20px;
            color: #1677ff;
          }

          &:hover {
            border-color: #e6c06b;
            transform: translateY(-2px);
          }

          &.active {
            border-color: #d4a74a;
            background: linear-gradient(135deg, #fff8e6 0%, #ffecc0 100%);
            box-shadow: 0 4px 12px rgba(212, 167, 74, 0.2);

            .vipBadge {
              color: #d4a74a;
            }
          }
        }
      }
    }

    .paySection {
      margin-bottom: 8px;

      .payList {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .payItem {
          display: flex;
          align-items: center;
          padding: 14px 16px;
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
            width: 36px;
            height: 36px;
            border-radius: 8px;
            margin-right: 12px;

            >img {
              height: 36px;
              object-fit: cover;
            }
          }

          .payName {
            flex: 1;
            font-size: 15px;
            color: #333;
            font-weight: 500;
          }
        }
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
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

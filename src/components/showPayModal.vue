<template>
  <teleport to="#teleport">
    <div class="showPayModal" @click.self="closeModal">
      <div class="showPayModalInner">
        <div class="title">充值</div>
        <div class="amountSection">
          <div class="sectionTitle">选择金额</div>
          <div class="amountList">
            <div v-for="amount in amounts" :key="amount" class="amountItem"
              :class="{ active: selectedAmount === amount }" @click="selectedAmount = amount">
              ¥{{ amount }}
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
              <!-- <span class="payName">支付宝</span> -->
              <!-- <div class="checkIcon" v-if="selectedPay === 'alipay'"></div> -->
            </div>
            <!-- <div
              class="payItem"
              :class="{ active: selectedPay === 'wechat' }"
              @click="selectedPay = 'wechat'"
            >
              <div class="payIcon wechat"></div>
              <span class="payName">微信支付</span>
              <div class="checkIcon" v-if="selectedPay === 'wechat'"></div>
            </div> -->
          </div>
        </div>
        <!-- <button class="payButton" @click="handlePay">确认支付</button> -->
      </div>
    </div>
  </teleport>
</template>
<script setup lang="ts">
import { Store } from '@/store';
import { ref } from 'vue'
import { useStore } from 'vuex';

const store = useStore<Store>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'pay', amount: number, payType: 'alipay' | 'wechat'): void
}>()

const amounts = [10, 50, 100, 200]
const selectedAmount = ref(50)
const selectedPay = ref<'alipay' | 'wechat'>('wechat')

const closeModal = () => {
  emit('close')
}

const handlePay = (payType: 'alipay' | 'wechat') => {
  const userInfo = store.state.main.userInfo
  console.log('userInfo', userInfo)
  if (userInfo && userInfo.id) {
    if (payType === 'alipay') {
      window.open('https://api.studying1v1.com/video/alipay/pay?uid=' + userInfo.id + '&price=' + selectedAmount.value, '_blank')
    } else if (payType === 'wechat') {
      // window.open('https://api.studying1v1.com/wechat/pay', '_blank')
    }
  }
}
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

    .title {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 24px;
    }

    .sectionTitle {
      font-size: 14px;
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
          width: calc(25% - 9px);
          padding: 12px 0;
          text-align: center;
          border: 2px solid #eee;
          border-radius: 8px;
          font-size: 16px;
          color: #333;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            border-color: #1677ff;
            color: #1677ff;
          }

          &.active {
            border-color: #1677ff;
            background-color: #e6f4ff;
            color: #1677ff;
            font-weight: bold;
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
  }
}
</style>
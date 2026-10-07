<template>
  <teleport to="#teleport">
    <div class="community-modal-overlay" @click.self="closeModal">
      <div class="community-modal">
        <button type="button" class="community-modal-close" @click="closeModal">×</button>
        <div class="community-modal-layout">
          <div class="community-modal-content">
            <div class="community-modal-icon">
              <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="2.6" stroke="#635BFF" stroke-width="1.3"></circle>
                <circle cx="14.2" cy="8.2" r="2.1" stroke="#635BFF" stroke-width="1.2" opacity="0.72"></circle>
                <path d="M2.8 15.8c.35-3 2-4.5 4.3-4.5 2.4 0 4.05 1.5 4.4 4.5M11.2 12.2c.8-.7 1.75-1.05 2.9-1.05 1.8 0 3.05 1.1 3.35 3.25" stroke="#635BFF" stroke-width="1.3" stroke-linecap="round"></path>
              </svg>
            </div>
            <h2 class="community-modal-title">
              <span v-for="(line, i) in titleLines" :key="i">{{ line }}<br v-if="i < titleLines.length - 1" /></span>
            </h2>
            <p class="community-modal-desc">{{ t('community.desc') }}</p>
            <div class="community-modal-benefits">
              <div>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M2 6.5l3 3 6-6" stroke="#635BFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                <span>{{ t('community.benefit1') }}</span>
              </div>
              <div>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M2 6.5l3 3 6-6" stroke="#635BFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                <span>{{ t('community.benefit2') }}</span>
              </div>
              <div>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M2 6.5l3 3 6-6" stroke="#635BFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                <span>{{ t('community.benefit3') }}</span>
              </div>
              <div>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M2 6.5l3 3 6-6" stroke="#635BFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                <span>{{ t('community.benefit4') }}</span>
              </div>
            </div>
            <div class="community-modal-reward">
              <span class="reward-value">{{ t('community.reward') }}</span>
              <span class="reward-desc">{{ t('community.rewardDesc') }}</span>
            </div>
          </div>
          <div class="community-modal-qr">
            <div class="community-modal-qr-title">{{ t('community.qrTitle') }}</div>
            <div class="community-qr">
              <img v-if="qrUrl" :src="qrUrl" alt="Community QR Code" />
            </div>
            <div class="community-modal-qr-footer">
              <span v-for="(line, i) in qrFooterLines" :key="i">{{ line }}<br v-if="i < qrFooterLines.length - 1" /></span>
            </div>
            <button type="button" class="community-modal-later" @click="closeModal">{{ t('community.later') }}</button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import axios from 'axios'
import { t } from '@/i18n'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const qrUrl = ref('')

// Split multiline i18n strings
const titleLines = computed(() => t('community.title').split('\n'))
const qrFooterLines = computed(() => t('community.qrFooter').split('\n'))

onMounted(async () => {
  try {
    const { data } = await axios.get('https://api.studying1v1.com/globleConfigSingle?key=sypGroup')
    qrUrl.value = data
  } catch (e) {
    console.error('Failed to load community QR code:', e)
  }
})

const closeModal = () => {
  emit('close')
}
</script>

<style scoped lang="less">
.community-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 10, 0.4);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.community-modal {
  position: relative;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 24px 60px;
  max-width: 680px;
  width: calc(100% - 48px);
}

.community-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  width: 26px;
  height: 26px;
  background: #f7f7f5;
  border: 1px solid #e8e8e5;
  border-radius: 3px;
  color: #686b70;
  cursor: pointer;
  font-family: inherit;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: #17181a;
    background: #eeeeec;
  }
}

.community-modal-layout {
  display: grid;
  grid-template-columns: minmax(0px, 1fr) 244px;
  gap: 30px;
  padding: 30px 32px;
}

.community-modal-icon {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: rgba(99, 91, 255, 0.09);
  border: 1px solid rgba(99, 91, 255, 0.26);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.community-modal-title {
  font-size: 21px;
  font-weight: 700;
  color: #17181a;
  margin: 0 0 8px;
  letter-spacing: -0.025em;
  line-height: 1.25;
}

.community-modal-desc {
  font-size: 12px;
  color: #686b70;
  margin: 0 0 17px;
  line-height: 1.65;
}

.community-modal-benefits {
  border-top: 1px solid #e8e8e5;

  > div {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 6px 0;
    border-bottom: 1px solid #e8e8e5;
    font-size: 11px;
    color: #17181a;

    svg {
      flex-shrink: 0;
    }
  }
}

.community-modal-reward {
  margin-top: 16px;
  padding: 10px 12px;
  background: rgba(99, 91, 255, 0.09);
  border: 1px solid rgba(99, 91, 255, 0.26);
  border-radius: 4px;

  .reward-value {
    font-size: 12px;
    font-weight: 600;
    color: #635BFF;
  }

  .reward-desc {
    font-size: 11px;
    color: #686b70;
  }
}

.community-modal-qr {
  border-left: 1px solid #e8e8e5;
  padding-left: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.community-modal-qr-title {
  font-size: 12px;
  font-weight: 600;
  color: #17181a;
  margin-bottom: 10px;
}

.community-qr {
  width: 208px;
  height: 208px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #d8d8d5;
  border-radius: 5px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.community-modal-qr-footer {
  font-size: 10px;
  color: #9a9da2;
  line-height: 1.5;
  text-align: center;
  margin-top: 9px;
}

.community-modal-later {
  margin-top: 15px;
  background: none;
  border: none;
  color: #9a9da2;
  font-size: 10px;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: #686b70;
  }
}

@media (max-width: 640px) {
  .community-modal-layout {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 24px;
  }

  .community-modal-qr {
    border-left: none;
    border-top: 1px solid #e8e8e5;
    padding-left: 0;
    padding-top: 24px;
  }
}
</style>

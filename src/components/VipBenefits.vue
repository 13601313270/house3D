<template>
  <div class="vip-benefits">
    <!-- 表头 -->
    <div class="benefit-header">
      <div class="benefit-name">权益</div>

      <div class="benefit-plan normal-plan">
        <div class="plan-title">基础版</div>
      </div>

      <div class="benefit-plan vip-plan">
        <div class="vip-badge">Pro</div>
        <div class="plan-title">专业版</div>
      </div>
    </div>

    <!-- 权益列表 -->
    <div v-for="item in benefits" :key="item.name" class="benefit-row">
      <!-- 权益名称 -->
      <div class="benefit-name">
        <span class="benefit-title">{{ item.name }}</span>
        <span v-if="item.description" class="benefit-description">
          {{ item.description }}
        </span>
      </div>

      <!-- 非VIP -->
      <div class="benefit-value normal-value">
        <template v-if="item.normal">
          {{ item.normal }}
        </template>
        <span v-else class="disabled">—</span>
      </div>

      <!-- VIP -->
      <div class="benefit-value vip-value">
        <span class="check">✓</span>
        <span>{{ item.vip }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const benefits = [
  // {
  //   name: '云存储空间',
  //   normal: '5G',
  //   vip: '100G',
  // },
  {
    name: '赠送金币',
    normal: '0',
    vip: '金币赠送',
  },
  {
    name: '动画编辑与时间轴功能',
    normal: '不支持',
    vip: '支持',
  },
  {
    name: '云存储空间',
    normal: '300MB',
    vip: '50GB',
  }
  // {
  //   name: '新功能优先体验',
  //   normal: '无',
  //   vip: '有',
  // },
  // {
  //   name: '高清图片导出',
  //   normal: '普通画质',
  //   vip: '高清',
  // },
  // {
  //   name: '去除图片水印',
  //   normal: '',
  //   vip: '支持',
  // },
]
</script>

<style scoped>
.vip-benefits {
  width: 100%;
  overflow: hidden;

  border: 1px solid #eeeeee;
  border-radius: 14px;
  background: #ffffff;

  color: #333333;
  font-size: 14px;
}

/* =========================
   表头
========================= */

.benefit-header {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;

  min-height: 64px;

  background: #fafafa;
  border-bottom: 1px solid #eeeeee;
}

.benefit-header>div {
  display: flex;
  align-items: center;
  justify-content: center;
}

.benefit-header .benefit-name {
  justify-content: flex-start;
  padding-left: 22px;

  font-size: 15px;
  font-weight: 600;
}

.benefit-plan {
  position: relative;
}

.normal-plan {
  color: #777777;
}

.vip-plan {
  background: linear-gradient(180deg,
      #fffaf0 0%,
      #fff6df 100%);

  color: #d99a24;
}

.plan-title {
  font-size: 15px;
  font-weight: 600;
}

.vip-badge {
  position: absolute;
  top: 7px;
  right: 8px;

  padding: 2px 7px;

  border-radius: 8px;

  background: #f4b740;
  color: #ffffff;

  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
}

/* =========================
   内容行
========================= */

.benefit-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;

  min-height: 58px;

  border-bottom: 1px solid #f0f0f0;
}

.benefit-row:last-child {
  border-bottom: none;
}

.benefit-row>div {
  display: flex;
  align-items: center;
  justify-content: center;
}

.benefit-row .benefit-name {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;

  padding: 10px 12px 10px 22px;
}

.benefit-title {
  color: #444444;
  font-size: 14px;
  font-weight: 500;
}

.benefit-description {
  margin-top: 2px;

  color: #999999;
  font-size: 11px;
}

.normal-value {
  color: #777777;
}

.vip-value {
  background: #fffaf0;

  color: #d99520;
  font-weight: 600;
}

.disabled {
  color: #cccccc;
  font-size: 18px;
  font-weight: 400;
}

.check {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 18px;
  height: 18px;

  margin-right: 5px;

  border-radius: 50%;

  background: #f4b740;
  color: #ffffff;

  font-size: 11px;
  font-weight: 700;
}

/* =========================
   VIP 列整体强调
========================= */

.benefit-header .vip-plan,
.benefit-row .vip-value {
  border-left: 1px solid #f7e8c2;
}

.benefit-header .normal-plan {
  border-left: 1px solid #eeeeee;
}

/* =========================
   移动端
========================= */

@media (max-width: 600px) {
  .vip-benefits {
    border-radius: 12px;
    font-size: 13px;
  }

  .benefit-header,
  .benefit-row {
    grid-template-columns: 1.3fr 0.9fr 1fr;
  }

  .benefit-header .benefit-name,
  .benefit-row .benefit-name {
    padding-left: 14px;
  }

  .benefit-title {
    font-size: 13px;
  }

  .benefit-value {
    font-size: 12px;
  }

  .benefit-row {
    min-height: 54px;
  }
}
</style>
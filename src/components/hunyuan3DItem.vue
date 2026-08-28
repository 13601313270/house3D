<template>
    <div>
        <img v-if="PreviewImageUrl" :src="PreviewImageUrl" style="height: 100px;" />
        <a v-if="Url" :href="Url" target="_blank" class="download-btn" download>
            下载模型
        </a>
        <a v-if="Url" :href="Url" target="_blank" class="download-btn" download>
            使用模型
        </a>
    </div>
</template>
<script setup lang="ts">
const props = defineProps<{
    PreviewImageUrl: string,
    Type: string,
    Url: string,
}>()
</script>
<style lang="less">
.download-btn {
    display: inline-block;
    padding: 8px 16px;
    background: #52c41a;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;

    &:hover {
        opacity: 0.9;
    }
}
</style>
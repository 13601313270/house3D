<template>
    <div>
        -----
        <div>{{ PreviewImageUrl }}</div>
        <div>{{ Type }}</div>
        <div>{{ Url }}</div>

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
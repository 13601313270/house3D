<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>
    <div class="nav-links">
      <router-link to="/map2d">2D户型图绘制工具</router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import HelloWorld from '@/components/HelloWorld.vue' // @ is an alias to /src

export default defineComponent({
  name: 'HomeView',
  components: {
    HelloWorld
  }
})
</script>

<style scoped>
.nav-links {
  margin-top: 20px;
}

.nav-links a {
  display: inline-block;
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin: 10px;
}

.nav-links a:hover {
  background: #40a9ff;
}
</style>
